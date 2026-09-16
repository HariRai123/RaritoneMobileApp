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

const API_URL = "https://raritone-fullstack.onrender.com/api";

const GOOGLE_WEB_CLIENT_ID =
  "8520433775-bfc9slbl382o6gqja53bb4lmfc2n5jbs.apps.googleusercontent.com";

/**
 * Configure Google Sign-In once when this module is loaded.
 *
 * webClientId is the Firebase OAuth 2.0 Web client ID.
 * It is used to obtain the Google ID token that is exchanged
 * for a Firebase credential.
 *
 * iOS-specific native configuration is supplied through
 * GoogleService-Info.plist in the Expo app configuration.
 */
GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

export type BackendUser = {
  _id: string;
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

type BackendSyncResponse = {
  user?: BackendUser;
  message?: string;
};

/* -------------------------------------------------------------------------- */
/* Helper                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Synchronize the currently authenticated Firebase user
 * with the Raritone backend.
 *
 * Firebase automatically manages/refreshes the user's ID token.
 */
export async function syncUserWithBackend(): Promise<BackendUser> {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    throw new Error("No Firebase user is currently signed in");
  }

  const idToken = await firebaseUser.getIdToken();

  const response = await fetch(`${API_URL}/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  let data: BackendSyncResponse;

  try {
    data = (await response.json()) as BackendSyncResponse;
  } catch {
    throw new Error(
      `Backend returned an invalid response (${response.status})`,
    );
  }

  if (!response.ok) {
    console.error("Backend sync failed:", {
      status: response.status,
      data,
    });

    throw new Error(data?.message || "Failed to synchronize user with backend");
  }

  if (!data?.user) {
    throw new Error("Backend sync response does not contain a user");
  }

  return data.user;
}

/* -------------------------------------------------------------------------- */
/* Email Signup                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Sign up using Firebase email/password.
 */
export async function signupWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<{
  firebaseUser: User;
  backendUser: BackendUser;
}> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) {
    throw new Error("Name is required");
  }

  if (!cleanEmail) {
    throw new Error("Email is required");
  }

  if (!password) {
    throw new Error("Password is required");
  }

  const credential = await createUserWithEmailAndPassword(
    auth,
    cleanEmail,
    password,
  );

  await updateProfile(credential.user, {
    displayName: cleanName,
  });

  const backendUser = await syncUserWithBackend();

  return {
    firebaseUser: credential.user,
    backendUser,
  };
}

/* -------------------------------------------------------------------------- */
/* Email Login                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Login using Firebase email/password.
 */
export async function loginWithEmail(
  email: string,
  password: string,
): Promise<{
  firebaseUser: User;
  backendUser: BackendUser;
}> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail) {
    throw new Error("Email is required");
  }

  if (!password) {
    throw new Error("Password is required");
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

/* -------------------------------------------------------------------------- */
/* Google Login                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Sign in with Google.
 *
 * Works with the same Firebase authentication flow on Android and iOS.
 */
export async function loginWithGoogle(): Promise<{
  firebaseUser: User;
  backendUser: BackendUser;
}> {
  try {
    /**
     * Check Google Play Services on Android.
     *
     * On iOS this resolves without needing Google Play Services.
     */
    await GoogleSignin.hasPlayServices({
      showPlayServicesUpdateDialog: true,
    });

    const response = await GoogleSignin.signIn();

    /**
     * User cancelled Google sign-in.
     */
    if (!isSuccessResponse(response)) {
      throw new Error("Google sign-in was cancelled");
    }

    const { idToken } = response.data;

    if (!idToken) {
      throw new Error("Google sign-in did not return an ID token");
    }

    /**
     * Convert Google's ID token into a Firebase credential.
     */
    const googleCredential = GoogleAuthProvider.credential(idToken);

    /**
     * Sign the user into Firebase.
     */
    const firebaseCredential = await signInWithCredential(
      auth,
      googleCredential,
    );

    /**
     * Synchronize the Firebase user with MongoDB.
     */
    const backendUser = await syncUserWithBackend();

    return {
      firebaseUser: firebaseCredential.user,
      backendUser,
    };
  } catch (error: any) {
    console.error("Google sign-in error:", error);

    /**
     * Keep cancellation separate from actual errors.
     */
    if (error?.code === "SIGN_IN_CANCELLED" || error?.code === "12501") {
      throw new Error("Google sign-in was cancelled");
    }

    throw error instanceof Error ? error : new Error("Google sign-in failed");
  }
}

/* -------------------------------------------------------------------------- */
/* Logout                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Logout from both Google and Firebase.
 */
export async function logoutFromFirebase(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    /**
     * Google may not currently have a signed-in account.
     * Firebase logout should still continue.
     */
  }

  await signOut(auth);
}
