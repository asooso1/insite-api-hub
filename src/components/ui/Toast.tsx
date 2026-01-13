'use client';

import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'success') => {
        const id = Math.random().toString(36).substr(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-3">
                <AnimatePresence>
                    {toasts.map((toast) => (
                        <motion.div
                            key={toast.id}
                            initial={{ opacity: 0, x: 20, scale: 0.9 }}
                            animate={{ opacity: 1, x: 0, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                            className={`
                                flex items-center gap-4 px-5 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border
                                ${toast.type === 'success' ? 'bg-green-500/10 border-green-500/30 text-green-500' :
                                    toast.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-500' :
                                        'bg-blue-500/10 border-blue-500/30 text-blue-500'}
                                min-w-[320px] max-w-[450px]
                            `}
                        >
                            <div className="shrink-0">
                                {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
                                    toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> :
                                        <Info className="w-5 h-5" />}
                            </div>
                            <p className="text-sm font-semibold flex-1 leading-relaxed">
                                {toast.message}
                            </p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="shrink-0 opacity-50 hover:opacity-100 transition-opacity"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <motion.div
                                className={`absolute bottom-0 left-0 h-1 bg-current opacity-20`}
                                initial={{ width: "100%" }}
                                animate={{ width: "0%" }}
                                transition={{ duration: 4, ease: "linear" }}
                            />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error("useToast must be used within ToastProvider");
    return context;
}
