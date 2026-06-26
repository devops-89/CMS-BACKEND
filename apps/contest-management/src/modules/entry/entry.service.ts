import {
  EntryRepository,
  ContestRepository,
  FormSubmissionRepository,
  VotingPeriodRepository,
  ParticipantRepository,
} from "@libs/repositories";

import { NotFoundError, InternalServerError, BadRequestError, ForbiddenError, ConflictError } from "@libs/utils/errors.util";
import { S3Service } from "@libs/s3";
import { UserRole } from "@libs/entities";
import { NotificationService } from "@libs/notifications/notification.service";

export class EntryService {
  private repo = new EntryRepository();
  private contestRepo = new ContestRepository();
  private submissionRepo = new FormSubmissionRepository();
  private votingPeriodRepo = new VotingPeriodRepository();
  private participantRepo = new ParticipantRepository();
  private notificationService = new NotificationService();

  private async processFileUploads(
    contest_id: string,
    template: any,
    body: Record<string, any>,
    files: any[] = []
  ): Promise<Record<string, any>> {
    const fields = template.schema?.fields || [];
    
    // First, reconstruct the form data.
    // If body has a "data" object (JSON payload), use it.
    // If "data" is a string (form-data serialized JSON), parse it.
    // Otherwise, assume body is a flat object (form-data payload).
    let data: Record<string, any> = {};
    if (body.data) {
      if (typeof body.data === "object") {
        data = { ...body.data };
      } else if (typeof body.data === "string") {
        try {
          data = JSON.parse(body.data);
        } catch {
          data = { ...body };
          delete data.participant_id;
        }
      }
    } else {
      data = { ...body };
      // Remove metadata keys from form data if flat
      delete data.participant_id;
    }

    for (const field of fields) {
      if (field.type === "file_upload") {
        // Check if there is an uploaded file in multipart form-data
        const uploadedFile = files && files.find((f) => f.fieldname === field.id);
        
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
        const key = `entries/contest-${contest_id}/${field.id}-${Date.now()}-${filename}`;
        const url = await s3Service.uploadFile(key, buffer, mimeType);
        
        data[field.id] = url;
      }
    }

    return data;
  }

  async createEntry(
    contest_id: string,
    body: any,
    files: any[] = [],
    userId?: string,
    userRole?: string
  ) {
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    if (!contest.entryLevelTemplate) {
      throw new NotFoundError("Entry level template not configured");
    }

    // Process and validate file uploads
    const processedData = await this.processFileUploads(contest_id, contest.entryLevelTemplate, body, files);

    // Resolve participant_id
    let participant_id = body.participant_id;

    if (userRole === UserRole.PARTICIPANT) {
      if (!userId) {
        throw new ForbiddenError("User ID not found in token");
      }
      const participant = await this.participantRepo.findOne({
        where: { user_id: userId, contest_id },
      });
      if (!participant) {
        throw new NotFoundError("Participant profile not found for this user in this contest");
      }
      participant_id = participant.id;
    } else {
      if (!participant_id) {
        if (userId) {
          const participant = await this.participantRepo.findOne({
            where: { user_id: userId, contest_id },
          });
          if (!participant) {
            throw new NotFoundError("Participant profile not found for this user in this contest");
          }
          participant_id = participant.id;
        } else {
          throw new BadRequestError("participant_id is required");
        }
      }
    }

    // Check if participant already has an entry in this contest
    const existingEntry = await this.repo.findOneByParticipant(participant_id);
    if (existingEntry) {
      throw new ConflictError("You already have an entry in this contest");
    }

    //  Step 1: create submission
    const submission = this.submissionRepo.create(
      contest.entryLevelTemplate,
      processedData
    );

    const savedSubmission = await this.submissionRepo.save(submission);

    const isDraft = body.isDraft === true || body.isDraft === "true";

    //  Step 2: create entry
    const entry = this.repo.create({
      contest_id,
      participant_id,
      submission_id: savedSubmission.id,
      isDraft,
      status: isDraft ? "draft" : "pending",
      draftedAt: isDraft ? new Date() : null,
    });

    try {
      const savedEntry = await this.repo.save(entry);

      if (!isDraft) {
        this.sendEntrySubmittedNotification(
          participant_id,
          contest_id,
          contest.name,
          savedEntry.id,
          processedData
        ).catch((err) => {
          console.error("Failed to send entry_submitted notification:", err);
        });
      }

      return savedEntry;
    } catch {
      throw new InternalServerError("Failed to create entry");
    }
  }

  private async appendDownloadUrlsToEntry(
    entry: any,
    template: any
  ): Promise<any> {
    if (!entry || !entry.submission || !entry.submission.data || !template) {
      return entry;
    }

    const fields = template.schema?.fields || [];
    const s3Service = new S3Service();
    const submissionData = { ...entry.submission.data };

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

    entry.submission.data = submissionData;
    return entry;
  }

