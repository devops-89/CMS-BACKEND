import { UserRole, UserStatus } from "@libs/entities";
import {z} from "zod";



export const updateAvatarSchema=z.object({
    avatarUrl:z.string()
})

export const getUserByIdSchema=z.object({
    id:z.string()
})

export const getUsersQuerySchema=z.object({
    role:z.nativeEnum(UserRole).optional(),
    page:z.coerce.number().default(1),
    limit:z.coerce.number().default(10)
})

export const updateUserStatusSchema = z.object({
  id: z.string(),
  status: z.nativeEnum(UserStatus)
});

export const deleteUserByIdSchema=z.object({
    id:z.string()
})


// User typescript dtos

export type updateAvatarDto=z.infer<typeof updateAvatarSchema>;
export type getUsersQueryDto=z.infer<typeof getUsersQuerySchema>;
export type getUserByIdDto=z.infer<typeof getUserByIdSchema>;
export type deleteUserByIdDto=z.infer<typeof deleteUserByIdSchema>;
export type updateUserStatusDto=z.infer<typeof updateUserStatusSchema>;