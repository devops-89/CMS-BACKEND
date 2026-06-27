import { UserRole, Entry } from "@libs/entities";
import { ParticipantProfileRepository, ParticipantRepository, UserRepository, EntryRepository } from "@libs/repositories";
import { FormSubmissionRepository } from "@libs/repositories";
import { FormTemplateRepository } from "@libs/repositories";

import { ContestRepository } from "@libs/repositories";
import { NotFoundError, InternalServerError, BadRequestError } from "@libs/utils/errors.util";
import * as bcrypt from "bcrypt";
import * as crypto from "crypto";
import { S3Service } from "@libs/s3";
import { NotificationService } from "@libs/notifications/notification.service";

export class ParticipantService {
  private repo = new ParticipantRepository();
  private submissionRepo = new FormSubmissionRepository();
  private templateRepo = new FormTemplateRepository();
  private contestRepo = new ContestRepository();
  private userRepo = new UserRepository();
  private participantProfileRepo = new ParticipantProfileRepository();
  private notificationService = new NotificationService();
  private entryRepo = new EntryRepository();



  async getAllParticipants(contest_id: string) {
    const contest = await this.contestRepo.findById(contest_id);
    const template = contest?.user_level_template_id 
      ? await this.templateRepo.findById(contest.user_level_template_id)
      : null;
    const entryTemplate = contest?.entry_level_template_id
      ? await this.templateRepo.findById(contest.entry_level_template_id)
      : null;

    const participants = await this.repo.findByContest(contest_id);
    const [allEntries] = await this.entryRepo.findByContest(contest_id);

    if (entryTemplate && allEntries.length > 0) {
      await Promise.all(
        allEntries.map(async (entry) => {
          if (entry.submission) {
            entry.submission = await this.appendDownloadUrlsToSubmission(entry.submission, entryTemplate);
          }
        })
      );
    }

    const entriesByParticipant: Record<string, Entry[]> = {};
    for (const entry of allEntries) {
      if (!entriesByParticipant[entry.participant_id]) {
        entriesByParticipant[entry.participant_id] = [];
      }
      entriesByParticipant[entry.participant_id].push(entry);
    }

    return Promise.all(
      participants.map(async (p) => {
        if (p.submission?.data) {
          delete p.submission.data.password;
          delete p.submission.data.confirm_password;

          if (template) {
            p.submission = await this.appendDownloadUrlsToSubmission(p.submission, template);
          }
        }
        p.entries = entriesByParticipant[p.id] || [];
        return p;
      })
    );
  }


 async addParticipantByAdminService(
  contest_id: string,
  formData: Record<string, any>,
  files: any[] = []
) {
  const contest = await this.getContest(contest_id);

  const now = new Date();
  if (now < contest.start_date) {
    throw new BadRequestError("Contest registration has not started yet");
  }
  if (now > contest.end_date) {
    throw new BadRequestError("Contest registration has ended");
  }

  const template = await this.getTemplate(contest.user_level_template_id!);

  // Extract the actual field answers. If nested under a 'data' key, use it.
  let answers = formData.data && typeof formData.data === "object" && !Array.isArray(formData.data)
    ? formData.data
    : formData;

  if (typeof formData.data === "string") {
    try {
      answers = JSON.parse(formData.data);
    } catch {
      answers = { ...formData };
    }
  } else if (!formData.data) {
    answers = { ...formData };
  }

  const fields = this.flattenFields(template.schema?.fields || []);
  const participant = this.extractParticipantData(fields, answers);

  if (participant.email) {
    const existingUser = await this.userRepo.findByEmail(participant.email);
    if (existingUser) {
      if (existingUser.role !== UserRole.PARTICIPANT) {
        throw new BadRequestError("User already exists with a different role!");
      }
      const existingParticipant = await this.repo.findOne({
        where: {
          contest_id: contest_id,
          user_id: existingUser.id,
        },
      });
      if (existingParticipant) {
        throw new BadRequestError("Participant already joined this contest");
      }
    }
  }

  // Process and upload files if any file_upload fields exist
  answers = await this.processFileUploads(contest_id, template, answers, files);

  const submission = await this.submissionRepo.save(
    this.submissionRepo.create(template, answers),
  );

  const user = await this.createOrUpdateParticipantUser(
    participant,
    answers,
    template.id,
  );

  await this.createOrUpdateParticipantProfile(
    user,
    submission.id,
    participant,
  );

  const savedParticipant = await this.repo.save(
    this.repo.create({
      contest_id,
      submission_id: submission.id,
      user_id: user.id,
      status: "approved",
    }),
  );

  // Send registration_successful email notification
  const participantName = participant.fullName
    || `${participant.firstName || ""} ${participant.lastName || ""}`.trim()
    || "Participant";
  const participantEmail = participant.email || user.email;

  if (participantEmail) {
    await this.notificationService.sendTemplateNotification(
      participantEmail,
      contest_id,
      "participant" as any,
      "registration_successful" as any,
      {
        participant_name: participantName,
        contest_name: contest.name || "",
        end_date: contest.end_date
          ? new Date(contest.end_date).toLocaleDateString()
          : "",
      }
    );
  }

  return savedParticipant;
}

