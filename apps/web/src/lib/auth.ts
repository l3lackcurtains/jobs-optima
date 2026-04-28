import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import axios from "axios";
import { API_ENDPOINTS } from "@/lib/api/endpoints";

export const { auth, handlers, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        try {
          const apiUrl =
            process.env.INTERNAL_API_URL || "http://localhost:8888/api";

          const response = await axios.post(
            `${apiUrl}${API_ENDPOINTS.LOGIN}`,
            {
              email: credentials.email,
              password: credentials.password,
            },
            { timeout: 10000 },
          );

          const { user, accessToken } = response.data;

          if (user && accessToken) {
            return {
              id: user._id,
              email: user.email,
              name: `${user.firstName} ${user.lastName}`,
              firstName: user.firstName,
              lastName: user.lastName,
              accessToken,
            };
          }

          return null;
        } catch (error: any) {
          throw new Error(
            error.response?.data?.message || "Invalid credentials",
          );
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.id = user.id;
        token.email = user.email;
        token.firstName = (user as any).firstName;
        token.lastName = (user as any).lastName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.accessToken = token.accessToken as string;
        session.user = {
          ...session.user,
          id: token.id as string,
          email: token.email as string,
          firstName: token.firstName as string,
          lastName: token.lastName as string,
        };
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/login",
    signOut: "/login",
    error: "/login",
  },
});
