const RECAPTCHA_SITE_KEY = "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI";
const recaptchaWidgets = {};
const APPEARANCE_STORAGE_KEY = "srcSportsAcademyAppearance";

// Email validation helper
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.trim().length > 0;
}

function validateEmailInput(emailInputId, feedbackId) {
  const emailInput = document.getElementById(emailInputId);
  const feedbackElement = document.getElementById(feedbackId);
  
  if (!emailInput || !feedbackElement) return true;
  
  const email = emailInput.value.trim();
  emailInput.classList.remove("input-valid", "input-error");
  
  if (!email) {
    feedbackElement.textContent = "⚠️ Please enter your email address.";
    feedbackElement.style.color = "var(--danger)";
    emailInput.classList.add("input-error");
    return false;
  }
  
  if (!isValidEmail(email)) {
    feedbackElement.textContent = "⚠️ Please enter a valid email address (e.g., user@example.com).";
    feedbackElement.style.color = "var(--danger)";
    emailInput.classList.add("input-error");
    return false;
  }
  
  feedbackElement.textContent = "✓ Email is valid.";
  feedbackElement.style.color = "var(--success)";
  emailInput.classList.add("input-valid");
  return true;
}
const defaultAppearance = {
  theme: "light",
  background: "default"
};

function setFeedback(elementId, message, isError) {
  const target = document.getElementById(elementId);

  if (!target) {
    return;
  }

  target.textContent = message;
  target.style.color = isError ? "var(--danger)" : "var(--success)";
}

function saveLocalRecord(key, record) {
  const existing = JSON.parse(localStorage.getItem(key) || "[]");
  existing.unshift(record);
  localStorage.setItem(key, JSON.stringify(existing.slice(0, 8)));
}

function renderForumPosts() {
  const list = document.getElementById("forum-list");

  if (!list) {
    return;
  }

  const posts = JSON.parse(localStorage.getItem("forumPosts") || "[]");

  if (!posts.length) {
    list.innerHTML = '<article class="forum-item forum-empty-state"><strong>No questions yet.</strong><p>Be the first to ask about Wrestling, Taekwondo, Judo, or Volleyball.</p></article>';
    return;
  }

  list.innerHTML = posts
    .map(
      (post) => `
        <article class="forum-item">
          <strong>${post.name}</strong>
          <p>${post.question}</p>
        </article>
      `
    )
    .join("");
}

function loadAppearance() {
  try {
    const saved = JSON.parse(localStorage.getItem(APPEARANCE_STORAGE_KEY) || "{}");
    return {
      theme: saved.theme || defaultAppearance.theme,
      background: saved.background || defaultAppearance.background
    };
  } catch (error) {
    return { ...defaultAppearance };
  }
}

function saveAppearance(appearance) {
  localStorage.setItem(APPEARANCE_STORAGE_KEY, JSON.stringify(appearance));
}

