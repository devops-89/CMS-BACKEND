import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

export const validate =
  (schema: ZodTypeAny) =>
  (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse(req.body);

    if (!result.success) {

      const formattedErrors: Record<string, string> = {};

      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as string;
        formattedErrors[field] = issue.message;
      });

      return res.status(400).json({
        message: "Validation error",
        errors: formattedErrors
      });
    }

    req.body = result.data;

    next();
};