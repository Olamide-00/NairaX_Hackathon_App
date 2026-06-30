import winston from "winston";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const isProduction = process.env.NODE_ENV === "production";

// ─── Custom dev format ────────────────────────────────────────────────────────

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length
    ? `\n${JSON.stringify(meta, null, 2)}`
    : "";
  return `${timestamp} [${level}]: ${stack ?? message}${metaStr}`;
});

// ─── Transports ───────────────────────────────────────────────────────────────

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: isProduction
      ? combine(timestamp(), errors({ stack: true }), json())
      : combine(
          colorize({ all: true }),
          timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
          errors({ stack: true }),
          devFormat,
        ),
  }),
];

if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      format: combine(timestamp(), errors({ stack: true }), json()),
    }),
  );
}

// ─── Logger instance ──────────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
  transports,
  exitOnError: false,
});
