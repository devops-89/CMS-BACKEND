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



export const registerParticipantSchema = z.object({
  firstName: z
    .string()
    .min(1, "First name is required"),

  lastName: z
    .string()
    .min(1, "Last name is required"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),

  phone: z
  .string()
  .min(8, "Phone number must be at least 8 digits")
  .max(15, "Phone number cannot exceed 15 digits")
  .regex(/^\+?[0-9\s-]+$/, "Phone number can only contain digits, spaces, '-' and optional '+'"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(20, "Password cannot exceed 20 characters"),

  confirmPassword: z
    .string()
    .min(6, "Confirm password must be at least 6 characters")
    .max(20, "Confirm password cannot exceed 20 characters"),

  dateOfBirth: z
    .string()
    .min(1, "Date of birth is required"),

  country: z
    .string()
    .min(1, "Country is required"),

  schoolName: z
    .string()
    .min(1, "School name is required"),

  grade: z
    .string()
    .min(1, "Grade is required"),
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});


export const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(20, "Password cannot exceed 20 characters"),
});


export const refreshSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required"),
});


export const logoutSchema = z.object({
  refreshToken: z
    .string()
    .min(1, "Refresh token is required"),
});


export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email"),
});


export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, "Reset token is required"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(20, "Password cannot exceed 20 characters"),
});



// Extracting the exact typescript types from the Zod schema for working same as interfaces.
export type RegisterDto=z.infer<typeof registerSchema>["body"];
export type RegisterParticipantDto=z.infer<typeof registerParticipantSchema>;
export type LoginDto=z.infer<typeof loginSchema>;
export type RefreshDto=z.infer<typeof refreshSchema>;
export type LogoutDto=z.infer<typeof logoutSchema>;
export type ForgotPasswordDto=z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordDto=z.infer<typeof resetPasswordSchema>;