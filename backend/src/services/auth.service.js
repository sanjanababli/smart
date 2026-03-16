import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { HTTP_STATUS } from "../constants/httpStatus.js";
import { User } from "../models/User.js";
import { RegistrationOtp } from "../models/RegistrationOtp.js";
import { PasswordResetOtp } from "../models/PasswordResetOtp.js";
import { ApiError } from "../utils/ApiError.js";
import { sendRegistrationOtpEmail, sendPasswordResetOtpEmail } from "./mail.service.js";

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  ownerId: user.ownerId,
  createdAt: user.createdAt
});

const signToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email
    },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn }
  );

const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const hashOtp = async (otp) => bcrypt.hash(otp, 10);

const verifyOtp = async (otp, hashedOtp) => bcrypt.compare(otp, hashedOtp);

export const registerUser = async ({ name, email, password, role, ownerId }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new ApiError(HTTP_STATUS.CONFLICT, "User already exists with this email");
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const hashedPassword = await bcrypt.hash(password, 10);

  const expiresAt = new Date(Date.now() + env.registrationOtpExpiryMinutes * 60 * 1000);

  await RegistrationOtp.findOneAndUpdate(
    { email: normalizedEmail },
    {
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role,
      ownerId,
      otpHash,
      expiresAt
    },
    { upsert: true, new: true }
  );

  await sendRegistrationOtpEmail({ email: normalizedEmail, otp, name });

  return { message: "OTP sent to your email. Please verify to complete registration." };
};

export const verifyRegistrationOtp = async ({ email, otp }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const registrationOtp = await RegistrationOtp.findOne({ email: normalizedEmail });

  if (!registrationOtp) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "OTP expired or invalid. Please register again.");
  }

  const isOtpValid = await verifyOtp(otp, registrationOtp.otpHash);
  if (!isOtpValid) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid OTP");
  }

  const user = await User.create({
    name: registrationOtp.name,
    email: normalizedEmail,
    password: registrationOtp.password,
    role: registrationOtp.role,
    ownerId: registrationOtp.ownerId
  });

  await RegistrationOtp.deleteOne({ email: normalizedEmail });

  return sanitizeUser(user);
};

export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid email or password");
  }

  return {
    token: signToken(user),
    user: sanitizeUser(user)
  };
};

export const forgotPassword = async (email) => {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ApiError(HTTP_STATUS.NOT_FOUND, "User not found with this email");
  }

  const otp = generateOtp();
  const otpHash = await hashOtp(otp);
  const expiresAt = new Date(Date.now() + env.registrationOtpExpiryMinutes * 60 * 1000);

  await PasswordResetOtp.findOneAndUpdate(
    { email: normalizedEmail },
    { email: normalizedEmail, otpHash, expiresAt },
    { upsert: true, new: true }
  );

  await sendPasswordResetOtpEmail({ email: normalizedEmail, otp });

  return { message: "Password reset OTP sent to your email." };
};

export const resetPassword = async ({ email, otp, newPassword }) => {
  const normalizedEmail = email.trim().toLowerCase();
  const resetOtp = await PasswordResetOtp.findOne({ email: normalizedEmail });

  if (!resetOtp) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "OTP expired or invalid. Please try again.");
  }

  const isOtpValid = await verifyOtp(otp, resetOtp.otpHash);
  if (!isOtpValid) {
    throw new ApiError(HTTP_STATUS.BAD_REQUEST, "Invalid OTP");
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await User.findOneAndUpdate({ email: normalizedEmail }, { password: hashedPassword });

  await PasswordResetOtp.deleteOne({ email: normalizedEmail });

  return { message: "Password reset successfully. You can log in now." };
};

export const verifyAuthToken = (token) => {
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch {
    throw new ApiError(HTTP_STATUS.UNAUTHORIZED, "Invalid or expired token");
  }
};
