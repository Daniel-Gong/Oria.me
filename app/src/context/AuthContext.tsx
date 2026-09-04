import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  GoogleAuthProvider,
  OAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged,
  setPersistence,
  deleteUser,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { getFirebaseAuth } from "../firebase";

/** `local` survives browser restarts (IndexedDB). `session` clears when the tab/window session ends. */
export type SignInPersistence = "local" | "session";

export type AuthContextValue = {
  user: User | null;
  ready: boolean;
  signInEmail: (email: string, password: string, persistence: SignInPersistence) => Promise<void>;
  signInGoogle: (persistence: SignInPersistence) => Promise<void>;
  signInApple: (persistence: SignInPersistence) => Promise<void>;
  logOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * Increment when sign-in or persistence rules change. On mismatch, the client runs one `signOut()`
 * so older long-lived Firebase sessions do not skip the login screen after policy updates.
 */
const AUTH_CLIENT_MIGRATION_VERSION = "2";
const AUTH_CLIENT_VERSION_KEY = "oria_web_auth_client_version";

async function applyPersistence(persistence: SignInPersistence) {
  const auth = getFirebaseAuth();
  await setPersistence(auth, persistence === "local" ? browserLocalPersistence : browserSessionPersistence);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const auth = getFirebaseAuth();
    let unsubscribe: (() => void) | undefined;

    void (async () => {
      try {
        if (localStorage.getItem(AUTH_CLIENT_VERSION_KEY) !== AUTH_CLIENT_MIGRATION_VERSION) {
          await signOut(auth);
          localStorage.setItem(AUTH_CLIENT_VERSION_KEY, AUTH_CLIENT_MIGRATION_VERSION);
        }
      } catch {
        // ignore; listener still attached
      }
      unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setReady(true);
      });
    })();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const signInEmail = useCallback(async (email: string, password: string, persistence: SignInPersistence) => {
    await applyPersistence(persistence);
    await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  }, []);

  const signInGoogle = useCallback(async (persistence: SignInPersistence) => {
    await applyPersistence(persistence);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(getFirebaseAuth(), provider);
  }, []);

  const signInApple = useCallback(async (persistence: SignInPersistence) => {
    await applyPersistence(persistence);
    const provider = new OAuthProvider("apple.com");
    provider.addScope("email");
    provider.addScope("name");
    await signInWithPopup(getFirebaseAuth(), provider);
  }, []);

  const logOut = useCallback(async () => {
    await signOut(getFirebaseAuth());
  }, []);

  const deleteAccount = useCallback(async () => {
    const current = getFirebaseAuth().currentUser;
    if (!current) {
      throw new Error("Not signed in");
    }
    await deleteUser(current);
  }, []);

  const value = useMemo(
    () => ({ user, ready, signInEmail, signInGoogle, signInApple, logOut, deleteAccount }),
    [user, ready, signInEmail, signInGoogle, signInApple, logOut, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
