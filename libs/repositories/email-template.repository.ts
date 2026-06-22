import { AppDataSource } from "@libs/database/data-source";
import { EmailTemplate } from "@libs/entities/email-template.entity";

export class EmailTemplateRepository {
  private repo = AppDataSource.getRepository(EmailTemplate);

  create(data: Partial<EmailTemplate>) {
    return this.repo.create(data);
  }

  save(template: EmailTemplate) {
    return this.repo.save(template);
  }

  async findByContestId(contestId: string, page: number = 1, limit: number = 10, audience?: string) {
    const where: any = { contest_id: contestId };
    if (audience) {
      where.audience = audience;
    }

    const [docs, totalDocs] = await this.repo.findAndCount({
      where,
      order: { created_at: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    const totalPages = Math.ceil(totalDocs / limit);

    return {
      docs,
      totalDocs,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  findById(id: string) {
    return this.repo.findOne({
      where: { id },
      relations: ["contest"],
    });
  }

  findByContestAndAudienceAndEvent(
    contestId: string,
    audience: string,
    eventType: string
  ) {
    return this.repo.findOne({
      where: {
        contest_id: contestId,
        audience: audience as any,
        event_type: eventType as any,
      },
    });
  }

  update(id: string, data: Partial<EmailTemplate>) {
    return this.repo.update(id, data);
  }

  delete(id: string) {
    return this.repo.softDelete(id);
  }
}
