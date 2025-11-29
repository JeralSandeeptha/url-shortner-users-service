import logger from "../../utils/logger";
import SuccessResponse from "../../utils/SuccessResponse";
import ErrorResponse from "../../utils/ErrorResponse";
import HTTP_STATUS from "../../types/enums/HttpStatus";
import { RequestHandler } from "express";
import {
  createKeycloakUser,
  deleteKeycloakUser,
  getKeycloakToken,
  getSingleKeycloakUser,
  loginKeycloakUser,
  refreshKeycloakToken,
  resetKeycloakUserPassword,
  revokeRefreshToken,
  verifyToken,
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
      logger.error("User not found");
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

    logger.info("Get single user query was successful");
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

    if (!loginData) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          new ErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            "User login query was failed",
            "User login query was failed"
          )
        );
    }

    const decoded = await verifyToken(loginData.access_token);

    // Set cookies securely
    res.cookie("access_token", loginData.access_token, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production" ? true : false, // cookies sends through https or http
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      // domain: envConfig.DOMAIN
    });

    res.cookie("refresh_token", loginData.refresh_token, {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      // domain: envConfig.DOMAIN
    });

    return res.status(HTTP_STATUS.ACCEPTED).json(
      new SuccessResponse(
        HTTP_STATUS.ACCEPTED,
        "User login query was successful",
        {
          userId: decoded.sub,
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
      // domain: envConfig.DOMAIN
    });

    res.clearCookie("refresh_token", {
      httpOnly: true,
      secure: envConfig.NODE_ENV === "production" ? true : false,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      // domain: envConfig.DOMAIN
    });

    return res
      .status(HTTP_STATUS.ACCEPTED)
      .json(
        new SuccessResponse(
          HTTP_STATUS.ACCEPTED,
          "Logout user query was successful",
          "User has been logged out"
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

export const checkUserSessionController: RequestHandler = async (req, res) => {
  try {
    const access_token = req.cookies.access_token;
    const refresh_token = req.cookies.refresh_token;

    // Check refresh token existence
    if (!refresh_token) {
      return res.status(401).json({ message: "Unauthorized. Please login again" });
    }

    const decoded = await verifyToken(access_token);
    if (decoded) {
      logger.info("Access token is valid");
      return res.json({ user: decoded });
    } else {
      try {

        // Issue new access token
        const new_access_token = await refreshKeycloakToken(refresh_token);

        // Set cookies securely
        res.cookie("access_token", new_access_token, {
          httpOnly: true,
          secure: envConfig.NODE_ENV === "production" ? true : false, // cookies sends through https or http
          sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
          // domain: envConfig.DOMAIN
        });

        return res.json({ message: "New access token issued" });
      } catch (error) {
        return res.status(401).json({
          user: null,
          message: "Invalid refresh token. Please login again",
        });
      }
    }
  } catch (error: any) {
    logger.error(error);
    console.log(error);

    if (
      error.name === "TokenExpiredError" ||
      error.name === "JsonWebTokenError"
    ) {
      return res
        .status(401)
        .json({ user: null, message: "Invalid or expired token" });
    }

    res
      .status(HTTP_STATUS.INTERNAL_SERVER_ERROR)
      .json(
        new ErrorResponse(
          HTTP_STATUS.INTERNAL_SERVER_ERROR,
          "Check user session query internal server error",
          error
        )
      );
  }
};

export const deleteSingleUserController: RequestHandler = async (req, res) => {
  const userId = req.params.userId;

  try {
    // Get admin token from Keycloak
    const token = await getKeycloakToken();

    const kcStatus = await deleteKeycloakUser(userId, token);
    if (kcStatus !== 204) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          new ErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            "Delete single user query was failed",
            "Keycloak user deletion failed"
          )
        );
    }

    // Delete user from Postgres
    const deletedUser = await prisma.user.deleteMany({
      where: {
        keycloak_id: userId,
      },
    });

    if (deletedUser.count === 0) {
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(
          new ErrorResponse(
            HTTP_STATUS.NOT_FOUND,
            "No matching user found in the database",
            "User not found in the database"
          )
        );
    }

    return res
      .status(HTTP_STATUS.NO_CONTENT)
      .json(
        new SuccessResponse(
          HTTP_STATUS.NO_CONTENT,
          "User deleted successfully from Keycloak and database",
          { deletedUser }
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
          "Delete single user query internal server error",
          error
        )
      );
  }
};

