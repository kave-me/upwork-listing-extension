// Create and inject the sidebar
function createSidebar() {
  const sidebar = document.createElement("div");
  sidebar.id = "upwork-filter-sidebar";

  const toggleButton = document.createElement("button");
  toggleButton.id = "sidebar-toggle";
  toggleButton.textContent = "<<";
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

  // Add event listeners
  document
    .getElementById("apply-filter")
    .addEventListener("click", applyFilters);
  document
    .getElementById("reset-filter")
    .addEventListener("click", resetFilters);

  // Load saved filters
  loadSavedFilters();
}

// Toggle sidebar visibility
function toggleSidebar() {
  const sidebar = document.getElementById("upwork-filter-sidebar");
  const toggle = document.getElementById("sidebar-toggle");

  sidebar.classList.toggle("collapsed");
  toggle.classList.toggle("collapsed");

  if (toggle.textContent === "<<") {
    toggle.textContent = ">>";
  } else {
    toggle.textContent = "<<";
  }
}

// Save filters to chrome.storage
function saveFilters() {
  const filters = {
    proposalsLess5: document.getElementById("proposals-less-5").checked,
    proposals5to10: document.getElementById("proposals-5-10").checked,
    proposals10to15: document.getElementById("proposals-10-15").checked,
    proposals20to50: document.getElementById("proposals-20-50").checked,
    proposals50Plus: document.getElementById("proposals-50-plus").checked,
  };

  chrome.storage.local.set({ upworkFilters: filters });
}

// Load saved filters from chrome.storage
function loadSavedFilters() {
  chrome.storage.local.get("upworkFilters", (data) => {
    if (data.upworkFilters) {
      document.getElementById("proposals-less-5").checked =
        data.upworkFilters.proposalsLess5 || false;
      document.getElementById("proposals-5-10").checked =
        data.upworkFilters.proposals5to10 || false;
      document.getElementById("proposals-10-15").checked =
        data.upworkFilters.proposals10to15 || false;
      document.getElementById("proposals-20-50").checked =
        data.upworkFilters.proposals20to50 || false;
      document.getElementById("proposals-50-plus").checked =
        data.upworkFilters.proposals50Plus || false;
    }
  });
}

// Apply filters to job listings
function applyFilters() {
  // Reset previous highlights
  resetHighlights();

  // Save current filters
  saveFilters();

  // Get filter values
  const proposalsLess5 = document.getElementById("proposals-less-5").checked;
  const proposals5to10 = document.getElementById("proposals-5-10").checked;
  const proposals10to15 = document.getElementById("proposals-10-15").checked;
  const proposals20to50 = document.getElementById("proposals-20-50").checked;
  const proposals50Plus = document.getElementById("proposals-50-plus").checked;

  // Select all job tiles
  const jobTiles = document.querySelectorAll(
    '[data-test="job-tile-container"]'
  );

  // Apply filters to each job tile
  jobTiles.forEach((tile) => {
    let matches = true;

    // Proposals
    const proposalsText =
      tile.querySelector('[data-test="job-tile-proposals"]')?.textContent || "";
    const proposalsMatch = proposalsText.match(/(\d+)\s*to\s*(\d+)|(\d+)\+/);
    let proposals = 0;
    if (proposalsMatch) {
      if (proposalsMatch[3]) {
        proposals = parseInt(proposalsMatch[3], 10);
      } else {
        proposals = parseInt(proposalsMatch[2], 10);
      }
    }

    // Check proposals
    const proposalMatches =
      (proposalsLess5 && proposals < 5) ||
      (proposals5to10 && proposals >= 5 && proposals <= 10) ||
      (proposals10to15 && proposals >= 10 && proposals <= 15) ||
      (proposals20to50 && proposals >= 20 && proposals <= 50) ||
      (proposals50Plus && proposals >= 50);

    if (
      (proposalsLess5 ||
        proposals5to10 ||
        proposals10to15 ||
        proposals20to50 ||
        proposals50Plus) &&
      !proposalMatches
    ) {
      matches = false;
    }

    // Show or hide the job tile based on match status
    if (matches) {
      tile.style.display = "block"; // Show matched items
    } else {
      tile.style.display = "none"; // Hide non-matched items
    }
  });
}

// Parse number from string like "$5K+" or "$1,000"
function parseNumber(str) {
  // Remove $ and commas
  str = str.replace(/[$,]/g, "");

  // Handle K (thousands)
  if (str.includes("K")) {
    str = str.replace("K", "");
    return parseFloat(str) * 1000;
  }

  // Handle M (millions)
  if (str.includes("M")) {
    str = str.replace("M", "");
    return parseFloat(str) * 1000000;
  }

  // Handle plus sign (minimum value)
  if (str.includes("+")) {
    str = str.replace("+", "");
  }

  return parseFloat(str);
}

// Reset all filters
function resetFilters() {
  // Clear filter inputs
  document.getElementById("proposals-less-5").checked = false;
  document.getElementById("proposals-5-10").checked = false;
  document.getElementById("proposals-10-15").checked = false;
  document.getElementById("proposals-20-50").checked = false;
  document.getElementById("proposals-50-plus").checked = false;

  // Reset highlights and show all items
  resetHighlights();

  // Clear saved filters
  chrome.storage.local.remove("upworkFilters");
}

// Reset all highlights and show all items
function resetHighlights() {
  const jobTiles = document.querySelectorAll(
    '[data-test="job-tile-container"]'
  );
  jobTiles.forEach((tile) => {
    tile.style.display = ""; // Reset to default display state
  });
}

// Observer to handle dynamically loaded job listings
function setupMutationObserver() {
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
      applyFilters();
    }
  });

  const jobFeedContainer = document.querySelector(
    '[data-test="jobs-feed-container"]'
  );
  if (jobFeedContainer) {
    observer.observe(jobFeedContainer, { childList: true, subtree: true });
  }
}

// Initialize extension
function init() {
  createSidebar();
  setupMutationObserver();
}

// Run initialization when the DOM is fully loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
