const APP_STORE_URL = "https://apps.apple.com/us/app/oria-ai-evolvable-personal-ai/id6758279152";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=me.oria";
const DEEPLINK_FALLBACK_DELAY_MS = 1500;

function isWeChatBrowser() {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
    return /MicroMessenger/i.test(ua);
}

function sanitizeUserId(raw) {
    if (!raw) return null;
    const s = String(raw).trim();
    if (s.length < 10 || s.length > 128) return null;
    if (/[\s/]/.test(s)) return null;
    return s;
}

function getUserIdFromLocation() {
    const pathMatch = window.location.pathname.match(/^\/u\/([^/?#]+)/i);
    return sanitizeUserId(pathMatch ? pathMatch[1] : null);
}

function universalLinkForUser(userId) {
    return new URL(`/u/${encodeURIComponent(userId)}`, window.location.origin).toString();
}

function trackEvent(eventName, params = {}) {
    if (typeof window.gtag === "function") {
        window.gtag("event", eventName, params);
    }
}

let fallbackUIBound = false;

function showFallbackUI(userId, options) {
    const { wechat = false } = options || {};
    const statusText = document.getElementById("status-text");
    const actions = document.getElementById("fallback-actions");
    const openAppBtn = document.getElementById("open-app-btn");
    const testflightBtn = document.getElementById("testflight-btn");
    const playStoreBtn = document.getElementById("play-store-btn");
    const copyLinkBtn = document.getElementById("copy-link-btn");
    const wechatNotice = document.getElementById("wechat-notice");
    const hintText = document.getElementById("hint-text");
    const appleMeta = document.getElementById("apple-itunes-meta");

    if (appleMeta && userId) {
        const appArg = universalLinkForUser(userId);
        appleMeta.setAttribute("content", `app-id=6758279152, app-argument=${appArg}`);
    }

    if (wechat && wechatNotice) {
        wechatNotice.innerHTML = "<strong>在微信内无法直接打开 App。</strong>请点击右上角 <strong>⋯</strong> 选择「在 Safari 中打开」或「在浏览器中打开」。";
        wechatNotice.classList.remove("hidden");
    }
    if (hintText && wechat) {
        hintText.classList.add("hidden");
    }

    if (statusText) {
        statusText.textContent = userId
            ? "Could not open the app automatically. Use the buttons below."
            : "This profile link is invalid.";
    }

    if (openAppBtn) {
        openAppBtn.href = userId ? `theotherme://user/${encodeURIComponent(userId)}` : "theotherme://moments";
        if (!fallbackUIBound) {
            openAppBtn.addEventListener("click", () => {
                trackEvent("profile_cta_clicked", { cta: "open_app", has_uid: !!userId });
            });
        }
    }

    if (copyLinkBtn && userId) {
        copyLinkBtn.classList.remove("hidden");
        if (!fallbackUIBound) {
            copyLinkBtn.addEventListener("click", () => {
                const url = universalLinkForUser(userId);
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(url).then(() => {
                        copyLinkBtn.textContent = "Copied!";
                        setTimeout(() => { copyLinkBtn.textContent = "Copy link"; }, 2000);
                    }).catch(() => fallbackCopyLink(url, copyLinkBtn));
                } else {
                    fallbackCopyLink(url, copyLinkBtn);
                }
                trackEvent("profile_cta_clicked", { cta: "copy_link" });
            });
        }
    }

    if (testflightBtn) {
        if (!fallbackUIBound) {
            testflightBtn.addEventListener("click", () => {
                trackEvent("profile_cta_clicked", { cta: "install_app_store" });
            });
        }
    }

    if (playStoreBtn) {
        playStoreBtn.href = PLAY_STORE_URL;
        if (!fallbackUIBound) {
            playStoreBtn.addEventListener("click", () => {
                trackEvent("profile_cta_clicked", { cta: "install_play_store" });
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

function runProfileFlow() {
    const userId = getUserIdFromLocation();
    const wechat = isWeChatBrowser();

    if (!userId) {
        trackEvent("profile_landing_viewed", { valid_uid: false });
        showFallbackUI(null, { wechat });
        return;
    }

    trackEvent("profile_landing_viewed", { valid_uid: true, wechat });

    if (wechat) {
        trackEvent("profile_wechat_in_app", {});
        showFallbackUI(userId, { wechat: true });
        return;
    }

    const deeplinkUrl = `theotherme://user/${encodeURIComponent(userId)}`;

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
            trackEvent("profile_app_opened", {});
        }
    }, { once: true });

    trackEvent("profile_deeplink_attempted", {});
    window.location.assign(deeplinkUrl);

    window.setTimeout(() => {
        trackEvent("profile_fallback_shown", {});
        showFallbackUI(userId);
    }, DEEPLINK_FALLBACK_DELAY_MS);
}

runProfileFlow();
