import { Request, Response, NextFunction } from "express";
import { ZodTypeAny } from "zod";

export const validate =
  (schema: ZodTypeAny, source: "body" | "query" | "params" = "body") =>
  (req: Request, res: Response, next: NextFunction) => {

    const result = schema.safeParse(req[source]);

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

    // only overwrite body safely
    if (source === "body") {
      req.body = result.data;
    }

    next();
};