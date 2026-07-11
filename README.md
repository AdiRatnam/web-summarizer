# Gemini Web Summarizer 🌟

A sleek, modern Chrome Extension that leverages the power of Google's Gemini API to summarize web content into simple, easy-to-understand English. Whether you want the gist of an entire article or just a specific section, this extension has you covered.

## ✨ Features

- **Select & Summarize**: Interactive selection mode allows you to highlight specific paragraphs or sections of a webpage and summarize only what you care about.
- **Full Page Summary**: One-click summary of the entire webpage's main content.
- **Multilingual Support**: No matter what language the original webpage is in, the extension is instructed to translate and output the summary in clear, simple English.
- **Modern UI**: Features a clean, professional dark-mode design with smooth animations and floating control panels.

## 🚀 Installation & Setup

Because this extension uses your personal Gemini API key, it requires a quick local setup before loading it into Chrome.

### 1. Add your API Key
1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey) (Ensure it starts with `AIza` or the new `AQ.` format).
2. Create a file named `.env` in the root of this project.
3. Add your key to the file like this:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

### 2. Build the Config
Since this is a vanilla JavaScript extension without a bundler, run the included Python script to safely inject your key into the extension:
```bash
python build.py
```
*(This will generate a `config.js` file. Note: Both `.env` and `config.js` are ignored by git to keep your key safe!)*

### 3. Load into Chrome
1. Open Google Chrome and navigate to `chrome://extensions/`.
2. Toggle on **Developer mode** in the top right corner.
3. Click **Load unpacked**.
4. Select the folder containing this repository.

## 🛠️ Tech Stack
- Vanilla JavaScript (Manifest V3)
- HTML & CSS (Custom Professional Dark Theme)
- Python (for build script)
- Google Gemini API (`gemini-3.1-flash-lite`)
