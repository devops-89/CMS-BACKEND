import { FormTemplateRepository } from "@libs/repositories/form-template.repository";
import { FormSubmissionRepository } from "@libs/repositories/form-submission.repository";
import { FormSchema } from "@libs/entities/form-template.entity";

export class FormBuilderService {
  private templateRepo = new FormTemplateRepository();
  private submissionRepo = new FormSubmissionRepository();

  // ✅ Create Template
  async createTemplate(payload: {
    name: string;
    schema: FormSchema;
  }) {
    if (!payload.name || !payload.schema?.fields) {
      throw new Error("Invalid template payload");
    }

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

    // 🔥 BASIC VALIDATION FROM SCHEMA
    const fields = template.schema.fields;

    for (const field of fields) {
      if (field.required && !(field.name in formData)) {
        throw new Error(`${field.name} is required`);
      }
    }

    const submission = this.submissionRepo.create(template, formData);

    return await this.submissionRepo.save(submission);
  }

  // ✅ Get Submissions
  async getSubmissions(templateId: string) {
    return await this.submissionRepo.findByTemplate(templateId);
  }
}