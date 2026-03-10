import { AppDataSource } from "@libs/database/data-source";
import { JudgeProfile } from "@libs/entities";
import { Repository } from "typeorm";

export class JudgeProfileRepository {
  private repo: Repository<JudgeProfile>;

  constructor() {
    this.repo = AppDataSource.getRepository(JudgeProfile);
  }

  async createProfile(judgeProfile: Partial<JudgeProfile>) {
    const profile = this.repo.create(judgeProfile);
    return this.repo.save(profile);
  }

  async findByUserId(userId: string) {
    return this.repo.findOne({ 
      where: { user: { id: userId } }, 
      relations: ["user"] 
    });
  }

  // async updateJudgeLicense(userId: string, license: string) {
  //   return this.repo.update({ user: { id: userId } }, { judgeLicense: license });
  // }

  async updateJudgeProfile(userId:string,data:Partial<JudgeProfile>){
    this.repo.update({user:{id:userId}},data);
  }
}