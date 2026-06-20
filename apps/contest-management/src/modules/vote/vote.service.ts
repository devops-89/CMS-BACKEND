
import { VoteRepository, EntryRepository } from "@libs/repositories";
import { NotFoundError, ConflictError, InternalServerError, ForbiddenError, BadRequestError, UnprocessableEntityError } from "@libs/utils/errors.util";
import { AppDataSource } from "@libs/database/data-source";
import { Contest, Entry, Participant, User, VotingPeriod, VotingType } from "@libs/entities";
import * as crypto from "crypto";

export class VoteService {
  private repo = new VoteRepository();
  private entryRepo = new EntryRepository();

  async castVote(
    contest_id: string,
    entry_id: string,
    userId?: string,
    payload: {
      comment?: string;
      ip_address?: string;
      session_id?: string;
      fingerprint?: string;
      judge_score?: number;
    } = {}
  ) {
    if (!entry_id || entry_id === "undefined") {
      throw new BadRequestError("Entry ID is required and must be valid");
    }

    if (!userId) {
      throw new ForbiddenError("User ID not found in token");
    }

    if (!payload.comment || payload.comment.trim() === "") {
      throw new UnprocessableEntityError("Comment is required");
    }

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundError("User not found");
    }

    const voterEmail = user.email || "";

    // 1. verify entry belongs to this contest
    const entry = await this.entryRepo.findById(entry_id, contest_id);
    if (!entry) throw new NotFoundError("Entry not found");
    if (entry.status !== "semifinal") throw new ConflictError("Entry is not moved to semifinal for voting");

    // 1.1 verify active public voting period exists and is active currently
    const now = new Date();
    const votingPeriodRepo = AppDataSource.getRepository(VotingPeriod);
    const votingPeriod = await votingPeriodRepo.findOne({
      where: {
        contest_id,
        voting_type: VotingType.PUBLIC,
        is_active: true,
      },
    });

    if (!votingPeriod) {
      throw new ConflictError("Active public voting period not found for this contest");
    }

    if (now < votingPeriod.start_date || now > votingPeriod.end_date) {
      throw new ConflictError("Public voting period is not active currently");
    }

    // 2. duplicate check
    const duplicate = await this.repo.findDuplicate(
      entry_id,
      voterEmail,
      user.id
    );
    if (duplicate) throw new ConflictError("You have already voted for this entry");

    const sessionId = payload.session_id || crypto.randomBytes(16).toString("hex");
    const fingerprint = payload.fingerprint || crypto.randomBytes(16).toString("hex");

    // 3. save vote
    // const vote = this.repo.create({
    //   entry_id,
    //   contest_id,
    //   participant_id: entry.participant_id,
    //   user_id: user.id,
    //   voter_email: voterEmail,
    //   comment: payload.comment,
    //   commentedAt: now,
    //   ip_address: payload.ip_address || null,
    //   session_id: sessionId,
    //   fingerprint: fingerprint,
    //   judge_score: payload.judge_score || null,
    // });

    const vote = this.repo.create({
  entry: { id: entry_id } as Entry,
  contest: { id: contest_id } as Contest,
  participant: { id: entry.participant_id } as Participant,
  user: { id: user.id } as User,

  voter_email: voterEmail,
      voter_name: user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim() || null,
  comment: payload.comment,
  commentedAt: now,
  ip_address: payload.ip_address,
  session_id: sessionId,
  fingerprint,
  judge_score: payload.judge_score ?? null,
});
    try {
      console.log("vote => ", vote);
      const saved = await this.repo.save(vote);

      // 4. recalculate and update entry score and voteCount
      const scoreData = await this.repo.getScoreForEntry(entry_id);
      const avgJudge = parseFloat(scoreData.avg_judge) || 0;
      const totalVotes = parseInt(scoreData.total_votes, 10) || 0;

      entry.voteCount = totalVotes;
      await this.entryRepo.save(entry);

      return saved;
    } catch (error: any) {
  console.log("ERROR:", error);
  console.log("MESSAGE:", error.message);
  console.log("DETAIL:", error.detail);
  console.log("QUERY:", error.query);
  console.log("PARAMETERS:", error.parameters);

  throw error;
}
  }

  async getVotes(contest_id: string, search?: string) {
    return await this.repo.findByContest(contest_id, search);
  }

  async deleteVote(id: string, contest_id: string) {
    // verify it belongs to this contest
    const votes = await this.repo.findByContest(contest_id);
    const vote = votes.find((v) => v.id === id);
    if (!vote) throw new NotFoundError("Vote not found");

    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new InternalServerError("Delete failed");

    return { message: "Vote removed successfully" };
  }
}