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
const API = process.env.REACT_APP_API_URL?.replace("/api/meal-plan", "")
  || "https://meal-planner-backend-0ul2.onrender.com";

function sanitize(str) {
  return String(str || "").replace(/[<>"'`]/g, "").trim().slice(0, 200);
}

async function sendEmail(endpoint, body) {
  try {
    const res = await fetch(`${API}/api/${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) console.warn(`Email send failed: ${endpoint}`, await res.text());
    return res.ok;
  } catch (e) {
    console.warn(`Email send error: ${endpoint}`, e.message);
    return false;
  }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // When true, onAuthStateChanged does nothing at all
  const suppressAuthChange = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      // Completely ignore any Firebase auth events during signup/signout flows
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
                query(collection(db, "trainers"),
                  where("email", "==", firebaseUser.email?.toLowerCase()))
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
      return data;
    } else {
      const existing = snap.data();
      if (existing.emailVerified !== firebaseUser.emailVerified) {
        await setDoc(ref, { emailVerified: firebaseUser.emailVerified }, { merge: true });
      }
      return { ...existing, emailVerified: firebaseUser.emailVerified };
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

  // ── Email login ────────────────────────────────────────────────────────────
  async function loginWithEmail(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        // Suppress then sign out — user must verify first
        suppressAuthChange.current = true;
        await signOut(auth);
        suppressAuthChange.current = false;
        setUser(null);
        setProfile(null);
        const err = new Error("Please verify your email before signing in.");
        err.code = "auth/email-not-verified";
        throw err;
      }

      // Verified — load profile and let onAuthStateChanged handle the rest
      const profileData = await createUserDoc(cred.user);
      setProfile(profileData);
      return { user: cred.user, role: "student" };

    } catch (firebaseErr) {
      if (firebaseErr.code === "auth/email-not-verified") throw firebaseErr;
      // Fallback — try trainer login
      try {
        const trainer = await loginAsTrainer(email, password);
        return { user: null, role: "trainer", trainer };
      } catch {
        throw firebaseErr;
      }
    }
  }

  // ── Email signup ───────────────────────────────────────────────────────────
  // CRITICAL: suppress must stay true until AFTER setUser(null)/setProfile(null)
  // Any gap between unsuppress and state clear causes the login flash
  async function signupWithEmail(email, password, name, extra = {}) {
    // Suppress BEFORE everything — Firebase will fire auth events during creation
    suppressAuthChange.current = true;

    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: sanitize(name) });

      // Send Firebase verification email (goes to spam but has real link)
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn("Firebase verification email failed:", e.message);
      }

      // Send branded Resend verification email
      // Note: We use Firebase's email for the actual verification link
      // Resend email is a branded companion notification
      await sendEmail("send-verification", {
        email,
        name: sanitize(name),
        verificationLink: `https://mitabhukta.com`,
      });

      // Save to Firestore
      await createUserDoc(cred.user, { displayName: sanitize(name), ...extra });

      // Sign out while still suppressed
      await signOut(auth);

    } finally {
      // Unsuppress ONLY after everything is done
      suppressAuthChange.current = false;
    }

    // Clear state AFTER unsuppressing — this is intentional
    // We manually clear rather than letting onAuthStateChanged do it
    setUser(null);
    setProfile(null);
  }

  // ── Google login ───────────────────────────────────────────────────────────
  async function loginWithGoogle() {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db, "users", cred.user.uid));
      const isNew = !snap.exists();
      const needsPrefs = isNew || !snap.data()?.gender;
      const profileData = await createUserDoc(cred.user);
      setProfile(profileData);
      if (isNew) {
        // Fire and forget — don't await
        sendEmail("send-welcome", {
          email: cred.user.email,
          name:  cred.user.displayName,
        });
      }
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
      await sendEmailVerification(cred.user);
      await signOut(auth);
    } finally {
      suppressAuthChange.current = false;
    }
    setUser(null);
    setProfile(null);
  }

  // ── Password reset ─────────────────────────────────────────────────────────
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
    // Also send branded Resend email as companion
    sendEmail("send-password-reset", {
      email,
      name:      "",
      resetLink: "https://mitabhukta.com",
    });
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