import { AppDataSource } from "@libs/database/data-source";
import { ContestJudge } from "@libs/entities";

export class ContestJudgeRepository {
  private repo = AppDataSource.getRepository(ContestJudge);

  create(data: Partial<ContestJudge>) {
    return this.repo.create(data);
  }

  save(judge: ContestJudge) {
    return this.repo.save(judge);
  }

findByContest(contest_id: string) {
  return this.repo.find({
    where: { contest_id },
    relations: ["judgeProfile", "judgeProfile.user"], 
    order: { assigned_at: "DESC" },
  });
}

  findOne(contest_id: string, judge_profile_id: string) {
  return this.repo.findOne({
    where: { contest_id, judge_profile_id },
  });
}

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  updateStatus(id: string, status: "active" | "inactive") {
    return this.repo.update(id, { status });
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}