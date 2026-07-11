// Oria AI — storytelling scroll + newsletter
const REFERRAL_STORAGE_KEY = 'oria_referral_code';
const ORIA_RUNTIME = window.__ORIA_RUNTIME__ || {};
const FUNCTIONS_BASE_URL = ORIA_RUNTIME.functionsBaseUrl || "";

function sanitizeReferralCode(rawCode) {
    if (!rawCode) return null;
    const normalized = String(rawCode).trim().toUpperCase();
    const safe = normalized.replace(/[^A-Z0-9]/g, '');
    if (safe.length < 4 || safe.length > 16) return null;
    return safe;
}

function getReferralCodeForAttribution() {
    const queryCode = sanitizeReferralCode(new URLSearchParams(window.location.search).get('ref'));
    if (queryCode) return queryCode;

    const pathMatch = window.location.pathname.match(/^\/invite\/([^/?#]+)/i);
    const pathCode = sanitizeReferralCode(pathMatch ? pathMatch[1] : null);
    if (pathCode) return pathCode;

    return sanitizeReferralCode(localStorage.getItem(REFERRAL_STORAGE_KEY));
}

function getAttributionPayload() {
    const params = new URLSearchParams(window.location.search);
    const utm = {
        source: params.get("utm_source") || null,
        medium: params.get("utm_medium") || null,
        campaign: params.get("utm_campaign") || null,
        term: params.get("utm_term") || null,
        content: params.get("utm_content") || null,
    };

    return {
        source: utm.source || "website",
        medium: utm.medium || "organic",
        campaign: utm.campaign || null,
        term: utm.term,
        content: utm.content,
        channel: "web",
        landingPath: window.location.pathname,
        landingUrl: window.location.href,
        referrer: document.referrer || null,
    };
}

async function getAppCheckHeader() {
    if (!window.oriaFirebase || typeof window.oriaFirebase.getAppCheckToken !== "function") {
        return {};
    }
    const token = await window.oriaFirebase.getAppCheckToken();
    if (!token) return {};
    return { "X-Firebase-AppCheck": token };
}

function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function initializeChrome() {
    const header = document.querySelector('.site-header');
    const navbar = document.querySelector('.navbar');
    const hero = document.querySelector('.hero');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    const syncHeader = () => {
        const scrolled = window.scrollY > 40;
        if (header) {
            header.classList.toggle('is-scrolled', scrolled);
            if (hero) {
                const heroBottom = hero.offsetTop + hero.offsetHeight;
                header.classList.toggle('is-over-hero', window.scrollY < heroBottom - 80);
            }
        }
        if (navbar) {
            navbar.classList.toggle('scrolled', scrolled);
        }
    };

    syncHeader();
    window.addEventListener('scroll', syncHeader, { passive: true });

    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            const open = navLinks.classList.toggle('is-open');
            mobileToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
            mobileToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
        });

        navLinks.querySelectorAll('a').forEach((link) => {
            link.addEventListener('click', () => {
                navLinks.classList.remove('is-open');
                mobileToggle.setAttribute('aria-expanded', 'false');
                mobileToggle.setAttribute('aria-label', 'Open menu');
            });
        });
    }
}

function initializeValues() {
    const items = Array.from(document.querySelectorAll('.value-item'));
    if (!items.length) return;

    items.forEach((item) => {
        item.addEventListener('mouseenter', () => {
            items.forEach((el) => el.classList.remove('is-active'));
            item.classList.add('is-active');
        });
        item.addEventListener('focus', () => {
            items.forEach((el) => el.classList.remove('is-active'));
            item.classList.add('is-active');
        });
        item.addEventListener('click', () => {
            items.forEach((el) => el.classList.remove('is-active'));
            item.classList.add('is-active');
        });
    });
}

