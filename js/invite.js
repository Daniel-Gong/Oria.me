const REFERRAL_STORAGE_KEY = "oria_referral_code";
const REFERRAL_TS_STORAGE_KEY = "oria_referral_code_ts";
const APP_STORE_URL = "https://apps.apple.com/us/app/oria-ai-evolvable-personal-ai/id6758279152";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=me.oria";
const DEEPLINK_FALLBACK_DELAY_MS = 1500;
const ORIA_RUNTIME = window.__ORIA_RUNTIME__ || {};
const FUNCTIONS_BASE_URL = ORIA_RUNTIME.functionsBaseUrl || "";

if (!FUNCTIONS_BASE_URL) {
    throw new Error("[invite] Missing runtime functionsBaseUrl config.");
}

function isWeChatBrowser() {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    return /MicroMessenger/i.test(ua);
}

function sanitizeReferralCode(rawCode) {
    if (!rawCode) return null;
    const normalized = String(rawCode).trim().toUpperCase();
    const safe = normalized.replace(/[^A-Z0-9]/g, "");
    if (safe.length < 4 || safe.length > 16) return null;
    return safe;
}

function getCodeFromLocation() {
    const pathMatch = window.location.pathname.match(/^\/invite\/([^/?#]+)/i);
    const segment = pathMatch ? pathMatch[1] : null;
    if (segment && !/^index(?:\.html)?$/i.test(segment)) {
        const pathCode = sanitizeReferralCode(segment);
        if (pathCode) return pathCode;
    }

    const queryCode = sanitizeReferralCode(new URLSearchParams(window.location.search).get("code"));
    if (queryCode) return queryCode;

    return null;
}

function setStoredReferralCode(code) {
    if (!code) return;
    localStorage.setItem(REFERRAL_STORAGE_KEY, code);
    localStorage.setItem(REFERRAL_TS_STORAGE_KEY, String(Date.now()));
}

function trackEvent(eventName, params = {}) {
    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
    }
}

let fallbackUIBound = false;

function showFallbackUI(code, options) {
    const { wechat = false } = options || {};
    const statusText = document.getElementById("status-text");
    const codeChip = document.getElementById("code-chip");
    const actions = document.getElementById("fallback-actions");
    const openAppBtn = document.getElementById("open-app-btn");
    const testflightBtn = document.getElementById("testflight-btn");
    const playStoreBtn = document.getElementById("play-store-btn");
    const copyLinkBtn = document.getElementById("copy-link-btn");
    const wechatNotice = document.getElementById("wechat-notice");
    const hintText = document.getElementById("hint-text");

    if (wechat && wechatNotice) {
        wechatNotice.innerHTML = "<strong>在微信内无法直接打开 App。</strong>请点击右上角 <strong>⋯</strong> 选择「在 Safari 中打开」或「在浏览器中打开」，然后即可打开 Oria；或复制下方链接到 Safari 打开。";
        wechatNotice.classList.remove("hidden");
    }
    if (hintText && wechat) {
        hintText.classList.add("hidden");
    }

    if (statusText) {
        statusText.textContent = code
            ? "Could not open app automatically. You can open it manually or install it first."
            : "Invalid invite link. You can still install the app and join our newsletter on oria.me.";
    }

    if (code && codeChip) {
        codeChip.textContent = `Invite code: ${code}`;
        codeChip.classList.remove("hidden");
    }

    if (openAppBtn) {
        openAppBtn.href = code ? `theotherme://invite/${code}` : "theotherme://chat";
        if (!fallbackUIBound) {
            openAppBtn.addEventListener("click", () => {
                trackEvent("invite_cta_clicked", { cta: "open_app", code: code || "none" });
            });
        }
    }

    if (copyLinkBtn) {
        copyLinkBtn.classList.remove("hidden");
        if (!fallbackUIBound) {
            copyLinkBtn.addEventListener("click", () => {
                const url = window.location.href;
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(() => {
                        copyLinkBtn.textContent = "Copied!";
                        setTimeout(() => { copyLinkBtn.textContent = "Copy link"; }, 2000);
                    }).catch(() => fallbackCopyLink(url, copyLinkBtn));
                } else {
                    fallbackCopyLink(url, copyLinkBtn);
                }
                trackEvent("invite_cta_clicked", { cta: "copy_link", code: code || "none" });
            });
        }
    }

    if (testflightBtn) {
        const installUrl = code ? `${APP_STORE_URL}?ref=${encodeURIComponent(code)}` : APP_STORE_URL;
        testflightBtn.href = installUrl;
        if (!fallbackUIBound) {
            testflightBtn.addEventListener("click", () => {
                trackEvent("invite_cta_clicked", { cta: "install_app_store", code: code || "none" });
            });
        }
    }

    if (playStoreBtn) {
        playStoreBtn.href = PLAY_STORE_URL;
        if (!fallbackUIBound) {
            playStoreBtn.addEventListener("click", () => {
                trackEvent("invite_cta_clicked", { cta: "install_play_store", code: code || "none" });
            });
        }
    }

    fallbackUIBound = true;
    if (actions) actions.classList.remove("hidden");
}

function fallbackCopyLink(url, btn) {
    const input = document.createElement("input");
    input.value = url;
    input.setAttribute("readonly", "");
    input.style.position = "absolute";
    input.style.left = "-9999px";
    document.body.appendChild(input);
    input.select();
    try {
        document.execCommand("copy");
        btn.textContent = "Copied!";
        setTimeout(() => { btn.textContent = "Copy link"; }, 2000);
    } catch (e) { }
    document.body.removeChild(input);
}

function buildCanonicalPath(code) {
    const search = window.location.search || "";
    if (code) {
        return "/invite/" + code + search;
    }
    return "/invite" + search;
}

function pickAttributionValue(attribution, ...keys) {
    for (const key of keys) {
        const value = attribution?.[key];
        if (value === null || value === undefined) continue;
        const normalized = String(value).trim();
        if (normalized) return normalized;
    }
    return null;
}

function addMissingUtmParams(attribution) {
    if (!attribution || typeof attribution !== "object") return false;

    const params = new URLSearchParams(window.location.search);
    const mapping = {
        utm_source: pickAttributionValue(attribution, "source", "utm_source"),
        utm_medium: pickAttributionValue(attribution, "medium", "utm_medium"),
        utm_campaign: pickAttributionValue(attribution, "campaign", "utm_campaign"),
        utm_term: pickAttributionValue(attribution, "term", "utm_term"),
        utm_content: pickAttributionValue(attribution, "content", "utm_content"),
    };

    let changed = false;
    Object.keys(mapping).forEach((key) => {
        const value = mapping[key];
        const existing = params.get(key);
        if ((!existing || !String(existing).trim()) && value) {
            params.set(key, String(value));
            changed = true;
        }
    });

    if (changed) {
        const qs = params.toString();
        const next = window.location.pathname + (qs ? "?" + qs : "");
        window.history.replaceState({}, "", next);
    }
    return changed;
}

async function validateInviteForLanding(code) {
    if (!window.oriaFirebase) {
        try {
            await import("/js/config/firebase-app.js");
        } catch (error) {
            console.warn("[invite] Failed to initialize firebase-app module for App Check.", error);
        }
    }

    let appCheckHeader = {};
    if (window.oriaFirebase && typeof window.oriaFirebase.getAppCheckToken === "function") {
        const token = await window.oriaFirebase.getAppCheckToken();
        if (token) {
            appCheckHeader = { "X-Firebase-AppCheck": token };
        }
    }
    const endpoint = `${FUNCTIONS_BASE_URL}/validateInviteForLanding?code=${encodeURIComponent(code)}`;
    const response = await fetch(endpoint, { method: "GET", headers: appCheckHeader });
    if (!response.ok) {
        throw new Error(`validateInviteForLanding failed with status ${response.status}`);
    }
    return response.json();
}

async function runInviteFlow() {
    let code = getCodeFromLocation();

    const pathname = window.location.pathname.replace(/\/$/, "") || "/";
    if ((pathname === "/invite" || pathname === "/invite.html") && !code) {
        const params = new URLSearchParams(window.location.search);
        const qCode = sanitizeReferralCode(params.get("code"));
        if (qCode) {
            params.delete("code");
            const qs = params.toString() ? "?" + params.toString() : "";
            window.history.replaceState({}, "", "/invite/" + qCode + qs);
            code = qCode;
        }
    }

    if (!code && (/^\/invite\/?$/i.test(window.location.pathname) || /^\/invite\.html$/i.test(window.location.pathname))) {
        const search = window.location.search || "";
        window.history.replaceState({}, "", "/invite" + search);
    }

    const deeplinkUrl = code ? `theotherme://invite/${code}` : null;
    const canonicalPath = buildCanonicalPath(code);
    const wechat = isWeChatBrowser();

    const current = window.location.pathname + window.location.search;
    if (current !== canonicalPath) {
        window.history.replaceState({}, "", canonicalPath);
    }

    if (!code) {
        trackEvent("invite_landing_viewed", { valid_code: false });
        showFallbackUI(null, { wechat });
        return;
    }

    let validated = null;
    try {
        validated = await validateInviteForLanding(code);
    } catch (error) {
        console.warn("[invite] validation request failed, continuing in fallback-safe mode.", error);
    }

    if (validated && validated.valid === false) {
        trackEvent("invite_landing_viewed", {
            valid_code: false,
            invalid_reason: validated.reason || "invalid",
            code,
            wechat,
        });
        showFallbackUI(null, { wechat });
        return;
    }

    if (validated && validated.attribution) {
        const injected = addMissingUtmParams(validated.attribution);
        if (injected) {
            trackEvent("invite_utm_injected", { code });
        }
    }

    setStoredReferralCode(code);
    trackEvent("invite_landing_viewed", {
        valid_code: true,
        validation_state: validated ? "verified" : "unverified",
        code,
        wechat,
        code_type: validated?.codeType || "unknown",
    });

    if (wechat) {
        trackEvent("invite_wechat_in_app", { code });
        showFallbackUI(code, { wechat: true });
        return;
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            trackEvent("invite_app_opened", { code });
        }
    }, { once: true });

    trackEvent("invite_deeplink_attempted", { code });
    window.location.assign(deeplinkUrl);

    window.setTimeout(() => {
        trackEvent("invite_fallback_shown", { code });
        showFallbackUI(code);
    }, DEEPLINK_FALLBACK_DELAY_MS);
}

runInviteFlow();
