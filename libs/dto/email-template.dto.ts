import { z } from "zod";

const templateAudienceEnum = z.enum(["participant", "judge"]);

const templateEventTypeEnum = z.enum([
  "registration_successful",
  "entry_submitted",
  "selected_as_semi_finalist",
  "selected_as_finalist",
  "announced_as_winner",
  "assigned_as_judge",
]);

export const createEmailTemplateSchema = z.object({
  audience: templateAudienceEnum,
  event_type: templateEventTypeEnum,
  subject: z.string().min(1, "Subject is required").max(255, "Subject must be at most 255 characters"),
  body: z.string().min(1, "Body is required"),
  available_variables: z.array(z.string()).optional().default([]),
  is_active: z.boolean().optional().default(true),
});

export const updateEmailTemplateSchema = z.object({
  audience: templateAudienceEnum.optional(),
  event_type: templateEventTypeEnum.optional(),
  subject: z.string().min(1, "Subject cannot be empty").max(255, "Subject must be at most 255 characters").optional(),
  body: z.string().min(1, "Body cannot be empty").optional(),
  available_variables: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

export const emailTemplateIdParamSchema = z.object({
  templateId: z.string().uuid("Invalid email template ID"),
});

export const contestIdParamSchema = z.object({
  contestId: z.string().uuid("Invalid contest ID"),
});

export type CreateEmailTemplateDto = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateDto = z.infer<typeof updateEmailTemplateSchema>;
export type EmailTemplateIdParamDto = z.infer<typeof emailTemplateIdParamSchema>;
