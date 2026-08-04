import React from 'react';

interface RevenueCardProps {
    title: string;
    description: string;
    price: string;
    icon?: React.ReactNode;
    buttonText: string;
    onClick: () => void;
    isPopular?: boolean;
    disabled?: boolean;
}

export const RevenueCard: React.FC<RevenueCardProps> = ({
    title,
    description,
    price,
    icon,
    buttonText,
    onClick,
    isPopular = false,
    disabled = false,
}) => {
    return (
        <div className={`relative p-6 rounded-xl border ${isPopular ? 'border-[var(--color-brand-blue)] bg-blue-50/50' : 'border-gray-200 bg-white'} shadow-sm flex flex-col h-full transition-all hover:shadow-md`}>
            {isPopular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-brand-orange)] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                </span>
            )}

            <div className="flex items-center gap-3 mb-4">
                {icon && <div className={`p-2 rounded-lg ${isPopular ? 'bg-blue-100 text-[var(--color-brand-blue)]' : 'bg-gray-100 text-gray-600'}`}>{icon}</div>}
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>

            <p className="text-gray-600 mb-6 flex-grow">{description}</p>

            <div className="mb-6">
                <span className="text-2xl font-bold text-gray-900">{price}</span>
                {price !== 'Free' && <span className="text-gray-500 text-sm ml-1">/ listing</span>}
            </div>

            <button
                onClick={onClick}
                disabled={disabled}
                className={`w-full py-2.5 px-4 rounded-lg font-bold transition-colors ${isPopular
                    ? 'bg-[var(--color-brand-blue)] text-white hover:bg-[var(--color-brand-blue)]/90'
                    : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {buttonText}
            </button>
        </div>
    );
};
