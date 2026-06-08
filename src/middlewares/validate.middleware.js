const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message.replace(/"/g, '')
      }));
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors
      });
    }
    req.body = value;
    next();
  };
};

module.exports = { validate };