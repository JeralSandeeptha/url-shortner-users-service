import logger from "../../utils/logger";
import SuccessResponse from "../../utils/SuccessResponse";
import ErrorResponse from "../../utils/ErrorResponse";
import HTTP_STATUS from "../../types/enums/HttpStatus";
import { RequestHandler } from "express";
import { createKeycloakUser, getKeycloakToken, getSingleKycloakUser } from "../../utils/keyCloak";
import { UserKeycloakRequest, UserRequest } from "../../types/interfaces/User";
import prisma from "../../config/prisma";

export const registerUserController: RequestHandler = async (req, res) => {
    const { email, password }:UserRequest = req.body;
    try {
        const token = await getKeycloakToken();
        const userDetails:UserKeycloakRequest = {
            email: email,
            enabled: true,
            password: password,
        };
        const keycloakResponse = await createKeycloakUser(userDetails, token);
        if(keycloakResponse === 201) {

            // get keycloak user
            const userList = await getSingleKycloakUser(email, token);

            if(!userList[0]) {
                return res.status(HTTP_STATUS.NOT_FOUND).json(
                    new ErrorResponse(
                        HTTP_STATUS.NOT_FOUND,
                        "Keycloak user not found for given email query was failed",
                        "Keycloak user not found for given email query was failed",
                    )
                );
            } else {
                const savedUser = await prisma.user.create({
                    data: {
                        keycloak_id: userList[0].id,
                        username: email,
                        email: email,
                    }
                });
                return res.status(HTTP_STATUS.CREATED).json(
                    new SuccessResponse(
                        HTTP_STATUS.CREATED,
                        "User register query was successful",
                        savedUser,
                    )
                );
            }
        } else {
            res.status(HTTP_STATUS.BAD_REQUEST).json(
                new ErrorResponse(
                    HTTP_STATUS.BAD_REQUEST,
                    "User register query was failed",
                    "User register query was failed",
                )
            );
        }
    } catch (error) {
        logger.error(error);
        console.log(error);
        res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json(
            new ErrorResponse(
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                "User register query internal server error",
                error
            )
        );
    }
}