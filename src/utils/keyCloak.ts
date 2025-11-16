import axios from "axios";
import logger from "./logger";
import { envConfig } from "../config/envConfig";
import qs from "qs";
import {
  UserKeycloakPayload,
  UserKeycloakRequest,
} from "../types/interfaces/User";
import jwt from "jsonwebtoken";
import jwksClient from "jwks-rsa";

const baseURL = envConfig.KEYCLOACK_SERVER_URL;

export const getKeycloakToken = async () => {
  const data = qs.stringify({
    client_id: envConfig.KEYCLOACK_CLIENT_ID,
    client_secret: envConfig.KEYCLOACK_CLIENT_SECRET,
    grant_type: "client_credentials",
  });
  try {
    const res = await axios.post(
      `${baseURL}/realms/url-shortner/protocol/openid-connect/token`,
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
};

export const createKeycloakUser = async (
  userData: UserKeycloakRequest,
  token: string
) => {
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
    const res = await axios.post(
      `${baseURL}/admin/realms/url-shortner/users`,
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
};

export const getSingleKeycloakUser = async (email: string, token: string) => {
  try {
    const res = await axios.get(
      `${baseURL}/admin/realms/url-shortner/users?email=${email}`,
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
};

export const loginKeycloakUser = async (email: string, password: string) => {
  if (!envConfig.KEYCLOACK_CLIENT_ID) {
    throw new Error("Missing KEYCLOACK_CLIENT_ID in environment configuration");
  }
  if (!envConfig.KEYCLOACK_CLIENT_SECRET) {
    throw new Error(
      "Missing KEYCLOACK_CLIENT_SECRET in environment configuration"
    );
  }
  const params = new URLSearchParams();
  params.append("client_id", envConfig.KEYCLOACK_CLIENT_ID);
  params.append("client_secret", envConfig.KEYCLOACK_CLIENT_SECRET);
  params.append("grant_type", "password");
  params.append("username", email);
  params.append("password", password);

  try {
    const res = await axios.post(
      `${baseURL}/realms/url-shortner/protocol/openid-connect/token`,
      params,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    return res.data;
  } catch (error) {
    logger.error(error);
    console.log(error);
  }
};

export const revokeRefreshToken = async (token: string) => {
  try {
    // Revoke refresh token in Keycloak for security
    if (token) {
      const res = await axios.post(
        `${baseURL}/realms/url-shortner/protocol/openid-connect/revoke`,
        new URLSearchParams({
          client_id: envConfig.KEYCLOACK_CLIENT_ID!,
          client_secret: envConfig.KEYCLOACK_CLIENT_SECRET!,
          token: token,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return res.status;
    }
  } catch (error) {
    logger.error(error);
    console.log(error);
  }
};

// Helper: Verify token with Keycloak public key
export const verifyToken = async (token: string) => {
  const client = jwksClient({
    jwksUri: `${baseURL}/realms/url-shortner/protocol/openid-connect/certs`,
  });

  const decoded = jwt.decode(token, { complete: true });

  if (!decoded || !decoded.header?.kid) {
    throw new Error("Invalid token");
  }

  const key = await client.getSigningKey(decoded.header.kid);
  const signingKey = key.getPublicKey();

  return jwt.verify(token, signingKey, {
    issuer: `${baseURL}/realms/url-shortner`,
    audience: "account", // optional but recommended
  });
};

export const deleteKeycloakUser = async (userId: string, token: string) => {
  try {
    const response = await axios.delete(
      `${baseURL}/admin/realms/url-shortner/users/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    return response.status;
  } catch (error) {
    logger.error(error);
    console.log(error);
  }
};

export const resetKeycloakUserPassword = async (
  userId: string,
  token: string,
  newPassword: string
) => {
  try {
    const response = await axios.put(
      `${baseURL}/admin/realms/url-shortner/users/${userId}/reset-password`,
      {
        type: "password",
        temporary: false,
        value: newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(response.data);
    console.log(response.status);
    return response.status;
  } catch (error) {
    logger.error(error);
    console.log(error);
  }
};