function updateAppearanceUI(appearance) {
  document.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.themeChoice === appearance.theme));
  });

  const select = document.getElementById("appearance-background");
  if (select) {
    select.value = appearance.background;
  }

  // Update header theme toggle icon
  const headerToggle = document.getElementById("header-theme-toggle");
  if (headerToggle) {
    const iconSvg = headerToggle.querySelector("svg");
    if (appearance.theme === "dark") {
      // Moon icon for dark mode
      iconSvg.innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    } else {
      // Sun icon for light mode
      iconSvg.innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
      `;
    }
  }
}

function updateNetworkUI() {
  const videoFallback = document.getElementById("video-fallback");
  const youtubeVideo = document.querySelector(".youtube-video");
  if (videoFallback && youtubeVideo) {
    videoFallback.hidden = navigator.onLine;
    youtubeVideo.hidden = !navigator.onLine;
  }
}

function rerenderRecaptchaForTheme() {
  if (typeof window.grecaptcha === "undefined") {
    return;
  }

  Object.keys(recaptchaWidgets).forEach((key) => {
    delete recaptchaWidgets[key];
  });

  document.querySelectorAll(".recaptcha-widget").forEach((element) => {
    const freshElement = element.cloneNode(false);
    freshElement.dataset.rendered = "false";
    element.replaceWith(freshElement);
  });

  renderRecaptchaWidgets();
}

function applyAppearance(appearance, rerenderRecaptcha = false) {
  document.body.dataset.theme = appearance.theme;
  document.body.dataset.background = appearance.background;
  updateAppearanceUI(appearance);

  if (rerenderRecaptcha) {
    rerenderRecaptchaForTheme();
  }

  updateNetworkUI();
}

function setAppearance(key, value) {
  const appearance = loadAppearance();
  appearance[key] = value;
  saveAppearance(appearance);
  applyAppearance(appearance, key === "theme");
}

function createAppearancePanel() {
  if (document.getElementById("appearance-dock")) {
    return;
  }

  // Create header theme toggle button
  const headerToggle = document.createElement("button");
  headerToggle.type = "button";
  headerToggle.id = "header-theme-toggle";
  headerToggle.className = "header-theme-toggle";
  headerToggle.setAttribute("aria-label", "Toggle theme");
  headerToggle.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="5"></circle>
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"></path>
    </svg>
  `;

  // Add to header if nav-shell exists
  const navShell = document.querySelector(".nav-shell");
  if (navShell) {
    navShell.appendChild(headerToggle);
  }

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.id = "appearance-toggle";
  toggle.className = "appearance-toggle";
  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-controls", "appearance-dock");
  toggle.textContent = "Customize Look";

  const dock = document.createElement("aside");
  dock.id = "appearance-dock";
  dock.className = "appearance-dock";
  dock.setAttribute("aria-label", "Appearance settings");
  dock.hidden = true;
  dock.innerHTML = `
    <div class="appearance-header">
      <div>
        <h2>Customize Look</h2>
        <p>Switch the theme and background any time.</p>
      </div>
      <button class="appearance-close" type="button" aria-label="Close appearance settings">Close</button>
    </div>
    <div class="appearance-stack">
      <fieldset class="appearance-group">
        <legend>Theme</legend>
        <div class="appearance-theme-buttons">
          <button class="appearance-chip" type="button" data-theme-choice="light" aria-pressed="false">Light Mode</button>
          <button class="appearance-chip" type="button" data-theme-choice="dark" aria-pressed="false">Dark Mode</button>
        </div>
      </fieldset>
      <div class="appearance-group">
        <label for="appearance-background">Background</label>
        <select id="appearance-background" class="appearance-select">
          <option value="default">Warm Studio</option>
          <option value="sunset">Sunset Energy</option>
          <option value="arena">Arena Green</option>
          <option value="aurora">Aurora Blue</option>
          <option value="graphite">Graphite Minimal</option>
          <option value="ocean">Ocean Breeze</option>
          <option value="forest">Forest Calm</option>
          <option value="lavender">Lavender Dream</option>
        </select>
      </div>
      <p class="appearance-tip">Your choices are saved on this browser automatically.</p>
    </div>
  `;

  document.body.appendChild(toggle);
  document.body.appendChild(dock);

  const setDockState = (isOpen) => {
    dock.hidden = !isOpen;
    dock.classList.toggle("is-open", isOpen);
    toggle.setAttribute("aria-expanded", String(isOpen));
  };

  toggle.addEventListener("click", () => {
    setDockState(dock.hidden);
  });

  dock.querySelector(".appearance-close").addEventListener("click", () => {
    setDockState(false);
  });

  dock.querySelectorAll("[data-theme-choice]").forEach((button) => {
    button.addEventListener("click", () => {
      setAppearance("theme", button.dataset.themeChoice);
    });
  });

  dock.querySelector("#appearance-background").addEventListener("change", (event) => {
    setAppearance("background", event.target.value);
  });

  // Header theme toggle functionality
  headerToggle.addEventListener("click", () => {
    const currentAppearance = loadAppearance();
    const newTheme = currentAppearance.theme === "dark" ? "light" : "dark";
    setAppearance("theme", newTheme);
  });
}

function renderBlogBoardPosts() {
  const list = document.getElementById("blog-board-list");

  if (!list) {
    return;
  }

  const posts = JSON.parse(localStorage.getItem("blogBoardPosts") || "[]");

  if (!posts.length) {
    list.innerHTML = '<article class="forum-item forum-empty-state"><strong>No communication posts yet.</strong><p>Coaches, trainers, students, and parents can share their first update here.</p></article>';
    return;
  }

  list.innerHTML = posts
    .map(
      (post) => `
        <article class="forum-item">
          <strong>${post.role}: ${post.name}</strong>
          <p>${post.message}</p>
        </article>
      `
    )
    .join("");
}

function initMenu() {
  const button = document.querySelector(".menu-toggle");
  const nav = document.querySelector(".site-nav");

  if (!button || !nav) {
    return;
  }

  button.addEventListener("click", () => {
    const expanded = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!expanded));
    nav.classList.toggle("is-open");
  });
}

