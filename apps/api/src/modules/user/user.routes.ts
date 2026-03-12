import {Router} from "express";
import { UserController } from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { UserRole } from "@libs/entities";

import { updateAdminProfileSchema, updateJudgeProfileSchema, updateParticipantProfileSchema } from "@libs/dto/user.dto";

const router=Router();

const controller=new UserController();

// Get Profile
// Any logged in user can access
router.get("/me",authenticate,controller.getProfile.bind(controller));

// update Admin Profile
router.put("/admin-profile",authenticate,authorize(UserRole.ADMIN), validate(updateAdminProfileSchema),controller.updateAdminProfile.bind(controller));

// update judge profile
router.put("/judge-profile",authenticate,authorize(UserRole.JUDGE),validate(updateJudgeProfileSchema),controller.updateJudgeProfile.bind(controller));

// update participant profile
router.put("participant-profile", authenticate, authorize(UserRole.PARTICIPANT),validate(updateParticipantProfileSchema),controller.updateParticipantProfile.bind(controller));




