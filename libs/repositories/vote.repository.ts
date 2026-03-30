import { AppDataSource } from "@libs/database/data-source";
import {Vote} from "@libs/entities";

export class VoteRepository {
  private repo = AppDataSource.getRepository(Vote);

  create(data: Partial<Vote>) {
    return this.repo.create(data);
  }

  save(vote: Vote) {
    return this.repo.save(vote);
  }

  findByContest(contest_id: string, search?: string) {
    const qb = this.repo.createQueryBuilder("vote")
      .innerJoin("vote.entry", "entry")
      .where("entry.contest_id = :contest_id", { contest_id })
      .orderBy("vote.created_at", "DESC");

    if (search) {
      qb.andWhere(
        "vote.vote_email ILIKE :search OR vote.user_email ILIKE :search",
        { search: `%${search}%` }
      );
    }

    return qb.getMany();
  }

  // duplicate check
  findDuplicate(entry_id: string, vote_email: string, ip: string, fingerprint: string) {
    return this.repo.createQueryBuilder("vote")
      .where("vote.entry_id = :entry_id", { entry_id })
      .andWhere(
        "(vote.vote_email = :email OR vote.ip_address = :ip OR vote.fingerprint = :fp)",
        { email: vote_email, ip, fp: fingerprint }
      )
      .getOne();
  }

  // recalculate score for an entry
  getScoreForEntry(entry_id: string) {
    return this.repo.createQueryBuilder("vote")
      .select("COALESCE(AVG(vote.judge_score), 0)", "avg_judge")
      .addSelect("COALESCE(SUM(vote.vote_count), 0)", "total_votes")
      .where("vote.entry_id = :entry_id", { entry_id })
      .getRawOne();
  }

  delete(id: string) {
    return this.repo.delete(id);
  }
}