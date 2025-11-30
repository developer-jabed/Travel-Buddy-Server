import { UserStatus, UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../../config";
import prisma from "../../../shared/prisma";
import { jwtHelpers } from "../../../helpers/jwtHelpers";
import emailSender from "./auth.emailSender";
import ApiError from "../../errors/ApiError";

interface LoginPayload {
  email: string;
  password: string;
}

interface ResetPasswordPayload {
  id: string;
  password: string;
}

interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
}

// LOGIN USER
const loginUser = async (payload: LoginPayload) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email: payload.email },
  });

  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, "User is not active");
  }

  const isPasswordValid = await bcrypt.compare(payload.password, user.password!);
  if (!isPasswordValid) throw new ApiError(httpStatus.UNAUTHORIZED, "Password incorrect");

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return { accessToken, refreshToken };
};

// REFRESH TOKEN
const refreshToken = async (token: string) => {
  let decodedData: any;
  try {
    decodedData = jwtHelpers.verifyToken(token, config.jwt.refresh_token_secret as Secret);
  } catch (err) {
    throw new ApiError(httpStatus.UNAUTHORIZED, "Invalid refresh token");
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { email: decodedData.email } });
  if (user.status !== UserStatus.ACTIVE) {
    throw new ApiError(httpStatus.FORBIDDEN, "User is not active");
  }

  const accessToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.jwt_secret as Secret,
    config.jwt.expires_in as string
  );

  const refreshToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.refresh_token_secret as Secret,
    config.jwt.refresh_token_expires_in as string
  );

  return { accessToken, refreshToken };
};

// CHANGE PASSWORD
const changePassword = async (user: any, payload: ChangePasswordPayload) => {
  const dbUser = await prisma.user.findUniqueOrThrow({ where: { email: user.email } });

  const isPasswordValid = await bcrypt.compare(payload.oldPassword, dbUser.password!);
  if (!isPasswordValid) throw new ApiError(httpStatus.UNAUTHORIZED, "Old password incorrect");

  const hashedPassword = await bcrypt.hash(payload.newPassword, Number(config.salt_round));

  await prisma.user.update({
    where: { email: dbUser.email },
    data: { password: hashedPassword },
  });

  return { message: "Password changed successfully" };
};

// FORGOT PASSWORD
const forgotPassword = async (payload: { email: string }) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { email: payload.email } });

  const resetToken = jwtHelpers.generateToken(
    { id: user.id, email: user.email, role: user.role },
    config.jwt.reset_pass_secret as Secret,
    config.jwt.reset_pass_token_expires_in as string
  );

  const resetLink = `${config.reset_pass_link}?userId=${user.id}&token=${resetToken}`;

  await emailSender(
    user.email,
    `<p>Hello ${user.name},</p>
     <p>Click the button below to reset your password:</p>
     <a href="${resetLink}"><button>Reset Password</button></a>`
  );

  return { message: "Password reset link sent to email" };
};

// RESET PASSWORD
const resetPassword = async (token: string, payload: ResetPasswordPayload) => {
  const decoded = jwtHelpers.verifyToken(token, config.jwt.reset_pass_secret as Secret) as any;

  if (decoded.id !== payload.id) throw new ApiError(httpStatus.FORBIDDEN, "Invalid token");

  const hashedPassword = await bcrypt.hash(payload.password, Number(config.salt_round));

  await prisma.user.update({
    where: { id: payload.id },
    data: { password: hashedPassword },
  });

  return { message: "Password reset successfully" };
};

// GET ME
const getMe = async (user: any) => {
  const userData = await prisma.user.findUniqueOrThrow({
    where: { id: user.id, status: UserStatus.ACTIVE },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      TravelerProfile: true,
      Moderator: true,
      Admin: true,
    },
  });

  return userData;
};


export const AuthServices = {
  loginUser,
  refreshToken,
  changePassword,
  forgotPassword,
  resetPassword,
  getMe,
};
