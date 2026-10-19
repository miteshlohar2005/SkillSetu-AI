import axios from "axios";

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID;

export const isGoogleAuthAvailable = () => {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_ID.trim().length > 0 && GOOGLE_CLIENT_ID !== "undefined");
};

const loadGoogleScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window !== "undefined" && window.google?.accounts?.oauth2) {
      return resolve(window.google);
    }

    const existingScript = document.getElementById("google-gsi-script");
    if (existingScript) {
      existingScript.onload = () => resolve(window.google);
      return;
    }

    const script = document.createElement("script");
    script.id = "google-gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        resolve(window.google);
      } else {
        reject(new Error("Google Identity SDK failed to initialize."));
      }
    };
    script.onerror = (err) => reject(err);
    document.body.appendChild(script);
  });
};

export const signInWithGooglePopup = async () => {
  if (!isGoogleAuthAvailable()) {
    throw new Error(
      "Google Sign-In is not configured. Please set VITE_GOOGLE_CLIENT_ID in your client/.env file."
    );
  }

  try {
    const google = await loadGoogleScript();

    return new Promise((resolve, reject) => {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: "email profile openid",
        prompt: "select_account",
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            return reject(new Error(tokenResponse.error_description || tokenResponse.error));
          }

          try {
            const userInfoRes = await axios.get(
              "https://www.googleapis.com/oauth2/v3/userinfo",
              {
                headers: {
                  Authorization: `Bearer ${tokenResponse.access_token}`,
                },
              }
            );

            const profile = userInfoRes.data;

            resolve({
              name: profile.name || `${profile.given_name || ""} ${profile.family_name || ""}`.trim() || "Statistical Officer",
              email: profile.email,
              image: profile.picture || "",
              emailVerified: profile.email_verified,
              accessToken: tokenResponse.access_token,
            });
          } catch (err) {
            console.error("[GOOGLE USERINFO ERROR]", err);
            reject(new Error("Failed to retrieve Google user profile."));
          }
        },
        error_callback: (error) => {
          console.error("[GSI TOKEN CLIENT ERROR]", error);
          if (error.type === "popup_closed") {
            reject(new Error("Google sign-in popup was closed."));
          } else {
            reject(new Error(error.message || "Google authentication failed."));
          }
        },
      });

      client.requestAccessToken();
    });
  } catch (error) {
    console.error("[GOOGLE OAUTH ERROR]", error);
    throw error;
  }
};
