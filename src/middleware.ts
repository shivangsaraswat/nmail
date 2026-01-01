
import { auth } from "@/auth"

export default auth((req) => {
    const isLoggedIn = !!req.auth
    // Protect all routes by default except public ones
    // For now, let's just log.
    // In a real app, we'd redirect to login.
    // const isProtectedRoute = req.nextUrl.pathname.startsWith("/dashboard")
    // if (isProtectedRoute && !isLoggedIn) {
    //   return Response.redirect(new URL("/api/auth/signin", req.nextUrl.origin))
    // }
})

export const config = {
    matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
