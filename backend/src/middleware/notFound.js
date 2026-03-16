import { HTTP_STATUS } from "../constants/httpStatus.js";

export const notFound = (req, res) => {
  res.status(HTTP_STATUS.NOT_FOUND).json({
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
};
