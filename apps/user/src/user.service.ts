import bcrypt from "bcrypt";
import {
  ParticipantProfileRepository,
  UserRepository,
  OtpsRepository,
  FormTemplateRepository,
  CountryRepository,
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
  private notificationService = new NotificationService();

  async createParticipantService(payload: createParticipantDto) {
    const { templateId, countryId, formData } = payload;

    // 1. Validate that the country exists
    const country = await this.countryRepo.findById(countryId);
    if (!country) {
      throw new BadRequestError("Invalid country ID");
    }

    // 2. Fetch the FormTemplate
    const template = await this.formTemplateRepo.findById(templateId);
    if (!template) {
      throw new NotFoundError("Form template not found");
    }

    // 3. Extract credentials dynamically based on field labels
    const fields = template.schema.fields;
    let firstName = "";
    let lastName = "";
    let email = "";
    let password = "";

    for (const field of fields) {
      const value = formData[field.id];
      if (value === undefined || value === null) continue;

      const label = field.label.trim().toLowerCase();

      if (label === "firstname" || label === "first name" || label.includes("firstname")) {
        firstName = String(value);
      } else if (label === "lastname" || label === "last name" || label.includes("lastname")) {
        lastName = String(value);
      } else if (label === "mail" || label === "email" || label.includes("mail") || label.includes("email")) {
        email = String(value);
      } else if (label === "password" || label.includes("password")) {
        password = String(value);
      }
    }

    // 4. Validate that all required signup fields were mapped successfully
    if (!firstName) {
      throw new BadRequestError("Firstname is required based on the registration form");
    }
    if (!lastName) {
      throw new BadRequestError("Lastname is required based on the registration form");
    }
    if (!email) {
      throw new BadRequestError("Mail/Email is required based on the registration form");
    }
    if (!password) {
      throw new BadRequestError("Password is required based on the registration form");
    }

    // 5. Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 7. Merge first name and last name into full name
    const fullName = `${firstName} ${lastName}`.trim();

    // 8. Create user in PENDING status
    const user = await this.userRepo.createUser({
      email,
      password: hashedPassword,
      role: UserRole.PARTICIPANT,
      status: UserStatus.PENDING,
      firstName,
      lastName,
      fullName,
      countryId,
    });

    // 9. Create Participant Profile
    await this.participantRepo.createProfile({ user });

    // 10. Generate and save OTP linked to the user's UUID
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Expiry (5 minutes)
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5);

    // Save OTP
    await this.otpRepo.createOtp(user.id, hashedOtp, expires);

    // Send OTP via email
    await this.notificationService.sendOtp(email, otp, firstName);

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
