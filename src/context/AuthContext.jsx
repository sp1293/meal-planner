import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen to Firebase auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const snap = await getDoc(doc(db, "users", firebaseUser.uid));
        setProfile(snap.exists() ? snap.data() : null);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function createUserDoc(firebaseUser, extra = {}) {
    const ref  = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const data = {
        uid:          firebaseUser.uid,
        email:        firebaseUser.email,
        displayName:  firebaseUser.displayName || extra.name || "",
        photoURL:     firebaseUser.photoURL || "",
        tier:         "free",
        plansUsed:    0,
        plansResetAt: serverTimestamp(),
        createdAt:    serverTimestamp(),
        ...extra,
      };
      await setDoc(ref, data);
      setProfile(data);
    } else {
      setProfile(snap.data());
    }
  }

  async function loginWithEmail(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await createUserDoc(cred.user);
    return cred.user;
  }

  async function signupWithEmail(email, password, name) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await createUserDoc(cred.user, { displayName: name });
    return cred.user;
  }

  async function loginWithGoogle() {
    const cred = await signInWithPopup(auth, googleProvider);
    await createUserDoc(cred.user);
    return cred.user;
  }

  async function logout() {
    await signOut(auth);
    setProfile(null);
  }

  async function updateUserProfile(data) {
    if (!user) return;
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, data, { merge: true });
    setProfile(p => ({ ...p, ...data }));
  }

  const tier = profile?.tier || "free";

  return (
    <AuthContext.Provider value={{ user, profile, loading, tier, loginWithEmail, signupWithEmail, loginWithGoogle, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
