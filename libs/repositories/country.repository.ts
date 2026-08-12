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

  async findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async findByName(name: string, withDeleted = false) {
  return this.repo.findOne({
    where: { name },
    withDeleted,
  });
}

async findByCode(code: string, withDeleted = false) {
  return this.repo.findOne({
    where: { code },
    withDeleted,
  });
}

  async updateCountry(id: string, data: Partial<Country>) {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async deleteCountry(id: string): Promise<boolean> {
    const result = await this.repo.softDelete(id);
    return result.affected !== 0;
  }

  async restore(id: string) {
  return this.repo.restore(id);
}

async save(country: Country) {
  return this.repo.save(country);
}

}
