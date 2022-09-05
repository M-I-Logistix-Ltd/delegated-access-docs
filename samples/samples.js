/**
 * This examples uses axios but feel free to use javascript fetch or other methods.
 *
 * Use the following command to install the required packages
 * `yarn add axios dotenv` or `npm i axios dotenv --save`
 */

const axios = require("axios");
const dotenv = require("dotenv");

dotenv.config();

const clientId = process.env.CLIENT_ID;
const organizationId = process.env.ORGANIZATION_ID;
const clientSecret = process.env.CLIENT_SECRET;

// Helper function to generate the x booker api url
function getXBookerApiUrl(path) {
    const base = "https://x-booker.app/delegated/v1";
    return base + path;
}

// Helper function to generate the auth api url
function getXBookerAuthApiUrl(path) {
    const base = "https://x-booker.app/auth/v1";
    return base + path;
}

async function getRefreshToken() {
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

async function getAccessToken(refreshToken) {
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

async function getOrganizationInfo(accessToken) {
    const url = getXBookerApiUrl("/organization");
    const headers = {
        Authorization: "Bearer " + accessToken, // Sending the access token as Bearer token.
    };
    const response = await axios.get(url, { headers });
    if (response.data.success) {
        return response.data.data;
    } else {
        throw new Error(response.data.message);
    }
}

(async function main() {
    try {
        const refreshToken = await getRefreshToken();
        const accessToken = await getAccessToken(refreshToken);
        const organization = await getOrganizationInfo(accessToken);
        console.log(organization);
    } catch (err) {
        console.error(err);
    }
})();
