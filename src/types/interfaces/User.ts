export interface User {
    user_id: number;
    username: string;
    email: string;
    firstName: string;
    lastName: string;
    address: string;
    enabled: boolean;
    aggreed: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface UserRequest {
    password: string;
    email: string;
}

export interface UserKeycloakRequest {
    email: string;
    password: string;
    enabled: boolean;
}

export interface UserKeycloakPayload {
    username: string;
    email: string;
    enabled: boolean;
    credentials: any[];
}