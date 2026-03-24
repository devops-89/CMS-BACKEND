import { FormTemplateRepository } from "@libs/repositories";
import { FormSubmissionRepository } from "@libs/repositories";
import { FormSchema } from "@libs/entities/form-template.entity";
import { FormField } from "@libs/entities/form-template.entity";
import { z } from "zod";
import { NotFoundError, InternalServerError } from "@libs/utils/errors.util";

export class FormBuilderService {
  private templateRepo = new FormTemplateRepository();
  private submissionRepo = new FormSubmissionRepository();

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

      case "autocomplete":
      case "select":
      case "radio":
        validator = z.enum(field.options as [string, ...string[]]);
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

      default:
        validator = z.any();
    }

    if (field.required) {
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
  const name = payload.schema.form_identity.name;

  const template = this.templateRepo.create({
    name, 
    schema: payload.schema
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
    const template = await this.templateRepo.findById(templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    //  USE IT HERE
    const dynamicSchema = this.generateZodSchema(template.schema.fields);

    //  Validate form data
    dynamicSchema.parse(formData);

    const submission = this.submissionRepo.create(template, formData);

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

  const name = payload.schema.form_identity.name;

  try {
    const updated = await this.templateRepo.update(id, {
      name,
      schema: payload.schema,
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


}
