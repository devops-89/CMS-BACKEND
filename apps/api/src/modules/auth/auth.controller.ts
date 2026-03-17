import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import { UserRepository } from "@libs/repositories";
import { AdminProfileRepository } from "@libs/repositories";
import { JudgeProfileRepository } from "@libs/repositories";
import { ParticipantProfileRepository } from "@libs/repositories";

import { RefreshTokenRepository } from "@libs/repositories/refresh-token.repository";
import { PasswordResetRepository } from "@libs/repositories/password-reset-token.repository";

import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  LogoutDto,
  ForgotPasswordDto,
  ResetPasswordDto
} from "@libs/dto/auth.dto";

import { generateAccessToken, generateRefreshToken } from "@libs/utils/jwt.util";
import { UserRole } from "@libs/entities";

export class AuthController {

  private userRepo = new UserRepository();
  private adminRepo = new AdminProfileRepository();
  private judgeRepo = new JudgeProfileRepository();
  private participantRepo = new ParticipantProfileRepository();
  private refreshTokenRepo = new RefreshTokenRepository();
  private passwordResetRepo = new PasswordResetRepository();

  /* -------------------------------- REGISTER -------------------------------- */

  async register(req: Request<{}, {}, RegisterDto>, res: Response) {

    try {

      const { email, password, role } = req.body;

      const existingUser = await this.userRepo.findByEmail(email);

      if (existingUser) {
        return res.status(409).json({
          message: "User already exists"
        });
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      const user = await this.userRepo.createUser(
        email,
        hashedPassword,
        role
      );

      if (role === UserRole.ADMIN) {
        await this.adminRepo.createProfile({ user });
      }

      if (role === UserRole.JUDGE) {
        await this.judgeRepo.createProfile({ user });
      }

      if (role === UserRole.PARTICIPANT) {
        await this.participantRepo.createProfile({ user });
      }

      return res.status(201).json({
        message: "User registered successfully",
        data: {
          userId: user.id,
          email: user.email,
          role: user.role
        }
      });

    } catch (error: any) {

      return res.status(500).json({
        message: "Registration failed",
        error: error.message
      });

    }
  }

  /* -------------------------------- LOGIN -------------------------------- */

  async login(req: Request<{}, {}, LoginDto>, res: Response) {

    try {

      const { email, password } = req.body;

      const user = await this.userRepo.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          message: "Invalid credentials"
        });
      }

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({
          message: "Invalid credentials"
        });
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role
      });

      const refreshToken = generateRefreshToken({
        userId: user.id
      });

      const expires = new Date();
      expires.setDate(expires.getDate() + 7);

      await this.refreshTokenRepo.createToken(
        user.id,
        refreshToken,
        expires
      );

      return res.json({
        message: "Login successful",
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role
          }
        }
      });

    } catch (error: any) {

      return res.status(500).json({
        message: "Login failed",
        error: error.message
      });

    }
  }

  /* ------------------------------ REFRESH TOKEN ----------------------------- */

  async refresh(req: Request<{}, {}, RefreshDto>, res: Response) {

    try {

      const { refreshToken } = req.body;

      const stored = await this.refreshTokenRepo.findToken(refreshToken);

      if (!stored) {
        return res.status(401).json({
          message: "Invalid refresh token"
        });
      }

      let decoded: any;

      try {

        decoded = jwt.verify(
          refreshToken,
          process.env.JWT_REFRESH_SECRET!
        );

      } catch {

        return res.status(401).json({
          message: "Refresh token expired"
        });

      }

      const accessToken = generateAccessToken({
        userId: decoded.userId
      });

      return res.json({
        message: "Token refreshed",
        data: {
          accessToken
        }
      });

    } catch (error: any) {

      return res.status(500).json({
        message: "Token refresh failed",
        error: error.message
      });

    }
  }

  /* -------------------------------- LOGOUT -------------------------------- */

  async logout(req: Request<{}, {}, LogoutDto>, res: Response) {

    try {

      const { refreshToken } = req.body;

      const stored = await this.refreshTokenRepo.findToken(refreshToken);

      if (!stored) {
        return res.status(400).json({
          message: "Invalid Token!"
        });
      }

      await this.refreshTokenRepo.deleteToken(refreshToken);

      return res.json({
        message: "Logged out successfully"
      });

    } catch (error: any) {

      return res.status(500).json({
        message: "Logout failed",
        error: error.message
      });

    }
  }

  /* ----------------------------- FORGOT PASSWORD ---------------------------- */

  async forgotPassword(req: Request<{}, {}, ForgotPasswordDto>, res: Response) {

    try {

      const { email } = req.body;

      const user = await this.userRepo.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          message: "If email exists reset link sent"
        });
      }

      const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET!,
        { expiresIn: "1d" }
      );

      const expires = new Date();
      expires.setMinutes(expires.getMinutes() + 15);

      await this.passwordResetRepo.createToken(
        user.id,
        token,
        expires
      );

      return res.json({
        message: "Reset token generated",
        data: {
          resetToken: token
        }
      });

    } catch (error: any) {

      return res.status(500).json({
        message: "Failed to process request",
        error: error.message
      });

    }
  }

  /* ------------------------------ RESET PASSWORD ---------------------------- */

  async resetPassword(req: Request<{}, {}, ResetPasswordDto>, res: Response) {

    try {

      const { token, password } = req.body;

      const record = await this.passwordResetRepo.findToken(token);

      if (!record) {
        return res.status(400).json({
          message: "Invalid token"
        });
      }

      if (record.used) {
        return res.status(400).json({
          message: "Token already used"
        });
      }

      if (record.expires_at < new Date()) {
        return res.status(400).json({
          message: "Token expired"
        });
      }

      const hashed = await bcrypt.hash(password, 12);

      await this.userRepo.updatePassword(
        record.user_id,
        hashed
      );

      await this.passwordResetRepo.markUsed(record.id);

      return res.json({
        message: "Password updated successfully"
      });

    } catch (error: any) {

      return res.status(500).json({
        message: "Password reset failed",
        error: error.message
      });

    }
  }

  /* ------------------------------ HEALTH CHECK ----------------------------- */

  async health(req: Request, res: Response) {

    return res.status(200).json({
      message: "Auth service healthy"
    });

  }

}