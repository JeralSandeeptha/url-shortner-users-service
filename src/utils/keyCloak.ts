import axios from "axios";
import logger from "./logger";
import { envConfig } from "../config/envConfig";
import qs from 'qs';
import { UserKeycloakPayload, UserKeycloakRequest } from "../types/interfaces/User";

const baseURL = envConfig.KEYCLOACK_SERVER_URL;

export const getKeycloakToken = async () => {
    const data = qs.stringify({
      client_id: envConfig.KEYCLOACK_CLIENT_ID,
      client_secret: envConfig.KEYCLOACK_CLIENT_SECRET,
      grant_type: envConfig.KEYCLOACK_GRANT_TYPE,
    });
    try {
        const res = await axios.post(`${baseURL}/realms/url-shortner/protocol/openid-connect/token`, 
            data,
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );
        return res.data.access_token;
    } catch (error) {
        logger.error(error);
        console.log(error);
    }
}

export const createKeycloakUser = async (userData: UserKeycloakRequest ,token: string) => {
    const payload: UserKeycloakPayload = {
        username: userData.email,
        email: userData.email,
        enabled: userData.enabled,
        credentials: [
            {
                type: "password",
                value: userData.password,
                temporary: false,
            },
        ],
    };
    try {
        const res = await axios.post(`${baseURL}/admin/realms/url-shortner/users`,
            payload,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return res.status;
    } catch (error) {
        logger.error(error);
        console.log(error);
    }
}