  async getParticipantById(id: string, contest_id: string) {
    const participant = await this.repo.findById(id, contest_id);
    if (!participant) throw new NotFoundError("Participant not found");

    const contest = await this.contestRepo.findById(contest_id);
    const template = contest?.user_level_template_id 
      ? await this.templateRepo.findById(contest.user_level_template_id)
      : null;

    if (participant.submission && template) {
      participant.submission = await this.appendDownloadUrlsToSubmission(participant.submission, template);
    }

    return participant;
  }

  async updateStatus(id: string, contest_id: string, status: "pending" | "approved" | "rejected") {
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Participant not found");
    await this.repo.updateStatus(id, status);
    return await this.repo.findById(id, contest_id);
  }

  async updateParticipant(
    id: string,
    contest_id: string,
    formData: Record<string, any>,
    files: any[] = []
  ) {

    console.log("id", id);
    console.log("contest_id", contest_id);
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Participant not found");

    if (!existing.submission_id) {
      throw new NotFoundError("Submission not found");
    }

    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    const now = new Date();
    if (now < contest.start_date) {
      throw new BadRequestError("Contest registration has not started yet");
    }
    if (now > contest.end_date) {
      throw new BadRequestError("Contest registration has ended");
    }

    const template = await this.getTemplate(contest.user_level_template_id!);

    // Extract the actual field answers. If nested under a 'data' key, use it.
    let answers = formData.data && typeof formData.data === "object" && !Array.isArray(formData.data)
      ? formData.data
      : formData;

    if (typeof formData.data === "string") {
      try {
        answers = JSON.parse(formData.data);
      } catch {
        answers = { ...formData };
      }
    } else if (!formData.data) {
      answers = { ...formData };
    }

    const fields = this.flattenFields(template.schema?.fields || []);
    const participant = this.extractParticipantData(fields, answers);

    // Process and upload files if any file_upload fields exist
    answers = await this.processFileUploads(contest_id, template, answers, files);

    // Update the submission
    await this.submissionRepo.update(existing.submission_id, answers);

    // Update associated user and participant profile
    let user: any = null;
    if (existing.user_id) {
      user = await this.userRepo.getUserById(existing.user_id);
    }

    if (user) {
      user.participant_profile_data = {
        ...(user.participant_profile_data || {}),
        ...answers,
      };
      if (participant.firstName) {
        user.firstName = participant.firstName;
      }
      if (participant.lastName) {
        user.lastName = participant.lastName;
      }
      if (participant.phone) {
        user.phone = participant.phone;
      }
      if (participant.fullName) {
        user.fullName = participant.fullName;
      } else if (participant.firstName || participant.lastName) {
        user.fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim();
      }
      if (participant.avatarUrl) {
        user.avatarUrl = participant.avatarUrl;
      }

      if (participant.email && participant.email !== user.email) {
        const emailUser = await this.userRepo.findByEmail(participant.email);
        if (emailUser && emailUser.id !== user.id) {
          throw new BadRequestError("Email is already in use by another user!");
        }
        user.email = participant.email;
      }

      user.form_template_id = template.id;
      await this.userRepo.save(user);

      await this.createOrUpdateParticipantProfile(
        user,
        existing.submission_id,
        participant,
      );
    } else {
      const newUser = await this.createOrUpdateParticipantUser(
        participant,
        answers,
        template.id,
      );

      await this.createOrUpdateParticipantProfile(
        newUser,
        existing.submission_id,
        participant,
      );

      existing.user_id = newUser.id;
      await this.repo.save(existing);
    }

    return await this.repo.findById(id, contest_id);
  }

