import nodemailer, { Transporter } from "nodemailer";
import { logger } from "../../../utils/logger.utils";
import { config } from "dotenv";

config();

interface EmailTemplate {
  subject: string;
  html: string;
}

class EmailService {
  private transporter: Transporter;

  constructor() {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error(
        "Missing SMTP configuration. Ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set in .env",
      );
    }

    this.transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user, pass },
    });
  }

  async send(to: string, template: EmailTemplate): Promise<void> {
    // Add input validation
    if (!to || !template?.subject || !template?.html) {
      throw new Error("Invalid email parameters");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      throw new Error("Invalid recipient email address");
    }

    try {
      await this.transporter.sendMail({
        from: `"${process.env.MAIL_FROM_NAME ?? "NairaX"}" <${process.env.MAIL_FROM_ADDRESS}>`,
        to,
        subject: template.subject,
        html: template.html,
      });
      logger.info("Email sent successfully", { to, subject: template.subject });
    } catch (err) {
      // Don't expose internal error details to users
      logger.error("Email send failed", {
        to,
        subject: template.subject,
        error: err instanceof Error ? err.message : "Unknown error",
      });
      throw new Error("Failed to send email. Please try again later.");
    }
  }

  async verify(): Promise<void> {
    try {
      await this.transporter.verify();
      logger.info("SMTP connection verified successfully");
    } catch (err) {
      logger.error("SMTP connection verification failed", {
        error: err instanceof Error ? err.message : "Unknown error",
      });
      throw new Error(
        "SMTP connection failed. Check your email configuration.",
      );
    }
  }
}

export const emailService = new EmailService();
