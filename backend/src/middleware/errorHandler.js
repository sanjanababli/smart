import { HTTP_STATUS } from "../constants/httpStatus.js";
import { logger } from "../config/logger.js";

export const errorHandler = (err, req, res, _next) => {
  const status = err.statusCode ?? HTTP_STATUS.INTERNAL_SERVER_ERROR;

  logger.error(err.message, {
    status,
    method: req.method,
    path: req.originalUrl,
    stack: err.stack
  });

  res.status(status).json({
    message: err.message || "Internal server error",
    details: err.details || null
  });
};
