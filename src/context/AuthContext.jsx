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

  // ── This flag prevents onAuthStateChanged from running
  //    during an intentional signOut inside loginWithEmail ────────────────────
  const suppressAuthChange = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Skip if we're intentionally signing out mid-login
      if (suppressAuthChange.current) return;

      setUser(firebaseUser);

      if (firebaseUser) {
        try {
          const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userSnap.exists()) {
            const existing = userSnap.data();
            // Sync emailVerified if changed
            if (existing.emailVerified !== firebaseUser.emailVerified) {
              await setDoc(
                doc(db, "users", firebaseUser.uid),
                { emailVerified: firebaseUser.emailVerified },
                { merge: true }
              );
            }
            setProfile({ ...existing, emailVerified: firebaseUser.emailVerified });
          } else {
            // Check trainer collection
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
          // Firestore unreachable — still resolve auth loading
          setProfile(null);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });
    return unsub;
  }, []);

  // ── Create or update user document in Firestore ────────────────────────────
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

  // ── Trainer login (Firestore-based, no Firebase Auth) ──────────────────────
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

  // ── Email login ────────────────────────────────────────────────────────────
  // KEY FIX: Do NOT call signOut() here. Instead throw a custom error
  // with the unverified user's credentials so the UI can show the
  // verify screen without triggering onAuthStateChanged → redirect loop.
  async function loginWithEmail(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        // ── Suppress the signOut from triggering a redirect ──────────────────
        suppressAuthChange.current = true;
        await signOut(auth);
        suppressAuthChange.current = false;

        // Manually clear state
        setUser(null);
        setProfile(null);

        const err = new Error("Email not verified.");
        err.code = "auth/email-not-verified";
        throw err;
      }

      // Email is verified — proceed normally
      await createUserDoc(cred.user);
      return { user: cred.user, role: "student" };

    } catch (firebaseErr) {
      // Rethrow our custom error immediately
      if (firebaseErr.code === "auth/email-not-verified") throw firebaseErr;

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
  // Signs user out AFTER creating the doc, suppressing the auth change
  async function signupWithEmail(email, password, name, extra = {}) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: sanitize(name) });

    try {
      await sendEmailVerification(cred.user, { url: "https://mitabhukta.com" });
    } catch (e) {
      console.warn("Verification email failed:", e.message);
    }

    await createUserDoc(cred.user, { displayName: sanitize(name), ...extra });

    // Suppress redirect — we want the UI to show the verify screen
    suppressAuthChange.current = true;
    await signOut(auth);
    suppressAuthChange.current = false;

    setUser(null);
    setProfile(null);

    return cred.user;
  }

  // ── Google login ───────────────────────────────────────────────────────────
  async function loginWithGoogle() {
    try {
      const cred = await signInWithPopup(auth, googleProvider);

      // Check if new user (no gender) BEFORE creating doc
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const needsPrefs = !snap.exists() || !snap.data()?.gender;

      await createUserDoc(cred.user);
      return { user: cred.user, needsPrefs };

    } catch (err) {
      if (
        err.code === "auth/popup-closed-by-user" ||
        err.code === "auth/cancelled-popup-request"
      ) {
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

  // ── Resend verification email ──────────────────────────────────────────────
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

  // ── Password reset ─────────────────────────────────────────────────────────
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email, { url: "https://mitabhukta.com" });
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  async function logout() {
    await signOut(auth);
    setUser(null);
    setProfile(null);
  }

  // ── Update profile ─────────────────────────────────────────────────────────
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