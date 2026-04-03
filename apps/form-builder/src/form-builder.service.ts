import { FormTemplateRepository } from "@libs/repositories";
import { FormSubmissionRepository } from "@libs/repositories";
import { FormSchema } from "@libs/entities/form-template.entity";
import { FormField } from "@libs/entities/form-template.entity";
import { z } from "zod";
import { NotFoundError, InternalServerError } from "@libs/utils/errors.util";

export class FormBuilderService {
  private templateRepo = new FormTemplateRepository();
  private submissionRepo = new FormSubmissionRepository();
  private templateCache = new Map<string, any>();

  // ✅ ADD IT HERE (inside class)
  private generateZodSchema(fields: FormField[]) {
    const shape: any = {};

    for (const field of fields) {
      let validator: any = z.any();

      switch (field.type) {
        case "textfield":
          validator = z.string();
          break;

        case "numberField":
          validator = z.number();
          break;

        case "telInput":
          validator = z.string();
          break;

        case "datePicker":
          validator = z.string();
          break;

        case "select":
        case "radio":
          if (field.options && field.options.length > 0) {
            validator = z.enum(field.options as [string, ...string[]]);
          } else {
            validator = z.string();
          }
          break;

        case "checkbox":
        case "switch":
          validator = z.boolean();
          break;

        case "slider":
        case "rating":
          validator = z.number();
          break;

        case "countrySelector":
          validator = z.string();
          break;

        case "step_break":
  if (field.config?.children) {
    let childSchema = this.generateZodSchema(field.config.children);

    // ✅ Apply required validation to whole step
    if (field.required) {
      childSchema = childSchema.refine(
        (val: any) =>
          val !== undefined &&
          val !== null &&
          Object.keys(val).length > 0,
        { message: `${field.label} is required` }
      );
    }

    shape[field.id] = childSchema;
  }
  continue;



        default:
          validator = z.any();
      }
      if (
        field.required &&
        field.type !== "step_break"
      ) {
        validator = validator.refine(
          (val: any) => val !== undefined && val !== null && val !== "",
          { message: `${field.label} is required` }
        );
      }

      shape[field.id] = validator; //  USE ID NOT NAME
    }

    return z.object(shape);
  }

  //  Create Template
  async createTemplate(payload: { schema: FormSchema }) {

    // 🔥 Step 1: resolve linked templates
    let fields = await this.resolveLinkedTemplates(payload.schema.fields);

    // 🔥 Step 2: ensure unique IDs
    const { updatedFields, idMap } = this.ensureUniqueIds(fields);

    // 🔥 Step 3: fix branching routing
    fields = this.remapRouting(updatedFields, idMap);

    this.validateSchema(fields);

    const finalSchema: FormSchema = {
      ...payload.schema,
      fields
    };

    const template = this.templateRepo.create({
      name: finalSchema.form_identity.name,
      schema: finalSchema
    });

    return await this.templateRepo.save(template);
  }

  //  Get All Templates
  async getTemplates() {
    return await this.templateRepo.findAll();
  }

  //  Get Single Template
  async getTemplateById(id: string) {
    const template = await this.templateRepo.findById(id);

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  }

  //  Submit Form ( MULTI-REPO + VALIDATION)
  async submitForm(templateId: string, formData: Record<string, any>) {
    let linkedTemplate = this.templateCache.get(templateId);

    if (!linkedTemplate) {
      linkedTemplate = await this.templateRepo.findById(templateId);
      this.templateCache.set(templateId, linkedTemplate);
    }

    if (!linkedTemplate) {
      throw new Error("Template not found");
    }

    //  USE IT HERE
    const dynamicSchema = this.generateZodSchema(linkedTemplate.schema.fields);

    //  Validate form data
    dynamicSchema.parse(formData);

    const submission = this.submissionRepo.create(linkedTemplate, formData);

    return await this.submissionRepo.save(submission);
  }

  //  Get Submissions
  async getSubmissions(templateId: string) {
    return await this.submissionRepo.findByTemplate(templateId);
  }

  // update template


