if (window.lucide) {
  window.lucide.createIcons();
}

/* ── Countdown timer ─────────────────────────────────────────── */
const countdown = document.querySelector("[data-countdown]");

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  if (!countdown) return;

  const target = new Date(countdown.dataset.countdown).getTime();
  const remaining = Math.max(0, target - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  countdown.querySelector("[data-days]").textContent = pad(days);
  countdown.querySelector("[data-hours]").textContent = pad(hours);
  countdown.querySelector("[data-minutes]").textContent = pad(minutes);
  countdown.querySelector("[data-seconds]").textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

/* ── Newsletter form ─────────────────────────────────────────── */
document.querySelector(".newsletter form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const email = event.currentTarget.querySelector("input").value.trim();
  if (!email) return;
  event.currentTarget.reset();
});

document.querySelector(".pm-bottom-newsletter form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.querySelector("input[type='email']");
  const email = input.value.trim();
  const status = form.querySelector(".form-status");
  status.classList.remove("is-error", "is-success");
  if (!email || !input.checkValidity()) {
    status.textContent = "Enter a valid email address.";
    status.classList.add("is-error");
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }
  input.removeAttribute("aria-invalid");
  // TODO: Send validated consent to the newsletter provider when registration opens.
  status.textContent = "Email updates are not open for registration yet.";
  status.classList.add("is-success");
});

document.querySelector(".rh-newsletter form")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.querySelector("input[type='email']");
  const status = form.querySelector(".form-status");
  if (!input.value.trim() || !input.checkValidity()) {
    status.textContent = "Enter a valid email address.";
    input.setAttribute("aria-invalid", "true");
    input.focus();
    return;
  }
  input.removeAttribute("aria-invalid");
  status.textContent = "Email updates are not open for registration yet.";
});

/* Accessible tournament hub tabs */
document.querySelectorAll("[data-tabs]").forEach((tabs) => {
  const buttons = [...tabs.querySelectorAll("[role='tab']")];
  const panels = [...tabs.querySelectorAll("[role='tabpanel']")];

  function activate(button) {
    const selected = button.dataset.tab;
    buttons.forEach((item) => {
      const active = item === button;
      item.setAttribute("aria-selected", String(active));
      item.tabIndex = active ? 0 : -1;
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.panel !== selected;
    });
  }

  buttons.forEach((button, index) => {
    button.addEventListener("click", () => activate(button));
    button.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowLeft') nextIndex = (index - 1 + buttons.length) % buttons.length;
      if (event.key === 'ArrowRight') nextIndex = (index + 1) % buttons.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = buttons.length - 1;
      buttons[nextIndex].focus();
      activate(buttons[nextIndex]);
    });
  });
});

/* Broadcast market filter */
(function () {
  const directory = document.querySelector("[data-broadcast-directory]");
  const select = document.getElementById("broadcast-market");
  if (!directory || !select) return;
  const cards = [...directory.querySelectorAll("[data-market]")];
  select.addEventListener("change", () => {
    cards.forEach((card) => {
      card.hidden = select.value !== "all" && card.dataset.market !== select.value;
    });
  });
})();