export const updateUserPreferencesController: RequestHandler = async (
  req,
  res
) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        user_id: Number(req.params.userId),
      },
    });

    if (!user) {
      logger.error("User not found");
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(
          new ErrorResponse(
            HTTP_STATUS.NOT_FOUND,
            "User not found",
            "Update user preferences query was failed"
          )
        );
    }

    await prisma.user.update({
      where: {
        user_id: Number(req.params.userId),
      },
      data: {
        productUpdates: req.body.productUpdates,
        securityAlerts: req.body.securityAlerts,
        weeklySummary: req.body.weeklySummary,
      },
    });

    logger.info("Update user preferences query was successful");
    return res
      .status(HTTP_STATUS.OK)
      .json(
        new SuccessResponse(
          HTTP_STATUS.OK,
          "Update user preferences query was successful",
          "Update user preferences query was successful"
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
          "Update user preferences query internal server error",
          error
        )
      );
  }
};

export const updateUser2FAController: RequestHandler = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        user_id: Number(req.params.userId),
      },
    });

    if (!user) {
      logger.error("User not found");
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(
          new ErrorResponse(
            HTTP_STATUS.NOT_FOUND,
            "User not found",
            "Update user 2FA query was failed"
          )
        );
    }

    await prisma.user.update({
      where: {
        user_id: Number(req.params.userId),
      },
      data: {
        twoFactorAuth: req.body.twoFactorAuth,
      },
    });

    logger.info("Update user 2FA query was successful");
    return res
      .status(HTTP_STATUS.OK)
      .json(
        new SuccessResponse(
          HTTP_STATUS.OK,
          "Update user 2FA query was successful",
          "Update user 2FA query was successful"
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
          "Update user 2FA query internal server error",
          error
        )
      );
  }
};

export const updateUserProfileController: RequestHandler = async (req, res) => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        user_id: Number(req.params.userId),
      },
    });

    if (!user) {
      logger.error("User not found");
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(
          new ErrorResponse(
            HTTP_STATUS.NOT_FOUND,
            "User not found",
            "Update user profile query was failed"
          )
        );
    }

    await prisma.user.update({
      where: {
        user_id: Number(req.params.userId),
      },
      data: {
        image: req.body.image,
        timeZone: req.body.timeZone,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        biography: req.body.biography,
      },
    });

    logger.info("Update user profile query was successful");
    return res
      .status(HTTP_STATUS.OK)
      .json(
        new SuccessResponse(
          HTTP_STATUS.OK,
          "Update user profile query was successful",
          "Update user profile query was successful"
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
          "Update user profile query internal server error",
          error
        )
      );
  }
};

export const resetPasswordController: RequestHandler = async (req, res) => {
  const { email, currentPassword, newPassword } = req.body;
  const userId = req.params.userId;

  try {
    const user = await prisma.user.findFirst({
      where: {
        keycloak_id: userId,
      },
    });

    if (!user) {
      logger.error("User not found");
      return res
        .status(HTTP_STATUS.NOT_FOUND)
        .json(
          new ErrorResponse(
            HTTP_STATUS.NOT_FOUND,
            "User not found",
            "Reset password query was failed"
          )
        );
    }

    const loginData = await loginKeycloakUser(email, currentPassword);

    if (!loginData) {
      return res
        .status(HTTP_STATUS.BAD_REQUEST)
        .json(
          new ErrorResponse(
            HTTP_STATUS.BAD_REQUEST,
            "Current password is wrong",
            "Reset password query was failed"
          )
        );
    }

    const token = await getKeycloakToken();

    if (!token) throw new Error("Missing admin token");

    const status = await resetKeycloakUserPassword(userId, token, newPassword);

    console.log(status);

    logger.info("Reset password query was successful");
    return res
      .status(HTTP_STATUS.OK)
      .json(
        new SuccessResponse(
          HTTP_STATUS.OK,
          "Reset password query was successful",
          "Reset password query was successful"
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
          "Reset password query internal server error",
          error
        )
      );
  }
};
