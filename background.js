// Listen for extension icon click
chrome.action.onClicked.addListener((tab) => {
  console.log("Extension icon clicked. Sending toggleSidebar message to tab:", tab.id);
  chrome.tabs.sendMessage(tab.id, { action: "toggleSidebar" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error("Error sending message to content script:", chrome.runtime.lastError.message);
    } else {
      console.log("Message sent successfully. Response:", response);
    }
  });
});
