const openButton = document.getElementById("openPanel");
const status = document.getElementById("status");

function setStatus(text, isError = false) {
  status.textContent = text;
  status.classList.toggle("error", isError);
}

async function openStandalonePanel() {
  await chrome.tabs.create({ url: chrome.runtime.getURL("yange.html") });
  window.close();
}

async function openPanelOnActiveTab() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab = tabs[0];

    if (!tab?.id) {
      await openStandalonePanel();
      return;
    }

    if (!/^https?:\/\//.test(tab.url || "")) {
      await openStandalonePanel();
      return;
    }

    chrome.tabs.sendMessage(tab.id, { type: "SKLIGHT_OPEN_PANEL" }, () => {
      if (chrome.runtime.lastError) {
        openStandalonePanel();
        return;
      }
      window.close();
    });
  } catch {
    setStatus("Nepodarilo sa otvorit panel.", true);
  }
}

openButton.addEventListener("click", openPanelOnActiveTab);
