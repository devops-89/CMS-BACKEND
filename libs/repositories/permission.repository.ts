import { AppDataSource } from "@libs/database/data-source";
import { Permission, PERMISSION_ROLE } from "@libs/entities";
import { Repository } from "typeorm";

export class PermissionRepository {
  private repo: Repository<Permission>;

  constructor() {
    this.repo = AppDataSource.getRepository(Permission);
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id }, relations: ["roleEntity"] });
  }

  async findByRoleIdAndModule(roleId: string, module: string) {
    return this.repo.createQueryBuilder("permission")
      .where("permission.role_id = :roleId", { roleId })
      .andWhere("LOWER(permission.module) = :module", { module: module.toLowerCase() })
      .getOne();
  }

  async findAll(role?: string) {
    if (role) {
      return this.repo.createQueryBuilder("permission")
        .leftJoinAndSelect("permission.roleEntity", "roleEntity")
        .where("(LOWER(CAST(permission.role AS VARCHAR)) = :role OR LOWER(roleEntity.name) = :role)", { role: role.toLowerCase() })
        .getMany();
    }
    return this.repo.find({ relations: ["roleEntity"] });
  }

  async findByRoleAndModule(role: string, module: string) {
    return this.repo.createQueryBuilder("permission")
      .leftJoinAndSelect("permission.roleEntity", "roleEntity")
      .where("(LOWER(CAST(permission.role AS VARCHAR)) = :role OR LOWER(roleEntity.name) = :role)", { role: role.toLowerCase() })
      .andWhere("LOWER(permission.module) = :module", { module: module.toLowerCase() })
      .getOne();
  }

  async createPermission(data: Partial<Permission>) {
    const permission = this.repo.create(data);
    return this.repo.save(permission);
  }

  async updatePermission(id: string, data: Partial<Permission>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async save(permission: Permission) {
    return this.repo.save(permission);
  }

  async deletePermission(id: string): Promise<boolean> {
    const result = await this.repo.delete(id);
    return result.affected !== 0;
  }
}
