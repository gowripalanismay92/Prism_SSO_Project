# Parent React + Microsoft Entra SSO → Databricks App identity sample

This sample demonstrates:
1. Parent React portal signs in with Microsoft Entra ID using MSAL.
2. After sign-in, clicking **Prism App** opens a Databricks App in a new tab.
3. Databricks Apps authenticates the user through the workspace's configured IdP/SSO.
4. The Databricks FastAPI app reads `X-Forwarded-*` identity headers and displays username/email.

## Important
- Parent MSAL login does NOT pass the MSAL token to Databricks. Databricks authenticates the browser separately through its configured workspace SSO. If the browser already has an Entra/Databricks session, the login may be silent; otherwise a redirect/login can occur.
- The Databricks app must be deployed inside Databricks Apps for forwarded identity headers to exist.
- `X-Forwarded-*` headers are trusted only when requests arrive through the Databricks Apps proxy. Do not expose this backend elsewhere and trust arbitrary client-supplied headers.
- This sample uses an independent React parent login demo. If your real parent app already has MSAL, you should reuse its existing provider/session and copy only the Prism button logic instead of adding another login.
- Configure workspace SSO, app permissions, user provisioning, and app access with your Databricks administrator.

## Project layout
- `parent-app/`: Vite React app with MSAL login and Prism launcher.
- `databricks-app/`: FastAPI custom Databricks App that displays forwarded identity headers.

# A. Parent app setup

## Prerequisites
- Node.js LTS and npm
- Microsoft Entra tenant access to register a SPA
- Deployed Databricks App URL (for `VITE_PRISM_APP_URL`)

## 1. Register Parent SPA in Entra (only if this demo app needs its own registration)
1. Open https://entra.microsoft.com → Identity → Applications → App registrations → New registration.
2. Name: `Prism Parent Portal Demo`.
3. Choose accounts in your organization (single tenant), unless your organization needs another account type.
4. Under Redirect URI choose **Single-page application (SPA)** and enter `http://localhost:5173`.
5. Register and copy **Application (client) ID** and **Directory (tenant) ID**.
6. If you already have a real parent app registration, use its existing client ID/tenant and its exact redirect URI instead. Do not create a second app registration unnecessarily.

## 2. Configure parent app
1. Copy `parent-app/.env.example` to `parent-app/.env`.
2. Set:
   - `VITE_ENTRA_CLIENT_ID` to the SPA client ID
   - `VITE_ENTRA_TENANT_ID` to the tenant ID
   - `VITE_PRISM_APP_URL` to the deployed Databricks App URL
3. Do not put client secrets or access tokens in this file. A SPA uses a client ID, not a client secret.

## 3. Run locally
```bash
cd parent-app
npm install
npm run dev
```
Open the Vite URL printed in terminal (normally `http://localhost:5173`).
Click **Sign in with Microsoft**. After login, the page shows your account.
Click **Prism App** to open Databricks in another tab.

# B. Databricks App deployment

## Prerequisites
- Databricks workspace with Databricks Apps enabled
- Permission to create/deploy apps
- Users provisioned in the Databricks account/workspace and app access granted
- Workspace SSO configured with your organization's Entra IdP (or compatible federation)

## 1. Create the app
1. In the Databricks workspace, open **Apps** (sometimes under Compute → Apps or workspace navigation).
2. Click **Create app** / **Create custom app**.
3. Name it `prism-identity-demo` (or another valid unique name).
4. Create the app resource.

## 2. Upload source files
1. Open **Workspace** and create a folder under your user folder, e.g. `/Workspace/Users/<your-email>/prism-identity-demo`.
2. Upload the contents of `databricks-app/` into that folder:
   - `app.py`
   - `requirements.txt`
   - `app.yaml`
3. Ensure these files are at the root of the selected source folder (not inside an extra nested directory).

## 3. Deploy
1. Return to Apps → your app → Deploy.
2. Select the Workspace source folder containing `app.py`, `requirements.txt`, and `app.yaml`.
3. Deploy and wait for status `RUNNING`.
4. Open the app URL and verify the user identity is displayed.
5. Grant intended users/groups `CAN_USE` permission (Share → select user/group → CAN_USE).

## 4. Configure Databricks SSO
1. Confirm the Databricks workspace is configured to use your organization's Entra ID identity provider.
2. Confirm the parent portal and Databricks use the same tenant or compatible federation.
3. Confirm users are provisioned in Databricks and have workspace/app access.
4. Open the Databricks app directly in a browser first. Validate identity.
5. Set the exact deployed app URL in `parent-app/.env` as `VITE_PRISM_APP_URL`.
6. Test from the parent app.

## Expected
- Parent portal MSAL session is authenticated.
- Clicking Prism opens the Databricks URL in a new tab.
- Databricks may silently reuse the Entra browser session; it may still redirect to login if the session is missing/expired or app consent is needed.
- Databricks app displays the identity values forwarded by the Databricks Apps proxy.

## Troubleshooting
- **Parent app keeps prompting login:** check client ID, tenant ID, SPA redirect URI, and browser console.
- **Prism URL opens but login prompts:** verify Databricks workspace SSO, Entra browser session, provisioning, and app CAN_USE permission. Parent MSAL token is not transferred.
- **Identity fields blank:** make sure you're viewing the deployed app inside Databricks Apps (not local FastAPI), and inspect app logs/request headers. Databricks docs list `X-Forwarded-Preferred-Username`, `X-Forwarded-Email`, and `X-Forwarded-User`.
- **CORS:** this demo opens the Databricks app directly; it does not make a cross-domain fetch from the parent portal. This avoids needing browser cross-origin cookies for the demo.
- **Security:** never put tokens in URL parameters, don't log `X-Forwarded-Access-Token`, and don't accept user identity from query params/localStorage.
