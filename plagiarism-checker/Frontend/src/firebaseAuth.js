import { auth, googleProvider } from "./firebaseConfig";
import { signInWithPopup } from "firebase/auth";

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    console.error("Error saat login dengan Google:", error);
    throw error;
  }
};
