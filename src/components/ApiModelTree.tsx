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
        <div className="border border-border/50 rounded-xl overflow-hidden bg-card/20 backdrop-blur-sm">
            <div className="bg-muted/30 px-4 py-3 border-b border-border/50 flex items-center gap-2">
                <Box className="w-4 h-4 text-primary" />
                <span className="font-bold text-sm">{name}</span>
            </div>
            <div className="p-2 max-h-[600px] overflow-y-auto">
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
          hover:bg-primary/5 group
        `}
                style={{ paddingLeft: `${(depth * 20) + 12}px` }}
                onClick={() => hasChildren && setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 flex-1 min-w-0 h-8">
                    {hasChildren ? (
                        isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    ) : (
                        <div className="w-4" />
                    )}

                    <span className="font-mono text-sm font-semibold truncate">{field.name}</span>
                    {field.isRequired && <Tag className="w-3 h-3 text-destructive fill-destructive" aria-label="Required" />}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-0.5 rounded uppercase font-bold">
                        {field.type}
                    </span>
                    {field.isRequired && (
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-chart-1/10 text-chart-1 border border-chart-1/20 shrink-0">
                            필수
                        </span>
                    )}
                </div>
                {field.description && (
                    <p className="text-[10px] text-muted-foreground mt-0.5 ml-2 italic">
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
                        <div className="ml-4 mt-2 border-l border-border/50 pl-4 space-y-2">
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
