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
            let overDark = false;
            if (hero) {
                overDark = hero.getBoundingClientRect().bottom > 80;
            }
            const values = document.querySelector('.values');
            if (values) {
                const vr = values.getBoundingClientRect();
                if (vr.top < 80 && vr.bottom > 80) overDark = true;
            }
            header.classList.toggle('is-scrolled', scrolled && !overDark);
            header.classList.toggle('is-over-hero', overDark);
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

function initializeAnimations() {
    initializeChrome();

    if (typeof gsap === 'undefined' || prefersReducedMotion()) {
        document.querySelectorAll('.value-slide, .vision-slide').forEach((slide, i) => {
            const group = slide.classList.contains('value-slide') ? '.value-slide' : '.vision-slide';
            const siblings = slide.parentElement?.querySelectorAll(group);
            const index = siblings ? Array.from(siblings).indexOf(slide) : i;
            slide.classList.toggle('is-active', index === 0);
            if (prefersReducedMotion()) {
                slide.style.position = 'relative';
                slide.style.opacity = '1';
                slide.style.visibility = 'visible';
                slide.style.transform = 'none';
                slide.style.gridArea = 'auto';
                slide.style.marginBottom = '2.5rem';
            }
        });
        return;
    }

    gsap.registerPlugin(ScrollTrigger);

    // Hero entrance — clean cut into next section
    if (document.querySelector('.hero-title')) {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
        tl.fromTo('.hero-italic', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 })
            .fromTo('.hero-roman', { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.1 }, '-=0.8')
            .fromTo('.hero-subtitle', { y: 16, opacity: 0 }, { y: 0, opacity: 1, duration: 0.85 }, '-=0.5')
            .fromTo('.hero-actions', { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.75 }, '-=0.4')
            .fromTo('.hero-scroll-hint', { opacity: 0 }, { opacity: 0.45, duration: 0.5 }, '-=0.2');

        gsap.to('.hero-wash', {
            yPercent: 12,
            ease: 'none',
            scrollTrigger: {
                trigger: '.hero',
                start: 'top top',
                end: 'bottom top',
                scrub: true,
            },
        });
    }

    // Vision — pinned: giant type + drifting data fragments that converge into wisdom
    const visionPin = document.querySelector('.vision-pin');
    const visionSlides = gsap.utils.toArray('.vision-slide');
    const visionFill = document.querySelector('.vision-progress-fill');
    const visionBgImg = document.querySelector('.vision-bg-img');
    const fragments = gsap.utils.toArray('.fragment');

    // Record each fragment's offset from the section center for convergence
    fragments.forEach((frag) => {
        const left = parseFloat(frag.style.left) || 50;
        const top = parseFloat(frag.style.top) || 50;
        frag._dx = (50 - left) / 100;
        frag._dy = (50 - top) / 100;
        frag._depth = parseFloat(frag.dataset.depth) || 1;
    });

    if (visionPin && visionSlides.length) {
        let visionActive = 0;
        const setVision = (index) => {
            const next = Math.max(0, Math.min(visionSlides.length - 1, index));
            if (next === visionActive && visionSlides[next].classList.contains('is-active')) return;
            visionActive = next;
            visionSlides.forEach((slide, i) => {
                slide.classList.toggle('is-active', i === next);
            });
        };

        setVision(0);

        ScrollTrigger.create({
            trigger: visionPin,
            start: 'top top',
            end: () => `+=${visionSlides.length * 95}%`,
            pin: true,
            scrub: 0.4,
            anticipatePin: 1,
            onUpdate: (self) => {
                const p = self.progress;
                if (visionFill) gsap.set(visionFill, { width: `${p * 100}%` });
                if (visionBgImg) {
                    gsap.set(visionBgImg, {
                        scale: 1.08 + p * 0.08,
                        yPercent: p * 6,
                    });
                }
                // Fragments drift with parallax, then converge + fade toward center
                fragments.forEach((frag) => {
                    const drift = (1 - p) * 40 * frag._depth;
                    const conv = p * p;
                    gsap.set(frag, {
                        xPercent: frag._dx * conv * 260,
                        yPercent: (frag._dy * conv * 260) - drift,
                        opacity: gsap.utils.clamp(0, 1, (1 - conv * 1.35)),
                        scale: 1 - conv * 0.35,
                    });
                });
                const idx = Math.min(
                    visionSlides.length - 1,
                    Math.floor(p * visionSlides.length + 0.001)
                );
                setVision(idx);
            },
        });
    }

    // Capabilities — pinned horizontal scrub
    const capPin = document.querySelector('.cap-pin');
    const capRail = document.querySelector('.cap-rail');
    const capViewport = document.querySelector('.cap-viewport');
    const capFill = document.querySelector('.cap-progress-fill');

    if (capPin && capRail && capViewport) {
        const mm = gsap.matchMedia();

        mm.add('(min-width: 769px)', () => {
            // Account for the viewport's left padding so the last card ends fully in view
            const getDistance = () => {
                const padLeft = parseFloat(getComputedStyle(capViewport).paddingLeft) || 0;
                return Math.max(0, capRail.scrollWidth - capViewport.clientWidth + padLeft);
            };
            const cards = gsap.utils.toArray('.cap-card');

            gsap.set(capRail, { x: 0 });

            const tween = gsap.to(capRail, {
                x: () => -getDistance(),
                ease: 'none',
                scrollTrigger: {
                    trigger: capPin,
                    start: 'top top',
                    end: () => `+=${Math.max(getDistance() * 1.2, window.innerHeight * 1.8)}`,
                    pin: true,
                    scrub: 0.7,
                    anticipatePin: 1,
                    invalidateOnRefresh: true,
                    onUpdate: (self) => {
                        if (capFill) gsap.set(capFill, { width: `${self.progress * 100}%` });
                        const local = self.progress * Math.max(cards.length - 1, 1);
                        cards.forEach((card, i) => {
                            const dist = Math.abs(local - i);
                            gsap.set(card, {
                                scale: gsap.utils.clamp(0.94, 1, 1 - dist * 0.045),
                                opacity: gsap.utils.clamp(0.55, 1, 1 - dist * 0.18),
                            });
                        });
                    },
                },
            });

            return () => {
                tween.scrollTrigger?.kill();
                tween.kill();
                gsap.set(capRail, { clearProps: 'transform' });
                gsap.set(cards, { clearProps: 'transform,opacity' });
            };
        });

        mm.add('(max-width: 768px)', () => {
            capViewport.style.overflowX = 'auto';
            gsap.utils.toArray('.cap-card').forEach((card, i) => {
                gsap.from(card, {
                    y: 36,
                    opacity: 0,
                    duration: 0.8,
                    delay: i * 0.05,
                    ease: 'power3.out',
                    scrollTrigger: { trigger: card, start: 'top 90%' },
                });
            });
        });
    }

    // Mission
    if (document.querySelector('.mission')) {
        gsap.from('.mission-eyebrow, .mission-heading, .mission-body', {
            y: 42,
            opacity: 0,
            duration: 1.1,
            stagger: 0.14,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.mission', start: 'top 72%' },
        });

        const missionParallax = [
            ['.mission-orb-a', { y: 120, x: 50 }],
            ['.mission-orb-b', { y: -90, x: -40 }],
            ['.mission-orb-c', { y: 70, x: -30 }],
        ];
        missionParallax.forEach(([sel, vars]) => {
            if (!document.querySelector(sel)) return;
            gsap.to(sel, {
                ...vars,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.mission',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.2,
                },
            });
        });
    }

    // Ecosystem — full-height with drifting orbs + staggered column reveal
    if (document.querySelector('.ecosystem')) {
        gsap.from('.ecosystem .section-intro', {
            y: 36,
            opacity: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.ecosystem', start: 'top 70%' },
        });

        gsap.from('.eco-col', {
            y: 48,
            opacity: 0,
            duration: 0.9,
            stagger: 0.12,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.eco-grid', start: 'top 80%' },
        });

        [['.eco-orb-a', { y: 90, x: -40 }], ['.eco-orb-b', { y: -70, x: 40 }]].forEach(([sel, vars]) => {
            if (!document.querySelector(sel)) return;
            gsap.to(sel, {
                ...vars,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.ecosystem',
                    start: 'top bottom',
                    end: 'bottom top',
                    scrub: 1.2,
                },
            });
        });
    }

    // Values — pinned dramatic giant type
    const valuesPin = document.querySelector('.values-pin');
    const slides = gsap.utils.toArray('.value-slide');
    const valuesFill = document.querySelector('.values-progress-fill');

    if (valuesPin && slides.length) {
        let active = 0;
        const intro = document.querySelector('.values-intro');
        const setSlide = (index) => {
            const next = Math.max(0, Math.min(slides.length - 1, index));
            if (next === active && slides[next].classList.contains('is-active')) return;
            active = next;
            slides.forEach((slide, i) => {
                slide.classList.toggle('is-active', i === next);
            });
        };

        setSlide(0);

        ScrollTrigger.create({
            trigger: valuesPin,
            start: 'top top',
            end: () => `+=${slides.length * 90}%`,
            pin: true,
            scrub: 0.4,
            anticipatePin: 1,
            onUpdate: (self) => {
                if (valuesFill) gsap.set(valuesFill, { width: `${self.progress * 100}%` });
                if (intro) intro.classList.toggle('is-dimmed', self.progress > 0.04);
                const idx = Math.min(
                    slides.length - 1,
                    Math.floor(self.progress * slides.length + 0.001)
                );
                setSlide(idx);

                const activeSlide = slides[idx];
                const giant = activeSlide?.querySelector('.value-giant');
                if (giant) {
                    const local = (self.progress * slides.length) % 1;
                    const pulse = 0.97 + Math.sin(local * Math.PI) * 0.03;
                    gsap.set(giant, { scale: pulse });
                }
            },
        });
    }

    // Blog — editorial rows reveal in sequence
    if (document.querySelector('.editorial-grid')) {
        gsap.from('.philosophy-head', {
            y: 32,
            opacity: 0,
            duration: 0.85,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.philosophy', start: 'top 75%' },
        });

        gsap.from('.editorial-card', {
            y: 30,
            opacity: 0,
            duration: 0.7,
            stagger: 0.1,
            ease: 'power3.out',
            scrollTrigger: { trigger: '.editorial-grid', start: 'top 85%' },
        });
    }

    // Soft reveals
    const revealSelectors = [
        '.resolution-center .section-intro',
        '.resolution-form-block',
        '.capabilities .section-intro',
    ];

    revealSelectors.forEach((selector) => {
        gsap.utils.toArray(selector).forEach((el, i) => {
            gsap.from(el, {
                y: 32,
                opacity: 0,
                duration: 0.85,
                delay: Math.min(i * 0.05, 0.25),
                ease: 'power3.out',
                scrollTrigger: {
                    trigger: el,
                    start: 'top 90%',
                },
            });
        });
    });

    window.addEventListener('load', () => ScrollTrigger.refresh());
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
