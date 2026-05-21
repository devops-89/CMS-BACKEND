import { ContestJudgeRepository } from "@libs/repositories/contest-judge.repository";
import { ContestRepository, JudgeProfileRepository } from "@libs/repositories";
import { NotFoundError, ConflictError, InternalServerError } from "@libs/utils/errors.util";
import { AppDataSource } from "@libs/database/data-source";
import { EntryAssignment, EntryAssignmentStatus, UserStatus } from "@libs/entities";

export class ContestJudgeService {
  private repo = new ContestJudgeRepository();
  private contestRepo = new ContestRepository();
  private judgeRepo = new JudgeProfileRepository();

  async assignJudge(contest_id: string, payload: { judge_id: string; entry_ids?: string[] }) {
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    // get judge profile from user id
    const judgeProfile = await this.judgeRepo.findByUserId(payload.judge_id);
    if (!judgeProfile || !judgeProfile.user) {
      throw new NotFoundError("Judge not found");
    }

    // Validate judge is active
    if (judgeProfile.user.status !== UserStatus.ACTIVE) {
      throw new ConflictError("Judge status must be Active");
    }

    if (!judgeProfile.isActive) {
      throw new ConflictError("Judge profile is inactive");
    }


    // check if already assigned to the contest
    let contestJudge = await this.repo.findOne(contest_id, judgeProfile.id);
    if (!contestJudge) {
      contestJudge = this.repo.create({
        contest_id,
        judge_profile_id: judgeProfile.id,
        status: "active",
      });
      contestJudge = await this.repo.save(contestJudge);
    }

    const entryAssignments: EntryAssignment[] = [];
    const entryAssignmentRepo = AppDataSource.getRepository(EntryAssignment);

    if (payload.entry_ids && Array.isArray(payload.entry_ids)) {
      // 1. Check for duplicates first
      for (const entryId of payload.entry_ids) {
        const existingAssignment = await entryAssignmentRepo.findOne({
          where: {
            contest_id,
            judge_id: payload.judge_id,
            entry_id: entryId,
          },
        });

        if (existingAssignment) {
          throw new ConflictError("This entries already assigned to this judge");
        }
      }

      // 2. Create assignments since none are duplicates
      for (const entryId of payload.entry_ids) {
        const assignment = entryAssignmentRepo.create({
          contest_id,
          judge_id: payload.judge_id,
          entry_id: entryId,
          status: EntryAssignmentStatus.PENDING,
        });
        await entryAssignmentRepo.save(assignment);
        entryAssignments.push(assignment);
      }
    }


    return {
      contestJudge,
      assignments: entryAssignments,
    };
  }

  async editAssignments(contest_id: string, payload: { judge_id: string; entry_ids: string[] }) {
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    // get judge profile from user id
    const judgeProfile = await this.judgeRepo.findByUserId(payload.judge_id);
    if (!judgeProfile || !judgeProfile.user) {
      throw new NotFoundError("Judge not found");
    }

    // Validate judge is active
    if (judgeProfile.user.status !== UserStatus.ACTIVE) {
      throw new ConflictError("Judge status must be Active");
    }
    if (!judgeProfile.isActive) {
      throw new ConflictError("Judge profile is inactive");
    }

    // Ensure the judge is assigned to the contest
    let contestJudge = await this.repo.findOne(contest_id, judgeProfile.id);
    if (!contestJudge) {
      contestJudge = this.repo.create({
        contest_id,
        judge_profile_id: judgeProfile.id,
        status: "active",
      });
      contestJudge = await this.repo.save(contestJudge);
    }

    const entryAssignmentRepo = AppDataSource.getRepository(EntryAssignment);

    // Fetch current assignments
    const currentAssignments = await entryAssignmentRepo.find({
      where: {
        contest_id,
        judge_id: payload.judge_id,
      },
    });

    const currentEntryIds = currentAssignments.map((a) => a.entry_id);
    const newEntryIds = payload.entry_ids || [];

    // Identify and remove assignments that are not in the new list
    const toDelete = currentAssignments.filter((a) => !newEntryIds.includes(a.entry_id));
    if (toDelete.length > 0) {
      await entryAssignmentRepo.remove(toDelete);
    }

    // Identify and add new assignments
    const toAddEntryIds = newEntryIds.filter((id) => !currentEntryIds.includes(id));
    for (const entryId of toAddEntryIds) {
      const assignment = entryAssignmentRepo.create({
        contest_id,
        judge_id: payload.judge_id,
        entry_id: entryId,
        status: EntryAssignmentStatus.PENDING,
      });
      await entryAssignmentRepo.save(assignment);
    }

    // Return the updated assignment list
    const finalAssignments = await entryAssignmentRepo.find({
      where: {
        contest_id,
        judge_id: payload.judge_id,
      },
    });

    return {
      contestJudge,
      assignments: finalAssignments,
    };
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