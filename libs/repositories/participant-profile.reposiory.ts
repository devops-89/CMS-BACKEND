import { AppDataSource } from "@libs/database/data-source";
import { ParticipantProfile } from "@libs/entities";
import { Repository } from "typeorm";

export class ParticipantProfileRepository {
  private repo: Repository<ParticipantProfile>;

  constructor() {
    this.repo = AppDataSource.getRepository(ParticipantProfile);
  }

  async createProfile(participantProfile: Partial<ParticipantProfile>) {
    const profile = this.repo.create(participantProfile);
    return this.repo.save(profile);
  }

  async findByUserId(userId: number) {
    return this.repo.findOne({ 
      where: { user: { id: userId } }, 
      relations: ["user"] 
    });
  }

  async updateScore(userId: number, score: number) {
    return this.repo.update({ user: { id: userId } }, { score });
  }
}