function initVisitorCounter() {
  const countEl = document.getElementById("visit-count");
  const total = Number(localStorage.getItem("totalVisits") || "0") + 1;
  localStorage.setItem("totalVisits", String(total));

  if (countEl) {
    countEl.textContent = total;
  }
}

function initSearch() {
  const form = document.querySelector(".search-panel");
  const input = document.getElementById("site-search");
  const feedback = document.querySelector(".search-feedback");
  const clearButton = document.getElementById("clear-search");
  const items = Array.from(document.querySelectorAll("[data-search]")).filter((element) => !element.contains(form));

  if (!form || !input || !feedback || !items.length) {
    return;
  }

  const resultMeta = items.map((element, index) => ({
    element,
    index,
    title: getSearchTitle(element),
    description: getSearchDescription(element),
    category: getSearchCategory(element),
    keywords: String(element.dataset.search || "").toLowerCase()
  }));

  function clearSearch() {
    input.value = "";
    items.forEach((item) => item.classList.remove("hidden-search", "search-highlight"));
    feedback.innerHTML = "";
    feedback.classList.remove("is-empty");

    if (clearButton) {
      clearButton.hidden = true;
    }

    input.focus();
  }

  if (clearButton) {
    clearButton.addEventListener("click", clearSearch);
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    const query = input.value.toLowerCase().trim();

    if (!query) {
      items.forEach((item) => item.classList.remove("hidden-search"));
      clearSearch();
      renderSearchSummary(feedback, {
        query,
        matches: [],
        message: "Showing all academy content.",
        nextStep: "Try a sport, program, event, booking, newsletter, or sponsorship keyword."
      });
      return;
    }


    const words = query.split(/\s+/).filter(Boolean);
    const matches = resultMeta
      .map((item) => {
        const haystack = `${item.title} ${item.description} ${item.category} ${item.keywords}`.toLowerCase();
        const score = words.reduce((total, word) => total + (haystack.includes(word) ? 1 : 0), 0);
        const exactBoost = haystack.includes(query) ? 2 : 0;
        return { ...item, score: score + exactBoost };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || a.index - b.index);

    items.forEach((item) => {
      item.classList.toggle("hidden-search", !matches.some((match) => match.element === item));
    });

    if (clearButton) {
      clearButton.hidden = false;
    }

    renderSearchSummary(feedback, {
      query,
      matches,
      message: matches.length
        ? `${matches.length} match${matches.length === 1 ? "" : "es"} found for "${query}".`
        : `No visible matches found for "${query}".`,
      nextStep: getSearchNextStep(query, matches)
    });

    feedback.focus({ preventScroll: true });

    feedback.querySelectorAll("[data-search-jump]").forEach((button) => {
      button.addEventListener("click", () => {
        const target = resultMeta[Number(button.dataset.searchJump)]?.element;
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("search-highlight");
          window.setTimeout(() => target.classList.remove("search-highlight"), 1600);
        }
      });
    });
  });
}

function getSearchTitle(element) {
  const heading = element.matches("h1, h2, h3") ? element : element.querySelector("h1, h2, h3");
  return normalizeText(heading ? heading.textContent : element.dataset.search || "Academy result");
}

function getSearchDescription(element) {
  const paragraph = element.matches("p") ? element : element.querySelector("p");
  const text = normalizeText(paragraph ? paragraph.textContent : element.textContent || "");
  return text.length > 145 ? `${text.slice(0, 142).trim()}...` : text;
}

