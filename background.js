chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "sendMsg") {
    chrome.tabs.query({ url: "https://web.whatsapp.com/*" }, (tabs) => {
      if (tabs.length === 0) {
        chrome.tabs.create({ url: "https://web.whatsapp.com/" }, (tab) => {
          setTimeout(() => {
            chrome.scripting.executeScript({
              target: { tabId: tab.id },
              files: ["content.js"]
            });
          }, 15000); 
        });
        return;
      }

      chrome.scripting.executeScript({
        target: { tabId: tabs[0].id },
        files: ["content.js"]
      });
    });
  }
});
