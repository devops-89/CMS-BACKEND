import { z } from "zod";
import { PERMISSION_ROLE } from "@libs/entities";

export const createPermissionSchema = z.object({
  role: z.string().optional(),
  roleId: z.string().optional(),
  module: z.string().min(1, "Module name is required").max(100),
  canView: z.boolean().optional().default(false),
  canCreate: z.boolean().optional().default(false),
  canEdit: z.boolean().optional().default(false),
  canDelete: z.boolean().optional().default(false),
}).refine(data => data.role || data.roleId, {
  message: "Either role or roleId must be provided",
  path: ["role"],
});

export type createPermissionDto = z.infer<typeof createPermissionSchema>;

export const updatePermissionSchema = z.object({
  role: z.string().optional(),
  roleId: z.string().optional(),
  module: z.string().max(100).optional(),
  canView: z.boolean().optional(),
  canCreate: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canDelete: z.boolean().optional(),
});

export type updatePermissionDto = z.infer<typeof updatePermissionSchema>;

// For bulk saving of permissions
export const bulkSavePermissionsSchema = z.array(
  z.object({
    role: z.string().optional(),
    roleId: z.string().optional(),
    module: z.string().min(1, "Module name is required").max(100),
    canView: z.boolean().optional().default(false),
    canCreate: z.boolean().optional().default(false),
    canEdit: z.boolean().optional().default(false),
    canDelete: z.boolean().optional().default(false),
  }).refine(data => data.role || data.roleId, {
    message: "Either role or roleId must be provided",
    path: ["role"],
  })
);

export type bulkSavePermissionsDto = z.infer<typeof bulkSavePermissionsSchema>;

export const getPermissionByIdSchema = z.object({
  id: z.string(),
});

export type getPermissionByIdDto = z.infer<typeof getPermissionByIdSchema>;

// For fetching permissions filtered by optional role
export const getPermissionsQuerySchema = z.object({
  role: z.string().optional(),
  roleId: z.string().optional(),
});

export type getPermissionsQueryDto = z.infer<typeof getPermissionsQuerySchema>;

export const bulkUpdatePermissionsSchema = z.array(
  z.object({
    id: z.string().uuid("Invalid Permission ID"),
    role: z.string().optional(),
    roleId: z.string().optional(),
    module: z.string().max(100).optional(),
    canView: z.boolean().optional(),
    canCreate: z.boolean().optional(),
    canEdit: z.boolean().optional(),
    canDelete: z.boolean().optional(),
  })
);

export type bulkUpdatePermissionsDto = z.infer<typeof bulkUpdatePermissionsSchema>;
