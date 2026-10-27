import { auth } from "@clerk/nextjs/server";
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
    const role = claims?.publicMetadata?.role || claims?.metadata?.role || claims?.role;
    if (role && role !== "ADMIN" && role !== "admin") {
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
