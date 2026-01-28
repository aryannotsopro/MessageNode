const router = require('express').Router();
const auth = require('../middleware/auth');
const Post = require('../models/Post');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');


// Create a post (protected)
router.post(
  '/',
  auth,
  [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('content').trim().isLength({ min: 5 }).withMessage('Content must be at least 5 characters'),
    body('imageUrl').trim().isURL().withMessage('Please provide a valid image URL')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { title, content, imageUrl } = req.body;

      const post = await Post.create({
        title: title.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim(),
        creator: req.userId
      });

      // Add post to user's posts array
      const user = await User.findById(req.userId);
      user.posts.push(post._id);
      await user.save();

      return res.status(201).json({
        message: 'Post created successfully',
        post
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// Get all posts with pagination (public)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalPosts = await Post.countDocuments();
    const posts = await Post.find()
      .populate('creator', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalPages = Math.ceil(totalPosts / limit);

    return res.json({
      posts,
      pagination: {
        currentPage: page,
        totalPages,
        totalPosts,
        postsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get only my posts (protected)
router.get('/me', auth, async (req, res) => {
  try {
    const myPosts = await Post.find({ creator: req.userId })
      .populate('creator', 'name email')
      .sort({ createdAt: -1 });
    
    return res.json(myPosts);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get single post by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('creator', 'name email');
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }
    
    return res.json(post);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }
});

// Update a post (protected, only owner)
router.put(
  '/:id',
  auth,
  [
    body('title').trim().isLength({ min: 5 }).withMessage('Title must be at least 5 characters'),
    body('content').trim().isLength({ min: 5 }).withMessage('Content must be at least 5 characters'),
    body('imageUrl').trim().isURL().withMessage('Please provide a valid image URL')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { title, content, imageUrl } = req.body;

      const post = await Post.findById(req.params.id);
      
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }

      // Check ownership
      if (post.creator.toString() !== req.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      post.title = title.trim();
      post.content = content.trim();
      post.imageUrl = imageUrl.trim();
      
      const updated = await post.save();

      return res.json({
        message: 'Post updated successfully',
        post: updated
      });
    } catch (err) {
      return res.status(400).json({ message: 'Invalid post ID' });
    }
  }
);

// Delete a post (protected, only owner)
router.delete('/:id', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check ownership
    if (post.creator.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Remove post from user's posts array
    const user = await User.findById(req.userId);
    user.posts.pull(req.params.id);
    await user.save();

    return res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }
});

// Like a post (protected)
router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if already liked
    if (post.likes.includes(req.userId)) {
      return res.status(400).json({ message: 'Post already liked' });
    }

    // Add user to likes array
    post.likes.push(req.userId);
    await post.save();

    return res.json({
      message: 'Post liked successfully',
      likesCount: post.likes.length
    });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }
});

// Unlike a post (protected)
router.delete('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if not liked yet
    if (!post.likes.includes(req.userId)) {
      return res.status(400).json({ message: 'Post not liked yet' });
    }

    // Remove user from likes array
    post.likes.pull(req.userId);
    await post.save();

    return res.json({
      message: 'Post unliked successfully',
      likesCount: post.likes.length
    });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }
});



// Get all comments for a post (public)
router.get('/:id/comments', async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comments = await Comment.find({ post: req.params.id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 });

    return res.json({
      comments,
      count: comments.length
    });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }
});

// Add a comment to a post (protected)
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const comment = await Comment.create({
      text: text.trim(),
      author: req.userId,
      post: req.params.id
    });

    // Populate author details before sending response
    await comment.populate('author', 'name email');

    return res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid post ID' });
  }
});

// Delete a comment (protected, only author can delete)
router.delete('/:postId/comments/:commentId', auth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the author
    if (comment.author.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await Comment.findByIdAndDelete(req.params.commentId);

    return res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }
});

module.exports = router;
