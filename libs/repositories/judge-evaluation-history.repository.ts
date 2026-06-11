import { AppDataSource } from "@libs/database/data-source";
import { JudgeEvaluationHistory } from "@libs/entities";
import { Repository } from "typeorm";

export class JudgeEvaluationHistoryRepository {
  private repo: Repository<JudgeEvaluationHistory>;

  constructor() {
    this.repo = AppDataSource.getRepository(JudgeEvaluationHistory);
  }

  create(data: Partial<JudgeEvaluationHistory>) {
    return this.repo.create(data);
  }

  async save(history: JudgeEvaluationHistory) {
    return this.repo.save(history);
  }

  async findByEvaluationId(evaluation_id: string) {
    return this.repo.find({
      where: { evaluation_id },
      order: { created_at: "DESC" },
    });
  }
}
