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
      grant_type: "client_credentials",
    });
    try {
        const res = await axios.post(`${baseURL}/realms/url-shortner/protocol/openid-connect/token`, 
            data,
            {
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
            }
        );
        console.log(res.data);
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

export const getSingleKeycloakUser = async (email: string, token: string) => {
    try {
        const res = await axios.get(`${baseURL}/admin/realms/url-shortner/users?email=${email}`,
            {
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            }
        );
        return res.data;
    } catch (error) {
        logger.error(error);
        console.log(error);
    }
}

export const loginKeycloakUser = async (email: string, password: string) => {

    if (!envConfig.KEYCLOACK_CLIENT_ID) {
        throw new Error("Missing KEYCLOACK_CLIENT_ID in environment configuration");
    }
    if (!envConfig.KEYCLOACK_CLIENT_SECRET) {
        throw new Error("Missing KEYCLOACK_CLIENT_SECRET in environment configuration");
    }
    const params = new URLSearchParams();
    params.append("client_id", envConfig.KEYCLOACK_CLIENT_ID);
    params.append("client_secret", envConfig.KEYCLOACK_CLIENT_SECRET);
    params.append("grant_type", "password");
    params.append("username", email);
    params.append("password", password);

    try {
        const res = await axios.post(`${baseURL}/realms/url-shortner/protocol/openid-connect/token`,
            params,
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );
        return res.data;
    } catch (error) {
        logger.error(error);
        console.log(error);
    }
}