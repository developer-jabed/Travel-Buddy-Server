import { IAuthUser } from "../interfaces/common";

declare global {
  namespace Express {
    interface Request {
      user?: IAuthUser;
    }
  }
}
