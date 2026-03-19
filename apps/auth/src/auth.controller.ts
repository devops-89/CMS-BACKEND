import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "@libs/database/data-source";
import { UserRepository } from "@libs/repositories";
import { AdminProfileRepository } from "@libs/repositories";
import { JudgeProfileRepository } from "@libs/repositories";
import { ParticipantProfileRepository } from "@libs/repositories";

import { RefreshTokenRepository } from "@libs/repositories/refresh-token.repository";
import { OtpsRepository } from "@libs/repositories/otps.repository";

import {
  RegisterDto,
  LoginDto,
  RefreshDto,
  LogoutDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RegisterParticipantDto,
} from "@libs/dto/auth.dto";

import {
  generateAccessToken,
  generateRefreshToken,
} from "@libs/utils/jwt.util";
import { ParticipantProfile, User, UserRole } from "@libs/entities";

export class AuthController {
  private userRepo = new UserRepository();
  private adminRepo = new AdminProfileRepository();
  private judgeRepo = new JudgeProfileRepository();
  private participantRepo = new ParticipantProfileRepository();
  private refreshTokenRepo = new RefreshTokenRepository();
  private otpRepo=new OtpsRepository();

  /* -------------------------------- REGISTER -------------------------------- */

async register(req: Request<{}, {}, RegisterDto>, res: Response) {
  try {
    const { email, password, role, firstName, lastName, phone } = req.body;

    const existingUser = await this.userRepo.findByEmail(email);

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // ✅ FIX: don't send null, only send values if present
    const user = await this.userRepo.createUser({
      email,
      password: hashedPassword,
      role,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(phone && { phone }),
    });

    // ✅ Role-based profile creation
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
        role: user.role,
      },
    });

  } catch (error: any) {
    return res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
}




async registerParticipant(
  req: Request<{}, {}, RegisterParticipantDto>,
  res: Response
) {
  const queryRunner = AppDataSource.createQueryRunner();

  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      password,
      dateOfBirth,
      country,
      schoolName,
      grade,
    } = req.body;

    // ✅ Check existing user
    const existingUser = await queryRunner.manager.findOne(User, {
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    //  Create User (role is FIXED)
    const user = queryRunner.manager.create(User, {
      email,
      password: hashedPassword,
      role: UserRole.PARTICIPANT,
      firstName,
      lastName,
      phone,
    });

    await queryRunner.manager.save(user);

    //  Create Participant Profile
    const profile = queryRunner.manager.create(ParticipantProfile, {
      user,
      dateOfBirth: new Date(dateOfBirth),
      country,
      schoolName,
      grade,
    });

    await queryRunner.manager.save(profile);

    //  Commit transaction
    await queryRunner.commitTransaction();

    return res.status(201).json({
      message: "Participant registered successfully",
      data: {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
    });

  } catch (error: any) {
    //  Rollback if anything fails
    await queryRunner.rollbackTransaction();

    return res.status(500).json({
      message: "Participant registration failed",
      error: error.message,
    });

  } finally {
    await queryRunner.release();
  }
}

  /* -------------------------------- LOGIN -------------------------------- */

  async login(req: Request<{}, {}, LoginDto>, res: Response) {
    try {
      const { email, password } = req.body;

      const user = await this.userRepo.findByEmail(email);

      if (!user) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      console.log("user", user);

      console.log("password", password);
      console.log("User password", user.password);

      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({
          message: "Invalid credentials",
        });
      }

      const accessToken = generateAccessToken({
        userId: user.id,
        role: user.role,
      });

      const refreshToken = generateRefreshToken({
        userId: user.id,
      });

      const expires = new Date();
      expires.setDate(expires.getDate() + 7);

      await this.refreshTokenRepo.createToken(user.id, refreshToken, expires);

      return res.json({
        message: "Login successful",
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
          },
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Login failed",
        error: error.message,
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
          message: "Invalid refresh token",
        });
      }

      let decoded: any;

      try {
        decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!);
      } catch {
        return res.status(401).json({
          message: "Refresh token expired",
        });
      }

      const accessToken = generateAccessToken({
        userId: decoded.userId,
      });

      return res.json({
        message: "Token refreshed",
        data: {
          accessToken,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Token refresh failed",
        error: error.message,
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
          message: "Invalid Token!",
        });
      }

      await this.refreshTokenRepo.deleteToken(refreshToken);

      return res.json({
        message: "Logged out successfully",
      });
    } catch (error: any) {
      return res.status(500).json({
        message: "Logout failed",
        error: error.message,
      });
    }
  }

  /* ----------------------------- FORGOT PASSWORD(send otp) ---------------------------- */

 async forgotPassword(req: Request<{}, {}, ForgotPasswordDto>, res: Response) {
  try {
    const { email } = req.body;

    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      return res.json({
        message: "If email exists, OTP sent",
      });
    }

    // 🔥 1. Delete old OTP
    await this.otpRepo.deleteUserOtps(user.id);

    // 🔥 2. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // 🔐 3. Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // ⏱ 4. Expiry (5 min)
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5);

    // 💾 5. Save OTP
    await this.otpRepo.createOtp(user.id, hashedOtp, expires);

    // 📩 TODO: Send via email
    console.log("OTP:", otp);

    return res.json({
      message: "OTP sent successfully",
    });

  } catch (error: any) {
    return res.status(500).json({
      message: "Failed to send OTP",
      error: error.message,
    });
  }
}

  /* ------------------------------ RESET PASSWORD  ---------------------------- */

  async resetPassword(req: Request<{}, {}, ResetPasswordDto>, res: Response) {
  try {
    const { email, otp, password } = req.body;

    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      return res.status(400).json({
        message: "Invalid request",
      });
    }

    const record = await this.otpRepo.findLatestOtp(user.id);

    if (!record) {
      return res.status(400).json({
        message: "OTP not found",
      });
    }

    // ⏱ Expiry check
    if (record.expires_at < new Date()) {
      return res.status(400).json({
        message: "OTP expired",
      });
    }

    if (record.isUsed) {
      return res.status(400).json({
        message: "OTP already used",
      });
    }

    // 🔐 Compare OTP
    const isValid = await bcrypt.compare(otp, record.otp);

    if (!isValid) {
      return res.status(400).json({
        message: "Invalid OTP",
      });
    }

    // 🔑 Update password
    const hashedPassword = await bcrypt.hash(password, 12);
    await this.userRepo.updatePassword(user.id, hashedPassword);

    // ✅ Mark OTP used
    await this.otpRepo.markUsed(record.id);

    return res.json({
      message: "Password updated successfully",
    });

  } catch (error: any) {
    return res.status(500).json({
      message: "Password reset failed",
      error: error.message,
    });
  }
}
  /* ------------------------------ HEALTH CHECK ----------------------------- */

  async health(req: Request, res: Response) {
    return res.status(200).json({
      message: "Auth service healthy",
    });
  }
}
