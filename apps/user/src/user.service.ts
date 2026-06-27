import bcrypt from "bcrypt";
import {
  ParticipantProfileRepository,
  UserRepository,
  OtpsRepository,
  FormTemplateRepository,
  CountryRepository,
  ContestRepository,
  FormSubmissionRepository,
  ParticipantRepository,
} from "@libs/repositories";
import { UserRole, UserStatus, Entry } from "@libs/entities";
import { AppDataSource } from "@libs/database/data-source";
import { NotificationService } from "@libs/notifications/notification.service";
import { ConflictError, BadRequestError, NotFoundError } from "@libs/utils/errors.util";
import { createParticipantDto, verifyParticipantDto, createPublicUserDto, verifyPublicUserDto } from "@libs/dto/user.dto";
import { RefreshTokenRepository } from "@libs/repositories/refresh-token.repository";
import { generateAccessToken, generateRefreshToken } from "@libs/utils/jwt.util";
import { S3Service } from "@libs/s3";

export class UserService {
  private userRepo = new UserRepository();
  private participantRepo = new ParticipantProfileRepository();
  private otpRepo = new OtpsRepository();
  private formTemplateRepo = new FormTemplateRepository();
  private countryRepo = new CountryRepository();
  private contestRepo = new ContestRepository();
  private notificationService = new NotificationService();
  private submissionRepo = new FormSubmissionRepository();
  private participantEntityRepo = new ParticipantRepository();
  private refreshTokenRepo = new RefreshTokenRepository();


async createParticipantService(payload: createParticipantDto, files: any[] = []) {
  const { contestId, countryId, formData } = payload;

  // =====================================================
  // Validate Country
  // =====================================================

  const country = await this.countryRepo.findById(countryId);

  if (!country) {
    throw new BadRequestError("Invalid country ID");
  }

  // =====================================================
  // Fetch Contest
  // =====================================================

  const contest = await this.contestRepo.findById(contestId);

  if (!contest) {
    throw new NotFoundError("Contest not found");
  }

  const now = new Date();
  if (now < contest.start_date) {
    throw new BadRequestError("Contest registration has not started yet");
  }
  if (now > contest.end_date) {
    throw new BadRequestError("Contest registration has ended");
  }

  // =====================================================
  // Fetch User Level Template
  // =====================================================

  const template = contest.userLevelTemplate;

  if (!template) {
    throw new NotFoundError(
      "User registration form template not configured for this contest",
    );
  }

  // Process and upload files if any file_upload fields exist
  const processedFormData = await this.processFileUploads(contestId, template, formData, files);

  // =====================================================
  // Extract Dynamic Fields
  // =====================================================

 // =====================================================
// Extract Dynamic Fields
// =====================================================

let firstName = "";
let lastName = "";
let fullName = "";
let email = "";
let password = "";
let phone = "";
let dateOfBirthStr = "";
let avatarUrl = "";
let grade = "";
let schoolName = "";

for (const field of template.schema.fields) {
  const value = processedFormData[field.id];

  if (value === undefined || value === null || value === "") {
    continue;
  }

  const normalizedLabel = field.label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");

  switch (normalizedLabel) {
    case "firstname":
      firstName = String(value).trim();
      break;

    case "lastname":
      lastName = String(value).trim();
      break;

    case "fullname":
    case "name":
      fullName = String(value).trim();
      break;

    case "email":
    case "mail":
      email = String(value).trim().toLowerCase();
      break;

    case "password":
      password = String(value);
      break;

    case "phone":
    case "phonenumber":
    case "mobile":
    case "mobilenumber":
      phone = String(value).trim();
      break;

    case "dateofbirth":
    case "dob":
    case "birthdate":
      dateOfBirthStr = String(value);
      break;

    case "avatar":
    case "profilephoto":
    case "profileimage":
      avatarUrl = String(value);
      break;

    case "grade":
    case "class":
      grade = String(value).trim();
      break;

    case "schoolname":
    case "school":
    case "organization":
    case "institution":
      schoolName = String(value).trim();
      break;
  }
}

// Split full name if first/last name not provided
if (fullName && (!firstName || !lastName)) {
  const parts = fullName.split(/\s+/);

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

  // =====================================================
  // Validate Required Fields
  // =====================================================

  if (!email) {
    throw new BadRequestError("Mail/Email field is required");
  }

  if (!password) {
    throw new BadRequestError("Password field is required");
  }

  // =====================================================
  // Check Existing User
  // =====================================================

  const existingUser = await this.userRepo.findByEmail(email);

  let user;
  if (existingUser) {
    if (existingUser.role !== UserRole.PARTICIPANT) {
      throw new ConflictError("User already exists with this emailId!");
    }

    const existingParticipant = await this.participantEntityRepo.findOne({
      where: {
        contest_id: contest.id,
        user_id: existingUser.id,
      },
    });
    if (existingParticipant) {
      throw new ConflictError("You are already registered for this contest");
    }

    user = existingUser;
    user.firstName = firstName || user.firstName;
    user.lastName = lastName || user.lastName;
    user.fullName = fullName || user.fullName;
    user.phone = phone || user.phone;
    if (avatarUrl) {
      user.avatarUrl = avatarUrl;
    }
    user.countryId = countryId || user.countryId;
    user.form_template_id = template.id;
    await this.userRepo.save(user);
  } else {
    // =====================================================
    // Hash Password
    // =====================================================
    const hashedPassword = await bcrypt.hash(password, 12);
    fullName = fullName || `${firstName} ${lastName}`.trim();

    // =====================================================
    // Create User
    // =====================================================
    user = await this.userRepo.createUser({
      email,
      password: hashedPassword,
      role: UserRole.PARTICIPANT,
      status: UserStatus.PENDING,
      form_template_id: template.id,
      isSelfRegistered: true,
      firstName,
      lastName,
      fullName,
      phone,
      countryId,
      avatarUrl: avatarUrl || undefined,
    });

  }
  const formDataWithUrls = await this.convertKeysToUrls(processedFormData);

  // =====================================================
  // Create Form Submission
  // =====================================================

  const submission =
    await this.submissionRepo.save(
      this.submissionRepo.create(
        template,
        formDataWithUrls,
      ),
    );

  // =====================================================
  // Create / Update Participant Profile
  // =====================================================
  const dob = dateOfBirthStr ? new Date(dateOfBirthStr) : null;
  const existingProfile = await this.participantRepo.findByUserId(user.id);
  if (!existingProfile) {
    await this.participantRepo.createProfile({
      user,
      dateOfBirth: dob as Date,
      grade: grade || undefined,
      schoolName: schoolName || undefined,
      submission_id: submission.id,
    });
  } else {
    existingProfile.dateOfBirth = dob || existingProfile.dateOfBirth;
    existingProfile.grade = grade || existingProfile.grade;
    existingProfile.schoolName = schoolName || existingProfile.schoolName;
    existingProfile.submission_id = submission.id;
    await this.participantRepo.save(existingProfile);
  }

  // =====================================================
  // Create Participant Record
  // =====================================================

  await this.participantEntityRepo.save(
    this.participantEntityRepo.create({
      contest_id: contest.id,
      submission_id: submission.id,
      user_id: user.id,
     status:"approved"
    }),
  );

  // =====================================================
  // Generate OTP
  // =====================================================

  const otp = Math.floor(
    100000 + Math.random() * 900000,
  ).toString();

  const hashedOtp = await bcrypt.hash(
    otp,
    10,
  );

  const expires = new Date();

  expires.setMinutes(
    expires.getMinutes() + 5,
  );

  await this.otpRepo.createOtp(
    user.id,
    hashedOtp,
    expires,
  );

  // =====================================================
  // Send OTP
  // =====================================================

  await this.notificationService.sendOtp(
    email,
    otp,
    firstName || "Participant",
  );

  return user;
}



  async verifyParticipantService(payload: verifyParticipantDto) {
    const { email, otp } = payload;

    // 1. Fetch the user by email
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // 3. Fetch the latest OTP for this user
    const record = await this.otpRepo.findLatestOtp(user.id);
    if (!record) {
      throw new BadRequestError("OTP not found");
    }

    // 4. Expiry check
    if (record.expires_at < new Date()) {
      throw new BadRequestError("OTP expired");
    }

    // 5. Compare OTP
    const isValid = await bcrypt.compare(otp, record.otp);
    if (!isValid) {
      throw new BadRequestError("Invalid OTP");
    }

    // 6. Mark OTP as used
    await this.otpRepo.markUsed(record.id);

    // 7. Update user status to ACTIVE
    const updatedUser = await this.userRepo.updateUserStatus(user.id, UserStatus.ACTIVE);
    if (!updatedUser) {
      throw new NotFoundError("User not found after activation");
    }

    const accessToken = generateAccessToken({
      userId: updatedUser.id,
      role: updatedUser.role,
    });

    const refreshToken = generateRefreshToken({
      userId: updatedUser.id,
    });

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    await this.refreshTokenRepo.createToken(updatedUser.id, refreshToken, expires);

    let contestId: string | null = null;
    let contestCount = 0;
    let contests: any[] = [];

    if (updatedUser.participants) {
      contestCount = updatedUser.participants.length;
      contests = updatedUser.participants.map((p: any) => p.contest).filter(Boolean);
      if (updatedUser.participants.length > 0) {
        contestId = updatedUser.participants[0].contest_id;
      }
    } else if (updatedUser.role === "judge" && (updatedUser as any).judgeProfile?.contestAssignments) {
      const assignments = (updatedUser as any).judgeProfile.contestAssignments;
      contestCount = assignments.length;
      contests = assignments.map((a: any) => a.contest).filter(Boolean);
      if (assignments.length > 0) {
        contestId = assignments[0].contest_id;
      }
    }

    // Send registration_successful email notification
    if (contestId && updatedUser.email) {
      const contestName = contests[0]?.name || "";
      const participantName = updatedUser.fullName || updatedUser.firstName || "Participant";

      await this.notificationService.sendTemplateNotification(
        updatedUser.email,
        contestId,
        "participant" as any,
        "registration_successful" as any,
        {
          participant_name: participantName,
          contest_name: contestName,
          end_date: contests[0]?.end_date
            ? new Date(contests[0].end_date).toLocaleDateString()
            : "",
        }
      );
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        contestId,
        contestCount,
        contests,
      },
    };
  }

