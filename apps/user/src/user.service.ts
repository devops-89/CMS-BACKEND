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
import { UserRole, UserStatus } from "@libs/entities";
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

  let firstName = "";
  let lastName = "";
  let fullName = "";
  let email = "";
  let password = "";
  let phone = "";
  let dateOfBirthStr = "";
  let avatarUrl = "";

  for (const field of template.schema.fields) {
    const value = processedFormData[field.id];

    if (value === undefined || value === null) {
      continue;
    }

    const label = field.label.trim().toLowerCase();

    if (
      label === "firstname" ||
      label === "first name" ||
      label.includes("firstname")
    ) {
      firstName = String(value);
    } else if (
      label === "lastname" ||
      label === "last name" ||
      label.includes("lastname")
    ) {
      lastName = String(value);
    } else if (
      label === "full name" ||
      label === "fullname" ||
      label === "name" ||
      label.includes("full name") ||
      label.includes("fullname") ||
      label.includes("name")
    ) {
      fullName = String(value);
    } else if (
      label === "mail" ||
      label === "email" ||
      label.includes("mail") ||
      label.includes("email")
    ) {
      email = String(value);
    } else if (
      label === "password" ||
      label.includes("password")
    ) {
      password = String(value);
    } else if (
      label === "phone" ||
      label === "phone number" ||
      label.includes("phone") ||
      label.includes("mobile")
    ) {
      phone = String(value);
    } else if (
      label === "date of birth" ||
      label === "dob" ||
      label === "birthdate" ||
      label.includes("birth")
    ) {
      dateOfBirthStr = String(value);
    } else if (
      label === "avatar" ||
      label.includes("avatar")
    ) {
      avatarUrl = String(value);
    }
  }

  fullName = fullName.trim();
  if (fullName && (!firstName || !lastName)) {
    const parts = fullName.split(/\s+/);
    if (!firstName) firstName = parts[0] || "";
    if (!lastName) lastName = parts.slice(1).join(" ") || "";
  }

  firstName = firstName.trim();
  lastName = lastName.trim();
  phone = phone || "";

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

  if (existingUser) {
    throw new ConflictError(
      "User already exists with this emailId!",
    );
  }

  // =====================================================
  // Hash Password
  // =====================================================

  const hashedPassword = await bcrypt.hash(password, 12);

   fullName = fullName || `${firstName} ${lastName}`.trim();

  // =====================================================
  // Create User
  // =====================================================

  const user = await this.userRepo.createUser({
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

  // =====================================================
  // Create Participant Profile
  // =====================================================

  const dob = dateOfBirthStr
    ? new Date(dateOfBirthStr)
    : null;

  await this.participantRepo.createProfile({
    user,
    dateOfBirth: dob as Date,
  });

  // =====================================================
  // Create Form Submission
  // =====================================================

  const submission =
    await this.submissionRepo.save(
      this.submissionRepo.create(
        template,
        processedFormData,
      ),
    );

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

    // 2. Check if user is already active
    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestError("User is already active");
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
}
