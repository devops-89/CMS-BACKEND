import { AppDataSource } from "@libs/database/data-source";
import { JudgeAssignedVotingPeriod } from "@libs/entities";

export class JudgeAssignedVotingPeriodRepository {
  private repo = AppDataSource.getRepository(JudgeAssignedVotingPeriod);

  create(data: Partial<JudgeAssignedVotingPeriod>) {
    return this.repo.create(data);
  }

  save(assigned: JudgeAssignedVotingPeriod) {
    return this.repo.save(assigned);
  }

  findByVotingPeriodId(votingPeriodId: string) {
    return this.repo.find({
      where: { voting_period_id: votingPeriodId },
      relations: ["judge"],
    });
  }

  deleteByVotingPeriodId(votingPeriodId: string) {
    return this.repo.delete({ voting_period_id: votingPeriodId });
  }
}
