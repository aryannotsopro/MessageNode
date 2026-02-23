const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  email: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'I am new!'
  },
  profilePicture: {
    type: String,
    default: ''
  },
  coverPicture: {
    type: String,
    default: ''
  },
  location: {
    type: String,
    default: ''
  },
  website: {
    type: String,
    default: ''
  },
  posts: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }],
  // NEW: Followers & Following
  followers: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  // NEW: Bookmarks
  bookmarks: [{
    type: Schema.Types.ObjectId,
    ref: 'Post'
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);