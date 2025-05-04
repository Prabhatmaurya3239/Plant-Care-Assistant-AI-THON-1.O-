<script>
document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('plant-image-upload');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const analyzeButton = document.getElementById('analyze-button');
    const analyzeButtonContent = document.getElementById('analyze-button-content');
    const loadingSpinner = document.getElementById('loading-spinner');
    const errorAlert = document.getElementById('error-alert');
    const errorDescription = document.getElementById('error-description');
    const loadingCard = document.getElementById('loading-card');
    const diagnosisCard = document.getElementById('diagnosis-card');
    const statusIconPlaceholder = document.getElementById('status-icon-placeholder');
    const statusBadge = document.getElementById('status-badge');
    const issueName = document.getElementById('issue-name');
    const confidenceScore = document.getElementById('confidence-score');
    const severityTicks = document.getElementById('severity-ticks');
    const adviceList = document.getElementById('advice-list');
    const noAdviceMessage = document.getElementById('no-advice-message');
    const adviceItemPlaceholder = document.querySelector('.advice-item-placeholder');
    const severityIndicator = document.getElementById('severity-indicator');

    let selectedImageBase64 = null;
    let isLoading = false;

    function showElement(el) { el.classList.remove('hidden'); }
    function hideElement(el) { el.classList.add('hidden'); }

    function setLoading(loading) {
        isLoading = loading;
        analyzeButton.disabled = loading || !selectedImageBase64;
        loading ? (
            hideElement(analyzeButtonContent),
            showElement(loadingSpinner),
            hideElement(errorAlert),
            hideElement(diagnosisCard),
            showElement(loadingCard)
        ) : (
            showElement(analyzeButtonContent),
            hideElement(loadingSpinner),
            hideElement(loadingCard)
        );
    }

    function displayError(msg) {
        errorDescription.textContent = msg;
        showElement(errorAlert);
        hideElement(diagnosisCard);
        hideElement(loadingCard);
    }

    function clearError() {
        hideElement(errorAlert);
        errorDescription.textContent = '';
    }

    function clearDiagnosis() {
        hideElement(diagnosisCard);
        issueName.textContent = 'N/A';
        confidenceScore.textContent = '0';
        statusBadge.textContent = 'Status';
        statusBadge.className = 'badge';
        statusIconPlaceholder.innerHTML = '';
        severityTicks.innerHTML = '';
        adviceList.innerHTML = '';
        adviceList.appendChild(adviceItemPlaceholder);
        hideElement(noAdviceMessage);
    }

    function displayDiagnosis(d) {
        clearError();
        const { diseaseName, confidence, status, advice } = d;
        const conf = (confidence * 100).toFixed(0);
        issueName.textContent = diseaseName || 'Unknown';
        confidenceScore.textContent = conf;

        let iconSvg = '', iconClass = '', badgeClass = 'badge ', statusLabel = 'Unknown';
        const icons = {
            healthy: { class: 'status-icon-healthy', label: 'Healthy' },
            minor: { class: 'status-icon-minor', label: 'Minor Issue' },
            moderate: { class: 'status-icon-moderate', label: 'Moderate Issue' },
            severe: { class: 'status-icon-severe', label: 'Severe Issue' }
        };
        const info = icons[status] || icons.healthy;
        iconClass = info.class;
        statusLabel = info.label;
        badgeClass += iconClass;

        iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor"
                     stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
                     class="status-icon ${iconClass}">
                     <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                     <polyline points="22 4 12 14.01 9 11.01"/>
                   </svg>`;

        statusIconPlaceholder.innerHTML = iconSvg;
        statusBadge.textContent = statusLabel;
        statusBadge.className = badgeClass;

        const levels = { healthy: 4, minor: 3, moderate: 2, severe: 1 };
        const filled = levels[status] || 0;
        severityTicks.innerHTML = '';
        for (let i = 0; i < 4; i++) {
            severityTicks.innerHTML += `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
                viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round" stroke-linejoin="round"
                class="severity-tick ${i < filled ? 'filled' : 'muted'} ${iconClass}">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/></svg>`;
        }

        showElement(severityIndicator);
        adviceList.innerHTML = '';
        if (advice?.length) {
            hideElement(noAdviceMessage);
            advice.forEach(item => {
                const li = document.createElement('li');
                li.className = 'advice-item';
                li.innerHTML = `${adviceItemPlaceholder.innerHTML.replace('Default advice placeholder', item)}`;
                adviceList.appendChild(li);
            });
        } else showElement(noAdviceMessage);

        showElement(diagnosisCard);
    }

    fileInput.addEventListener('change', (e) => handleFile(e.target.files?.[0]));
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => (e.preventDefault(), dropZone.classList.add('drop-zone-over')));
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drop-zone-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drop-zone-over');
        const file = e.dataTransfer.files?.[0];
        if (fileInput.files && file) {
            const dt = new DataTransfer();
            dt.items.add(file);
            fileInput.files = dt.files;
        }
        handleFile(file);
    });

    analyzeButton.addEventListener('click', () => {
        if (selectedImageBase64 && !isLoading) handleImageAnalysis(selectedImageBase64);
    });

    function handleFile(file) {
        if (!file || !file.type.startsWith('image/')) {
            displayError('Please upload a valid image file.');
            clearPreview();
            fileInput.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            selectedImageBase64 = reader.result;
            imagePreview.src = selectedImageBase64;
            showElement(imagePreviewContainer);
            analyzeButton.disabled = false;
            clearError();
            clearDiagnosis();
        };
        reader.onerror = () => {
            displayError("Could not read the image.");
            clearPreview();
        };
        reader.readAsDataURL(file);
    }

    function clearPreview() {
        selectedImageBase64 = null;
        imagePreview.src = '#';
        hideElement(imagePreviewContainer);
        analyzeButton.disabled = true;
    }

    async function analyzePlantWithAPI(imageBase64) {
        const response = await fetch('/analyze_plant/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: imageBase64 })
        });

        if (!response.ok) throw new Error(`Error ${response.status}`);
        const data = await response.json();
        if (!data?.diagnosis) throw new Error("Invalid response from server.");
        return data;
    }

    async function handleImageAnalysis(imageBase64) {
        setLoading(true);
        clearError();
        clearDiagnosis();
        try {
            const result = await analyzePlantWithAPI(imageBase64);
            console.log(result);
            displayDiagnosis(result.diagnosis);
        } catch (err) {
            displayError(`Analysis failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }
});


// Footer specific JavaScript

function initializeFooter() {
const currentYearSpan = document.getElementById('current-year');
if (currentYearSpan) {
currentYearSpan.textContent = new Date().getFullYear();
}
console.log("Footer JS executed");
}

// If the script is loaded dynamically after DOMContentLoaded, run immediately.
// Otherwise, wait for DOMContentLoaded.
if (document.readyState === "loading") {
document.addEventListener('DOMContentLoaded', initializeFooter);
} else {
initializeFooter();
}

</script>