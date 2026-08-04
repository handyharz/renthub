import { Inbox } from "@/components/messaging/Inbox";

export const dynamic = "force-dynamic";

export default function MessagesPage() {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <div className="bg-white border-b border-gray-200">
                <div className="container-wide py-8">
                    <h1 className="text-3xl font-bold text-[var(--color-brand-blue)] mb-2">My Messages</h1>
                    <p className="text-gray-600 font-medium">Manage your inquiries and stay in touch with landlords.</p>
                </div>
            </div>

            <div className="container-wide py-8 flex-1">
                <Inbox />
            </div>
        </div>
    );
}
