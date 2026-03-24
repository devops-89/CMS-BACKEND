import {z} from "zod";

// Config Schema
const configSchema = z.object({
  defaultCountry: z.string().optional(),
  onlyCountries: z.array(z.string()).optional(),
  disablePast: z.boolean().optional(),
  disableFuture: z.boolean().optional(),
  min: z.number().optional(),
  max: z.number().optional()
}).partial();

//  Field Schema
export const formFieldSchema = z.object({
  id: z.string(),

  type: z.string(), // dynamic now

  label: z.string(),

  required: z.boolean().optional(),

  variant: z.string().optional(),

  options: z.array(z.string()).optional(),

  config: configSchema.optional()
});


export const formIdentitySchema = z.object({
  name: z.string().min(1),
  title: z.string().min(1),
  timestamp: z.string() // ISO string
});

//  Create Template DTO
export const createTemplateSchema = z.object({
  schema: z.object({
    form_identity: formIdentitySchema,

    fields: z.array(formFieldSchema)
      .min(1)
      .refine((fields) => {
        const ids = fields.map(f => f.id);
        return new Set(ids).size === ids.length;
      }, {
        message: "Field IDs must be unique"
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


