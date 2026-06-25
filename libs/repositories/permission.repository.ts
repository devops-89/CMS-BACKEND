import { AppDataSource } from "@libs/database/data-source";
import { Permission, PERMISSION_ROLE } from "@libs/entities";
import { Repository } from "typeorm";

export class PermissionRepository {
  private repo: Repository<Permission>;

  constructor() {
    this.repo = AppDataSource.getRepository(Permission);
  }

  async findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(role?: PERMISSION_ROLE) {
    if (role) {
      return this.repo.find({ where: { role } });
    }
    return this.repo.find();
  }

  async findByRoleAndModule(role: PERMISSION_ROLE, module: string) {
    return this.repo.findOne({ where: { role, module } });
  }

  async createPermission(data: Partial<Permission>) {
    const permission = this.repo.create(data);
    return this.repo.save(permission);
  }

  async updatePermission(id: number, data: Partial<Permission>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async save(permission: Permission) {
    return this.repo.save(permission);
  }

  async deletePermission(id: number): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected !== 0;
  }
}
