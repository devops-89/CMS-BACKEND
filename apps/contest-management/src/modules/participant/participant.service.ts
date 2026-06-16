import { UserRole } from "@libs/entities";
import { ParticipantProfileRepository, ParticipantRepository, UserRepository } from "@libs/repositories";
import { FormSubmissionRepository } from "@libs/repositories";
import { FormTemplateRepository } from "@libs/repositories";

import { ContestRepository } from "@libs/repositories";
import { NotFoundError, InternalServerError, BadRequestError } from "@libs/utils/errors.util";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

export class ParticipantService {
  private repo = new ParticipantRepository();
  private submissionRepo = new FormSubmissionRepository();
  private templateRepo = new FormTemplateRepository();
  private contestRepo = new ContestRepository();
  private userRepo = new UserRepository();
  private participantProfileRepo = new ParticipantProfileRepository();


  // async addParticipant(contest_id: string, formData: Record<string, any>) {
  //   // 1. verify contest exists and get its template
  //   const contest = await this.contestRepo.findById(contest_id);
  //   if (!contest) throw new NotFoundError("Contest not found");

  //   if (!contest.user_level_template_id) {
  //     throw new NotFoundError("User level template ID missing");
  //   }

  //   const template = await this.templateRepo.findById(contest.user_level_template_id);

  //   if (!template) {
  //     throw new NotFoundError("Form template not found");
  //   }
  //   // 2. get the form template linked to this contest


  //   // 3. create form submission using the contest's template
  //   const submission = this.submissionRepo.create(template, formData);
  //   const savedSubmission = await this.submissionRepo.save(submission);

  //   // 4. create participant linking contest + submission
  //   const participant = this.repo.create({
  //     contest_id,
  //     submission_id: savedSubmission.id,
  //   });
  //   console.log("participant", participant);

  //   try {
  //     return await this.repo.save(participant);
  //   } catch {
  //     throw new InternalServerError("Failed to add participant");
  //   }
  // }

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


