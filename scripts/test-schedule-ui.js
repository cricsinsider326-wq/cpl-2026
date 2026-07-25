const fs = require("fs");
const { chromium } = require("playwright-core");

const baseUrl = process.env.SCHEDULE_TEST_URL || "http://127.0.0.1:8080";

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe"
  ].filter(Boolean);
  return candidates.find((candidate) => fs.existsSync(candidate));
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function run() {
  const executablePath = findBrowser();
  assert(executablePath, "No Chromium browser found for the schedule UI test.");

  const browser = await chromium.launch({ executablePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 430, height: 932 } });

  try {
    await page.goto(`${baseUrl}/fixtures/`, { waitUntil: "networkidle" });

    const initial = await page.evaluate(() => ({
      details: [...document.querySelectorAll(".sch-mobile-month")].map((item) => ({
        month: item.dataset.mobileMonthGroup,
        open: item.open,
        hidden: item.classList.contains("is-hidden")
      })),
      mobileDisplay: getComputedStyle(document.querySelector(".sch-mobile-schedule")).display,
      tableDisplay: getComputedStyle(document.querySelector(".sch-table-wrap")).display,
      horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));

    assert(initial.details.length === 2, "Expected August and September mobile schedule groups.");
    const initialAugust = initial.details.find((item) => item.month === "august");
    assert(initialAugust?.open, "The upcoming August month group should start open.");
    assert(initial.mobileDisplay !== "none", "Mobile fixture list is hidden at 430px.");
    assert(initial.tableDisplay === "none", "Desktop fixture table is visible at 430px.");
    assert(initial.horizontalOverflow <= 1, `Page overflows horizontally by ${initial.horizontalOverflow}px.`);

    const initialVisible = await page.locator("[data-sch-mobile-entry]:not(.is-hidden)").count();
    assert(initialVisible === 12, `Expected 12 initially visible fixtures, found ${initialVisible}.`);
    await page.click("[data-sch-expand]");
    const expandedVisible = await page.locator("[data-sch-mobile-entry]:not(.is-hidden)").count();
    assert(expandedVisible === 22, `Expected all 22 August fixtures after expansion, found ${expandedVisible}.`);

    await page.click('[data-sch-tab="august"]');
    const august = await page.evaluate(() => ({
      details: [...document.querySelectorAll(".sch-mobile-month")].map((item) => ({
        month: item.dataset.mobileMonthGroup,
        open: item.open,
        hidden: item.classList.contains("is-hidden")
      })),
      visibleEntries: [...document.querySelectorAll("[data-sch-mobile-entry]")]
        .filter((item) => !item.classList.contains("is-hidden")).length
    }));
    const augustGroup = august.details.find((item) => item.month === "august");
    assert(augustGroup?.open && !augustGroup.hidden, "August tab did not open the August group.");
    assert(august.visibleEntries === 12, `Expected 12 initially visible August fixtures, found ${august.visibleEntries}.`);

    await page.click('[data-sch-tab="all"]');
    await page.selectOption('[data-sch-filter="team"]', "TKR");
    const teamFilter = await page.evaluate(() => ({
      desktopVisible: [...document.querySelectorAll(".sch-row")]
        .filter((item) => !item.classList.contains("is-hidden")).length,
      mobileVisible: [...document.querySelectorAll("[data-sch-mobile-entry]")]
        .filter((item) => !item.classList.contains("is-hidden")).length
    }));
    assert(teamFilter.mobileVisible > 0, "Team filter returned no mobile fixtures.");
    assert(
      teamFilter.desktopVisible === teamFilter.mobileVisible,
      `Team filter counts differ: desktop ${teamFilter.desktopVisible}, mobile ${teamFilter.mobileVisible}.`
    );

    await page.selectOption("[data-sch-timezone]", "pkt");
    const timezone = await page.evaluate(() => ({
      desktop: document.querySelector(".sch-row [data-sch-time]")?.textContent.trim(),
      mobile: document.querySelector("[data-sch-mobile-entry] [data-sch-time]")?.textContent.trim(),
      heading: document.querySelector("[data-sch-time-heading]")?.textContent.trim()
    }));
    assert(timezone.desktop === timezone.mobile, "Desktop and mobile timezone values are not synchronized.");
    assert(timezone.heading === "TIME (PKT)", "Timezone heading did not update to PKT.");

    console.log("Schedule UI test passed:", JSON.stringify({ initial, august, teamFilter, timezone }));
  } finally {
    await browser.close();
  }
}

run().catch((error) => {
  console.error(error.stack || error);
  process.exit(1);
});
