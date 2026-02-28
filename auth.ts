import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { sanityClientWithToken } from "@/lib/sanity/client";
import { userByEmailQuery } from "@/lib/sanity/queries";

export const { handlers, signIn, signOut, auth } = NextAuth({
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const token = process.env.SANITY_API_WRITE_TOKEN;
        if (!token) return null;

        const user = await sanityClientWithToken.fetch<{
          _id: string;
          email: string;
          hashedPassword: string;
          name?: string | null;
        } | null>(userByEmailQuery, { email });

        if (!user?.hashedPassword) return null;
        const ok = await bcrypt.compare(password, user.hashedPassword);
        if (!ok) return null;

        return {
          id: user._id,
          email: user.email,
          name: user.name ?? null,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});

/** Use this when reading session in pages/actions. Returns null if the session cookie is invalid (e.g. signed with a different AUTH_SECRET). */
export async function getSession() {
  try {
    return await auth();
  } catch (e) {
    if (e instanceof AuthError && (e.type === "JWTSessionError" || e.type === "SessionTokenError")) {
      return null;
    }
    throw e;
  }
}