 async addParticipant(
  contest_id: string,
  formData: Record<string, any>,
) {

  // =========================
  // Fetch Contest
  // =========================

  const contest = await this.contestRepo.findById(
    contest_id,
  );

  if (!contest) {
    throw new NotFoundError(
      "Contest not found",
    );
  }

  if (!contest.user_level_template_id) {
    throw new NotFoundError(
      "User level template ID missing",
    );
  }

  // =========================
  // Fetch Template
  // =========================

  const template = await this.templateRepo.findById(
    contest.user_level_template_id,
  );

  if (!template) {
    throw new NotFoundError(
      "Form template not found",
    );
  }

  // =========================
  // Save Submission
  // =========================

  const savedSubmission =
    await this.submissionRepo.save(
      this.submissionRepo.create(
        template,
        formData,
      ),
    );

  // =========================
  // Flatten Fields
  // =========================

  const flattenFields = (
    fields: any[],
  ): any[] => {

    let result: any[] = [];

    if (!fields) return result;

    for (const field of fields) {

      result.push(field);

      if (field.config?.children) {
        result.push(
          ...flattenFields(
            field.config.children,
          ),
        );
      }
    }

    return result;
  };

  const allFields = flattenFields(
    template.schema?.fields || [],
  );

  // =========================
  // Dynamic Field Resolver
  // =========================

  const getFieldValueByLabel = (
    labelMatchers: string[],
  ) => {

    const field = allFields.find(
      (f) => {

        if (!f.label) {
          return false;
        }

        const normalizedLabel =
          f.label.toLowerCase().trim();

        return labelMatchers.some(
          (matcher) =>
            normalizedLabel.includes(
              matcher.toLowerCase(),
            ),
        );
      },
    );

    if (!field) {
      return undefined;
    }

    return formData[field.id];
  };

  // =========================
  // Extract Dynamic Values
  // =========================

  const firstName =
    getFieldValueByLabel([
      "first name",
    ]);

  const lastName =
    getFieldValueByLabel([
      "last name",
    ]);

  const fullName = 
  getFieldValueByLabel(["Full Name"]) || `${firstName} ${lastName}`;

  const email =
    getFieldValueByLabel([
      "email",
    ]);

  const phone =
    getFieldValueByLabel([
      "phone",
      "phone number",
      "mobile",
    ]);

  const dateOfBirth =
    getFieldValueByLabel([
      "birth date",
      "date of birth",
      "dob",
    ]);

  const schoolName =
    getFieldValueByLabel([
      "school name",
      "school",
    ]);

  const grade =
    getFieldValueByLabel([
      "grade",
      "year",
    ]);

  const country =
    getFieldValueByLabel([
      "country",
      "country of residence",
    ]);

  // =========================
  // Email Fallback
  // =========================

  let resolvedEmail = email;

  if (!resolvedEmail) {

    resolvedEmail =
      `participant_${Date.now()}_${Math.random()
        .toString(36)
        .substring(2, 6)}@launchpad-temp.com`;
  }

  // =========================
  // Find Existing User
  // =========================

  let user =
    await this.userRepo
      .findByEmailWithParticipantProfile(
        resolvedEmail,
      );

  // =========================
  // Create User
  // =========================

  if (!user) {

    const tempPassword =
      crypto.randomBytes(16)
        .toString("hex");

    const hashedPassword =
      await bcrypt.hash(
        tempPassword,
        12,
      );

    user = await this.userRepo.save(

      this.userRepo.create({

        firstName:
          firstName || "",

        lastName:
          lastName || "",

        fullName: fullName,

        email: resolvedEmail,

        phone:
          phone || "",

        password: "",

        role:
          UserRole.PARTICIPANT,

        form_template_id:
          template.id,

        participant_profile_data:
          formData,
      }),
    );

  } else {

    // =========================
    // Update Existing User
    // =========================

    user.participant_profile_data = {
      ...(user.participant_profile_data || {}),
      ...formData,
    };

    if (firstName) {
      user.firstName = firstName;
    }

    if (lastName) {
      user.lastName = lastName;
    }

    if (phone) {
      user.phone = phone;
    }

    if (template?.id) {
      user.form_template_id =
        template.id;
    }

    await this.userRepo.save(user);
  }

  // =========================
  // Create / Update Profile
  // =========================

  if (!user.participantProfile) {

    const profileData: any = {

      user,

      submission_id:
        savedSubmission.id,

      schoolName,

      country,

      grade,
    };

    if (dateOfBirth) {
      profileData.dateOfBirth =
        new Date(dateOfBirth);
    }

    const profile =
      await this.participantProfileRepo.save(

        this.participantProfileRepo.create(
          profileData,
        ),
      );

    user.participantProfile =
      profile;

  } else {

    const existingProfile =
      user.participantProfile;

    let profileUpdated = false;

    if (dateOfBirth) {

      existingProfile.dateOfBirth =
        new Date(dateOfBirth);

      profileUpdated = true;
    }

    if (country) {

      existingProfile.country =
        country;

      profileUpdated = true;
    }

    if (schoolName) {

      existingProfile.schoolName =
        schoolName;

      profileUpdated = true;
    }

    if (grade) {

      existingProfile.grade =
        grade;

      profileUpdated = true;
    }

    if (profileUpdated) {

      await this.participantProfileRepo.save(
        existingProfile,
      );
    }
  }

  // =========================
  // Prevent Duplicate Join
  // =========================

  const existingParticipant =
    await this.repo.findOne({
      where: {
        contest_id,
        user_id: user.id,
      },
    });

  if (existingParticipant) {

    throw new BadRequestError(
      "Participant already joined this contest",
    );
  }

  // =========================
  // Create Participant
  // =========================

  try {

    return await this.repo.save(

      this.repo.create({

        contest_id,

        submission_id:
          savedSubmission.id,

        user_id: user.id,
        status : "approved",
      }),
    );

  } catch (error) {

    console.log(
      "Participant Create Error:",
      error,
    );

    throw new InternalServerError(
      "Failed to add participant",
    );
  }
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