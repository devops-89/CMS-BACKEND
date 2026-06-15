import { CountryRepository } from "@libs/repositories/country.repository";
import { createCountryDto, updateCountryDto } from "@libs/dto/country.dto";
import { ConflictError, NotFoundError } from "@libs/utils/errors.util";

export class CountryService {
  private repo = new CountryRepository();

  async createCountry(payload: createCountryDto) {
    const existingName = await this.repo.findByName(payload.name);
    if (existingName) {
      throw new ConflictError("Country name already exists");
    }

    const existingCode = await this.repo.findByCode(payload.code);
    if (existingCode) {
      throw new ConflictError("Country code already exists");
    }

    return this.repo.createCountry(payload);
  }

  async getAllCountries() {
    return this.repo.findAll();
  }

  async getCountryById(id: number) {
    const country = await this.repo.findById(id);
    if (!country) {
      throw new NotFoundError("Country not found");
    }
    return country;
  }

  async updateCountry(id: number, payload: updateCountryDto) {
    const country = await this.repo.findById(id);
    if (!country) {
      throw new NotFoundError("Country not found");
    }

    if (payload.name && payload.name !== country.name) {
      const existingName = await this.repo.findByName(payload.name);
      if (existingName) {
        throw new ConflictError("Country name already exists");
      }
    }

    if (payload.code && payload.code !== country.code) {
      const existingCode = await this.repo.findByCode(payload.code);
      if (existingCode) {
        throw new ConflictError("Country code already exists");
      }
    }

    return this.repo.updateCountry(id, payload);
  }

  async deleteCountry(id: number) {
    const country = await this.repo.findById(id);
    if (!country) {
      throw new NotFoundError("Country not found");
    }
    await this.repo.deleteCountry(id);
  }
}
