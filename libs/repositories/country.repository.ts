import { AppDataSource } from "@libs/database/data-source";
import { Country } from "@libs/entities";
import { Repository } from "typeorm";

export class CountryRepository {
  private repo: Repository<Country>;

  constructor() {
    this.repo = AppDataSource.getRepository(Country);
  }

  async createCountry(data: Partial<Country>) {
    const country = this.repo.create(data);
    return this.repo.save(country);
  }

  async findAll() {
    return this.repo.find();
  }

  async findById(id: number) {
    return this.repo.findOne({ where: { id } });
  }

  async findByName(name: string) {
    return this.repo.findOne({ where: { name } });
  }

  async findByCode(code: string) {
    return this.repo.findOne({ where: { code } });
  }

  async updateCountry(id: number, data: Partial<Country>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async deleteCountry(id: number): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    return result.affected !== 0;
  }
}
