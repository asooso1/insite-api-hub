"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Box, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Field {
    name: string;
    type: string;
    description?: string;
    isRequired?: boolean;
    refFields?: Field[]; // Recursive for nested DTOs
}

interface ApiModelTreeProps {
    name: string;
    fields: Field[];
}

export function ApiModelTree({ name, fields }: ApiModelTreeProps) {
    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-slate-50 px-5 py-3.5 border-b border-slate-100 flex items-center gap-2.5">
                <Box className="w-4 h-4 text-blue-600" />
                <span className="font-black text-sm text-slate-800 tracking-tight">{name}</span>
                <span className="ml-auto text-[10px] font-bold text-slate-400 uppercase tracking-wider">{fields.length} fields</span>
            </div>
            <div className="p-3 max-h-[600px] overflow-y-auto">
                {fields.map((field, idx) => (
                    <FieldRow key={idx} field={field} depth={0} />
                ))}
            </div>
        </div>
    );
}

function FieldRow({ field, depth }: { field: Field, depth: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const hasChildren = field.refFields && field.refFields.length > 0;

    return (
        <div className="select-none">
            <div
                className={`
          flex items-center gap-3 py-2 px-3 rounded-lg transition-colors cursor-pointer
          hover:bg-blue-50/80 group
        `}
                style={{ paddingLeft: `${(depth * 20) + 12}px` }}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0 h-8">
                    {hasChildren ? (
                        isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />
                    ) : (
                        <div className="w-4" />
                    )}

                    <span className="font-mono text-sm font-semibold truncate">{field.name}</span>
                    {field.isRequired && <Tag className="w-3 h-3 text-rose-600 fill-rose-600" aria-label="Required" />}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <span className="text-[10px] sm:text-xs font-mono text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg font-bold border border-blue-100 whitespace-nowrap">
                        {field.type}
                    </span>
                    {field.isRequired && (
                        <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                            필수
                        </span>
                    )}
                </div>
                {field.description && (
                    <p className="text-[10px] text-slate-500 mt-0.5 ml-2 italic">
                        * {field.description}
                    </p>
                )}
            </div>

            <AnimatePresence>
                {isOpen && hasChildren && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="ml-3 mt-2 border-l-2 border-slate-200 pl-3 space-y-2">
                            {field.refFields!.map((refField, i) => (
                                <FieldRow key={i} field={refField} depth={depth + 1} />
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
