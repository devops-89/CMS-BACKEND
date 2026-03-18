import {z} from "zod";
import { UserRole } from "@libs/entities";

// schemas used for request validation
export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6).max(20),
    role: z.nativeEnum(UserRole),

    // ✅ New fields (optional for generic register)
    firstName: z.string().min(1).optional(),
    lastName: z.string().min(1).optional(),
    phone: z.string().min(8).max(15).optional(),
  }),
});

// schema used for registerParticipant
export const registerParticipantSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(8),

  password: z.string().min(6).max(20),
  confirmPassword: z.string().min(6).max(20),

  dateOfBirth: z.string(),
  country: z.string(),
  schoolName: z.string(),
  grade: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export const loginSchema=z.object({
    email:z.string().email(),
    password:z.string().min(6).max(20)
});

export const refreshSchema=z.object({
    refreshToken:z.string().min(1)
})

export const logoutSchema=z.object({
    refreshToken: z.string().min(1)
})

export const forgotPasswordSchema=z.object({
    email:z.string().email()
})

export const resetPasswordSchema=z.object({
    token:z.string().min(1),
    password:z.string().min(6).max(20)
})


// Extracting the exact typescript types from the Zod schema for working same as interfaces.
export type RegisterDto=z.infer<typeof registerSchema>["body"];
export type RegisterParticipantDto=z.infer<typeof registerParticipantSchema>;
export type LoginDto=z.infer<typeof loginSchema>;
export type RefreshDto=z.infer<typeof refreshSchema>;
export type LogoutDto=z.infer<typeof logoutSchema>;
export type ForgotPasswordDto=z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto=z.infer<typeof resetPasswordSchema>;