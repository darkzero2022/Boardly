import NextAuth from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

export const { handlers, signIn, signOut, auth } = NextAuth(async () => {
  // Fetch global config from DB to determine which providers are enabled
  const config = await prisma.globalNotifConfig.findUnique({
    where: { id: "global" },
  });

  const allowSSO = config?.allowMicrosoftSSO ?? true;
  const allowCreds = config?.allowCredentials ?? true;

  const providers = [];

  if (allowSSO && process.env.AZURE_AD_CLIENT_ID) {
    providers.push(
      MicrosoftEntraID({
        clientId: process.env.AZURE_AD_CLIENT_ID!,
        clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/v2.0`,
      })
    );
  }

  if (allowCreds) {
    providers.push(
      Credentials({
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
