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

    const contest = await this.contestRepo.findById(contest_id);

    if (!contest) {
      throw new NotFoundError("Contest not found");
    }

    if (!contest.user_level_template_id) {
      throw new NotFoundError(
        "User level template ID missing",
      );
    }

    const template = await this.templateRepo.findById(
      contest.user_level_template_id,
    );

    if (!template) {
      throw new NotFoundError(
        "Form template not found",
      );
    }

    const savedSubmission = await this.submissionRepo.save(
      this.submissionRepo.create(
        template,
        formData,
      ),
    );

    // Flatten template fields to handle step breaks or groups
    const flattenFields = (fields: any[]): any[] => {
      let result: any[] = [];
      if (!fields) return result;
      for (const f of fields) {
        result.push(f);
        if (f.config?.children) {
          result.push(...flattenFields(f.config.children));
        }
      }
      return result;
    };

    const allFields = flattenFields(template.schema?.fields || []);

    // Helper to find a value from formData by field type, variant, or label
    const findFieldVal = (variants: string[], labels: string[], type?: string) => {
      const fieldDef = allFields.find(f => {
        if (f.variant && variants.some(v => v.toLowerCase() === f.variant?.toLowerCase())) {
          return true;
        }
        if (type && f.type && f.type.toLowerCase() === type.toLowerCase()) {
          return true;
        }
        if (f.label && labels.some(l => f.label.toLowerCase().includes(l.toLowerCase()))) {
          return true;
        }
        return false;
      });

      if (fieldDef && formData[fieldDef.id] !== undefined) {
        return formData[fieldDef.id];
      }

      // Fallback check direct keys in formData
      for (const variant of variants) {
        if (formData[variant] !== undefined) return formData[variant];
      }
      for (const label of labels) {
        if (formData[label] !== undefined) return formData[label];
      }
      
      return undefined;
    };

    const firstName = findFieldVal(["firstName", "first_name", "fname"], ["first name", "given name"]);
    const lastName = findFieldVal(["lastName", "last_name", "lname"], ["last name", "surname", "family name"]);
    const email = findFieldVal(["email"], ["email", "e-mail"], "email");
    const phone = findFieldVal(["phone", "phoneNumber", "phone_number"], ["phone", "mobile", "contact"], "phone");
    const dateOfBirth = findFieldVal(["dateOfBirth", "dob", "birthDate"], ["date of birth", "dob", "birthdate"]);
    const country = findFieldVal(["country"], ["country", "nation"]);
    const schoolName = findFieldVal(["schoolName", "school_name", "school"], ["school name", "school", "institution"]);
    const grade = findFieldVal(["grade", "class"], ["grade", "class", "year"]);

    // Fallback: If no email is provided, generate a unique placeholder to avoid database constraints
    let resolvedEmail = email;
    if (!resolvedEmail) {
      resolvedEmail = `participant_${Date.now()}_${Math.random().toString(36).substring(2, 6)}@launchpad-temp.com`;
    }

    let user = await this.userRepo.findByEmailWithParticipantProfile(
      resolvedEmail,
    );

    if (!user) {
      // Generate a secure random password for the auto-created user
      const tempPassword = crypto.randomBytes(16).toString("hex");
      const hashedPassword = await bcrypt.hash(tempPassword, 12);

      user = await this.userRepo.save(
        this.userRepo.create({
          firstName: firstName || "Participant",
          lastName: lastName || "",
          email: resolvedEmail,
          phone: phone || "",
          password: hashedPassword,
          role: UserRole.PARTICIPANT,
          participant_profile_data: formData, // Store the entire raw payload here
        }),
      );
    } else {
      user.participant_profile_data = {
        ...(user.participant_profile_data || {}),
        ...formData, // Store/merge the entire raw payload here
      };

      if (firstName) user.firstName = firstName;
      if (lastName) user.lastName = lastName;
      if (phone) user.phone = phone;

      await this.userRepo.save(user);
    }

    if (!user.participantProfile) {
      const profileData: any = {
        user,
        submission_id: savedSubmission.id,
      };
      if (dateOfBirth) profileData.dateOfBirth = new Date(dateOfBirth);
      if (country) profileData.country = country;
      if (schoolName) profileData.schoolName = schoolName;
      if (grade) profileData.grade = grade;

      const profile = await this.participantProfileRepo.save(
        this.participantProfileRepo.create(profileData),
      );
      user.participantProfile = profile;
    } else {
      const existingProfile = user.participantProfile;
      let profileUpdated = false;

      if (dateOfBirth) {
        existingProfile.dateOfBirth = new Date(dateOfBirth);
        profileUpdated = true;
      }
      if (country) {
        existingProfile.country = country;
        profileUpdated = true;
      }
      if (schoolName) {
        existingProfile.schoolName = schoolName;
        profileUpdated = true;
      }
      if (grade) {
        existingProfile.grade = grade;
        profileUpdated = true;
      }

      if (profileUpdated) {
        await this.participantProfileRepo.save(existingProfile);
      }
    }

    const existingParticipant = await this.repo.findOne({
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

    try {

      return await this.repo.save(
        this.repo.create({
          contest_id,
          submission_id: savedSubmission.id,
          user_id: user.id,
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