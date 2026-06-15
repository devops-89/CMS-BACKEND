import {Router} from "express";
import { UserController } from "./user.controller";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { validate } from "@libs/middlewares/validate.middleware";
import { authorize } from "@libs/middlewares/role.middleware";
import { UserRole } from "@libs/entities";

import { deleteUserByIdSchema, getUserByIdSchema, getUsersQuerySchema,  updateAvatarSchema, updateUserStatusSchema, updateUserSchema, sendOtpSchema, createParticipantSchema } from "@libs/dto/user.dto";

const router=Router();

const controller=new UserController();



//  update avatar
router.patch("/avatar",authenticate,authorize(UserRole.ADMIN),validate(updateAvatarSchema),controller.updateAvatar.bind(controller));

// update user status
router.patch(
  "/update-status",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateUserStatusSchema),
  controller.updateUserStatus.bind(controller)
);

// get users , filter by role
router.get("/all",authenticate,authorize(UserRole.ADMIN), validate(getUsersQuerySchema,"query"),controller.getAllUsers.bind(controller));

// get user by id
router.get("/:id", authenticate,authorize(UserRole.ADMIN), validate(getUserByIdSchema, "params"),controller.getUserById.bind(controller) );

// update user details by id
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(getUserByIdSchema, "params"),
  validate(updateUserSchema, "body"),
  controller.updateUserDetails.bind(controller)
);

// delete user by id
router.delete("/:id", authenticate, authorize(UserRole.ADMIN), validate(deleteUserByIdSchema, "params"), controller.deleteUserById.bind(controller));

// send OTP for participant registration
router.post("/send-otp", validate(sendOtpSchema, "body"), controller.sendOtp.bind(controller));

// create participant with OTP verification
router.post("/create-participant", validate(createParticipantSchema, "body"), controller.createParticipant.bind(controller));

export default router;
