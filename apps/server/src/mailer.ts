import type { Mailer } from "@exactclerk/auth/mailer";

import { ENV } from "./env.server";

// Replaced by the Postmark mailer in #32. Until then, codes are only ever printed outside production.
export const mailer: Mailer = {
  async send(mail) {
    if (ENV.NODE_ENV === "production") {
      throw new Error("No mail provider is configured yet");
    }
    console.log(`[mail] to ${mail.to}: ${mail.subject}\n${mail.text}`);
  },
};
