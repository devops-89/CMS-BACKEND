import { z } from "zod";
import { PERMISSION_ROLE } from "@libs/entities";

export const createPermissionSchema = z.object({
  role: z.nativeEnum(PERMISSION_ROLE),
  module: z.string().min(1, "Module name is required").max(100),
  canView: z.boolean().optional().default(false),
  canCreate: z.boolean().optional().default(false),
  canEdit: z.boolean().optional().default(false),
  canDelete: z.boolean().optional().default(false),
});

export type createPermissionDto = z.infer<typeof createPermissionSchema>;

export const updatePermissionSchema = createPermissionSchema.partial();

export type updatePermissionDto = z.infer<typeof updatePermissionSchema>;

// For bulk saving of permissions
export const bulkSavePermissionsSchema = z.array(
  z.object({
    role: z.nativeEnum(PERMISSION_ROLE),
    module: z.string().min(1, "Module name is required").max(100),
    canView: z.boolean().optional().default(false),
    canCreate: z.boolean().optional().default(false),
    canEdit: z.boolean().optional().default(false),
    canDelete: z.boolean().optional().default(false),
  })
);

export type bulkSavePermissionsDto = z.infer<typeof bulkSavePermissionsSchema>;

export const getPermissionByIdSchema = z.object({
  id: z.coerce.number().int().positive("Invalid permission ID"),
});

export type getPermissionByIdDto = z.infer<typeof getPermissionByIdSchema>;

// For fetching permissions filtered by optional role
export const getPermissionsQuerySchema = z.object({
  role: z.nativeEnum(PERMISSION_ROLE).optional(),
});

export type getPermissionsQueryDto = z.infer<typeof getPermissionsQuerySchema>;