function getSearchCategory(element) {
  if (element.classList.contains("sport-card") || element.classList.contains("program-card")) {
    return "Program";
  }
  if (element.classList.contains("event-card")) {
    return "Event";
  }
  if (element.classList.contains("blog-card") || element.classList.contains("news-card")) {
    return "Academy update";
  }
  if (element.classList.contains("form-card")) {
    return "Form";
  }
  return "Academy info";
}

function getSearchNextStep(query, matches) {
  const programMatches = matches.filter((match) => match.category === "Program").slice(0, 3);

  if (programMatches.length) {
    return `Review ${programMatches.map((match) => match.title).join(", ")} and use Book Now or Register when you are ready to train.`;
  }

  if (query.includes("event") || query.includes("fixture") || query.includes("competition")) {
    return "Open the Events page for dates, fixtures, and upcoming academy activities.";
  }

  if (query.includes("book") || query.includes("session") || query.includes("training")) {
    return "Use Book Now to request a training session and include your preferred sport.";
  }

  if (query.includes("register") || query.includes("join")) {
    return "Use Register to join the academy community and receive program updates.";
  }

  return matches.length
    ? "Open the strongest match below, then use Register or Book Now for the next step."
    : "Try keywords such as football, volleyball, taekwondo, events, booking, register, or newsletter.";
}

function renderSearchSummary(target, details) {
  const topMatches = details.matches.slice(0, 4);

  target.classList.toggle("is-empty", !details.matches.length && Boolean(details.query));

  if (!details.query) {
    target.innerHTML = `
      <strong>${escapeHTML(details.message)}</strong>
      <p>${escapeHTML(details.nextStep)}</p>
    `;
    return;
  }

  target.innerHTML = `
    <div class="search-summary-head">
      <span>${details.matches.length ? "Results ready" : "No exact match"}</span>
      <strong>${escapeHTML(details.message)}</strong>
      <p>${escapeHTML(details.nextStep)}</p>
    </div>
    ${
      topMatches.length
        ? `<div class="search-result-list">
            ${topMatches
              .map(
                (match) => `
                  <article class="search-result-card">
                    <span>${escapeHTML(match.category)}</span>
                    <h3>${escapeHTML(match.title)}</h3>
                    <p>${escapeHTML(match.description)}</p>
                    <button type="button" data-search-jump="${match.index}">View this match</button>
                  </article>
                `
              )
              .join("")}
          </div>`
        : `<div class="search-empty-tips">
            <strong>Try a broader academy keyword.</strong>
            <p>Good examples: football, rugby, ballet, table tennis, handball, gymnastics, wrestling, taekwondo, judo, volleyball, events, booking, or register.</p>
          </div>`
    }
  `;
}

