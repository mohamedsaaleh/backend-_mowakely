const { Client } = require('./clients.model');
const { User } = require('../users/users.model');
const { AppError } = require('../../middlewares/error.middleware');

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
}

module.exports = new ClientService();