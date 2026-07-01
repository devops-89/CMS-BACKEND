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
  AdminProfileRepository,
  JudgeProfileRepository,
  RoleRepository,
} from "@libs/repositories";
import { UserRole, UserStatus, Entry } from "@libs/entities";
import { AppDataSource } from "@libs/database/data-source";
import { NotificationService } from "@libs/notifications/notification.service";
import { ConflictError, BadRequestError, NotFoundError } from "@libs/utils/errors.util";
import { createParticipantDto, verifyParticipantDto, createPublicUserDto, verifyPublicUserDto, createUserByRoleDto, updateRoleUserDto } from "@libs/dto/user.dto";
import { RefreshTokenRepository } from "@libs/repositories/refresh-token.repository";
import { generateAccessToken, generateRefreshToken } from "@libs/utils/jwt.util";
import { S3Service } from "@libs/s3";

export class UserService {
  private userRepo = new UserRepository();
  private participantRepo = new ParticipantProfileRepository();
  private adminRepo = new AdminProfileRepository();
  private judgeRepo = new JudgeProfileRepository();
  private roleRepo = new RoleRepository();
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

    if (!contest.allow_new_registrations) {
      throw new BadRequestError("New registrations are not allowed for this contest");
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
    if (existingUser && !existingUser.deleted_at) {
      if (existingUser.role !== UserRole.PARTICIPANT) {
        throw new ConflictError("User already exists with this emailId!");
      }

      if (existingUser.status === UserStatus.ACTIVE) {
        throw new ConflictError("Email already registered");
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
      user.participant_profile_data = {
        ...(user.participant_profile_data || {}),
        pendingContestId: contest.id,
      };
      await this.userRepo.save(user);
    } else {
      // =====================================================
      // Hash Password
      // =====================================================
      const hashedPassword = await bcrypt.hash(password, 12);
      fullName = fullName || `${firstName} ${lastName}`.trim();

      if (existingUser && existingUser.deleted_at) {
        await this.userRepo.restore(existingUser.id);
        user = existingUser;
        user.deleted_at = null as any;
        user.password = hashedPassword;
        user.role = UserRole.PARTICIPANT;
        user.status = UserStatus.PENDING;
        user.firstName = firstName;
        user.lastName = lastName;
        user.fullName = fullName;
        user.phone = phone;
        user.countryId = countryId;
        user.avatarUrl = avatarUrl || undefined;
        user.form_template_id = template.id;
        user.isSelfRegistered = true;
        user.participant_profile_data = {
          pendingContestId: contest.id,
        };
        await this.userRepo.save(user);
      } else {
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
          participant_profile_data: {
            pendingContestId: contest.id,
          },
        });
      }
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

    // Note: Participant record is created after OTP verification.

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

    // Check and create participant registration record if there is a pending registration
    const pendingContestId = user.participant_profile_data?.pendingContestId;
    if (pendingContestId) {
      const profile = await this.participantRepo.findByUserId(user.id);
      if (profile && profile.submission_id) {
        const existingParticipant = await this.participantEntityRepo.findOne({
          where: {
            contest_id: pendingContestId,
            user_id: user.id,
          },
          withDeleted: true,
        });
        if (existingParticipant) {
          if (existingParticipant.deleted_at) {
            await this.participantEntityRepo.restore(existingParticipant.id);
            existingParticipant.deleted_at = null as any;
            existingParticipant.submission_id = profile.submission_id;
            existingParticipant.status = "approved";
            await this.participantEntityRepo.save(existingParticipant);
          }
        } else {
          await this.participantEntityRepo.save(
            this.participantEntityRepo.create({
              contest_id: pendingContestId,
              submission_id: profile.submission_id,
              user_id: user.id,
              status: "approved",
            })
          );
        }
      }

      // Clean up the pendingContestId metadata
      const profileData = { ...(user.participant_profile_data || {}) };
      delete profileData.pendingContestId;
      user.participant_profile_data = profileData;
      await this.userRepo.save(user);
    }

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

    let user;
    if (existingUser) {
      if (existingUser.deleted_at) {
        await this.userRepo.restore(existingUser.id);
        existingUser.deleted_at = null as any;
      } else if (existingUser.status === UserStatus.ACTIVE) {
        throw new ConflictError("Email already registered");
      }

      // Update details for PENDING or restored user
      let firstName = "";
      let lastName = "";
      const name = fullName.trim();
      if (name) {
        const parts = name.split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }

      const hashedPassword = await bcrypt.hash(password, 12);

      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.fullName = name;
      existingUser.password = hashedPassword;
      existingUser.role = UserRole.PUBLIC;
      existingUser.status = UserStatus.PENDING;

      await this.userRepo.save(existingUser);
      user = existingUser;
    } else {
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
      user = await this.userRepo.createUser({
        email,
        password: hashedPassword,
        role: UserRole.PUBLIC,
        status: UserStatus.PENDING,
        isSelfRegistered: true,
        firstName,
        lastName,
        fullName: name,
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5);

    // Store OTP in database
    await this.otpRepo.createOtp(user.id, hashedOtp, expires);

    // Send OTP to email
    await this.notificationService.sendOtp(email, otp, user.firstName || "User");

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
      if (status.includes(",")) {
        qb.andWhere("entry.status IN (:...statuses)", { statuses: status.split(",").map(s => s.trim()) });
      } else {
        qb.andWhere("entry.status = :status", { status });
      }
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

  async createUserByRoleService(roleId: string, payload: createUserByRoleDto) {
    const { fullName, email, password } = payload;

    // Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      if (existingUser.deleted_at) {
        await this.userRepo.restore(existingUser.id);
        existingUser.deleted_at = null as any;
      } else {
        throw new ConflictError("Email already registered");
      }
    }

    // Find role
    const roleEntity = await this.roleRepo.findById(roleId);
    if (!roleEntity) {
      throw new NotFoundError("Role not found");
    }

    const roleName = roleEntity.name;
    const roleNameLower = roleName.toLowerCase();
    const isStandardUserRole = Object.values(UserRole).includes(roleNameLower as UserRole);
    const legacyRoleValue = isStandardUserRole ? (roleNameLower as UserRole) : null;

    // Split fullName
    let firstName = "";
    let lastName = "";
    const name = fullName.trim();
    if (name) {
      const parts = name.split(/\s+/);
      firstName = parts[0] || "";
      lastName = parts.slice(1).join(" ") || "";
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    let user;
    if (existingUser) {
      existingUser.firstName = firstName;
      existingUser.lastName = lastName;
      existingUser.fullName = name;
      existingUser.password = hashedPassword;
      existingUser.role = legacyRoleValue;
      existingUser.roleEntity = roleEntity;
      existingUser.status = UserStatus.ACTIVE;

      await this.userRepo.save(existingUser);
      user = existingUser;
    } else {
      user = await this.userRepo.createUser({
        email,
        password: hashedPassword,
        role: legacyRoleValue,
        roleEntity: roleEntity,
        status: UserStatus.ACTIVE,
        firstName,
        lastName,
        fullName: name,
      });
    }

    // Create profile based on standard role
    if (legacyRoleValue === UserRole.ADMIN) {
      const existingProfile = await this.adminRepo.findByUserId(user.id);
      if (!existingProfile) {
        await this.adminRepo.createProfile({ user });
      }
    } else if (legacyRoleValue === UserRole.JUDGE) {
      const existingProfile = await this.judgeRepo.findByUserId(user.id);
      if (!existingProfile) {
        await this.judgeRepo.createProfile({ user });
      }
    } else if (legacyRoleValue === UserRole.PARTICIPANT) {
      const existingProfile = await this.participantRepo.findByUserId(user.id);
      if (!existingProfile) {
        await this.participantRepo.createProfile({ user });
      }
    }

    // Send Welcome Email Notification
    await this.notificationService.sendWelcomeEmail(email, name, roleName, password);

    user.roleEntity = roleEntity;
    user.role_id = roleEntity.id;

    return user;
  }

  async updateRoleUserService(userId: string, payload: updateRoleUserDto) {
    const user = await this.userRepo.getUserById(userId);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    if (!user.role_id) {
      throw new BadRequestError("This user does not have a role assigned and cannot be updated via this endpoint");
    }

    const { fullName, email, password, roleId, status } = payload;
    const updates: { roleName?: string; email?: string; password?: string; status?: string } = {};

    if (email && email !== user.email) {
      const existingUser = await this.userRepo.findByEmail(email);
      if (existingUser && existingUser.id !== userId) {
        throw new ConflictError("Email already registered");
      }
      user.email = email;
      updates.email = email;
    }

    if (fullName !== undefined) {
      let firstName = "";
      let lastName = "";
      const name = fullName.trim();
      if (name) {
        const parts = name.split(/\s+/);
        firstName = parts[0] || "";
        lastName = parts.slice(1).join(" ") || "";
      }
      user.firstName = firstName;
      user.lastName = lastName;
      user.fullName = name;
    }

    if (password) {
      user.password = await bcrypt.hash(password, 12);
      updates.password = password;
    }

    if (roleId) {
      const roleEntity = await this.roleRepo.findById(roleId);
      if (!roleEntity) {
        throw new NotFoundError("Role not found");
      }
      user.roleEntity = roleEntity;
      user.role_id = roleEntity.id;
      updates.roleName = roleEntity.name;

      const roleNameLower = roleEntity.name.toLowerCase();
      const isStandardUserRole = Object.values(UserRole).includes(roleNameLower as UserRole);
      const legacyRoleValue = isStandardUserRole ? (roleNameLower as UserRole) : null;
      user.role = legacyRoleValue;

      // Profile creation if not existing
      if (legacyRoleValue === UserRole.ADMIN) {
        const existingProfile = await this.adminRepo.findByUserId(user.id);
        if (!existingProfile) await this.adminRepo.createProfile({ user });
      } else if (legacyRoleValue === UserRole.JUDGE) {
        const existingProfile = await this.judgeRepo.findByUserId(user.id);
        if (!existingProfile) await this.judgeRepo.createProfile({ user });
      } else if (legacyRoleValue === UserRole.PARTICIPANT) {
        const existingProfile = await this.participantRepo.findByUserId(user.id);
        if (!existingProfile) await this.participantRepo.createProfile({ user });
      }
    }

    if (status) {
      user.status = status;
      updates.status = status;
    }

    await this.userRepo.save(user);

    if (Object.keys(updates).length > 0) {
      await this.notificationService.sendAccountUpdatedEmail(user.email || "", user.fullName || "", updates);
    }

    return user;
  }
}
