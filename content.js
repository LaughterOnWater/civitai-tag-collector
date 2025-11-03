/**
 * Civitai Prompt Collector - Content Script
 * Extracts generation data from Civitai image detail pages
 */

/**
 * Track whether collection is enabled
 * @type {boolean}
 */
let isEnabled = true;

/**
 * Reference to the floating collect button
 * @type {HTMLButtonElement|null}
 */
let collectButton = null;

// Load enabled state from storage
chrome.storage.local.get("isEnabled", ({ isEnabled: enabled }) => {
    isEnabled = enabled !== false; // Default to true if not set
    updateButtonVisibility();
});

// Listen for enabled state changes
chrome.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled) {
        isEnabled = changes.isEnabled.newValue;
        updateButtonVisibility();
    }
});

/**
 * Extract image ID from current URL
 * @returns {string|null} The image ID or null if not found
 */
function getImageId() {
    const match = window.location.pathname.match(/\/images\/(\d+)/);
    return match ? match[1] : null;
}

/**
 * Extract resources used from the Generation Data card
 * @returns {Array<{name: string, type: string, version: string}>}
 */
function extractResourcesUsed() {
    const resources = [];

    // Find the "Resources used" section
    let resourcesSection = null;
    const elements = document.querySelectorAll('p.mantine-Text-root');
    console.log('Looking for Resources used in', elements.length, 'text elements');

    for (let i = 0; i < elements.length; i++) {
        if (elements[i].textContent.trim() === 'Resources used') {
            console.log('Found Resources used header at index', i);
            // Find the <ul> that follows this header
            let parent = elements[i].closest('div');
            if (parent) {
                resourcesSection = parent.querySelector('ul');
                if (!resourcesSection) {
                    // Try looking at the next sibling
                    let sibling = parent.nextElementSibling;
                    if (sibling) {
                        resourcesSection = sibling.querySelector('ul');
                    }
                }
            }
            break;
        }
    }

    if (resourcesSection) {
        console.log('Found resources list');
        const items = resourcesSection.querySelectorAll('li');
        console.log('Found', items.length, 'resource items');

        items.forEach(item => {
            const nameElement = item.querySelector('p.underline');
            const typeElement = item.querySelector('.mantine-Badge-label');
            const versionElement = item.querySelector('p.text-xs');

            if (nameElement) {
                const resource = {
                    name: nameElement.textContent.trim(),
                    type: typeElement ? typeElement.textContent.trim() : '',
                    version: versionElement ? versionElement.textContent.trim() : ''
                };
                console.log('Extracted resource:', resource);
                resources.push(resource);
            }
        });
    } else {
        console.warn('Resources list not found');
    }

    return resources;
}

/**
 * Extract tags from the mantine-Group-root div
 * These are Civitai's auto-tagged categories
 * @returns {string[]} Array of tag strings
 */
function extractTags() {
    const tags = [];

    // Find all mantine-Group-root divs (there may be multiple)
    const groupContainers = document.querySelectorAll('div.mantine-Group-root');
    console.log('Found', groupContainers.length, 'mantine-Group-root containers');

    groupContainers.forEach(container => {
        // Look for badges or votable tags within each container
        const badges = container.querySelectorAll('.mantine-Badge-root, [class*="VotableTag"]');

        badges.forEach(badge => {
            const text = badge.textContent.trim();
            // Skip empty badges and some common non-tag elements
            if (text && text.length > 0 && !text.includes('Generation data') && text !== '...') {
                // Clean up the text - remove vote counts and extra characters
                let cleanText = text;

                // Remove numeric vote counts at the end (e.g., "character123" -> "character")
                cleanText = cleanText.replace(/\d+$/, '').trim();

                // Only add if not already in the list and has reasonable length
                if (cleanText.length > 0 && !tags.includes(cleanText)) {
                    tags.push(cleanText);
                }
            }
        });
    });

    console.log('Extracted', tags.length, 'tags:', tags);
    return tags;
}

/**
 * Collect all data from the current page
 * @returns {Object|null} The collected data or null if extraction failed
 */
