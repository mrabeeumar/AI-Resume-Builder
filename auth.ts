import { PrismaAdapter } from "@auth/prisma-adapter";
import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import LinkedIn from "next-auth/providers/linkedin";

import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/request-ip";
import { enforceRateLimit } from "@/lib/rate-limit";
import { loginSchema } from "@/types/auth";
import { verifyCredentials } from "@/services/auth.service";

const LOGIN_RATE_LIMIT = 10;
const LOGIN_RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

// Google/LinkedIn are only wired in once their OAuth credentials are
// configured — omitting them entirely avoids broken sign-in buttons when the
// env vars aren't set yet.
const oauthProviders: Provider[] = [];

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  oauthProviders.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

if (process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET) {
  oauthProviders.push(
    LinkedIn({
      clientId: process.env.LINKEDIN_CLIENT_ID,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    ...oauthProviders,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        await enforceRateLimit(
          `login:${getClientIp(request)}`,
          LOGIN_RATE_LIMIT,
          LOGIN_RATE_LIMIT_WINDOW_SECONDS,
        );

        const parsed = loginSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        return verifyCredentials(parsed.data.email, parsed.data.password);
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    session: async ({ session, token }) => {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
