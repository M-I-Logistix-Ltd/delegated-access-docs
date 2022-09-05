/**
 * This examples uses axios but feel free to use javascript fetch or other methods.
 *
 * Use the following command to install the required packages
 * `yarn add axios dotenv` or `npm i axios dotenv --save`
 */

import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const clientId = process.env.CLIENT_ID as string;
const organizationId = process.env.ORGANIZATION_ID as string;
const clientSecret = process.env.CLIENT_SECRET as string;

// Helper function to generate the x booker api url
function getXBookerApiUrl(path: string): string {
    const base = "https://x-booker.app/delegated/v1";
    return base + path;
}

// Helper function to generate the auth api url
function getXBookerAuthApiUrl(path: string): string {
    const base = "https://x-booker.app/auth/v1";
    return base + path;
}

async function getRefreshToken(): Promise<string> {
    const url = getXBookerAuthApiUrl("/tokens/refresh");

    const headers = {
        "organization-id": organizationId,
        "client-id": clientId,
        "client-secret": clientSecret,
    };
    const response = await axios.get(url, { headers });
    if (response.data.success) {
        return response.data.data.refreshToken;
    } else {
        throw new Error(response.data.message);
    }
}

async function getAccessToken(refreshToken: string): Promise<string> {
    const url = getXBookerAuthApiUrl("/tokens/access");

    const headers = {
        "organization-id": organizationId,
        "client-id": clientId,
        "Authorization": "Bearer " + refreshToken, // Sending the refresh token as Bearer token.
    };
    const response = await axios.get(url, { headers });
    if (response.data.success) {
        return response.data.data.accessToken;
    } else {
        throw new Error(response.data.message);
    }
}

async function getOrganizationInfo(accessToken: string): Promise<Organization> {
    const url = getXBookerApiUrl("/organization");
    const headers = {
        Authorization: "Bearer " + accessToken, // Sending the access token as Bearer token.
    };
    const response = await axios.get(url, { headers });
    if (response.data.success) {
        return response.data.data.organization;
    } else {
        throw new Error(response.data.message);
    }
}

(async function main(): Promise<void> {
    try {
        const refreshToken = await getRefreshToken();
        const accessToken = await getAccessToken(refreshToken);
        const organization = await getOrganizationInfo(accessToken);
        console.log(organization);
    } catch (err) {
        console.error(err);
    }
})();
