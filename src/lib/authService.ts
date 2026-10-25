import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  ward?: string;
  coordinates?: { lat: number; lng: number };
  role?: "resident" | "responder" | "ngo" | "admin";
  isAnonymous?: boolean;
  createdAt?: unknown;
}

/**
 * Sign up a new user with Email and Password, and save their profile in Firestore.
 */
export async function signUpUser(
  email: string,
  pass: string,
  displayName: string,
  ward?: string,
  coordinates?: { lat: number; lng: number }
): Promise<UserProfile> {
  if (!auth) {
    // Fallback profile if Firebase credentials are pending
    return {
      uid: `local-${Date.now()}`,
      email,
      displayName,
      ward: ward || undefined,
      coordinates,
      role: "resident",
      isAnonymous: false,
    };
  }

  const credential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = credential.user;

  if (displayName) {
    await updateProfile(user, { displayName });
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email,
    displayName: displayName || user.email?.split("@")[0] || "Resident",
    ward: ward?.trim() || undefined,
    coordinates,
    role: "resident",
    isAnonymous: false,
    createdAt: serverTimestamp(),
  };

  if (db) {
    try {
      await setDoc(doc(db, "users", user.uid), profile, { merge: true });
    } catch (err) {
      console.warn("Could not save user profile to Firestore:", err);
    }
  }

  return profile;
}

/**
 * Update user location and coordinates in Firestore.
 */
export async function updateUserLocationInDb(
  uid: string,
  ward: string,
  coordinates?: { lat: number; lng: number }
): Promise<void> {
  if (db) {
    try {
      const data: Record<string, unknown> = {
        ward: ward.trim(),
        updatedAt: serverTimestamp(),
      };
      if (coordinates) {
        data.coordinates = coordinates;
      }
      await setDoc(doc(db, "users", uid), data, { merge: true });
    } catch (err) {
      console.warn("Could not update user location in Firestore:", err);
    }
  }
}

/**
 * Sign in an existing user with Email and Password.
 */
export async function signInUser(email: string, pass: string): Promise<UserProfile> {
  if (!auth) {
    return {
      uid: "local-user",
      email,
      displayName: email.split("@")[0],
      ward: "Section C, Ward 8",
      role: "resident",
      isAnonymous: false,
    };
  }

  const credential = await signInWithEmailAndPassword(auth, email, pass);
  const user = credential.user;

  let ward: string | undefined = undefined;
  let role: UserProfile["role"] = "resident";
  let coordinates: { lat: number; lng: number } | undefined = undefined;

  if (db) {
    try {
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.ward) ward = data.ward;
        if (data.role) role = data.role;
        if (data.coordinates) coordinates = data.coordinates;
      }
    } catch (err) {
      console.warn("Could not fetch user profile from Firestore:", err);
    }
  }

  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || user.email?.split("@")[0] || "Resident",
    ward,
    coordinates,
    role,
    isAnonymous: user.isAnonymous,
  };
}



/**
 * Sign out the currently authenticated user.
 */
export async function signOutCurrentUser(): Promise<void> {
  if (auth) {
    await signOut(auth);
  }
}

/**
 * Subscribe to authentication state changes.
 */
export function subscribeToAuth(
  callback: (user: UserProfile | null) => void
): () => void {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
    if (!user) {
      callback(null);
      return;
    }

    let ward: string | undefined = undefined;
    let role: UserProfile["role"] = "resident";
    let coordinates: { lat: number; lng: number } | undefined = undefined;

    if (db) {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.ward) ward = data.ward;
          if (data.role) role = data.role;
          if (data.coordinates) coordinates = data.coordinates;
        }
      } catch (e) {
        console.warn("Error fetching user profile:", e);
      }
    }

    callback({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName || user.email?.split("@")[0] || "Resident",
      ward,
      coordinates,
      role,
      isAnonymous: user.isAnonymous,
    });
  });
}

