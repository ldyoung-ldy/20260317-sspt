import type { NextAuthConfig } from "next-auth";
import { getRoleForEmail } from "@/lib/access-control";
import { getAuthProviders } from "@/lib/auth-providers";

const authConfig = {
  providers: getAuthProviders(),
  callbacks: {
    async jwt({ token, user }) {
      const email = user?.email ?? token.email;

      if (user?.id) {
        token.sub = user.id;
      }

      token.role = getRoleForEmail(email);

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role === "ADMIN" ? "ADMIN" : "USER";
      }

      return session;
    },
  },
} satisfies NextAuthConfig;

export default authConfig;
