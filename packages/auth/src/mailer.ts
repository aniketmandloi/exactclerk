export type Mail = { to: string; subject: string; text: string };

export type Mailer = { send(mail: Mail): Promise<void> };
