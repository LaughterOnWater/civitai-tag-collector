/**
 * Update the displayed count of collected images
 */
function updateCount() {
    chrome.storage.local.get("collectedData", ({ collectedData }) => {
        const count = collectedData ? collectedData.length : 0;
        document.getElementById("count").innerText = count;

        // Disable clear button if no data
        document.getElementById("clear").disabled = count === 0;
    });
}

/**
 * Update the toggle UI based on enabled state
 * @param {boolean} isEnabled - Whether collection is enabled
 */
function updateToggle(isEnabled) {
    const toggle = document.getElementById("toggle");
    const label = document.getElementById("toggle-label");

    if (isEnabled) {
        toggle.classList.add("active");
        label.textContent = "Enabled";
    } else {
        toggle.classList.remove("active");
        label.textContent = "Disabled";
    }
}

/**
 * Show a temporary message to the user
 * @param {string} text - The message text
 * @param {('success'|'error')} type - The message type
 */
function showMessage(text, type) {
    const message = document.getElementById("message");
    message.textContent = text;
    message.className = `message ${type}`;
    message.style.display = "block";

    setTimeout(() => {
        message.style.display = "none";
    }, 3000);
}

// Initialize UI on popup open
chrome.storage.local.get(["collectedData", "isEnabled"], ({ collectedData, isEnabled }) => {
    // Update count
    const count = collectedData ? collectedData.length : 0;
    document.getElementById("count").innerText = count;
    document.getElementById("clear").disabled = count === 0;

    // Update toggle (default to enabled if not set)
    updateToggle(isEnabled !== false);
});

/**
 * Listen for storage changes to update UI in real-time
 */
chrome.storage.onChanged.addListener((changes) => {
    if (changes.collectedData) {
        const count = changes.collectedData.newValue.length;
        document.getElementById("count").innerText = count;
        document.getElementById("clear").disabled = count === 0;
    }
    if (changes.isEnabled) {
        updateToggle(changes.isEnabled.newValue);
    }
});

/**
 * Handle toggle click to enable/disable collection
 */
document.getElementById("toggle").addEventListener("click", () => {
    chrome.storage.local.get("isEnabled", ({ isEnabled }) => {
        const newState = !(isEnabled !== false); // Toggle the state
        chrome.storage.local.set({ isEnabled: newState }, () => {
            updateToggle(newState);
            showMessage(
                newState ? "Collection enabled" : "Collection disabled",
                "success"
            );
        });
    });
});

/**
 * Handle download button click to export data as JSON
 */
document.getElementById("download").addEventListener("click", () => {
    chrome.storage.local.get("collectedData", ({ collectedData }) => {
        if (!collectedData || collectedData.length === 0) {
            showMessage("No data collected yet!", "error");
            return;
        }

        // Create pretty-printed JSON
        const json = JSON.stringify(collectedData, null, 2);
        const blob = new Blob([json], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Generate filename with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const filename = `civitai_generation_data_${timestamp}.json`;

        chrome.downloads.download({
            url,
            filename: filename,
            saveAs: true
        }, () => {
            showMessage(`Downloaded ${collectedData.length} images`, "success");
        });
    });
});

/**
 * Handle clear button click to remove all collected data
 */
document.getElementById("clear").addEventListener("click", () => {
    if (!confirm("Are you sure you want to clear all collected data? This cannot be undone.")) {
        return;
    }

    chrome.runtime.sendMessage({ type: "clear_data" }, (response) => {
        if (response && response.success) {
            showMessage("All data cleared", "success");
        } else {
            showMessage("Failed to clear data", "error");
        }
    });
});
