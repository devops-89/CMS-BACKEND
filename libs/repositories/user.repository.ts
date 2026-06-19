import { AppDataSource } from "@libs/database/data-source";
import { User, UserRole, UserStatus } from "@libs/entities";
import { Repository } from "typeorm";

export class UserRepository {
  private repo: Repository<User>;

  constructor() {
    this.repo = AppDataSource.getRepository(User);
  }

  async createUser(data: Partial<User>) {
    const user = this.repo.create(data);
    return this.repo.save(user);
  }

  create(data: Partial<User>) {
    return this.repo.create(data);
  }

  save(user: User) {
    return this.repo.save(user);
  }

  findByEmailWithParticipantProfile(
    email: string,
  ) {
    return this.repo.findOne({
      where: {
        email,
      },
      relations: [
        "participantProfile",
      ],
    });
  }
  async findByEmail(email: string) {
    return this.repo
      .createQueryBuilder("user")
      .addSelect("user.password")
      .where("user.email = :email", { email })
      .getOne();
  }

  // get user detail by id
  async getUserById(id: string) {
    const user = await this.repo.findOne({ where: { id } });

    if (!user) return null;

    if (user.role === "admin") {
      return this.repo.findOne({
        where: { id },
        relations: ["adminProfile", "createdContests"],
      });
    }

    if (user.role === "judge") {
      return this.repo.findOne({
        where: { id },
        relations: [
          "judgeProfile",
          "judgeProfile.contestAssignments",
          "judgeProfile.contestAssignments.contest",
          "entryAssignments",
          "entryAssignments.entry",
          "entryAssignments.contest",
          "createdContests",
        ],
      });
    }


    if (user.role === "participant") {
      return this.repo.findOne({
        where: { id },
        relations: [
          "participantProfile",
          "participantProfile.submission",
          "participants",
          "participants.contest",
          "createdContests",
        ],
      });
    }

    return user;
  }

  async updateUserStatus(userId: string, status: UserStatus) {
    await this.repo.update(userId, { status });
    return this.getUserById(userId);
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) {
      return false;
    }
    return true;
  }

  async findAllByRole(role: UserRole) {
    return this.repo.find({ where: { role } });
  }

  //  update the new password
  async updatePassword(userId: string, newPassword: string) {
    return this.repo.update(userId, { password: newPassword });
  }

  async updateAvatar(userId: string, avatarUrl: string) {
    await this.repo.update(userId, { avatarUrl });

    return this.getUserById(userId);
  }

  async updateUser(userId: string, data: Partial<User>) {
    await this.repo.update(userId, data);

    return this.getUserById(userId);
  }


  // get all users, and filter also for role
  async getUsers(filters: { role?: UserRole; page?: number; limit?: number }) {
    const { role, page = 1, limit = 10 } = filters;

    const qb = this.repo.createQueryBuilder("user");

    if (role) {
      qb.andWhere("user.role = :role", { role });
    }

    qb.leftJoinAndSelect("user.adminProfile", "adminProfile")
      .leftJoinAndSelect("user.judgeProfile", "judgeProfile")
      .leftJoinAndSelect("judgeProfile.contestAssignments", "contestAssignments")
      .leftJoinAndSelect("contestAssignments.contest", "judgeContest")
      .leftJoinAndSelect("user.participantProfile", "participantProfile")
      .leftJoinAndSelect("participantProfile.submission", "submission")
      .leftJoinAndSelect("user.participants", "participants")
      .leftJoinAndSelect("participants.contest", "participantContest")
      .leftJoinAndSelect("user.createdContests", "createdContests")
      .leftJoinAndSelect("user.country", "country");

     qb.orderBy("user.created_at", "DESC");
    qb.skip((page - 1) * limit);
    qb.take(limit);

    const [users, total] = await qb.getManyAndCount();

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
