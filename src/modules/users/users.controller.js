const usersService = require('./users.service');
const { successResponse, errorResponse } = require('../../utils/apiResponse');

class UsersController {
  async getAll(req, res, next) {
    try {
      const result = await usersService.getAllUsers(req.query);
      return successResponse(res, 'Users retrieved successfully', result);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await usersService.getUserById(req.params.id);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      return successResponse(res, 'User retrieved successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const user = await usersService.updateUser(req.params.id, req.body);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      return successResponse(res, 'User updated successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      const user = await usersService.deleteUser(req.params.id);
      if (!user) {
        return errorResponse(res, 'User not found', 404);
      }
      return successResponse(res, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async toggleActive(req, res, next) {
    try {
      const { isActive } = req.body;
      const user = await usersService.toggleActive(req.params.id, isActive);
      if (!user) return errorResponse(res, 'User not found', 404);
      return successResponse(res, 'User active status updated', user);
    } catch (error) {
      next(error);
    }
  }

  async banUser(req, res, next) {
    try {
      const user = await usersService.toggleBanUser(req.params.id, true);
      if (!user) return errorResponse(res, 'User not found', 404);
      return successResponse(res, 'User banned successfully', user);
    } catch (error) {
      next(error);
    }
  }

  async unbanUser(req, res, next) {
    try {
      const user = await usersService.toggleBanUser(req.params.id, false);
      if (!user) return errorResponse(res, 'User not found', 404);
      return successResponse(res, 'User unbanned successfully', user);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UsersController();