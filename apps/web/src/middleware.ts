import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/login(.*)",
  "/register(.*)",
]);

const isStudentRoute = createRouteMatcher([
  "/home(.*)",
  "/catalog(.*)",
  "/offer(.*)",
  "/profile(.*)",
  "/wallet(.*)",
  "/my-redemptions(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  if (userId && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  if (!userId && isStudentRoute(req)) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  if (userId && isPublicRoute(req) && req.nextUrl.pathname !== "/") {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
