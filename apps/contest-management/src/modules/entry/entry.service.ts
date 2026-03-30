
import { EntryRepository, VoteRepository, ContestRepository } from "@libs/repositories";
import { NotFoundError, InternalServerError } from "@libs/utils/errors.util";

export class EntryService {
  private repo = new EntryRepository();
  private voteRepo = new VoteRepository();
  private contestRepo = new ContestRepository();

  async createEntry(contest_id: string, payload: {
    participant_id: string;
    title: string;
    thumbnail_url?: string;
  }) {
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    const entry = this.repo.create({ contest_id, ...payload });

    try {
      return await this.repo.save(entry);
    } catch {
      throw new InternalServerError("Failed to create entry");
    }
  }

  async getEntries(contest_id: string) {
    return await this.repo.findByContest(contest_id);
  }

  async getEntryById(id: string, contest_id: string) {
    const entry = await this.repo.findById(id, contest_id);
    if (!entry) throw new NotFoundError("Entry not found");
    return entry;
  }

  async updateStatus(id: string, contest_id: string, status: "pending" | "approved" | "rejected") {
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Entry not found");
    await this.repo.updateStatus(id, status);
    return await this.repo.findById(id, contest_id);
  }

  async deleteEntry(id: string, contest_id: string) {
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Entry not found");

    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new InternalServerError("Delete failed");

    return { message: "Entry deleted successfully" };
  }
}