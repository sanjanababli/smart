import { User } from "../models/User.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { ApiError } from "../utils/ApiError.js";
import { verifyAuthToken } from "../services/auth.service.js";

export const protect = async (req, _res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authorization token is required"));
    }

    const token = authorization.split(" ")[1];
    const payload = verifyAuthToken(token);
    const user = await User.findById(payload.sub);

    if (!user) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, "Authenticated user no longer exists"));
    }

    req.user = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    };

    return next();
  } catch (error) {
    return next(error);
  }
};
