import { createContext, useContext, useEffect, useState, useRef } from "react";
import {
  onAuthStateChanged, signInWithEmailAndPassword,
  createUserWithEmailAndPassword, signInWithPopup,
  signOut, updateProfile, sendEmailVerification,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db, googleProvider } from "../firebase";

const AuthContext = createContext(null);
const API = process.env.REACT_APP_API_URL?.replace("/api/meal-plan","")
  || "https://meal-planner-backend-0ul2.onrender.com";

function sanitize(str) {
  return String(str||"").replace(/[<>"'`]/g,"").trim().slice(0,200);
}

export async function getAuthToken() {
  try {
    if (auth.currentUser) return await auth.currentUser.getIdToken();
    return null;
  } catch { return null; }
}

async function callAPI(endpoint, body) {
  try {
    const token = await getAuthToken();
    const headers = { "Content-Type":"application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res  = await fetch(`${API}/api/${endpoint}`, {
      method:"POST", headers, body:JSON.stringify(body),
    });
    const data = await res.json();
    return { ok:res.ok, data };
  } catch(e) {
    console.warn(`API call error: ${endpoint}`, e.message);
    return { ok:false, data:null };
  }
}

function getReferralCodeFromURL() {
  try {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) sessionStorage.setItem("mitabhukta_ref", ref.toUpperCase());
    return sessionStorage.getItem("mitabhukta_ref") || null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const suppressAuthChange = useRef(false);

  useEffect(() => { getReferralCodeFromURL(); }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (suppressAuthChange.current) return;

      // Check if we have a trainer session stored
      try {
        const trainerSession = sessionStorage.getItem("trainer_session");
        if (trainerSession && !firebaseUser) {
          const trainer = JSON.parse(trainerSession);
          setProfile({ ...trainer, role:"trainer" });
          setUser(null);
          setLoading(false);
          return;
        }
      } catch {}

      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userSnap = await getDoc(doc(db,"users",firebaseUser.uid));
          if (userSnap.exists()) {
            const existing = userSnap.data();
            if (existing.emailVerified !== firebaseUser.emailVerified) {
              await setDoc(doc(db,"users",firebaseUser.uid),{ emailVerified:firebaseUser.emailVerified },{ merge:true });
            }
            setProfile({ ...existing, emailVerified:firebaseUser.emailVerified });
          } else {
            setProfile(null);
          }
        } catch { setProfile(null); }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function createUserDoc(firebaseUser, extra={}) {
    const ref  = doc(db,"users",firebaseUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const data = {
        uid:           firebaseUser.uid,
        email:         sanitize(firebaseUser.email),
        displayName:   sanitize(firebaseUser.displayName||extra.displayName||""),
        photoURL:      firebaseUser.photoURL||"",
        role:          "student",
        tier:          "free",
        plansUsed:     0,
        plansResetAt:  serverTimestamp(),
        createdAt:     serverTimestamp(),
        gender:        sanitize(extra.gender||""),
        referrals:     [],
        referralCode:  `MITA-${firebaseUser.uid.slice(0,6).toUpperCase()}`,
        bookings:      [],
        emailVerified: firebaseUser.emailVerified||false,
      };
      await setDoc(ref, data);
      return data;
    } else {
      const existing = snap.data();
      if (existing.emailVerified !== firebaseUser.emailVerified) {
        await setDoc(ref,{ emailVerified:firebaseUser.emailVerified },{ merge:true });
      }
      return { ...existing, emailVerified:firebaseUser.emailVerified };
    }
  }

  // ── Trainer login — via backend JWT, never reads Firestore client-side ────
  async function loginAsTrainer(email, password) {
    const { ok, data } = await callAPI("trainer-login",{ email, password });
    if (!ok||!data?.success) throw new Error(data?.error||"Trainer login failed.");

    // Store trainer session in sessionStorage — survives page refresh
    try {
      sessionStorage.setItem("trainer_token",   data.token);
      sessionStorage.setItem("trainer_session", JSON.stringify(data.trainer));
    } catch {}

    setProfile({ ...data.trainer, role:"trainer" });
    setUser(null);
    return data.trainer;
  }

async function loginWithEmail(email, password) {
  // First try trainer login via backend — avoids Firebase 400 error entirely
  // We check if it's a trainer BEFORE trying Firebase Auth
  try {
    const trainer = await loginAsTrainer(email, password);
    return { user:null, role:"trainer", trainer };
  } catch(trainerErr) {
    // Not a trainer — now try Firebase Auth for regular users
  }

  // Regular user login via Firebase
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    await cred.user.reload();
    const freshUser = auth.currentUser;

    if (!freshUser.emailVerified) {
      suppressAuthChange.current = true;
      await signOut(auth);
      suppressAuthChange.current = false;
      setUser(null); setProfile(null);
      const err = new Error("Please verify your email before signing in.");
      err.code = "auth/email-not-verified";
      throw err;
    }

    const profileData = await createUserDoc(freshUser);
    setProfile(profileData); setUser(freshUser);
    return { user:freshUser, role:"student" };

  } catch(firebaseErr) {
    if (firebaseErr.code === "auth/email-not-verified") throw firebaseErr;
    // Show friendly error to user
    throw firebaseErr;
  }
}

  async function signupWithEmail(email, password, name, extra={}) {
    suppressAuthChange.current = true;
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user,{ displayName:sanitize(name) });
      try { await sendEmailVerification(cred.user); } catch {}
      callAPI("send-verification-email",{ email, name:sanitize(name) });
      await createUserDoc(cred.user,{ displayName:sanitize(name), ...extra });
      const refCode = getReferralCodeFromURL();
      if (refCode) {
        callAPI("apply-referral",{ referralCode:refCode, newUserId:cred.user.uid })
          .then(()=>{ try { sessionStorage.removeItem("mitabhukta_ref"); } catch {} });
      }
      await signOut(auth);
    } finally { suppressAuthChange.current = false; }
    setUser(null); setProfile(null);
  }

  async function loginWithGoogle() {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const snap = await getDoc(doc(db,"users",cred.user.uid));
      const isNew = !snap.exists();
      const needsPrefs = isNew||!snap.data()?.gender;
      const profileData = await createUserDoc(cred.user);
      setProfile(profileData);
      if (isNew) {
        callAPI("send-welcome",{ email:cred.user.email, name:cred.user.displayName });
        const refCode = getReferralCodeFromURL();
        if (refCode) {
          callAPI("apply-referral",{ referralCode:refCode, newUserId:cred.user.uid })
            .then(()=>{ try { sessionStorage.removeItem("mitabhukta_ref"); } catch {} });
        }
      }
      return { user:cred.user, needsPrefs };
    } catch(err) {
      if (err.code==="auth/popup-closed-by-user"||err.code==="auth/cancelled-popup-request") {
        const e=new Error("Sign-in popup was closed. Please try again."); e.code=err.code; throw e;
      }
      if (err.code==="auth/popup-blocked") {
        const e=new Error("Popup blocked. Please allow popups for mitabhukta.com."); e.code="auth/popup-blocked"; throw e;
      }
      throw err;
    }
  }

  async function resendVerificationEmail(email, password) {
    suppressAuthChange.current = true;
    try { await signInWithEmailAndPassword(auth,email,password); await signOut(auth); }
    finally { suppressAuthChange.current = false; }
    setUser(null); setProfile(null);
    await callAPI("send-verification-email",{ email, name:"" });
  }

  async function resetPassword(email) {
    const { ok } = await callAPI("send-password-reset",{ email, name:"" });
    if (!ok) throw new Error("Failed to send reset email. Please try again.");
  }

  async function logout() {
    // Clear trainer session if exists
    try {
      sessionStorage.removeItem("trainer_token");
      sessionStorage.removeItem("trainer_session");
    } catch {}
    await signOut(auth);
    setUser(null); setProfile(null);
  }

  async function updateUserProfile(data) {
    if (!user) return;
    const sanitized = Object.fromEntries(
      Object.entries(data).map(([k,v])=>[k,typeof v==="string"?sanitize(v):v])
    );
    await setDoc(doc(db,"users",user.uid),sanitized,{ merge:true });
    setProfile(p=>({ ...p, ...sanitized }));
  }

  function clearJustSignedUp() {}

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      tier: profile?.tier||"free",
      role: profile?.role||"student",
      loginWithEmail, signupWithEmail, loginWithGoogle,
      logout, updateUserProfile, resetPassword,
      resendVerificationEmail, clearJustSignedUp,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);