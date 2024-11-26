const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const {Post,Comment} = require('../models/post'); 
const cors = require('cors');

const mongoose = require('mongoose');
const router = express.Router()
router.use(cors());

router.post('/register', async (req, res) => {
  const { username, name, email, password, phone } = req.body;

  try {
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Email or Username already taken.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      name,
      email,
      password: hashedPassword,
      phone,
    });

    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, 'token', { expiresIn: '1h' });

    res.status(201).json({ message: 'User registered successfully!', token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/login', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Check if the password and user.password are both valid
      if (!password || !user.password) {
        console.log("1");
        return res.status(400).json({ message: 'Invalid credentials' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);  
    if (!isMatch) {
          console.log("2");
        return res.status(400).json({ message: 'Invalid credentials' });
      }
  
      const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
  
      res.status(200).json({ message: 'Login successful', token });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

// Profile Update Route
router.put('/profile', async (req, res) => {
  const { userId, name, bio, profilePicture } = req.body;

  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, bio, profilePicture },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// View Profile Route
router.get('/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    const user = await User.findById(userId).populate('followers following', 'username name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Follow Route
router.post('/follow', async (req, res) => {
  const { userId, targetUserId } = req.body;

  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID(s)' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (user.following.includes(targetUserId)) {
      return res.status(400).json({ message: 'You are already following this user' });
    }

    user.following.push(targetUserId);
    targetUser.followers.push(userId);

    await user.save();
    await targetUser.save();

    res.status(200).json({ message: 'Followed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while following the user' });
  }
});

// Unfollow Route
router.post('/unfollow', async (req, res) => {
  const { userId, targetUserId } = req.body;

  if (!mongoose.Types.ObjectId.isValid(userId) || !mongoose.Types.ObjectId.isValid(targetUserId)) {
    return res.status(400).json({ error: 'Invalid user ID(s)' });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({ error: 'Target user not found' });
    }

    if (!user.following.includes(targetUserId)) {
      return res.status(400).json({ message: 'You are not following this user' });
    }

    // Remove the target user from the user's following list and remove the user from the target user's followers list
    user.following = user.following.filter(id => id.toString() !== targetUserId.toString());
    targetUser.followers = targetUser.followers.filter(id => id.toString() !== userId.toString());

    await user.save();
    await targetUser.save();

    res.status(200).json({ message: 'Unfollowed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while unfollowing the user' });
  }
});

router.post('/post', async (req, res) => {
    const { userId, caption, image } = req.body; // Add other fields like content, image URL, etc.
  
    try {
      // Create a new post object
      const newPost = new Post({
        author: userId,
        caption,
        image, // Image array passed from client
      });
  
      // Save the post to the database
      await newPost.save();
  
      // Find the user by their userId and add the post to the user's posts array
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Add the post ID to the user's posts array
      user.posts.push(newPost._id);
      await user.save();
  
      // Respond with success
      res.status(201).json({
        message: 'Post created successfully!',
        post: newPost,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  router.post('/post/:postId/comment', async (req, res) => {
    const { postId } = req.params;
    const { userId, content } = req.body;
  
    try {
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid userId format' });
      }
  
      const post = await Post.findById(postId);
      if (!post) {
        return res.status(404).json({ message: 'Post not found' });
      }
  
      // Validate content
      if (!content || content.trim() === '') {
        return res.status(400).json({ message: 'Content cannot be empty' });
      }
  
      // Push the comment to the post
      post.comments.push({ userId, content, createdAt: new Date() });
  
      await post.save();
  
      res.status(200).json({ message: 'Comment added successfully', post });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
// Delete User Route
router.delete('/delete', async (req, res) => {
  const { userId } = req.body;

  try {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});
router.get('/', async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('author', 'username profilePicture')
      .populate('comments');
    res.status(200).send(posts);
  } catch (error) {
    res.status(500).send('Error fetching posts:', error.message);
  }
});
router.post('/:postId/like', async (req, res) => {
  const { postId } = req.params;
  const { userId } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).send('Post not found');
    }

    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.status(200).send(post);
  } catch (error) {
    res.status(500).send('Error toggling like:', error.message);
  }
});

module.exports = router;
