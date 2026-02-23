import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  Edit2,
  Trash2,
  Clock,
  Share2,
  Bookmark
} from 'lucide-react';
import { LikeButton } from './LikeButton';
import { formatDate } from '@/lib/utils';
import type { Post } from '@/types';
import { usersApi } from '@/services/api';

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  isBookmarked?: boolean;
  onLike: (postId: string) => void;
  onComment: (postId: string, text: string) => void;
  onDelete?: (postId: string) => void;
  onEdit?: (post: Post) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onBookmarkChange?: () => void;
}

export function PostCard({
  post,
  currentUserId,
  isBookmarked: isBookmarkedProp = false,
  onLike,
  onComment,
  onDelete,
  onEdit,
  onDeleteComment,
  onBookmarkChange
}: PostCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(isBookmarkedProp);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  useEffect(() => {
    setIsBookmarked(isBookmarkedProp);
  }, [isBookmarkedProp]);

  if (!post || !post.creator) return null;

  const isLiked = currentUserId ? post.likes?.includes(currentUserId) : false;
  const isOwner = currentUserId === post.creator?._id;

  const handleSubmitComment = (e: FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post._id, commentText);
      setCommentText('');
    }
  };

  const handleToggleBookmark = async () => {
    if (!currentUserId || bookmarkLoading) return;
    setBookmarkLoading(true);
    try {
      if (isBookmarked) {
        await usersApi.removeBookmark(post._id);
        setIsBookmarked(false);
      } else {
        await usersApi.addBookmark(post._id);
        setIsBookmarked(true);
      }
      onBookmarkChange?.();
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    } finally {
      setBookmarkLoading(false);
    }
  };

  const canDeleteComment = (comment: any) => {
    if (!currentUserId) return { allowed: false };
    const commentAuthorId = comment.author?._id?.toString();
    const postOwnerId = post.creator?._id?.toString();
    const currentUser = currentUserId.toString();
    if (currentUser === postOwnerId) return { allowed: true, reason: 'owner' };
    if (currentUser === commentAuthorId) {
      const commentTime = new Date(comment.createdAt).getTime();
      const currentTime = new Date().getTime();
      const hoursDiff = (currentTime - commentTime) / (1000 * 60 * 60);
      const minutesLeft = Math.max(0, 60 - Math.floor((currentTime - commentTime) / (1000 * 60)));
      if (hoursDiff <= 1) return { allowed: true, reason: 'author', timeLeft: minutesLeft };
    }
    return { allowed: false };
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="w-full group"
    >
      <div
        className="rounded-[2.5rem] overflow-hidden transition-all duration-500 bg-background border border-border/60 hover:border-primary/30 hover:shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)]"
      >
        {/* Header */}
        <div className="p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="relative group/avatar">
              <img
                src={post.creator?.profilePicture || `https://ui-avatars.com/api/?name=${post.creator?.name}&background=random`}
                alt={post.creator?.name}
                className="w-12 h-12 rounded-2xl object-cover border-2 border-primary/10 group-hover/avatar:border-primary/40 transition-all duration-300"
              />
              <div
                className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background bg-green-500"
              />
            </div>
            <div>
              <h4 className="font-extrabold text-foreground text-[15px] hover:text-primary cursor-pointer transition-colors tracking-tight">
                {post.creator?.name}
              </h4>
              <p className="text-[12px] font-medium flex items-center gap-1 text-muted-foreground">
                @{post.creator?.email?.split('@')[0]} · {formatDate(post.createdAt)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Bookmark */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={handleToggleBookmark}
              disabled={!currentUserId || bookmarkLoading}
              className={`p-2.5 rounded-2xl transition-all ${isBookmarked ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
            </motion.button>

            {/* Owner menu */}
            {isOwner && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-full transition-all text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.93, y: -8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.93, y: -8 }}
                      className="absolute right-0 top-full mt-2 w-48 rounded-2xl py-2 z-20 overflow-hidden bg-background border border-border shadow-2xl backdrop-blur-xl"
                    >
                      {onEdit && (
                        <button
                          onClick={() => { onEdit(post); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all text-muted-foreground hover:bg-secondary hover:text-primary"
                        >
                          <Edit2 className="w-4 h-4" />
                          Edit Post
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => { onDelete(post._id); setShowMenu(false); }}
                          className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold transition-all text-rose-500/70 hover:bg-rose-500/10 hover:text-rose-500"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Post
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-5">
          {post.title && (
            <h3 className="text-xl font-black text-foreground mb-2.5 leading-tight tracking-tight">{post.title}</h3>
          )}
          <p className="text-[15px] font-medium leading-relaxed whitespace-pre-wrap text-foreground/80">
            {post.content}
          </p>
        </div>

        {/* Image */}
        {post.imageUrl && (
          <div className="px-6 pb-6">
            <div
              className="relative rounded-[2rem] overflow-hidden group/img border border-border/50 shadow-inner"
            >
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full max-h-[500px] object-cover transition-transform duration-700 group-hover/img:scale-[1.05]"
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div
          className="px-6 py-4 flex items-center justify-between border-t border-border/40"
        >
          <div className="flex items-center gap-8">
            <LikeButton
              likes={post.likes?.length || 0}
              isLiked={!!isLiked}
              onLike={() => onLike(post._id)}
              disabled={!currentUserId}
            />

            <motion.button
              onClick={() => setShowComments(!showComments)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`flex items-center gap-2.5 transition-all ${showComments ? 'text-primary' : 'text-muted-foreground hover:text-primary'}`}
            >
              <div className={`p-2 rounded-xl transition-colors ${showComments ? 'bg-primary/10' : 'group-hover:bg-primary/5'}`}>
                <MessageCircle className={`w-5 h-5 ${showComments ? 'fill-current' : ''}`} />
              </div>
              <span className="text-[15px] font-black">{post.comments?.length || 0}</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2.5 transition-all text-muted-foreground hover:text-primary group/share"
            >
              <div className="p-2 rounded-xl group-hover/share:bg-primary/5">
                <Share2 className="w-5 h-5" />
              </div>
            </motion.button>
          </div>

          <button
            onClick={() => setShowComments(!showComments)}
            className="transition-all p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-xl"
          >
            {showComments ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {/* Comments Section */}
        <AnimatePresence>
          {showComments && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-border bg-muted/10"
            >
              <div className="p-5 space-y-4">
                {/* Comment Input */}
                {currentUserId && (
                  <form onSubmit={handleSubmitComment} className="flex gap-4">
                    <img
                      src={`https://ui-avatars.com/api/?name=Me&background=random`}
                      className="w-10 h-10 rounded-2xl flex-shrink-0 border-2 border-primary/10"
                      alt="You"
                    />
                    <div className="flex-1 flex gap-3">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="flex-1 px-6 py-3 rounded-2xl text-sm font-medium bg-background border border-border/60 placeholder:text-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/5 outline-none transition-all shadow-inner"
                      />
                      <motion.button
                        type="submit"
                        disabled={!commentText.trim()}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="px-6 rounded-2xl flex items-center justify-center disabled:opacity-30 flex-shrink-0 bg-primary text-primary-foreground font-black tracking-wider uppercase text-xs hover:shadow-xl shadow-primary/20 transition-all"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Send
                      </motion.button>
                    </div>
                  </form>
                )}

                {/* Comments List */}
                <div className="space-y-3">
                  {post.comments?.length > 0 ? (
                    post.comments.map((comment: any, index: number) => {
                      const deleteCheck = canDeleteComment(comment);
                      const showDelete = deleteCheck.allowed && onDeleteComment;

                      return (
                        <motion.div
                          key={comment?._id || index}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.04 }}
                          className="flex gap-3 group/comment"
                        >
                          <img
                            src={comment?.author?.profilePicture || `https://ui-avatars.com/api/?name=${comment?.author?.name}&background=random`}
                            className="w-8 h-8 rounded-full object-cover mt-1 flex-shrink-0 border border-primary/20"
                            alt={comment?.author?.name}
                          />
                          <div className="flex-1">
                            <div
                              className="rounded-2xl rounded-tl-sm px-4 py-3 relative bg-muted/50 border border-border"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-sm text-foreground">{comment?.author?.name}</p>
                                  {deleteCheck.reason === 'owner' && (
                                    <span
                                      className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary/10 text-primary border border-primary/20"
                                    >
                                      Owner
                                    </span>
                                  )}
                                  {deleteCheck.reason === 'author' && deleteCheck.timeLeft && deleteCheck.timeLeft < 60 && (
                                    <span
                                      className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                    >
                                      <Clock className="w-3 h-3" />
                                      {deleteCheck.timeLeft}m
                                    </span>
                                  )}
                                </div>
                                {showDelete && (
                                  <button
                                    onClick={() => onDeleteComment?.(post._id, comment._id)}
                                    className="opacity-0 group-hover/comment:opacity-100 p-1.5 rounded-full transition-all text-rose-500/50 hover:bg-rose-500/10 hover:text-rose-500"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                              <p className="text-sm leading-relaxed text-foreground/80">
                                {comment?.text}
                              </p>
                            </div>
                            <p className="text-[11px] mt-1 ml-2 text-muted-foreground">
                              {formatDate(comment?.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  ) : (
                    <p className="text-center py-6 text-sm text-muted-foreground">
                      No signals yet. Start the conversation!
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
}