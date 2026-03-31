import { Router } from "express";
import { AuthController } from "./auth.controller";
import { validate } from "@libs/middlewares/validate.middleware";

import { registerSchema, loginSchema, refreshSchema, logoutSchema, forgotPasswordSchema, resetPasswordSchema, registerParticipantSchema, registerJudgeSchema } from "@libs/dto/auth.dto";
import { authenticate } from "@libs/middlewares/auth.middleware";
const router = Router();
const controller = new AuthController();

router.post(
  "/register",
  validate(registerSchema),
  controller.register.bind(controller)
);

router.post(
  "/register-participant",
  validate(registerParticipantSchema),
  controller.registerParticipant.bind(controller)
)

router.post(
  "/register-judge",
  validate(registerJudgeSchema),
  controller.registerJudge.bind(controller)
);

router.post(
  "/login",
  validate(loginSchema),
  controller.login.bind(controller)
);

// Refresh Access Token
router.post(
  "/refresh",
  validate(refreshSchema),
  controller.refresh.bind(controller)
);

// Logout
router.post(
  "/logout",
  validate(logoutSchema),
  authenticate,
  controller.logout.bind(controller)
);

// Forgot Password
router.post(
  "/forgot-password",
  validate(forgotPasswordSchema),
  controller.forgotPassword.bind(controller)
);

// Reset Password
router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  controller.resetPassword.bind(controller)
);

router.get("/health",controller.health.bind(controller));

export default router;