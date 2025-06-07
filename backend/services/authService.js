const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

exports.registerUser = async (userData) => {
  // Check if user exists
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    throw new ErrorResponse('User already exists', 400);
  }

  // Create user
  const user = await User.create(userData);
  return user;
};

exports.loginUser = async (email, password) => {
  // Validate email & password
  if (!email || !password) {
    throw new ErrorResponse('Please provide an email and password', 400);
  }

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw new ErrorResponse('Invalid credentials', 401);
  }

  return user;
};

exports.getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ErrorResponse('User not found', 404);
  }
  return user;
};

exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new ErrorResponse('No user with that email', 404);
  }

  // Get reset token
  const resetToken = user.getResetPasswordToken();
  await user.save({ validateBeforeSave: false });

  // Create reset URL
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  const message = `You are receiving this email because you (or someone else) has requested the reset of a password. Please make a PUT request to: \n\n ${resetUrl}`;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Password reset token',
      message
    });

    return { success: true, data: 'Email sent' };
  } catch (err) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save({ validateBeforeSave: false });

    throw new ErrorResponse('Email could not be sent', 500);
  }
};

exports.resetPassword = async (resetToken, newPassword) => {
  // Hash token
  const resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() }
  });

  if (!user) {
    throw new ErrorResponse('Invalid token', 400);
  }

  // Set new password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  return user;
};