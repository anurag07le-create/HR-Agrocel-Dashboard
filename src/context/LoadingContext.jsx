import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';

const LoadingContext = createContext();

export const useLoading = () => {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error('useLoading must be used within a LoadingProvider');
    }
    return context;
};

const MAX_LOADING_TIME = 120000; // 2 minutes safety timeout

export const LoadingProvider = ({ children }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [loadingTitle, setLoadingTitle] = useState('Processing request');
    const [loadingMessage, setLoadingMessage] = useState('Please wait while we process your action...');
    const [showDismiss, setShowDismiss] = useState(false);
    const timerRef = useRef(null);
    const dismissTimerRef = useRef(null);

    const startLoading = (title = 'Processing request', message = 'Please wait while we process your action...') => {
        setLoadingTitle(title);
        setLoadingMessage(message);
        setIsLoading(true);
        setShowDismiss(false);

        // Show dismiss button after 10 seconds
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = setTimeout(() => setShowDismiss(true), 10000);

        // Auto-dismiss after MAX_LOADING_TIME
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            console.warn('[LoadingContext] Auto-dismissed after timeout');
            setIsLoading(false);
            setShowDismiss(false);
        }, MAX_LOADING_TIME);
    };

    const stopLoading = () => {
        clearTimeout(timerRef.current);
        clearTimeout(dismissTimerRef.current);
        setIsLoading(false);
        setShowDismiss(false);
    };

    // Cleanup timers on unmount
    useEffect(() => {
        return () => {
            clearTimeout(timerRef.current);
            clearTimeout(dismissTimerRef.current);
        };
    }, []);

    return (
        <LoadingContext.Provider value={{ isLoading, startLoading, stopLoading }}>
            {children}

            {isLoading && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-md animate-fade-in">
                    <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl border border-slate-100 flex flex-col items-center text-center space-y-8 animate-scale-in max-w-sm w-full mx-4 relative">
                        {/* Dismiss button - shows after 10s */}
                        {showDismiss && (
                            <button
                                onClick={stopLoading}
                                className="absolute top-6 right-6 p-2 rounded-xl hover:bg-slate-100 text-slate-300 hover:text-slate-600 transition-all"
                                title="Dismiss"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-slate-800 tracking-tight">{loadingTitle}</h3>
                            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] leading-relaxed">
                                {loadingMessage.split('\n').map((line, i) => (
                                    <React.Fragment key={i}>
                                        {line}
                                        {i !== loadingMessage.split('\n').length - 1 && <br />}
                                    </React.Fragment>
                                ))}
                            </p>
                        </div>
                        {/* Dismiss text link - shows after 10s */}
                        {showDismiss && (
                            <button
                                onClick={stopLoading}
                                className="text-[10px] font-bold uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-colors"
                            >
                                Taking too long? Click to dismiss
                            </button>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </LoadingContext.Provider>
    );
};
