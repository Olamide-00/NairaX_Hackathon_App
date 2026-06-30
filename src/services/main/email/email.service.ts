import axios from "axios";
import { logger } from "../../../utils/logger.utils";
import { config } from "dotenv";

config();

interface EmailTemplate {
  subject: string;
  html: string;
}


class EmailService {

  private apiKey: string;
  private mailAgentAlias: string;
  private fromEmail: string;
  private fromName: string;


  constructor() {

    const apiKey = process.env.ZEPTOMAIL_API_KEY;
    const mailAgentAlias = process.env.ZEPTOMAIL_MAIL_AGENT_ALIAS;
    const fromEmail = process.env.MAIL_FROM_EMAIL;
    const fromName = process.env.MAIL_FROM_NAME;


    if (
      !apiKey ||
      !mailAgentAlias ||
      !fromEmail
    ) {
      throw new Error(
        "Missing ZeptoMail configuration"
      );
    }


    this.apiKey = apiKey;
    this.mailAgentAlias = mailAgentAlias;
    this.fromEmail = fromEmail;
    this.fromName = fromName || "NairaX";
  }



  async send(
    to: string,
    template: EmailTemplate
  ): Promise<void> {


    if (
      !to ||
      !template?.subject ||
      !template?.html
    ) {
      throw new Error(
        "Invalid email parameters"
      );
    }



    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


    if (!emailRegex.test(to)) {
      throw new Error(
        "Invalid recipient email address"
      );
    }



    try {


      await axios.post(
        "https://api.zeptomail.com/v1.1/email",
        {
          from: {
            address: this.fromEmail,
            name: this.fromName,
          },

          to: [
            {
              email_address: {
                address: to,
              },
            },
          ],

          subject: template.subject,

          htmlbody: template.html,

          mail_agent_alias:
            this.mailAgentAlias,
        },

        {
          headers: {
            Authorization:
              this.apiKey,

            "Content-Type":
              "application/json",
          },
        }
      );



      logger.info(
        "Email sent successfully",
        {
          to,
          subject: template.subject,
        }
      );


    } catch (err) {


      logger.error(
        "Email send failed",
        {
          to,
          subject: template.subject,
          error:
            err instanceof Error
              ? err.message
              : "Unknown error",
        }
      );


      throw new Error(
        "Failed to send email. Please try again later."
      );
    }
  }



  async verify(): Promise<void> {

    // ZeptoMail API does not need SMTP verify.
    // We can just verify credentials by sending a request.

    try {

      if (!this.apiKey) {
        throw new Error(
          "Missing ZeptoMail API key"
        );
      }


      logger.info(
        "ZeptoMail configuration verified"
      );


    } catch (err) {

      logger.error(
        "ZeptoMail verification failed",
        {
          error:
            err instanceof Error
              ? err.message
              : "Unknown error",
        }
      );


      throw new Error(
        "Email configuration failed"
      );
    }
  }

}


export const emailService =
  new EmailService();