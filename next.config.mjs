/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"],
  },
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "prisma", "ldapjs"],
  },
  // Expose feature flags to the client (login page needs these to show/hide providers)
  env: {
    NEXT_PUBLIC_LDAP_ENABLED: process.env.LDAP_URI ? "true" : "false",
    NEXT_PUBLIC_MS_SSO_ENABLED: process.env.AZURE_AD_CLIENT_ID ? "true" : "false",
  },
};

export default nextConfig;
