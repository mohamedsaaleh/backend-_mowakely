const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const config = require('../../config/env');
const { User } = require('../users/users.model');
const { Lawyer } = require('../lawyers/lawyers.model');
const { Client } = require('../clients/clients.model');
const { RefreshToken } = require('../refresh-tokens/refresh-tokens.model');
const { AppError } = require('../../middlewares/error.middleware');
const { generateEmailVerificationToken, generatePasswordResetToken, hashToken } = require('../../utils/crypto');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../../utils/email');
const logger = require('../../utils/logger');

class AuthService {
  async register(userData, userAgent = 'unknown', ipAddress = 'unknown') {
    const existingUser = await User.findOne({ email: userData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const verificationToken = generateEmailVerificationToken();
    const user = await User.create({
      email: userData.email.toLowerCase(),
      password: userData.password,
      role: userData.role,
      full_name: userData.full_name,
      phone: userData.phone,
      city: userData.city || '',
      address: userData.address || '',
      bio: userData.bio || '',
      profile_photo: userData.profile_photo || null,
      emailVerificationToken: hashToken(verificationToken),
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    if (userData.role === 'lawyer') {
      await Lawyer.create({
        user: user._id,
        specialization: userData.specialization || '',
        years_of_experience: userData.years_of_experience || 0,
        office_address: userData.office_address || ''
      });
    } else if (userData.role === 'client') {
      await Client.create({
        user: user._id,
        email: user.email,
        role: user.role,
        status: user.status,
        full_name: user.full_name,
        phone: user.phone,
        city: user.city,
        address: user.address,
        bio: user.bio,
        profile_photo: user.profile_photo,
        is_verified: user.is_verified,
        is_banned: user.is_banned
      });
    }

    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (error) {
      logger.warn('Failed to send verification email:', error.message);
    }

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = await this.generateRefreshToken(user._id, userAgent, ipAddress);

    return {
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified
      },
      accessToken,
      refreshToken
    };
  }

  async login(email, password, userAgent = 'unknown', ipAddress = 'unknown') {
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    logger.debug(`Login attempt for email: ${email.toLowerCase()}`);

    if (!user) {
      logger.warn(`Login failed: user not found for email: ${email.toLowerCase()}`);
      throw new AppError('Invalid email or password', 401);
    }

    logger.debug(`User found: ${user._id}, password length: ${user.password ? user.password.length : 0}`);

    const isBcrypt = user.password && user.password.startsWith('$2');
    let passwordValid = false;

    if (!isBcrypt) {
      logger.warn(`Legacy plain-text password detected for user: ${user._id}`);
      passwordValid = password === user.password;
    } else {
      passwordValid = await user.comparePassword(password);
    }

    if (!passwordValid) {
      logger.warn(`Login failed: password mismatch for user: ${user._id}`);
      throw new AppError('Invalid email or password', 401);
    }

    if (user.is_banned) {
      throw new AppError('Your account has been banned', 403);
    }

    if (!isBcrypt) {
      const salt = await bcrypt.genSalt(12);
      const hashedPassword = await bcrypt.hash(password, salt);
      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            password: hashedPassword,
            lastLogin: new Date()
          }
        }
      );
      logger.info(`Password migrated for legacy user: ${user._id}`);
    } else {
      user.lastLogin = new Date();
      await user.save();
    }

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = await this.generateRefreshToken(user._id, userAgent, ipAddress);

    let profile = null;
    if (user.role === 'lawyer') {
      profile = await Lawyer.findOne({ user: user._id });
    } else if (user.role === 'client') {
      profile = await Client.findOne({ user: user._id });
    }

    return {
      user: {
        id: user._id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        profile_photo: user.profile_photo,
        is_verified: user.is_verified
      },
      profile,
      accessToken,
      refreshToken
    };
  }

  async refreshToken(refreshTokenValue, userAgent = 'unknown', ipAddress = 'unknown') {
    const hashedToken = hashToken(refreshTokenValue);

    const refreshTokenDoc = await RefreshToken.findOne({
      token: hashedToken,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).populate('user');

    if (!refreshTokenDoc) {
      throw new AppError('Invalid or expired refresh token', 401);
    }

    await RefreshToken.updateMany(
      { user: refreshTokenDoc.user._id },
      { $set: { isRevoked: true } }
    );

    const user = refreshTokenDoc.user;

    const newAccessToken = this.generateAccessToken(user._id);
    const newRefreshToken = await this.generateRefreshToken(user._id, userAgent, ipAddress);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken
    };
  }

  async logout(userId, refreshTokenValue) {
    if (refreshTokenValue && typeof refreshTokenValue === 'string') {
      const hashedToken = hashToken(refreshTokenValue);

      await RefreshToken.findOneAndUpdate(
        { token: hashedToken, user: userId },
        { $set: { isRevoked: true } }
      );
    }

    await RefreshToken.updateMany(
      { user: userId },
      { $set: { isRevoked: true } }
    );

    return { message: 'Logged out successfully' };
  }

  async verifyEmail(token) {
    // const hashedToken = hashToken(token);

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() }
    });

    if (!user) {
      throw new AppError('Invalid or expired verification token', 400);
    }

    user.is_verified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return { message: 'Email verified successfully' };
  }

  async forgotPassword(email) {
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return { message: 'If the email exists, a reset link will be sent' };
    }

    const resetToken = generatePasswordResetToken();
    user.passwordResetToken = hashToken(resetToken);
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    try {
      await sendPasswordResetEmail(user, resetToken);
    } catch (error) {
      logger.warn('Failed to send password reset email:', error.message);
    }

    return { message: 'If the email exists, a reset link will be sent' };
  }

  async resetPassword(token, newPassword) {
    const hashedToken = hashToken(token);

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: new Date() }
    }).select('+password');

    if (!user) {
      throw new AppError('Invalid or expired reset token', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await RefreshToken.updateMany(
      { user: user._id },
      { $set: { isRevoked: true } }
    );

    await user.save();

    return { message: 'Password reset successfully' };
  }

  async getMe(userId) {
    const user = await User.findById(userId);

    if (!user) {
      throw new AppError('User not found', 404);
    }

    let profile = null;
    if (user.role === 'lawyer') {
      profile = await Lawyer.findOne({ user: user._id });
    } else if (user.role === 'client') {
      profile = await Client.findOne({ user: user._id });
    }

    return { user, profile };
  }

  generateAccessToken(userId) {
    return jwt.sign({ id: userId, type: 'access' }, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
  }

  async generateRefreshToken(userId, userAgent, ipAddress) {
    const token = require('crypto').randomBytes(64).toString('hex');
    const hashedToken = hashToken(token);

    await RefreshToken.create({
      user: userId,
      token: hashedToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      userAgent,
      ipAddress
    });

    return token;
  }
}

module.exports = new AuthService();