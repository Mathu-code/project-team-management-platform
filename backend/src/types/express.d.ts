import { Role } from '@prisma/client';
import { File as MulterFile } from 'multer';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: Role;
      };
      file?: MulterFile;
    }
  }
}

export {};
