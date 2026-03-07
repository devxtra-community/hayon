import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import { ENV } from "../config/env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level}]: ${stack || message}`;
});

const dailyRotateTransport = new DailyRotateFile({
  filename: "logs/app-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  zippedArchive: true,
  maxSize: "20m",
  maxFiles: "14d",
});

const errorRotateTransport = new DailyRotateFile({
  filename: "logs/error-%DATE%.log",
  datePattern: "YYYY-MM-DD",
  level: "error",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "30d",
});

// Better Stack
const logtail = new Logtail(ENV.UPTIME.BETTER_STACK_TOKEN);

const logger = winston.createLogger({
  level: "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), logFormat),
  transports: [
    dailyRotateTransport,
    errorRotateTransport,
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new LogtailTransport(logtail), // ← Better Stack added here
  ],
});

export default logger;
