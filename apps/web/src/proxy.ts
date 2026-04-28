import { auth } from "@/lib/auth";

export const proxy = auth;

export const config = {
  matcher: [
    "/",
    "/resumes/:path*",
    "/jobs/:path*",
    "/applications/:path*",
    "/job-scanner/:path*",
    "/settings/:path*",
    "/profiles/:path*",
  ],
};
