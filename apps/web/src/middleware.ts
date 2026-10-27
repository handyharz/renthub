import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isAdminRoute = createRouteMatcher(['/admin(.*)'])
const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/properties/new(.*)',
    '/onboarding(.*)',
    // /auth/redirect is intentionally excluded — it handles its own auth state
])

export default clerkMiddleware(async (auth, req) => {
    if (isAdminRoute(req)) {
        const { userId, sessionClaims } = await auth()
        if (!userId) {
            await auth.protect()
            return
        }
        const claims = sessionClaims as any
        const role = claims?.publicMetadata?.role || claims?.metadata?.role || claims?.role
        if (role && role !== 'ADMIN' && role !== 'admin') {
            const redirectUrl = new URL('/dashboard', req.url)
            return Response.redirect(redirectUrl)
        }
    } else if (isProtectedRoute(req)) {
        await auth.protect()
    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}
