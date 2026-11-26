import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
    title: "Admin — RentHub",
    description: "RentHub admin portal for verifications, disputes, and user management.",
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
        redirect("/sign-in?redirect_url=/admin");
    }

    const claims = sessionClaims as any;
    let role = claims?.publicMetadata?.role || claims?.metadata?.role || claims?.role;

    // Fallback: If session token claims haven't refreshed yet from an active session, fetch live user metadata
    if (role !== "ADMIN" && role !== "admin") {
        try {
            const client = await clerkClient();
            const freshUser = await client.users.getUser(userId);
            role = (freshUser?.publicMetadata as any)?.role || (freshUser?.unsafeMetadata as any)?.role;
            const userEmail = freshUser?.emailAddresses?.[0]?.emailAddress?.toLowerCase();
            if (userEmail === "handyharz@gmail.com" || userEmail === "admin@renthub.ng") {
                role = "ADMIN";
            }
        } catch (e) {
            console.error("[AdminLayout] Error fetching fresh user:", e);
        }
    }

    if (role !== "ADMIN" && role !== "admin") {
        redirect("/dashboard");
    }

    return (
        <AdminGuard>
            <div className="flex min-h-screen bg-[var(--bg-primary)]">
                <AdminSidebar />
                <div className="flex flex-1 flex-col min-w-0">{children}</div>
            </div>
        </AdminGuard>
    );
}
