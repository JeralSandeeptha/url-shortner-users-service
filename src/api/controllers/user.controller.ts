import logger from "../../utils/logger";
import SuccessResponse from "../../utils/SuccessResponse";
import ErrorResponse from "../../utils/ErrorResponse";
import HTTP_STATUS from "../../types/enums/HttpStatus";
import { RequestHandler } from "express";
import {
  createKeycloakUser,
  getKeycloakToken,
  getSingleKeycloakUser,
  loginKeycloakUser,
  revokeRefreshToken,
} from "../../utils/keyCloak";
import { UserKeycloakRequest, UserRequest } from "../../types/interfaces/User";
import prisma from "../../config/prisma";
import { envConfig } from "../../config/envConfig";

export const registerUserController: RequestHandler = async (req, res) => {
  const { email, password }: UserRequest = req.body;
  try {
    const token = await getKeycloakToken();
    const userDetails: UserKeycloakRequest = {
      email: email,
      enabled: true,
      password: password,
    };
    const keycloakResponse = await createKeycloakUser(userDetails, token);
    if (keycloakResponse === 201) {
      // get keycloak user
      const userList = await getSingleKeycloakUser(email, token);

      if (!userList[0]) {
        return res
          .status(HTTP_STATUS.NOT_FOUND)
          .json(
            new ErrorResponse(
              HTTP_STATUS.NOT_FOUND,
              "Keycloak user not found for given email query was failed",
              "Keycloak user not found for given email query was failed"
            )
          );
      } else {
        const savedUser = await prisma.user.create({
          data: {
            keycloak_id: userList[0].id,
            username: email,
            email: email,
          },
        });
        return res
          .status(HTTP_STATUS.CREATED)
          .json(
            new SuccessResponse(
              HTTP_STATUS.CREATED,
              "User register query was successful",
              savedUser
            )
          );
      }
    } else {
      res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          new ErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            "User register query was failed",
            "User register query was failed"
          )
        );
    }
  } catch (error) {
    logger.error(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(
        new ErrorResponse(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "User register query internal server error",
          error
        )
      );
  }
};

export const getSingleUserController: RequestHandler = async (req, res) => {
  const userId = req.params.userId;
  try {
    const user = await prisma.user.findFirst({
      where: {
        keycloak_id: userId,
      },
    });

    if (!user) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(
          new ErrorResponse(
            HTTP_STATUS.NOT_FOUND,
            "User not found",
            "Get single user query was failed"
          )
        );
    }

    return res
      .status(HTTP_STATUS.OK)
      .json(
        new SuccessResponse(
          HTTP_STATUS.OK,
          "Get single user query was successful",
          user
        )
      );
  } catch (error) {
    logger.error(error);
    console.log(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(
        new ErrorResponse(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "Get single user query internal server error",
          error
        )
      );
  }
};

export const loginUserController: RequestHandler = async (req, res) => {
  const { email, password }: UserRequest = req.body;
  
  try {
    const loginData = await loginKeycloakUser(email, password);

    if(!loginData) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json(
            new ErrorResponse(
                HTTP_STATUS.BAD_REQUEST,
                "User login query was failed",
                "User login query was failed",
            )
        );
    }

    // Set cookies securely
    res.cookie("access_token", loginData.access_token, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production" ? true : false, // cookies sends through https or http
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.cookie("refresh_token", loginData.refresh_token, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(HTTP_STATUS.ACCEPTED).json(
        new SuccessResponse(
            HTTP_STATUS.ACCEPTED,
            "User login query was successful",
            {
              access_token: loginData.access_token,
              refresh_token: loginData.refresh_token,
            }
        )
    );
  } catch (error) {
    logger.error(error);
    console.log(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(
        new ErrorResponse(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "Login user query internal server error",
          error
        )
      );
  }
};

export const logoutUserController: RequestHandler = async (req, res) => {
  const refreshToken = req.cookies.refresh_token;
  try {

    const revokeStatus = await revokeRefreshToken(refreshToken);
    console.log(revokeStatus);
    
    // Set cookies securely
    res.clearCookie("access_token", {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });

    return res.status(HTTP_STATUS.ACCEPTED).json(
      new SuccessResponse(
        HTTP_STATUS.CREATED,
        "Logout user query was successful",
        "User has been logged out",
      )
    );
  } catch (error) {
    logger.error(error);
    console.log(error);
    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(
        new ErrorResponse(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "Logout user query internal server error",
          error
        )
      );
  }
};

// export const checkUserSessionController: RequestHandler = async (req, res) => {
//   try {
//     return null;
//   } catch (error) {
//     logger.error(error);
//     console.log(error);
//     res
//       .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
//       .json(
//         new ErrorResponse(
//           HTTP_STATUS.INTERNAL_SERVER_ERROR,
//           "Check user session query internal server error",
//           error
//         )
//       );
//   }
// };
