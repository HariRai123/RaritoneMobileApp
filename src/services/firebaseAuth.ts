import {
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithCredential,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
} from "firebase/auth";

import {
    GoogleSignin,
    isSuccessResponse,
} from "@react-native-google-signin/google-signin";

import { auth } from "../config/firebase";

const API_URL = "https://raritone-fullstack.onrender.com/api";

const GOOGLE_WEB_CLIENT_ID =
  "8520433775-bfc9slbl382o6gqja53bb4lmfc2n5jbs.apps.googleusercontent.com";

GoogleSignin.configure({
  webClientId: GOOGLE_WEB_CLIENT_ID,
});

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

/**
 * Synchronize the currently authenticated Firebase user
 * with the Raritone backend.
 */
export async function syncUserWithBackend(): Promise<BackendUser> {
  const firebaseUser = auth.currentUser;

  if (!firebaseUser) {
    throw new Error("No Firebase user is currently signed in");
  }

  // Get the current Firebase ID token.
  // Firebase automatically refreshes it when necessary.
  const idToken = await firebaseUser.getIdToken();

  const response = await fetch(`${API_URL}/auth/sync`, {
    method: "POST",

    headers: {
      Authorization: `Bearer ${idToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  let data: any;

  try {
    data = await response.json();
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

    throw new Error(data?.message || "Failed to sync user with backend");
  }

  if (!data?.user) {
    throw new Error("Backend sync response does not contain a user");
  }

  return data.user as BackendUser;
}

/**
 * Sign up using Firebase email/password.
 */
export async function signupWithEmail(
  name: string,
  email: string,
  password: string,
) {
  const credential = await createUserWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );

  await updateProfile(credential.user, {
    displayName: name.trim(),
  });

  const backendUser = await syncUserWithBackend();

  return {
    firebaseUser: credential.user,
    backendUser,
  };
}

/**
 * Login using Firebase email/password.
 */
export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password,
  );

  const backendUser = await syncUserWithBackend();

  return {
    firebaseUser: credential.user,
    backendUser,
  };
}

/**
 * Sign in with Google on Android.
 */
export async function loginWithGoogle() {
  await GoogleSignin.hasPlayServices({
    showPlayServicesUpdateDialog: true,
  });

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response)) {
    throw new Error("Google sign-in was cancelled");
  }

  const { idToken } = response.data;

  if (!idToken) {
    throw new Error("Google sign-in did not return an ID token");
  }

  // Create Firebase credential from Google's ID token.
  const googleCredential = GoogleAuthProvider.credential(idToken);

  // Sign into Firebase.
  const firebaseCredential = await signInWithCredential(auth, googleCredential);

  // Synchronize Firebase user with MongoDB.
  const backendUser = await syncUserWithBackend();

  return {
    firebaseUser: firebaseCredential.user,
    backendUser,
  };
}

/**
 * Logout from Firebase and Google.
 */
export async function logoutFromFirebase() {
  await GoogleSignin.signOut().catch(() => {
    // Google may not be signed in.
  });

  await signOut(auth);
}
