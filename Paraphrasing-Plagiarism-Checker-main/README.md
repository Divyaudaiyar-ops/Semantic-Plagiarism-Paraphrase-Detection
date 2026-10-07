# Academic Paraphrasing & Plagiarism Checker 

A modern, responsive web application that helps students paraphrase text with Google's Gemini AI and compare two texts for similarity.

## 🌟 Features

### ✏️ Academic Paraphrasing
- Transform your text into a unique, academically appropriate version
- Maintain the original meaning while using different vocabulary and sentence structures
- Get instant word count statistics

### 🔍 Text Similarity Check
- Compare two texts and receive a word-and-phrase similarity estimate
- View exact matching phrases and a percentage score
- Receive citation and review recommendations
- Local text comparison only; this does not search online sources or determine plagiarism

### 💻 User-Friendly Interface
- Clean, modern UI with intuitive navigation
- Responsive design that works on all devices (desktop, tablet, mobile)
- Real-time feedback and notifications
- Copy functionality for easy use of results

## 🛠️ Technologies Used

- **HTML5**: Semantic structure and accessibility
- **CSS3**: Modern styling with flexbox and CSS variables
- **JavaScript**: Dynamic functionality and API integration
- **Google Gemini AI**: Powering AI paraphrasing

## 📋 Usage Guide

### Paraphrasing Tool

1. Navigate to the "Paraphrase" tab
2. Enter or paste your original text in the left panel
3. Click the "Paraphrase" button
4. View your paraphrased text in the right panel
5. Use the "Copy" button to copy the result to your clipboard

### Plagiarism Checker

1. Navigate to the "Plagiarism Check" tab
2. Enter or paste the original text in the first text area
3. Enter or paste the comparison text in the second text area
4. Click the "Check Plagiarism" button
5. View the similarity score and detailed analysis
6. Review matched content and recommendations

## Local Setup

Requirements: Python 3.10 or newer and a modern browser. AI paraphrasing uses
Google Gemini and requires a Gemini API key from
[Google AI Studio](https://aistudio.google.com/app/apikey). The key stays in
the backend and is never sent to the browser.

### 1. Install backend dependencies

Run these commands from the project root in PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
```

### 2. Configure Gemini

```powershell
Copy-Item backend\.env.example backend\.env
```

Open `backend\.env`, set `GEMINI_API_KEY` to your own Google AI Studio key,
and save it. Do not commit or share this file. Text comparison works locally
without an API key; only AI paraphrasing needs Gemini.

### 3. Start the backend

In a PowerShell window from the project root:

```powershell
Set-Location backend
..\.venv\Scripts\python.exe backend\app.py
```

Keep this window open. The API should respond at `http://127.0.0.1:5000/`.

### 4. Start the frontend

In a second PowerShell window from the project root:

```powershell
.\.venv\Scripts\python.exe -m http.server 8000 --directory Paraphrasing-Plagiarism-Checker-main
```

Open `http://localhost:8000`. The status below the page heading reports if the
backend and Gemini configuration are available.

For a different backend address, set the `api-base-url` meta tag in
`Paraphrasing-Plagiarism-Checker-main\index.html`.

## Features and limitations

- **Paraphrase** sends the submitted text to Gemini using the backend API. Text
  is limited to 12,000 characters per request.
- **Compare texts** locally calculates normalized word and phrase similarity
  between only the two supplied texts and lists exact matching phrases.
- The comparison tool does not search the web or other documents, and its score
  is not a determination that plagiarism occurred.
- Empty/invalid requests, missing Gemini configuration, unavailable services,
  and provider errors are reported instead of returning sample output.

API endpoints:

- `GET /`: reports backend health and enabled features.
- `POST /api/paraphrase`: accepts `{"text": "..."}` and returns Gemini's
  paraphrase.
- `POST /api/check-plagiarism`: accepts `{"original": "...", "comparison": "..."}`
  and returns a local similarity score, exact phrase matches, and guidance.

## Tests

From the project root:

```powershell
Set-Location backend
..\.venv\Scripts\python.exe -m unittest discover -s tests -v
```

## 🎨 UI Features

- **Tab Navigation**: Easy switching between paraphrasing and plagiarism checking
- **Loading Indicators**: Visual feedback during API processing
- **Toast Notifications**: User-friendly status messages
- **Responsive Design**: Adapts to different screen sizes
- **Interactive Elements**: Buttons with hover effects and visual feedback
- **Syntax Highlighting**: Colored formatting for JSON data in plagiarism results

### 🔄 JSON Formatting

The plagiarism checker includes advanced JSON formatting capabilities:

- **Syntax Highlighting**: Color-coded display of JSON data for better readability
- **Structured Display**: Properly formatted and indented JSON results
- **Fallback Mechanisms**: Multiple approaches to handle various response formats
- **Error Handling**: Graceful handling of unexpected response structures

## 🛡️ Error Handling

The application includes robust error handling for:
- Empty text submissions
- API connection failures
- Unexpected response formats
- JSON parsing issues

## 🆕 Recent Improvements

- **Enhanced JSON Handling**: Improved parsing and display of plagiarism check results
- **Better Error Recovery**: Multiple fallback mechanisms for handling various response formats
- **Improved UI for Results**: More readable and user-friendly display of analysis data
- **Syntax Highlighting**: Color-coded JSON for better readability
- **Responsive Feedback**: Better toast notifications with appropriate styling

## 🔮 Future Enhancements

- Dark mode toggle
- Save results to PDF
- History of previous paraphrases and checks
- Additional language support
- Enhanced text formatting options
- Export results in different formats

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Contributors

-Rupesh
## 🙏 Acknowledgements

- [Google Gemini AI](https://deepmind.google/technologies/gemini/) for powering the AI capabilities
- [Font Awesome](https://fontawesome.com/) for the icons
- [Railway](https://railway.app/) for hosting the backend API
