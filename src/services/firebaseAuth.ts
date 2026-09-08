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

/**
 * Configure Google Sign-In once when this service is loaded.
 */
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

export async function syncUserWithBackend() {
  if (!auth.currentUser) {
    throw new Error("No Firebase user is currently signed in");
  }

  const idToken = await auth.currentUser.getIdToken(true);

  const response = await fetch(`${API_URL}/auth/sync`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to sync user with backend");
  }

  return data.user as BackendUser;
}

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

  // Convert Google's ID token into a Firebase credential.
  const googleCredential = GoogleAuthProvider.credential(idToken);

  // Sign the user into Firebase.
  const firebaseCredential = await signInWithCredential(auth, googleCredential);

  // Sync the Firebase user with MongoDB.
  const backendUser = await syncUserWithBackend();

  return {
    firebaseUser: firebaseCredential.user,
    backendUser,
  };
}

export async function logoutFromFirebase() {
  await GoogleSignin.signOut().catch(() => {
    // Ignore Google sign-out errors when the user
    // was not signed in with Google.
  });

  await signOut(auth);
}
