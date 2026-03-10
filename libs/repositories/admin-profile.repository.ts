import { AppDataSource } from "@libs/database/data-source";
import { AdminProfile } from "@libs/entities";
import { Repository } from "typeorm";

export class AdminProfileRepository {
  private repo: Repository<AdminProfile>;

  constructor() {
    this.repo = AppDataSource.getRepository(AdminProfile);
  }

  async createProfile(adminProfile: Partial<AdminProfile>) {
    const profile = this.repo.create(adminProfile);
    return this.repo.save(profile);
  }

  async findByUserId(userId: string) {
    return this.repo.findOne({ 
      where: { user: { id: userId } }, 
      relations: ["user"] 
    });
  }

  // async updateAdminCode(userId: string, adminCode: string) {
  //   return this.repo.update({ user: { id: userId } }, { adminCode });
  // }

  async updateAdminProfile(userId:string,data:Partial<AdminProfile>){
    return this.repo.update({user:{id:userId}},data);
  }
}