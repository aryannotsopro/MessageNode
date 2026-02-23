const router = require('express').Router();
const auth = require('../middleware/auth');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');
const User = require('../models/User');

// Get all conversations for current user
router.get('/conversations', auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: req.userId,
        })
            .populate('participants', 'name email profilePicture')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'name profilePicture' },
            })
            .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        console.error('Get conversations error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get or create conversation with a user
router.post('/conversations', auth, async (req, res) => {
    try {
        const { recipientId } = req.body;

        if (!recipientId) {
            return res.status(400).json({ message: 'recipientId is required' });
        }

        if (recipientId === req.userId) {
            return res.status(400).json({ message: 'Cannot message yourself' });
        }

        // Check if conversation already exists
        let conversation = await Conversation.findOne({
            participants: { $all: [req.userId, recipientId] },
        })
            .populate('participants', 'name email profilePicture')
            .populate({
                path: 'lastMessage',
                populate: { path: 'sender', select: 'name profilePicture' },
            });

        if (!conversation) {
            conversation = new Conversation({
                participants: [req.userId, recipientId],
            });
            await conversation.save();
            await conversation.populate('participants', 'name email profilePicture');
        }

        res.json(conversation);
    } catch (err) {
        console.error('Create conversation error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get messages in a conversation
router.get('/conversations/:conversationId/messages', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;

        // Verify user is in conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.userId,
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const messages = await Message.find({ conversation: conversationId })
            .populate('sender', 'name email profilePicture')
            .sort({ createdAt: 1 });

        // Mark all messages as read
        await Message.updateMany(
            { conversation: conversationId, sender: { $ne: req.userId }, read: false },
            { read: true }
        );

        res.json(messages);
    } catch (err) {
        console.error('Get messages error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Send a message
router.post('/conversations/:conversationId/messages', auth, async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { text } = req.body;

        if (!text || text.trim() === '') {
            return res.status(400).json({ message: 'Message text is required' });
        }

        // Verify user is in conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.userId,
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const message = new Message({
            conversation: conversationId,
            sender: req.userId,
            text: text.trim(),
        });

        await message.save();
        await message.populate('sender', 'name email profilePicture');

        // Update conversation's lastMessage
        conversation.lastMessage = message._id;
        await conversation.save();

        // Get recipient(s) for notification
        const recipientIds = conversation.participants.filter(
            (p) => p.toString() !== req.userId
        );

        // Create notification + emit via socket
        for (const recipientId of recipientIds) {
            try {
                const notification = new Notification({
                    recipient: recipientId,
                    sender: req.userId,
                    type: 'message',
                    text: text.trim().substring(0, 60),
                });
                await notification.save();
                await notification.populate('sender', 'name profilePicture');

                // Emit to recipient's socket if online
                if (global.io && global.onlineUsers) {
                    const recipientSocketId = global.onlineUsers.get(recipientId.toString());
                    if (recipientSocketId) {
                        global.io.to(recipientSocketId).emit('new_notification', notification);
                    }
                }
            } catch (notifErr) {
                console.error('Notification error:', notifErr);
            }
        }

        // Emit the new message to the conversation room
        if (global.io) {
            global.io.to(conversationId).emit('new_message', {
                message,
                conversationId,
            });
        }

        res.status(201).json(message);
    } catch (err) {
        console.error('Send message error:', err);
        res.status(500).json({ message: 'Server error' });
    }

});

const upload = require('../middleware/upload');

// Send a message with an attachment
router.post('/conversations/:conversationId/messages/with-attachment', auth, upload.single('file'), async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { text, attachmentType } = req.body;

        if (!req.file) {
            return res.status(400).json({ message: 'Attachment file is required' });
        }

        // Verify user is in conversation
        const conversation = await Conversation.findOne({
            _id: conversationId,
            participants: req.userId,
        });

        if (!conversation) {
            return res.status(404).json({ message: 'Conversation not found' });
        }

        const attachmentUrl = `http://localhost:3000/uploads/${req.file.filename}`;

        const message = new Message({
            conversation: conversationId,
            sender: req.userId,
            text: text ? text.trim() : '',
            attachmentUrl,
            attachmentType: attachmentType || 'file'
        });

        await message.save();
        await message.populate('sender', 'name email profilePicture');

        // Update conversation's lastMessage
        conversation.lastMessage = message._id;
        await conversation.save();

        // Get recipient(s) for notification
        const recipientIds = conversation.participants.filter(
            (p) => p.toString() !== req.userId
        );

        // Create notification + emit via socket
        for (const recipientId of recipientIds) {
            try {
                const notification = new Notification({
                    recipient: recipientId,
                    sender: req.userId,
                    type: 'message',
                    text: text ? text.trim().substring(0, 60) : 'Sent an attachment',
                });
                await notification.save();
                await notification.populate('sender', 'name profilePicture');

                if (global.io && global.onlineUsers) {
                    const recipientSocketId = global.onlineUsers.get(recipientId.toString());
                    if (recipientSocketId) {
                        global.io.to(recipientSocketId).emit('new_notification', notification);
                    }
                }
            } catch (notifErr) {
                console.error('Notification error:', notifErr);
            }
        }

        // Emit the new message to the conversation room
        if (global.io) {
            global.io.to(conversationId).emit('new_message', {
                message,
                conversationId,
            });
        }

        res.status(201).json(message);
    } catch (err) {
        console.error('Send message with attachment error:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
