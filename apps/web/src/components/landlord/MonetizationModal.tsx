import React, { useState } from 'react';
import { RevenueCard } from './RevenueCard';
import api from '@/lib/api';

interface MonetizationModalProps {
    propertyId: string;
    isOpen: boolean;
    isVerified?: boolean;
    isFeatured?: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const MonetizationModal: React.FC<MonetizationModalProps> = ({
    propertyId,
    isOpen,
    isVerified = false,
    isFeatured = false,
    onClose,
    onSuccess,
}) => {
    const [loadingType, setLoadingType] = useState<'PROPERTY_VERIFICATION' | 'FEATURED_LISTING' | null>(null);

    if (!isOpen) return null;

    const handlePayment = async (type: 'PROPERTY_VERIFICATION' | 'FEATURED_LISTING') => {
        setLoadingType(type);
        try {
            const response = await api.post('/services/pay', { type, propertyId });

            if (response.data.data.authorizationUrl) {
                // Redirect to Paystack
                window.location.href = response.data.data.authorizationUrl;
            } else {
                throw new Error("Authorization URL not received");
            }
        } catch (error: any) {
            console.error('Payment failed', error);
            const message = error.response?.data?.error || error.message || 'Payment initiation failed. Please try again.';
            alert(message);
        } finally {
            setLoadingType(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Boost Your Listing</h2>
                        <p className="text-gray-500">Get verified or featured to find tenants faster.</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                </div>

                <div className="p-8 grid md:grid-cols-2 gap-8">
                    <RevenueCard
                        title="Get Verified"
                        description="Build trust instantly. We visit your property, verify details, and add a trusted badge. Tenants prefer verified properties."
                        price="₦20,000"
                        buttonText={isVerified ? "Already Verified" : (loadingType === 'PROPERTY_VERIFICATION' ? "Processing..." : "Verify Property")}
                        disabled={loadingType !== null || isVerified}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>}
                        onClick={() => handlePayment('PROPERTY_VERIFICATION')}
                    />

                    <RevenueCard
                        title="Feature Listing"
                        description="Skyrocket your visibility. Get pinned to the top of search results and the homepage for 30 days. 3x more views."
                        price="₦50,000"
                        buttonText={isFeatured ? "Already Featured" : (loadingType === 'FEATURED_LISTING' ? "Processing..." : "Feature Property")}
                        disabled={loadingType !== null || isFeatured}
                        isPopular={true}
                        icon={<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>}
                        onClick={() => handlePayment('FEATURED_LISTING')}
                    />
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 text-center text-sm text-gray-500">
                    Secure payment via Paystack. Service fees are non-refundable once service is delivered.
                </div>
            </div>
        </div>
    );
};
