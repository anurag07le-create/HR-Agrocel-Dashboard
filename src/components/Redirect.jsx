import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

const Redirect = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const to = searchParams.get('to') || '/';

    useEffect(() => {
        // Simulate a brief delay or processing time if needed, then redirect
        const timer = setTimeout(() => {
            navigate(to);
        }, 1500);

        return () => clearTimeout(timer);
    }, [navigate, to]);

    return (
        <div className="flex flex-col items-center justify-center h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
            <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
            <h2 className="text-2xl font-bold">Redirecting...</h2>
            <p className="text-[var(--text-secondary)] mt-2">Please wait while we take you to your destination.</p>
        </div>
    );
};

export default Redirect;
