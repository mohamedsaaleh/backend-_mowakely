const clientService = require('./clients.service');

class ClientController {
  async getMyProfile(req, res, next) {
    try {
      const client = await clientService.getProfile(req.user._id);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async updateMyProfile(req, res, next) {
    try {
      const client = await clientService.updateProfile(req.user._id, req.body);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientController();