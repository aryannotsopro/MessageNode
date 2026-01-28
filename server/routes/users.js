const router = require('express').Router();
const auth = require('../middleware/auth');
const User = require('../models/User');
const { body, validationResult } = require('express-validator');

// Get my profile (protected) - MOVED TO TOP
router.get('/me/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('posts', 'title imageUrl createdAt');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
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
    body('status').optional().trim()
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(422).json({ message: 'Validation failed', errors: errors.array() });
      }

      const { name, status } = req.body;
      
      const user = await User.findById(req.userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update only provided fields
      if (name) user.name = name.trim();
      if (status !== undefined) user.status = status.trim();

      await user.save();

      // Return user without password
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

// Get user profile by ID (public) - MOVED TO BOTTOM
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password') // Don't send password
      .populate('posts', 'title imageUrl createdAt'); // Include user's posts

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(user);
  } catch (err) {
    return res.status(400).json({ message: 'Invalid user ID' });
  }
});

module.exports = router;
