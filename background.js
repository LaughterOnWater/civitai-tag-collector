/**
 * @typedef {Object} ResourceUsed
 * @property {string} name - The resource name
 * @property {string} type - The resource type (Checkpoint, LoRA, etc.)
 * @property {string} version - The resource version
 */

/**
 * @typedef {Object} ImageData
 * @property {string} imageId - The Civitai image ID
 * @property {string} url - The full URL to the image page
 * @property {ResourceUsed[]} resourcesUsed - Array of resources (models, LoRAs, etc.)
 * @property {string[]} tags - Array of Civitai auto-tagged categories
 * @property {string} collectedAt - ISO timestamp of when data was collected
 */

/**
 * In-memory cache of collected image data
 * @type {ImageData[]}
 */
let collectedData = [];

/**
 * Load collected data from storage on startup
 * Critical for Manifest V3 service workers that can restart frequently
 */
chrome.storage.local.get("collectedData", ({ collectedData: storedData }) => {
    if (storedData) {
        collectedData = storedData;
        console.log("Loaded", collectedData.length, "items from storage");
    }
});

/**
 * Listen for data collection messages from content script
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "collect_generation_data") {
        const data = message.data;

        // Check for duplicates by imageId
        const existingIndex = collectedData.findIndex(e => e.imageId === data.imageId);

        if (existingIndex === -1) {
            // New entry
            collectedData.push(data);
            chrome.storage.local.set({ collectedData }, () => {
                console.log("Added image data:", data);
                sendResponse({ success: true, isDuplicate: false });
            });
        } else {
            // Update existing entry
            collectedData[existingIndex] = data;
            chrome.storage.local.set({ collectedData }, () => {
                console.log("Updated image data:", data);
                sendResponse({ success: true, isDuplicate: true });
            });
        }

        return true; // Keep message channel open for async response

    } else if (message.type === "clear_data") {
        collectedData = [];
        chrome.storage.local.set({ collectedData: [] }, () => {
            console.log("Cleared all collected data");
            sendResponse({ success: true });
        });
        return true;
    }
});
