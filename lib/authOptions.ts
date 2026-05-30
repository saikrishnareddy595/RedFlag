import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { verifyCredentials } from "./users";

const googleEnabled = Boolean(
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    // Google is only registered when credentials are configured, so the app
    // runs fine before you add them.
    ...(googleEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID as string,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
          }),
        ]
      : []),
    CredentialsProvider({
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = verifyCredentials(credentials.email, credentials.password);
        if (!user) return null;
        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) session.user.id = token.id;
      return session;
    },
  },
  // NextAuth requires a secret in production to sign session tokens. Prefer the
  // NEXTAUTH_SECRET env var; the fallback below keeps the demo working on Vercel
  // without extra setup. IMPORTANT: set a real NEXTAUTH_SECRET in production so
  // sessions can't be forged.
  secret:
    process.env.NEXTAUTH_SECRET ||
    "redflag-demo-fallback-secret-please-override-in-production-7f3a9c1e",
};

export const isGoogleEnabled = googleEnabled;
