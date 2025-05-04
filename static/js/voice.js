document.addEventListener('DOMContentLoaded', () => {
    const micButton = document.getElementById('mic-button');
    const micIcon = document.getElementById('mic-icon');
    const transcriptionArea = document.getElementById('transcription-area');
    const transcriptionText = document.getElementById('transcription-text');
    const statusMessage = document.getElementById('status-message');
    const errorAlert = document.getElementById('voice-error-alert');
    const errorDescription = document.getElementById('voice-error-description');

    let isRecording = false;
    let recognition = null;

   
    function displayError(message) { errorDescription.textContent = message; showElement(errorAlert); }
    function clearError() { hideElement(errorAlert); errorDescription.textContent = ''; }
    function updateStatus(message) { statusMessage.textContent = message; }

    function initializeSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            displayError("Sorry, your browser doesn't support the Web Speech API.");
            micButton.disabled = true;
            updateStatus("Speech recognition not supported.");
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.lang = 'en-US';
        recognition.interimResults = true;

        recognition.onstart = () => {
            isRecording = true;
            micButton.classList.add('recording');
            clearError();
            updateStatus("Listening...");
            transcriptionText.textContent = '...';
            showElement(transcriptionArea);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                }
            }
            transcriptionText.textContent = finalTranscript;
            if (finalTranscript) {
                sendToServer(finalTranscript);
                stopListening();
                updateStatus(`Processed: "${finalTranscript.substring(0, 30)}..."`);
            }
        };

        recognition.onerror = (event) => {
            let errorMessage = event.error === 'no-speech'
                ? "No speech detected."
                : event.error === 'audio-capture'
                ? "Microphone not found or denied."
                : "Speech recognition error.";
            displayError(errorMessage);
            stopListening();
        };

        recognition.onend = () => {
            if (isRecording) stopListening();
        };
    }

    function startListening() {
        if (!recognition) return;
        clearError();
        hideElement(transcriptionArea);
        recognition.start();
    }

    function stopListening() {
        if (recognition && isRecording) {
            recognition.stop();
            isRecording = false;
            micButton.classList.remove('recording');
        }
    }

    function getCSRFToken() {
        return document.cookie.split('; ')
            .find(row => row.startsWith('csrftoken'))
            ?.split('=')[1];
    }

    function sendToServer(transcript) {
        fetch('/voice_diagnose/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCSRFToken(),
            },
            body: JSON.stringify({ prompt: transcript })
        })
        .then(res => res.json())
        .then(data => {
            if (data.advice) {
                displayGeminiAdvice(data.advice);
    location.hash = '#diagnosis-card';

                // alert("Gemini Advice:\n" + data.advice.join("\n"));
            } else {
                displayError("No advice returned.");
            }
        })
        .catch(err => {
            console.error("Request error:", err);
            displayError("Server error.");
        });
    }

    micButton.addEventListener('click', () => {
        if (isRecording) {
            stopListening();
        } else {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(startListening)
                .catch(() => {
                    displayError("Microphone access denied.");
                    updateStatus("Microphone access needed.");
                });
        }
    });

    initializeSpeechRecognition();
    updateStatus("Click the microphone to start speaking.");
});

function displayGeminiAdvice(adviceList = []) {
    const adviceContainer = document.getElementById('voice-advice-list');
    const card = document.getElementById('voice-result-card');
    const noAdvice = document.getElementById('voice-no-advice-message');

    adviceContainer.innerHTML = '';
    if (adviceList.length > 0) {
        adviceList.forEach(item => {
            const li = document.createElement('li');
            li.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                <span>${item}</span>
            `;
            adviceContainer.appendChild(li);
        });
        noAdvice.classList.add('hidden');
    } else {
        noAdvice.classList.remove('hidden');
    }

    card.classList.remove('hidden');
}



function hideElement(element) { element.classList.add('hidden'); }
function showElement(element) { element.classList.remove('hidden'); }