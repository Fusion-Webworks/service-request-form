const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  getUserProfile,
  forgotPassword,
  resetPassword
} = require('../services/authService');
const { protect } = require('../middleware/authMiddleware');

// @route    POST /api/v1/auth/register
// @desc     Register user
// @access   Public
router.post('/register', async (req, res, next) => {
  try {
    const user = await registerUser(req.body);
    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// @route    POST /api/v1/auth/login
// @desc     Login user
// @access   Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await loginUser(email, password);
    
    // Create token
    const token = user.getSignedJwtToken();

    res.status(200).json({ success: true, token });
  } catch (err) {
    next(err);
  }
});

// @route    GET /api/v1/auth/me
// @desc     Get current logged in user
// @access   Private
router.get('/me', protect, async (req, res, next) => {
  try {
    const user = await getUserProfile(req.user.id);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// @route    POST /api/v1/auth/forgotpassword
// @desc     Forgot password
// @access   Public
router.post('/forgotpassword', async (req, res, next) => {
  try {
    const result = await forgotPassword(req.body.email);
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

// @route    PUT /api/v1/auth/resetpassword/:resettoken
// @desc     Reset password
// @access   Public
router.put('/resetpassword/:resettoken', async (req, res, next) => {
  try {
    const user = await resetPassword(req.params.resettoken, req.body.password);
    res.status(200).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;