function normalizeText(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function escapeHTML(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderRecaptchaWidgets() {
  const widgetElements = document.querySelectorAll(".recaptcha-widget");
  if (!widgetElements.length || typeof window.grecaptcha === "undefined") {
    return;
  }

  const recaptchaTheme = document.body.dataset.theme === "dark" ? "dark" : "light";

  widgetElements.forEach((element) => {
    if (element.dataset.rendered === "true" || element.childElementCount > 0) {
      element.dataset.rendered = "true";
      return;
    }

    try {
      const widgetId = window.grecaptcha.render(element, {
        sitekey: RECAPTCHA_SITE_KEY,
        theme: recaptchaTheme
      });

      recaptchaWidgets[element.dataset.formId] = widgetId;
      element.dataset.rendered = "true";
      element.closest(".recaptcha-shell")?.classList.remove("recaptcha-error");
    } catch (error) {
      element.dataset.rendered = "false";
      element.closest(".recaptcha-shell")?.classList.add("recaptcha-error");
      console.warn("reCAPTCHA could not render:", error.message);
    }
  });
}

function hasRecaptchaToken(formId) {
  const widgetId = recaptchaWidgets[formId];

  if (typeof widgetId !== "number" || typeof window.grecaptcha === "undefined") {
    return false;
  }

  return window.grecaptcha.getResponse(widgetId).trim().length > 0;
}

function resetRecaptcha(formId) {
  const widgetId = recaptchaWidgets[formId];

  if (typeof widgetId === "number" && typeof window.grecaptcha !== "undefined") {
    window.grecaptcha.reset(widgetId);
  }
}

function requireRecaptcha(formId, feedbackId) {
  if (typeof window.grecaptcha === "undefined") {
    setFeedback(feedbackId, "Google reCAPTCHA could not load. Check your internet connection and try again.", true);
    return false;
  }

  if (!hasRecaptchaToken(formId)) {
    setFeedback(feedbackId, "Please complete the Google reCAPTCHA check before submitting.", true);
    return false;
  }

  return true;
}

function initRegisterForm() {
  const form = document.getElementById("register-form");
  const confirmation = document.getElementById("register-confirmation");
  const emailInput = document.getElementById("email");

  if (!form) {
    return;
  }

  // Real-time email validation
  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      validateEmailInput("email", "email-feedback");
    });
    
    emailInput.addEventListener("input", () => {
      if (emailInput.value.trim()) {
        emailInput.classList.remove("input-error");
      }
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const fullName = data.get("fullName").toString().trim();
    const email = data.get("email").toString().trim();
    const sportInterest = data.get("sportInterest").toString().trim();

    if (!form.checkValidity()) {
      setFeedback("register-feedback", "⚠️ Please complete every required field before submitting.", true);
      return;
    }

    if (!isValidEmail(email)) {
      setFeedback("register-feedback", "⚠️ Please enter a valid email address (e.g., user@example.com).", true);
      return;
    }

    if (!requireRecaptcha("register-form", "register-feedback")) {
      return;
    }

    const subscribe = data.get("subscribe") === "on";
    saveLocalRecord("registrations", {
      fullName,
      email,
      sportInterest,
      subscribe
    });

    confirmation.innerHTML = `<strong>✓ Registration confirmed for ${fullName}!</strong><p>A confirmation email has been sent to <strong>${email}</strong>. Preferred sport: <strong>${sportInterest}</strong>. Newsletter subscription: <strong>${subscribe ? "Yes" : "No"}</strong>.</p>`;
    setFeedback("register-feedback", "✓ Registration submitted successfully!", false);
    form.reset();
    resetRecaptcha("register-form");
  });
}

function initNewsletterForm() {
  const form = document.getElementById("newsletter-form");
  const emailInput = document.getElementById("newsletter-email");

  if (!form) {
    return;
  }

  // Real-time email validation
  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      validateEmailInput("newsletter-email", "newsletter-feedback");
    });
    
    emailInput.addEventListener("input", () => {
      if (emailInput.value.trim()) {
        emailInput.style.borderColor = "";
      }
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get("newsletterName").toString().trim();
    const email = data.get("newsletterEmail").toString().trim();

    if (!form.checkValidity()) {
      setFeedback("newsletter-feedback", "⚠️ Please enter your name and a valid email address.", true);
      return;
    }

    if (!isValidEmail(email)) {
      setFeedback("newsletter-feedback", "⚠️ Please enter a valid email address.", true);
      return;
    }

    if (!requireRecaptcha("newsletter-form", "newsletter-feedback")) {
      return;
    }

    saveLocalRecord("newsletterSubscribers", { name, email });
    setFeedback("newsletter-feedback", `✓ Thanks ${name}! You've been subscribed successfully.`, false);
    form.reset();
    resetRecaptcha("newsletter-form");
  });
}

function initBookingForm() {
  const form = document.getElementById("booking-form");
  const confirmation = document.getElementById("booking-confirmation");
  const emailInput = document.getElementById("book-email");

  if (!form) {
    return;
  }

  // Real-time email validation
  if (emailInput) {
    emailInput.addEventListener("blur", () => {
      validateEmailInput("book-email", "book-email-feedback");
    });
    
    emailInput.addEventListener("input", () => {
      if (emailInput.value.trim()) {
        emailInput.classList.remove("input-error");
      }
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);

    if (!form.checkValidity()) {
      setFeedback("booking-feedback", "⚠️ Please fill in all required booking details.", true);
      return;
    }

    const email = data.get("bookEmail").toString().trim();
    if (!isValidEmail(email)) {
      setFeedback("booking-feedback", "⚠️ Please enter a valid email address.", true);
      return;
    }

    if (!requireRecaptcha("booking-form", "booking-feedback")) {
      return;
    }

    const record = {
      name: data.get("bookName").toString().trim(),
      email: email,
      sport: data.get("bookSport").toString().trim(),
      date: data.get("bookDate").toString().trim(),
      time: data.get("bookTime").toString().trim()
    };

    saveLocalRecord("bookings", record);
    confirmation.innerHTML = `<strong>✓ Booking request sent!</strong><p>${record.name}, your ${record.sport} session for <strong>${record.date} at ${record.time}</strong> has been confirmed. A confirmation email will be sent to <strong>${record.email}</strong>.</p>`;
    setFeedback("booking-feedback", "✓ Booking submitted successfully!", false);
    form.reset();
    resetRecaptcha("booking-form");
  });
}