function initializeAnimations() {
    initializeChrome();
    initializeValues();

    if (typeof gsap === 'undefined' || prefersReducedMotion()) {
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Hero entrance
    if (document.querySelector('.hero-title')) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo('.hero-brand', { y: 24, opacity: 0 }, { y: 0, opacity: 1, duration: 1 })
            .fromTo('.hero-italic', { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 1.15 }, '-=0.65')
            .fromTo('.hero-roman', { y: 48, opacity: 0 }, { y: 0, opacity: 1, duration: 1.15 }, '-=0.85')
            .fromTo('.hero-subtitle', { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9 }, '-=0.55')
            .fromTo('.hero-actions', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8 }, '-=0.45')
            .fromTo('.hero-scroll-hint', { opacity: 0 }, { opacity: 1, duration: 0.6 }, '-=0.2');

        gsap.to('.hero-wash', {
            yPercent: 28,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });

        gsap.to('.hero-inner', {
            yPercent: 12,
            opacity: 0.35,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });
    }

    // Featured parallax
    if (document.querySelector('.featured-img')) {
        gsap.fromTo('.featured-card',
            { y: 60, opacity: 0 },
            {
                y: 0,
                opacity: 1,
                duration: 1.1,
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: '.featured',
                    start: 'top 80%',
                },
            }
        );

        gsap.to('.featured-img', {
            yPercent: 12,
            ease: 'none',
            scrollTrigger: {
                trigger: '.featured',
                start: 'top bottom',
                end: 'bottom top',
                scrub: true,
            },
        });
    }

    // Vision storytelling
    if (document.querySelector('.vision-grid')) {
        gsap.from('.vision-sticky .display-heading', {
            y: 40,
            opacity: 0,
            duration: 1,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.vision', start: 'top 75%' },
        });

        gsap.utils.toArray('.vision-scroll p, .vision-art').forEach((el, i) => {
            gsap.from(el, {
                y: 50,
                opacity: 0,
                duration: 1,
                delay: i * 0.08,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 85%' },
            });
        });

        if (document.querySelector('.vision-art img')) {
            gsap.to('.vision-art img', {
                yPercent: 10,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.vision-art',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: true,
                },
            });
        }
    }

    // Capability cards stagger
    gsap.utils.toArray('.cap-card').forEach((card, i) => {
        gsap.from(card, {
            y: 48,
            opacity: 0,
            duration: 0.9,
            delay: (i % 5) * 0.06,
            ease: 'power3.out',
            scrollTrigger: { trigger: card, start: 'top 88%' },
        });
    });

    // Mission band
    if (document.querySelector('.mission')) {
        gsap.from('.mission-heading, .mission-body', {
            y: 40,
            opacity: 0,
            duration: 1.1,
            stagger: 0.15,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.mission', start: 'top 75%' },
        });

        gsap.to('.mission-orb-a', {
            y: 120,
            x: 40,
            ease: 'none',
            scrollTrigger: {
                trigger: '.mission',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2,
            },
        });

        gsap.to('.mission-orb-b', {
            y: -90,
            x: -30,
            ease: 'none',
            scrollTrigger: {
                trigger: '.mission',
                start: 'top bottom',
                end: 'bottom top',
                scrub: 1.2,
            },
        });
    }

    // Ecosystem / values / editorial / resolution reveals
    const revealSelectors = [
        '.eco-col',
        '.value-item',
        '.editorial-card',
        '.resolution-invite',
        '.resolution-form-block',
        '.section-intro',
    ];

    revealSelectors.forEach((selector) => {
        gsap.utils.toArray(selector).forEach((el, i) => {
            gsap.from(el, {
                y: 36,
                opacity: 0,
                duration: 0.85,
                delay: Math.min(i * 0.05, 0.3),
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                },
            });
        });
    });
}

function initializeWaitlistForm() {
    const form = document.getElementById('waitlist-form');
    const emailInput = document.getElementById('waitlist-email');
    const submitButton = document.getElementById('waitlist-submit');
    const messageDiv = document.getElementById('waitlist-message');

    if (!form || !emailInput || !submitButton || !messageDiv) {
        return;
    }

    if (!FUNCTIONS_BASE_URL) {
        console.error('[waitlist] Missing runtime functionsBaseUrl config.');
        return;
    }

    async function handleSubmit(e) {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        const email = emailInput.value.trim().toLowerCase();

        if (!email) {
            showWaitlistMessage('Please enter a valid email address', 'error');
            return false;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showWaitlistMessage('Please enter a valid email address', 'error');
            return false;
        }

        submitButton.disabled = true;
        const originalButtonHTML = submitButton.innerHTML;
        submitButton.innerHTML = '<span>Processing...</span>';
        messageDiv.textContent = '';

        try {
            const referralCode = getReferralCodeForAttribution();
            const attribution = getAttributionPayload();
            const appCheckHeader = await getAppCheckHeader();
            const response = await fetch(`${FUNCTIONS_BASE_URL}/publicJoinNewsletter`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...appCheckHeader,
                },
                body: JSON.stringify({
                    email,
                    referralCode: referralCode || null,
                    attribution,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.error || "Failed to submit waitlist");
            }

            if (typeof window.gtag === "function") {
                window.gtag("event", "newsletter_subscribed_web", {
                    status: data.alreadySubscribed ? "already_subscribed" : "new",
                    source: attribution.source || "website",
                    medium: attribution.medium || "organic",
                    campaign: attribution.campaign || "none",
                });
            }

            showWaitlistMessage("Thanks! You're signed up. Watch your inbox for updates and offers.", 'success');
            emailInput.value = '';
        } catch (error) {
            console.error('Error submitting newsletter signup:', error);
            showWaitlistMessage('A connection error occurred. Please try again.', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.innerHTML = originalButtonHTML;
        }

        return false;
    }

    form.addEventListener('submit', handleSubmit);
    submitButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleSubmit(e);
    });
}

function showWaitlistMessage(message, type) {
    const messageDiv = document.getElementById('waitlist-message');
    if (!messageDiv) return;

    messageDiv.textContent = message;
    messageDiv.className = `waitlist-message ${type}`;

    if (type === 'success') {
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'waitlist-message';
                messageDiv.style.opacity = '1';
            }, 300);
        }, 5000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initializeAnimations();
    setTimeout(() => {
        initializeWaitlistForm();
    }, 100);
});
