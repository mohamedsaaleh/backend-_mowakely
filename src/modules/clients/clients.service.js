const { Client } = require('./clients.model');
const { User } = require('../users/users.model');
const { AppError } = require('../../middlewares/error.middleware');
const QueryBuilder = require('../../utils/queryBuilder');

class ClientService {
  async getProfile(userId) {
    const client = await Client.findOne({ user: userId })
      .populate('user', 'full_name email phone profile_photo city address bio');
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

    const userUpdateFields = {};
    if (updateData.full_name) userUpdateFields.full_name = updateData.full_name;
    if (updateData.phone) userUpdateFields.phone = updateData.phone;
    if (updateData.city) userUpdateFields.city = updateData.city;
    if (updateData.address) userUpdateFields.address = updateData.address;
    if (updateData.bio) userUpdateFields.bio = updateData.bio;
    if (updateData.profile_photo) userUpdateFields.profile_photo = updateData.profile_photo;

    if (Object.keys(userUpdateFields).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdateFields);
    }

    return await Client.findById(client._id)
      .populate('user', 'full_name email phone profile_photo city address bio');
  }

  async getAll(query = {}) {
    const result = await new QueryBuilder(Client)
      .filter(query)
      .sortBy(query.sort || '-created_at')
      .withPagination(query.page, query.limit)
      .populateFields('user:full_name email profile_photo')
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

    const client = await Client.create({ user: userId });
    return await Client.findById(client._id)
      .populate('user', 'full_name email phone profile_photo city address bio');
  }

  async getById(clientId) {
    const client = await Client.findById(clientId)
      .populate('user', 'full_name email phone profile_photo city address bio');
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

    const userUpdateFields = {};
    if (updateData.full_name) userUpdateFields.full_name = updateData.full_name;
    if (updateData.phone) userUpdateFields.phone = updateData.phone;
    if (updateData.city) userUpdateFields.city = updateData.city;
    if (updateData.address) userUpdateFields.address = updateData.address;
    if (updateData.bio) userUpdateFields.bio = updateData.bio;
    if (updateData.profile_photo) userUpdateFields.profile_photo = updateData.profile_photo;

    if (Object.keys(userUpdateFields).length > 0) {
      await User.findByIdAndUpdate(client.user, userUpdateFields);
    }

    return await Client.findById(clientId)
      .populate('user', 'full_name email phone profile_photo city address bio');
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