function initForumForm() {
  const form = document.getElementById("forum-form");

  if (!form) {
    renderForumPosts();
    return;
  }

  renderForumPosts();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const name = data.get("forumName").toString().trim();
    const question = data.get("forumQuestion").toString().trim();

    if (!name || !question) {
      setFeedback("forum-feedback", "Please add your name and a question.", true);
      return;
    }

    if (!requireRecaptcha("forum-form", "forum-feedback")) {
      return;
    }

    saveLocalRecord("forumPosts", { name, question });
    setFeedback("forum-feedback", "Question posted successfully.", false);
    form.reset();
    resetRecaptcha("forum-form");
    renderForumPosts();
  });
}

function initBlogBoardForm() {
  const form = document.getElementById("blog-board-form");

  if (!form) {
    renderBlogBoardPosts();
    return;
  }

  renderBlogBoardPosts();

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const role = data.get("boardRole").toString().trim();
    const name = data.get("boardName").toString().trim();
    const message = data.get("boardMessage").toString().trim();

    if (!role || !name || !message) {
      setFeedback("blog-board-feedback", "Please choose a role and complete all fields.", true);
      return;
    }

    if (!requireRecaptcha("blog-board-form", "blog-board-feedback")) {
      return;
    }

    saveLocalRecord("blogBoardPosts", { role, name, message });
    setFeedback("blog-board-feedback", "Community update posted successfully.", false);
    form.reset();
    resetRecaptcha("blog-board-form");
    renderBlogBoardPosts();
  });
}


