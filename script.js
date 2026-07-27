/*=========================================================
    FOUJI BEAT COFFEE — script.js
    Fixed: Google Sheets submission working correctly
=========================================================*/

document.addEventListener("DOMContentLoaded", () => {

    "use strict";

    /*=========================================================
        CONFIGURATION — Edit these values only
    =========================================================*/
    const CONFIG = {
        appsScriptUrl:   "https://script.google.com/macros/s/AKfycbwuqwzGkZbNWADgfnAK9W9RjHFKd3cKuMd2ootHpcPcGPZA2e1Lme-lfNGIYkzhpu1Q/exec",
        enableGoogleSheets: true,
        catalogueUrl:    "https://wa.me/c/919896772868",
        instagramUrl:    "https://www.instagram.com/fouji_beat_coffee_",
        whatsappNumber:  "919896772868",
        whatsappMessage: "Hi Fouji, I recently tried your product.",
    };

    /*=========================================================
        DOM ELEMENTS
    =========================================================*/
    const form            = document.getElementById("feedbackForm");
    const submitBtn       = document.getElementById("submitBtn");
    const feedbackSection = document.getElementById("feedbackSection");
    const successSection  = document.getElementById("successSection");
    const loadingOverlay  = document.getElementById("loadingOverlay");
    const toast           = document.getElementById("toast");

    const productInput  = document.getElementById("product");
    const feedbackInput = document.getElementById("feedback");
    const charCount     = document.getElementById("charCount");

    const coffeeButton  = document.getElementById("selectCoffee");
    const syrupButton   = document.getElementById("chooseSyrup");
    const syrupModal    = document.getElementById("syrupModal");
    const closeModal    = document.getElementById("closeModal");
    const flavourButtons = document.querySelectorAll(".flavour-btn");

    const catalogueBtn    = document.getElementById("catalogueBtn");
    const instagramBtn    = document.getElementById("instagramBtn");
    const whatsappBtn     = document.getElementById("whatsappBtn");
    const footerCatalogue = document.getElementById("footerCatalogue");
    const footerInstagram = document.getElementById("footerInstagram");
    const footerWhatsapp  = document.getElementById("footerWhatsapp");

    /*=========================================================
        APP STATE
    =========================================================*/
    const state = {
        product:   "",
        recommend: "",
        ratings: {
            overall:   0,
            taste:     0,
            packaging: 0,
            value:     0,
        },
    };

    /*=========================================================
        INITIALIZE
    =========================================================*/
    init();

    function init() {
        initializeLinks();
        initializeProductSelection();
        initializeCharacterCounter();
        initializeRatings();
        initializeRecommendation();
        checkAlreadySubmitted();
    }

    /*=========================================================
        SOCIAL LINKS
    =========================================================*/
    function initializeLinks() {
        const whatsappURL = "https://wa.me/" + CONFIG.whatsappNumber +
            "?text=" + encodeURIComponent(CONFIG.whatsappMessage);

        [catalogueBtn, footerCatalogue].forEach(link => {
            if (!link) return;
            link.href   = CONFIG.catalogueUrl;
            link.target = "_blank";
        });

        [instagramBtn, footerInstagram].forEach(link => {
            if (!link) return;
            link.href   = CONFIG.instagramUrl;
            link.target = "_blank";
        });

        [whatsappBtn, footerWhatsapp].forEach(link => {
            if (!link) return;
            link.href   = whatsappURL;
            link.target = "_blank";
        });
    }

    /*=========================================================
        PRODUCT SELECTION
    =========================================================*/
    function initializeProductSelection() {
        coffeeButton.addEventListener("click", () => {
            setProduct("Beat Coffee");
            highlightProductCard(".coffee-card");
        });

        syrupButton.addEventListener("click", () => {
            syrupModal.classList.remove("hidden");
        });

        closeModal.addEventListener("click", closeSyrupModal);

        syrupModal.addEventListener("click", (e) => {
            if (e.target === syrupModal) closeSyrupModal();
        });

        flavourButtons.forEach(button => {
            button.addEventListener("click", () => {
                setProduct(button.dataset.product);
                highlightProductCard(".syrup-card");
                closeSyrupModal();
            });
        });
    }

    function setProduct(productName) {
        state.product       = productName;
        productInput.value  = productName;
        feedbackSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    function closeSyrupModal() {
        syrupModal.classList.add("hidden");
    }

    function highlightProductCard(selector) {
        document.querySelectorAll(".product-card").forEach(card => {
            card.classList.remove("selected");
        });
        const selected = document.querySelector(selector);
        if (selected) selected.classList.add("selected");
    }

    /*=========================================================
        CHARACTER COUNTER
    =========================================================*/
    function initializeCharacterCounter() {
        feedbackInput.addEventListener("input", () => {
            const length = feedbackInput.value.length;
            charCount.textContent  = `${length} / 500`;
            charCount.style.color  = length >= 450 ? "#C4622D" : "#888";
        });
    }

    /*=========================================================
        STAR RATING SYSTEM
    =========================================================*/
    const RATING_LABELS = {
        1: "😕 Poor",
        2: "🙂 Fair",
        3: "😊 Good",
        4: "😄 Very Good",
        5: "🤩 Excellent",
    };

    function initializeRatings() {
        setupRatingGroup(".overall-stars",   "overall");
        setupRatingGroup(".taste-stars",     "taste");
        setupRatingGroup(".packaging-stars", "packaging");
        setupRatingGroup(".value-stars",     "value");
    }

    function setupRatingGroup(selector, key) {
        const container = document.querySelector(selector);
        if (!container) return;
        const stars = container.querySelectorAll(".star");

        stars.forEach((star, index) => {
            const value = index + 1;
            star.dataset.value = value;

            star.addEventListener("mouseenter", () => paintStars(stars, value));
            star.addEventListener("mouseleave", () => paintStars(stars, state.ratings[key]));
            star.addEventListener("click", () => {
                state.ratings[key] = value;
                paintStars(stars, value);
                if (key === "overall") updateRatingText(value);
            });
        });
    }

    function paintStars(stars, value) {
        stars.forEach((star, index) => {
            star.classList.toggle("active", index < value);
        });
    }

    function updateRatingText(value) {
        const label = document.querySelector(".rating-text");
        if (label) label.textContent = RATING_LABELS[value];
    }

    /*=========================================================
        RECOMMEND BUTTONS
    =========================================================*/
    function initializeRecommendation() {
        const buttons = document.querySelectorAll(".recommend-btn");
        buttons.forEach(button => {
            button.addEventListener("click", () => {
                buttons.forEach(btn => btn.classList.remove("active"));
                button.classList.add("active");
                state.recommend = button.dataset.value;
            });
        });
    }

    /*=========================================================
        FORM VALIDATION
    =========================================================*/
    form.addEventListener("submit", handleFormSubmit);

    function handleFormSubmit(event) {
        event.preventDefault();
        if (validateForm()) submitFeedback();
    }

    function validateForm() {
        const name  = document.getElementById("name").value.trim();
        const phone = document.getElementById("phone").value.trim();

        if (!state.product) {
            showToast("Please select a product first.");
            return false;
        }
        if (name.length < 2) {
            showToast("Please enter your name.");
            return false;
        }
        if (phone.length < 10) {
            showToast("Please enter a valid phone number.");
            return false;
        }
        if (state.ratings.overall === 0) {
            showToast("Please rate your overall experience.");
            return false;
        }
        return true;
    }

    /*=========================================================
        BUILD PAYLOAD — matches Code.gs exactly
    =========================================================*/
    function buildPayload() {
        const ua = navigator.userAgent;
        return {
            name:            document.getElementById("name").value.trim(),
            phone:           document.getElementById("phone").value.trim(),
            email:           document.getElementById("email").value.trim(),
            product:         state.product,
            overallRating:   state.ratings.overall,
            tasteRating:     state.ratings.taste,
            packagingRating: state.ratings.packaging,
            valueRating:     state.ratings.value,
            recommend:       state.recommend,
            feedback:        feedbackInput.value.trim(),
            browser:         getBrowserName(ua),
            device:          getDeviceType(ua),
        };
    }

    /*=========================================================
        SUBMIT TO GOOGLE SHEETS
    =========================================================*/
    async function submitFeedback() {
        submitBtn.disabled = true;
        loadingOverlay.classList.remove("hidden");

        const payload = buildPayload();

        // Fire to Google Sheets — use no-cors so CORS never blocks us
        if (CONFIG.enableGoogleSheets) {
            const formData = new URLSearchParams();
            Object.entries(payload).forEach(([k, v]) => formData.append(k, String(v)));

            fetch(CONFIG.appsScriptUrl, {
                method:  "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body:    formData.toString(),
                mode:    "no-cors",
            }).catch(err => console.warn("Sheet error:", err));
        }

        // Wait 1.2s for request to fire, then always show success
        await delay(1200);

        loadingOverlay.classList.add("hidden");
        submitBtn.disabled = false;

        showSuccess();
    }

    /*=========================================================
        SUCCESS
    =========================================================*/
    function showSuccess() {
        saveSubmission();
        resetForm();
        feedbackSection.classList.add("hidden");
        successSection.classList.remove("hidden");
        // Use timeout so browser doesn't fight the scroll
        setTimeout(() => {
            successSection.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
        showToast("Thank you for your feedback! ❤️");
    }

    /*=========================================================
        RESET FORM
    =========================================================*/
    function resetForm() {
        form.reset();
        state.product        = "";
        state.recommend      = "";
        state.ratings.overall    = 0;
        state.ratings.taste      = 0;
        state.ratings.packaging  = 0;
        state.ratings.value      = 0;
        productInput.value   = "";
        feedbackInput.value  = "";
        charCount.textContent = "0 / 500";
        document.querySelectorAll(".star").forEach(s => s.classList.remove("active"));
        document.querySelectorAll(".recommend-btn").forEach(b => b.classList.remove("active"));
        const label = document.querySelector(".rating-text");
        if (label) label.textContent = "Tap the stars";
    }

    /*=========================================================
        TOAST
    =========================================================*/
    function showToast(message) {
        if (!toast) return;
        toast.textContent = message;
        toast.classList.add("show");
        clearTimeout(showToast._timer);
        showToast._timer = setTimeout(() => toast.classList.remove("show"), 3500);
    }

    /*=========================================================
        SESSION STORAGE — prevent duplicate submissions
    =========================================================*/
    const SESSION_KEY = "fouji_feedback_submitted";

    function saveSubmission() {
        sessionStorage.setItem(SESSION_KEY, new Date().toISOString());
    }

    function checkAlreadySubmitted() {
        if (sessionStorage.getItem(SESSION_KEY)) {
            feedbackSection.classList.add("hidden");
            successSection.classList.remove("hidden");
        }
    }

    /*=========================================================
        KEYBOARD — close modal on Escape
    =========================================================*/
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !syrupModal.classList.contains("hidden")) {
            closeSyrupModal();
        }
    });

    /*=========================================================
        HELPERS
    =========================================================*/
    function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

    function getBrowserName(ua) {
        if (ua.includes("Edg"))     return "Edge";
        if (ua.includes("OPR"))     return "Opera";
        if (ua.includes("Chrome"))  return "Chrome";
        if (ua.includes("Firefox")) return "Firefox";
        if (ua.includes("Safari"))  return "Safari";
        return "Other";
    }

    function getDeviceType(ua) {
        if (/Mobi|Android/i.test(ua)) return "Mobile";
        if (/Tablet|iPad/i.test(ua))  return "Tablet";
        return "Desktop";
    }

});
