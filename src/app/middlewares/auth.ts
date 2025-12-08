import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { Secret } from "jsonwebtoken";
import config from "../../config";
import { jwtHelpers } from "../../helpers/jwtHelpers";
import ApiError from "../errors/ApiError";

const auth = (...roles: string[]) => {
    return async (
        req: Request & { user?: any },
        res: Response,
        next: NextFunction
    ) => {
        try {
            let token =
                req.headers.authorization ||
                req.headers.accesstoken ||
                req.cookies.accessToken;

            if (!token) {
                throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
            }

            // 🔥 Remove "Bearer " if present
            if (token.startsWith("Bearer ")) {
                token = token.split(" ")[1];
            }

            // Verify token
            const verifiedUser = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as Secret);

            req.user = verifiedUser;

            // Role check
            if (roles.length && !roles.includes(verifiedUser.role)) {
                throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
            }

            next();
        } catch (err) {
            next(err);
        }
    };
};

export default auth;



// import { NextFunction, Request, Response } from "express";
// import httpStatus from "http-status";
// import { Secret } from "jsonwebtoken";
// import config from "../../config";
// import { jwtHelpers } from "../../helpers/jwtHelpers";
// import ApiError from "../errors/ApiError";

// const auth = (...roles: string[]) => {
//   return async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
//     try {
//       // Get token from header or cookie
//       let token = req.headers.authorization || req.cookies.accessToken;
//       console.log("token:",token)

//       if (!token) {
//         throw new ApiError(httpStatus.UNAUTHORIZED, "You are not authorized!");
//       }

//       // Remove "Bearer " if present
//       if (token.startsWith("Bearer ")) {
//         token = token.split(" ")[1];
//       }

//       // Verify token
//       const verifiedUser = jwtHelpers.verifyToken(token, config.jwt.jwt_secret as Secret);

//       req.user = verifiedUser;

//       // Check role permissions
//       if (roles.length && !roles.includes(verifiedUser.role)) {
//         throw new ApiError(httpStatus.FORBIDDEN, "Forbidden!");
//       }

//       next();
//     } catch (err) {
//       next(err);
//     }
//   };
// };

// export default auth;
