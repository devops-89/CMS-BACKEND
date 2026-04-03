import {
  EntryRepository,
  ContestRepository,
  FormSubmissionRepository,
} from "@libs/repositories";

import { NotFoundError, InternalServerError } from "@libs/utils/errors.util";

export class EntryService {
  private repo = new EntryRepository();
  private contestRepo = new ContestRepository();
  private submissionRepo = new FormSubmissionRepository();

  async createEntry(
    contest_id: string,
    payload: {
      participant_id: string;
      data: Record<string, any>;
    }
  ) {
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    if (!contest.entryLevelTemplate) {
      throw new NotFoundError("Entry level template not configured");
    }

    // ✅ Step 1: create submission
    const submission = this.submissionRepo.create(
      contest.entryLevelTemplate,
      payload.data
    );

    const savedSubmission = await this.submissionRepo.save(submission);

    // ✅ Step 2: create entry
    const entry = this.repo.create({
      contest_id,
      participant_id: payload.participant_id,
      submission_id: savedSubmission.id,
    });

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

  async updateStatus(
    id: string,
    contest_id: string,
    status: "pending" | "approved" | "rejected"
  ) {
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Entry not found");

    await this.repo.updateStatus(id, status);
    return await this.repo.findById(id, contest_id);
  }

  async updateEntry(
  id: string,
  contest_id: string,
  formData: Record<string, any>
) {
  //  check entry exists
  const existing = await this.repo.findById(id, contest_id);
  if (!existing) throw new NotFoundError("Entry not found");

  //  ensure submission exists
  if (!existing.submission_id) {
    throw new NotFoundError("Submission not found");
  }

  //  update submission data
  await this.submissionRepo.update(existing.submission_id, formData);

  //  return updated entry
  return await this.repo.findById(id, contest_id);
}

  async deleteEntry(id: string, contest_id: string) {
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Entry not found");

    const result = await this.repo.delete(id);
    if (result.affected === 0)
      throw new InternalServerError("Delete failed");

    return { message: "Entry deleted successfully" };
  }
}