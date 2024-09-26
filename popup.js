// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const windowLabelsDiv = document.getElementById('window-labels');
  const saveButton = document.getElementById('save-labels');

  let windowLabels = {};

  // Get current windows
  browser.windows.getAll({ populate: true }).then(windows => {
    windows.forEach(window => {
      const div = document.createElement('div');
      div.className = 'window-label';

      // Get the title of the first tab
      let windowTitle = `Window ${window.id}`;
      if (window.tabs.length > 0) {
        windowTitle += ` - ${window.tabs[0].title}`;
      }

      const label = document.createElement('label');
      label.textContent = windowTitle;
      div.appendChild(label);

      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = 'Enter label';
      input.dataset.windowId = window.id;

      div.appendChild(input);
      windowLabelsDiv.appendChild(div);
    });
  });

  saveButton.addEventListener('click', () => {
    const inputs = windowLabelsDiv.querySelectorAll('input');
    inputs.forEach(input => {
      const windowId = parseInt(input.dataset.windowId);
      const label = input.value.trim();
      if (label) {
        windowLabels[windowId] = label;
      } else {
        delete windowLabels[windowId];
      }
    });

    // Send labels to background script
    browser.runtime.sendMessage({
      type: 'updateWindowLabels',
      labels: windowLabels
    }).then(() => {
      window.close(); // Close the popup after saving
    });
  });
});
