import { Request, Response } from "express";
import { CountryService } from "./country.service";
import { createCountryDto, updateCountryDto } from "@libs/dto/country.dto";

export class CountryController {
  private service = new CountryService();

  create = async (req: Request<{}, {}, createCountryDto>, res: Response) => {
    try {
      const country = await this.service.createCountry(req.body);
      return res.status(201).json({
        message: "Country created successfully",
        data: country,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getAll = async (req: Request, res: Response) => {
    try {
      const countries = await this.service.getAllCountries();
      return res.status(200).json({
        message: "Countries fetched successfully",
        data: countries,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  getOne = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = req.params.id;
      const country = await this.service.getCountryById(id);
      return res.status(200).json({
        message: "Country fetched successfully",
        data: country,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  update = async (req: Request<{ id: string }, {}, updateCountryDto>, res: Response) => {
    try {
      const id = req.params.id;
      const country = await this.service.updateCountry(id, req.body);
      return res.status(200).json({
        message: "Country updated successfully",
        data: country,
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };

  delete = async (req: Request<{ id: string }>, res: Response) => {
    try {
      const id = req.params.id;
      await this.service.deleteCountry(id);
      return res.status(200).json({
        message: "Country deleted successfully",
      });
    } catch (e: any) {
      return res.status(e.statusCode || 500).json({ message: e.message });
    }
  };
}
