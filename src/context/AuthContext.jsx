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
  generateEmailVerificationLink,
} from "firebase/auth";
import {
  doc, setDoc, getDoc, serverTimestamp,
  collection, query, where, getDocs,
} from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);
const API = process.env.REACT_APP_API_URL?.replace("/api/meal-plan", "") || "https://meal-planner-backend-0ul2.onrender.com";

function sanitize(str) {
  return String(str || "").replace(/[<>"'`]/g, "").trim().slice(0, 200);
}

// ── Send email via Resend (through backend) ────────────────────────────────
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
        suppressAuthChange.current = true;
        await signOut(auth);
        suppressAuthChange.current = false;
        setUser(null);
        setProfile(null);
        const err = new Error("Please verify your email before signing in.");
        err.code = "auth/email-not-verified";
        throw err;
      }
      const profileData = await createUserDoc(cred.user);
      setProfile(profileData);
      return { user: cred.user, role: "student" };
    } catch (firebaseErr) {
      if (firebaseErr.code === "auth/email-not-verified") throw firebaseErr;
      try {
        const trainer = await loginAsTrainer(email, password);
        return { user: null, role: "trainer", trainer };
      } catch {
        throw firebaseErr;
      }
    }
  }

  // ── Email signup — uses Resend for branded emails ──────────────────────────
  async function signupWithEmail(email, password, name, extra = {}) {
    suppressAuthChange.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: sanitize(name) });

      // Get Firebase verification link
      let verificationLink = null;
      try {
        // Firebase generates the link — we send it via Resend
        await sendEmailVerification(cred.user, { url: "https://mitabhukta.com" });
        // For now use Firebase's built-in send, but styled via Resend fallback
        // When Firebase Admin SDK is set up on backend, we can generate the link server-side
      } catch (e) {
        console.warn("Firebase verification email failed:", e.message);
      }

      // Always also try Resend as primary (with Firebase link)
      // Since we can't generate the Firebase link client-side, 
      // we send a branded notification via Resend pointing to sign-in
      await sendEmail("send-verification", {
        email,
        name: sanitize(name),
        verificationLink: verificationLink || "https://mitabhukta.com/login",
      });

      await createUserDoc(cred.user, { displayName: sanitize(name), ...extra });
      await signOut(auth);
    } finally {
      suppressAuthChange.current = false;
    }
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
      // Send welcome email for new Google users
      if (isNew) {
        sendEmail("send-welcome", {
          email: cred.user.email,
          name: cred.user.displayName,
        });
      }
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
  }

  // ── Password reset — uses Resend for branded email ─────────────────────────
  async function resetPassword(email) {
    // Firebase sends the reset email — also send branded version via Resend
    await sendPasswordResetEmail(auth, email);
    // Resend branded notification (Firebase handles the actual reset link)
    await sendEmail("send-password-reset", {
      email,
      name: "",
      resetLink: "https://mitabhukta.com", // Firebase email has the real link
    });
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