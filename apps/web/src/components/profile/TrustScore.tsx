import { ShieldCheck } from "lucide-react";

interface TrustScoreProps {
    user: {
        avatar?: string | null;
        firstName?: string | null;
        lastName?: string | null;
        phone?: string | null;
        phoneVerified?: boolean;
        idDocumentUrl?: string | null;
        verified?: boolean;
    };
    className?: string;
}

export function TrustScore({ user, className }: TrustScoreProps) {
    const calculateScore = () => {
        let score = 10; // Base score for signing up
        if (user.avatar) score += 10;
        if (user.phone) score += 20;
        if (user.phoneVerified) score += 20;
        if (user.idDocumentUrl) score += 40; // Government ID is the biggest trust factor
        return Math.min(score, 100);
    };

    const score = calculateScore();
    const getLevel = () => {
        if (score < 40) return { label: "Low Trust", color: "text-red-500", bg: "bg-red-500" };
        if (score < 70) return { label: "Medium Trust", color: "text-yellow-500", bg: "bg-yellow-500" };
        return { label: "Trusted Tenant", color: "text-green-500", bg: "bg-green-500" };
    };

    const level = getLevel();

    return (
        <div className={`bg-white p-6 rounded-xl border border-gray-100 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                    <h3 className="font-bold text-gray-900">Trust Score</h3>
                    {user.verified && user.idDocumentUrl && (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100 mt-1 w-fit">
                            <ShieldCheck className="h-3 w-3" />
                            VERIFIED TENANT
                        </div>
                    )}
                </div>
                <span className={`text-sm font-bold ${level.color}`}>{level.label}</span>
            </div>

            <div className="flex items-center gap-4 mb-4">
                <div className="relative h-16 w-16 flex items-center justify-center">
                    <svg className="absolute top-0 left-0 w-full h-full transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-gray-100" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent"
                            className={level.color}
                            strokeDasharray={175.9}
                            strokeDashoffset={175.9 - (175.9 * score) / 100}
                        />
                    </svg>
                    <span className={`text-xl font-bold ${level.color}`}>{score}%</span>
                </div>
                <div className="flex-1">
                    <p className="text-sm text-gray-600 mb-1">Increase your score to unlock messaging and viewing requests.</p>
                </div>
            </div>
        </div>
    );
}


