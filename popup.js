document.addEventListener('DOMContentLoaded', function() {
  // Set default time to current time + 1 minute
  const now = new Date();
  now.setMinutes(now.getMinutes() + 1);
  
  // Format date and time for datetime-local input
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  
  const defaultTime = `${year}-${month}-${day}T${hours}:${minutes}`;
  document.getElementById('time').value = defaultTime;
  
  // Load any previously saved contact
  chrome.storage.local.get(["contact"], ({ contact }) => {
    if (contact) {
      document.getElementById('contact').value = contact;
    }
  });
});

document.getElementById('scheduleBtn').addEventListener('click', () => {
  const contact = document.getElementById('contact').value.trim();
  const message = document.getElementById('message').value.trim();
  const time = new Date(document.getElementById('time').value);

  // Validation
  if (!contact) {
    alert("Please enter a contact name.");
    return;
  }
  
  if (!message) {
    alert("Please enter a message.");
    return;
  }
  
  if (!document.getElementById('time').value) {
    alert("Please set a time for the message.");
    return;
  }

  const now = Date.now();
  const delayMs = time.getTime() - now;
  const minimumDelayMs = 30 * 1000; // 30 seconds

  if (delayMs < minimumDelayMs) {
    alert("Please schedule at least 30 seconds in the future.");
    return;
  }

  const delayInMinutes = delayMs / 60000;

  chrome.storage.local.set({ contact, message }, () => {
    chrome.alarms.create("sendMsg", { delayInMinutes: delayInMinutes });
    
    // Format time for display
    const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const dateString = time.toLocaleDateString();
    
    alert(`Message scheduled successfully!\n\nTo: ${contact}\nTime: ${dateString} at ${timeString}`);
  });
});