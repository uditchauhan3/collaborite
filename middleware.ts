// middleware.ts
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Define your public routes (these won't require authentication)
const isPublicRoute = createRouteMatcher([
  "/",
  "/organization(.*)",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks(.*)",
]);

// Apply the middleware
export default clerkMiddleware((auth, req) => {
  // If the route is public, skip auth protection
  if (isPublicRoute(req)) return;

  // Otherwise, require authentication
  auth().protect();
});

// Clerk Middleware will run only on these paths
export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"], // Exclude static files and _next
};
