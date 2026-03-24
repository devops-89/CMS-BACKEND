import { FormTemplateRepository } from "@libs/repositories/form-template.repository";
import { FormSubmissionRepository } from "@libs/repositories/form-submission.repository";
import { FormSchema } from "@libs/entities/form-template.entity";
import { FormField } from "@libs/entities/form-template.entity";
import { z } from "zod";

export class FormBuilderService {
  private templateRepo = new FormTemplateRepository();
  private submissionRepo = new FormSubmissionRepository();

  // ✅ ADD IT HERE (inside class)
  private generateZodSchema(fields: FormField[]) {
    const shape: any = {};

    for (const field of fields) {
      let validator: any = z.any();

      switch (field.type) {
        case "text":
          validator = z.string();
          break;
        case "email":
          validator = z.string().email();
          break;
        case "number":
          validator = z.number();
          break;
        case "checkbox":
          validator = z.boolean();
          break;
        case "date":
          validator = z.string();
          break;
        case "select":
          validator = z.enum(field.options as [string, ...string[]]);
          break;
      }

      if (field.required) {
        validator = validator.refine(
          (val: any) => val !== undefined && val !== null && val !== "",
          { message: `${field.name} is required` },
        );
      }

      shape[field.name] = validator;
    }

    return z.object(shape);
  }

  // ✅ Create Template
  async createTemplate(payload: { name: string; schema: FormSchema }) {
    const template = this.templateRepo.create(payload);
    return await this.templateRepo.save(template);
  }

  // ✅ Get All Templates
  async getTemplates() {
    return await this.templateRepo.findAll();
  }

  // ✅ Get Single Template
  async getTemplateById(id: string) {
    const template = await this.templateRepo.findById(id);

    if (!template) {
      throw new Error("Template not found");
    }

    return template;
  }

  // ✅ Submit Form (🔥 MULTI-REPO + VALIDATION)
  async submitForm(templateId: string, formData: Record<string, any>) {
    const template = await this.templateRepo.findById(templateId);

    if (!template) {
      throw new Error("Template not found");
    }

    // 🔥 USE IT HERE
    const dynamicSchema = this.generateZodSchema(template.schema.fields);

    // 🔥 Validate form data
    dynamicSchema.parse(formData);

    const submission = this.submissionRepo.create(template, formData);

    return await this.submissionRepo.save(submission);
  }

  // ✅ Get Submissions
  async getSubmissions(templateId: string) {
    return await this.submissionRepo.findByTemplate(templateId);
  }
}
