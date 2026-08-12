import { AppDataSource } from "@libs/database/data-source";
import { Otp } from "@libs/entities";

export class OtpsRepository {

  private repo = AppDataSource.getRepository(Otp);

  async createOtp(userId: string, otp: string, expires: Date) {
  return this.repo.save({
    user_id: userId,
    otp,
    expires_at: expires
  });
}

async deleteUserOtps(userId: string) {
  await this.repo.delete({ user_id: userId });
}

  async findLatestOtp(userId: string) {
  return this.repo.findOne({
    where: {
      user_id: userId,
      isUsed: false
    },
    order: {
      created_at: "DESC"
    }
  });
}

  async markUsed(id: string) {
    await this.repo.update(id, { isUsed: true });
  }
}