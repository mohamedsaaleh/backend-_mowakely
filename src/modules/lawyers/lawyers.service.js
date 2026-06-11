const { Lawyer } = require('./lawyers.model');
const { User } = require('../users/users.model');
const { AppError } = require('../../middlewares/error.middleware');
const QueryBuilder = require('../../utils/queryBuilder');
const { cache } = require('../../utils/cache');
const constants = require('../../constants');

class LawyerService {
  async getProfile(userId) {
    const cacheKey = `lawyer:profile:${userId}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const lawyer = await Lawyer.findOne({ user: userId })
      .populate('user', 'full_name email phone profile_photo city bio address');
    
    if (!lawyer) {
      throw new AppError('Lawyer profile not found', 404);
    }

    await cache.set(cacheKey, lawyer, constants.CACHE.TTL.MEDIUM);
    return lawyer;
  }

  async updateProfile(userId, updateData) {
    const lawyer = await Lawyer.findOne({ user: userId });
    if (!lawyer) {
      throw new AppError('Lawyer profile not found', 404);
    }

    const { specialization, years_of_experience, office_address, availability_status, rate } = updateData;
    
    if (specialization !== undefined) lawyer.specialization = specialization;
    if (years_of_experience !== undefined) lawyer.years_of_experience = years_of_experience;
    if (office_address !== undefined) lawyer.office_address = office_address;
    if (availability_status !== undefined) lawyer.availability_status = availability_status;
    if (rate !== undefined) lawyer.rate = rate;

    await lawyer.save();

    const userUpdateFields = {};
    if (updateData.full_name) userUpdateFields.full_name = updateData.full_name;
    if (updateData.city) userUpdateFields.city = updateData.city;
    if (updateData.address) userUpdateFields.address = updateData.address;
    if (updateData.bio) userUpdateFields.bio = updateData.bio;
    if (updateData.profile_photo) userUpdateFields.profile_photo = updateData.profile_photo;

    if (Object.keys(userUpdateFields).length > 0) {
      await User.findByIdAndUpdate(userId, userUpdateFields);
    }

    const updated = await Lawyer.findById(lawyer._id)
      .populate('user', 'full_name email phone profile_photo city bio address');

    await cache.del(`lawyer:profile:${userId}`);
    return updated;
  }

  async getAll(query = {}) {
    const cacheKey = `lawyers:list:${JSON.stringify(query)}`;
    
    const cached = await cache.get(cacheKey);
    if (cached && !query.search) return cached;

    const result = await new QueryBuilder(Lawyer)
      .filter({
        ...query,
        availability_status: query.availability_status !== undefined ? query.availability_status : true
      })
      .sortBy(query.sort || '-rate')
      .withPagination(query.page, query.limit)
      .populateFields('user:full_name profile_photo city')
      .execute();

    if (!query.search) {
      await cache.set(cacheKey, result, constants.CACHE.TTL.MEDIUM);
    }

    return result;
  }

  async getById(lawyerId) {
    const cacheKey = `lawyer:${lawyerId}`;
    
    const cached = await cache.get(cacheKey);
    if (cached) return cached;

    const lawyer = await Lawyer.findById(lawyerId)
      .populate('user', 'full_name email profile_photo phone city bio address');
    
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    await cache.set(cacheKey, lawyer, constants.CACHE.TTL.LONG);
    return lawyer;
  }

  async invalidateCache(lawyerId, userId) {
    await cache.del(`lawyer:${lawyerId}`);
    if (userId) {
      await cache.del(`lawyer:profile:${userId}`);
    }
    await cache.invalidatePrefix('lawyers:list');
  }

  async create(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    user.role = 'lawyer';
    await user.save();

    const lawyer = await Lawyer.create({ user: userId });
    
    return lawyer;
  }

  async updateById(lawyerId, updateData) {
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    const { specialization, years_of_experience, office_address, availability_status, rate } = updateData;
    
    if (specialization !== undefined) lawyer.specialization = specialization;
    if (years_of_experience !== undefined) lawyer.years_of_experience = years_of_experience;
    if (office_address !== undefined) lawyer.office_address = office_address;
    if (availability_status !== undefined) lawyer.availability_status = availability_status;
    if (rate !== undefined) lawyer.rate = rate;

    await lawyer.save();

    const userUpdateFields = {};
    if (updateData.full_name) userUpdateFields.full_name = updateData.full_name;
    if (updateData.city) userUpdateFields.city = updateData.city;
    if (updateData.address) userUpdateFields.address = updateData.address;
    if (updateData.bio) userUpdateFields.bio = updateData.bio;
    if (updateData.profile_photo) userUpdateFields.profile_photo = updateData.profile_photo;

    if (Object.keys(userUpdateFields).length > 0) {
      await User.findByIdAndUpdate(lawyer.user, userUpdateFields);
    }

    const updated = await Lawyer.findById(lawyer._id)
      .populate('user', 'full_name email profile_photo phone city bio address');

    await this.invalidateCache(lawyer._id, lawyer.user);
    return updated;
  }

  async deleteById(lawyerId) {
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      throw new AppError('Lawyer not found', 404);
    }

    await Lawyer.findByIdAndDelete(lawyerId);
    
    await this.invalidateCache(lawyerId, lawyer.user);
    
    return { message: 'Lawyer deleted successfully' };
  }

  async verifyLawyer(lawyerId, isVerified = true) {
    const lawyer = await Lawyer.findById(lawyerId);
    if (!lawyer) {
      throw new AppError('Lawyer profile not found', 404);
    }

    lawyer.is_verified = isVerified;
    if (isVerified) {
      lawyer.verification_date = new Date();
    }
    await lawyer.save();

    await User.findByIdAndUpdate(lawyer.user, { is_verified: isVerified });
    await this.invalidateCache(lawyer._id, lawyer.user);

    return await Lawyer.findById(lawyerId).populate('user', 'full_name email phone profile_photo');
  }
}

module.exports = new LawyerService();