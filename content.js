// Create and inject the sidebar
function createSidebar() {
  console.log("Creating sidebar...");
  const allowedUrls = [
    "https://www.upwork.com/nx/find-work/best-matches",
    "https://www.upwork.com/nx/find-work/most-recent",
  ];
  if (!allowedUrls.includes(window.location.href)) {
    console.warn("Sidebar not created: URL not allowed", window.location.href);
    return;
  }

  const sidebar = document.createElement("div");
  sidebar.id = "upwork-filter-sidebar";
  sidebar.classList.add("collapsed");

  const toggleButton = document.createElement("button");
  toggleButton.id = "sidebar-toggle";
  toggleButton.textContent = "<<";
  toggleButton.classList.add("collapsed");
  toggleButton.addEventListener("click", toggleSidebar);

  sidebar.innerHTML = `
    <h2>Job Filter</h2>
    <div class="filter-section">
      <h3>Proposals</h3>
      <div class="filter-option">
        <label><input type="checkbox" id="proposals-less-5"> Less than 5</label>
      </div>
      <div class="filter-option">
        <label><input type="checkbox" id="proposals-5-10"> 5 to 10</label>
      </div>
      <div class="filter-option">
        <label><input type="checkbox" id="proposals-10-15"> 10 to 15</label>
      </div>
      <div class="filter-option">
        <label><input type="checkbox" id="proposals-20-50"> 20 to 50</label>
      </div>
      <div class="filter-option">
        <label><input type="checkbox" id="proposals-50-plus"> 50+</label>
      </div>
    </div>
    <button id="apply-filter" class="apply-filter-btn">Apply Filters</button>
    <button id="reset-filter" class="reset-filter-btn">Reset Filters</button>
  `;

  document.body.appendChild(sidebar);
  document.body.appendChild(toggleButton);

  console.log("Sidebar and toggle button added to DOM.");

  document.getElementById("apply-filter").addEventListener("click", applyFilters);
  document.getElementById("reset-filter").addEventListener("click", resetFilters);

  loadSavedFilters();
}

// Toggle sidebar visibility
function toggleSidebar() {
  console.log("Toggling sidebar...");
  const sidebar = document.getElementById("upwork-filter-sidebar");
  const toggle = document.getElementById("sidebar-toggle");

  sidebar.classList.toggle("collapsed");
  toggle.classList.toggle("collapsed");

  toggle.textContent = toggle.textContent === "<<" ? ">>" : "<<";
  console.log("Sidebar toggled. Current state:", sidebar.classList.contains("collapsed") ? "collapsed" : "expanded");
}

// Save filters to chrome.storage
function saveFilters() {
  console.log("Saving filters...");
  const filters = {
    proposalsLess5: document.getElementById("proposals-less-5").checked,
    proposals5to10: document.getElementById("proposals-5-10").checked,
    proposals10to15: document.getElementById("proposals-10-15").checked,
    proposals20to50: document.getElementById("proposals-20-50").checked,
    proposals50Plus: document.getElementById("proposals-50-plus").checked,
  };

  chrome.storage.local.set({ upworkFilters: filters }, () => {
    console.log("Filters saved:", filters);
  });
}

// Load saved filters from chrome.storage
function loadSavedFilters() {
  console.log("Loading saved filters...");
  chrome.storage.local.get("upworkFilters", (data) => {
    if (data.upworkFilters) {
      console.log("Saved filters found:", data.upworkFilters);
      document.getElementById("proposals-less-5").checked = data.upworkFilters.proposalsLess5 || false;
      document.getElementById("proposals-5-10").checked = data.upworkFilters.proposals5to10 || false;
      document.getElementById("proposals-10-15").checked = data.upworkFilters.proposals10to15 || false;
      document.getElementById("proposals-20-50").checked = data.upworkFilters.proposals20to50 || false;
      document.getElementById("proposals-50-plus").checked = data.upworkFilters.proposals50Plus || false;
    } else {
      console.info("No saved filters found. This is expected if no filters have been applied yet.");
    }
  });
}

// Apply filters to job listings
function applyFilters() {
  console.log("Applying filters...");
  resetHighlights();
  saveFilters();

  const proposalsLess5 = document.getElementById("proposals-less-5").checked;
  const proposals5to10 = document.getElementById("proposals-5-10").checked;
  const proposals10to15 = document.getElementById("proposals-10-15").checked;
  const proposals20to50 = document.getElementById("proposals-20-50").checked;
  const proposals50Plus = document.getElementById("proposals-50-plus").checked;

  const jobTiles = document.querySelectorAll('[data-test="job-tile-container"]');
  console.log("Found job tiles:", jobTiles.length);

  jobTiles.forEach((tile) => {
    let matches = true;
    const proposalsText = tile.querySelector('[data-test="job-tile-proposals"]')?.textContent || "";
    const proposalsMatch = proposalsText.match(/(\d+)\s*to\s*(\d+)|(\d+)\+/);
    let proposals = 0;
    if (proposalsMatch) {
      proposals = proposalsMatch[3] ? parseInt(proposalsMatch[3], 10) : parseInt(proposalsMatch[2], 10);
    }

    const proposalMatches =
      (proposalsLess5 && proposals < 5) ||
      (proposals5to10 && proposals >= 5 && proposals <= 10) ||
      (proposals10to15 && proposals >= 10 && proposals <= 15) ||
      (proposals20to50 && proposals >= 20 && proposals <= 50) ||
      (proposals50Plus && proposals >= 50);

    if (
      (proposalsLess5 || proposals5to10 || proposals10to15 || proposals20to50 || proposals50Plus) &&
      !proposalMatches
    ) {
      matches = false;
    }

    tile.style.display = matches ? "block" : "none";
  });

  console.log("Filters applied.");
}

// Reset all filters
function resetFilters() {
  console.log("Resetting filters...");
  document.getElementById("proposals-less-5").checked = false;
  document.getElementById("proposals-5-10").checked = false;
  document.getElementById("proposals-10-15").checked = false;
  document.getElementById("proposals-20-50").checked = false;
  document.getElementById("proposals-50-plus").checked = false;

  resetHighlights();
  chrome.storage.local.remove("upworkFilters", () => {
    console.log("Filters cleared from storage.");
  });
}

// Reset all highlights and show all items
function resetHighlights() {
  console.log("Resetting highlights...");
  const jobTiles = document.querySelectorAll('[data-test="job-tile-container"]');
  jobTiles.forEach((tile) => {
    tile.style.display = "";
  });
  console.log("Highlights reset.");
}

// Observer to handle dynamically loaded job listings
function setupMutationObserver() {
  console.log("Setting up mutation observer...");
  const observer = new MutationObserver((mutations) => {
    let shouldReapplyFilters = false;

    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            (node.querySelector('[data-test="job-tile-container"]') ||
              node.matches('[data-test="job-tile-container"]'))
          ) {
            shouldReapplyFilters = true;
            break;
          }
        }
      }
    }

    if (shouldReapplyFilters) {
      console.log("New job tiles detected. Reapplying filters...");
      applyFilters();
    }
  });

  const jobFeedContainer = document.querySelector('[data-test="jobs-feed-container"]');
  if (jobFeedContainer) {
    observer.observe(jobFeedContainer, { childList: true, subtree: true });
    console.log("Mutation observer attached to job feed container.");
  } else {
    console.warn("Job feed container not found. Mutation observer not attached.");
  }
}

// Initialize extension
function init() {
  console.log("Initializing extension...");
  createSidebar();
  setupMutationObserver();
}

// Run initialization when the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
