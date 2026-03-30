import {ParticipantRepository} from "@libs/repositories";
import { FormSubmissionRepository } from "@libs/repositories";
import { FormTemplateRepository } from "@libs/repositories";

import { ContestRepository } from "@libs/repositories";
import { NotFoundError, InternalServerError } from "@libs/utils/errors.util";

export class ParticipantService {
  private repo = new ParticipantRepository();
  private submissionRepo = new FormSubmissionRepository();
  private templateRepo = new FormTemplateRepository();
  private contestRepo = new ContestRepository();

  async addParticipant(contest_id: string, formData: Record<string, any>) {
    // 1. verify contest exists and get its template
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    // 2. get the form template linked to this contest
    const template = await this.templateRepo.findById(contest.form_template_id);
    if (!template) throw new NotFoundError("Form template not found");

    // 3. create form submission using the contest's template
    const submission = this.submissionRepo.create(template, formData);
    const savedSubmission = await this.submissionRepo.save(submission);

    // 4. create participant linking contest + submission
    const participant = this.repo.create({
      contest_id,
      submission_id: savedSubmission.id,
    });

    try {
      return await this.repo.save(participant);
    } catch {
      throw new InternalServerError("Failed to add participant");
    }
  }

  async getParticipants(contest_id: string) {
    return await this.repo.findByContest(contest_id);
  }

  async getParticipantById(id: string, contest_id: string) {
    const participant = await this.repo.findById(id, contest_id);
    if (!participant) throw new NotFoundError("Participant not found");
    return participant;
  }

  async updateStatus(id: string, contest_id: string, status: "pending" | "approved" | "rejected") {
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Participant not found");
    await this.repo.updateStatus(id, status);
    return await this.repo.findById(id, contest_id);
  }

  async removeParticipant(id: string, contest_id: string) {
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Participant not found");

    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new InternalServerError("Delete failed");

    return { message: "Participant removed successfully" };
  }
}