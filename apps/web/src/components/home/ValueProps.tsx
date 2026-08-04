import { Wallet, ShieldCheck, Lock } from "lucide-react";

const VALUE_PROPS = [
    {
        icon: Wallet,
        color: "text-[var(--color-brand-orange)]",
        bg: "bg-[var(--color-brand-orange)]/10",
        title: "Zero Agent Fees",
        description: "Save up to ₦600k on your next rent. We charge a flat, transparent platform fee—fraction of what agents take."
    },
    {
        icon: ShieldCheck,
        color: "text-[var(--color-brand-green)]",
        bg: "bg-[var(--color-brand-green)]/10",
        title: "Verified Properties",
        description: "Every property is physically verified by our team. No scams, no fake photos, no wasted time."
    },
    {
        icon: Lock,
        color: "text-[var(--color-brand-orange)]",
        bg: "bg-[var(--color-brand-orange)]/10",
        title: "Secure Payments",
        description: "Pay rent securely through our escrow system. Landlords get paid only when you move in safely."
    }
];

export function ValueProps() {
    return (
        <section className="py-16 md:py-20 bg-[var(--bg-secondary)]">
            <div className="container-wide">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 text-center">
                    {VALUE_PROPS.map((prop, index) => (
                        <div key={index} className="bg-[var(--bg-card)] p-6 md:p-8 rounded-2xl shadow-[var(--shadow-sm)] border border-[var(--border-color)]">
                            <div className={`w-14 h-14 md:w-16 md:h-16 ${prop.bg} rounded-full flex items-center justify-center mx-auto mb-5 md:mb-6 ${prop.color}`}>
                                <prop.icon className="h-7 w-7 md:h-8 md:w-8" />
                            </div>
                            <h3 className="text-lg md:text-xl font-bold mb-3 text-[var(--text-primary)]">{prop.title}</h3>
                            <p className="text-[var(--text-secondary)] text-sm md:text-base">
                                {prop.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
