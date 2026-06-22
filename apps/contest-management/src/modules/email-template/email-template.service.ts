import { EmailTemplateRepository } from "@libs/repositories";
import { ContestRepository } from "@libs/repositories";
import {
  NotFoundError,
  InternalServerError,
  ConflictError,
  BadRequestError,
} from "@libs/utils/errors.util";
import { EmailTemplate, TEMPLATE_AUDIENCE, TEMPLATE_EVENT_TYPE } from "@libs/entities";

export class EmailTemplateService {
  private repo = new EmailTemplateRepository();
  private contestRepo = new ContestRepository();

  async createEmailTemplate(
    contestId: string,
    payload: {
      audience: TEMPLATE_AUDIENCE;
      event_type: TEMPLATE_EVENT_TYPE;
      subject: string;
      body: string;
      available_variables?: string[];
      is_active?: boolean;
    }
  ) {
    // Validate contest exists
    const contest = await this.contestRepo.findById(contestId);
    if (!contest) throw new NotFoundError("Contest not found");

    // Check unique constraint: contest_id + audience + event_type
    const existing = await this.repo.findByContestAndAudienceAndEvent(
      contestId,
      payload.audience,
      payload.event_type
    );
    if (existing) {
      throw new ConflictError(
        `Email template for audience '${payload.audience}' and event '${payload.event_type}' already exists for this contest`
      );
    }

    const template = this.repo.create({
      contest_id: contestId,
      audience: payload.audience,
      event_type: payload.event_type,
      subject: payload.subject,
      body: payload.body,
      available_variables: payload.available_variables ?? [],
      is_active: payload.is_active ?? true,
    });

    return await this.repo.save(template);
  }

  async getEmailTemplatesByContest(contestId: string, page: number = 1, limit: number = 10) {
    const contest = await this.contestRepo.findById(contestId);
    if (!contest) throw new NotFoundError("Contest not found");

    return await this.repo.findByContestId(contestId, page, limit);
  }

  async getEmailTemplateById(templateId: string) {
    const template = await this.repo.findById(templateId);
    if (!template) throw new NotFoundError("Email template not found");
    return template;
  }

  async updateEmailTemplate(
    templateId: string,
    payload: Partial<{
      audience: TEMPLATE_AUDIENCE;
      event_type: TEMPLATE_EVENT_TYPE;
      subject: string;
      body: string;
      available_variables: string[];
      is_active: boolean;
    }>
  ) {
    const existing = await this.repo.findById(templateId);
    if (!existing) throw new NotFoundError("Email template not found");

    // If audience or event_type is being changed, check for uniqueness
    const newAudience = payload.audience ?? existing.audience;
    const newEventType = payload.event_type ?? existing.event_type;

    if (payload.audience || payload.event_type) {
      const duplicate = await this.repo.findByContestAndAudienceAndEvent(
        existing.contest_id,
        newAudience,
        newEventType
      );
      if (duplicate && duplicate.id !== templateId) {
        throw new ConflictError(
          `Email template for audience '${newAudience}' and event '${newEventType}' already exists for this contest`
        );
      }
    }

    const updateData: Partial<EmailTemplate> = {};

    if (payload.audience) updateData.audience = payload.audience;
    if (payload.event_type) updateData.event_type = payload.event_type;
    if (payload.subject) updateData.subject = payload.subject;
    if (payload.body) updateData.body = payload.body;
    if (payload.available_variables !== undefined)
      updateData.available_variables = payload.available_variables;
    if (payload.is_active !== undefined)
      updateData.is_active = payload.is_active;

    try {
      await this.repo.update(templateId, updateData);
      return await this.repo.findById(templateId);
    } catch {
      throw new InternalServerError("Failed to update email template");
    }
  }

  async deleteEmailTemplate(templateId: string) {
    const existing = await this.repo.findById(templateId);
    if (!existing) throw new NotFoundError("Email template not found");

    const result = await this.repo.delete(templateId);
    if (result.affected === 0)
      throw new InternalServerError("Delete failed");

    return { message: "Email template deleted successfully" };
  }
}
