import { UserRole, UserStatus } from "@prisma/client";

export interface IAuthUser {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
}

export interface IPaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
