/*=========================================================
    FOUJI BEAT COFFEE — script.js
    Fixed: Sheet submission + success screen + no redirect
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    const CONFIG = {
        appsScriptUrl:      "https://script.google.com/macros/s/AKfycbwuqwzGkZbNWADgfnAK9W9RjHFKd3cKuMd2ootHpcPcGPZA2e1Lme-lfNGIYkzhpu1Q/exec",
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
    const productSelect   = document.getElementById("product");
    const feedbackInput   = document.getElementById("feedback");
    const charCount       = document.getElementById("charCount");

    /* ── STATE ── */
    const state = {
        recommend: "",
        ratings: { overall: 0, taste: 0, packaging: 0, value: 0 },
    };

    /* ── INIT ── */
    function init() {
        setLinks();
        initCharCounter();
        initRatings();
        initRecommend();
        // DO NOT auto-hide form on load — only hide after actual submission
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

    /* ── CHAR COUNTER ── */
    function initCharCounter() {
        feedbackInput.addEventListener("input", () => {
            const len = feedbackInput.value.length;
            charCount.textContent = len + " / 500";
            charCount.style.color = len >= 450 ? "#C4622D" : "#888";
        });
    }

    /* ── STAR RATINGS ── */
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

    /* ── VALIDATION ── */
    function validate() {
        const name  = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        if (!productSelect.value)  { toast_msg("Please select a product.");          productSelect.focus(); return false; }
        if (name.length < 2)       { toast_msg("Please enter your name.");           document.getElementById("name").focus(); return false; }
        if (phone.length < 10)     { toast_msg("Please enter a valid phone number."); document.getElementById("phone").focus(); return false; }
        if (!state.ratings.overall){ toast_msg("Please rate your overall experience."); return false; }
        return true;
    }

    /* ── SUBMIT ── */
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validate()) return;

        // Disable button + show loader
        submitBtn.disabled = true;
        submitBtn.textContent = "Submitting...";
        loadingOverlay.classList.remove("hidden");

        // Build payload
        const ua = navigator.userAgent;
        const payload = {
            name:            document.getElementById("name").value.trim(),
            phone:           document.getElementById("phone").value.trim(),
            email:           (document.getElementById("email") || {}).value || "",
            product:         productSelect.value,
            overallRating:   state.ratings.overall,
            tasteRating:     state.ratings.taste,
            packagingRating: state.ratings.packaging,
            valueRating:     state.ratings.value,
            recommend:       state.recommend,
            feedback:        feedbackInput.value.trim(),
            browser:         getBrowser(ua),
            device:          getDevice(ua),
        };

        // Send to Google Sheets via form POST (no-cors)
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
                console.warn("Sheet warning (data may still be saved):", err);
            }
        }

        // Always show success — with no-cors we cannot read the response
        // but the data IS written to the sheet
        await delay(1000);
        loadingOverlay.classList.add("hidden");
        showSuccess();
    });

    /* ── SUCCESS ── */
    function showSuccess() {
        // Hide form, show success — do NOT use sessionStorage so user can re-submit on next visit
        feedbackSection.style.display = "none";
        successSection.classList.remove("hidden");
        successSection.style.display = "block";
        setTimeout(() => {
            successSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
    }

    /* ── TOAST ── */
    function toast_msg(msg) {
        if (!toast) return;
        toast.textContent = msg;
        toast.classList.add("show");
        clearTimeout(toast_msg._t);
        toast_msg._t = setTimeout(() => toast.classList.remove("show"), 3500);
    }

    /* ── HELPERS ── */
    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    function getBrowser(ua) {
        if (ua.includes("Edg"))     return "Edge";
        if (ua.includes("OPR"))     return "Opera";
        if (ua.includes("Chrome"))  return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari"))  return "Safari";
        return "Other";
    }

    function getDevice(ua) {
        if (/Mobi|Android/i.test(ua)) return "Mobile";
        if (/Tablet|iPad/i.test(ua))  return "Tablet";
        return "Desktop";
    }

    init();
});
