# Delegated Access

Delegated access lets an application to perform tasks on behalf of an X Booker organization.

# Overview

An organization admin will create an delegated app from the organization's profile page. Then any applications (server/web/mobile) can use the generated credentials to access the organization and perform certain tasks (update organization's details, add remove members, and more). The admin can limit the delegated app's access rights (permissions) when creating a delegated app.

# Workflow

In order to connect an external application with the X Booker one has to complete the following steps.

1. Create a delegated app
2. Use the credentials from the delegated app to get authorization token from the X Booker auth API.
3. Use the authorization token to send HTTP request to the X Booker API.

# Create a delegated app

-   Login to the X Booker admin panel and go to Organization page (/admin/organization).
-   Scroll to the bottom and find the "Delegated Access" section at the bottom.
-   Client the "New App +" button to create a new delegated app that
    -   A delegated app requires a name.
    -   An expire date or toggle the "Do not expire?" if don't want to set an expire date.
    -   Now select scopes from the scopes list (Note: You can modify these scopes event after creating an app, but make sure to select at least one scope).
    -   Click the create button to complete the creation process.

> A delegated app will show up on the page after a second or two.

-   Click on the eye button on the top-right corner of the delegated app to see app's credentials.
-   You will find three different fields
    -   **Organization**: This is `id` of your organization.
    -   **ID**: This is `client-id` of your delegated app.
    -   **Secret**: This is the `client-secret` of your delegated app. You should treat this as a password.

# Generate an authorization token

> We will be using Node.js and JavaScript in this example but you can find code samples from other languages in the ./samples directory

We authorization process is done in two steps

1. Getting a long lived `refresh token`.
2. Exchanging the refresh token for a new short lived `access token`.

## 1. Getting a refresh token

Send a HTTP GET request to the X Booker auth API with the `organization-id`, `client-id`, and `client-secret` header. You can find these credentials within your delegated app and by clicking on the eye button on the top-right corner of the delegated app card. You can use the refresh token as many times as you want. So, after you get a refresh token you don't have to use the `client-secret` until you want to get another refresh token.

> Note: Refresh tokens are unique to individual apps/browsers/ips.
> Suppose you have generated a refresh token from a backend application deployed somewhere on the internet.
> You can't use the same refresh token from another frontend or backend application,
> this time you will have to request and refresh token from each of the applications.

**X Booker auth API URL**: https://x-booker.app/auth/v1/tokens/refresh

```js
// This examples uses axios but feel free to use javascript fetch or other methods.
const axios = require("axios");

const url = "https://x-booker.app/auth/v1/tokens/refresh";

async function getRefreshToken() {
    try {
        const headers = {
            "organization-id": "YOUR_ORGANIZATION_ID",
            "client-id": "YOUR_CLIENT_ID",
            "client-secret": "YOUR_CLIENT_SECRET",
        };
        const response = await axios.get(url, { headers });
        if (response.data.success) {
            return response.data.data.refreshToken;
        }
        return null;
    } catch (err) {
        console.error(err);
        return null;
    }
}
```

### Errors

You will get any of these following errors if there's anything wrong.

-   Status `400` and message `Client not found, or invalid client id`, if you have provided a wrong `client-id`.
-   Status `400` and message `Invalid client secret`, if you have provided a wrong `client-secret`.
-   Status `500` if there is something wrong with the X Booker auth API.

### Success response

If everything went well the you will get back a response with the following fields,

**statusCode**: response status code.  
**success**: Whether the request was successful or not.  
**message**: Either success message or error message.  
**data**: It contains the data X Booker auth API sent to you.  
**data.refreshToken**: Your refresh token.

## 2. Get an access token

You have to exchange the refresh token with X Booker auth API to get an `accessToken` that you can use to access the X Booker API. Send a HTTP GET request to X Booker auth API with the `organization-id`, `client-id`, and the refresh token, the X Booker API will then verify the refresh token and send you a access token. An access token is valid for only 2 minutes, make sure to request another access token after 2 minutes.

**X Booker auth API URL**: https://x-booker.app/auth/v1/tokens/access

```js
const axios = require("axios");

const url = "https://x-booker.app/auth/v1/tokens/access";
const refreshToken = "REFRESH_TOKEN";

async function getAccessToken() {
    try {
        const headers = {
            "organization-id": "YOUR_ORGANIZATION_ID",
            "client-id": "YOUR_CLIENT_ID",
            "Authorization": "Bearer " + refreshToken, // Sending the refresh token as Bearer token.
        };
        const response = await axios.get(url, { headers });
        if (response.data.success) {
            return response.data.data.accessToken;
        }
        return null;
    } catch (err) {
        console.error(err);
        return null;
    }
}
```

### Errors

You will get any of these following errors if there's anything wrong.

-   Status `400` and message `Invalid refresh token`, if you have provided a wrong `refresh token` or a wrong `client-id`.
-   Status `400` and message `You are't permitted to use this access token`, if you are trying to use the access token from a different app/location/ip.
-   Status `400` and message `Your refresh token is expired, please issue another refresh token first.`, if you have set an expire date to your delegated app and the app is expired.
-   Status `500` if there is something wrong with the X Booker auth API.

### Success response

If everything went well the you will get back a response with the following fields,

**statusCode**: response status code.  
**success**: Whether the request was successful or not.  
**message**: Either success message or error message.  
**data**: It contains the data X Booker auth API sent to you.  
**data.accessToken**: Your access token.

# Sending requests to X Booker API

After getting authorization tokens you can now send authorized request to the X Booker API to perform certain tasks.

**X Booker API**: https://x-booker.app/delegated/v1

We are getting the organizations info in the following sample. You can find a list of tasks you do with the related API endpoint in ./endpoints.md

```js
const axios = require("axios");

const url = "https://x-booker.app/delegated/v1";
const accessToken = "YOUR_ACCESS_TOKEN";

async function getOrganizationInfo() {
    try {
        const headers = {
            Authorization: "Bearer " + accessToken, // Sending the access token as Bearer token.
        };
        const response = await axios.get(url, { headers });
        if (response.data.success) {
            return response.data.data.organization;
        }
        return null;
    } catch (err) {
        console.error(err);
        return null;
    }
}
```

### Errors

You will get any of these following errors if there's anything wrong.

-   Status `403` and message `Method not recognized`, if the HTTP method is not allowed on this endpoint.
-   Status `403` and message `Invalid request scope`, if the delegated app doesn't have permissions to perform this task.
-   Status `403` and message `Access token expired`, if the access token is expired.
-   Status `403` and message `No refresh tokens found please get a refresh token first`, if the access token is modified or if another refresh token is generated for the same application.
-   Status `403` and message `Delegated app not found, invalid client id`, if the delegated app is expired or removed.
-   Status `403` and message `Organization not found, invalid organization id`, if the organization id is wrong.
-   Status `500` if there is something wrong with the X Booker auth API.

### Success response

If everything went well the you will get back a response with the following fields,

**statusCode**: response status code.  
**success**: Whether the request was successful or not.  
**message**: Either success message or error message.  
**data**: It contains the organization's details. You can find more about organization profile's data types in ./data-types.md