  async getEntries(
    contest_id: string,
    userId?: string,
    userRole?: string,
    status?: string,
    page: number = 1,
    limit: number = 10
  ) {
    const contest = await this.contestRepo.findById(contest_id);
    if (!contest) throw new NotFoundError("Contest not found");

    let entries: any[] = [];
    let totalDocs = 0;

    if (userRole === UserRole.PARTICIPANT) {
      if (!userId) {
        throw new ForbiddenError("User ID not found in token");
      }
      const participant = await this.participantRepo.findOne({
        where: { user_id: userId, contest_id },
      });
      if (!participant) {
        return {
          docs: [],
          totalDocs: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        };
      }
      const [resEntries, count] = await this.repo.findByParticipant(contest_id, participant.id, status, page, limit);
      entries = resEntries;
      totalDocs = count;
    } else {
      const relations = ["participant", "submission"];
      if (userRole === UserRole.JUDGE) {
        relations.push("entryAssignments");
      }
      const [resEntries, count] = await this.repo.findByContest(contest_id, status, page, limit, relations);
      entries = resEntries;
      totalDocs = count;
    }

    const processedEntries = [];
    if (contest.entryLevelTemplate) {
      for (const entry of entries) {
        const processed = await this.appendDownloadUrlsToEntry(entry, contest.entryLevelTemplate);
        processedEntries.push(processed);
      }
    } else {
      processedEntries.push(...entries);
    }

    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      docs: processedEntries,
      totalDocs,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }

  async getEntryById(id: string, contest_id: string, userId?: string, userRole?: string) {
    const entry = await this.repo.findById(id, contest_id);
    if (!entry) throw new NotFoundError("Entry not found");

    if (userRole === UserRole.PARTICIPANT) {
      if (!userId) {
        throw new ForbiddenError("User ID not found in token");
      }
      const participant = await this.participantRepo.findOne({
        where: { user_id: userId, contest_id },
      });
      if (!participant || entry.participant_id !== participant.id) {
        throw new ForbiddenError("You are not authorized to view this entry");
      }
    }
    
    const template = entry.contest?.entryLevelTemplate;
    const processedEntry = await this.appendDownloadUrlsToEntry(entry, template);
    
    const votingPeriods = await this.votingPeriodRepo.findByContestId(contest_id);
    return {
      ...processedEntry,
      votingPeriods,
    };
  }

  async updateStatus(
    id: string,
    contest_id: string,
    status: "pending" | "approved" | "rejected" | "draft" | "evaluated" | "semifinal" | "final" | "winner"
  ) {
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Entry not found");

    const wasDraft = existing.isDraft;

    await this.repo.updateStatus(id, status);

    if (wasDraft && status === "pending") {
      this.sendEntrySubmittedNotification(
        existing.participant_id,
        contest_id,
        existing.contest?.name,
        existing.id,
        existing.submission?.data
      ).catch((err) => {
        console.error("Failed to send entry_submitted notification:", err);
      });
    }

    return await this.repo.findById(id, contest_id);
  }

  async updateEntry(
    id: string,
    contest_id: string,
    body: any,
    files: any[] = [],
    userId?: string,
    userRole?: string
  ) {
    //  check entry exists
    const existing = await this.repo.findById(id, contest_id);
    if (!existing) throw new NotFoundError("Entry not found");

    //  ensure submission exists
    if (!existing.submission_id) {
      throw new NotFoundError("Submission not found");
    }

    // Authorization & participant verification
    if (userRole === UserRole.PARTICIPANT) {
      if (!userId) {
        throw new ForbiddenError("User ID not found in token");
      }
      const participant = await this.participantRepo.findOne({
        where: { user_id: userId, contest_id },
      });
      if (!participant) {
        throw new NotFoundError("Participant profile not found for this user in this contest");
      }
      if (existing.participant_id !== participant.id) {
        throw new ForbiddenError("You are not authorized to update this entry");
      }
    }

    const template = existing.contest?.entryLevelTemplate;
    if (!template) {
      throw new NotFoundError("Entry level template not configured");
    }

    // Process and validate file uploads
    const processedData = await this.processFileUploads(contest_id, template, body, files);

    //  update submission data
    await this.submissionRepo.update(existing.submission_id, processedData);

    // If participant_id is provided in the body (and user is admin), we can update it
    if (body.participant_id && userRole !== UserRole.PARTICIPANT) {
      existing.participant_id = body.participant_id;
    }

    const wasDraft = existing.isDraft;

    if (body.status) {
      existing.status = body.status;
      if (body.status === "pending") {
        existing.isDraft = false;
      } else if (body.status === "draft") {
        existing.isDraft = true;
        if (!existing.draftedAt) {
          existing.draftedAt = new Date();
        }
      }
    }

    await this.repo.save(existing);

    if (wasDraft && !existing.isDraft) {
      this.sendEntrySubmittedNotification(
        existing.participant_id,
        contest_id,
        existing.contest?.name,
        existing.id,
        processedData || existing.submission?.data
      ).catch((err) => {
        console.error("Failed to send entry_submitted notification:", err);
      });
    }

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

  private async sendEntrySubmittedNotification(
    participant_id: string,
    contest_id: string,
    contestName: string,
    entryId: string,
    submissionData?: any
  ) {
    try {
      const participant = await this.participantRepo.findOne({
        where: { id: participant_id },
        relations: ["user"],
      });

      const userObj = participant?.user;
      if (userObj && userObj.email) {
        const participantName = userObj.fullName || userObj.firstName || "Participant";

        const entryTitle = 
          submissionData?.entry_title || 
          submissionData?.entryTitle || 
          submissionData?.title || 
          submissionData?.name || 
          "My Entry";

        await this.notificationService.sendTemplateNotification(
          userObj.email,
          contest_id,
          "participant" as any,
          "entry_submitted" as any,
          {
            participant_name: participantName,
            contest_name: contestName || "",
            entry_title: entryTitle,
            entry_id: entryId,
          }
        );
      }
    } catch (error) {
      console.error("Error sending entry_submitted notification:", error);
    }
  }
}