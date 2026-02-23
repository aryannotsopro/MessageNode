const router = require('express').Router();
const auth = require('../middleware/auth');
const Story = require('../models/Story');
const User = require('../models/User');

// Get all stories (from users I follow + my own)
router.get('/', auth, async (req, res) => {
  try {
    const currentUser = await User.findById(req.userId);

    // Get stories from followed users + self
    const userIds = [...currentUser.following, req.userId];

    const stories = await Story.find({
      creator: { $in: userIds },
      expiresAt: { $gt: new Date() }
    })
      .populate('creator', 'name email profilePicture')
      .sort({ createdAt: -1 });

    // Group stories by user
    const groupedStories = stories.reduce((acc, story) => {
      const creatorId = story.creator._id.toString();
      if (!acc[creatorId]) {
        acc[creatorId] = {
          user: story.creator,
          stories: [],
          hasUnviewed: false
        };
      }
      acc[creatorId].stories.push(story);
      if (!story.viewers.includes(req.userId)) {
        acc[creatorId].hasUnviewed = true;
      }
      return acc;
    }, {});

    // Convert to array and put current user first
    const result = Object.values(groupedStories);
    result.sort((a, b) => {
      if (a.user._id.toString() === req.userId) return -1;
      if (b.user._id.toString() === req.userId) return 1;
      return 0;
    });

    res.json(result);
  } catch (err) {
    console.error('Get stories error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

const upload = require('../middleware/upload');

// Create a story
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    const { caption } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: 'Image is required' });
    }

    const imageUrl = `http://localhost:3000/uploads/${req.file.filename}`;

    const story = new Story({
      creator: req.userId,
      imageUrl,
      caption: caption || ''
    });

    await story.save();
    await story.populate('creator', 'name email profilePicture');

    res.status(201).json(story);
  } catch (err) {
    console.error('Create story error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// View a story (mark as viewed)
router.post('/:id/view', auth, async (req, res) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ message: 'Story not found' });
    }

    if (!story.viewers.includes(req.userId)) {
      story.viewers.push(req.userId);
      await story.save();
    }

    res.json({ message: 'Story viewed' });
  } catch (err) {
    console.error('View story error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete my story
router.delete('/:id', auth, async (req, res) => {
  try {
    const story = await Story.findOneAndDelete({
      _id: req.params.id,
      creator: req.userId
    });

    if (!story) {
      return res.status(404).json({ message: 'Story not found or unauthorized' });
    }

    res.json({ message: 'Story deleted' });
  } catch (err) {
    console.error('Delete story error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;