  private async convertKeysToUrls(formData: Record<string, any>): Promise<Record<string, any>> {
    const s3Service = new S3Service();
    const result = { ...formData };

    for (const key of Object.keys(result)) {
      const val = result[key];
      if (typeof val === "string") {
        if (val.startsWith("http://") || val.startsWith("https://") || val.includes("users/")) {
          try {
            const usersIdx = val.indexOf("users/");
            const s3Key = usersIdx !== -1 ? val.substring(usersIdx) : val;

            const downloadUrl = await s3Service.getDownloadUrl(s3Key);
            result[key] = s3Key;
            result[`${key}_downloadUrl`] = downloadUrl;
          } catch (error) {
            console.error(`Failed to generate download URL for key ${key}:`, error);
          }
        }
      }
    }

    return result;
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

  async createPublicUserService(payload: createPublicUserDto) {
    const { fullName, email, password } = payload;

    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("User already exists with this emailId!");
    }

    // Split fullName into firstName and lastName
    let firstName = "";
    let lastName = "";
    const name = fullName.trim();
    if (name) {
      const parts = name.split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "";
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with PUBLIC role and PENDING status
    const user = await this.userRepo.createUser({
      email,
      password: hashedPassword,
      role: UserRole.PUBLIC,
      status: UserStatus.PENDING,
      isSelfRegistered: true,
      firstName,
      lastName,
      fullName: name,
    });

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5);

    // Store OTP in database
    await this.otpRepo.createOtp(user.id, hashedOtp, expires);

    // Send OTP to email
    await this.notificationService.sendOtp(email, otp, firstName || "User");

    return user;
  }

