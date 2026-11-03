import React from "react";
import { useMsal, useIsAuthenticated } from "@azure/msal-react";

const PRISM_APP_URL = import.meta.env.VITE_PRISM_APP_URL;

export default function App() {
  const { instance, accounts } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const account = accounts[0];

  const signIn = () => instance.loginRedirect({
    scopes: ["openid", "profile", "email"],
  });

  const signOut = () => instance.logoutRedirect({ account });

  const openPrism = () => {
    if (!PRISM_APP_URL || PRISM_APP_URL.includes("YOUR_DEPLOYED")) {
      alert("Set VITE_PRISM_APP_URL in parent-app/.env and restart Vite.");
      return;
    }
    window.open(PRISM_APP_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <main className="page">
      <section className="card">
        <div className="eyebrow">Microsoft Entra ID SSO</div>
        <h1>Parent Portal</h1>
        {!isAuthenticated ? (
          <>
            <p>You are not signed in to the parent portal.</p>
            <button onClick={signIn}>Sign in with Microsoft</button>
          </>
        ) : (
          <>
            <p className="success">Parent portal SSO authenticated</p>
            <p>Signed in as: <strong>{account?.username}</strong></p>
            <div className="actions">
              <button onClick={openPrism}>Prism App</button>
              <button className="secondary" onClick={signOut}>Sign out</button>
            </div>
            <p className="hint">
              Prism opens in a new tab and uses Databricks workspace SSO.
              The parent MSAL token is not passed to Databricks.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
