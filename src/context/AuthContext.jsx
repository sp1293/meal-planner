import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, serverTimestamp,
  collection, query, where, getDocs,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);

function sanitize(str) {
  return String(str || "").replace(/[<>"'`]/g, "").trim().slice(0, 200);
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const suppressAuthChange = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (suppressAuthChange.current) return;
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userSnap.exists()) {
            const existing = userSnap.data();
            if (existing.emailVerified !== firebaseUser.emailVerified) {
              await setDoc(doc(db, "users", firebaseUser.uid),
                { emailVerified: firebaseUser.emailVerified }, { merge: true });
            }
            setProfile({ ...existing, emailVerified: firebaseUser.emailVerified });
          } else {
            try {
              const trainerSnap = await getDocs(
                query(collection(db, "trainers"), where("email", "==", firebaseUser.email?.toLowerCase()))
              );
              if (!trainerSnap.empty) {
                setProfile({ ...trainerSnap.docs[0].data(), role: "trainer" });
              } else {
                setProfile(null);
              }
            } catch {
              setProfile(null);
            }
          }
        } catch {
          setProfile(null);
        }
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
        uid:           firebaseUser.uid,
        email:         sanitize(firebaseUser.email),
        displayName:   sanitize(firebaseUser.displayName || extra.displayName || ""),
        photoURL:      firebaseUser.photoURL || "",
        role:          "student",
        tier:          "free",
        plansUsed:     0,
        plansResetAt:  serverTimestamp(),
        createdAt:     serverTimestamp(),
        gender:        sanitize(extra.gender || ""),
        referrals:     [],
        referralCode:  `MITA-${firebaseUser.uid.slice(0, 6).toUpperCase()}`,
        bookings:      [],
        emailVerified: firebaseUser.emailVerified || false,
      };
      await setDoc(ref, data);
      setProfile(data);
      return data;
    } else {
      const existing = snap.data();
      if (existing.emailVerified !== firebaseUser.emailVerified) {
        await setDoc(ref, { emailVerified: firebaseUser.emailVerified }, { merge: true });
      }
      const updated = { ...existing, emailVerified: firebaseUser.emailVerified };
      setProfile(updated);
      return updated;
    }
  }

  async function loginAsTrainer(email, password) {
    const snap = await getDocs(
      query(collection(db, "trainers"), where("email", "==", email.toLowerCase()))
    );
    if (snap.empty) throw new Error("No trainer found with this email.");
    const trainer = snap.docs[0].data();
    if (trainer.password !== password) throw new Error("Incorrect password.");
    if (trainer.status === "suspended")
      throw new Error("Your account has been suspended. Contact support@mitabhukta.com.");
    setProfile({ ...trainer, role: "trainer" });
    return trainer;
  }

  // ── Email login — verification check DISABLED for testing ──────────────────
  // TODO: Re-enable email verification before marketing launch
  async function loginWithEmail(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await createUserDoc(cred.user);
      return { user: cred.user, role: "student" };
    } catch (firebaseErr) {
      // If Firebase auth fails, try trainer login as fallback
      try {
        const trainer = await loginAsTrainer(email, password);
        return { user: null, role: "trainer", trainer };
      } catch {
        throw firebaseErr;
      }
    }
  }

  // ── Email signup ───────────────────────────────────────────────────────────
  async function signupWithEmail(email, password, name, extra = {}) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: sanitize(name) });
    try {
      await sendEmailVerification(cred.user, { url: "https://mitabhukta.com" });
    } catch (e) {
      console.warn("Verification email failed:", e.message);
    }
    await createUserDoc(cred.user, { displayName: sanitize(name), ...extra });
    // NOTE: Not signing out — user goes straight to dashboard after signup
    // Email verification is informational only while testing
    return cred.user;
  }

  // ── Google login ───────────────────────────────────────────────────────────
  async function loginWithGoogle() {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const needsPrefs = !snap.exists() || !snap.data()?.gender;
      await createUserDoc(cred.user);
      return { user: cred.user, needsPrefs };
    } catch (err) {
      if (err.code === "auth/popup-closed-by-user" || err.code === "auth/cancelled-popup-request") {
        const e = new Error("Sign-in popup was closed. Please try again.");
        e.code = err.code;
        throw e;
      }
      if (err.code === "auth/popup-blocked") {
        const e = new Error("Popup was blocked. Please allow popups for mitabhukta.com.");
        e.code = "auth/popup-blocked";
        throw e;
      }
      throw err;
    }
  }

  async function resendVerificationEmail(email, password) {
    suppressAuthChange.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(cred.user, { url: "https://mitabhukta.com" });
      await signOut(auth);
    } finally {
      suppressAuthChange.current = false;
    }
  }

  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email, { url: "https://mitabhukta.com" });
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  async function updateUserProfile(data) {
    if (!user) return;
    const sanitized = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, typeof v === "string" ? sanitize(v) : v])
    );
    await setDoc(doc(db, "users", user.uid), sanitized, { merge: true });
    setProfile(p => ({ ...p, ...sanitized }));
  }

  const tier = profile?.tier || "free";
  const role = profile?.role || "student";

  return (
    <AuthContext.Provider value={{
      user, profile, loading, tier, role,
      loginWithEmail, signupWithEmail, loginWithGoogle,
      logout, updateUserProfile, resetPassword, resendVerificationEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);