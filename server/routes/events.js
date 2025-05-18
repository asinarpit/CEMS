const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const Event = require('../models/Event');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/events
// @desc    Get all events
// @access  Public
router.get('/', async (req, res) => {
  try {
    const events = await Event.find()
      .populate('organizer', 'name email')
      .sort({ startDate: 1 });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   GET /api/events/:id
// @desc    Get event by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('organizer', 'name email')
      .populate('registeredUsers', 'name email');
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.json({
      success: true,
      data: event
    });
  } catch (err) {
    console.error(err.message);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/events
// @desc    Create an event
// @access  Private/Admin,Organizer
router.post(
  '/',
  [
    protect,
    authorize('admin', 'organizer'),
    [
      check('title', 'Title is required').not().isEmpty(),
      check('description', 'Description is required').not().isEmpty(),
      check('startDate', 'Start date is required').not().isEmpty(),
      check('endDate', 'End date is required').not().isEmpty(),
      check('location', 'Location is required').not().isEmpty(),
      check('category', 'Category is required').not().isEmpty(),
      check('capacity', 'Capacity is required').isNumeric()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      isPaid,
      price,
      capacity,
      image
    } = req.body;

    try {
      const newEvent = new Event({
        title,
        description,
        startDate,
        endDate,
        location,
        category,
        isPaid: isPaid || false,
        price: price || 0,
        capacity,
        organizer: req.user.id,
        image: image || 'default-event.jpg'
      });

      const event = await newEvent.save();

      res.status(201).json({
        success: true,
        data: event
      });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   PUT /api/events/:id
// @desc    Update an event
// @access  Private/Admin,Organizer
router.put(
  '/:id',
  [
    protect,
    authorize('admin', 'organizer')
  ],
  async (req, res) => {
    const {
      title,
      description,
      startDate,
      endDate,
      location,
      category,
      isPaid,
      price,
      capacity,
      image,
      isActive
    } = req.body;

    // Build event object
    const eventFields = {};
    if (title) eventFields.title = title;
    if (description) eventFields.description = description;
    if (startDate) eventFields.startDate = startDate;
    if (endDate) eventFields.endDate = endDate;
    if (location) eventFields.location = location;
    if (category) eventFields.category = category;
    if (isPaid !== undefined) eventFields.isPaid = isPaid;
    if (price !== undefined) eventFields.price = price;
    if (capacity) eventFields.capacity = capacity;
    if (image) eventFields.image = image;
    if (isActive !== undefined) eventFields.isActive = isActive;

    try {
      let event = await Event.findById(req.params.id);

      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }

      // Check if user is event organizer or admin
      if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(401).json({ message: 'Not authorized to update this event' });
      }

      event = await Event.findByIdAndUpdate(
        req.params.id,
        { $set: eventFields },
        { new: true }
      );

      res.json({
        success: true,
        data: event
      });
    } catch (err) {
      console.error(err.message);
      if (err.kind === 'ObjectId') {
        return res.status(404).json({ message: 'Event not found' });
      }
      res.status(500).json({ message: 'Server Error' });
    }
  }
);

// @route   DELETE /api/events/:id
// @desc    Delete an event
// @access  Private/Admin,Organizer
router.delete('/:id', protect, authorize('admin', 'organizer'), async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    // Check if user is event organizer or admin
    if (event.organizer.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this event' });
    }

    await event.deleteOne();

    res.json({ 
      success: true,
      message: 'Event removed' 
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/events/register/:id
// @desc    Register for an event
// @access  Private
router.post('/register/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if event is active
    if (!event.isActive) {
      return res.status(400).json({ message: 'This event is no longer active' });
    }

    // Check if already registered
    if (event.registeredUsers.some(userId => userId.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Already registered for this event' });
    }

    // Check if event capacity is reached
    if (event.registeredUsers.length >= event.capacity) {
      return res.status(400).json({ message: 'Event capacity reached' });
    }

    // If paid event, redirect to payment route (handled in frontend)
    if (event.isPaid) {
      return res.json({
        success: true,
        isPaid: true,
        message: 'Payment required for registration',
        data: {
          event: event._id,
          price: event.price
        }
      });
    }

    // Add user to event registrations
    event.registeredUsers.push(req.user.id);
    await event.save();

    // Add event to user's registered events
    user.registeredEvents.push(event._id);
    await user.save();

    res.json({
      success: true,
      isPaid: false,
      message: 'Successfully registered for event',
      data: event
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

// @route   POST /api/events/unregister/:id
// @desc    Unregister from an event
// @access  Private
router.post('/unregister/:id', protect, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if registered
    if (!event.registeredUsers.some(userId => userId.toString() === req.user.id)) {
      return res.status(400).json({ message: 'Not registered for this event' });
    }

    // Remove user from event registrations
    event.registeredUsers = event.registeredUsers.filter(
      userId => userId.toString() !== req.user.id
    );
    await event.save();

    // Remove event from user's registered events
    user.registeredEvents = user.registeredEvents.filter(
      eventId => eventId.toString() !== req.params.id
    );
    await user.save();

    res.json({
      success: true,
      message: 'Successfully unregistered from event'
    });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Event not found' });
    }
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router; 