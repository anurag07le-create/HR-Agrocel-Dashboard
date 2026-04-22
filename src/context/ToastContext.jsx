import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.map(t =>
            t.id === id ? { ...t, isExiting: true } : t
        ));

        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, 500); // Wait for animation to finish
    }, []);

    const addToast = useCallback((type, title, message, duration = 2000) => {
        const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        setToasts((prev) => [...prev, { id, type, title, message, isExiting: false }]);

        if (duration) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    const success = useCallback((title, message, duration) => {
        addToast('success', title, message, duration);
    }, [addToast]);

    const error = useCallback((title, message, duration) => {
        addToast('error', title, message, duration);
    }, [addToast]);

    const info = useCallback((title, message, duration) => {
        addToast('info', title, message, duration);
    }, [addToast]);

    return (
        <ToastContext.Provider value={{ success, error, info, addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
                {toasts.slice(-1).map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto w-[320px] md:w-[360px] flex items-start gap-4 p-4 rounded-2xl shadow-xl transform transition-all duration-500 ease-in-out
                            ${toast.isExiting
                                ? 'opacity-0 translate-y-full scale-95'
                                : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-5 fade-in'
                            }
                            ${toast.type === 'success'
                                ? 'bg-[#d1e7dd] text-[#0f5132]'
                                : toast.type === 'info'
                                    ? 'bg-[#cff4fc] text-[#055160]'
                                    : 'bg-[#f8d7da] text-[#842029]'
                            }`}
                        role="alert"
                    >
                        {/* Icon Container */}
                        <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${toast.type === 'success' ? 'bg-[#198754] text-white' : toast.type === 'info' ? 'bg-[#0dcaf0] text-white' : 'bg-[#dc3545] text-white'
                            }`}>
                            {toast.type === 'success' ? (
                                <CheckCircle className="w-5 h-5" strokeWidth={2.5} />
                            ) : toast.type === 'info' ? (
                                <Info className="w-5 h-5" strokeWidth={2.5} />
                            ) : (
                                <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
                            )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pt-0.5 min-w-0">
                            <h3 className="font-bold text-sm leading-tight mb-1 truncate pr-2">{toast.title}</h3>
                            {toast.message && (
                                <p className={`text-xs font-medium leading-relaxed opacity-90 ${toast.type === 'success' ? 'text-[#0f5132]' : toast.type === 'info' ? 'text-[#055160]' : 'text-[#842029]'
                                    }`}>
                                    {toast.message}
                                </p>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            onClick={() => removeToast(toast.id)}
                            className={`shrink-0 p-1 -mt-1 -mr-2 rounded-lg transition-colors opacity-60 hover:opacity-100 ${toast.type === 'success'
                                ? 'hover:bg-[#badbcc] text-[#0f5132]'
                                : toast.type === 'info'
                                    ? 'hover:bg-[#9eeaf9] text-[#055160]'
                                    : 'hover:bg-[#f5c6cb] text-[#842029]'
                                }`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
