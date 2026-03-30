
import {VoteRepository, EntryRepository} from "@libs/repositories";
import { NotFoundError, ConflictError, InternalServerError } from "@libs/utils/errors.util";

export class VoteService {
  private repo = new VoteRepository();
  private entryRepo = new EntryRepository();

  async castVote(contest_id: string, payload: {
    entry_id: string;
    vote_email: string;
    user_email?: string;
    schedule_name?: string;
    vote_count?: number;
    payment_status?: "paid" | "unpaid";
    judge_score?: number;
    ip_address?: string;
    session_id?: string;
    fingerprint?: string;
  }) {
    // 1. verify entry belongs to this contest
    const entry = await this.entryRepo.findById(payload.entry_id, contest_id);
    if (!entry) throw new NotFoundError("Entry not found");
    if (entry.status !== "approved") throw new ConflictError("Entry is not approved for voting");

    // 2. duplicate check
    const duplicate = await this.repo.findDuplicate(
      payload.entry_id,
      payload.vote_email,
      payload.ip_address || "",
      payload.fingerprint || ""
    );
    if (duplicate) throw new ConflictError("You have already voted for this entry");

    // 3. save vote
    const vote = this.repo.create(payload);
    const saved = await this.repo.save(vote);

    // 4. recalculate and update entry score
    const scoreData = await this.repo.getScoreForEntry(payload.entry_id);
    const newScore = parseFloat(scoreData.avg_judge) || parseInt(scoreData.total_votes);
    await this.entryRepo.updateScore(payload.entry_id, newScore);

    return saved;
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