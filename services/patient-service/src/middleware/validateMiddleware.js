export const validate = (validator) => {
  return (req, res, next) => {
    const errors = validator(req.body);

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};