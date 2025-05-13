chrome.storage.local.get(["contact", "message"], ({ contact, message }) => {
  const contactLower = contact.toLowerCase();

  function findChatAndSend() {
    console.log("Searching for chat: " + contact);

    // More robust chat search - search for all spans inside contact list
    const chats = document.querySelectorAll("span[title], div[title]");
    let chat = null;

    for (let el of chats) {
      if (el.title && el.title.toLowerCase().includes(contactLower)) {
        chat = el;
        console.log("Found matching chat: " + el.title);
        break;
      }
    }

    if (!chat) {
      console.log("Chat not found: " + contact);
      alert("Chat not found: " + contact);
      return;
    }

    console.log("Found chat: " + chat.title);
    chat.click();

    // Wait for chat to open
    setTimeout(() => {
      // DIRECT PROGRAMMATIC SEND APPROACH
      // This uses WhatsApp Web's internal Window.Store to send messages
      // This bypasses UI completely and is much more reliable
      
      console.log("Attempting to send message via WhatsApp Web's internal API");
      
      try {
        // Get WhatsApp's internal modules to access the Store
        const getElementByXpath = function(xpath) {
          return document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        };
        
        // Function to find WhatsApp's internal modules through a known UI element
        function getWhatsAppModules() {
          // Find any active chat or UI element that would have the modules attached
          const element = getElementByXpath("//*[@id='app']") || 
                         document.querySelector('#app') || 
                         document.querySelector('div[data-asset-chat-background]') ||
                         document.querySelector('[data-testid="conversation-panel-wrapper"]');
          
          if (!element) {
            console.log("Couldn't find WhatsApp app element");
            return null;
          }
          
          // Find webpack modules through the element's React props
          for (const key in element) {
            if (key.startsWith("__reactProps$") && element[key] && element[key].children) {
              console.log("Found React props");
              // Navigate through React component tree to find modules
              return traverseReactTree(element);
            }
          }
          
          return null;
        }
        
        // Function to traverse React component tree looking for Store modules
        function traverseReactTree(element) {
          // Helper function to search objects recursively
          function searchForStore(obj, depth = 0) {
            if (depth > 10) return null; // Prevent infinite recursion
            
            if (!obj || typeof obj !== 'object') return null;
            
            // Look for modules/stores with send message capability
            if (obj.Chat && obj.Msg) return obj;
            if (obj.sendMessage || obj.sendTextMsgToChat) return obj;
            
            // Continue search in object properties
            for (const key in obj) {
              if (key === "sendMessage" || key === "sendTextMsgToChat") {
                return obj;
              }
              
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                const result = searchForStore(obj[key], depth + 1);
                if (result) return result;
              }
            }
            
            return null;
          }
          
          // Start search from the element
          for (const key in element) {
            if (key.startsWith("__reactProps$") || key.startsWith("__reactFiber$")) {
              const result = searchForStore(element[key]);
              if (result) return result;
            }
          }
          
          return null;
        }
        
        const modules = getWhatsAppModules();
        
        if (modules) {
          console.log("Found WhatsApp modules, attempting to send message");
          
          // Try multiple approaches to find the correct method to send messages
          if (modules.sendMessage) {
            console.log("Using sendMessage function");
            modules.sendMessage(message);
            alert("✅ Message sent to " + contact + " using WhatsApp internal API");
            return;
          } 
          
          if (modules.sendTextMsgToChat) {
            console.log("Using sendTextMsgToChat function");
            modules.sendTextMsgToChat(message);
            alert("✅ Message sent to " + contact + " using WhatsApp internal API");
            return;
          }
          
          if (modules.Chat && modules.Msg) {
            console.log("Using Chat and Msg modules");
            const chat = modules.Chat.get(contact);
            if (chat) {
              chat.sendMessage(message);
              alert("✅ Message sent to " + contact + " using WhatsApp internal API");
              return;
            }
          }
        }
        
        // If internal API approach fails, fall back to UI automation
        console.log("Internal API approach failed, falling back to UI automation");
        sendThroughUI();
      } catch (error) {
        console.error("Error in direct send:", error);
        // Fall back to UI automation on error
        sendThroughUI();
      }
      
      // UI automation fallback function
      function sendThroughUI() {
        console.log("Trying UI automation fallback");
        
        // Try to find the input field
        const inputBox = 
          document.querySelector("div[contenteditable='true'][data-tab='10']") ||
          document.querySelector("div[contenteditable='true']") ||
          document.querySelector("div[role='textbox']") ||
          document.querySelector(".selectable-text.copyable-text[contenteditable='true']");
          
        if (!inputBox) {
          console.log("Input box not found");
          alert("Input box not found. Please make sure WhatsApp Web is open properly.");
          return;
        }
        
        // CRITICAL APPROACH: Use execCommand instead of setting content directly
        // This approach is known to work better with WhatsApp
        
        // Focus and select the input field
        inputBox.focus();
        
        // Use document.execCommand to insert text
        // This properly triggers WhatsApp's internal handlers
        const successful = document.execCommand('insertText', false, message);
        
        if (successful) {
          console.log("Successfully inserted text with execCommand");
        } else {
          console.log("execCommand failed, trying alternative approach");
          
          // Alternative: Try to paste the text from clipboard
          try {
            // Use the clipboard API to set the text
            navigator.clipboard.writeText(message).then(() => {
              // Paste from clipboard
              document.execCommand('paste');
              console.log("Pasted text from clipboard");
            });
          } catch (e) {
            console.error("Clipboard approach failed:", e);
            
            // Last resort: Set content directly
            inputBox.textContent = message;
            inputBox.dispatchEvent(new Event('input', { bubbles: true }));
          }
        }
        
        // Wait a moment for WhatsApp to process input
        setTimeout(() => {
          // Try to find the send button
          let sendBtn = null;
          const sendBtnSelectors = [
            "button[aria-label='Send']",
            "span[data-icon='send']",
            "button[data-testid='send']"
          ];
          
          for (const selector of sendBtnSelectors) {
            const btn = document.querySelector(selector);
            if (btn) {
              sendBtn = btn;
              break;
            }
          }
          
          if (sendBtn) {
            console.log("Found send button, clicking it");
            sendBtn.click();
            alert("✅ Message sent to " + contact);
          } else {
            console.log("Send button not found, trying Enter key");
            
            // Try Enter key as last resort
            inputBox.dispatchEvent(new KeyboardEvent('keydown', {
              key: 'Enter',
              code: 'Enter',
              bubbles: true
            }));
            
            alert("Attempted to send message using Enter key. Please check if the message was sent.");
          }
        }, 1000);
      }
    }, 2000);
  }

  // Allow enough time for WhatsApp to fully load
  setTimeout(findChatAndSend, 3000);
});