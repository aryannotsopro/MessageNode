const router = require('express').Router();
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// Get my notifications
router.get('/', auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.userId })
            .populate('sender', 'name email profilePicture')
            .populate('post', 'title content imageUrl')
            .sort({ createdAt: -1 })
            .limit(50);

        res.json(notifications);
    } catch (err) {
        console.error('Get notifications error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get unread count
router.get('/unread-count', auth, async (req, res) => {
    try {
        const count = await Notification.countDocuments({
            recipient: req.userId,
            read: false,
        });
        res.json({ count });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark all as read
router.put('/read-all', auth, async (req, res) => {
    try {
        await Notification.updateMany(
            { recipient: req.userId, read: false },
            { read: true }
        );
        res.json({ message: 'All notifications marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Mark one as read
router.put('/:id/read', auth, async (req, res) => {
    try {
        await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.userId },
            { read: true }
        );
        res.json({ message: 'Notification marked as read' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
