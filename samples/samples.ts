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

class DelegatedApp {
    accessToken: string = "";
    refreshToken: string = "";

    constructor(private readonly clientId: string, private readonly clientSecret: string, private readonly organizationId: string) {}

    // Helper function to generate the x booker api url
    getXBookerApiUrl(path: string): string {
        const base = "https://x-booker.app/delegated/v1";
        return base + path;
    }

    // Helper function to generate the auth api url
    getXBookerAuthApiUrl(path: string): string {
        const base = "https://x-booker.app/auth/v1";
        return base + path;
    }

    async getRefreshToken() {
        const headers = {
            "organization-id": this.organizationId,
            "client-id": this.clientId,
            "client-secret": this.clientSecret,
        };
        const response = await axios.get(this.getXBookerAuthApiUrl("/tokens/refresh"), { headers });
        if (response.data.success) {
            this.refreshToken = response.data.data.refreshToken;
        } else {
            throw new Error(response.data.message);
        }
    }

    async getAccessToken() {
        if (this.refreshToken === "") {
            throw new Error("Please call getRefreshToken method first");
        }
        const headers = {
            "organization-id": this.organizationId,
            "client-id": this.clientId,
            "Authorization": "Bearer " + this.refreshToken, // Sending the refresh token as Bearer token.
        };
        const response = await axios.get(this.getXBookerAuthApiUrl("/tokens/access"), { headers });
        if (response.data.success) {
            this.accessToken = response.data.data.accessToken;
        } else {
            throw new Error(response.data.message);
        }
    }

    async makeRequest<B = any, R = any>(path: string, method: string, body: B): Promise<R> {
        const headers = {
            Authorization: "Bearer " + this.accessToken, // Sending the access token as Bearer token.
        };
        const payload = body === undefined ? "" : JSON.stringify(body);
        const response = await axios(this.getXBookerApiUrl(path), {
            method: method,
            headers,
            body: payload,
        });
        if (response.data.success) {
            return response.data.data as R;
        } else {
            throw new Error(response.data.message);
        }
    }
}

const delegatedApp = new DelegatedApp(clientId, clientSecret, organizationId);
(async () => {
    try {
        await delegatedApp.getRefreshToken();
        await delegatedApp.getAccessToken();
        const resp = await delegatedApp.makeRequest<undefined, { data: unknown }>("/organization", "GET", undefined);
        console.log(resp.data);
    } catch (err) {
        console.error(err);
    }
})();
