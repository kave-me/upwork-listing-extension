// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  // Send a message to the content script
  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" });
});
