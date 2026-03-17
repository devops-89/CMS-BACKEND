import {Router} from "express";
import { UserController } from "./user.controller";
import { authenticate } from "../../middlewares/auth.middleware";
import { validate } from "../../middlewares/validate.middleware";
import { authorize } from "../../middlewares/role.middleware";
import { UserRole } from "@libs/entities";

import { deleteUserByIdSchema, getUserByIdSchema, getUsersQuerySchema, updateAdminProfileSchema, updateAvatarSchema, updateJudgeProfileSchema, updateParticipantProfileSchema } from "@libs/dto/user.dto";

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

//  update avatar
router.patch("/avatar",authenticate,validate(updateAvatarSchema),controller.updateAvatar.bind(controller));

// get users , filter by role
router.get("/users",authenticate, validate(getUsersQuerySchema,"query"),controller.getUsers.bind(controller));

// get user by id
router.get("/users/:id", authenticate, validate(getUserByIdSchema, "params"),controller.getUserById.bind(controller) );


// delete user by id
router.delete("/users/:id", authenticate, validate(deleteUserByIdSchema, "params"), controller.deleteUserById.bind(controller));


export default router;
