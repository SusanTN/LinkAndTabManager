// background.js

let windowLabels = {};

// Listen for messages from the popup to update labels
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateWindowLabels') {
    windowLabels = message.labels;
    updateContextMenu();
  }
});

// Function to update the context menu
function updateContextMenu() {
  browser.contextMenus.removeAll().then(() => {
    // Create the parent context menu for "Move to Window"
    browser.contextMenus.create({
      id: "move-to-window",
      title: "Move to Window",
      contexts: ["page", "tab"]
    });

    // Create the parent context menu for "Open in Window"
    browser.contextMenus.create({
      id: "open-in-window",
      title: "Open in Window",
      contexts: ["link"]
    });

    // Get all open windows and create submenu items
    browser.windows.getAll({ populate: true }).then(windows => {
      windows.forEach(window => {
        let title;
        if (windowLabels[window.id]) {
          title = windowLabels[window.id];
        } else if (window.tabs.length > 0) {
          title = `Window ${window.id} - ${window.tabs[0].title}`;
        } else {
          title = `Window ${window.id}`;
        }

        // Submenu items for "Move to Window"
        browser.contextMenus.create({
          id: `move-window-${window.id}`,
          parentId: "move-to-window",
          title: title,
          contexts: ["page", "tab"]
        });

        // Submenu items for "Open in Window"
        browser.contextMenus.create({
          id: `open-window-${window.id}`,
          parentId: "open-in-window",
          title: title,
          contexts: ["link"]
        });
      });

      // Option to move to a new window
      browser.contextMenus.create({
        id: "move-new-window",
        parentId: "move-to-window",
        title: "New Window",
        contexts: ["page", "tab"]
      });

      // Option to open in a new window
      browser.contextMenus.create({
        id: "open-new-window",
        parentId: "open-in-window",
        title: "New Window",
        contexts: ["link"]
      });
    });
  });
}

// Update context menu when windows are created or removed
browser.windows.onCreated.addListener(updateContextMenu);
browser.windows.onRemoved.addListener(updateContextMenu);

// Initial setup of the context menu
updateContextMenu();

// Listener for context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "move-new-window") {
    // Move highlighted tabs to a new window
    browser.tabs.query({ highlighted: true, currentWindow: true }).then(tabs => {
      let tabIds = tabs.map(t => t.id);
      browser.windows.create({ tabId: tabIds[0] }).then(newWindow => {
        if (tabIds.length > 1) {
          browser.tabs.move(tabIds.slice(1), { windowId: newWindow.id, index: -1 });
        }
      });
    }).catch(error => {
      console.error("Error moving tabs to new window: ", error);
    });
  } else if (info.menuItemId.startsWith("move-window-")) {
    // Move highlighted tabs to an existing window
    let windowId = parseInt(info.menuItemId.split('-')[2]);
    browser.tabs.query({ highlighted: true, currentWindow: true }).then(tabs => {
      let tabIds = tabs.map(t => t.id);
      browser.tabs.move(tabIds, { windowId: windowId, index: -1 });
    }).catch(error => {
      console.error("Error moving tabs: ", error);
    });
  } else if (info.menuItemId === "open-new-window") {
    // Open link in a new window
    browser.windows.create({
      url: info.linkUrl
    }).catch(error => {
      console.error("Error creating new window: ", error);
    });
  } else if (info.menuItemId.startsWith("open-window-")) {
    // Open link in an existing window
    let windowId = parseInt(info.menuItemId.split('-')[2]);
    browser.tabs.create({
      url: info.linkUrl,
      windowId: windowId,
      active: false
    }).catch(error => {
      console.error("Error creating tab: ", error);
    });
  }
});
