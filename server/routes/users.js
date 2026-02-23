const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const Post = require('../models/Post');
const Notification = require('../models/Notification');
const upload = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

// Get my profile (protected)
router.get('/me/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('followers', 'name email profilePicture')
      .populate('following', 'name email profilePicture');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Upload profile picture
router.post('/me/profile-picture', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { profilePicture: imageUrl },
      { new: true }
    ).select('-password');

    return res.json({
      message: 'Profile picture updated',
      user
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Upload cover picture
router.post('/me/cover-picture', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image uploaded' });
    }

    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.userId,
      { coverPicture: imageUrl },
      { new: true }
    ).select('-password');

    return res.json({
      message: 'Cover picture updated',
      user
    });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Update my profile (protected)
router.put(
  '/me/profile',
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('status').optional().trim(),
    body('location').optional().trim(),
    body('website').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { name, status, location, website } = req.body;

      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (name) user.name = name.trim();
      if (status !== undefined) user.status = status.trim();
      if (location !== undefined) user.location = location.trim();
      if (website !== undefined) user.website = website.trim();

      await user.save();

      const updatedUser = user.toObject();
      delete updatedUser.password;

      return res.json({
        message: 'Profile updated successfully',
        user: updatedUser
      });
    } catch (err) {
      return res.status(500).json({ message: 'Server error' });
    }
  }
);

// ==================== FOLLOW/UNFOLLOW ====================

// Follow a user
router.post('/:id/follow', auth, async (req, res) => {
  try {
    if (req.userId === req.params.id) {
      return res.status(400).json({ message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if already following
    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    // Add to following/followers
    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.userId);

    await currentUser.save();
    await userToFollow.save();

    // Create notification for the user being followed
    const notification = new Notification({
      sender: req.userId,
      recipient: userToFollow._id,
      type: 'follow'
    });
    await notification.save();

    res.json({
      message: 'Followed successfully',
      following: currentUser.following
    });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Unfollow a user
router.post('/:id/unfollow', auth, async (req, res) => {
  try {
    if (req.userId === req.params.id) {
      return res.status(400).json({ message: 'You cannot unfollow yourself' });
    }

    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.userId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if following
    if (!currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: 'Not following this user' });
    }

    // Remove from following/followers
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.userId
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({
      message: 'Unfollowed successfully',
      following: currentUser.following
    });
  } catch (err) {
    console.error('Unfollow error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get users to follow (suggestions)
router.get('/suggestions', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);

    // Get users not followed by current user (excluding self)
    const suggestions = await User.find({
      _id: {
        $ne: req.userId,
        $nin: currentUser.following
      }
    })
      .select('name email profilePicture followers status')
      .limit(5);

    res.json(suggestions);
  } catch (err) {
    console.error('Suggestions error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.trim() === '') {
      return res.json([]);
    }

    const regex = new RegExp(q.trim(), 'i'); // Case-insensitive regex

    const users = await User.find({
      $or: [
        { name: { $regex: regex } },
        { email: { $regex: regex } }
      ]
    })
      .select('name email profilePicture status followers')
      .limit(20);

    res.json(users);
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==================== BOOKMARKS ====================

// Get my bookmarks
router.get('/me/bookmarks', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .populate({
        path: 'bookmarks',
        populate: [
          { path: 'creator', select: 'name email profilePicture' },
          { path: 'comments.author', select: 'name email profilePicture' }
        ],
        options: { sort: { createdAt: -1 } }
      });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user.bookmarks);
  } catch (err) {
    console.error('Get bookmarks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bookmark a post
router.post('/me/bookmarks/:postId', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const user = await User.findById(req.userId);

    if (user.bookmarks.includes(req.params.postId)) {
      return res.status(400).json({ message: 'Post already bookmarked' });
    }

    user.bookmarks.push(req.params.postId);
    await user.save();

    res.json({
      message: 'Post bookmarked',
      bookmarks: user.bookmarks
    });
  } catch (err) {
    console.error('Bookmark error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove bookmark
router.delete('/me/bookmarks/:postId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    user.bookmarks = user.bookmarks.filter(
      id => id.toString() !== req.params.postId
    );
    await user.save();

    res.json({
      message: 'Bookmark removed',
      bookmarks: user.bookmarks
    });
  } catch (err) {
    console.error('Remove bookmark error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user profile by ID (with privacy for followers/following)
router.get('/:id', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the requester is the profile owner or follows them
    const isOwner = req.userId === req.params.id;
    const isFollowing = targetUser.followers.some(f => f.toString() === req.userId);

    // If private account and not owner/follower, show limited info
    if (targetUser.isPrivate && !isOwner && !isFollowing) {
      const limitedUser = {
        _id: targetUser._id,
        name: targetUser.name,
        email: targetUser.email,
        profilePicture: targetUser.profilePicture,
        status: targetUser.status,
        isPrivate: true,
        followersCount: targetUser.followers.length,
        followingCount: targetUser.following.length,
        // Don't show actual followers/following lists
        followers: [],
        following: []
      };
      return res.json(limitedUser);
    }

    // Populate followers/following only for owner or followers
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('followers', 'name email profilePicture')
      .populate('following', 'name email profilePicture');

    return res.json(user);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
});

// Get followers list (protected - only for owner or followers)
router.get('/:id/followers', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOwner = req.userId === req.params.id;
    const isFollowing = targetUser.followers.some(f => f.toString() === req.userId);

    // Privacy check
    if (targetUser.isPrivate && !isOwner && !isFollowing) {
      return res.status(403).json({ message: 'This account is private' });
    }

    const user = await User.findById(req.params.id)
      .populate('followers', 'name email profilePicture status');

    res.json(user.followers);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get following list (protected - only for owner or followers)
router.get('/:id/following', auth, async (req, res) => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isOwner = req.userId === req.params.id;
    const isFollowing = targetUser.followers.some(f => f.toString() === req.userId);

    // Privacy check
    if (targetUser.isPrivate && !isOwner && !isFollowing) {
      return res.status(403).json({ message: 'This account is private' });
    }

    const user = await User.findById(req.params.id)
      .populate('following', 'name email profilePicture status');

    res.json(user.following);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;