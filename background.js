chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "sendMsg") {
    chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
      if (tabs.length === 0) {
        // Open WhatsApp Web if not already open
        chrome.tabs.create({ url: "https://web.whatsapp.com/" }, (tab) => {
          // Wait for WhatsApp to load before attempting to send
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"]
            });
          }, 15000); // Give 15 seconds for WhatsApp to load
        });
        return;
      }

      // Execute the content script if WhatsApp is already open
      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["content.js"]
      });
    });
  }
});