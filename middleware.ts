import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware();

export const config = {
  matcher: [
    // Allow all routes, including catch-all routes for Clerk
    '/(.*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
