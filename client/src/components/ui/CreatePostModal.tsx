import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Type, AlignLeft, Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Avatar } from './Avatar';
import { postsApi } from '@/services/api';

interface CreatePostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPostCreated?: (post: any) => void;
}

export function CreatePostModal({ isOpen, onClose, onPostCreated }: CreatePostModalProps) {
    const { user } = useAuth();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || isSubmitting) return;

        setIsSubmitting(true);
        try {
            const { data } = await postsApi.create(title, content, imageUrl);
            if (onPostCreated) onPostCreated(data);
            setTitle('');
            setContent('');
            setImageUrl('');
            onClose();
        } catch (error) {
            console.error('Failed to create post:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
                    onClick={onClose}
                >
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="w-full max-w-xl overflow-hidden rounded-3xl shadow-2xl border border-white/10"
                        style={{ background: 'rgba(13,17,28,0.95)' }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <form onSubmit={handleSubmit} className="relative">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                        <Sparkles className="w-5 h-5 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">Create Post</h2>
                                        <p className="text-xs text-white/40">Share something with the world</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="p-2 rounded-xl text-white/40 hover:text-white hover:bg-white/5 transition-colors"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* User Info */}
                                <div className="flex items-center gap-3">
                                    <Avatar name={user?.name || ''} size="md" />
                                    <div>
                                        <p className="font-semibold text-white/90">{user?.name}</p>
                                        <p className="text-xs text-primary/60">@{user?.email.split('@')[0]}</p>
                                    </div>
                                </div>

                                {/* Title Input */}
                                <div className="relative group">
                                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Capture attention with a title..."
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all font-semibold"
                                        autoFocus
                                    />
                                </div>

                                {/* Content Input */}
                                <div className="relative group">
                                    <AlignLeft className="absolute left-4 top-4 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                    <textarea
                                        ref={textareaRef}
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        placeholder="What's spinning in your mind?"
                                        rows={5}
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all resize-none"
                                    />
                                </div>

                                {/* Image URL Input */}
                                <div className="relative group">
                                    <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="url"
                                        value={imageUrl}
                                        onChange={(e) => setImageUrl(e.target.value)}
                                        placeholder="Add an image URL (optional)"
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all no-scrollbar"
                                    />
                                </div>

                                {/* Preview */}
                                <AnimatePresence>
                                    {imageUrl && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="rounded-2xl overflow-hidden border border-white/10 bg-white/5"
                                        >
                                            <img
                                                src={imageUrl}
                                                alt="Post Preview"
                                                className="w-full max-h-64 object-cover"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Footer */}
                            <div className="p-6 bg-white/5 border-t border-white/10 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 py-4 px-6 rounded-2xl font-bold text-white/60 hover:text-white hover:bg-white/5 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!title.trim() || !content.trim() || isSubmitting}
                                    className="flex-[2] py-4 px-6 rounded-2xl font-bold text-[#060b14] bg-primary hover:shadow-[0_0_20px_rgba(0,229,255,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Post Now
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
