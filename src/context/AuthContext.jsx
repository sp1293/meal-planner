import { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);

// ── Input sanitizer ────────────────────────────────────────────────────────
function sanitize(str) {
  return String(str || "").replace(/[<>"'`]/g, "").trim().slice(0, 200);
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        // Check users collection first
        const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
        if (userSnap.exists()) {
          setProfile(userSnap.data());
        } else {
          // Check if trainer (matched by email in trainers collection)
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
        email:        sanitize(firebaseUser.email),
        displayName:  sanitize(firebaseUser.displayName || extra.displayName || ""),
        photoURL:     firebaseUser.photoURL || "",
        role:         "student",
        tier:         "free",
        plansUsed:    0,
        plansResetAt: serverTimestamp(),
        createdAt:    serverTimestamp(),
        gender:       sanitize(extra.gender || ""),
        referrals:    [],
        referralCode: `NOURISH-${firebaseUser.uid.slice(0, 6).toUpperCase()}`,
        bookings:     [],
        emailVerified: firebaseUser.emailVerified || false,
      };
      await setDoc(ref, data);
      setProfile(data);
    } else {
      // Update emailVerified status if changed
      const existing = snap.data();
      if (existing.emailVerified !== firebaseUser.emailVerified) {
        await setDoc(ref, { emailVerified: firebaseUser.emailVerified }, { merge: true });
      }
      setProfile({ ...existing, emailVerified: firebaseUser.emailVerified });
    }
  }

  // ── Trainer login via Firestore ────────────────────────────────────────────
  async function loginAsTrainer(email, password) {
    const snap = await getDocs(
      query(collection(db, "trainers"), where("email", "==", email.toLowerCase()))
    );
    if (snap.empty) throw new Error("No trainer found with this email.");
    const trainer = snap.docs[0].data();
    if (trainer.password !== password) throw new Error("Incorrect password.");
    if (trainer.status === "suspended") throw new Error("Your account has been suspended. Contact support@nourishai.com.");
    setProfile({ ...trainer, role: "trainer" });
    return trainer;
  }

  async function loginWithEmail(email, password) {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await createUserDoc(cred.user);
      return { user: cred.user, role: "student" };
    } catch (firebaseErr) {
      // If Firebase auth fails, try trainer login
      try {
        const trainer = await loginAsTrainer(email, password);
        return { user: null, role: "trainer", trainer };
      } catch {
        throw firebaseErr;
      }
    }
  }

  async function signupWithEmail(email, password, name, extra = {}) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: sanitize(name) });

    // Send email verification
    try {
      await sendEmailVerification(cred.user, {
        url: "https://meal-planner-ten-taupe.vercel.app",
      });
    } catch {
      // Non-fatal — continue even if verification email fails
    }

    await createUserDoc(cred.user, { displayName: sanitize(name), ...extra });
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
    // Sanitize all string fields before saving
    const sanitized = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, typeof v === "string" ? sanitize(v) : v])
    );
    const ref = doc(db, "users", user.uid);
    await setDoc(ref, sanitized, { merge: true });
    setProfile(p => ({ ...p, ...sanitized }));
  }

  const tier = profile?.tier || "free";
  const role = profile?.role || "student";

  return (
    <AuthContext.Provider value={{ user, profile, loading, tier, role, loginWithEmail, signupWithEmail, loginWithGoogle, logout, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);