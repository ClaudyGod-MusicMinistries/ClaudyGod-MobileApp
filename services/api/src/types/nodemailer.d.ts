declare module 'nodemailer' {
  interface AttachmentLike {
    filename?: string | false;
    content?: string | Buffer;
    path?: string;
    href?: string;
    cid?: string;
    encoding?: string;
    contentType?: string;
    contentTransferEncoding?: string | false;
    contentDisposition?: 'attachment' | 'inline';
    headers?: Record<string, string | string[]>;
  }

  interface SendMailOptions {
    from?: string;
    sender?: string;
    to?: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    replyTo?: string | string[];
    subject?: string;
    text?: string | Buffer;
    html?: string | Buffer;
    attachments?: AttachmentLike[];
    headers?: Record<string, string | string[]>;
    messageId?: string;
    date?: string | Date;
    encoding?: string;
  }

  interface SentMessageInfo {
    messageId: string;
    envelope: { from: string; to: string[] };
    accepted: string[];
    rejected: string[];
    pending: string[];
    response: string;
    [key: string]: unknown;
  }

  interface Transporter {
    sendMail(options: SendMailOptions): Promise<SentMessageInfo>;
    verify(): Promise<boolean>;
    close(): void;
  }

  interface SmtpOptions {
    host?: string;
    port?: number;
    secure?: boolean;
    requireTLS?: boolean;
    ignoreTLS?: boolean;
    pool?: boolean;
    maxConnections?: number;
    maxMessages?: number;
    connectionTimeout?: number;
    greetingTimeout?: number;
    socketTimeout?: number;
    auth?: { type?: string; user?: string; pass?: string; accessToken?: string };
    tls?: { rejectUnauthorized?: boolean; ciphers?: string; servername?: string };
    name?: string;
    logger?: boolean | unknown;
    debug?: boolean;
  }

  function createTransport(options: SmtpOptions | { jsonTransport: true } | Record<string, unknown>): Transporter;
  function createTransport(transport: string): Transporter;
}
