/* TransiGo — script.js refondu
   - Scroll reveal animations
   - Header sticky behavior
   - Cursor glow effect
   - Formulaire de contact avec validation améliorée
   - Navigation active
   - Mobile menu
*/

document.addEventListener("DOMContentLoaded", function () {

    /* ========================
       CURSOR GLOW
    ======================== */
    const cursorGlow = document.getElementById("cursorGlow");

    if (cursorGlow && window.matchMedia("(pointer: fine)").matches) {
        document.addEventListener("mousemove", (e) => {
            cursorGlow.style.left = e.clientX + "px";
            cursorGlow.style.top = e.clientY + "px";
            cursorGlow.style.opacity = "1";
        });
        document.addEventListener("mouseleave", () => {
            cursorGlow.style.opacity = "0";
        });
    }

    /* ========================
       HEADER SCROLL BEHAVIOR
    ======================== */
    const header = document.getElementById("header");

    if (header) {
        const handleScroll = () => {
            if (window.scrollY > 20) {
                header.classList.add("scrolled");
            } else {
                header.classList.remove("scrolled");
            }
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        handleScroll();
    }

    /* ========================
       ACTIVE NAV LINK
    ======================== */
    const sections = document.querySelectorAll("section[id]");
    const navLinks = document.querySelectorAll(".nav-link");

    const observerNav = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute("id");
                navLinks.forEach(link => {
                    link.classList.remove("active");
                    if (link.getAttribute("href") === `#${id}`) {
                        link.classList.add("active");
                    }
                });
            }
        });
    }, { rootMargin: "-40% 0px -50% 0px" });

    sections.forEach(section => observerNav.observe(section));

    /* ========================
       MOBILE MENU
    ======================== */
    const menuToggle = document.getElementById("menuToggle");
    const nav = document.querySelector("header nav");

    if (menuToggle && nav) {
        menuToggle.addEventListener("click", () => {
            nav.classList.toggle("open");
            const spans = menuToggle.querySelectorAll("span");
            if (nav.classList.contains("open")) {
                spans[0].style.transform = "translateY(7px) rotate(45deg)";
                spans[1].style.opacity = "0";
                spans[2].style.transform = "translateY(-7px) rotate(-45deg)";
            } else {
                spans[0].style.transform = "";
                spans[1].style.opacity = "";
                spans[2].style.transform = "";
            }
        });

        // Close on nav link click
        nav.querySelectorAll("a").forEach(link => {
            link.addEventListener("click", () => {
                nav.classList.remove("open");
                menuToggle.querySelectorAll("span").forEach(s => {
                    s.style.transform = "";
                    s.style.opacity = "";
                });
            });
        });
    }

    /* ========================
       SCROLL REVEAL
    ======================== */
    const revealTargets = document.querySelectorAll(".step-card, .poss-card");

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, {
        threshold: 0.15,
        rootMargin: "0px 0px -60px 0px"
    });

    revealTargets.forEach(el => revealObserver.observe(el));

    /* ========================
       SMOOTH ANCHOR SCROLL
    ======================== */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener("click", function (e) {
            const href = this.getAttribute("href");
            if (href === "#") return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: "smooth" });
        });
    });

    /* ========================
       FORMULAIRE DE CONTACT
    ======================== */
    const form = document.getElementById("contactForm");
    const formMsg = document.getElementById("formMsg");

    if (form) {
        // Float label animation
        const inputs = form.querySelectorAll("input[type='text'], textarea");
        inputs.forEach(input => {
            input.addEventListener("focus", () => {
                input.parentElement.classList.add("focused");
            });
            input.addEventListener("blur", () => {
                if (!input.value) {
                    input.parentElement.classList.remove("focused");
                }
            });
        });

        form.addEventListener("submit", function (e) {
            e.preventDefault();

            const name = document.getElementById("name").value.trim();
            const email = document.getElementById("email").value.trim();

            // Reset previous errors
            clearErrors();

            let hasError = false;

            if (name === "") {
                showFieldError("name", "Ce champ est requis.");
                hasError = true;
            } else if (name.length < 2) {
                showFieldError("name", "Minimum 2 caractères.");
                hasError = true;
            }

            if (email === "") {
                showFieldError("email", "Ce champ est requis.");
                hasError = true;
            } else if (!validateEmail(email)) {
                showFieldError("email", "Veuillez entrer un email valide.");
                hasError = true;
            }

            if (hasError) return;

            // Disable button during submission
            const btn = form.querySelector(".btn-submit");
            const btnText = btn.querySelector(".btn-text");
            const originalText = btnText.textContent;

            btn.disabled = true;
            btn.style.opacity = "0.7";
            btnText.textContent = "Envoi en cours...";

            // Simulate async + submit
            setTimeout(() => {
                showFormMessage(`✓ Merci ${name} ! Votre message a bien été envoyé.`, "success");
                btn.disabled = false;
                btn.style.opacity = "";
                btnText.textContent = originalText;

                // Actual form submit to PHP
                form.submit();
            }, 800);
        });
    }

    function showFieldError(fieldId, msg) {
        const field = document.getElementById(fieldId);
        if (!field) return;
        field.style.borderColor = "#cc3333";
        const err = document.createElement("span");
        err.className = "field-error";
        err.textContent = msg;
        err.style.cssText = "display:block;margin-top:6px;font-size:12px;color:#cc3333;font-family:'DM Mono',monospace;";
        field.parentElement.appendChild(err);
    }

    function clearErrors() {
        document.querySelectorAll(".field-error").forEach(el => el.remove());
        document.querySelectorAll("input, textarea").forEach(el => {
            el.style.borderColor = "";
        });
        if (formMsg) {
            formMsg.textContent = "";
            formMsg.className = "form-message";
        }
    }

    function showFormMessage(msg, type) {
        if (!formMsg) return;
        formMsg.textContent = msg;
        formMsg.className = `form-message ${type} show`;
    }

    function validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    /* ========================
       PARALLAX HERO ORBS
    ======================== */
    const orb1 = document.querySelector(".hero-orb-1");
    const orb2 = document.querySelector(".hero-orb-2");

    if (orb1 && orb2 && window.matchMedia("(pointer: fine)").matches) {
        window.addEventListener("mousemove", (e) => {
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const dx = (e.clientX - cx) / cx;
            const dy = (e.clientY - cy) / cy;
            orb1.style.transform = `translate(${dx * -20}px, ${dy * -20}px)`;
            orb2.style.transform = `translate(${dx * 15}px, ${dy * 15}px)`;
        });
    }

    /* ========================
       STEP CARD TILT (subtle)
    ======================== */
    document.querySelectorAll(".step-card").forEach(card => {
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;
            card.style.transform = `translateY(-4px) perspective(600px) rotateY(${x * 4}deg) rotateX(${-y * 4}deg)`;
        });
        card.addEventListener("mouseleave", () => {
            card.style.transform = "";
        });
    });

});
