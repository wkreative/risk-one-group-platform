import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.API_PORT ?? 4000),
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  smtpHost: process.env.SMTP_HOST ?? "smtp.gmail.com",
  smtpPort: Number(process.env.SMTP_PORT ?? 587),
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpFrom: process.env.SMTP_FROM ?? "operations@riskonegroup.com"
};
