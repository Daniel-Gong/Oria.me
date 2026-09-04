import {
    GoogleAuthProvider,
    OAuthProvider,
    browserSessionPersistence,
    deleteUser,
    onAuthStateChanged,
    setPersistence,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const els = {
    configError: document.getElementById("delete-config-error"),
    signedOut: document.getElementById("delete-signed-out"),
    signedIn: document.getElementById("delete-signed-in"),
    done: document.getElementById("delete-done"),
    status: document.getElementById("delete-status"),
    userLabel: document.getElementById("delete-user-label"),
    signinForm: document.getElementById("delete-signin-form"),
    confirmForm: document.getElementById("delete-confirm-form"),
    email: document.getElementById("delete-email"),
    password: document.getElementById("delete-password"),
    confirm: document.getElementById("delete-confirm"),
    googleBtn: document.getElementById("delete-google-btn"),
    appleBtn: document.getElementById("delete-apple-btn"),
    emailBtn: document.getElementById("delete-email-btn"),
    submitBtn: document.getElementById("delete-submit-btn"),
    signOutBtn: document.getElementById("delete-signout-btn"),
};

function setHidden(el, hidden) {
    if (!el) return;
    el.hidden = hidden;
}

function setBusy(busy) {
    for (const btn of [els.googleBtn, els.appleBtn, els.emailBtn, els.submitBtn, els.signOutBtn]) {
        if (btn) btn.disabled = busy;
    }
}

function showStatus(message, kind) {
    if (!els.status) return;
    els.status.textContent = message || "";
    els.status.classList.toggle("is-error", kind === "error");
    els.status.classList.toggle("is-success", kind === "success");
    setHidden(els.status, !message);
}

function authErrorMessage(error) {
    const code = error && error.code ? String(error.code) : "";
    switch (code) {
        case "auth/requires-recent-login":
            return "Please sign in again on this page, then retry deletion.";
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
            return "Email or password is incorrect, or no Oria AI account matches that email.";
        case "auth/too-many-requests":
            return "Too many attempts. Wait a moment and try again.";
        case "auth/popup-closed-by-user":
        case "auth/cancelled-popup-request":
            return "Sign-in was cancelled.";
        case "auth/account-exists-with-different-credential":
            return "This email is already used with a different sign-in method. Try that method instead.";
        default:
            return error instanceof Error ? error.message : "Something went wrong.";
    }
}

function accountLabel(user) {
    return user.email || user.displayName || user.uid;
}

function renderAuth(user, { completed = false } = {}) {
    if (completed) {
        setHidden(els.signedOut, true);
        setHidden(els.signedIn, true);
        setHidden(els.done, false);
        return;
    }
    setHidden(els.done, true);
    setHidden(els.signedOut, Boolean(user));
    setHidden(els.signedIn, !user);
    if (els.userLabel) {
        els.userLabel.textContent = user ? accountLabel(user) : "";
    }
}

async function main() {
    let auth;
    try {
        const { getOriaFirebase } = await import("/js/config/firebase-app.js");
        auth = getOriaFirebase().auth;
        if (!auth) throw new Error("Firebase Auth is not available.");
    } catch (error) {
        console.warn("[delete-account] Firebase unavailable:", error);
        setHidden(els.configError, false);
        setHidden(els.signedOut, true);
        setHidden(els.signedIn, true);
        return;
    }

    onAuthStateChanged(auth, (user) => {
        renderAuth(user);
    });

    async function signInWithProvider(provider) {
        showStatus("");
        setBusy(true);
        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInWithPopup(auth, provider);
        } catch (error) {
            showStatus(authErrorMessage(error), "error");
        } finally {
            setBusy(false);
        }
    }

    els.googleBtn?.addEventListener("click", () => {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: "select_account" });
        void signInWithProvider(provider);
    });

    els.appleBtn?.addEventListener("click", () => {
        const provider = new OAuthProvider("apple.com");
        provider.addScope("email");
        provider.addScope("name");
        void signInWithProvider(provider);
    });

    els.signinForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        showStatus("");
        setBusy(true);
        try {
            await setPersistence(auth, browserSessionPersistence);
            await signInWithEmailAndPassword(auth, els.email.value.trim(), els.password.value);
        } catch (error) {
            showStatus(authErrorMessage(error), "error");
        } finally {
            setBusy(false);
        }
    });

    els.signOutBtn?.addEventListener("click", async () => {
        showStatus("");
        setBusy(true);
        try {
            await signOut(auth);
        } catch (error) {
            showStatus(authErrorMessage(error), "error");
        } finally {
            setBusy(false);
        }
    });

    els.confirmForm?.addEventListener("submit", async (event) => {
        event.preventDefault();
        const user = auth.currentUser;
        if (!user) {
            showStatus("Sign in first, then confirm deletion.", "error");
            return;
        }
        if (!els.confirm?.checked) {
            showStatus("Check the confirmation box to continue.", "error");
            return;
        }
        showStatus("");
        setBusy(true);
        try {
            await deleteUser(user);
            renderAuth(null, { completed: true });
            showStatus("");
        } catch (error) {
            showStatus(authErrorMessage(error), "error");
        } finally {
            setBusy(false);
        }
    });
}

void main();
