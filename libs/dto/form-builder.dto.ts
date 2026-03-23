import {z} from "zod";

export const formFieldSchema=z.object({
    name: z.string().min(1, "Field name is required"),

  type: z.enum([
    "text",
    "email",
    "number",
    "select",
    "checkbox",
    "date"
  ], {
    message: "Invalid field type",
  }),

  label: z.string().optional(),

  required: z.boolean().optional(),

  options: z.array(z.string()).optional()
})

export const formSchema = z.object({
  fields: z.array(formFieldSchema).min(1, "At least one field is required")
});

export const createTemplateSchema = z.object({
  name: z
    .string()
    .min(1, "Template name is required"),

  schema: formSchema
});



export const templateIdParamSchema = z.object({
  templateId: z.string().uuid("Invalid templateId")
});

export const templateParamSchema = z.object({
  id: z.string().uuid("Invalid template id")
});


export type CreateTemplateDto=z.infer<typeof createTemplateSchema>;


export type TemplateIdParamDto=z.infer<typeof templateIdParamSchema>;
export type TemplateParamDto=z.infer<typeof templateParamSchema>; 


