import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";

export const validateObjectId = (req, _res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid resource id"));
  }

  return next();
};
