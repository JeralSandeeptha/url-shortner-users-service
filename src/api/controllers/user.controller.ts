import logger from "../../utils/logger";
import SuccessResponse from "../../utils/SuccessResponse";
import ErrorResponse from "../../utils/ErrorResponse";
import HTTP_STATUS from "../../types/enums/HttpStatus";
import { RequestHandler } from "express";
import { createKeycloakUser, getKeycloakToken } from "../../utils/keyCloak";
import { UserKeycloakRequest, UserRequest } from "../../types/interfaces/User";

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
            return res.status(HTTP_STATUS.CREATED).json(
                new SuccessResponse(
                    HTTP_STATUS.CREATED,
                    "User register query was successful",
                    "User register query was successful",
                )
            );
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