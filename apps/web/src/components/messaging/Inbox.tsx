"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import {
    Loader2,
    Send,
    Search,
    MessageSquare,
    User,
    Home as HomeIcon,
    ChevronLeft,
    Phone,
    ExternalLink,
    CheckCheck,
    Check,
    Sparkles,
    X,
    ShieldCheck,
    Building2,
    RefreshCw,
    MapPin
} from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

interface Participant {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
    phone?: string;
    email?: string;
    role?: string;
    verified?: boolean;
    phoneVerified?: boolean;
}

interface Conversation {
    id: string;
    property?: {
        id: string;
        title: string;
        city?: string;
        pricePerYear?: number;
        images: { url: string }[];
    };
    participants: Participant[];
    messages: any[];
    lastMessageAt: string;
}

interface Message {
    id: string;
    conversationId?: string;
    senderId: string;
    content: string;
    read?: boolean;
    createdAt: string;
}

export function Inbox({ initialConversationId }: { initialConversationId?: string | null }) {
    const { user, isLoaded } = useUser();
    const searchParams = useSearchParams();
    const convIdFromUrl = searchParams.get("convId");
    const activeConvId = initialConversationId || convIdFromUrl;

    const [dbUser, setDbUser] = useState<any>(null);
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeFilter, setActiveFilter] = useState<"ALL" | "PROPERTIES">("ALL");

    // Mobile view toggle: show list or chat
    const [mobileShowChat, setMobileShowChat] = useState(false);

    const scrollRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isLoaded && user) {
            fetchUserProfile();
            fetchConversations();
        }
    }, [isLoaded, user]);

    useEffect(() => {
        if (activeConvId && conversations.length > 0) {
            const target = conversations.find((c) => c.id === activeConvId);
            if (target) {
                setActiveConversation(target);
                setMobileShowChat(true);
            }
        }
    }, [activeConvId, conversations]);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            api.patch(`/messages/conversations/${activeConversation.id}/read?clerkId=${user?.id}`).catch(console.error);
        }
    }, [activeConversation]);

    // Live polling for incoming messages every 4 seconds when conversation is active
    useEffect(() => {
        if (!activeConversation) return;

        const interval = setInterval(() => {
            api.get(`/messages/conversations/${activeConversation.id}/messages`)
                .then((res) => {
                    const latest = res.data.data || [];
                    setMessages((prev) => {
                        if (latest.length !== prev.length || latest[latest.length - 1]?.id !== prev[prev.length - 1]?.id) {
                            return latest;
                        }
                        return prev;
                    });
                })
                .catch((err) => console.warn("Polling messages:", err));
        }, 4000);

        return () => clearInterval(interval);
    }, [activeConversation]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const fetchUserProfile = async () => {
        try {
            const res = await api.get(`/users/me?clerkId=${user?.id}`);
            setDbUser(res.data.data);
        } catch (error) {
            console.error("Failed to fetch user profile:", error);
        }
    };

    const fetchConversations = async (isSilent = false) => {
        try {
            if (!isSilent) setLoading(true);
            const res = await api.get(`/messages/conversations?clerkId=${user?.id}`);
            const data: Conversation[] = res.data.data || [];
            setConversations(data);

            if (data.length > 0 && !activeConversation) {
                if (activeConvId) {
                    const target = data.find((c) => c.id === activeConvId);
                    if (target) {
                        setActiveConversation(target);
                        setMobileShowChat(true);
                    } else {
                        setActiveConversation(data[0]);
                    }
                } else {
                    setActiveConversation(data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            if (!isSilent) setLoading(false);
        }
    };

    const fetchMessages = async (id: string) => {
        try {
            const res = await api.get(`/messages/conversations/${id}/messages`);
            setMessages(res.data.data || []);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const contentToSend = newMessage.trim();
        if (!contentToSend || !activeConversation || !dbUser) return;

        setSending(true);
        try {
            const otherParticipant = activeConversation.participants.find((p) => p.id !== dbUser.id) || activeConversation.participants[0];
            const receiverId = otherParticipant?.id;

            if (!receiverId) throw new Error("Receiver not found");

            const res = await api.post(`/messages?clerkId=${user?.id}`, {
                conversationId: activeConversation.id,
                receiverId,
                content: contentToSend,
                propertyId: activeConversation.property?.id
            });

            setMessages((prev) => [...prev, res.data.data]);
            setNewMessage("");
            fetchConversations(true);

            // Re-focus textarea
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        } catch (error: any) {
            console.error("Failed to send message:", error);
            toast.error(error.response?.data?.message || "Failed to send message");
        } finally {
            setSending(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // Filter conversations
    const filteredConversations = useMemo(() => {
        return conversations.filter((conv) => {
            const otherParticipant = conv.participants.find((p) => p.id !== dbUser?.id) || conv.participants[0];
            const name = `${otherParticipant?.firstName || ""} ${otherParticipant?.lastName || ""}`.toLowerCase();
            const propTitle = (conv.property?.title || "").toLowerCase();
            const lastMsg = (conv.messages?.[0]?.content || "").toLowerCase();
            const q = searchQuery.toLowerCase().trim();

            if (activeFilter === "PROPERTIES" && !conv.property) {
                return false;
            }

            if (!q) return true;
            return name.includes(q) || propTitle.includes(q) || lastMsg.includes(q);
        });
    }, [conversations, dbUser, searchQuery, activeFilter]);

    // Quick reply templates
    const quickReplies = useMemo(() => {
        if (dbUser?.role === "LANDLORD") {
            return [
                "Hello! Yes, the property is still available.",
                "You are welcome to schedule a physical walkthrough via the dashboard.",
                "What is your proposed move-in date?",
                "Please submit your rental application to initiate verification."
            ];
        }
        return [
            "Hi, is this property still available for inspection?",
            "When can we schedule a physical tour this week?",
            "What are the total move-in requirements?",
            "I have submitted a rental application for this property."
        ];
    }, [dbUser]);

    if (loading) {
        return (
            <div className="h-[650px] flex flex-col items-center justify-center text-[var(--text-secondary)]">
                <div className="relative">
                    <div className="w-12 h-12 rounded-2xl bg-[var(--color-brand-green)]/10 flex items-center justify-center animate-pulse">
                        <MessageSquare className="h-6 w-6 text-[var(--color-brand-green)]" />
                    </div>
                    <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-green)] absolute -bottom-1 -right-1" />
                </div>
                <p className="font-bold text-sm text-[var(--text-primary)] mt-4">Loading conversations...</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">Retrieving message history and active inquiries</p>
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="h-[550px] flex flex-col items-center justify-center bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] p-8 shadow-xs text-center">
                <div className="w-16 h-16 rounded-2xl bg-[var(--color-brand-green)]/10 text-[var(--color-brand-green)] flex items-center justify-center mb-4 border border-[var(--color-brand-green)]/20 shadow-xs">
                    <MessageSquare className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-extrabold text-[var(--text-primary)] mb-2">Your Inbox is Empty</h3>
                <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-sm font-medium leading-relaxed">
                    {dbUser?.role === "LANDLORD"
                        ? "You haven't received any tenant inquiries or tour messages yet. When renters contact you, their chats will appear here."
                        : "Connect with verified landlords, ask questions about apartments, or coordinate scheduled tours."}
                </p>
                {dbUser?.role === "TENANT" && (
                    <Link href="/search" className="mt-6">
                        <Button className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold text-xs rounded-xl h-11 px-6 shadow-xs gap-1.5">
                            <Search className="h-3.5 w-3.5" />
                            Find a Home to Inquire
                        </Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[750px] bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] overflow-hidden shadow-xs">
            {/* SIDEBAR: Conversations List */}
            <div
                className={`w-full md:w-80 lg:w-96 border-b md:border-b-0 md:border-r border-[var(--border-color)] flex flex-col h-full shrink-0 ${
                    mobileShowChat ? "hidden md:flex" : "flex"
                }`}
            >
                {/* Sidebar Header */}
                <div className="p-4 border-b border-[var(--border-color)] space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-[var(--text-primary)] text-base">Conversations</h3>
                            <span className="text-[11px] font-black px-2 py-0.5 rounded-full bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)]">
                                {conversations.length}
                            </span>
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fetchConversations(true)}
                            className="h-8 w-8 p-0 rounded-xl border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] shadow-2xs"
                            title="Refresh chats"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search contacts, messages..."
                            className="w-full h-9 pl-9 pr-8 text-xs font-medium bg-[var(--bg-muted)] rounded-xl border border-transparent focus:border-[var(--color-brand-green)] focus:bg-[var(--bg-card)] text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery("")}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] p-0.5"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        )}
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 pt-0.5">
                        <button
                            onClick={() => setActiveFilter("ALL")}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all ${
                                activeFilter === "ALL"
                                    ? "bg-[var(--color-brand-green)] text-white shadow-2xs"
                                    : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            All Chats
                        </button>
                        <button
                            onClick={() => setActiveFilter("PROPERTIES")}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                                activeFilter === "PROPERTIES"
                                    ? "bg-[var(--color-brand-green)] text-white shadow-2xs"
                                    : "bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                            }`}
                        >
                            <HomeIcon className="h-3 w-3" />
                            <span>Properties Only</span>
                        </button>
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)] scrollbar-thin">
                    {filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-xs text-[var(--text-secondary)] font-medium">
                            <Search className="h-8 w-8 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                            No conversations match your search.
                        </div>
                    ) : (
                        filteredConversations.map((conv) => {
                            const otherParticipant =
                                conv.participants.find((p) => p.id !== dbUser?.id) || conv.participants[0];
                            const lastMsg = conv.messages?.[0];
                            const isSelected = activeConversation?.id === conv.id;

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => {
                                        setActiveConversation(conv);
                                        setMobileShowChat(true);
                                    }}
                                    className={`w-full p-3.5 flex gap-3 text-left transition-all duration-150 relative ${
                                        isSelected
                                            ? "bg-[var(--color-brand-green)]/10 dark:bg-[var(--color-brand-green)]/15 border-l-4 border-l-[var(--color-brand-green)]"
                                            : "hover:bg-[var(--bg-muted)]/70"
                                    }`}
                                >
                                    {/* Avatar */}
                                    <div className="h-11 w-11 rounded-2xl bg-[var(--bg-muted)] overflow-hidden shrink-0 border border-[var(--border-color)] relative shadow-2xs">
                                        {otherParticipant?.avatar ? (
                                            <img
                                                src={otherParticipant.avatar}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-brand-green)]/20 to-[var(--color-brand-green)]/5 text-[var(--color-brand-green)] font-black text-xs">
                                                {otherParticipant?.firstName?.[0]}
                                                {otherParticipant?.lastName?.[0]}
                                            </div>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-0.5">
                                            <h4 className="font-extrabold text-[var(--text-primary)] truncate text-xs sm:text-sm">
                                                {otherParticipant?.firstName} {otherParticipant?.lastName}
                                            </h4>
                                            <span className="text-[10px] text-[var(--text-muted)] font-semibold shrink-0 ml-1">
                                                {conv.lastMessageAt
                                                    ? new Date(conv.lastMessageAt).toLocaleDateString([], {
                                                          month: "short",
                                                          day: "numeric"
                                                      })
                                                    : ""}
                                            </span>
                                        </div>

                                        {conv.property && (
                                            <p className="text-[11px] text-[var(--color-brand-green)] font-extrabold truncate mb-0.5 flex items-center gap-1">
                                                <HomeIcon className="h-3 w-3 shrink-0" /> {conv.property.title}
                                            </p>
                                        )}

                                        <p className="text-xs text-[var(--text-secondary)] truncate font-medium">
                                            {lastMsg?.content || "Started a conversation"}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* CHAT PANE: Active Conversation View */}
            <div
                className={`flex-1 flex flex-col bg-[var(--bg-muted)]/20 ${
                    mobileShowChat ? "flex" : "hidden md:flex"
                }`}
            >
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        {(() => {
                            const otherParticipant =
                                activeConversation.participants.find((p) => p.id !== dbUser?.id) ||
                                activeConversation.participants[0];

                            return (
                                <div className="p-3.5 sm:p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between gap-3 shadow-2xs">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {/* Mobile Back Button */}
                                        <button
                                            onClick={() => setMobileShowChat(false)}
                                            className="md:hidden p-1.5 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                                            title="Back to conversations"
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>

                                        {/* Avatar */}
                                        <div className="h-10 w-10 rounded-2xl bg-[var(--bg-muted)] overflow-hidden shrink-0 border border-[var(--border-color)]">
                                            {otherParticipant?.avatar ? (
                                                <img
                                                    src={otherParticipant.avatar}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[var(--color-brand-green)]/20 to-[var(--color-brand-green)]/5 text-[var(--color-brand-green)] font-black text-xs">
                                                    {otherParticipant?.firstName?.[0]}
                                                    {otherParticipant?.lastName?.[0]}
                                                </div>
                                            )}
                                        </div>

                                        {/* Name & Role */}
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                <h3 className="font-extrabold text-[var(--text-primary)] text-sm sm:text-base leading-tight truncate">
                                                    {otherParticipant?.firstName} {otherParticipant?.lastName}
                                                </h3>
                                                {otherParticipant?.verified && (
                                                    <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 text-[9px] px-1.5 py-0 font-bold flex items-center gap-0.5">
                                                        <ShieldCheck className="h-2.5 w-2.5" /> Verified
                                                    </Badge>
                                                )}
                                            </div>

                                            {activeConversation.property ? (
                                                <p className="text-[11px] text-[var(--color-brand-green)] font-bold truncate flex items-center gap-1">
                                                    <HomeIcon className="h-3 w-3 shrink-0" />
                                                    {activeConversation.property.title}
                                                </p>
                                            ) : (
                                                <p className="text-[11px] text-[var(--text-muted)] font-medium">Direct Inquiry</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons: Phone & View Property */}
                                    <div className="flex items-center gap-2 shrink-0">
                                        {otherParticipant?.phone && (
                                            <a
                                                href={`tel:${otherParticipant.phone}`}
                                                className="h-8 px-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--color-brand-green)] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                                                title={`Call ${otherParticipant.phone}`}
                                            >
                                                <Phone className="h-3.5 w-3.5" />
                                                <span className="hidden sm:inline">Call</span>
                                            </a>
                                        )}

                                        {activeConversation.property && (
                                            <Link
                                                href={`/properties/${activeConversation.property.id}`}
                                                target="_blank"
                                                className="h-8 px-2.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-muted)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
                                            >
                                                <span className="hidden sm:inline">View Property</span>
                                                <ExternalLink className="h-3.5 w-3.5" />
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Messages Stream */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 scrollbar-thin"
                        >
                            {messages.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[var(--text-muted)]">
                                    <MessageSquare className="h-10 w-10 mb-2 opacity-40" />
                                    <p className="text-xs font-medium">No messages yet. Send a greeting to start the conversation!</p>
                                </div>
                            ) : (
                                messages.map((msg, index) => {
                                    const isMine = msg.senderId === dbUser?.id;
                                    const msgDate = new Date(msg.createdAt);
                                    const timeStr = msgDate.toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit"
                                    });

                                    return (
                                        <div
                                            key={msg.id || index}
                                            className={`flex ${isMine ? "justify-end" : "justify-start"} animate-in fade-in duration-150`}
                                        >
                                            <div
                                                className={`max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl text-xs sm:text-sm shadow-xs ${
                                                    isMine
                                                        ? "bg-[var(--color-brand-green)] text-white rounded-br-xs font-medium"
                                                        : "bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-xs border border-[var(--border-color)] font-medium"
                                                }`}
                                            >
                                                <p className="leading-relaxed whitespace-pre-wrap select-text break-words">
                                                    {msg.content}
                                                </p>
                                                <div
                                                    className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${
                                                        isMine ? "text-emerald-100" : "text-[var(--text-muted)]"
                                                    }`}
                                                >
                                                    <span>{timeStr}</span>
                                                    {isMine && (
                                                        <CheckCheck className="h-3 w-3 text-emerald-200" />
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Quick Reply Template Chips */}
                        <div className="px-4 py-2 border-t border-[var(--border-color)] bg-[var(--bg-card)]/60 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                            <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] tracking-wider shrink-0 flex items-center gap-1">
                                <Sparkles className="h-3 w-3 text-amber-500" /> Quick Replies:
                            </span>
                            {quickReplies.map((reply, i) => (
                                <button
                                    key={i}
                                    onClick={() => setNewMessage(reply)}
                                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-[var(--bg-muted)] hover:bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] whitespace-nowrap transition-all shadow-2xs"
                                >
                                    {reply}
                                </button>
                            ))}
                        </div>

                        {/* Input Composer */}
                        <div className="p-3.5 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
                            <form
                                onSubmit={handleSendMessage}
                                className="flex items-end gap-2 bg-[var(--bg-muted)]/70 rounded-2xl border border-[var(--border-color)] p-1.5 focus-within:border-[var(--color-brand-green)] focus-within:bg-[var(--bg-card)] transition-all shadow-2xs"
                            >
                                <textarea
                                    ref={textareaRef}
                                    rows={1}
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder="Type your message... (Enter to send, Shift+Enter for newline)"
                                    className="flex-1 bg-transparent px-3 py-2 text-xs sm:text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-hidden resize-none max-h-32 min-h-[40px] font-medium"
                                />

                                <Button
                                    type="submit"
                                    disabled={sending || !newMessage.trim()}
                                    className="h-10 px-4 rounded-xl bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-extrabold text-xs shadow-xs gap-1.5 shrink-0"
                                >
                                    {sending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <>
                                            <span className="hidden sm:inline">Send</span>
                                            <Send className="h-3.5 w-3.5" />
                                        </>
                                    )}
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="h-20 w-20 rounded-3xl bg-[var(--bg-muted)] flex items-center justify-center mb-4 border border-[var(--border-color)] shadow-xs">
                            <MessageSquare className="h-10 w-10 text-[var(--text-muted)]" />
                        </div>
                        <h3 className="text-lg font-extrabold text-[var(--text-primary)]">Select a Conversation</h3>
                        <p className="text-[var(--text-secondary)] max-w-xs mt-1 font-medium text-xs sm:text-sm leading-relaxed">
                            Choose an existing chat from the sidebar or click "Message" on any property or tour request to start chatting.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
