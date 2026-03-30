import { ContestRepository } from "@libs/repositories";
import { NotFoundError, InternalServerError } from "@libs/utils/errors.util";
import { Contest } from "@libs/entities";
export class ContestService {
  private repo = new ContestRepository();

  async createContest(payload: {
    name: string;
    description?: string;
    start_date: string;
    end_date: string;
    available_regions?: string[];
    // form_template_id: string;
    entry_level_template_id?: string;
    user_level_template_id?: string;
  }) {
    const contest = this.repo.create({
      ...payload,
      start_date: new Date(payload.start_date),
      end_date: new Date(payload.end_date),
    });
    return await this.repo.save(contest);
  }

  async getContests(status?: string, search?: string) {
    return await this.repo.findAll(status, search);
  }

  async getContestById(id: string) {
    const contest = await this.repo.findById(id);
    if (!contest) throw new NotFoundError("Contest not found");
    return contest;
  }

  async getContestOverview(id: string) {
    const contest = await this.repo.findById(id);
    if (!contest) throw new NotFoundError("Contest not found");

    const stats = await this.repo.getStats(id);

    return {
      ...contest,
      total_entries: parseInt(stats?.total_entries || "0"),
      needs_moderation: parseInt(stats?.needs_moderation || "0"),
      total_votes: parseInt(stats?.total_votes || "0"),
    };
  }

  async updateContest(
    id: string,
    payload: Partial<{
      name: string;
      description: string;
      start_date: string;
      end_date: string;
      available_regions: string[];
      form_template_id: string;
      entry_level_template_id?: string;
      user_level_template_id?: string;
    }>
  ) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Contest not found");

    // build a clean Partial<Contest> with proper Date types
    // never mix string dates with Date in the same spread
    const updateData: Partial<Contest> = {};

    if (payload.name) updateData.name = payload.name;
    if (payload.description) updateData.description = payload.description;
    if (payload.available_regions) updateData.available_regions = payload.available_regions;
    if (payload.form_template_id) updateData.form_template_id = payload.form_template_id;
    if (payload.start_date) updateData.start_date = new Date(payload.start_date);
    if (payload.end_date) updateData.end_date = new Date(payload.end_date);
    if (payload.entry_level_template_id) updateData.entry_level_template_id = payload.entry_level_template_id;
    if (payload.user_level_template_id) updateData.user_level_template_id = payload.user_level_template_id;

    try {
      await this.repo.update(id, updateData);
      return await this.repo.findById(id);
    } catch {
      throw new InternalServerError("Failed to update contest");
    }
  }

  async updateStatus(id: string, status: "draft" | "published" | "offline") {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Contest not found");
    await this.repo.update(id, { status });
    return await this.repo.findById(id);
  }

  async deleteContest(id: string) {
    const existing = await this.repo.findById(id);
    if (!existing) throw new NotFoundError("Contest not found");

    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new InternalServerError("Delete failed");

    return { message: "Contest deleted successfully" };
  }
}