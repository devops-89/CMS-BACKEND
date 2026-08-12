import { AppDataSource } from "@libs/database/data-source";
import { Role } from "@libs/entities";
import { Repository } from "typeorm";

export class RoleRepository {
  private repo: Repository<Role>;

  constructor() {
    this.repo = AppDataSource.getRepository(Role);
  }

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  private normalizeName(name: string): string {
    return name.trim().replace(/\s+/g, "_").toUpperCase();
  }

  async findByName(name: string) {
    return this.repo.findOne({ where: { name: this.normalizeName(name) } });
  }

  async createRole(name: string) {
    const role = this.repo.create({ name: this.normalizeName(name) });
    return this.repo.save(role);
  }

  async ensureRoleExists(name: string) {
    const existing = await this.findByName(name);
    if (existing) {
      return existing;
    }
    return this.createRole(name);
  }

  async findAll() {
    return this.repo.find();
  }
}
