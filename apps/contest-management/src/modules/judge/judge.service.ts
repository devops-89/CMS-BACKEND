import { ContestJudgeRepository } from "@libs/repositories/contest-judge.repository";
import { ContestRepository, JudgeProfileRepository } from "@libs/repositories";
import { NotFoundError, ConflictError, InternalServerError, BadRequestError } from "@libs/utils/errors.util";
import { AppDataSource } from "@libs/database/data-source";
import { EntryAssignment, EntryAssignmentStatus, UserStatus, Entry, VotingPeriod, VotingType, JudgeEvaluation, JudgeEvaluationHistory } from "@libs/entities";

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

  async removeContestJudgesAndAssignments(contest_id: string) {
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    // 1. Soft delete entries in EntryAssignment table for this contest
    const entryAssignmentRepo = AppDataSource.getRepository(EntryAssignment);
    await entryAssignmentRepo.softDelete({ contest_id });

    // 2. Soft delete and update status to inactive for all contest judges of this contest
    await this.repo.softDeleteByContest(contest_id);

    return { message: "Contest judges and entry assignments removed successfully" };
  }

  async removeContestJudgeAndAssignments(contest_id: string, judge_id: string) {
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    const judgeProfile = await this.judgeRepo.findByUserId(judge_id);
    if (!judgeProfile) throw new NotFoundError("Judge profile not found");

    // 1. Soft delete entries in EntryAssignment table for this contest and judge
    const entryAssignmentRepo = AppDataSource.getRepository(EntryAssignment);
    await entryAssignmentRepo.softDelete({ contest_id, judge_id });

    // 2. Soft delete and update status to inactive for this contest judge
    await this.repo.softDeleteByContestAndJudge(contest_id, judgeProfile.id);

    return { message: "Contest judge and entry assignments removed successfully" };
  }

  async getJudgeAssignments(judge_id: string, page: number = 1, limit: number = 10) {
    const entryAssignmentRepo = AppDataSource.getRepository(EntryAssignment);

    const qb = entryAssignmentRepo.createQueryBuilder("assignment")
      .leftJoinAndSelect("assignment.contest", "contest")
      .leftJoinAndSelect("contest.votingPeriods", "votingPeriods")
      .leftJoinAndSelect("assignment.entry", "entry")
      .leftJoinAndSelect("entry.submission", "submission")
      .where("assignment.judge_id = :judge_id", { judge_id });

    qb.orderBy("assignment.assigned_at", "DESC");

    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [docs, totalDocs] = await qb.getManyAndCount();

    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      docs,
      totalDocs,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }

  async evaluateEntryService(
    judgeUserId: string,
    entryId: string,
    payload: {
      scores: { description: string; score: number }[];
      feedback?: string;
    }
  ) {
    const entryRepo = AppDataSource.getRepository(Entry);
    const entryAssignmentRepo = AppDataSource.getRepository(EntryAssignment);
    const votingPeriodRepo = AppDataSource.getRepository(VotingPeriod);
    const evaluationRepo = AppDataSource.getRepository(JudgeEvaluation);
    const historyRepo = AppDataSource.getRepository(JudgeEvaluationHistory);

    // 1. Fetch entry and check assignment
    const entry = await entryRepo.findOne({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundError("Entry not found");

    if (entry.status !== "approved") {
      throw new BadRequestError("Entry is not approved.Please get the entry approved first.");
    }

    const contestId = entry.contest_id;

    // Check if the judge is assigned to this entry
    const assignment = await entryAssignmentRepo.findOne({
      where: { entry_id: entryId, judge_id: judgeUserId },
    });
    if (!assignment) {
      throw new BadRequestError("Judge is not assigned to this entry");
    }

    // 2. Fetch the active voting period of type JUDGE for the contest
    const now = new Date();
    const votingPeriod = await votingPeriodRepo.findOne({
      where: {
        contest_id: contestId,
        voting_type: VotingType.JUDGE,
        is_active: true,
      },
    });

    if (!votingPeriod) {
      throw new NotFoundError("Active judging voting period not found for this contest");
    }

    if (now < votingPeriod.start_date || now > votingPeriod.end_date) {
      throw new ConflictError("Judging voting period is not active currently");
    }

    // 3. Validate criteria scores and compute total score
    if (!payload.scores || !Array.isArray(payload.scores)) {
      throw new BadRequestError("Invalid scores payload");
    }

    const criteria = votingPeriod.criteria || [];
    let totalScore = 0;
    const evaluationScores: { description: string; score: number; weighting: number }[] = [];

    for (const scoreItem of payload.scores) {
      const criterion = criteria.find((c) => c.description === scoreItem.description);
      if (!criterion) {
        throw new BadRequestError(`Criterion '${scoreItem.description}' is not valid for this contest's voting period`);
      }
      if (scoreItem.score < 0 || scoreItem.score > 10) {
        throw new BadRequestError(`Score for '${scoreItem.description}' must be between 0 and 10`);
      }
      // Add raw score directly to totalScore
      totalScore += scoreItem.score;
      evaluationScores.push({
        description: scoreItem.description,
        score: scoreItem.score,
        weighting: criterion.weighting,
      });
    }

    // Check if all criteria from the voting period were scored
    if (evaluationScores.length !== criteria.length) {
      throw new BadRequestError("All criteria defined in the voting period must be scored");
    }

    // 4. Save/Update JudgeEvaluation record and track history
    let evaluation = await evaluationRepo.findOne({
      where: { entry_id: entryId, judge_id: judgeUserId, voting_period_id: votingPeriod.id },
    });

    if (evaluation) {
      evaluation.scores = evaluationScores;
      evaluation.total_score = totalScore;
      evaluation.max_score = votingPeriod.max_score;
      evaluation.feedback = payload.feedback || null;
      evaluation = await evaluationRepo.save(evaluation);
    } else {
      evaluation = evaluationRepo.create({
        entry_id: entryId,
        judge_id: judgeUserId,
        contest_id: contestId,
        voting_period_id: votingPeriod.id,
        scores: evaluationScores,
        total_score: totalScore,
        max_score: votingPeriod.max_score,
        feedback: payload.feedback || null,
      });
      evaluation = await evaluationRepo.save(evaluation);
    }

    // Create history record
    const history = historyRepo.create({
      evaluation_id: evaluation.id,
      scores: evaluationScores,
      total_score: totalScore,
      max_score: votingPeriod.max_score,
      feedback: payload.feedback || null,
    });
    await historyRepo.save(history);

    // 5. Update EntryAssignment status, score, and feedback
    assignment.status = EntryAssignmentStatus.EVALUATED;
    assignment.score = totalScore;
    assignment.feedback = payload.feedback || null;
    assignment.reviewed_at = now;
    await entryAssignmentRepo.save(assignment);

    // Update Entry score
    if ("score" in entry) {
      entry.score = totalScore;
      await entryRepo.save(entry);
    }

    return {
      message: "Evaluation submitted successfully",
      evaluation,
    };
  }

  async getEvaluationService(judgeUserId: string, entryId: string) {
    const evaluationRepo = AppDataSource.getRepository(JudgeEvaluation);
    const historyRepo = AppDataSource.getRepository(JudgeEvaluationHistory);

    const evaluation = await evaluationRepo.findOne({
      where: { entry_id: entryId, judge_id: judgeUserId },
      relations: ["entry", "judge", "contest", "votingPeriod"],
    });

    if (!evaluation) {
      throw new NotFoundError("Evaluation not found");
    }

    const history = await historyRepo.find({
      where: { evaluation_id: evaluation.id },
      order: { created_at: "DESC" },
    });

    return {
      ...evaluation,
      history,
    };
  }

  async updateEvaluationService(
    judgeUserId: string,
    entryId: string,
    payload: {
      scores: { description: string; score: number }[];
      feedback?: string;
    }
  ) {
    const entryRepo = AppDataSource.getRepository(Entry);
    const entryAssignmentRepo = AppDataSource.getRepository(EntryAssignment);
    const votingPeriodRepo = AppDataSource.getRepository(VotingPeriod);
    const evaluationRepo = AppDataSource.getRepository(JudgeEvaluation);
    const historyRepo = AppDataSource.getRepository(JudgeEvaluationHistory);

    // 1. Fetch entry and check assignment
    const entry = await entryRepo.findOne({
      where: { id: entryId },
    });
    if (!entry) throw new NotFoundError("Entry not found");

    const contestId = entry.contest_id;

    // Check if the judge is assigned to this entry
    const assignment = await entryAssignmentRepo.findOne({
      where: { entry_id: entryId, judge_id: judgeUserId },
    });
    if (!assignment) {
      throw new BadRequestError("Judge is not assigned to this entry");
    }

    // 2. Fetch the active voting period of type JUDGE for the contest
    const now = new Date();
    const votingPeriod = await votingPeriodRepo.findOne({
      where: {
        contest_id: contestId,
        voting_type: VotingType.JUDGE,
        is_active: true,
      },
    });

    if (!votingPeriod) {
      throw new NotFoundError("Active judging voting period not found for this contest");
    }

    if (now < votingPeriod.start_date || now > votingPeriod.end_date) {
      throw new ConflictError("Judging voting period is not active currently");
    }

    // 3. Find existing evaluation
    let evaluation = await evaluationRepo.findOne({
      where: { entry_id: entryId, judge_id: judgeUserId, voting_period_id: votingPeriod.id },
    });
    if (!evaluation) {
      throw new NotFoundError("Evaluation not found");
    }

    // 4. Validate criteria scores and compute total score
    if (!payload.scores || !Array.isArray(payload.scores)) {
      throw new BadRequestError("Invalid scores payload");
    }

    const criteria = votingPeriod.criteria || [];
    let totalScore = 0;
    const evaluationScores: { description: string; score: number; weighting: number }[] = [];

    for (const scoreItem of payload.scores) {
      const criterion = criteria.find((c) => c.description === scoreItem.description);
      if (!criterion) {
        throw new BadRequestError(`Criterion '${scoreItem.description}' is not valid for this contest's voting period`);
      }
      if (scoreItem.score < 0 || scoreItem.score > 10) {
        throw new BadRequestError(`Score for '${scoreItem.description}' must be between 0 and 10`);
      }
      // Add raw score directly to totalScore
      totalScore += scoreItem.score;
      evaluationScores.push({
        description: scoreItem.description,
        score: scoreItem.score,
        weighting: criterion.weighting,
      });
    }

    // Check if all criteria from the voting period were scored
    if (evaluationScores.length !== criteria.length) {
      throw new BadRequestError("All criteria defined in the voting period must be scored");
    }

    // 5. Update evaluation
    evaluation.scores = evaluationScores;
    evaluation.total_score = totalScore;
    evaluation.max_score = votingPeriod.max_score;
    evaluation.feedback = payload.feedback || null;
    evaluation = await evaluationRepo.save(evaluation);

    // Create history record
    const history = historyRepo.create({
      evaluation_id: evaluation.id,
      scores: evaluationScores,
      total_score: totalScore,
      max_score: votingPeriod.max_score,
      feedback: payload.feedback || null,
    });
    await historyRepo.save(history);

    // 6. Update EntryAssignment status, score, and feedback
    assignment.status = EntryAssignmentStatus.EVALUATED;
    assignment.score = totalScore;
    assignment.feedback = payload.feedback || null;
    assignment.reviewed_at = now;
    await entryAssignmentRepo.save(assignment);

    // Update Entry score
    if ("score" in entry) {
      entry.score = totalScore;
      await entryRepo.save(entry);
    }

    return {
      message: "Evaluation updated successfully",
      evaluation,
    };
  }
}