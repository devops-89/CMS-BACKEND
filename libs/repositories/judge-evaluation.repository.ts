import { AppDataSource } from "@libs/database/data-source";
import { JudgeEvaluation } from "@libs/entities";
import { Repository } from "typeorm";

export class JudgeEvaluationRepository {
  private repo: Repository<JudgeEvaluation>;

  constructor() {
    this.repo = AppDataSource.getRepository(JudgeEvaluation);
  }

  create(data: Partial<JudgeEvaluation>) {
    return this.repo.create(data);
  }

  async save(evaluation: JudgeEvaluation) {
    return this.repo.save(evaluation);
  }

  async findOne(options: any) {
    return this.repo.findOne(options);
  }

  async findByEntryAndJudge(entry_id: string, judge_id: string) {
    return this.repo.findOne({
      where: { entry_id, judge_id },
      relations: ["entry", "judge", "contest", "votingPeriod"],
    });
  }

  async findByContest(contest_id: string) {
    return this.repo.find({
      where: { contest_id },
      relations: ["entry", "judge", "votingPeriod"],
    });
  }
}
