chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'FETCH_SUMMARY') {
        handleFetchSummary(request.text, sendResponse);
        return true; // Indicates we will send response asynchronously
    }
});

async function handleFetchSummary(text, sendResponse) {
    try {
        const result = await chrome.storage.local.get(['geminiApiKey']);
        const apiKey = result.geminiApiKey;

        if (!apiKey) {
            sendResponse({ error: "API Key is missing. Please open the extension popup to enter your Gemini API Key." });
            return;
        }

        const prompt = `Summarize the main agenda and important points of the following content in simple and easily understandable English. If the content contains different languages, translate and summarize it in English. Use standard HTML tags like <b>, <ul>, <li>, <p>, <h3> for formatting to make it look good, but do not use full document tags like <html>, <head> or <body>. Do not include markdown codeblocks around the HTML.\n\nContent:\n${text.substring(0, 30000)}`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`, {
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
            throw new Error(`API returned ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        if (data.candidates && data.candidates.length > 0) {
            const summary = data.candidates[0].content.parts[0].text;
            // Remove potential markdown code blocks if the model still returns them
            const cleanSummary = summary.replace(/^```html/i, '').replace(/^```/i, '').replace(/```$/i, '');
            sendResponse({ success: true, summary: cleanSummary });
        } else {
            throw new Error("No response generated from Gemini API.");
        }

    } catch (error) {
        console.error("Gemini API Error:", error);
        sendResponse({ error: error.message });
    }
}
