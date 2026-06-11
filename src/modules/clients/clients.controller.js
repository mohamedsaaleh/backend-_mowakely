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

  async getAll(req, res, next) {
    try {
      const result = await clientService.getAll(req.query);
      res.json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  }

  async create(req, res, next) {
    try {
      const client = await clientService.createClient(req.body);
      res.status(201).json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const client = await clientService.getById(req.params.id);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const client = await clientService.updateClient(req.params.id, req.body);
      res.json({ success: true, data: client });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await clientService.deleteClient(req.params.id);
      res.json({ success: true, message: 'Client deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ClientController();