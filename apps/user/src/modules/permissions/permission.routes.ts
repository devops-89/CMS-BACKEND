import { Router } from "express";
import { PermissionController } from "./permisssion.controller";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { validate } from "@libs/middlewares/validate.middleware";
import { authorize } from "@libs/middlewares/role.middleware";
import { UserRole } from "@libs/entities";
import {
  createPermissionSchema,
  updatePermissionSchema,
  bulkSavePermissionsSchema,
  getPermissionByIdSchema,
  getPermissionsQuerySchema,
  bulkUpdatePermissionsSchema,
} from "@libs/dto/permission.dto";

const router = Router();
const controller = new PermissionController();

// Get all permissions (Admin only, optional filtering by role query)
router.get(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(getPermissionsQuerySchema, "query"),
  controller.getAll.bind(controller)
);

// Get permission by ID (Admin only)
router.get(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(getPermissionByIdSchema, "params"),
  controller.getOne.bind(controller)
);

// Create a permission (Admin only)
router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createPermissionSchema, "body"),
  controller.create.bind(controller)
);

// Bulk save/update permissions (Admin only)
router.post(
  "/bulk",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(bulkSavePermissionsSchema, "body"),
  controller.bulkSave.bind(controller)
);

// Bulk update permissions (Admin only)
router.put(
  "/bulk",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(bulkUpdatePermissionsSchema, "body"),
  controller.bulkUpdate.bind(controller)
);

// Update a permission by ID (Admin only)
router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(getPermissionByIdSchema, "params"),
  validate(updatePermissionSchema, "body"),
  controller.update.bind(controller)
);

// Delete a permission by ID (Admin only)
router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  validate(getPermissionByIdSchema, "params"),
  controller.delete.bind(controller)
);

export default router;
