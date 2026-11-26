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
        // Note: AdminLayout performs secondary server-side check against live user metadata / admin email.
        // If session claim already says ADMIN, allow immediately; otherwise allow AdminLayout to perform authoritative verification.
        if (role && role !== 'ADMIN' && role !== 'admin') {
            // Check if claim email exists in session
            const email = claims?.email || claims?.primaryEmail;
            if (email !== 'handyharz@gmail.com' && email !== 'admin@renthub.ng') {
                // Allow pass-through to AdminLayout which has full clerkClient access
            }
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