  async removeParticipant(id: string, contest_id: string) {
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Participant not found");

    const userId = existing.user_id;
    let shouldDeleteUser = false;

    if (userId) {
      const activeCount = await this.repo.countByUser(userId);
      if (activeCount <= 1) {
        shouldDeleteUser = true;
      }
    }

    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new InternalServerError("Delete failed");

    if (shouldDeleteUser && userId) {
      await this.userRepo.softDeleteUser(userId);
    }

    return { message: "Participant removed successfully" };
  }

  private flattenFields(fields: any[]): any[] {
  return fields.flatMap((field) => [
    field,
    ...(field.config?.children
      ? this.flattenFields(field.config.children)
      : []),
  ]);
}

private getFieldValue(
  fields: any[],
  formData: any,
  labels: string[],
) {
  const field = fields.find((f) =>
    labels.some((label) =>
      f.label?.toLowerCase().trim().includes(label.toLowerCase()),
    ),
  );

  return field ? formData[field.id] : undefined;
}
private extractParticipantData(
  fields: any[],
  formData: any,
) {
  let firstName = this.getFieldValue(fields, formData, [
    "first name",
    "firstname",
    "first_name",
    "Firstname"
  ]) || "";

  let lastName = this.getFieldValue(fields, formData, [
    "last name",
    "lastname",
    "last_name",
    "Lastname"
  ]) || "";

  let fullName = this.getFieldValue(fields, formData, [
    "full name",
    "fullname",
    "full_name",
    "Name"
  ]) || "";

  let email = this.getFieldValue(fields, formData, [
    "email",
    "email address",
    "Email"
  ]) || "";

  let phone = this.getFieldValue(fields, formData, [
    "phone",
    "phone number",
    "mobile",
    "mobile number",
    "contact number",
    "Mobile Number",
  ]) || "";

  // Split full name if first/last name not provided
  if (fullName && (!firstName || !lastName)) {
    const parts = fullName.trim().split(/\s+/);

    if (!firstName) {
      firstName = parts.shift() || "";
    }

    if (!lastName) {
      lastName = parts.join(" ");
    }
  }

  firstName = firstName.trim();
  lastName = lastName.trim();
  fullName = fullName || `${firstName} ${lastName}`.trim();
  phone = phone.trim();

  return {
    firstName,
    lastName,
    fullName,
    email,
    phone,
    password: this.getFieldValue(fields, formData, [
      "password",
      "Password"
    ]),

    dateOfBirth: this.getFieldValue(fields, formData, [
      "dob",
      "date of birth",
      "birth date",
      "birthday",
    ]),

    avatarUrl: this.getFieldValue(fields, formData, [
      "avatar",
      "Avatar",
    ]),

    schoolName: this.getFieldValue(fields, formData, [
      "school",
      "school name",
      "School"
    ]),

    grade: this.getFieldValue(fields, formData, [
      "grade",
      "class",
      "year",
      "standard",
    ]),

    country: this.getFieldValue(fields, formData, [
      "country",
      "country of residence",
    ]),

    fatherName: this.getFieldValue(fields, formData, [
      "father",
      "father's name",
      "father name",
    ]),

    innovationTitle: this.getFieldValue(fields, formData, [
      "innovation title",
      "title",
    ]),

    innovationDocument: this.getFieldValue(fields, formData, [
      "innovation document",
      "document",
      "file",
    ]),
  };
}
private async getContest(id: string) {
  const contest = await this.contestRepo.findById(id);

  if (!contest) {
    throw new NotFoundError("Contest not found");
  }

  if (!contest.user_level_template_id) {
    throw new NotFoundError(
      "User level template ID missing",
    );
  }

  return contest;
}

private async getTemplate(id: string) {
  const template = await this.templateRepo.findById(id);

  if (!template) {
    throw new NotFoundError(
      "Form template not found",
    );
  }

  return template;
}

private async createOrUpdateParticipantUser(
  participant: any,
  answers: Record<string, any>,
  templateId: string,
) {
  let resolvedEmail = participant.email;
  if (!resolvedEmail) {
    resolvedEmail = `participant_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 6)}@launchpad-temp.com`;
  }

  let user = await this.userRepo.findByEmailWithParticipantProfile(resolvedEmail);

  const fullName = participant.fullName || `${participant.firstName || ""} ${participant.lastName || ""}`.trim();

  if (!user) {
    const rawPassword = participant.password || crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    user = await this.userRepo.save(
      this.userRepo.create({
        firstName: participant.firstName || "",
        lastName: participant.lastName || "",
        fullName: fullName,
        email: resolvedEmail,
        phone: participant.phone || "",
        password: hashedPassword || "",
        role: UserRole.PARTICIPANT,
        form_template_id: templateId,
        participant_profile_data: answers,
        avatarUrl: participant.avatarUrl || undefined,
      }),
    );
  } else {
    user.participant_profile_data = {
      ...(user.participant_profile_data || {}),
      ...answers,
    };
    if (participant.firstName) {
      user.firstName = participant.firstName;
    }
    if (participant.lastName) {
      user.lastName = participant.lastName;
    }
    if (participant.phone) {
      user.phone = participant.phone;
    }
    if(participant.fullName){
      user.fullName = participant.fullName;
    }
    if (participant.avatarUrl) {
      user.avatarUrl = participant.avatarUrl;
    }

    user.form_template_id = templateId;

    await this.userRepo.save(user);
  }

  return user;
}

private async createOrUpdateParticipantProfile(
  user: any,
  submissionId: string,
  participant: any,
) {
  if (!user.participantProfile) {
    const profileData: any = {
      user,
      submission_id: submissionId,
      schoolName: participant.schoolName,
      country: participant.country,
      grade: participant.grade,
    };

    if (participant.dateOfBirth) {
      profileData.dateOfBirth = new Date(participant.dateOfBirth);
    }

    const profile = await this.participantProfileRepo.save(
      this.participantProfileRepo.create(profileData),
    );

    user.participantProfile = profile;
  } else {
    const existingProfile = user.participantProfile;
    let profileUpdated = false;

    if (participant.dateOfBirth) {
      existingProfile.dateOfBirth = new Date(participant.dateOfBirth);
      profileUpdated = true;
    }
    if (participant.country) {
      existingProfile.country = participant.country;
      profileUpdated = true;
    }
    if (participant.schoolName) {
      existingProfile.schoolName = participant.schoolName;
      profileUpdated = true;
    }
    if (participant.grade) {
      existingProfile.grade = participant.grade;
      profileUpdated = true;
    }

    if (profileUpdated) {
      await this.participantProfileRepo.save(existingProfile);
    }
  }
}

private async ensureParticipantNotExists(contestId: string, userId: string) {
  const existingParticipant = await this.repo.findOne({
    where: {
      contest_id: contestId,
      user_id: userId,
    },
  });

  if (existingParticipant) {
    throw new BadRequestError("Participant already joined this contest");
  }
}