  async updateTemplate(id: string, payload: { schema: FormSchema }) {
    const existing = await this.templateRepo.findById(id);

    if (!existing) {
      throw new NotFoundError("Template not found");
    }

    // 🔥 SAME LOGIC AS CREATE
    let fields = await this.resolveLinkedTemplates(payload.schema.fields);

    const { updatedFields, idMap } = this.ensureUniqueIds(fields);

    fields = this.remapRouting(updatedFields, idMap);

    this.validateSchema(fields);

    const finalSchema: FormSchema = {
      ...payload.schema,
      fields
    };

    try {
      const updated = await this.templateRepo.update(id, {
        name: finalSchema.form_identity.name,
        schema: finalSchema,
        version: existing.version + 1
      });

      return updated;
    } catch (err) {
      throw new InternalServerError("Failed to update template");
    }
  }

  // delete existing template
  async deleteTemplate(id: string) {
    const existing = await this.templateRepo.findById(id);

    if (!existing) {
      throw new NotFoundError("Template not found");
    }

    try {
      const result = await this.templateRepo.delete(id);

      if (result.affected === 0) {
        throw new InternalServerError("Delete failed");
      }

      return { message: "Template deleted successfully" };
    } catch (err) {
      throw new InternalServerError("Failed to delete template");
    }
  }


  private async resolveLinkedTemplates(
    fields: FormField[],
    visited = new Set<string>()
  ): Promise<FormField[]> {
    const resolved: FormField[] = [];

    for (const field of fields) {
      // 🔥 detect linked template
      if (field.config?.linkedTemplateId) {
        const templateId = field.config.linkedTemplateId;

        // 🚨 prevent circular dependency
        if (visited.has(templateId)) {
          throw new Error(`Circular template reference detected: ${templateId}`);
        }

        visited.add(templateId);

        let linkedTemplate = this.templateCache.get(templateId);

        if (!linkedTemplate) {
          linkedTemplate = await this.templateRepo.findById(templateId);
          this.templateCache.set(templateId, linkedTemplate);
        }

        if (!linkedTemplate) {
          throw new Error(`Linked template not found: ${templateId}`);
        }

        const nestedFields = await this.resolveLinkedTemplates(
          linkedTemplate.schema.fields,
          visited
        );

        visited.delete(templateId);
        resolved.push({
          ...field,
          // ✅ KEEP ORIGINAL TYPE (step_break)
          config: {
            ...field.config,
            children: nestedFields
          }
        });

      } else {
        resolved.push(field);
      }
    }

    return resolved;
  }


  private ensureUniqueIds(fields: FormField[]) {
    const seen = new Set<string>();
    const idMap = new Map<string, string>();

    const processField = (field: any): any => {
  let newId = field.id;

  while (seen.has(newId)) {
    newId = `${field.id}_${Math.random().toString(36).slice(2, 6)}`;
  }

  seen.add(newId);
  idMap.set(field.id, newId);

  let updatedField = { ...field, id: newId };

  // ✅ FIXED: works for step_break now
  if (field.config?.children) {
    updatedField.config = {
      ...field.config,
      children: field.config.children.map(processField)
    };
  }

  return updatedField;
};

    const updatedFields = fields.map(processField);

    return { updatedFields, idMap };
  }


  private remapRouting(fields: FormField[], idMap: Map<string, string>) {
    return fields.map(field => {
      if (field.config?.routing) {
        const newRouting: Record<string, string> = {};

        for (const key in field.config.routing) {
          const oldTarget = field.config.routing[key];

          const newTarget = idMap.get(oldTarget);

          if (!newTarget) {
            throw new Error(`Invalid routing target: ${oldTarget}`);
          }

          newRouting[key] = newTarget;
        }

        return {
          ...field,
          config: {
            ...field.config,
            routing: newRouting
          }
        };
      }

      return field;
    });
  }

  private validateSchema(fields: FormField[]) {
    const ids = new Set<string>();

    const collectIds = (fields: FormField[]) => {
      for (const field of fields) {
        ids.add(field.id);

        if (field.config?.children) {
          collectIds(field.config.children);
        }
      }
    };

    collectIds(fields);

    for (const field of fields) {
      if (field.config?.routing) {
        for (const key in field.config.routing) {
          const target = field.config.routing[key];

          if (!ids.has(target)) {
            throw new Error(`Routing points to non-existing field: ${target}`);
          }
        }
      }
    }
  }


}
