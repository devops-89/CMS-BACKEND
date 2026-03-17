import { UserRole } from "@libs/entities";
import {z} from "zod";

export const updateAdminProfileSchema=z.object({
    adminCode:z.string().min(1).optional()
})

export const updateJudgeProfileSchema=z.object({
    judgeLicense:z.string().min(1).optional()
})

export const updateParticipantProfileSchema=z.object({
    score:z.number().min(0).optional()
})

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

export const deleteUserByIdSchema=z.object({
    id:z.string()
})


// User typescript dtos
export type updateAdminProfileDto=z.infer<typeof updateAdminProfileSchema>;
export type updateJudgeProfileDto=z.infer<typeof updateJudgeProfileSchema>;
export type updateParticipantProfileDto=z.infer<typeof updateParticipantProfileSchema>;
export type updateAvatarDto=z.infer<typeof updateAvatarSchema>;
export type getUsersQueryDto=z.infer<typeof getUsersQuerySchema>;
export type getUserByIdDto=z.infer<typeof getUserByIdSchema>;
export type deleteUserByIdDto=z.infer<typeof deleteUserByIdSchema>;