const SPORT_VISUALS = [
  {
    key: "football",
    label: "Football",
    names: ["football", "football intensity"],
    keywords: ["football", "soccer"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Football%20Players%20on%20Soil%20Field.jpg",
    alt: "Football players competing on a field"
  },
  {
    key: "rugby",
    label: "Rugby",
    names: ["rugby"],
    keywords: ["rugby", "scrum", "contact"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Rugby%20union%20scrummage.jpg",
    alt: "Rugby players forming a scrum"
  },
  {
    key: "ballet",
    label: "Ballet",
    names: ["ballet"],
    keywords: ["ballet", "dance", "movement", "artistry"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Ballet%20dancer.jpg",
    alt: "Ballet dancer performing with balance and control"
  },
  {
    key: "table-tennis",
    label: "Table Tennis",
    names: ["table tennis"],
    keywords: ["table tennis", "tennis", "reaction", "spin"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Sky%20vs%20Sea-%20The%20Ultimate%20Table%20Tennis%20Showdown%20%288846534%29.jpg",
    alt: "Table tennis player returning a serve"
  },
  {
    key: "handball",
    label: "Handball",
    names: ["handball"],
    keywords: ["handball", "throwing", "passing"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Handball%2010.jpg",
    alt: "Handball players competing in a match"
  },
  {
    key: "gymnastics",
    label: "Gymnastics",
    names: ["gymnastics"],
    keywords: ["gymnastics", "mobility", "flexibility", "body control"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Training%20of%20Gymnastics%20at%20the%202018%20Summer%20Youth%20Olympics%20%E2%80%93%20Women%27s%20artistic%20gymnastics%20%2827%29.jpg",
    alt: "Gymnast training during an artistic gymnastics session"
  },
  {
    key: "wrestling",
    label: "Wrestling",
    names: ["wrestling"],
    keywords: ["wrestling", "grappling"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Wrestling%20assignment.jpg",
    alt: "Two athletes wrestling during training"
  },
  {
    key: "taekwondo",
    label: "Taekwondo",
    names: ["taekwondo"],
    keywords: ["taekwondo", "kicks", "strikes"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Taekwondo%20Fighting.jpg",
    alt: "Taekwondo athletes sparring"
  },
  {
    key: "judo",
    label: "Judo",
    names: ["judo", "judo precision"],
    keywords: ["judo", "throws", "martial"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Judo..jpg",
    alt: "Judo athletes practicing technique"
  },
  {
    key: "volleyball",
    label: "Volleyball",
    names: ["volleyball", "volleyball teamwork"],
    keywords: ["volleyball", "serve", "spike", "blocking"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Volleyball%20Match%20%282666331886%29.jpg",
    alt: "Volleyball players competing during a match"
  },
  {
    key: "mission",
    label: "Mission",
    names: ["mission"],
    keywords: ["mission", "inclusive", "excellence", "growth"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Teamwork%20%285893295462%29.jpg",
    alt: "A team joining hands together to represent mission and shared purpose"
  },
  {
    key: "vision",
    label: "Vision",
    names: ["vision", "the long-term road to regional recognition"],
    keywords: ["vision", "future", "regional", "recognition", "sponsorship", "alumni"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Teamwork%20Makes%20The%20Dream%20Work%20%287986190%29.jpg",
    alt: "A coordinated team preparing for future goals"
  },
  {
    key: "values",
    label: "Values",
    names: ["values"],
    keywords: ["values", "respect", "resilience", "opportunity", "teamwork"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Uplifting%20Teamwork%20%2815081195234%29.jpg",
    alt: "A team lifting one another to represent academy values"
  },
  {
    key: "coaching-model",
    label: "Coaching Model",
    names: ["coaching model", "coach leadership summit", "why athlete care starts with listening"],
    keywords: ["coaching model", "coaches", "coach", "leadership", "player development"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/A%20coach%20is%20focused%20on%20documenting%20an%20athlete%27s%20performance%20on%20a%20clipboard%20during%20a%20training%20session%20in%20a%20busy%20gym.jpg",
    alt: "A coach documenting athlete performance during training"
  },
  {
    key: "athlete-experience",
    label: "Athlete Experience",
    names: ["athlete experience"],
    keywords: ["athlete experience", "athlete", "students", "parents", "booking", "sessions", "performance"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Acadia%20performance%20training%20-%20Coach%20Josh%20Nowlan%20%2851417216775%29.jpg",
    alt: "An athlete receiving performance training support"
  },
  {
    key: "updates",
    label: "Updates",
    names: ["updates", "four new sports join the academy", "newsletter", "weekly bulletin"],
    keywords: ["updates", "announcement", "announcements", "newsletter", "latest", "blog"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Athletics%20track%20running.jpg",
    alt: "Athletes running on a track to represent academy updates and announcements"
  },
  {
    key: "events",
    label: "Events",
    names: ["events", "fixtures", "upcoming events", "match-day calendar"],
    keywords: ["event", "events", "competition", "fixture", "calendar"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Sports%20training.jpg",
    alt: "Athletes preparing together for an event"
  },
  {
    key: "performance-analytics",
    label: "Performance Analytics",
    names: ["performance analytics", "structured growth"],
    keywords: ["analytics", "attendance", "recovery", "performance", "tracking"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/A%20coach%20is%20focused%20on%20documenting%20an%20athlete%27s%20performance%20on%20a%20clipboard%20during%20a%20training%20session%20in%20a%20busy%20gym.jpg",
    alt: "Coach tracking athlete performance during training"
  },
  {
    key: "community",
    label: "Community",
    names: ["community access", "community outreach", "open training brings families closer"],
    keywords: ["community", "parents", "residents", "outreach", "access"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Teamwork%20%285893295462%29.jpg",
    alt: "People joining hands to represent community connection"
  },
  {
    key: "partnership",
    label: "Partnership",
    names: ["partnership vision", "future sponsorship vision", "built to attract sponsors and external partners"],
    keywords: ["partnership", "sponsors", "sponsorship", "alumni", "network"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Teamwork%20Makes%20The%20Dream%20Work%20%287986190%29.jpg",
    alt: "A team working together to represent partnership and sponsorship"
  },
  {
    key: "achievements",
    label: "Achievements",
    names: ["achievements", "showcasing wins, growth, and success stories"],
    keywords: ["achievements", "wins", "trophies", "medals", "success"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Athletics%20track%20running.jpg",
    alt: "Athletes competing on a track to represent achievements"
  },
  {
    key: "training",
    label: "Training",
    names: ["training", "campus training", "book a session"],
    keywords: ["training", "session", "development", "academy"],
    src: "https://commons.wikimedia.org/wiki/Special:FilePath/Sports%20training.jpg",
    alt: "Athletes training together"
  }
];

function getCardTitle(card) {
  return normalizeText(card.querySelector("h1, h2, h3, .card-tag, .eyebrow")?.textContent || "");
}

function pickVisualForCard(card) {
  const title = getCardTitle(card).toLowerCase();
  const text = `${title} ${card.dataset.search || ""} ${card.textContent || ""}`.toLowerCase();

  return (
    SPORT_VISUALS.find((visual) => visual.names?.some((name) => title === name || title.includes(name))) ||
    SPORT_VISUALS.find((visual) => visual.names?.some((name) => text.includes(name))) ||
    SPORT_VISUALS.find((visual) => visual.keywords.some((keyword) => text.includes(keyword))) ||
    SPORT_VISUALS[SPORT_VISUALS.length - 1]
  );
}

function enrichVisualCards() {
  document.querySelectorAll(".sport-card, .program-card, .event-card, .blog-card, .news-card, .content-card, .mini-panel").forEach((card) => {
    const visual = pickVisualForCard(card);
    card.dataset.visualKey = visual.key;

    let media = card.querySelector(".card-media");
    if (!media) {
      media = document.createElement("div");
      media.className = "card-media";
      card.insertBefore(media, card.firstChild);
    }

    let image = media.querySelector("img");
    if (!image) {
      image = document.createElement("img");
      media.appendChild(image);
    }

    image.src = visual.src;
    image.alt = visual.alt;
    image.loading = card.classList.contains("sport-card") ? "eager" : "lazy";
    image.decoding = "async";
    image.referrerPolicy = "no-referrer";
    image.onerror = () => {
      image.onerror = null;
      image.src = createFallbackVisual(visual.label, visual.key);
    };
  });
}

function addSiteBackgroundVideo() {
  if (document.body.dataset.page !== "home" || document.querySelector(".site-background-video")) {
    return;
  }

  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    loop: "1",
    playlist: BACKGROUND_VIDEO.youtubeId,
    playsinline: "1",
    modestbranding: "1",
    rel: "0",
    iv_load_policy: "3",
    disablekb: "1",
    fs: "0"
  });

  const iframe = document.createElement("iframe");
  iframe.className = "site-background-video site-background-youtube";
  iframe.title = BACKGROUND_VIDEO.title;
  iframe.src = `https://www.youtube.com/embed/${BACKGROUND_VIDEO.youtubeId}?${params.toString()}`;
  iframe.allow = "autoplay; encrypted-media; picture-in-picture";
  iframe.setAttribute("aria-hidden", "true");
  iframe.setAttribute("tabindex", "-1");
  iframe.setAttribute("frameborder", "0");

  const scrim = document.createElement("div");
  scrim.className = "site-background-scrim";
  scrim.setAttribute("aria-hidden", "true");

  document.body.insertBefore(scrim, document.body.firstChild);
  document.body.insertBefore(iframe, scrim);
}

window.onRecaptchaLoad = function onRecaptchaLoad() {
  renderRecaptchaWidgets();
};

document.addEventListener("DOMContentLoaded", () => {
  const heroVideo = document.querySelector(".hero-video");
    if (heroVideo) {
      heroVideo.muted = true;
      heroVideo.play().catch(() => {
        // Autoplay may be blocked in some browsers; muted ensures better support.
      });
    }

  if (!document.querySelector(".hero-video")) {
    addSiteBackgroundVideo();
  }
  enrichVisualCards();
  createAppearancePanel();
  applyAppearance(loadAppearance());
  initMenu();
  initVisitorCounter();
  initSearch();
  initRegisterForm();
  initNewsletterForm();
  initBookingForm();
  initForumForm();
  initBlogBoardForm();
  renderRecaptchaWidgets();
  updateNetworkUI();

  window.addEventListener("online", updateNetworkUI);
  window.addEventListener("offline", updateNetworkUI);
});
