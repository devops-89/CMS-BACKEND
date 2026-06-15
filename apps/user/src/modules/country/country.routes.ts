import { Router } from "express";
import { CountryController } from "./country.controller";
import { authenticate } from "@libs/middlewares/auth.middleware";
import { validate } from "@libs/middlewares/validate.middleware";
import { authorize } from "@libs/middlewares/role.middleware";
import { UserRole } from "@libs/entities";
import { createCountrySchema, updateCountrySchema, getCountryByIdSchema } from "@libs/dto/country.dto";

const router = Router();
const controller = new CountryController();

// Get all countries (Public)
router.get("/", controller.getAll.bind(controller));

// Get country by id (Public)
router.get("/:id", validate(getCountryByIdSchema, "params"), controller.getOne.bind(controller));

// Create country (Admin only)
router.post("/", authenticate, authorize(UserRole.ADMIN), validate(createCountrySchema, "body"), controller.create.bind(controller));

// Update country (Admin only)
router.put("/:id", authenticate, authorize(UserRole.ADMIN), validate(getCountryByIdSchema, "params"), validate(updateCountrySchema, "body"), controller.update.bind(controller));

// Delete country (Admin only)
router.delete("/:id", authenticate, authorize(UserRole.ADMIN), validate(getCountryByIdSchema, "params"), controller.delete.bind(controller));

export default router;
