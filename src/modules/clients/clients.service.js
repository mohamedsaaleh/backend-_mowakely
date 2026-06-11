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

  async createClient(clientData) {
    const existingUser = await User.findOne({ email: clientData.email.toLowerCase() });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(clientData.password, 12);

    const user = await User.create({
      email: clientData.email.toLowerCase(),
      password: hashedPassword,
      role: 'client',
      full_name: clientData.full_name,
      phone: clientData.phone,
      city: clientData.city || '',
      address: clientData.address || '',
      bio: clientData.bio || '',
      profile_photo: clientData.profile_photo || null,
      is_verified: clientData.is_verified || false
    });

    const client = await Client.create({ user: user._id });
    
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