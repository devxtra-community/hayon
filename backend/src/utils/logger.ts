import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { Logtail } from "@logtail/node";
import { LogtailTransport } from "@logtail/winston";
import { ENV } from "../config/env";

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp, stack }) => {
  const msg = typeof message === "object" ? JSON.stringify(message) : stack || message;
  return `${timestamp} [${level}]: ${msg}`;
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

const logtail = new Logtail(ENV.UPTIME.BETTER_STACK_TOKEN);

const logger = winston.createLogger({
  level: "http",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), errors({ stack: true }), logFormat),
  transports: [
    dailyRotateTransport,
    errorRotateTransport,
    new winston.transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new LogtailTransport(logtail),
  ],
});

export default logger;
