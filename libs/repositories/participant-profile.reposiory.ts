import { AppDataSource } from "@libs/database/data-source";
import { ParticipantProfile } from "@libs/entities";
import { Repository } from "typeorm";

export class ParticipantProfileRepository {
  private repo: Repository<ParticipantProfile>;

  constructor() {
    this.repo = AppDataSource.getRepository(ParticipantProfile);
  }

  

  async findByUserId(userId: string) {
    return this.repo.findOne({ 
      where: { user: { id: userId } }, 
      relations: ["user"] 
    });
  }

  async createProfile(data:Partial<ParticipantProfile>){
    const profile=this.repo.create(data);
    return this.repo.save(profile);
  }

  async updateParticipantProfile(userId:string, data:Partial<ParticipantProfile>){
      return this.repo.update({user:{id:userId}},data);
  }
}