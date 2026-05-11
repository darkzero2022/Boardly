import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authenticateLdap, isLdapEnabled } from "@/lib/auth/ldap";

export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
  // Fetch global config from DB to determine which providers are enabled
  const config = await prisma.globalNotifConfig.findUnique({
    where: { id: "global" },
  });

  const allowSSO = config?.allowMicrosoftSSO ?? true;
  const allowCreds = config?.allowCredentials ?? true;

  const providers = [];

  // ── Microsoft Entra ID (Azure AD SSO) ───────────────────────────────────────
  if (allowSSO && process.env.AZURE_AD_CLIENT_ID) {
    providers.push(
      MicrosoftEntraID({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      })
    );
  }

  // ── Local credentials ────────────────────────────────────────────────────────
  if (allowCreds) {
    providers.push(
      Credentials({
        id: "credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const parsed = z
            .object({ email: z.string().email(), password: z.string().min(6) })
            .safeParse(credentials);

          if (!parsed.success) return null;

          const user = await prisma.user.findUnique({
            where: { email: parsed.data.email },
          });

          if (!user || !user.passwordHash) return null;

          const valid = await bcrypt.compare(
            parsed.data.password,
            user.passwordHash
          );
          if (!valid) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            role: user.role,
          };
        },
      })
    );
  }

  // ── LDAP / Active Directory ──────────────────────────────────────────────────
  if (isLdapEnabled()) {
    providers.push(
      Credentials({
        id: "ldap",
        credentials: {
          username: { label: "Username", type: "text" },
          password: { label: "Password", type: "password" },
        },
        async authorize(credentials) {
          const parsed = z
            .object({ username: z.string().min(1), password: z.string().min(1) })
            .safeParse(credentials);

          if (!parsed.success) return null;

          // Authenticate against the LDAP server
          const ldapUser = await authenticateLdap(
            parsed.data.username,
            parsed.data.password
          );
          if (!ldapUser) return null;

          // Auto-provision: find or create the user in the local DB
          let dbUser = await prisma.user.findUnique({
            where: { email: ldapUser.email },
          });

          if (!dbUser) {
            // First LDAP login — create the user (no password hash; LDAP-only)
            dbUser = await prisma.user.create({
              data: {
                email: ldapUser.email,
                name: ldapUser.displayName,
                role: "MEMBER",
                // passwordHash intentionally null — can only login via LDAP
              },
            });
            console.log(`[LDAP] Auto-provisioned new user: ${ldapUser.email}`);
          } else {
            // Update display name if it changed in the directory
            if (dbUser.name !== ldapUser.displayName) {
              await prisma.user.update({
                where: { id: dbUser.id },
                data: { name: ldapUser.displayName },
              });
            }
          }

          return {
            id: dbUser.id,
            name: ldapUser.displayName,
            email: ldapUser.email,
            image: dbUser.image,
            role: dbUser.role,
          };
        },
      })
    );
  }

  return {
    adapter: PrismaAdapter(prisma),
    providers,
    session: { strategy: "jwt" as const },
    callbacks: {
      async jwt({ token, user }) {
        if (user) {
          token.id = user.id;
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id! },
            select: { role: true, teamId: true },
          });
          token.role = dbUser?.role ?? undefined;
          token.teamId = dbUser?.teamId ?? undefined;
          // Record the actual login timestamp
          await prisma.user.update({
            where: { id: user.id! },
            data: { lastLoginAt: new Date() },
          });
        }
        return token;
      },
      async session({ session, token }) {
        if (session.user) {
          session.user.id = token.id as string;
          session.user.role = token.role as string;
          session.user.teamId = token.teamId as string | undefined;
        }
        return session;
      },
    },
    pages: {
      signIn: "/login",
      error: "/login",
    },
  };
});
