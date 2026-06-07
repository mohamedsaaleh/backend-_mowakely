const caseService = require('./cases.service');
const { Client } = require('../clients/clients.model');
const { Lawyer } = require('../lawyers/lawyers.model');

class CaseController {
  async create(req, res, next) {
    try {
      const legalCase = await caseService.create(req.body, req.user._id);
      res.status(201).json({
        success: true,
        data: legalCase
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req, res, next) {
    try {
      const result = await caseService.getAll(req.query, req.user);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const legalCase = await caseService.getById(req.params.id, req.user);
      res.json({
        success: true,
        data: legalCase
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyCases(req, res, next) {
    try {
      const client = await Client.findOne({ user: req.user._id });
      if (!client) {
        return res.status(404).json({
          success: false,
          message: 'Client profile not found'
        });
      }
      const result = await caseService.getByClient(client._id, req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async getLawyerCases(req, res, next) {
    try {
      const lawyer = await Lawyer.findOne({ user: req.user._id });
      if (!lawyer) {
        return res.status(404).json({
          success: false,
          message: 'Lawyer profile not found'
        });
      }
      const result = await caseService.getByLawyer(lawyer._id, req.query);
      res.json({
        success: true,
        ...result
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const legalCase = await caseService.update(
        req.params.id,
        req.body,
        req.user._id,
        req.user.role
      );
      res.json({
        success: true,
        data: legalCase
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req, res, next) {
    try {
      await caseService.delete(req.params.id, req.user._id, req.user.role);
      res.json({
        success: true,
        message: 'Case deleted successfully'
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const { status } = req.body;
      const legalCase = await caseService.updateStatus(req.params.id, status);
      res.json({
        success: true,
        data: legalCase
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new CaseController();