const constants = require('../constants');

class ApiResponse {
  static success(res, data = null, message = 'Success', statusCode = constants.HTTP_STATUS.OK) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta: data?.meta || null
    });
  }

  static created(res, data = null, message = constants.API_MESSAGES.SUCCESS.CREATED) {
    return this.success(res, data, message, constants.HTTP_STATUS.CREATED);
  }

  static updated(res, data = null, message = constants.API_MESSAGES.SUCCESS.UPDATED) {
    return this.success(res, data, message, constants.HTTP_STATUS.OK);
  }

  static deleted(res, message = constants.API_MESSAGES.SUCCESS.DELETED) {
    return res.status(constants.HTTP_STATUS.NO_CONTENT).json({
      success: true,
      message
    });
  }

  static fetched(res, data, message = constants.API_MESSAGES.SUCCESS.FETCHED) {
    return this.success(res, data, message);
  }

  static error(res, message = constants.API_MESSAGES.ERROR.SERVER, statusCode = constants.HTTP_STATUS.INTERNAL_SERVER_ERROR, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors })
    });
  }
  //users ,clients,offers,messages,notifactions,reviews,invoices,payouts,admin

  static badRequest(res, message = constants.API_MESSAGES.ERROR.VALIDATION, errors = null) {
    return this.error(res, message, constants.HTTP_STATUS.BAD_REQUEST, errors);
  }

  static unauthorized(res, message = constants.API_MESSAGES.ERROR.UNAUTHORIZED) {
    return this.error(res, message, constants.HTTP_STATUS.UNAUTHORIZED);
  }

  static forbidden(res, message = constants.API_MESSAGES.ERROR.FORBIDDEN) {
    return this.error(res, message, constants.HTTP_STATUS.FORBIDDEN);
  }

  static notFound(res, message = constants.API_MESSAGES.ERROR.NOT_FOUND) {
    return this.error(res, message, constants.HTTP_STATUS.NOT_FOUND);
  }

  static conflict(res, message = constants.API_MESSAGES.ERROR.DUPLICATE) {
    return this.error(res, message, constants.HTTP_STATUS.CONFLICT);
  }

  static unprocessable(res, message = constants.API_MESSAGES.ERROR.VALIDATION, errors = null) {
    return this.error(res, message, constants.HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
  }

  static rateLimited(res, message = constants.API_MESSAGES.ERROR.RATE_LIMIT) {
    return this.error(res, message, constants.HTTP_STATUS.TOO_MANY_REQUESTS);
  }

  static paginated(res, data, pagination, message = constants.API_MESSAGES.SUCCESS.FETCHED) {
    return this.success(res, data, message, constants.HTTP_STATUS.OK);
  }
}

class ApiPaginatedResponse {
  constructor(data, count, page, limit, totalPages) {
    this.items = data;
    this.pagination = {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1
    };
  }
}

const successResponse = (res, message, data, statusCode = 200) => ApiResponse.success(res, data, message, statusCode);
const errorResponse = (res, message, statusCode = 500, errors = null) => ApiResponse.error(res, message, statusCode, errors);

module.exports = { 
  ApiResponse, 
  ApiPaginatedResponse,
  successResponse,
  errorResponse
};