"use client";

import { useState } from "react";
import { User, Mail, Phone, Edit2, Check, X } from "lucide-react";
import { updateEndpointOwner } from "@/app/actions/owner";
import { motion, AnimatePresence } from "framer-motion";

interface OwnerBadgeProps {
    endpointId: string;
    ownerName?: string | null;
    ownerContact?: string | null;
    compact?: boolean;
    editable?: boolean;
    onUpdate?: () => void;
}

export function OwnerBadge({
    endpointId,
    ownerName,
    ownerContact,
    compact = false,
    editable = true,
    onUpdate
}: OwnerBadgeProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(ownerName || "");
    const [contact, setContact] = useState(ownerContact || "");
    const [saving, setSaving] = useState(false);

    const hasOwner = ownerName || ownerContact;

    const handleSave = async () => {
        setSaving(true);
        try {
            await updateEndpointOwner(endpointId, name, contact);
            setIsEditing(false);
            onUpdate?.();
        } catch (error) {
            console.error("Failed to update owner:", error);
        }
        setSaving(false);
    };

    if (compact) {
        return (
            <div className="flex items-center gap-1.5 text-[10px]">
                <User className="w-3 h-3 text-muted-foreground" />
                <span className={`${hasOwner ? 'text-foreground' : 'text-muted-foreground italic'}`}>
                    {ownerName || '담당자 미지정'}
                </span>
            </div>
        );
    }

    return (
        <div className="relative">
            <AnimatePresence mode="wait">
                {isEditing ? (
                    <motion.div
                        key="editing"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="p-4 bg-card rounded-xl border border-primary/30 space-y-3"
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="text-xs font-bold">담당자 정보 수정</span>
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <User className="w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="담당자 이름"
                                    className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                <input
                                    type="text"
                                    value={contact}
                                    onChange={(e) => setContact(e.target.value)}
                                    placeholder="연락처 (이메일, 슬랙 등)"
                                    className="flex-1 px-3 py-1.5 text-xs bg-background border border-border rounded-lg focus:outline-none focus:border-primary"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 flex items-center gap-1"
                            >
                                <Check className="w-3.5 h-3.5" />
                                {saving ? '저장 중...' : '저장'}
                            </button>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="display"
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className={`
                            p-3 rounded-xl border transition-all group/owner
                            ${hasOwner ? 'bg-blue-500/5 border-blue-500/20' : 'bg-muted/30 border-dashed border-border'}
                        `}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-8 h-8 rounded-lg flex items-center justify-center
                                    ${hasOwner ? 'bg-blue-500/10 text-blue-500' : 'bg-muted text-muted-foreground'}
                                `}>
                                    <User className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className={`text-sm font-semibold ${hasOwner ? '' : 'text-muted-foreground italic'}`}>
                                        {ownerName || '담당자 미지정'}
                                    </p>
                                    {ownerContact && (
                                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <Mail className="w-3 h-3" />
                                            {ownerContact}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {editable && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="p-1.5 text-muted-foreground hover:text-primary opacity-0 group-hover/owner:opacity-100 transition-all rounded-lg hover:bg-primary/10"
                                >
                                    <Edit2 className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
