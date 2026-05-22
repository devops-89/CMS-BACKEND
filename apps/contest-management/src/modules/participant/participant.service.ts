import { UserRole } from "@libs/entities";
import { ParticipantProfileRepository, ParticipantRepository, UserRepository } from "@libs/repositories";
import { FormSubmissionRepository } from "@libs/repositories";
import { FormTemplateRepository } from "@libs/repositories";

import { ContestRepository } from "@libs/repositories";
import { NotFoundError, InternalServerError, BadRequestError } from "@libs/utils/errors.util";

export class ParticipantService {
  private repo = new ParticipantRepository();
  private submissionRepo = new FormSubmissionRepository();
  private templateRepo = new FormTemplateRepository();
  private contestRepo = new ContestRepository();
  private userRepo = new UserRepository();
  private participantProfileRepo = new ParticipantProfileRepository();


  async addParticipant(contest_id: string, formData: Record<string, any>) {
    // 1. verify contest exists and get its template
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    if (!contest.user_level_template_id) {
      throw new NotFoundError("User level template ID missing");
    }

    const template = await this.templateRepo.findById(contest.user_level_template_id);

    if (!template) {
      throw new NotFoundError("Form template not found");
    }
    // 2. get the form template linked to this contest


    // 3. create form submission using the contest's template
    const submission = this.submissionRepo.create(template, formData);
    const savedSubmission = await this.submissionRepo.save(submission);

    // 4. create participant linking contest + submission
    const participant = this.repo.create({
      contest_id,
      submission_id: savedSubmission.id,
    });
    console.log("participant", participant);

    try {
      return await this.repo.save(participant);
    } catch {
      throw new InternalServerError("Failed to add participant");
    }
  }

  async getParticipants(contest_id: string) {
    const participants = await this.repo.findByContest(contest_id);

    return participants.map((p) => {
      if (p.submission?.data) {
        delete p.submission.data.password;
        delete p.submission.data.confirm_password;
      }
      return p;
    });
  }


  // async addParticipant(
  //   contest_id: string,
  //   formData: Record<string, any>,
  // ) {

  //   const contest = await this.contestRepo.findById(contest_id);

  //   if (!contest) {
  //     throw new NotFoundError("Contest not found");
  //   }

  //   if (!contest.user_level_template_id) {
  //     throw new NotFoundError(
  //       "User level template ID missing",
  //     );
  //   }

  //   const template = await this.templateRepo.findById(
  //     contest.user_level_template_id,
  //   );

  //   if (!template) {
  //     throw new NotFoundError(
  //       "Form template not found",
  //     );
  //   }

  //   const savedSubmission = await this.submissionRepo.save(
  //     this.submissionRepo.create(
  //       template,
  //       formData,
  //     ),
  //   );

  //   const {
  //     firstName,
  //     lastName,
  //     email,
  //     phone,
  //     ...extraProfileData
  //   } = formData;

  //   let user = await this.userRepo.findByEmailWithParticipantProfile(
  //     email,
  //   );

  //   if (!user) {

  //     user = await this.userRepo.save(
  //       this.userRepo.create({
  //         firstName: firstName || "Participant",
  //         lastName: lastName || "",
  //         email,
  //         phone: phone || "",
  //         role: UserRole.PARTICIPANT,
  //         participant_profile_data: extraProfileData,
  //       }),
  //     );
  //   }

  //   else {

  //     user.participant_profile_data = {
  //       ...(user.participant_profile_data || {}),
  //       ...extraProfileData,
  //     };

  //     await this.userRepo.save(user);
  //   }

  //   if (!user.participantProfile) {

  //     await this.participantProfileRepo.save(
  //       this.participantProfileRepo.create({
  //         user,
  //         submission_id: savedSubmission.id,
  //       }),
  //     );
  //   }

  //   const existingParticipant = await this.repo.findOne({
  //     where: {
  //       contest_id,
  //       user_id: user.id,
  //     },
  //   });

  //   if (existingParticipant) {
  //     throw new BadRequestError(
  //       "Participant already joined this contest",
  //     );
  //   }

  //   try {

  //     return await this.repo.save(
  //       this.repo.create({
  //         contest_id,
  //         submission_id: savedSubmission.id,
  //         user_id: user.id,
  //       }),
  //     );

  //   } catch (error) {

  //     console.log(
  //       "Participant Create Error:",
  //       error,
  //     );

  //     throw new InternalServerError(
  //       "Failed to add participant",
  //     );
  //   }
  // }

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

  async updateParticipant(id: string, contest_id: string, formData: Record<string, any>) {

    console.log("id", id);
    console.log("contest_id", contest_id);
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Participant not found");

    if (!existing.submission_id) {
      throw new NotFoundError("Submission not found");
    }

    await this.submissionRepo.update(existing.submission_id, formData);
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