function collectGenerationData() {
    const imageId = getImageId();
    if (!imageId) {
        console.error('Could not extract image ID from URL');
        return null;
    }

    const data = {
        imageId: imageId,
        url: window.location.href,
        resourcesUsed: extractResourcesUsed(),
        tags: extractTags(),
        collectedAt: new Date().toISOString()
    };

    console.log('Collected data:', data);
    return data;
}

/**
 * Create and inject the floating collect button
 */
function createCollectButton() {
    if (collectButton) return; // Already exists

    collectButton = document.createElement('button');
    collectButton.id = 'civitai-collect-button';
    collectButton.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
            <polyline points="17 21 17 13 7 13 7 21"></polyline>
            <polyline points="7 3 7 8 15 8"></polyline>
        </svg>
        <span>Collect Data</span>
    `;

    // Styles
    Object.assign(collectButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: '10000',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        backgroundColor: '#228be6',
        color: 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
        transition: 'all 0.2s ease',
        fontFamily: 'Arial, sans-serif'
    });

    // Hover effect
    collectButton.addEventListener('mouseenter', () => {
        collectButton.style.backgroundColor = '#1c7ed6';
        collectButton.style.transform = 'translateY(-2px)';
        collectButton.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.4)';
    });

    collectButton.addEventListener('mouseleave', () => {
        collectButton.style.backgroundColor = '#228be6';
        collectButton.style.transform = 'translateY(0)';
        collectButton.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
    });

    // Click handler
    collectButton.addEventListener('click', async () => {
        console.log('Collect button clicked');

        if (!isEnabled) {
            showNotification('Collection is disabled. Enable it in the extension popup.', 'error');
            return;
        }

        const data = collectGenerationData();
        console.log('Extracted data:', data);

        if (!data) {
            showNotification('Failed to extract data from page', 'error');
            return;
        }

        // Send to background script
        chrome.runtime.sendMessage({
            type: "collect_generation_data",
            data: data
        }, (response) => {
            console.log('Response from background:', response);
            if (chrome.runtime.lastError) {
                console.error('Runtime error:', chrome.runtime.lastError);
                showNotification('Extension error: ' + chrome.runtime.lastError.message, 'error');
                return;
            }

            if (response && response.success) {
                if (response.isDuplicate) {
                    showNotification('Image updated with new data', 'warning');
                } else {
                    showNotification('Image data collected!', 'success');
                    // Change button appearance to indicate collection
                    collectButton.style.backgroundColor = '#40c057';
                    setTimeout(() => {
                        collectButton.style.backgroundColor = '#228be6';
                    }, 2000);
                }
            } else {
                showNotification('Failed to save data', 'error');
            }
        });
    });

    document.body.appendChild(collectButton);
    updateButtonVisibility();
}

/**
 * Update button visibility based on enabled state
 */
function updateButtonVisibility() {
    if (collectButton) {
        collectButton.style.display = isEnabled ? 'flex' : 'none';
    }
}

/**
 * Show a temporary notification to the user
 * @param {string} message - The notification message
 * @param {'success'|'error'|'warning'} type - The notification type
 */
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.textContent = message;

    const colors = {
        success: { bg: '#d3f9d8', color: '#2b8a3e', border: '#8ce99a' },
        error: { bg: '#ffe3e3', color: '#c92a2a', border: '#ffa8a8' },
        warning: { bg: '#fff3bf', color: '#e67700', border: '#ffd43b' }
    };

    const style = colors[type] || colors.success;

    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: '10001',
        padding: '12px 20px',
        backgroundColor: style.bg,
        color: style.color,
        border: `2px solid ${style.border}`,
        borderRadius: '8px',
        fontSize: '14px',
        fontWeight: '600',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
        fontFamily: 'Arial, sans-serif',
        maxWidth: '300px'
    });

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.transition = 'opacity 0.3s ease';
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createCollectButton);
} else {
    createCollectButton();
}

// Also watch for dynamic content changes (SPA navigation)
const observer = new MutationObserver(() => {
    if (!collectButton || !document.body.contains(collectButton)) {
        createCollectButton();
    }
});

observer.observe(document.body, { childList: true, subtree: false });
