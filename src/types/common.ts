import { UserRole } from "@prisma/client";

export interface IJWTPayload {
  id: string;             // <-- added (same as userId)
  userId: string;         // keep if your DB uses `id`
  email: string;
  role: UserRole;
  isVerified: boolean;
  iat?: number;
  exp?: number;
}
