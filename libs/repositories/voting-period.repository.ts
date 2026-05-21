import { AppDataSource } from "@libs/database/data-source";
import { VotingPeriod } from "@libs/entities";

export class VotingPeriodRepository {
  private repo = AppDataSource.getRepository(VotingPeriod);

  create(data: Partial<VotingPeriod>) {
    return this.repo.create(data);
  }

  save(votingPeriod: VotingPeriod) {
    return this.repo.save(votingPeriod);
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: ["contest"] });
  }

  findByContestId(contestId: string) {
    return this.repo.find({
      where: { contest_id: contestId },
      order: { created_at: "DESC" },
    });
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}
