import { Request, Response, NextFunction } from "express";

const colors = {
  reset: "\x1b[0m",

  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",

  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
};

export const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {

  const start = Date.now();

  res.on("finish", () => {

    const responseTime =
      Date.now() - start;

    let statusColor =
      colors.green;

    // Status Code Colors
    if (res.statusCode >= 500) {

      statusColor = colors.red;

    } else if (res.statusCode >= 400) {

      statusColor = colors.red;

    } else if (res.statusCode >= 300) {

      statusColor = colors.yellow;

    } else if (res.statusCode >= 200) {

      statusColor = colors.green;
    }

    // Response Time Colors
    let timeColor =
      colors.green;

    if (responseTime >= 3000) {

      timeColor = colors.red;

    } else if (responseTime >= 1000) {

      timeColor = colors.yellow;
    }

    console.log(
      `${colors.cyan}[${new Date().toISOString()}]${colors.reset} ` +

      `${colors.magenta}${req.method}${colors.reset} ` +

      `${req.originalUrl} ` +

      `${statusColor}${res.statusCode}${colors.reset} ` +

      `- ${timeColor}${responseTime}ms${colors.reset}`,
    );
  });

  next();
};