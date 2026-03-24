import {z} from "zod";

//  Field Schema
export const formFieldSchema = z.object({
  name: z.string().min(1, "Field name is required"),

  type: z.enum([
    "text",
    "email",
    "number",
    "select",
    "checkbox",
    "date"
  ]),

  label: z.string().optional(),
  required: z.boolean().optional(),

  options: z.array(z.string()).optional()
}).superRefine((field, ctx) => {
  // 🔥 select must have options
  if (field.type === "select" && (!field.options || field.options.length === 0)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Options are required for select field"
    });
  }
});


//  Create Template DTO
export const createTemplateSchema = z.object({
  name: z.string().min(1),

  schema: z.object({
    fields: z.array(formFieldSchema)
      .min(1)
      .refine((fields) => {
        const names = fields.map(f => f.name);
        return new Set(names).size === names.length;
      }, {
        message: "Field names must be unique"
      })
  })
});


// 🔹 Params
export const templateParamSchema = z.object({
  id: z.string().uuid("Invalid template id")
});

export const templateIdParamSchema = z.object({
  templateId: z.string().uuid("Invalid template id")
});

// submit Form Schema
export const submitFormSchema = z.record(z.string(), z.unknown());


export type CreateTemplateDto=z.infer<typeof createTemplateSchema>;
export type TemplateIdParamDto=z.infer<typeof templateIdParamSchema>;
export type TemplateParamDto=z.infer<typeof templateParamSchema>; 
export type SubmitFormDto=z.infer<typeof submitFormSchema>;


