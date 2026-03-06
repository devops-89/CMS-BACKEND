import { AppDataSource } from "@libs/database/data-source";
import { User, UserRole } from "@libs/entities";
import { Repository } from "typeorm";

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async createUser(email: string, password: string, role: UserRole) {
    const user = this.repo.create({ email, password, role });
    return this.repo.save(user);
  }

  async findByEmail(email: string) {
    return this.repo.findOne({ 
      where: { email },
      relations: ["adminProfile", "judgeProfile", "participantProfile"]
    });
  }

  async findById(id: number) {
    return this.repo.findOne({ 
      where: { id },
      relations: ["adminProfile", "judgeProfile", "participantProfile"]
    });
  }

  async findAllByRole(role: UserRole) {
    return this.repo.find({ where: { role } });
  }

  async updatePassword(userId: number, newPassword: string) {
    return this.repo.update(userId, { password: newPassword });
  }
}