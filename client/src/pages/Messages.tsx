import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, isToday, isYesterday } from 'date-fns';
import {
    MessageCircle,
    Send,
    ArrowLeft,
    Search,
    MoreVertical,
    Phone,
    Video,
    Image,
    Smile,
    Paperclip,
    CheckCheck,
    Plus,
    X,
    File as FileIcon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import { messagesApi, usersApi } from '@/services/api';
import { Sidebar } from '@/components/ui/Sidebar';
import { io, Socket } from 'socket.io-client';
import type { ToastType } from '@/types';

interface User {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
    status?: string;
}

interface Message {
    _id: string;
    conversation: string;
    sender: User;
    text: string;
    attachmentUrl?: string;
    attachmentType?: 'image' | 'file' | '';
    read: boolean;
    createdAt: string;
}

interface Conversation {
    _id: string;
    participants: User[];
    lastMessage?: Message;
    updatedAt: string;
    unreadCount?: number;
}

export default function Messages() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [messageSearch, setMessageSearch] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ message: string; type: ToastType } | null>(null);
    const [showNewChat, setShowNewChat] = useState(false);
    const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const showToast = (message: string, type: ToastType = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    // Initialize socket connection
    useEffect(() => {
        const newSocket = io('http://localhost:3000', {
            transports: ['websocket', 'polling'],
        });

        newSocket.on('connect', () => {
            console.log('Socket connected');
            if (user?._id) {
                newSocket.emit('user_online', user._id);
            }
        });

        newSocket.on('new_message', (data: { message: Message; conversationId: string }) => {
            const { message, conversationId } = data;

            if (activeConversation && conversationId === activeConversation._id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }

            setConversations(prev => prev.map(conv => {
                if (conv._id === conversationId) {
                    return { ...conv, lastMessage: message, updatedAt: message.createdAt };
                }
                return conv;
            }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()));
        });

        newSocket.on('user_typing', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
            if (activeConversation && conversationId === activeConversation._id) {
                setTypingUsers(prev => new Set([...prev, userId]));
            }
        });

        newSocket.on('user_stop_typing', ({ userId, conversationId }: { userId: string; conversationId: string }) => {
            if (activeConversation && conversationId === activeConversation._id) {
                setTypingUsers(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(userId);
                    return newSet;
                });
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [user?._id, activeConversation?._id]);

    // Fetch conversations
    const fetchConversations = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await messagesApi.getConversations();
            setConversations(data || []);
        } catch (error) {
            console.error('Failed to fetch conversations:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        const init = async () => {
            await fetchConversations();

            // Handle deep link (from Explore/Profile)
            const state = location.state as { userId?: string };
            if (state?.userId) {
                startNewConversation(state.userId);
                // Clear state to avoid re-triggering on refresh
                navigate(location.pathname, { replace: true, state: {} });
            }
        };
        init();
    }, [fetchConversations, location.state, location.pathname, navigate]);

    // Fetch suggested users for new chat
    const fetchSuggestedUsers = async () => {
        try {
            const { data } = await usersApi.getSuggestions();
            setSuggestedUsers(data || []);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        }
    };

    useEffect(() => {
        fetchSuggestedUsers();
    }, []);

    // Fetch messages for active conversation
    const fetchMessages = useCallback(async (conversationId: string) => {
        try {
            setLoadingMessages(true);
            const { data } = await messagesApi.getMessages(conversationId);
            setMessages(data || []);
            scrollToBottom();
        } catch (error) {
            console.error('Failed to fetch messages:', error);
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation._id);
            socket?.emit('join_conversation', activeConversation._id);
        }
    }, [activeConversation, fetchMessages, socket]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleSendMessage = async () => {
        if ((!newMessage.trim() && !selectedFile) || !activeConversation) return;

        try {
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('text', newMessage.trim());
                formData.append('attachmentType', selectedFile.type.startsWith('image/') ? 'image' : 'file');

                await messagesApi.sendMessageWithAttachment(activeConversation._id, formData);
            } else {
                await messagesApi.sendMessage(activeConversation._id, newMessage.trim());
            }

            setNewMessage('');
            setSelectedFile(null);

            socket?.emit('stop_typing', {
                conversationId: activeConversation._id,
                userId: user?._id
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            showToast('Failed to send message', 'error');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleTyping = (value: string) => {
        setNewMessage(value);

        if (!activeConversation || !user?._id) return;

        socket?.emit('typing', {
            conversationId: activeConversation._id,
            userId: user._id
        });

        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            socket?.emit('stop_typing', {
                conversationId: activeConversation._id,
                userId: user._id
            });
        }, 2000);
    };

    const getOtherParticipant = (conversation: Conversation): User | undefined => {
        return conversation.participants.find(p => p._id !== user?._id);
    };

    const formatMessageTime = (date: string) => {
        const d = new Date(date);
        if (isToday(d)) {
            return format(d, 'HH:mm');
        }
        if (isYesterday(d)) {
            return 'Yesterday';
        }
        return format(d, 'dd/MM/yyyy');
    };

    const formatMessageDate = (date: string) => {
        const d = new Date(date);
        if (isToday(d)) {
            return 'Today';
        }
        if (isYesterday(d)) {
            return 'Yesterday';
        }
        return format(d, 'MMMM d, yyyy');
    };

    const filteredConversations = conversations.filter(conv => {
        const other = getOtherParticipant(conv);
        if (!other) return false;
        return other.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            other.email.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const groupMessagesByDate = (messages: Message[]) => {
        const groups: { [key: string]: Message[] } = {};
        messages.forEach(msg => {
            const date = formatMessageDate(msg.createdAt);
            if (!groups[date]) {
                groups[date] = [];
            }
            groups[date].push(msg);
        });
        return groups;
    };

    const startNewConversation = async (userId: string) => {
        try {
            const { data } = await messagesApi.getOrCreateConversation(userId);
            setShowNewChat(false);
            if (data) {
                setConversations(prev => {
                    const exists = prev.find(c => c._id === data._id);
                    if (exists) {
                        setActiveConversation(exists);
                        return prev;
                    }
                    setActiveConversation(data);
                    return [data, ...prev];
                });
            }
        } catch (error) {
            console.error('Failed to start conversation:', error);
            showToast('Failed to start conversation', 'error');
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Sidebar />

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-4 right-4 px-6 py-3 rounded-xl shadow-lg z-50 ${toast.type === 'success' ? 'bg-green-500 text-white' :
                            toast.type === 'error' ? 'bg-rose-500 text-white' :
                                'bg-violet-600 text-white'
                            }`}
                    >
                        {toast.message}
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="pl-0 md:pl-20 xl:pl-64 min-h-screen pb-24 md:pb-6">
                <div className="flex h-[calc(100vh-100px)] md:h-[calc(100vh-40px)] max-w-6xl mx-auto mt-4 md:mt-6 px-3 md:px-4 gap-3">

                    {/* Conversations List */}
                    <div
                        className={`
              flex flex-col rounded-3xl overflow-hidden bg-card border border-border shadow-xl
              ${activeConversation ? 'hidden md:flex w-80' : 'flex flex-1 md:flex-none md:w-80'}
            `}
                    >
                        {/* Header */}
                        <div className="p-5 pb-0">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h1 className="text-2xl font-bold text-foreground">Messages</h1>
                                    <p className="text-sm mt-0.5 text-muted-foreground">
                                        {conversations.length} conversations
                                    </p>
                                </div>
                                <motion.button
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setShowNewChat(true)}
                                    className="p-3 rounded-2xl bg-primary text-primary-foreground hover:shadow-lg transition-all shadow-primary/25"
                                >
                                    <Plus className="w-5 h-5 text-white" />
                                </motion.button>
                            </div>

                            {/* Search */}
                            <div
                                className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4 bg-muted border border-border focus-within:border-primary/50 transition-colors"
                            >
                                <Search className="w-4 h-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Search messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                                />
                            </div>
                        </div>

                        {/* Conversations */}
                        <div className="flex-1 overflow-y-auto px-2 pb-2">
                            {loading ? (
                                [...Array(5)].map((_, i) => (
                                    <div key={i} className="p-4 mb-2 rounded-2xl bg-muted/50 border border-border/50">
                                        <div className="flex gap-3">
                                            <div className="w-14 h-14 rounded-full shimmer" />
                                            <div className="flex-1 space-y-2 pt-1">
                                                <div className="h-4 w-24 rounded shimmer" />
                                                <div className="h-3 w-36 rounded shimmer" />
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : filteredConversations.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div
                                        className="w-20 h-20 mx-auto mb-4 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20"
                                    >
                                        <MessageCircle className="w-8 h-8 text-primary/40" />
                                    </div>
                                    <p className="text-muted-foreground text-sm">No conversations yet</p>
                                    <p className="text-muted-foreground/60 text-xs mt-1">Start a new chat!</p>
                                </div>
                            ) : (
                                filteredConversations.map((conversation) => {
                                    const other = getOtherParticipant(conversation);
                                    if (!other) return null;

                                    const isActive = activeConversation?._id === conversation._id;

                                    return (
                                        <motion.button
                                            key={conversation._id}
                                            onClick={() => setActiveConversation(conversation)}
                                            whileHover={{ scale: 1.01 }}
                                            whileTap={{ scale: 0.99 }}
                                            className={`
                        w-full p-4 text-left transition-all rounded-2xl mb-2
                        ${isActive
                                                    ? 'bg-primary/10 border border-primary/20 shadow-sm'
                                                    : 'hover:bg-muted border border-transparent'
                                                }
                      `}
                                        >
                                            <div className="flex gap-3">
                                                <div className="relative flex-shrink-0">
                                                    <img
                                                        src={other.profilePicture || `https://ui-avatars.com/api/?name=${other.name}&size=56&background=0d1117&color=00e5ff`}
                                                        alt={other.name}
                                                        className={`w-14 h-14 rounded-full object-cover border-2 ${isActive ? 'border-primary' : 'border-slate-200 dark:border-primary/20'}`}
                                                    />
                                                    <div
                                                        className="absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-background bg-green-500"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold text-foreground truncate">{other.name}</p>
                                                        {conversation.lastMessage && (
                                                            <span
                                                                className="text-xs flex-shrink-0 ml-2 text-muted-foreground"
                                                            >
                                                                {formatMessageTime(conversation.lastMessage.createdAt)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p
                                                        className="text-sm truncate mt-1 text-muted-foreground"
                                                    >
                                                        {conversation.lastMessage?.sender._id === user?._id && (
                                                            <CheckCheck className="w-3 h-3 inline mr-1 text-primary" />
                                                        )}
                                                        {conversation.lastMessage?.text || 'No messages yet'}
                                                    </p>
                                                </div>
                                            </div>
                                        </motion.button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    {activeConversation ? (
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="flex-1 flex flex-col rounded-3xl overflow-hidden bg-card border border-border shadow-xl"
                        >
                            {/* Chat Header */}
                            <div className="p-4 flex items-center justify-between border-b border-border bg-muted/30">
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => setActiveConversation(null)}
                                        className="md:hidden p-2 rounded-xl hover:bg-muted text-muted-foreground"
                                    >
                                        <ArrowLeft className="w-5 h-5 text-current" />
                                    </button>
                                    {(() => {
                                        const other = getOtherParticipant(activeConversation);
                                        return other ? (
                                            <>
                                                <div className="relative">
                                                    <img
                                                        src={other.profilePicture || `https://ui-avatars.com/api/?name=${other.name}&size=44&background=0d1117&color=00e5ff`}
                                                        alt={other.name}
                                                        className="w-11 h-11 rounded-full object-cover border-2 border-primary/20"
                                                    />
                                                    <div
                                                        className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-background bg-green-500"
                                                    />
                                                </div>
                                                <div>
                                                    <h2 className="font-semibold text-foreground">{other.name}</h2>
                                                    <p className="text-xs flex items-center gap-1 text-green-500">
                                                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                                                        Online
                                                    </p>
                                                </div>
                                            </>
                                        ) : null;
                                    })()}
                                </div>
                                <div className="flex items-center gap-1">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => showToast('Voice calls coming soon!', 'info')}
                                        className="p-2.5 rounded-xl hover:bg-muted text-primary"
                                    >
                                        <Phone className="w-5 h-5" />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => showToast('Video calls coming soon!', 'info')}
                                        className="p-2.5 rounded-xl hover:bg-muted text-primary"
                                    >
                                        <Video className="w-5 h-5" />
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => showToast('More options coming soon!', 'info')}
                                        className="p-2.5 rounded-xl hover:bg-muted text-primary"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                                {loadingMessages ? (
                                    [...Array(5)].map((_, i) => (
                                        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                                            <div
                                                className={`h-14 rounded-2xl bg-muted/50 border border-border/50 ${i % 2 === 0 ? 'w-52' : 'w-40'}`}
                                            />
                                        </div>
                                    ))
                                ) : messages.length === 0 ? (
                                    <div className="h-full flex flex-col items-center justify-center">
                                        <div
                                            className="w-20 h-20 rounded-full flex items-center justify-center mb-4 bg-primary/10 border border-primary/20 shadow-inner"
                                        >
                                            <MessageCircle className="w-8 h-8 text-primary/40" />
                                        </div>
                                        <p className="text-muted-foreground font-medium">No messages yet</p>
                                        <p className="text-muted-foreground/60 text-sm mt-1">Send a message to start the conversation</p>
                                    </div>
                                ) : (
                                    (() => {
                                        const grouped = groupMessagesByDate(messages);
                                        return Object.entries(grouped).map(([date, msgs]) => (
                                            <div key={date}>
                                                <div className="flex justify-center my-4">
                                                    <span
                                                        className="px-4 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground border border-border"
                                                    >
                                                        {date}
                                                    </span>
                                                </div>
                                                {msgs.map((message, index) => {
                                                    const isOwnMessage = message.sender._id === user?._id;
                                                    const prevMsg = msgs[index - 1];
                                                    const showAvatar = !prevMsg || prevMsg.sender._id !== message.sender._id;

                                                    return (
                                                        <motion.div
                                                            key={message._id}
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className={`flex gap-2 ${isOwnMessage ? 'justify-end' : 'justify-start'} ${showAvatar ? 'mt-3' : 'mt-0.5'}`}
                                                        >
                                                            {!isOwnMessage && showAvatar && (
                                                                <img
                                                                    src={message.sender.profilePicture || `https://ui-avatars.com/api/?name=${message.sender.name}&size=32&background=0d1117&color=00e5ff`}
                                                                    alt={message.sender.name}
                                                                    className="w-8 h-8 rounded-full object-cover flex-shrink-0 self-end"
                                                                />
                                                            )}
                                                            {!isOwnMessage && !showAvatar && <div className="w-8" />}
                                                            <div
                                                                className={`
                                    max-w-[65%] px-4 py-2.5 relative border flex flex-col gap-1
                                    ${isOwnMessage
                                                                        ? 'rounded-2xl rounded-br-md bg-primary text-primary-foreground border-transparent'
                                                                        : 'rounded-2xl rounded-bl-md bg-muted/50 border-border text-foreground'
                                                                    }
                                  `}
                                                            >
                                                                {message.attachmentUrl && message.attachmentType === 'image' && (
                                                                    <img
                                                                        src={message.attachmentUrl}
                                                                        alt="attachment"
                                                                        className="rounded-lg max-w-full h-auto cursor-pointer border border-primary/10 mb-1"
                                                                        style={{ maxHeight: '200px' }}
                                                                        onClick={() => window.open(message.attachmentUrl, '_blank')}
                                                                    />
                                                                )}
                                                                {message.attachmentUrl && message.attachmentType === 'file' && (
                                                                    <a
                                                                        href={message.attachmentUrl}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className={`flex items-center gap-2 p-2 rounded-lg mb-1 ${isOwnMessage ? 'bg-primary-foreground/10 text-white' : 'bg-muted text-foreground'}`}
                                                                    >
                                                                        <FileIcon className="w-5 h-5 flex-shrink-0" />
                                                                        <span className="text-sm truncate font-medium">Download File</span>
                                                                    </a>
                                                                )}
                                                                {message.text && <p className="text-sm">{message.text}</p>}
                                                                <div className="flex items-center justify-end gap-1 mt-1">
                                                                    <span
                                                                        className={`text-xs ${isOwnMessage ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                                                                    >
                                                                        {format(new Date(message.createdAt), 'HH:mm')}
                                                                    </span>
                                                                    {isOwnMessage && (
                                                                        <CheckCheck className={`w-3 h-3 ${isOwnMessage ? 'text-primary-foreground/80' : 'text-muted-foreground'}`} />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        ));
                                    })()
                                )}

                                {/* Typing indicator */}
                                {typingUsers.size > 0 && (
                                    <div className="flex justify-start gap-2 mt-2">
                                        <div className="w-8" />
                                        <div
                                            className="px-5 py-3 rounded-2xl rounded-bl-md bg-muted/50 border border-border"
                                        >
                                            <div className="flex gap-1">
                                                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                                                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                                                <span className="w-2 h-2 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* Message Input Container */}
                            <div className="flex flex-col border-t border-border bg-card p-2 md:p-4 gap-2">
                                {/* File Attachment Preview */}
                                {selectedFile && (
                                    <div className="flex items-center gap-3 px-4 py-2 mx-2 bg-muted/50 border border-border rounded-xl w-fit relative">
                                        <div className="flex items-center justify-center p-2 bg-primary/10 rounded-lg">
                                            {selectedFile.type.startsWith('image/') ? <Image className="w-4 h-4 text-primary" /> : <FileIcon className="w-4 h-4 text-primary" />}
                                        </div>
                                        <span className="text-sm font-medium text-foreground truncate max-w-[200px]">
                                            {selectedFile.name}
                                        </span>
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null);
                                                if (fileInputRef.current) fileInputRef.current.value = '';
                                            }}
                                            className="p-1 hover:bg-muted text-muted-foreground rounded-full"
                                        >
                                            <X className="w-4 h-4" />
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-end gap-2 md:gap-3">
                                    <input
                                        type="file"
                                        className="hidden"
                                        ref={fileInputRef}
                                        onChange={handleFileSelect}
                                    />
                                    <div className="flex gap-1 md:gap-1">
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => fileInputRef.current?.click()}
                                            className="p-2 md:p-2.5 rounded-xl hover:bg-muted text-primary"
                                        >
                                            <Paperclip className="w-5 h-5" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            onClick={() => {
                                                if (fileInputRef.current) {
                                                    fileInputRef.current.accept = "image/*";
                                                    fileInputRef.current.click();
                                                    // Reset accept after a moment so paperclip isn't restricted
                                                    setTimeout(() => { if (fileInputRef.current) fileInputRef.current.accept = ""; }, 1000);
                                                }
                                            }}
                                            className="p-2 md:p-2.5 rounded-xl hover:bg-muted text-primary hidden md:inline-flex"
                                        >
                                            <Image className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                    <div
                                        className="flex-1 flex items-center rounded-2xl px-3 md:px-4 py-1.5 md:py-2 bg-muted border border-border focus-within:border-primary/50 transition-colors"
                                    >
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            value={newMessage}
                                            onChange={(e) => handleTyping(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                            placeholder="Type a message..."
                                            className="flex-1 bg-transparent text-foreground placeholder-muted-foreground outline-none text-sm min-w-0"
                                        />
                                        <motion.button
                                            whileHover={{ scale: 1.1 }}
                                            className="p-1.5 rounded-lg hover:bg-muted text-primary ml-1"
                                        >
                                            <Smile className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={handleSendMessage}
                                        disabled={!newMessage.trim() && !selectedFile}
                                        className={`p-3 md:p-3.5 rounded-2xl disabled:opacity-40 transition-colors ${(newMessage.trim() || selectedFile) ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'bg-muted text-muted-foreground'}`}
                                    >
                                        <Send className="w-5 h-5" />
                                    </motion.button>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        /* Empty State */
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="hidden md:flex flex-1 items-center justify-center rounded-3xl bg-card border border-border shadow-inner"
                        >
                            <div className="text-center">
                                <div
                                    className="w-28 h-28 mx-auto mb-6 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)]"
                                >
                                    <MessageCircle className="w-12 h-12 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground mb-2">Select a conversation</h3>
                                <p className="text-sm mb-6 text-muted-foreground">
                                    Choose from your existing conversations<br />or start a new one
                                </p>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setShowNewChat(true)}
                                    className="px-6 py-3 rounded-2xl font-medium text-sm bg-primary text-primary-foreground hover:shadow-lg transition-all shadow-primary/30"
                                >
                                    <Plus className="w-4 h-4 inline mr-2" />
                                    New Conversation
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </main>

            {/* New Chat Modal */}
            <AnimatePresence>
                {
                    showNewChat && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                            onClick={() => setShowNewChat(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="w-full max-w-md rounded-3xl overflow-hidden bg-card border border-border shadow-2xl"
                            >
                                <div className="p-5 border-b border-border">
                                    <div className="flex items-center justify-between">
                                        <h2 className="text-lg font-bold text-foreground">New Conversation</h2>
                                        <button
                                            onClick={() => setShowNewChat(false)}
                                            className="p-2 rounded-xl hover:bg-muted text-muted-foreground transition-colors"
                                        >
                                            <ArrowLeft className="w-5 h-5 text-current" />
                                        </button>
                                    </div>
                                    <div
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl mt-4 bg-muted border border-border focus-within:border-primary/50 transition-colors"
                                    >
                                        <Search className="w-4 h-4 text-muted-foreground" />
                                        <input
                                            type="text"
                                            placeholder="Search users..."
                                            value={messageSearch}
                                            onChange={(e) => setMessageSearch(e.target.value)}
                                            className="flex-1 bg-transparent text-sm text-foreground placeholder-muted-foreground outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="p-3 max-h-80 overflow-y-auto">
                                    {suggestedUsers
                                        .filter(u =>
                                            u.name.toLowerCase().includes(messageSearch.toLowerCase()) ||
                                            u.email.toLowerCase().includes(messageSearch.toLowerCase())
                                        )
                                        .map((u) => (
                                            <motion.button
                                                key={u._id}
                                                whileHover={{ x: 4 }}
                                                onClick={() => startNewConversation(u._id)}
                                                className="w-full p-3 flex items-center gap-3 rounded-2xl hover:bg-muted transition-all"
                                            >
                                                <img
                                                    src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.name}&size=48&background=random`}
                                                    alt={u.name}
                                                    className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
                                                />
                                                <div className="flex-1 text-left">
                                                    <p className="font-medium text-foreground">{u.name}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        @{u.email.split('@')[0]}
                                                    </p>
                                                </div>
                                            </motion.button>
                                        ))}
                                </div>
                            </motion.div>
                        </motion.div>
                    )
                }
            </AnimatePresence >
        </div >
    );
}