import { AdminGuard } from "@/components/admin/AdminGuard";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const metadata = {
    title: "Admin — RentHub",
    description: "RentHub admin portal for verifications, disputes, and user management.",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AdminGuard>
            <div className="flex min-h-screen bg-[var(--bg-primary)]">
                <AdminSidebar />
                <div className="flex flex-1 flex-col min-w-0">{children}</div>
            </div>
        </AdminGuard>
    );
}
