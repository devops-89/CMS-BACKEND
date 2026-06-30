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

      return res.status(422).json({
        message: "Validation error",
        errors: formattedErrors
      });
    }

    if (source === "body") {
      req.body = result.data;
    } else if (source === "query") {
      Object.defineProperty(req, "query", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    } else if (source === "params") {
      Object.defineProperty(req, "params", {
        value: result.data,
        writable: true,
        configurable: true,
        enumerable: true,
      });
    }

    next();
};