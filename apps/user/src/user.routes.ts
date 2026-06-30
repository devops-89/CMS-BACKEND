import {Router} from "express";
import { UserController } from "./user.controller";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { validate } from "@libs/middlewares/validate.middleware";
import { authorize } from "@libs/middlewares/role.middleware";
import { UserRole } from "@libs/entities";
import multer from "multer";

import { deleteUserByIdSchema, getUserByIdSchema, getUsersQuerySchema,  updateAvatarSchema, updateUserStatusSchema, updateUserSchema, verifyParticipantSchema, createParticipantSchema, createPublicUserSchema, verifyPublicUserSchema, createRoleSchema, createUserByRoleSchema, updateRoleUserSchema } from "@libs/dto/user.dto";

const router=Router();
const upload = multer();

const parseMultipartData = (req: any, res: any, next: any) => {
  if (req.body) {
    const { contestId, countryId, formData, ...rest } = req.body;
    let resolvedFormData = {};

    if (formData) {
      if (typeof formData === "string") {
        try {
          resolvedFormData = JSON.parse(formData);
        } catch (e) {
          // Allow validation middleware to catch format issues
        }
      } else if (typeof formData === "object") {
        resolvedFormData = formData;
      }
    } else {
      resolvedFormData = rest;
    }

    req.body = {
      contestId,
      countryId,
      formData: resolvedFormData,
    };
  }
  next();
};

const parseUpdateMultipartData = (req: any, res: any, next: any) => {
  if (req.body) {
    const { formData, ...rest } = req.body;
    let resolvedFormData = {};

    if (formData) {
      if (typeof formData === "string") {
        try {
          resolvedFormData = JSON.parse(formData);
        } catch (e) {
          // Ignore parse errors
        }
      } else if (typeof formData === "object") {
        resolvedFormData = formData;
      }
    }

    req.body = {
      ...rest,
      ...resolvedFormData,
    };
  }
  next();
};


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

// get user details by token
router.get("/me", authenticate, controller.getUserDetailsByToken.bind(controller));

// get logged-in user's entries
router.get("/entries", authenticate, controller.listEntries.bind(controller));

// get users , filter by role
router.get("/all",authenticate,authorize(UserRole.ADMIN,UserRole.PARTICIPANT,UserRole.JUDGE), validate(getUsersQuerySchema,"query"),controller.getAllUsers.bind(controller));

// create role
router.post("/roles", authenticate, authorize(UserRole.ADMIN), validate(createRoleSchema, "body"), controller.createRole.bind(controller));

// get all roles
router.get("/roles", authenticate, authorize(UserRole.ADMIN), controller.getAllRoles.bind(controller));

// get user by id
router.get("/:id", authenticate,authorize(UserRole.ADMIN,UserRole.PARTICIPANT,UserRole.JUDGE), validate(getUserByIdSchema, "params"),controller.getUserById.bind(controller) );

// update user details by id
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN,UserRole.PARTICIPANT,UserRole.JUDGE),
  upload.any(),
  parseUpdateMultipartData,
  validate(getUserByIdSchema, "params"),
  validate(updateUserSchema, "body"),
  controller.updateUserDetails.bind(controller)
);

// delete user by id
router.delete("/:id", authenticate, authorize(UserRole.ADMIN,UserRole.PARTICIPANT,UserRole.JUDGE), validate(deleteUserByIdSchema, "params"), controller.deleteUserById.bind(controller));

// create participant
router.post("/create-participant", upload.any(), parseMultipartData, validate(createParticipantSchema, "body"), controller.createParticipant.bind(controller));

// verify participant account with OTP
router.post("/verify-otp", validate(verifyParticipantSchema, "body"), controller.verifyParticipant.bind(controller));

// create public user (no authentication required)
router.post("/create-public", validate(createPublicUserSchema, "body"), controller.createPublicUser.bind(controller));

// verify public user account with OTP (no authentication required)
router.post("/verify-public-otp", validate(verifyPublicUserSchema, "body"), controller.verifyPublicUser.bind(controller));

// create user by role id (accessible by ADMIN)
router.post("/create-by-role/:roleId", authenticate, authorize(UserRole.ADMIN), validate(createUserByRoleSchema, "body"), controller.createUserByRole.bind(controller));

// update user with role by id (accessible by ADMIN)
router.put("/update-role-user/:id", authenticate, authorize(UserRole.ADMIN), validate(updateRoleUserSchema, "body"), controller.updateRoleUser.bind(controller));


export default router;
