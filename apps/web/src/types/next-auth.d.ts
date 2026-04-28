import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    accessToken: string;
    user: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    accessToken: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken: string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  }
}
