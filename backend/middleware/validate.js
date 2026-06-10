const logger = require('../utils/logger');

/**
 * Middleware to validate request body/query against a Zod schema
 * @param {import('zod').ZodSchema} schema 
 */
const validate = (schema) => (req, res, next) => {
  if (!schema) {
    console.error('CRITICAL: Schema passed to validate middleware is undefined!');
    return res.status(500).json({ message: 'Internal Server Error: Missing validation schema' });
  }

  try {
    const result = schema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({
        message: 'Validation Failed',
        errors: result.error.issues.map(err => ({
          path: err.path.join('.'),
          message: err.message
        }))
      });
    }
    
    next();
  } catch (error) {
    console.error('CRITICAL: Error during schema.safeParse:', error);
    next(error);
  }
};

module.exports = validate;
