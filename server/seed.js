const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { faker } = require('@faker-js/faker');
const dotenv = require('dotenv');

// Load env vars
dotenv.config();

// Models
const User = require('./models/User');
const Post = require('./models/Post');
const Message = require('./models/Message');
const Conversation = require('./models/Conversation');
const Notification = require('./models/Notification');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/message-node')
    .then(() => console.log('MongoDB Connected for Seeding'))
    .catch(err => {
        console.error('MongoDB Connection Error:', err);
        process.exit(1);
    });

const generateUsers = async (numUsers) => {
    const users = [];
    const password = await bcrypt.hash('password123', 12);

    // Specific main user for testing
    const mainUser = new User({
        name: 'Demo User',
        email: 'demo@example.com',
        password,
        status: 'Exploring the new Dribbble theme!',
        location: 'San Francisco, CA',
        website: 'https://demo.example.com',
        profilePicture: 'https://ui-avatars.com/api/?name=Demo+User&background=random'
    });
    await mainUser.save();
    users.push(mainUser);

    for (let i = 0; i < numUsers - 1; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const user = new User({
            name: `${firstName} ${lastName}`,
            email: faker.internet.email({ firstName, lastName }).toLowerCase(),
            password,
            status: faker.lorem.sentence(),
            location: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
            website: faker.internet.url(),
            profilePicture: `https://ui-avatars.com/api/?name=${firstName}+${lastName}&background=random`
        });
        await user.save();
        users.push(user);
    }

    // Add some followers/following relationships
    for (let user of users) {
        const numFollowers = faker.number.int({ min: 1, max: Math.min(5, users.length - 1) });
        const potentialFollowers = users.filter(u => u._id.toString() !== user._id.toString());
        const followers = faker.helpers.arrayElements(potentialFollowers, numFollowers);
        user.followers = followers.map(f => f._id);
        await user.save();

        for (let follower of followers) {
            if (!follower.following.includes(user._id)) {
                follower.following.push(user._id);
                await follower.save();
            }
        }
    }

    return users;
};

const generatePosts = async (users, numPosts) => {
    const posts = [];

    // AI/Tech related topics for authentic feel
    const techTopics = [
        'Exploring the new React 19 compiler capabilities. The performance gains are incredible!',
        'Just implemented a clean light/dark mode theme switching mechanism using Tailwind CSS variables. Design system feels so much more cohesive now.',
        'What\'s everyone\'s take on the latest AI models? The context window sizes are getting ridiculous.',
        'Just finished refactoring a massive legacy codebase. Typescript generic inference saved the day.',
        'Beautiful UI isn\'t just about colors, it\'s about whitespace and typography hierarchy. The Dribbble inspiration is real.',
        'Web sockets vs Server Sent Events for real-time notifications? I\'m leaning towards SSE for one-way flows.',
        'Framer Motion page transitions make SPAs feel like native native apps. Absolutely essential for modern web.',
        'Is anyone still using Redux in 2024? Zustand feels so much lighter and less boilerplate-heavy.'
    ];

    for (let i = 0; i < numPosts; i++) {
        const creator = faker.helpers.arrayElement(users);

        // Some posts have images, some don't
        const hasImage = faker.datatype.boolean(0.6); // 60% chance of image

        // Select a content string or generate a random one
        const content = faker.datatype.boolean(0.7) ? faker.helpers.arrayElement(techTopics) : faker.lorem.paragraphs(2);

        const post = new Post({
            title: faker.datatype.boolean(0.4) ? faker.lorem.sentence() : '',
            content: content,
            creator: creator._id,
            imageUrl: hasImage ? faker.image.urlLoremFlickr({ category: 'technology,abstract' }) : '',
            likes: [],
            comments: []
        });

        // Add random likes
        const numLikes = faker.number.int({ min: 0, max: Math.min(10, users.length) });
        const likers = faker.helpers.arrayElements(users, numLikes);
        post.likes = likers.map(l => l._id);

        // Add random comments
        const numComments = faker.number.int({ min: 0, max: 5 });
        for (let j = 0; j < numComments; j++) {
            post.comments.push({
                text: faker.lorem.sentence(),
                author: faker.helpers.arrayElement(users)._id,
                createdAt: faker.date.recent({ days: 30 })
            });
        }

        await post.save();

        // Add post to user's posts array
        creator.posts.push(post._id);
        await creator.save();

        posts.push(post);
    }
    return posts;
};

