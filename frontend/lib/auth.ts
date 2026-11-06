/**
 * Keycloak OIDC Authentication with PKCE (Proof Key for Code Exchange)
 * and in-memory access token storage for high security.
 */

export interface StudentInfo {
  name: string;
  reg_number: string;
}

export interface AuthSession {
  accessToken: string | null;
  userId: string | null;
  student: StudentInfo | null;
  expiresAt: number | null;
}

// In-memory token storage (NEVER stored in localStorage or persistent cookies)
let inMemorySession: AuthSession = {
  accessToken: null,
  userId: null,
  student: null,
  expiresAt: null,
};

// Event listeners for token state changes
type AuthListener = (session: AuthSession) => void;
const listeners = new Set<AuthListener>();

export function subscribeAuth(listener: AuthListener): () => void {
  listeners.add(listener);
  listener(inMemorySession);
  return () => {
    listeners.delete(listener);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn(inMemorySession));
}

export function setAuthSession(token: string, userId: string, student: StudentInfo, expiresIn: number = 300) {
  inMemorySession = {
    accessToken: token,
    userId,
    student,
    expiresAt: Date.now() + expiresIn * 1000,
  };
  // Also store basic non-sensitive student profile in sessionStorage for seamless page refreshes in demo/dev
  if (typeof window !== "undefined") {
    try {
      sessionStorage.setItem("cu_user_id", userId);
      sessionStorage.setItem("cu_student", JSON.stringify(student));
    } catch {}
  }
  notifyListeners();
}

export function getAuthSession(): AuthSession {
  // If in-memory session is empty, check if we have a cached user id from current browser session
  if (!inMemorySession.userId && typeof window !== "undefined") {
    try {
      const storedUserId = sessionStorage.getItem("cu_user_id");
      const storedStudent = sessionStorage.getItem("cu_student");
      if (storedUserId && storedStudent) {
        inMemorySession.userId = storedUserId;
        inMemorySession.student = JSON.parse(storedStudent);
      }
    } catch {}
  }
  return inMemorySession;
}

export function clearAuthSession() {
  inMemorySession = {
    accessToken: null,
    userId: null,
    student: null,
    expiresAt: null,
  };
  if (typeof window !== "undefined") {
    try {
      sessionStorage.removeItem("cu_user_id");
      sessionStorage.removeItem("cu_student");
      sessionStorage.removeItem("pkce_code_verifier");
    } catch {}
  }
  notifyListeners();
}

/**
 * Base64URL encode buffer without padding
 */
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Generates a high-entropy cryptographic PKCE code_verifier string (43 to 128 characters)
 */
export function generateCodeVerifier(length = 64): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);
  return Array.from(values)
    .map((x) => possible[x % possible.length])
    .join("");
}

/**
 * Generates the SHA-256 S256 code_challenge from code_verifier
 */
export async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(digest);
}

/**
 * Initiates the PKCE Keycloak authorization flow
 */
export async function initiateKeycloakLogin(isDemo = false): Promise<void> {
  if (typeof window === "undefined") return;

  if (isDemo) {
    // Immediate demo route for quick testing
    window.location.href = `/callback?code=demo_code_preview&state=demo`;
    return;
  }

  const verifier = generateCodeVerifier();
  const challenge = await generateCodeChallenge(verifier);

  // Store verifier temporarily in sessionStorage for callback exchange
  sessionStorage.setItem("pkce_code_verifier", verifier);

  const keycloakAuthUrl =
    process.env.NEXT_PUBLIC_KEYCLOAK_URL ||
    "https://studentespro.christuniversity.in/auth/realms/Student/protocol/openid-connect/auth";
  const clientId = process.env.NEXT_PUBLIC_CLIENT_ID || "react-app";
  const redirectUri = process.env.NEXT_PUBLIC_REDIRECT_URI || `${window.location.origin}/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid profile email",
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  window.location.href = `${keycloakAuthUrl}?${params.toString()}`;
}

