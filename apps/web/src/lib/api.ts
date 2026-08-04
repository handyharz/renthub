import axios from 'axios';

// Create Axios instance with base configuration
const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add auth token if available (Clerk)
api.interceptors.request.use(
    async (config) => {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, config.data || "");

        try {
            // Get token from Clerk global object (client-side only)
            if (typeof window !== 'undefined') {
                const clerk = (window as any).Clerk;
                if (clerk?.session) {
                    const token = await clerk.session.getToken();
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
            }
        } catch (error) {
            console.error("Error fetching auth token:", error);
        }

        return config;
    },
    (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => {
        console.log(`✅ API Response: ${response.status} ${response.config.url}`);
        return response;
    },
    (error) => {
        const status = error.response?.status;
        const message = error.response?.data?.message || error.message;

        // Don't log 409 Conflict code (expected) as an error
        if (status !== 409) {
            console.error(`❌ API Error [${status}]: ${message}`, error.response?.data || "");
        } else {
            console.log(`ℹ️ API Info [409]: User already exists.`);
        }
        return Promise.reject(error);
    }
);

export default api;
