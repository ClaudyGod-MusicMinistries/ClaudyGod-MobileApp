export {};

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      authUser?: {
        id: string;
        email: string;
        displayName: string;
        role: string;
      };
    }
  }
}