/* Static grouped site search */
(function () {
  const script = document.getElementById("search-index");
  const form = document.querySelector(".search-tool form");
  const input = document.getElementById("site-search");
  const results = document.querySelector(".search-results");
  const summary = document.querySelector(".search-summary");
  if (!script || !form || !input || !results || !summary) return;

  const index = JSON.parse(script.textContent);

  function renderSearch(query) {
    const normalized = query.trim().toLowerCase();
    results.replaceChildren();
    if (normalized.length < 2) {
      summary.textContent = "Enter at least two characters to search.";
      return;
    }

    const matches = index.filter((item) => `${item.title} ${item.text} ${item.type}`.toLowerCase().includes(normalized)).slice(0, 30);
    summary.textContent = `${matches.length} result${matches.length === 1 ? "" : "s"} for \"${query.trim()}\".`;

    const groups = matches.reduce((all, item) => {
      (all[item.type] ||= []).push(item);
      return all;
    }, {});

    Object.entries(groups).forEach(([type, items]) => {
      const group = document.createElement("section");
      const heading = document.createElement("h2");
      heading.textContent = type;
      group.appendChild(heading);
      items.forEach((item) => {
        const card = document.createElement("article");
        const label = document.createElement("span");
        const title = document.createElement("h3");
        const link = document.createElement("a");
        const copy = document.createElement("p");
        label.textContent = item.type;
        link.href = item.url;
        link.textContent = item.title;
        copy.textContent = item.text;
        title.appendChild(link);
        card.append(label, title, copy);
        group.appendChild(card);
      });
      results.appendChild(group);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    renderSearch(input.value);
    const url = new URL(window.location.href);
    url.searchParams.set("q", input.value.trim());
    window.history.replaceState({}, "", url);
  });

  input.addEventListener("input", () => renderSearch(input.value));
  const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
  if (initialQuery) {
    input.value = initialQuery;
    renderSearch(initialQuery);
  }
})();

/* Compact horizontal lists use one accessible next control. */
document.querySelectorAll("[data-scroll-next]").forEach((button) => {
  const track = document.getElementById(button.dataset.scrollNext);
  if (!track) return;
  button.addEventListener("click", () => {
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 8;
    track.scrollTo({ left: atEnd ? 0 : track.scrollLeft + track.clientWidth * 0.82, behavior: "smooth" });
  });
});

/* Searchable CPL player directory */
(function () {
  const directory = document.querySelector("[data-player-directory]");
  if (!directory) return;

  const form = directory.querySelector("[data-player-filters]");
  const cards = [...directory.querySelectorAll("[data-player-card]")];
  const search = directory.querySelector("[data-player-search]");
  const team = directory.querySelector("[data-player-team]");
  const role = directory.querySelector("[data-player-role]");
  const nationality = directory.querySelector("[data-player-nationality]");
  const status = directory.querySelector("[data-player-status]");
  const resultCount = directory.querySelector("[data-player-result-count]");
  const emptyState = directory.querySelector("[data-player-empty]");
  const pagination = directory.querySelector("[data-player-pagination]");
  const pageList = directory.querySelector("[data-player-pages]");
  const previous = directory.querySelector("[data-player-prev]");
  const next = directory.querySelector("[data-player-next]");
  const listSection = document.getElementById("complete-player-list");
  const pageSize = 30;
  let currentPage = 1;
  let filteredCards = cards;

  function pageNumbers(totalPages) {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
    const numbers = new Set([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
    return [...numbers].filter((page) => page > 0 && page <= totalPages).sort((a, b) => a - b);
  }

  function renderPagination(totalPages) {
    pageList.replaceChildren();
    let lastPage = 0;
    pageNumbers(totalPages).forEach((page) => {
      if (lastPage && page - lastPage > 1) {
        const gap = document.createElement("span");
        gap.textContent = "...";
        gap.setAttribute("aria-hidden", "true");
        pageList.appendChild(gap);
      }
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.page = String(page);
      button.textContent = String(page);
      button.setAttribute("aria-label", `Show player page ${page}`);
      if (page === currentPage) button.setAttribute("aria-current", "page");
      button.addEventListener("click", () => {
        currentPage = page;
        render();
        listSection.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      pageList.appendChild(button);
      lastPage = page;
    });
    previous.disabled = currentPage === 1;
    next.disabled = currentPage === totalPages;
    pagination.hidden = totalPages <= 1;
  }

  function render() {
    const query = search.value.trim().toLowerCase();
    filteredCards = cards.filter((card) => {
      const matchesSearch = !query || card.dataset.search.includes(query);
      const matchesTeam = team.value === "all" || card.dataset.team === team.value;
      const matchesRole = role.value === "all" || card.dataset.role === role.value;
      const matchesNationality = nationality.value === "all" || card.dataset.nationality === nationality.value;
      const matchesStatus = status.value === "all" || card.dataset.status === status.value;
      return matchesSearch && matchesTeam && matchesRole && matchesNationality && matchesStatus;
    });

    const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
    currentPage = Math.min(currentPage, totalPages);
    const start = (currentPage - 1) * pageSize;
    const visible = new Set(filteredCards.slice(start, start + pageSize));
    cards.forEach((card) => {
      card.hidden = !visible.has(card);
    });
    resultCount.textContent = `${filteredCards.length} player${filteredCards.length === 1 ? "" : "s"} found`;
    emptyState.hidden = filteredCards.length !== 0;
    renderPagination(totalPages);
  }

  [search, team, role, nationality, status].forEach((control) => {
    control.addEventListener(control === search ? "input" : "change", () => {
      currentPage = 1;
      render();
    });
  });

  form.addEventListener("reset", () => {
    window.setTimeout(() => {
      currentPage = 1;
      render();
      search.focus();
    }, 0);
  });

  previous.addEventListener("click", () => {
    if (currentPage <= 1) return;
    currentPage -= 1;
    render();
    listSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  next.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(filteredCards.length / pageSize));
    if (currentPage >= totalPages) return;
    currentPage += 1;
    render();
    listSection.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  render();
})();

/* ── Mobile navigation drawer ────────────────────────────────── */
(function () {
  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("primary-nav");
  if (!toggle || !nav) return;
  let previouslyFocused = null;
  const navParent = nav.parentElement;
  const navNextSibling = nav.nextSibling;
  const closeButton = document.createElement("button");
  closeButton.className = "mobile-nav-close";
  closeButton.type = "button";
  closeButton.setAttribute("aria-label", "Close navigation menu");
  closeButton.innerHTML = '<span aria-hidden="true">&times;</span>';
  nav.prepend(closeButton);

  // Inject overlay element once
  const overlay = document.createElement("div");
  overlay.className = "nav-overlay";
  overlay.setAttribute("aria-hidden", "true");
  document.body.appendChild(overlay);

  function portalNav() {
    if (nav.parentElement !== document.body) document.body.appendChild(nav);
  }

  function restoreNav() {
    if (nav.parentElement === document.body) navParent.insertBefore(nav, navNextSibling);
  }

  function openNav() {
    previouslyFocused = document.activeElement;
    portalNav();
    nav.classList.add("is-open");
    overlay.classList.add("is-open");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
    document.body.style.overflow = "hidden";
    nav.querySelector("a, summary")?.focus({ preventScroll: true });
  }

  function closeNav({ restoreFocus = true } = {}) {
    if (!nav.classList.contains("is-open")) return;
    nav.classList.remove("is-open");
    overlay.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    document.body.style.overflow = "";
    if (restoreFocus && previouslyFocused instanceof HTMLElement) previouslyFocused.focus({ preventScroll: true });
    restoreNav();
  }

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";
    if (isOpen) closeNav(); else openNav();
  });

  closeButton.addEventListener("click", () => closeNav());

  overlay.addEventListener("click", () => closeNav());

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      document.querySelectorAll(".nav-more[open]").forEach((details) => details.removeAttribute("open"));
      closeNav();
    }
    if (e.key !== "Tab" || !nav.classList.contains("is-open")) return;
    const focusable = [...nav.querySelectorAll("button, a, summary")].filter((item) => item.offsetParent !== null);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });

  // Close drawer when a nav link is tapped
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      if (window.innerWidth <= 900) closeNav({ restoreFocus: false });
    });
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) closeNav({ restoreFocus: false });
  });

  document.addEventListener("click", (event) => {
    document.querySelectorAll(".nav-more[open]").forEach((details) => {
      if (!details.contains(event.target)) details.removeAttribute("open");
    });
  });
})();

