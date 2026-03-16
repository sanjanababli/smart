import { HTTP_STATUS } from "../constants/httpStatus.js";

export const getHealth = (req, res) => {
  res.status(HTTP_STATUS.OK).json({
    status: "ok",
    service: "smart-inventory-api",
    uptime: process.uptime()
  });
};
