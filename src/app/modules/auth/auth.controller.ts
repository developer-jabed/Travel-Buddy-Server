import { Request, Response } from "express";
import httpStatus from "http-status";
import config from "../../../config";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../../shared/sendResponse";
import { AuthServices } from "./auth.service";

// HELPER to parse time strings like "7d", "1y", etc.
const parseTime = (time: string, defaultMs: number) => {
  const unit = time.slice(-1);
  const value = parseInt(time.slice(0, -1));

  switch (unit) {
    case "y": return value * 365 * 24 * 60 * 60 * 1000;
    case "M": return value * 30 * 24 * 60 * 60 * 1000;
    case "w": return value * 7 * 24 * 60 * 60 * 1000;
    case "d": return value * 24 * 60 * 60 * 1000;
    case "h": return value * 60 * 60 * 1000;
    case "m": return value * 60 * 1000;
    case "s": return value * 1000;
    default: return defaultMs;
  }
};

// LOGIN USER
const loginUser = catchAsync(async (req: Request, res: Response) => {
  const result = await AuthServices.loginUser(req.body);
  const accessTokenMaxAge = parseTime(config.jwt.expires_in as string, 1000 * 60 * 60);
  const refreshTokenMaxAge = parseTime(config.jwt.refresh_token_expires_in as string, 1000 * 60 * 60 * 24 * 30);

  res.cookie("accessToken", result.accessToken, { secure: true, httpOnly: true, sameSite: "none", maxAge: accessTokenMaxAge });
  res.cookie("refreshToken", result.refreshToken, { secure: true, httpOnly: true, sameSite: "none", maxAge: refreshTokenMaxAge });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Logged in successfully!",
    data: null,
  });
});

// REFRESH TOKEN
const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const token = req.cookies.refreshToken;
  const result = await AuthServices.refreshToken(token);

  const accessTokenMaxAge = parseTime(config.jwt.expires_in as string, 1000 * 60 * 60);
  const refreshTokenMaxAge = parseTime(config.jwt.refresh_token_expires_in as string, 1000 * 60 * 60 * 24 * 30);

  res.cookie("accessToken", result.accessToken, { secure: true, httpOnly: true, sameSite: "none", maxAge: accessTokenMaxAge });
  res.cookie("refreshToken", result.refreshToken, { secure: true, httpOnly: true, sameSite: "none", maxAge: refreshTokenMaxAge });

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Access token generated successfully!",
    data: null,
  });
});

// CHANGE PASSWORD
const changePassword = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  if (!req.user) throw new Error("Unauthorized");
  const result = await AuthServices.changePassword(req.user, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

// FORGOT PASSWORD
const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await AuthServices.forgotPassword(req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Check your email!",
    data: null,
  });
});

// RESET PASSWORD
const resetPassword = catchAsync(async (req: Request, res: Response) => {
  let token = req.headers.authorization || "";
  if (token.startsWith("Bearer ")) token = token.slice(7);

  await AuthServices.resetPassword(token, req.body);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Password reset successfully!",
    data: null,
  });
});

// GET ME
const getMe = catchAsync(async (req: Request & { user?: any }, res: Response) => {
  console.log("req.user:", req.user); // should log { id, email, role }

  if (!req.user) throw new Error("Unauthorized");

  const result = await AuthServices.getMe(req.user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User retrieved successfully",
    data: result,
  });
});


export const AuthController = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
