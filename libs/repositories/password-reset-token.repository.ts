import { AppDataSource } from "@libs/database/data-source";
import { PasswordResetToken } from "@libs/entities";

export class PasswordResetRepository {

  private repo = AppDataSource.getRepository(PasswordResetToken);

  async createToken(userId: string, token: string, expires: Date) {
    return this.repo.save({
      user_id: userId,
      token,
      expires_at: expires
    });
  }

  async findToken(token: string) {
    return this.repo.findOne({
      where: { token, used: false }
    });
  }

  async markUsed(id: string) {
    await this.repo.update(id, { used: true });
  }
}