const generateConversationsAndMessages = async (users) => {
    // Generate a few conversations specifically for the demo user
    const demoUser = users.find(u => u.email === 'demo@example.com');
    if (!demoUser) return;

    const otherUsers = users.filter(u => u._id.toString() !== demoUser._id.toString());
    const chatPartners = faker.helpers.arrayElements(otherUsers, 4); // 4 conversations

    for (let partner of chatPartners) {
        let conversation = new Conversation({
            participants: [demoUser._id, partner._id]
        });
        await conversation.save();

        // Generate 5-15 messages per conversation
        const numMessages = faker.number.int({ min: 5, max: 15 });
        let lastMessage = null;

        for (let i = 0; i < numMessages; i++) {
            // Alternate senders, roughly 50/50 but keeping conversational flow
            const sender = faker.datatype.boolean() ? demoUser : partner;
            const message = new Message({
                conversation: conversation._id,
                sender: sender._id,
                text: faker.lorem.sentence(),
                createdAt: faker.date.recent({ days: 7 })
            });
            await message.save();
            lastMessage = message;
        }

        // Update conversation with last message
        conversation.lastMessage = lastMessage._id;
        await conversation.save();
    }
};

const generateNotifications = async (users, posts) => {
    const demoUser = users.find(u => u.email === 'demo@example.com');
    if (!demoUser) return;

    const otherUsers = users.filter(u => u._id.toString() !== demoUser._id.toString());

    // Generate ~10 notifications for the demo user
    for (let i = 0; i < 10; i++) {
        const sender = faker.helpers.arrayElement(otherUsers);
        const type = faker.helpers.arrayElement(['like', 'comment', 'follow']);
        let post = null;

        if (type === 'like' || type === 'comment') {
            const userPosts = posts.filter(p => p.creator.toString() === demoUser._id.toString());
            if (userPosts.length > 0) {
                post = faker.helpers.arrayElement(userPosts)._id;
            } else {
                continue; // Skip if no posts to like/comment on
            }
        }

        const notification = new Notification({
            recipient: demoUser._id,
            sender: sender._id,
            type,
            post: post,
            read: faker.datatype.boolean(0.3) // 30% chance already read
        });
        await notification.save();
    }
}


const seedDatabase = async () => {
    try {
        // Clear existing data
        console.log('Clearing existing data...');
        await User.deleteMany({});
        await Post.deleteMany({});
        await Message.deleteMany({});
        await Conversation.deleteMany({});
        await Notification.deleteMany({});

        console.log('Generating users...');
        const users = await generateUsers(15);
        console.log(`Created ${users.length} users.`);

        console.log('Generating posts...');
        const posts = await generatePosts(users, 30);
        console.log(`Created ${posts.length} posts.`);

        console.log('Generating conversations and messages...');
        await generateConversationsAndMessages(users);
        console.log('Created conversations and messages.');

        console.log('Generating notifications...');
        await generateNotifications(users, posts);
        console.log('Created notifications.');

        console.log('Database seeding completed successfully!');
        console.log('----------------------------------------');
        console.log('Demo Login Credentials:');
        console.log('Email: demo@example.com');
        console.log('Password: password123');
        console.log('----------------------------------------');

        process.exit(0);
    } catch (err) {
        console.error('Error seeding database:', err);
        process.exit(1);
    }
};

seedDatabase();
