# Install required packages
# pip install python-dotenv

from http.client import HTTPException
import os

from dotenv import load_dotenv
from requests import request


load_dotenv()

CLIENT_ID = os.getenv("CLIENT_ID")
CLIENT_SECRET = os.getenv("CLIENT_SECRET")
ORGANIZATION_ID = os.getenv("ORGANIZATION_ID")

# Helper functions
def get_api_url(path: str) -> str:
    base = "https://x-booker.app/delegated/v1"
    return base + path


def get_auth_url(path: str) -> str:
    base = "https://x-booker.app/auth/v1"
    return base + path


def get_refresh_token() -> str:
    try:
        res = request(
            method="GET",
            url=get_auth_url("/tokens/refresh"),
            headers={
                "client-id": CLIENT_ID,
                "client-secret": CLIENT_SECRET,
                "organization-id": ORGANIZATION_ID,
            },
        )
        data = res.json()
        if data.success and data.data:
            return data.data
        else:
            raise HTTPException(message=data.message)
    except HTTPException as err:
        raise err


def get_access_token(refresh_token) -> str:
    try:
        res = request(
            method="GET",
            url=get_auth_url("/tokens/access"),
            headers={
                "client-id": CLIENT_ID,
                "organization-id": ORGANIZATION_ID,
                "authorization": "Bearer " + refresh_token,
            },
        )
        data = res.json()
        if data.success and data.data:
            return data.data
        else:
            raise HTTPException(message=data.message)
    except HTTPException as err:
        raise err


def main():
    try:
        refresh_token = get_refresh_token()
        access_token = get_access_token(refresh_token)
        res = request(
            method="GET",
            url=get_api_url("/organization"),
            headers={
                "client-id": CLIENT_ID,
                "organization-id": ORGANIZATION_ID,
                "authorization": "Bearer " + access_token,
            },
        )
        data = res.json()
        if data.success and data.data:
            print("Organization found", data)
        else:
            raise HTTPException(message=data.message)
    except HTTPException as err:
        print(err)


if __name__ == "__main__":
    main()