  async verifyPublicUserService(payload: verifyPublicUserDto) {
    const { email, otp } = payload;

    // Find user by email
    const user = await this.userRepo.findByEmail(email);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Check if user is already active
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestError("User is already active");
    }

    // Fetch the latest OTP for this user
    const record = await this.otpRepo.findLatestOtp(user.id);
    if (!record) {
      throw new BadRequestError("OTP not found");
    }

    // Expiry check
    if (record.expires_at < new Date()) {
      throw new BadRequestError("OTP expired");
    }

    // Compare OTP
    const isValid = await bcrypt.compare(otp, record.otp);
    if (!isValid) {
      throw new BadRequestError("Invalid OTP");
    }

    // Mark OTP as used
    await this.otpRepo.markUsed(record.id);

    // Update user status to ACTIVE
    const updatedUser = await this.userRepo.updateUserStatus(user.id, UserStatus.ACTIVE);
    if (!updatedUser) {
      throw new NotFoundError("User not found after activation");
    }

    // Generate JWT access and refresh tokens
    const accessToken = generateAccessToken({
      userId: updatedUser.id,
      role: updatedUser.role,
    });

    const refreshToken = generateRefreshToken({
      userId: updatedUser.id,
    });

    const expires = new Date();
    expires.setDate(expires.getDate() + 7);

    // Save refresh token
    await this.refreshTokenRepo.createToken(updatedUser.id, refreshToken, expires);

    return {
      accessToken,
      refreshToken,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    };
  }

  async listEntriesService(status?: string, page: number = 1, limit: number = 10, search?: string) {
    const entryRepo = AppDataSource.getRepository(Entry);

    const qb = entryRepo.createQueryBuilder("entry")
      .innerJoinAndSelect("entry.contest", "contest")
      .leftJoinAndSelect("contest.entryLevelTemplate", "entryLevelTemplate")
      .innerJoinAndSelect("entry.participant", "participant")
      .leftJoinAndSelect("entry.submission", "submission")
      .orderBy("entry.created_at", "DESC");

    if (status) {
      qb.andWhere("entry.status = :status", { status });
    }

    if (search) {
      qb.andWhere("contest.name ILIKE :search", { search: `%${search}%` });
    }

    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [docs, totalDocs] = await qb.getManyAndCount();

    const s3Service = new S3Service();
    const processedDocs = [];

    for (const entry of docs) {
      const template = entry.contest?.entryLevelTemplate;
      if (template && entry.submission?.data) {
        const fields = template.schema?.fields || [];
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
      }
      processedDocs.push(entry);
    }

    const totalPages = Math.ceil(totalDocs / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      docs: processedDocs,
      totalDocs,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPrevPage,
    };
  }
}
