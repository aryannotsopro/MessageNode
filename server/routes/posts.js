const router = require('express').Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all posts (with pagination)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('creator', 'name email profilePicture')
      .populate({
        path: 'comments.author',
        select: 'name email profilePicture'
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPosts: total,
        hasMore: page * limit < total
      }
    });
  } catch (err) {
    console.error('GET /posts ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Get single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('creator', 'name email profilePicture')
      .populate('comments.author', 'name email profilePicture');

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get user's posts
router.get('/user/:userId', async (req, res) => {
  try {
    const posts = await Post.find({ creator: req.params.userId })
      .populate('creator', 'name email profilePicture')
      .populate('comments.author', 'name email profilePicture')
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (err) {
    console.error('GET /posts/user/:userId ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Create post
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, imageUrl } = req.body;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    const post = new Post({
      title: title || '',
      content: content.trim(),
      imageUrl: imageUrl || '',
      creator: req.userId,
      likes: [],
      comments: []
    });

    await post.save();
    await post.populate('creator', 'name email profilePicture');

    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Like post
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.userId);
    if (likeIndex === -1) {
      post.likes.push(req.userId);

      // Create notification for post owner (don't notify self)
      if (post.creator.toString() !== req.userId) {
        const notification = new Notification({
          sender: req.userId,
          recipient: post.creator,
          type: 'like',
          post: post._id
        });
        await notification.save();
      }
    }

    await post.save();
    await post.populate('creator', 'name email profilePicture');
    await post.populate('comments.author', 'name email profilePicture');

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Unlike post
router.post('/:id/unlike', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const likeIndex = post.likes.indexOf(req.userId);
    if (likeIndex !== -1) {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    await post.populate('creator', 'name email profilePicture');
    await post.populate('comments.author', 'name email profilePicture');

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add comment
router.post('/:id/comment', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    post.comments.push({
      text: text.trim(),
      author: req.userId,
      createdAt: new Date()
    });

    // Create notification for post owner (don't notify self)
    if (post.creator.toString() !== req.userId) {
      const notification = new Notification({
        sender: req.userId,
        recipient: post.creator,
        type: 'comment',
        post: post._id,
        text: text.trim().substring(0, 100) // Store first 100 chars of comment
      });
      await notification.save();
    }

    await post.save();
    await post.populate('creator', 'name email profilePicture');
    await post.populate('comments.author', 'name email profilePicture');

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// NEW: Delete comment
router.delete('/:postId/comment/:commentId', auth, async (req, res) => {
  try {
    const { postId, commentId } = req.params;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Find the comment
    const comment = post.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check permissions:
    // 1. User is post owner (can delete any comment anytime)
    // 2. User is comment author AND within 1 hour
    const isPostOwner = post.creator.toString() === req.userId;
    const isCommentAuthor = comment.author.toString() === req.userId;

    // Calculate time difference in hours
    const commentTime = new Date(comment.createdAt);
    const currentTime = new Date();
    const hoursDiff = (currentTime.getTime() - commentTime.getTime()) / (1000 * 60 * 60);
    const withinOneHour = hoursDiff <= 1;

    if (isPostOwner) {
      // Post owner can delete any comment
      post.comments.pull(commentId);
    } else if (isCommentAuthor && withinOneHour) {
      // Comment author can delete within 1 hour
      post.comments.pull(commentId);
    } else if (isCommentAuthor && !withinOneHour) {
      return res.status(403).json({
        message: 'You can only delete your comment within 1 hour of posting'
      });
    } else {
      return res.status(403).json({ message: 'Unauthorized to delete this comment' });
    }

    await post.save();
    await post.populate('creator', 'name email profilePicture');
    await post.populate('comments.author', 'name email profilePicture');

    res.json(post);
  } catch (err) {
    console.error('DELETE comment ERROR:', err.message);
    res.status(500).json({ message: err.message });
  }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, creator: req.userId });
    if (!post) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;