import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";

import {
  GoogleSignin,
  isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { auth } from "../config/firebase";

// ============================================================
// CONFIG
// ============================================================

const API_URL = "https://raritone-fullstack.onrender.com/api";

const GOOGLE_WEB_CLIENT_ID =
  "8520433775-bfc9slbl382o6gqja53bb4lmfc2n5jbs.apps.googleusercontent.com";

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

// ============================================================
// TYPES
// ============================================================

export type BackendUser = {
  id?: string;
  _id?: string;

  firebaseUid: string;

  name: string;

  email?: string;

  phone?: string;

  role: "user" | "admin" | "vendor";

  profileImage?: string;

  provider: "password" | "google" | "phone";

  isActive: boolean;

  createdAt?: string;

  updatedAt?: string;
};

type BackendResponse = {
  message?: string;
  user?: BackendUser;
};

// ============================================================
// FIREBASE TOKEN
// ============================================================

async function getFirebaseIdToken(): Promise<string> {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    throw new Error("No Firebase user is currently signed in.");
  }

  return firebaseUser.getIdToken();
}

// ============================================================
// EXISTING USER LOGIN SYNC
// ============================================================

export async function syncUserWithBackend(): Promise<BackendUser> {
  const idToken = await getFirebaseIdToken();

  const response = await fetch(`${API_URL}/auth/sync`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${idToken}`,

      Accept: "application/json",

      "Content-Type": "application/json",
    },
  });

  let data: BackendResponse;

  try {
    data = (await response.json()) as BackendResponse;
  } catch {
    throw new Error(
      `Backend returned an invalid response (${response.status}).`,
    );
  }

  console.log("[Backend Sync]", {
    status: response.status,
    data,
  });

  if (!response.ok) {
    throw new Error(
      data?.message || "Failed to synchronize user with backend.",
    );
  }

  if (!data.user) {
    throw new Error("Backend sync response does not contain a user.");
  }

  return data.user;
}

// ============================================================
// NEW USER REGISTRATION
// ============================================================

async function registerFirebaseUserWithBackend(): Promise<BackendUser> {
  const idToken = await getFirebaseIdToken();

  console.log("[Backend Registration] Calling /auth/register-firebase");

  const response = await fetch(`${API_URL}/auth/register-firebase`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${idToken}`,

      Accept: "application/json",

      "Content-Type": "application/json",
    },
  });

  let data: BackendResponse;

  try {
    data = (await response.json()) as BackendResponse;
  } catch {
    throw new Error(
      `Backend returned an invalid response (${response.status}).`,
    );
  }

  console.log("[Backend Registration]", {
    status: response.status,
    data,
  });

  if (!response.ok) {
    throw new Error(data?.message || "Failed to register user with backend.");
  }

  if (!data.user) {
    throw new Error("Backend registration response does not contain a user.");
  }

  return data.user;
}

// ============================================================
// EMAIL SIGNUP
// ============================================================

export async function signupWithEmail(
  name: string,
  email: string,
  password: string,
) {
  const cleanName = name.trim();

  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) {
    throw new Error("Name is required.");
  }

  if (!cleanEmail) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  try {
    const credential = await createUserWithEmailAndPassword(
      auth,
      cleanEmail,
      password,
    );

    await updateProfile(credential.user, {
      displayName: cleanName,
    });

    const backendUser = await registerFirebaseUserWithBackend();

    return {
      firebaseUser: credential.user,

      backendUser,
    };
  } catch (error) {
    console.error("[Email Signup] Error:", error);

    throw error;
  }
}

// ============================================================
// EMAIL LOGIN
// ============================================================

export async function loginWithEmail(email: string, password: string) {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("Email is required.");
  }

  if (!password) {
    throw new Error("Password is required.");
  }

  const credential = await signInWithEmailAndPassword(
    auth,
    cleanEmail,
    password,
  );

  const backendUser = await syncUserWithBackend();

  return {
    firebaseUser: credential.user,

    backendUser,
  };
}

// ============================================================
// GOOGLE FIREBASE USER
// ============================================================

async function getGoogleFirebaseUser(): Promise<User> {
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  console.log("[Google] Starting sign in");

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error("Google sign-in was cancelled.");
  }

  const { idToken } = response.data;

  if (!idToken) {
    throw new Error("Google Sign-In did not return an ID token.");
  }

  console.log("[Google] ID token received");

  const googleCredential = GoogleAuthProvider.credential(idToken);

  const firebaseCredential = await signInWithCredential(auth, googleCredential);

  console.log("[Google] Firebase sign-in successful");

  console.log("[Google] Firebase UID:", firebaseCredential.user.uid);

  return firebaseCredential.user;
}

// ============================================================
// GOOGLE LOGIN
// EXISTING ACCOUNT ONLY
// ============================================================

export async function loginWithGoogle() {
  try {
    const firebaseUser = await getGoogleFirebaseUser();

    const backendUser = await syncUserWithBackend();

    return {
      firebaseUser,
      backendUser,
    };
  } catch (error) {
    console.error("[Google Login] Error:", error);

    // Firebase succeeded but Mongo account does not exist.
    if (
      error instanceof Error &&
      error.message.toLowerCase().includes("user account not found")
    ) {
      try {
        await GoogleSignin.signOut();
      } catch {}

      try {
        await signOut(auth);
      } catch {}
    }

    throw error instanceof Error ? error : new Error("Google login failed.");
  }
}

// ============================================================
// GOOGLE SIGNUP
// NEW ACCOUNT
// ============================================================

export async function signupWithGoogle() {
  try {
    console.log("[Google Signup] Starting");

    const firebaseUser = await getGoogleFirebaseUser();

    console.log("[Google Signup] Firebase authentication successful");

    // IMPORTANT:
    // This MUST call /auth/register-firebase.
    const backendUser = await registerFirebaseUserWithBackend();

    console.log("[Google Signup] MongoDB account created");

    return {
      firebaseUser,
      backendUser,
    };
  } catch (error) {
    console.error("[Google Signup] Error:", error);

    throw error instanceof Error ? error : new Error("Google signup failed.");
  }
}

// ============================================================
// LOGOUT
// ============================================================

export async function logoutFromFirebase(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {}

  try {
    await signOut(auth);
  } catch {}
}
