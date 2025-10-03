"use client";

import { useEffect, useRef, useCallback } from "react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
    Calendar,
    Clock,
    Bell,
    Repeat,
    MapPin,
    ArrowUpIcon,
    Paperclip,
} from "lucide-react";

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            // Temporarily shrink to get the right scrollHeight
            textarea.style.height = `${minHeight}px`;

            // Calculate new height
            const newHeight = Math.max(
                minHeight,
                Math.min(
                    textarea.scrollHeight,
                    maxHeight ?? Number.POSITIVE_INFINITY
                )
            );

            textarea.style.height = `${newHeight}px`;
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        // Set initial height
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    // Adjust height on window resize
    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface ScheduleChatStarterProps {
    onSubmit: (message: string) => void;
}

export function ScheduleChatStarter({ onSubmit }: ScheduleChatStarterProps) {
    const [value, setValue] = useState("");
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 60,
        maxHeight: 200,
    });

    const handleSubmit = () => {
        if (value.trim()) {
            onSubmit(value.trim());
            setValue("");
            adjustHeight(true);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleQuickAction = (prompt: string) => {
        onSubmit(prompt);
    };

    return (
        <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 lg:p-8 space-y-8">
            <div className="text-center space-y-3">
                <h1 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    What would you like to schedule?
                </h1>
                <p className="text-gray-600 text-sm lg:text-base">
                    Create reminders, schedule meetings, or manage your calendar with AI assistance
                </p>
            </div>

            <div className="w-full">
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl border-2 border-purple-200 shadow-lg hover:shadow-xl transition-all">
                    <div className="overflow-y-auto">
                        <Textarea
                            ref={textareaRef}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                setValue(e.target.value);
                                adjustHeight();
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask me to schedule anything... (e.g., 'Remind me to call mom tomorrow at 3pm')"
                            className={cn(
                                "w-full px-4 py-4",
                                "resize-none",
                                "bg-transparent",
                                "border-none",
                                "text-gray-900 text-sm lg:text-base",
                                "focus:outline-none",
                                "focus-visible:ring-0 focus-visible:ring-offset-0",
                                "placeholder:text-gray-400 placeholder:text-sm",
                                "min-h-[60px]"
                            )}
                            style={{
                                overflow: "hidden",
                            }}
                        />
                    </div>

                    <div className="flex items-center justify-between p-3 border-t border-purple-100">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className="group p-2 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1"
                                title="Attach file"
                            >
                                <Paperclip className="w-4 h-4 text-purple-600" />
                                <span className="text-xs text-gray-500 hidden group-hover:inline transition-opacity">
                                    Attach
                                </span>
                            </button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={!value.trim()}
                                className={cn(
                                    "px-3 py-2 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2",
                                    value.trim()
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:shadow-lg hover:scale-105"
                                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                )}
                            >
                                <ArrowUpIcon
                                    className={cn(
                                        "w-4 h-4",
                                        value.trim()
                                            ? "text-white"
                                            : "text-gray-400"
                                    )}
                                />
                                <span className="hidden lg:inline">Send</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 lg:gap-3 mt-6">
                    <ActionButton
                        icon={<Bell className="w-4 h-4" />}
                        label="Set a Reminder"
                        onClick={() => handleQuickAction("I need to set a reminder")}
                    />
                    <ActionButton
                        icon={<Calendar className="w-4 h-4" />}
                        label="Schedule Meeting"
                        onClick={() => handleQuickAction("Help me schedule a meeting")}
                    />
                    <ActionButton
                        icon={<Repeat className="w-4 h-4" />}
                        label="Recurring Task"
                        onClick={() => handleQuickAction("Create a recurring reminder")}
                    />
                    <ActionButton
                        icon={<Clock className="w-4 h-4" />}
                        label="Set Deadline"
                        onClick={() => handleQuickAction("I need to set a deadline")}
                    />
                    <ActionButton
                        icon={<MapPin className="w-4 h-4" />}
                        label="Location Reminder"
                        onClick={() => handleQuickAction("Create a location-based reminder")}
                    />
                </div>
            </div>
        </div>
    );
}

interface ActionButtonProps {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
}

function ActionButton({ icon, label, onClick }: ActionButtonProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="flex items-center gap-2 px-3 lg:px-4 py-2 bg-white/80 hover:bg-purple-50 rounded-full border border-purple-200 text-purple-600 hover:text-purple-700 hover:border-purple-300 transition-all shadow-sm hover:shadow-md text-xs lg:text-sm"
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