  private async processFileUploads(
    contest_id: string,
    template: any,
    formData: Record<string, any>,
    files: any[] = []
  ): Promise<Record<string, any>> {
    const fields = template.schema?.fields || [];
    const data = { ...formData };

    for (const field of fields) {
      if (field.type === "file_upload") {
        // Check if there is an uploaded file in multipart form-data
        const uploadedFile = files && files.find((f) => f.fieldname === `formData[${field.id}]` || f.fieldname === field.id);
        
        let buffer: Buffer;
        let filename: string;
        let mimeType: string;

        if (uploadedFile) {
          buffer = uploadedFile.buffer;
          filename = uploadedFile.originalname;
          mimeType = uploadedFile.mimetype;
        } else {
          // If no uploaded file in multipart, check if a base64 string or S3 URL was passed in body data
          const val = data[field.id];
          if (!val) {
            continue;
          }

          // If it's already an S3 URL, keep it
          if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) {
            continue;
          }

          if (typeof val === "string") {
            if (val.startsWith("data:")) {
              const matches = val.match(/^data:([^;]+);base64,(.+)$/);
              if (!matches || matches.length !== 3) {
                throw new Error(`Invalid file format for field: ${field.label || field.id}`);
              }
              mimeType = matches[1];
              buffer = Buffer.from(matches[2], "base64");
              const ext = mimeType.split("/")[1] || "bin";
              filename = `upload-${Date.now()}.${ext}`;
            } else {
              buffer = Buffer.from(val, "base64");
              filename = `upload-${Date.now()}`;
              mimeType = "application/octet-stream";
            }
          } else if (typeof val === "object" && val !== null) {
            const base64Data = val.base64 || val.data;
            if (!base64Data) {
              continue;
            }
            buffer = Buffer.from(base64Data, "base64");
            filename = val.filename || val.name || `upload-${Date.now()}`;
            mimeType = val.mimetype || val.type || "application/octet-stream";
          } else {
            continue;
          }
        }

        // Validate file size (maxSize in MB)
        const sizeInMb = buffer.length / (1024 * 1024);
        const maxSize = parseFloat(field.config?.maxSize);
        if (!isNaN(maxSize) && sizeInMb > maxSize) {
          throw new Error(`File "${filename}" size (${sizeInMb.toFixed(2)} MB) exceeds the maximum allowed size of ${maxSize} MB.`);
        }

        // Validate file extension
        const allowedExtensionsStr = field.config?.allowedExtensions;
        if (allowedExtensionsStr) {
          const allowedExtensions = allowedExtensionsStr
            .split(",")
            .map((ext: string) => ext.trim().toLowerCase());

          let fileExt = "";
          const dotIdx = filename.lastIndexOf(".");
          if (dotIdx !== -1) {
            fileExt = filename.slice(dotIdx).toLowerCase();
          }

          const isAllowed = allowedExtensions.includes(fileExt);
          if (!isAllowed) {
            throw new Error(`File type "${fileExt}" is not allowed. Allowed types: ${allowedExtensionsStr}`);
          }
        }

        // Upload to S3
        const s3Service = new S3Service();
        const key = `users/contest-${contest_id}/${field.id}-${Date.now()}-${filename}`;
        const url = await s3Service.uploadFile(key, buffer, mimeType);
        
        data[field.id] = url;
      }
    }

    return data;
  }

  private async appendDownloadUrlsToSubmission(
    submission: any,
    template: any
  ): Promise<any> {
    if (!submission || !submission.data || !template) {
      return submission;
    }

    const fields = this.flattenFields(template.schema?.fields || []);
    const s3Service = new S3Service();
    const submissionData = { ...submission.data };

    for (const field of fields) {
      if (field.type === "file_upload") {
        const val = submissionData[field.id];
        if (typeof val === "string" && (val.startsWith("http://") || val.startsWith("https://"))) {
          try {
            const downloadUrl = await s3Service.getDownloadUrl(val);
            submissionData[`${field.id}_downloadUrl`] = downloadUrl;
          } catch (error) {
            console.error(`Failed to generate download URL for field ${field.id}:`, error);
          }
        }
      }
    }

    submission.data = submissionData;
    return submission;
  }
}