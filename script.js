/*=========================================================
    FOUJI BEAT COFFEE — script.js
    Features: Multi-product pills, Reviews ticker,
              Google Sheets submission, Success screen
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /* ── CONFIG ── */
    const CONFIG = {
        appsScriptUrl:      "https://script.google.com/macros/s/AKfycbxDemQKaqUnDlXnr0VEt2pW98wg9CNnjIF7jueLFdtLRTSeeJayppUOQFVJOaYHk4EM/exec",
        enableGoogleSheets: true,
        catalogueUrl:       "https://wa.me/c/919896772868",
        instagramUrl:       "https://www.instagram.com/fouji_beat_coffee_",
        whatsappNumber:     "919896772868",
        whatsappMessage:    "Hi Fouji, I recently tried your product.",
    };

    /* ── DOM ── */
    const form            = document.getElementById("feedbackForm");
    const submitBtn       = document.getElementById("submitBtn");
    const feedbackSection = document.getElementById("feedbackSection");
    const successSection  = document.getElementById("successSection");
    const loadingOverlay  = document.getElementById("loadingOverlay");
    const toast           = document.getElementById("toast");
    const feedbackInput   = document.getElementById("feedback");
    const charCount       = document.getElementById("charCount");
    const productHidden   = document.getElementById("product");
    const productError    = document.getElementById("productError");

    /* ── STATE ── */
    const state = {
        selectedProducts: [],   // array — multi select
        recommend: "",
        ratings: { overall: 0, taste: 0, packaging: 0, value: 0 },
    };

    /* ════════════════════════════════════════════
       INIT
    ════════════════════════════════════════════ */
    function init() {
        setLinks();
        initProductPills();
        initCharCounter();
        initRatings();
        initRecommend();
        initFormSubmit();
        loadReviewsTicker();
        initTickerDrag();
    }

    /* ── LINKS ── */
    function setLinks() {
        const waURL = "https://wa.me/" + CONFIG.whatsappNumber +
            "?text=" + encodeURIComponent(CONFIG.whatsappMessage);
        const map = {
            catalogueBtn:    CONFIG.catalogueUrl,
            instagramBtn:    CONFIG.instagramUrl,
            whatsappBtn:     waURL,
            footerCatalogue: CONFIG.catalogueUrl,
            footerInstagram: CONFIG.instagramUrl,
            footerWhatsapp:  waURL,
        };
        Object.entries(map).forEach(([id, href]) => {
            const el = document.getElementById(id);
            if (el) { el.href = href; el.target = "_blank"; el.rel = "noopener noreferrer"; }
        });
    }

    /* ════════════════════════════════════════════
       MULTI-PRODUCT PILLS
    ════════════════════════════════════════════ */
    function initProductPills() {
        const pills = document.querySelectorAll(".product-pill");
        pills.forEach(pill => {
            pill.addEventListener("click", () => {
                const val = pill.dataset.value;
                const idx = state.selectedProducts.indexOf(val);

                if (idx === -1) {
                    state.selectedProducts.push(val);
                    pill.classList.add("selected");
                } else {
                    state.selectedProducts.splice(idx, 1);
                    pill.classList.remove("selected");
                }

                // Update hidden input with comma-joined values
                productHidden.value = state.selectedProducts.join(", ");

                // Hide error if at least one selected
                if (state.selectedProducts.length > 0) {
                    productError.classList.add("hidden");
                }
            });
        });
    }

    /* ── CHAR COUNTER ── */
    function initCharCounter() {
        feedbackInput.addEventListener("input", () => {
            const len = feedbackInput.value.length;
            charCount.textContent = len + " / 500";
            charCount.style.color = len >= 450 ? "#C4622D" : "#888";
        });
    }

    /* ════════════════════════════════════════════
       STAR RATINGS
    ════════════════════════════════════════════ */
    const LABELS = { 1:"😕 Poor", 2:"🙂 Fair", 3:"😊 Good", 4:"😄 Very Good", 5:"🤩 Excellent" };

    function initRatings() {
        setupStars(".overall-stars",   "overall",   true);
        setupStars(".taste-stars",     "taste",     false);
        setupStars(".packaging-stars", "packaging", false);
        setupStars(".value-stars",     "value",     false);
    }

    function setupStars(selector, key, showLabel) {
        const wrap = document.querySelector(selector);
        if (!wrap) return;
        const stars = wrap.querySelectorAll(".star");
        stars.forEach((star, i) => {
            const val = i + 1;
            star.addEventListener("mouseenter", () => paint(stars, val));
            star.addEventListener("mouseleave", () => paint(stars, state.ratings[key]));
            star.addEventListener("click", () => {
                state.ratings[key] = val;
                paint(stars, val);
                if (showLabel) {
                    const lbl = document.querySelector(".rating-text");
                    if (lbl) lbl.textContent = LABELS[val];
                }
            });
        });
    }

    function paint(stars, val) {
        stars.forEach((s, i) => s.classList.toggle("active", i < val));
    }

    /* ── RECOMMEND ── */
    function initRecommend() {
        document.querySelectorAll(".recommend-btn").forEach(btn => {
            btn.addEventListener("click", () => {
                document.querySelectorAll(".recommend-btn").forEach(b => b.classList.remove("active"));
                btn.classList.add("active");
                state.recommend = btn.dataset.value;
            });
        });
    }

    /* ════════════════════════════════════════════
       FORM SUBMIT
    ════════════════════════════════════════════ */
    function initFormSubmit() {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            if (!validate()) return;

            submitBtn.disabled = true;
            submitBtn.textContent = "Submitting...";
            loadingOverlay.classList.remove("hidden");

            const ua = navigator.userAgent;
            const payload = {
                name:            document.getElementById("name").value.trim(),
                phone:           document.getElementById("phone").value.trim(),
                email:           (document.getElementById("email") || {}).value || "",
                product:         state.selectedProducts.join(", "),
                overallRating:   state.ratings.overall,
                tasteRating:     state.ratings.taste,
                packagingRating: state.ratings.packaging,
                valueRating:     state.ratings.value,
                recommend:       state.recommend,
                feedback:        feedbackInput.value.trim(),
                browser:         getBrowser(ua),
                device:          getDevice(ua),
            };

            if (CONFIG.enableGoogleSheets) {
                try {
                    const body = new URLSearchParams();
                    Object.entries(payload).forEach(([k, v]) => body.append(k, String(v)));
                    await fetch(CONFIG.appsScriptUrl, {
                        method:  "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body:    body.toString(),
                        mode:    "no-cors",
                    });
                } catch (err) {
                    console.warn("Sheet note:", err);
                }
            }

            await delay(1000);
            loadingOverlay.classList.add("hidden");
            submitBtn.disabled = false;
            submitBtn.textContent = "❤️ Submit Feedback";
            showSuccess();
        });
    }

    /* ── VALIDATE ── */
    function validate() {
        const name  = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();

        if (state.selectedProducts.length === 0) {
            productError.classList.remove("hidden");
            document.getElementById("productPills").scrollIntoView({ behavior: "smooth", block: "center" });
            return false;
        }
        if (name.length < 2) {
            showToast("Please enter your name.");
            document.getElementById("name").focus();
            return false;
        }
        if (phone.length < 10) {
            showToast("Please enter a valid phone number.");
            document.getElementById("phone").focus();
            return false;
        }
        if (state.ratings.overall === 0) {
            showToast("Please rate your overall experience.");
            return false;
        }
        return true;
    }

    /* ════════════════════════════════════════════
       SUCCESS SCREEN
    ════════════════════════════════════════════ */
    function showSuccess() {
        feedbackSection.style.display = "none";
        successSection.classList.remove("hidden");
        successSection.style.display = "block";
        setTimeout(() => {
            successSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 80);
        // Re-populate success ticker with latest reviews
        loadReviewsTicker();
        initTickerDrag();
    }

    /* ════════════════════════════════════════════
       REVIEWS TICKER
       - Fetches ONLY from Google Sheet
       - JS requestAnimationFrame infinite loop
       - Smooth drag: touch + mouse, no jump
    ════════════════════════════════════════════ */

    // Per-ticker state
    const tickers = {};

    async function loadReviewsTicker() {
        try {
            const res  = await fetch(CONFIG.appsScriptUrl + "?action=reviews");
            const data = await res.json();

            if (!data.reviews || data.reviews.length === 0) {
                document.getElementById("tickerTrack").innerHTML =
                    '<div class="ticker-empty">Be the first to share your experience!</div>';
                return;
            }

            renderTickers(data.reviews);
            updateAvgRating(data.reviews);

        } catch (err) {
            console.warn("Ticker error:", err);
        }
    }

    function renderTickers(reviews) {
        const cards = reviews.map(r => buildReviewCard(r)).join("");

        // Build both tickers
        setupTicker("tickerTrack",       cards, reviews.length);
        setupTicker("successTickerTrack", cards, reviews.length);
    }

    function setupTicker(trackId, cards, count) {
        const track = document.getElementById(trackId);
        if (!track) return;

        const wrap = track.parentElement;

        // Inject cards — tripled for seamless loop
        track.innerHTML = cards + cards + cards;

        // Stop any existing animation for this ticker
        if (tickers[trackId]) {
            cancelAnimationFrame(tickers[trackId].raf);
        }

        const SPEED  = 0.6; // px per frame
        let offset   = 0;
        let paused   = false;
        let dragging = false;
        let dragStartX   = 0;
        let dragStartOff = 0;
        let lastX    = 0;
        let velocity = 0;
        let lastTime = performance.now();

        function getOneSetWidth() {
            // Width of one set of cards (1/3 of total)
            return track.scrollWidth / 3;
        }

        function tick(now) {
            const dt = Math.min(now - lastTime, 50); // cap delta
            lastTime = now;

            if (!dragging && !paused) {
                offset += SPEED * (dt / 16.67);
                // Apply momentum from drag release
                if (Math.abs(velocity) > 0.1) {
                    offset   += velocity * (dt / 16.67);
                    velocity *= 0.94; // friction
                } else {
                    velocity = 0;
                }
            }

            // Seamless loop — reset when one full set scrolled
            const setW = getOneSetWidth();
            if (setW > 0 && offset >= setW) {
                offset -= setW;
            }
            if (offset < 0) {
                offset += setW;
            }

            track.style.transform = `translateX(${-offset}px)`;
            tickers[trackId].raf = requestAnimationFrame(tick);
        }

        // ── MOUSE DRAG ──
        wrap.addEventListener("mousedown", e => {
            dragging     = true;
            dragStartX   = e.clientX;
            dragStartOff = offset;
            velocity     = 0;
            lastX        = e.clientX;
            wrap.classList.add("dragging");
            e.preventDefault();
        });

        window.addEventListener("mousemove", e => {
            if (!dragging) return;
            const dx = e.clientX - lastX;
            velocity  = -dx * 0.5;
            offset    = dragStartOff - (e.clientX - dragStartX);
            lastX     = e.clientX;
        });

        window.addEventListener("mouseup", () => {
            if (!dragging) return;
            dragging = false;
            wrap.classList.remove("dragging");
        });

        // ── TOUCH DRAG ──
        wrap.addEventListener("touchstart", e => {
            dragging     = true;
            dragStartX   = e.touches[0].clientX;
            dragStartOff = offset;
            velocity     = 0;
            lastX        = e.touches[0].clientX;
        }, { passive: true });

        wrap.addEventListener("touchmove", e => {
            if (!dragging) return;
            const dx = e.touches[0].clientX - lastX;
            velocity  = -dx * 0.5;
            offset    = dragStartOff - (e.touches[0].clientX - dragStartX);
            lastX     = e.touches[0].clientX;
        }, { passive: true });

        wrap.addEventListener("touchend", () => {
            dragging = false;
        });

        // ── HOVER PAUSE ──
        wrap.addEventListener("mouseenter", () => { if (!dragging) paused = true; });
        wrap.addEventListener("mouseleave", () => { paused = false; });

        // Start loop
        tickers[trackId] = { raf: requestAnimationFrame(tick) };
    }

    function buildReviewCard(r) {
        const stars   = "★".repeat(r.rating) + "☆".repeat(5 - r.rating);
        const score   = r.rating + ".0/5";
        const name    = escHtml(r.name    || "Customer");
        const product = escHtml(r.product || "");
        const comment = escHtml(r.feedback || "");
        return \`<div class="review-card">
            <div class="review-card-top">
                <span class="review-name">\${name}</span>
                <div class="review-rating-wrap">
                    <span class="review-stars">\${stars}</span>
                    <span class="review-score">\${score}</span>
                </div>
            </div>
            \${product ? \`<p class="review-product">\${product}</p>\` : ""}
            \${comment ? \`<p class="review-comment">"\${comment}"</p>\` : ""}
        </div>\`;
    }

    function populateSuccessTicker(cards, duration) {
        // Legacy — now handled by setupTicker
    }

    function updateAvgRating(reviews) {
        if (!reviews || reviews.length === 0) return;
        const avg   = reviews.reduce((s, r) => s + (r.rating || 0), 0) / reviews.length;
        const score = avg.toFixed(1);
        const full  = Math.round(avg);
        const stars = "★".repeat(full) + "☆".repeat(5 - full);

        const avgStars = document.getElementById("avgStars");
        const avgScore = document.getElementById("avgScore");
        const avgCount = document.getElementById("avgCount");
        if (avgStars) avgStars.textContent = stars;
        if (avgScore) avgScore.textContent = score + "/5";
        if (avgCount) avgCount.textContent = "(" + reviews.length + " review" + (reviews.length !== 1 ? "s" : "") + ")";

        const trustScore = document.getElementById("trustAvgScore");
        if (trustScore) trustScore.textContent = score + " / 5";
    }

    function escHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }
    init();
});
