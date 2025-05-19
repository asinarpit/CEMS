const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Event = require('../models/Event');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private/Admin
router.get('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private/Admin
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  const { name, email, role, department, year } = req.body;
  
  // Build user object
  const userFields = {};
  if (name) userFields.name = name;
  if (email) userFields.email = email;
  if (role) userFields.role = role;
  if (department) userFields.department = department;
  if (year) userFields.year = year;
  
  try {
    let user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: userFields },
      { new: true }
    ).select('-password');
    
    res.json({
      success: true,
      data: user
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    await user.deleteOne();
    
    res.json({ 
      success: true,
      message: 'User removed' 
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/users/registered-events
// @desc    Get events registered by the authenticated user
// @access  Private
router.get('/registered-events', protect, async (req, res) => {
  try {
    // Find the user and populate their registered events
    const user = await User.findById(req.user.id)
      .select('registeredEvents')
      .populate({
        path: 'registeredEvents',
        select: 'title description startDate endDate location category isPaid price organizer image isActive',
        populate: {
          path: 'organizer',
          select: 'name email'
        }
      });
    
    if (!user) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: user.registeredEvents || []
    });
  } catch (err) {
    console.error('Error fetching user registered events:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Server Error' 
    });
  }
});

module.exports = router; 