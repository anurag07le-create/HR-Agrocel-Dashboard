import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { exchangeCodeForToken, getUserProfile } from '../utils/linkedin';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

const LinkedInCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing'); // processing, success, error
    const [message, setMessage] = useState('Authenticating with LinkedIn...');

    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const error = searchParams.get('error');
        const storedState = localStorage.getItem('linkedin_oauth_state');

        if (error) {
            setStatus('error');
            setMessage(`LinkedIn Error: ${searchParams.get('error_description')}`);
            return;
        }

        if (!code || !state) {
            setStatus('error');
            setMessage('Invalid callback parameters.');
            return;
        }

        if (state !== storedState) {
            setStatus('error');
            setMessage('Security check failed (State mismatch).');
            return;
        }

        const authenticate = async () => {
            try {
                const tokenData = await exchangeCodeForToken(code);
                localStorage.setItem('linkedin_access_token', tokenData.access_token);

                // Fetch user profile to get URN (needed for posting)
                const profile = await getUserProfile(tokenData.access_token);
                localStorage.setItem('linkedin_user_urn', profile.sub); // 'sub' is the URN in OIDC
                localStorage.setItem('linkedin_user_name', profile.name);

                setStatus('success');
                setMessage('Successfully connected to LinkedIn!');

                // Redirect back to JD page after a short delay
                setTimeout(() => {
                    navigate('/jd');
                }, 2000);

            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage('Failed to exchange token. This is likely a CORS issue. Please try using a CORS proxy or extension.');
            }
        };

        authenticate();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl translate-y-1/2"></div>
            </div>

            <div className="glass-card p-8 rounded-2xl border border-[var(--border-color)] flex flex-col items-center max-w-md w-full mx-4 z-10">
                {status === 'processing' && (
                    <>
                        <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-6" />
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Connecting to LinkedIn...</h2>
                        <p className="text-[var(--text-secondary)] text-center">{message}</p>
                    </>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full"></div>
                            <CheckCircle className="w-16 h-16 text-emerald-500 mx-auto relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-4">Connected!</h2>
                        <p className="text-emerald-400 mt-2 text-center">{message}</p>
                        <p className="text-sm text-[var(--text-secondary)] mt-4">Redirecting you back...</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="flex flex-col items-center">
                        <div className="relative">
                            <div className="absolute inset-0 bg-rose-500/20 blur-xl rounded-full"></div>
                            <XCircle className="w-16 h-16 text-rose-500 mx-auto relative z-10" />
                        </div>
                        <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-4">Connection Failed</h2>
                        <p className="text-rose-400 mt-2 text-center">{message}</p>
                        <button
                            onClick={() => navigate('/jd')}
                            className="btn-primary mt-4 w-full bg-[var(--card-bg)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-primary)]"
                        >
                            Return to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LinkedInCallback;
