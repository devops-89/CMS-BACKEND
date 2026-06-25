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
    limit:z.coerce.number().default(10),
    search:z.string().optional()
})

export const updateUserStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  contestId: z.string().optional()
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

export const updateUserSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  avatarUrl: z.string().optional(),
  userId: z.string().optional(),
}).catchall(z.any());

export type updateUserDto = z.infer<typeof updateUserSchema>;

export const createParticipantSchema = z.object({
  contestId: z.string().uuid("Invalid contest ID"),
  countryId: z.string().uuid("Invalid country ID"),
  formData: z.record(z.string(), z.any()),
});

export type createParticipantDto = z.infer<typeof createParticipantSchema>;

export const verifyParticipantSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be a 6-digit number"),
});

export type verifyParticipantDto = z.infer<typeof verifyParticipantSchema>;

export const createPublicUserSchema = z.object({
  fullName: z
    .string()
    .min(1, "Full name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long"),
});

export type createPublicUserDto = z.infer<typeof createPublicUserSchema>;

export const verifyPublicUserSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  otp: z
    .string()
    .regex(/^\d{6}$/, "OTP must be a 6-digit number"),
});

export type verifyPublicUserDto = z.infer<typeof verifyPublicUserSchema>;