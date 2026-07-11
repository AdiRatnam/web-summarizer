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
        if (typeof GEMINI_API_KEY === 'undefined' || !GEMINI_API_KEY || GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
            throw new Error("API Key is missing. Please run build.py to generate config.js from your .env file.");
        }

        const prompt = `Summarize the main agenda and important points of the following content in simple and easily understandable English. If the content contains different languages, translate and summarize it in English. Use standard HTML tags like <b>, <ul>, <li>, <p>, <h3> for formatting to make it look good, but do not use full document tags like <html>, <head> or <body>. Do not include markdown codeblocks around the HTML.\n\nContent:\n${text.substring(0, 30000)}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        const summary = data.candidates[0].content.parts[0].text;
        
        // Remove potential markdown code blocks if the model still returns them
        const cleanSummary = summary.replace(/^```html/i, '').replace(/^```/i, '').replace(/```$/i, '');
        contentDiv.innerHTML = cleanSummary;

    } catch (error) {
        console.error("Gemini API Error:", error);
        contentDiv.innerHTML = `<div style="color: #ef4444; padding: 20px; text-align: center;">
            <h3>Error generating summary</h3>
            <p>${error.message}</p>
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
