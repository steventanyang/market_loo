import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          res.cookies.set({
            name,
            value: "",
            ...options,
          });
        },
      },
    }
  );

  // Check and update session
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // For testing route, check if user is admin
  if (req.nextUrl.pathname.startsWith("/testing")) {
    // If no session, redirect to sign in
    if (!session) {
      const redirectUrl = new URL("/sign-in", req.url);
      redirectUrl.searchParams.set("redirect_to", new URL(req.url).pathname);
      return NextResponse.redirect(redirectUrl);
    }

    try {
      // Get user data to check admin status
      const { data: userData, error } = await supabase
        .from("users")
        .select("is_admin")
        .eq("id", session.user.id)
        .single();

      if (error || !userData?.is_admin) {
        // Redirect non-admin users to home
        return NextResponse.redirect(new URL("/", req.url));
      }
    } catch (error) {
      // If there's any error, redirect to home for safety
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  return res;
}

export const config = {
  matcher: [
    // Protected routes that need admin check
    "/testing",
    "/testing/:path*",
    // Add other admin routes here
  ],
};
