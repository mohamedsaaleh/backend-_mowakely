const { Client } = require('./clients.model');
const { User } = require('../users/users.model');
const { AppError } = require('../../middlewares/error.middleware');
const QueryBuilder = require('../../utils/queryBuilder');

class ClientService {
  async getProfile(userId) {
    const client = await Client.findOne({ user: userId })
      .populate('user', '-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
    if (!client) {
      throw new AppError('Client profile not found', 404);
    }
    return client;
  }

  async updateProfile(userId, updateData) {
    const client = await Client.findOne({ user: userId });
    if (!client) {
      throw new AppError('Client profile not found', 404);
    }

    const updateFields = {};
    const allowedFields = ['full_name', 'phone', 'city', 'address', 'bio', 'profile_photo'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) updateFields[field] = updateData[field];
    });

    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(userId, updateFields);
      await Client.findByIdAndUpdate(client._id, updateFields);
    }

    return await Client.findById(client._id)
      .populate('user', '-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
  }

  async getAll(query = {}) {
    const result = await new QueryBuilder(Client)
      .filter(query)
      .sortBy(query.sort || '-created_at')
      .withPagination(query.page, query.limit)
      .populateFields('user:-password -emailVerificationToken -passwordResetToken -passwordResetExpires')
      .execute();

    return result;
  }

  async createClient(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const existingClient = await Client.findOne({ user: userId });
    if (existingClient) {
      throw new AppError('Client profile already exists for this user', 400);
    }

    const client = await Client.create({
      user: userId,
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
    
    return await Client.findById(client._id)
      .populate('user', '-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
  }

  async getById(clientId) {
    const client = await Client.findById(clientId)
      .populate('user', '-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
    if (!client) {
      throw new AppError('Client not found', 404);
    }
    return client;
  }

  async updateClient(clientId, updateData) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    const updateFields = {};
    const allowedFields = ['full_name', 'phone', 'city', 'address', 'bio', 'profile_photo'];
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) updateFields[field] = updateData[field];
    });

    if (Object.keys(updateFields).length > 0) {
      await User.findByIdAndUpdate(client.user, updateFields);
      await Client.findByIdAndUpdate(clientId, updateFields);
    }

    return await Client.findById(clientId)
      .populate('user', '-password -emailVerificationToken -passwordResetToken -passwordResetExpires');
  }

  async deleteClient(clientId) {
    const client = await Client.findById(clientId);
    if (!client) {
      throw new AppError('Client not found', 404);
    }

    await Client.findByIdAndDelete(clientId);
    return { message: 'Client deleted successfully' };
  }
}

module.exports = new ClientService();