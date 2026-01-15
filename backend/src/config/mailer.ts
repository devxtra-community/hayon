import nodemailer from "nodemailer";
import { ENV } from "./env";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: ENV.EMAIL.USER,
    pass: ENV.EMAIL.PASS,
  },
});
