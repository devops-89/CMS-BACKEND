import { ContestJudgeRepository } from "@libs/repositories/contest-judge.repository";
import { ContestRepository, JudgeProfileRepository } from "@libs/repositories";
import { NotFoundError, ConflictError, InternalServerError } from "@libs/utils/errors.util";

export class ContestJudgeService {
  private repo = new ContestJudgeRepository();
  private contestRepo = new ContestRepository();
  private judgeRepo = new JudgeProfileRepository();

async assignJudge(contest_id: string, payload: { judge_id: string }) {
  const contest = await this.contestRepo.findById(contest_id);
  if (!contest) throw new NotFoundError("Contest not found");

  // get judge profile from user id
  const judgeProfile = await this.judgeRepo.findByUserId(payload.judge_id);
  if (!judgeProfile) throw new NotFoundError("Judge not found");

  //  check duplicate using PROFILE ID
  const existing = await this.repo.findOne(contest_id, judgeProfile.id);
  if (existing) throw new ConflictError("Judge already assigned");

  //  use profile id here
  const judge = this.repo.create({
    contest_id,
    judge_profile_id: judgeProfile.id,
  });

  return await this.repo.save(judge);
}

  async getJudges(contest_id: string) {
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");
    return await this.repo.findByContest(contest_id);
  }

  async updateStatus(id: string, status: "active" | "inactive") {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Judge assignment not found");
    await this.repo.updateStatus(id, status);
    return await this.repo.findById(id);
  }

  async removeJudge(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Judge assignment not found");

    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new InternalServerError("Delete failed");

    return { message: "Judge removed from contest successfully" };
  }
}