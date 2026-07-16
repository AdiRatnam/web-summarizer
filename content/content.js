let isSelectionMode = false;
let selectedElements = [];
let floatingPanel = null;
let summaryOverlay = null;

// Initialize UI
function initUI() {
    if (!document.getElementById('gemini-floating-panel')) {
        floatingPanel = document.createElement('div');
        floatingPanel.id = 'gemini-floating-panel';
        floatingPanel.style.display = 'none';
        floatingPanel.innerHTML = `
            <span id="gemini-selection-count">0 items selected</span>
            <button id="gemini-btn-summarize">Summarize</button>
            <button id="gemini-btn-cancel">Cancel</button>
        `;
        document.body.appendChild(floatingPanel);

        document.getElementById('gemini-btn-summarize').addEventListener('click', () => {
            const textToSummarize = selectedElements.map(el => el.innerText).join('\n\n');
            endSelectionMode();
            summarizeText(textToSummarize);
        });

        document.getElementById('gemini-btn-cancel').addEventListener('click', endSelectionMode);
    }

    if (!document.getElementById('gemini-summary-overlay')) {
        summaryOverlay = document.createElement('div');
        summaryOverlay.id = 'gemini-summary-overlay';
        summaryOverlay.innerHTML = `
            <div id="gemini-summary-modal">
                <div id="gemini-modal-header">
                    <h2>✨ AI Summary</h2>
                    <button id="gemini-btn-close">&times;</button>
                </div>
                <div id="gemini-modal-content"></div>
            </div>
        `;
        document.body.appendChild(summaryOverlay);

        document.getElementById('gemini-btn-close').addEventListener('click', () => {
            summaryOverlay.classList.remove('active');
        });
    }
}

// Selection Mode Logic
function startSelectionMode() {
    isSelectionMode = true;
    selectedElements = [];
    document.body.classList.add('gemini-selection-mode-active');
    floatingPanel.style.display = 'flex';
    updateSelectionCount();

    document.addEventListener('mouseover', handleMouseOver, true);
    document.addEventListener('mouseout', handleMouseOut, true);
    document.addEventListener('click', handleClick, true);
}

function endSelectionMode() {
    isSelectionMode = false;
    document.body.classList.remove('gemini-selection-mode-active');
    floatingPanel.style.display = 'none';

    document.removeEventListener('mouseover', handleMouseOver, true);
    document.removeEventListener('mouseout', handleMouseOut, true);
    document.removeEventListener('click', handleClick, true);

    // Remove highlights
    document.querySelectorAll('.gemini-hover-highlight').forEach(el => el.classList.remove('gemini-hover-highlight'));
    document.querySelectorAll('.gemini-selected-highlight').forEach(el => el.classList.remove('gemini-selected-highlight'));
    selectedElements = [];
}

function handleMouseOver(e) {
    if (!isSelectionMode) return;
    if (e.target.closest('#gemini-floating-panel') || e.target.closest('#gemini-summary-overlay')) return;
    e.target.classList.add('gemini-hover-highlight');
}

function handleMouseOut(e) {
    if (!isSelectionMode) return;
    e.target.classList.remove('gemini-hover-highlight');
}

function handleClick(e) {
    if (!isSelectionMode) return;
    if (e.target.closest('#gemini-floating-panel') || e.target.closest('#gemini-summary-overlay')) return;
    
    e.preventDefault();
    e.stopPropagation();

    const el = e.target;
    if (selectedElements.includes(el)) {
        selectedElements = selectedElements.filter(item => item !== el);
        el.classList.remove('gemini-selected-highlight');
    } else {
        selectedElements.push(el);
        el.classList.add('gemini-selected-highlight');
    }
    updateSelectionCount();
}

function updateSelectionCount() {
    const countSpan = document.getElementById('gemini-selection-count');
    if (countSpan) {
        countSpan.textContent = `${selectedElements.length} item${selectedElements.length !== 1 ? 's' : ''} selected`;
    }
}

// API Call Logic
async function summarizeText(text) {
    if (!text || text.trim() === '') {
        alert("No text found to summarize.");
        return;
    }

    const contentDiv = document.getElementById('gemini-modal-content');
    contentDiv.innerHTML = '<span class="gemini-loader"></span><p style="text-align: center;">Analyzing content...</p>';
    summaryOverlay.classList.add('active');

    try {
        chrome.runtime.sendMessage({ action: 'FETCH_SUMMARY', text: text }, (response) => {
            if (chrome.runtime.lastError) {
                console.error("Runtime Error:", chrome.runtime.lastError);
                contentDiv.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">
                    <h3>Error</h3>
                    <p>Could not connect to the extension. Try reloading the page.</p>
                </div>`;
                return;
            }

            if (response && response.error) {
                contentDiv.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">
                    <h3>Error generating summary</h3>
                    <p>${DOMPurify.sanitize(response.error)}</p>
                </div>`;
            } else if (response && response.success && response.summary) {
                contentDiv.innerHTML = DOMPurify.sanitize(response.summary);
            } else {
                contentDiv.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">
                    <h3>Error</h3>
                    <p>Unknown error occurred.</p>
                </div>`;
            }
        });
    } catch (error) {
        console.error("Error:", error);
        contentDiv.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">
            <h3>Error generating summary</h3>
            <p>${DOMPurify.sanitize(error.message)}</p>
        </div>`;
    }
}

function summarizeEntirePage() {
    // Try to get main content or fallback to body innerText
    const mainContent = document.querySelector('article') || document.querySelector('main') || document.body;
    summarizeText(mainContent.innerText);
}

// Message Listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    initUI();
    if (request.action === 'START_SELECTION') {
        startSelectionMode();
        sendResponse({status: "Selection mode started"});
    } else if (request.action === 'SUMMARIZE_ALL') {
        summarizeEntirePage();
        sendResponse({status: "Summarizing all started"});
    }
    return true;
});

// Run init on load just to be ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initUI);
} else {
    initUI();
}