/* CPL 2026 Schedule / Fixtures page filters (progressive enhancement) */
(function () {
  const root = document.querySelector("[data-sch-schedule]");
  if (!root) return;

  const rows = [...root.querySelectorAll(".sch-row")];
  const groups = [...root.querySelectorAll(".sch-month-group")];
  const mobileEntries = [...root.querySelectorAll("[data-sch-mobile-entry]")];
  const mobileGroups = [...root.querySelectorAll("[data-mobile-month-group]")];
  const fixtureEntries = [...rows, ...mobileEntries];
  const empty = root.querySelector("[data-sch-empty]");
  const teamFilter = root.querySelector("[data-sch-filter='team']");
  const venueFilter = root.querySelector("[data-sch-filter='venue']");
  const stageFilter = root.querySelector("[data-sch-filter='stage']");
  const tabs = [...document.querySelectorAll("[data-sch-tab]")];
  const timezoneSelect = document.querySelector("[data-sch-timezone]");
  const timezoneChips = [...document.querySelectorAll("[data-sch-tz]")];
  const timeHeading = root.querySelector("[data-sch-time-heading]");
  let tabMode = "all";
  const timezoneOffsets = {
    gmt: 0,
    bst: 1,
    est: -5,
    ist: 5.5,
    pkt: 5,
    aest: 10
  };
  const timezoneLabels = {
    local: "LOCAL",
    gmt: "GMT",
    bst: "BST",
    est: "EST",
    ist: "IST",
    pkt: "PKT",
    aest: "AEST"
  };
  const weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function parseClock(value) {
    const match = String(value || "").trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let hour = Number(match[1]);
    const minute = Number(match[2]);
    const meridiem = match[3].toUpperCase();
    if (meridiem === "AM" && hour === 12) hour = 0;
    if (meridiem === "PM" && hour !== 12) hour += 12;
    return { hour, minute };
  }

  function formatClock(hour, minute) {
    const meridiem = hour >= 12 ? "PM" : "AM";
    return `${hour % 12 || 12}:${String(minute).padStart(2, "0")} ${meridiem}`;
  }

  function updateTimezone() {
    const zone = timezoneSelect?.value || "local";
    const targetOffset = timezoneOffsets[zone];
    fixtureEntries.forEach((entry) => {
      const dateNode = entry.querySelector("[data-sch-date]");
      const timeNode = entry.querySelector("[data-sch-time]");
      if (!dateNode || !timeNode) return;
      entry.dataset.originalDate ||= dateNode.textContent.trim();
      entry.dataset.originalTime ||= timeNode.textContent.trim();
      if (zone === "local" || targetOffset === undefined) {
        dateNode.textContent = entry.dataset.originalDate;
        timeNode.textContent = entry.dataset.originalTime;
        return;
      }
      const dateParts = (entry.dataset.dateIso || "").split("-").map(Number);
      const clock = parseClock(entry.dataset.localTime);
      const sourceOffset = Number(entry.dataset.utcOffset);
      if (dateParts.length !== 3 || dateParts.some((part) => !Number.isFinite(part)) || !clock || !Number.isFinite(sourceOffset)) return;
      const utcTimestamp = Date.UTC(
        dateParts[0],
        dateParts[1] - 1,
        dateParts[2],
        clock.hour - sourceOffset,
        clock.minute
      );
      const shifted = new Date(utcTimestamp + (targetOffset * 60 * 60 * 1000));
      dateNode.textContent = `${weekdayNames[shifted.getUTCDay()]}, ${monthNames[shifted.getUTCMonth()]} ${shifted.getUTCDate()}`;
      timeNode.textContent = formatClock(shifted.getUTCHours(), shifted.getUTCMinutes());
    });
    if (timeHeading) timeHeading.textContent = `TIME (${timezoneLabels[zone] || zone.toUpperCase()})`;
    timezoneChips.forEach((chip) => chip.classList.toggle("is-active", chip.dataset.schTz === zone));
  }

  function applyFilters() {
    const team = teamFilter?.value || "all";
    const venue = venueFilter?.value || "all";
    const stage = stageFilter?.value || "all";
    let visible = 0;

    function entryMatches(entry) {
      let show = true;
      if (tabMode === "august" || tabMode === "september") {
        show = entry.dataset.month === tabMode;
      } else if (tabMode === "playoffs") {
        show = entry.dataset.stage === "playoff" || entry.dataset.stage === "final";
      }
      if (show && team !== "all") {
        show = entry.dataset.teamA === team || entry.dataset.teamB === team;
      }
      if (show && venue !== "all") {
        const venueText = entry.querySelector(".sch-col-venue, .sch-mobile-venue")?.textContent || "";
        show = entry.dataset.venue === venue || venueText.includes(venue);
      }
      if (show && stage !== "all") {
        if (stage === "playoff") show = entry.dataset.stage === "playoff" || entry.dataset.stage === "final";
        else show = entry.dataset.stage === stage;
      }
      return show;
    }

    rows.forEach((row) => {
      const show = entryMatches(row);
      row.classList.toggle("is-hidden", !show);
      if (show) visible += 1;
    });

    mobileEntries.forEach((entry) => {
      entry.classList.toggle("is-hidden", !entryMatches(entry));
    });

    groups.forEach((group) => {
      const anyVisible = [...group.querySelectorAll(".sch-row")].some((row) => !row.classList.contains("is-hidden"));
      group.classList.toggle("is-hidden", !anyVisible);
    });

    mobileGroups.forEach((group) => {
      const anyVisible = [...group.querySelectorAll("[data-sch-mobile-entry]")].some((entry) => !entry.classList.contains("is-hidden"));
      group.classList.toggle("is-hidden", !anyVisible);
      if (anyVisible && (tabMode === "august" || tabMode === "september")) {
        group.open = group.dataset.mobileMonthGroup === tabMode;
      }
    });

    if (empty) empty.hidden = visible > 0;
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const mode = tab.dataset.schTab;
      if (mode === "by-team") {
        document.getElementById("by-team")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      if (mode === "by-venue") {
        document.getElementById("by-venue")?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      tabMode = mode;
      tabs.forEach((item) => {
        const active = item === tab;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-selected", String(active));
      });
      if (mode === "playoffs" && stageFilter) stageFilter.value = "playoff";
      if (mode === "all" && stageFilter) stageFilter.value = "all";
      applyFilters();
      root.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  [teamFilter, venueFilter, stageFilter].forEach((select) => {
    select?.addEventListener("change", applyFilters);
  });

  timezoneSelect?.addEventListener("change", updateTimezone);

  document.querySelectorAll("[data-sch-jump='playoffs']").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const playoffsTab = tabs.find((tab) => tab.dataset.schTab === "playoffs");
      playoffsTab?.click();
    });
  });

  timezoneChips.forEach((chip) => {
    chip.addEventListener("click", () => {
      if (!timezoneSelect) return;
      const option = [...timezoneSelect.options].find((item) => item.value === chip.dataset.schTz);
      if (!option) return;
      timezoneSelect.value = option.value;
      updateTimezone();
      document.getElementById("complete-schedule")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
})();
