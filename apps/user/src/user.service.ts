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
import { createParticipantDto, verifyParticipantDto } from "@libs/dto/user.dto";

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

  // async createParticipantService(payload: createParticipantDto) {
  //   const { contestId, countryId, formData } = payload;

  //   // 1. Validate that the country exists
  //   const country = await this.countryRepo.findById(countryId);
  //   if (!country) {
  //     throw new BadRequestError("Invalid country ID");
  //   }

  //   // 2. Fetch the Contest
  //   const contest = await this.contestRepo.findById(contestId);
  //   if (!contest) {
  //     throw new NotFoundError("Contest not found");
  //   }

  //   // 3. Fetch the associated user level template from the contest
  //   const template = contest.userLevelTemplate;
  //   if (!template) {
  //     throw new NotFoundError("User registration form template not configured for this contest");
  //   }

  //   // 4. Extract credentials dynamically based on field labels
  //   const fields = template.schema.fields;
  //   let firstName = "";
  //   let lastName = "";
  //   let email = "";
  //   let password = "";
  //   let phone = "";
  //   let dateOfBirthStr = "";

  //   for (const field of fields) {
  //     const value = formData[field.id];
  //     if (value === undefined || value === null) continue;

  //     const label = field.label.trim().toLowerCase();

  //     if (label === "firstname" || label === "first name" || label.includes("firstname")) {
  //       firstName = String(value);
  //     } else if (label === "lastname" || label === "last name" || label.includes("lastname")) {
  //       lastName = String(value);
  //     } else if (label === "mail" || label === "email" || label.includes("mail") || label.includes("email")) {
  //       email = String(value);
  //     } else if (label === "password" || label.includes("password")) {
  //       password = String(value);
  //     } else if (label === "phone" || label === "phone number" || label.includes("phone") || label.includes("mobile")) {
  //       phone = String(value);
  //     } else if (label === "date of birth" || label === "dob" || label === "birthdate" || label.includes("birth")) {
  //       dateOfBirthStr = String(value);
  //     }
  //   }

  //   // Ensure strings are set to empty strings rather than undefined if missing
  //   firstName = firstName || "";
  //   lastName = lastName || "";
  //   phone = phone || "";

  //   // 5. Validate that critical credentials (email and password) are present
  //   if (!email) {
  //     throw new BadRequestError("Mail/Email field is required");
  //   }
  //   if (!password) {
  //     throw new BadRequestError("Password field is required");
  //   }

  //   // 6. Check if user already exists
  //   const existingUser = await this.userRepo.findByEmail(email);
  //   if (existingUser) {
  //     throw new ConflictError("User already exists with this emailId!");
  //   }

  //   // 7. Hash password
  //   const hashedPassword = await bcrypt.hash(password, 12);

  //   // 8. Merge first name and last name into full name
  //   const fullName = `${firstName} ${lastName}`.trim();

  //   // 9. Create user in PENDING status
  //   const user = await this.userRepo.createUser({
  //     email,
  //     password: hashedPassword,
  //     role: UserRole.PARTICIPANT,
  //     status: UserStatus.PENDING,
  //     form_template_id:contest.userLevelTemplate?.id,
  //     isSelfRegistered:true,
  //     firstName,
  //     lastName,
  //     fullName,
  //     phone,
  //     countryId,
  //   });

  //   // 10. Create Participant Profile
  //   const dob = dateOfBirthStr ? new Date(dateOfBirthStr) : null;
  //   await this.participantRepo.createProfile({
  //     user,
  //     dateOfBirth: dob as Date,
  //   });

  //   // 11. Generate and save OTP linked to the user's UUID
  //   const otp = Math.floor(100000 + Math.random() * 900000).toString();
  //   const hashedOtp = await bcrypt.hash(otp, 10);

  //   // Expiry (5 minutes)
  //   const expires = new Date();
  //   expires.setMinutes(expires.getMinutes() + 5);

  //   // Save OTP
  //   await this.otpRepo.createOtp(user.id, hashedOtp, expires);

  //   // Send OTP via email
  //   await this.notificationService.sendOtp(email, otp, firstName || "Participant");

  //   return user;
  // }


async createParticipantService(payload: createParticipantDto) {
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

  // =====================================================
  // Extract Dynamic Fields
  // =====================================================

  let firstName = "";
  let lastName = "";
  let email = "";
  let password = "";
  let phone = "";
  let dateOfBirthStr = "";

  for (const field of template.schema.fields) {
    const value = formData[field.id];

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
    }
  }

  firstName = firstName || "";
  lastName = lastName || "";
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

  const fullName = `${firstName} ${lastName}`.trim();

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
        formData,
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

    return updatedUser;
  }
}
