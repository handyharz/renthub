"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";
import { Loader2, Send, Search, MessageSquare, User, Home as HomeIcon } from "lucide-react";
import api from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Link from "next/link";

interface Participant {
    id: string;
    firstName: string;
    lastName: string;
    avatar?: string;
}

interface Conversation {
    id: string;
    property?: {
        id: string;
        title: string;
        images: { url: string }[];
    };
    participants: Participant[];
    messages: any[];
    lastMessageAt: string;
}

interface Message {
    id: string;
    senderId: string;
    content: string;
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

    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isLoaded && user) {
            fetchUserProfile();
            fetchConversations();
        }
    }, [isLoaded, user]);

    useEffect(() => {
        if (activeConvId && conversations.length > 0) {
            const target = conversations.find(c => c.id === activeConvId);
            if (target) setActiveConversation(target);
        }
    }, [activeConvId, conversations]);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.id);
            api.patch(`/messages/conversations/${activeConversation.id}/read?clerkId=${user?.id}`).catch(console.error);
        }
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

    const fetchConversations = async () => {
        try {
            const res = await api.get(`/messages/conversations?clerkId=${user?.id}`);
            setConversations(res.data.data);

            if (res.data.data.length > 0) {
                if (activeConvId) {
                    const target = res.data.data.find((c: any) => c.id === activeConvId);
                    if (target) {
                        setActiveConversation(target);
                    } else if (!activeConversation) {
                        setActiveConversation(res.data.data[0]);
                    }
                } else if (!activeConversation) {
                    setActiveConversation(res.data.data[0]);
                }
            }
        } catch (error) {
            console.error("Failed to fetch conversations:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchMessages = async (id: string) => {
        try {
            const res = await api.get(`/messages/conversations/${id}/messages`);
            setMessages(res.data.data);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !dbUser) return;

        setSending(true);
        try {
            const otherParticipant = activeConversation.participants.find(p => p.id !== dbUser.id);
            const receiverId = otherParticipant?.id;

            if (!receiverId) throw new Error("Receiver not found");

            const res = await api.post(`/messages?clerkId=${user?.id}`, {
                conversationId: activeConversation.id,
                receiverId,
                content: newMessage,
                propertyId: activeConversation.property?.id
            });

            setMessages([...messages, res.data.data]);
            setNewMessage("");
            fetchConversations();
        } catch (error) {
            console.error("Failed to send message:", error);
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="h-[600px] flex items-center justify-center text-[var(--text-secondary)]">
                <Loader2 className="h-8 w-8 animate-spin text-[var(--color-brand-green)]" />
            </div>
        );
    }

    if (conversations.length === 0) {
        return (
            <div className="h-[500px] flex flex-col items-center justify-center bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] p-8 shadow-[var(--shadow-sm)]">
                <div className="h-20 w-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mb-4 border border-[var(--border-color)]">
                    <MessageSquare className="h-10 w-10 text-[var(--text-muted)]" />
                </div>
                <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">Your Inbox is Empty</h3>
                <p className="text-[var(--text-secondary)] text-center max-w-sm font-medium text-sm">
                    {dbUser?.role === "LANDLORD"
                        ? "You haven't received any inquiries from tenants yet."
                        : "Inquire about properties to start a conversation with landlords or agents."}
                </p>
                {dbUser?.role === "TENANT" && (
                    <Link href="/search">
                        <Button className="mt-6 bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold rounded-xl px-6 py-2.5">Find a Home</Button>
                    </Link>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col md:flex-row h-[700px] bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] overflow-hidden shadow-[var(--shadow-sm)]">
            {/* Sidebar */}
            <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-[var(--border-color)] flex flex-col h-48 md:h-full shrink-0">
                <div className="p-3.5 border-b border-[var(--border-color)]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                        <Input placeholder="Search messages..." className="pl-10 h-10 border-[var(--border-color)] bg-[var(--bg-input)] text-[var(--text-primary)] rounded-xl" />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    {conversations.map((conv) => {
                        const otherParticipant = conv.participants.find(p => p.id !== dbUser?.id) || conv.participants[0];
                        const lastMsg = conv.messages?.[0];

                        return (
                            <button
                                key={conv.id}
                                onClick={() => setActiveConversation(conv)}
                                className={`w-full p-4 flex gap-3 text-left hover:bg-[var(--bg-muted)] transition-colors border-b border-[var(--border-color)] last:border-0 ${activeConversation?.id === conv.id ? "bg-[var(--color-brand-green)]/10 border-l-4 border-l-[var(--color-brand-green)]" : ""}`}
                            >
                                <div className="h-12 w-12 rounded-full bg-[var(--bg-muted)] overflow-hidden flex-shrink-0 border border-[var(--border-color)] relative">
                                    {otherParticipant.avatar ? (
                                        <img src={otherParticipant.avatar} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] font-extrabold">
                                            {otherParticipant.firstName[0]}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start mb-1">
                                        <h4 className="font-bold text-[var(--text-primary)] truncate text-sm">
                                            {otherParticipant.firstName} {otherParticipant.lastName}
                                        </h4>
                                        <span className="text-[10px] text-[var(--text-secondary)] font-medium whitespace-nowrap">
                                            {new Date(conv.lastMessageAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                    {conv.property && (
                                        <p className="text-xs text-[var(--color-brand-green)] font-bold truncate mb-1 flex items-center gap-1">
                                            <HomeIcon className="h-3 w-3 shrink-0" /> {conv.property.title}
                                        </p>
                                    )}
                                    <p className="text-xs text-[var(--text-secondary)] truncate font-medium">
                                        {lastMsg?.content || "No messages yet"}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 flex flex-col bg-[var(--bg-muted)]/30">
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        {(() => {
                            const otherParticipant = activeConversation.participants.find(p => p.id !== dbUser?.id) || activeConversation.participants[0];
                            return (
                                <div className="p-4 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-[var(--bg-muted)] overflow-hidden flex-shrink-0 border border-[var(--border-color)]">
                                            {otherParticipant.avatar ? (
                                                <img src={otherParticipant.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-[var(--color-brand-green)]/15 text-[var(--color-brand-green)] font-bold">
                                                    {otherParticipant.firstName[0]}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-[var(--text-primary)] leading-tight text-base">
                                                {otherParticipant.firstName} {otherParticipant.lastName}
                                            </h3>
                                            {activeConversation.property && (
                                                <p className="text-xs text-[var(--text-secondary)] font-medium">Inquiry about: {activeConversation.property.title}</p>
                                            )}
                                        </div>
                                    </div>
                                    {activeConversation.property && (
                                        <Link href={`/properties/${activeConversation.property.id}`}>
                                            <Button variant="outline" size="sm" className="text-xs font-bold rounded-xl border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--bg-muted)]">View Property</Button>
                                        </Link>
                                    )}
                                </div>
                            );
                        })()}

                        {/* Messages Area */}
                        <div
                            ref={scrollRef}
                            className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4"
                        >
                            {messages.map((msg) => {
                                const isMine = msg.senderId === dbUser?.id;

                                return (
                                    <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                                        <div className={`max-w-[80%] sm:max-w-[70%] p-3.5 rounded-2xl text-sm ${isMine ? "bg-[var(--color-brand-green)] text-white rounded-br-none shadow-sm font-medium" : "bg-[var(--bg-card)] text-[var(--text-primary)] rounded-bl-none border border-[var(--border-color)] font-medium shadow-sm"}`}>
                                            <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            <span className={`text-[10px] block mt-1.5 font-medium ${isMine ? "text-emerald-100" : "text-[var(--text-secondary)]"}`}>
                                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-[var(--bg-card)] border-t border-[var(--border-color)]">
                            <form onSubmit={handleSendMessage} className="flex gap-2">
                                <Input
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-[var(--bg-input)] border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-placeholder)] focus:bg-[var(--bg-card)] rounded-xl"
                                />
                                <Button type="submit" disabled={sending || !newMessage.trim()} className="bg-[var(--color-brand-green)] hover:bg-[var(--color-brand-green)]/90 text-white font-bold px-5 rounded-xl">
                                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <div className="h-20 w-20 rounded-full bg-[var(--bg-muted)] flex items-center justify-center mb-4 border border-[var(--border-color)]">
                            <MessageSquare className="h-10 w-10 text-[var(--text-muted)]" />
                        </div>
                        <h3 className="text-lg font-bold text-[var(--text-primary)]">Select a conversation</h3>
                        <p className="text-[var(--text-secondary)] max-w-xs mt-1 font-medium text-xs sm:text-sm">Choose a chat from the sidebar to continue your conversation.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
