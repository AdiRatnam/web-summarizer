document.addEventListener('DOMContentLoaded', () => {
    const summarizeAllBtn = document.getElementById('summarize-all');
    const summarizeSelectBtn = document.getElementById('summarize-select');
    const statusMsg = document.getElementById('status-msg');

    function showStatus(msg) {
        statusMsg.textContent = msg;
        setTimeout(() => {
            statusMsg.textContent = '';
        }, 3000);
    }

    async function sendMessageToContentScript(action) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            if (!tab) {
                showStatus('Cannot access the current tab.');
                return;
            }

            // In Manifest V3, content scripts are injected via manifest, but let's make sure it's active.
            chrome.tabs.sendMessage(tab.id, { action }, (response) => {
                if (chrome.runtime.lastError) {
                    showStatus("Please reload the page first.");
                } else {
                    window.close(); // Close the popup after action initiated
                }
            });
        } catch (error) {
            console.error('Error sending message:', error);
            showStatus('Something went wrong.');
        }
    }

    summarizeAllBtn.addEventListener('click', () => {
        sendMessageToContentScript('SUMMARIZE_ALL');
    });

    summarizeSelectBtn.addEventListener('click', () => {
        sendMessageToContentScript('START_SELECTION');
    });
});
