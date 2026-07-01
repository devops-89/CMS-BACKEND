import { z } from "zod";

export const createContestSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start_date format",
  }),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end_date format",
  }),
  available_regions: z.array(z.string()).optional(),
  available_countries: z
    .array(
      z.string().uuid("Each available country must be a valid UUID")
    )
    .min(1, "Available countries is required"),
  status: z.enum(["Draft", "Published", "Offline"]).optional().default("Draft"),
  form_template_id: z.string().uuid("Invalid form template ID").optional(),
  entry_level_template_id: z.string().uuid("Invalid entry level template ID").optional(),
  user_level_template_id: z.string().uuid("Invalid user level template ID").optional(),
}).refine((data) => {
  const start = new Date(data.start_date);
  const end = new Date(data.end_date);
  return end > start;
}, {
  message: "end_date must be after start_date",
  path: ["end_date"],
});


export const updateContestSchema = z.object({
  name: z.string().min(1, "Name cannot be empty").optional(),
  description: z.string().optional(),
  start_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start_date format",
  }).optional(),
  end_date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end_date format",
  }).optional(),
  available_regions: z.array(z.string()).optional(),
  available_countries: z.array(z.string().uuid("Invalid country ID")).optional(),
  status: z.enum(["Draft", "Published", "Offline"]).optional(),
  form_template_id: z.string().uuid("Invalid form template ID").optional(),
  entry_level_template_id: z.string().uuid("Invalid entry level template ID").optional(),
  user_level_template_id: z.string().uuid("Invalid user level template ID").optional(),
  public_visibility: z.boolean().optional(),
  auto_moderate_entries: z.boolean().optional(),
  allow_new_registrations: z.boolean().optional()
}).refine((data) => {
  if (data.start_date && data.end_date) {
    const start = new Date(data.start_date);
    const end = new Date(data.end_date);
    return end > start;
  }
  return true;
}, {
  message: "end_date must be after start_date",
  path: ["end_date"],
});

export const updateContestStatusSchema = z.object({
  status: z.enum(["Draft", "Published", "Offline"]),
});

export const contestIdParamSchema = z.object({
  id: z.string().uuid("Invalid contest ID"),
});

export type CreateContestDto = z.infer<typeof createContestSchema>;
export type UpdateContestDto = z.infer<typeof updateContestSchema>;
export type UpdateContestStatusDto = z.infer<typeof updateContestStatusSchema>;
export type ContestIdParamDto = z.infer<typeof contestIdParamSchema>;

export const bulkUpdateEntriesStatusSchema = z.object({
  entryIds: z.array(z.string().uuid("Invalid entry ID")).min(1, "At least one entry ID is required"),
  status: z.enum(["pending", "approved", "rejected", "draft", "evaluated", "semifinal", "final", "winner"]),
  reason: z.string().optional(),
});

export type BulkUpdateEntriesStatusDto = z.infer<typeof bulkUpdateEntriesStatusSchema>;

