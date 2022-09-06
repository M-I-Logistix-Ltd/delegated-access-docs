package lib

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"

	"github.com/joho/godotenv" // go get github.com/joho/godotenv
)

// Refresh token response struct.
type refreshTokenRes struct {
	StatusCode int               `json:"statusCode"`
	Message    string            `json:"message"`
	Data       map[string]string `json:"data"`
}

// Access token response struct.
type accessTokenRes struct {
	StatusCode int               `json:"statusCode"`
	Message    string            `json:"message"`
	Data       map[string]string `json:"data"`
}

// Delegated app struct with all the required fields.
type DelegatedApp struct {
	ClientID       string
	ClientSecret   string
	OrganizationID string
	RefreshToken   string
	AccessToken    string
}

// Request a refresh token from the x booker auth server.
func (d *DelegatedApp) GetRefreshToken() error {
	client := &http.Client{}
	req, err := http.NewRequest(http.MethodGet, getAuthURL("/tokens/refresh"), nil)
	if err != nil {
		return err
	}
	req.Header.Add("client-id", d.ClientID)
	req.Header.Add("client-secret", d.ClientSecret)
	req.Header.Add("organization-id", d.OrganizationID)
	res, err := client.Do(req)
	if err != nil {
		return err
	}

	data := refreshTokenRes{}
	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&data)
	return err
}

// Exchange the refresh token for a access token
func (d *DelegatedApp) GetAccessToken() error {
	client := &http.Client{}
	req, err := http.NewRequest(http.MethodGet, getAuthURL("/tokens/access"), nil)
	if err != nil {
		return err
	}
	req.Header.Add("client-id", d.ClientID)
	req.Header.Add("organization-id", d.OrganizationID)
	req.Header.Add("Authorization", "Bearer "+d.RefreshToken)
	res, err := client.Do(req)
	if err != nil {
		return err
	}

	data := accessTokenRes{}
	decoder := json.NewDecoder(res.Body)
	err = decoder.Decode(&data)
	return err
}

// Make a HTTP request to the x booker api.
// Note: This function doesn't handle the error responses
func (d *DelegatedApp) MakeRequest(method string, url string, body io.Reader) (*http.Response, error) {
	client := &http.Client{}
	req, _ := http.NewRequest(method, url, body)
	req.Header.Add("client-id", d.ClientID)
	req.Header.Add("organization-id", d.OrganizationID)
	req.Header.Add("Authorization", "Bearer "+d.AccessToken)
	return client.Do(req)
}

// Helper function to generate auth urls
func getAuthURL(path string) string {
	return "http://localhost:8000/auth/v1" + path
}

// Helper function to generate x booker api urls
func getApiURL(path string) string {
	return "http://localhost:8000/delegated/v1" + path
}

func main() {
	godotenv.Load()

	// Create a delegated app with client id, client secret, and organization id.
	delegatedApp := DelegatedApp{
		ClientID:       os.Getenv("CLIENT_ID"),
		ClientSecret:   os.Getenv("CLIENT_SECRET"),
		OrganizationID: os.Getenv("ORGANIZATION_ID"),
	}
	// Request for a refresh token.
	// If the request was successful then the delegatedApp will have a refresh token within it,
	// which will be used to fetch the access token.
	err := delegatedApp.GetRefreshToken()
	if err != nil {
		log.Fatalln(err)
	}
	// Exchange the refresh token for access token.
	err = delegatedApp.GetAccessToken()
	if err != nil {
		log.Fatalln(err)
	}
	// Make a HTTP request to the x booker api
	res, err := delegatedApp.MakeRequest(http.MethodGet, getApiURL("/organization"), nil)
	if err != nil {
		log.Fatalln(err)
	}
	defer res.Body.Close()
	b, _ := io.ReadAll(res.Body)
	var data interface{}
	json.Unmarshal(b, &data)
	fmt.Println(data)
}
