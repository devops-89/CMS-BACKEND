import bcrypt from "bcrypt";
import {
  ParticipantProfileRepository,
  UserRepository,
  OtpsRepository,
} from "@libs/repositories";
import { UserRole, UserStatus } from "@libs/entities";
import { NotificationService } from "@libs/notifications/notification.service";
import { ConflictError, BadRequestError } from "@libs/utils/errors.util";
import { createParticipantDto } from "@libs/dto/user.dto";

export class UserService {
  private userRepo = new UserRepository();
  private participantRepo = new ParticipantProfileRepository();
  private otpRepo = new OtpsRepository();
  private notificationService = new NotificationService();

  async sendOtp(email: string) {
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP
    const hashedOtp = await bcrypt.hash(otp, 10);

    // Expiry (5 minutes)
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 5);

    // Save OTP (using email as user_id since user doesn't exist yet)
    await this.otpRepo.createOtp(email, hashedOtp, expires);

    // Send via email
    await this.notificationService.sendOtp(email, otp, "Participant");
  }

  async createParticipant(payload: createParticipantDto) {
    const { firstName, lastName, email, password, otp } = payload;

    // 1. Check if user already exists
    const existingUser = await this.userRepo.findByEmail(email);
    if (existingUser) {
      throw new ConflictError("User already exists");
    }

    // 2. Fetch the latest OTP for this email
    const record = await this.otpRepo.findLatestOtp(email);
    if (!record) {
      throw new BadRequestError("OTP not found");
    }

    // 3. Expiry check
    if (record.expires_at < new Date()) {
      throw new BadRequestError("OTP expired");
    }

    // 4. Compare OTP
    const isValid = await bcrypt.compare(otp, record.otp);
    if (!isValid) {
      throw new BadRequestError("Invalid OTP");
    }

    // 5. Mark OTP as used
    await this.otpRepo.markUsed(record.id);

    // 6. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 7. Merge first name and last name into full name
    const fullName = `${firstName} ${lastName}`.trim();

    // 8. Create user
    const user = await this.userRepo.createUser({
      email,
      password: hashedPassword,
      role: UserRole.PARTICIPANT,
      status: UserStatus.ACTIVE,
      firstName,
      lastName,
      fullName,
    });

    // 9. Create Participant Profile
    await this.participantRepo.createProfile({ user });

    return user;
  }
}
