import { AppDataSource } from "@libs/database/data-source";
import { RefreshToken } from "@libs/entities";

export class RefreshTokenRepository {

  private repo = AppDataSource.getRepository(RefreshToken);

  async createToken(userId: string, token: string, expires: Date) {
    return this.repo.save({
      user_id: userId,
      token,
      expires_at: expires
    });
  }

  async findToken(token: string) {
    return this.repo.findOne({
      where: { token }
    });
  }

  async deleteToken(token: string) {
    await this.repo.delete({ token });
  }

  async deleteUserTokens(userId: string) {
    await this.repo.delete({ user_id: userId });
  }
}