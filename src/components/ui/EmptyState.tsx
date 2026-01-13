'use client';

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { LucideIcon, Search } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
}

export function EmptyState({ icon: Icon = Search, title, description, action }: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl border-dashed bg-muted/5 border-muted-foreground/20"
        >
            <div className="w-16 h-16 bg-muted/50 rounded-2xl flex items-center justify-center mb-6 shadow-inner">
                <Icon className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-lg font-bold mb-2 text-foreground tracking-tight">
                {title}
            </h3>
            <p className="text-sm text-muted-foreground max-w-[300px] leading-relaxed mb-8">
                {description}
            </p>
            {action && (
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-150">
                    {action}
                </div>
            )}
        </motion.div>
    );
}
