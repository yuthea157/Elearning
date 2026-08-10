import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Enter your full name.").max(100),
  username: z
    .string()
    .trim()
    .min(3, "Username must be at least 3 characters.")
    .max(30, "Username must be under 30 characters.")
    .regex(/^[a-z0-9_-]+$/, "Use lowercase letters, numbers, hyphens, and underscores only."),
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .regex(/[A-Z]/, "Password must include an uppercase letter.")
    .regex(/[0-9]/, "Password must include a number."),
});

export const loginSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Enter your password."),
  remember: z.boolean().optional(),
});

export const editUserSchema = registerSchema.omit({ password: true }).extend({
  role: z.enum(["STUDENT", "INSTRUCTOR", "ADMIN"]),
});

export const editOwnProfileSchema = registerSchema.omit({ password: true });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password."),
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Password must include an uppercase letter.")
      .regex(/[0-9]/, "Password must include a number."),
    confirmPassword: z.string().min(1, "Re-enter the new password."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match.",
    path: ["confirmPassword"],
  });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type EditUserInput = z.infer<typeof editUserSchema>;
export type EditOwnProfileInput = z.infer<typeof editOwnProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
