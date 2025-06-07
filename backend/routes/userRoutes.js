const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const ErrorResponse = require('../utils/errorResponse');

// @route    GET /api/v1/users
// @desc     Get all users
// @access   Private/Admin
router.get('/', protect, async (req, res, next) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, data: users });
  } catch (err) {
    next(err);
  }
});

// @route    GET /api/v1/users/:id
// @desc     Get single user
// @access   Private/Admin
router.get('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// @route    PUT /api/v1/users/:id
// @desc     Update user
// @access   Private/Admin
router.put('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// @route    DELETE /api/v1/users/:id
// @desc     Delete user
// @access   Private/Admin
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return next(new ErrorResponse(`User not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

module.exports = router;