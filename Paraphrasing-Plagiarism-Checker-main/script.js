document.addEventListener('DOMContentLoaded', function() {
    const API_BASE_URL = document.querySelector('meta[name="api-base-url"]')?.content
        || 'http://127.0.0.1:5000';
    const serviceStatus = document.getElementById('service-status');

    async function requestApi(path, body) {
        const response = await fetch(`${API_BASE_URL}${path}`, body === undefined ? {} : {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        let data;
        try {
            data = await response.json();
        } catch (error) {
            throw new Error('The backend returned an unreadable response.');
        }

        if (!response.ok) {
            const message = data && typeof data.error === 'string'
                ? data.error
                : `Request failed (${response.status}).`;
            throw new Error(message);
        }
        return data;
    }

    async function checkServiceHealth() {
        try {
            const health = await requestApi('/');
            if (health?.features?.paraphrasing) {
                serviceStatus.textContent = 'Services ready · AI paraphrasing and text comparison are available';
                serviceStatus.className = 'service-status ready';
            } else {
                serviceStatus.textContent = 'Text comparison ready · add a Gemini API key to enable paraphrasing';
                serviceStatus.className = 'service-status warning';
            }
        } catch (error) {
            console.error('Backend health check failed:', error);
            serviceStatus.textContent = 'Backend offline · start the Flask backend to use the tools';
            serviceStatus.className = 'service-status offline';
        }
    }

    checkServiceHealth();

    const themeToggle = document.getElementById('theme-toggle');
    let savedTheme = 'light';
    try {
        savedTheme = localStorage.getItem('academic-assistant-theme') || 'light';
    } catch (error) {
        console.warn('Could not read the saved theme preference:', error);
    }

    function setTheme(theme) {
        const isDark = theme === 'dark';
        document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
        themeToggle.setAttribute('aria-pressed', String(isDark));
        themeToggle.setAttribute('aria-label', `Switch to ${isDark ? 'light' : 'dark'} theme`);
        themeToggle.innerHTML = `<i class="fas fa-${isDark ? 'sun' : 'moon'}" aria-hidden="true"></i><span>${isDark ? 'Light mode' : 'Dark mode'}</span>`;
    }

    setTheme(savedTheme === 'dark' ? 'dark' : 'light');
    themeToggle.addEventListener('click', () => {
        const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
        setTheme(nextTheme);
        try {
            localStorage.setItem('academic-assistant-theme', nextTheme);
        } catch (error) {
            console.warn('Could not save the theme preference:', error);
        }
    });

    // Tab switching functionality
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');

            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Show active tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabId}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });

    // Word count functionality
    function countWords(text) {
        return text.trim().split(/\s+/).filter(word => word.length > 0).length;
    }

    const originalText = document.getElementById('original-text');
    const originalWordCount = document.getElementById('original-word-count');

    originalText.addEventListener('input', () => {
        originalWordCount.textContent = countWords(originalText.value);
    });

    // Paraphrase functionality
    const paraphraseBtn = document.getElementById('paraphrase-btn');
    const paraphrasedText = document.getElementById('paraphrased-text');
    const paraphrasedWordCount = document.getElementById('paraphrased-word-count');
    const loadingParaphrase = document.getElementById('loading-paraphrase');

    paraphraseBtn.addEventListener('click', async () => {
        const text = originalText.value.trim();
        if (!text) {
            showToast('Please enter some text to paraphrase', 'error');
            return;
        }

        try {
            loadingParaphrase.classList.remove('hidden');
            paraphraseBtn.disabled = true;
            paraphraseBtn.setAttribute('aria-busy', 'true');
            paraphrasedText.textContent = '';

            const data = await requestApi('/api/paraphrase', { text });
            if (typeof data.paraphrased !== 'string' || !data.paraphrased.trim()) {
                throw new Error('The backend did not return a paraphrased text.');
            }
            paraphrasedText.textContent = data.paraphrased;
            paraphrasedWordCount.textContent = countWords(data.paraphrased);
            showToast('Text paraphrased successfully!', 'success');
        } catch (error) {
            console.error('Error:', error);
            showToast(
                error instanceof TypeError
                    ? 'Cannot reach the backend. Start the Flask server and try again.'
                    : error.message,
                'error'
            );
        } finally {
            loadingParaphrase.classList.add('hidden');
            paraphraseBtn.disabled = false;
            paraphraseBtn.removeAttribute('aria-busy');
        }
    });

    // Text similarity functionality
    const checkPlagiarismBtn = document.getElementById('check-plagiarism-btn');
    const plagiarismOriginal = document.getElementById('plagiarism-original');
    const plagiarismComparison = document.getElementById('plagiarism-comparison');
    const plagiarismScore = document.getElementById('plagiarism-score');
    const plagiarismAnalysis = document.getElementById('plagiarism-analysis');
    const loadingPlagiarism = document.getElementById('loading-plagiarism');

    checkPlagiarismBtn.addEventListener('click', async () => {
        const original = plagiarismOriginal.value.trim();
        const comparison = plagiarismComparison.value.trim();

        if (!original || !comparison) {
            showToast('Please enter both original and comparison texts', 'error');
            return;
        }

        try {
            loadingPlagiarism.classList.remove('hidden');
            checkPlagiarismBtn.disabled = true;
            checkPlagiarismBtn.setAttribute('aria-busy', 'true');
            plagiarismAnalysis.innerHTML = '';
            plagiarismScore.textContent = '0%';

            const data = await requestApi('/api/check-plagiarism', { original, comparison });
            if (!Number.isFinite(Number(data.score))) {
                throw new Error('The backend returned an invalid similarity score.');
            }
            displayFormattedPlagiarismResults(data);
        } catch (error) {
            console.error('Error:', error);
            showToast(
                error instanceof TypeError
                    ? 'Cannot reach the backend. Start the Flask server and try again.'
                    : error.message,
                'error'
            );
        } finally {
            loadingPlagiarism.classList.add('hidden');
            checkPlagiarismBtn.disabled = false;
            checkPlagiarismBtn.removeAttribute('aria-busy');
        }
    });

    // Copy paraphrased text functionality
    const copyBtn = document.getElementById('copy-paraphrased');

    copyBtn.addEventListener('click', () => {
        const text = paraphrasedText.innerText;
        if (!text) {
            showToast('No text to copy', 'error');
            return;
        }

        navigator.clipboard.writeText(text)
            .then(() => {
                showToast('Text copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Failed to copy text: ', err);
                showToast('Failed to copy text to clipboard', 'error');
            });
    });

    function escapeHtml(value) {
        return String(value).replace(/[&<>"']/g, character => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        })[character]);
    }

    function displayFormattedPlagiarismResults(data) {
        const score = Math.min(100, Math.max(0, Number(data.score)));
        plagiarismScore.textContent = `${score}%`;

        const scoreCircle = document.querySelector('.score-circle');
        scoreCircle.style.background = `conic-gradient(
            var(--accent-color) ${score}%,
            var(--light-gray) ${score}%
        )`;

        let analysisHtml = `<div class="analysis-content">
            <h3>Analysis</h3>
            <p>${escapeHtml(data.analysis || 'Similarity analysis completed.')}</p>`;

        if (Array.isArray(data.matches) && data.matches.length > 0) {
            analysisHtml += `<h3>Matched Content</h3>
            <div class="matches-container">`;

            data.matches.forEach(match => {
                const matchType = ['exact', 'paraphrase', 'structural', 'unknown'].includes(match.type)
                    ? match.type
                    : 'unknown';
                analysisHtml += `
                <div class="match-item">
                    <div class="match-type ${matchType}">${escapeHtml(matchType)}</div>
                    <div class="match-content">
                        <div class="match-original">
                            <strong>Original:</strong> ${escapeHtml(match.original || '')}
                        </div>
                        <div class="match-comparison">
                            <strong>Comparison:</strong> ${escapeHtml(match.comparison || '')}
                        </div>
                    </div>
                </div>`;
            });

            analysisHtml += `</div>`;
        }

        if (data.recommendation) {
            analysisHtml += `<h3>Recommendation</h3>
            <p>${escapeHtml(data.recommendation)}</p>`;
        }

        analysisHtml += `</div>`;
        plagiarismAnalysis.innerHTML = analysisHtml;

        showToast('Text comparison completed!', 'success');
    }

    // Toast notification functionality
    const toast = document.getElementById('toast');
    const toastTitle = document.getElementById('toast-title');
    const toastMessage = document.getElementById('toast-message');
    const toastIcon = toast.querySelector('.toast-icon');
    const closeToast = document.querySelector('.close');
    let toastTimeout;

    function showToast(message, type = 'success') {
        const toastVariants = {
            success: { title: 'Success', icon: 'fa-check-circle', role: 'status' },
            error: { title: 'Error', icon: 'fa-circle-exclamation', role: 'alert' },
            warning: { title: 'Warning', icon: 'fa-triangle-exclamation', role: 'alert' },
            info: { title: 'Notice', icon: 'fa-circle-info', role: 'status' }
        };
        const variant = toastVariants[type] || toastVariants.info;

        window.clearTimeout(toastTimeout);
        toastTitle.textContent = variant.title;
        toastMessage.textContent = message;
        toast.className = 'toast active';
        toast.classList.add(toastVariants[type] ? type : 'info');
        toast.setAttribute('role', variant.role);
        toast.setAttribute('aria-live', variant.role === 'alert' ? 'assertive' : 'polite');
        toastIcon.className = `toast-icon fas ${variant.icon}`;

        toastTimeout = window.setTimeout(() => {
            toast.classList.remove('active');
        }, 5000);
    }

    closeToast.addEventListener('click', () => {
        window.clearTimeout(toastTimeout);
        toast.classList.remove('active');
    });
});