// Voice Assistant Module
class VoiceAssistant {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        
        this.init();
    }
    
    init() {
        if ('webkitSpeechRecognition' in window) {
            this.recognition = new webkitSpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';
            
            this.setupRecognitionEvents();
        }
        
        this.setupVoiceCommands();
    }
    
    setupRecognitionEvents() {
        this.recognition.onstart = () => {
            this.isListening = true;
            this.showListeningIndicator();
        };
        
        this.recognition.onend = () => {
            this.isListening = false;
            this.hideListeningIndicator();
        };
        
        this.recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            this.processCommand(transcript);
        };
        
        this.recognition.onerror = (event) => {
            console.error('Recognition error:', event.error);
            this.isListening = false;
            this.hideListeningIndicator();
        };
    }
    
    setupVoiceCommands() {
        this.commands = {
            'analyze': () => this.navigateTo('analyze'),
            'scan': () => this.navigateTo('analyze'),
            'upload': () => this.triggerUpload(),
            'history': () => this.navigateTo('history'),
            'map': () => this.navigateTo('map'),
            'learn': () => this.navigateTo('learn'),
            'community': () => this.navigateTo('community'),
            'help': () => this.speak('I can help you analyze plant diseases, view history, check disease maps, or learn about plant care. What would you like to do?'),
            'hello': () => this.speak('Hello! I\'m your plant health assistant. How can I help you today?'),
            'thank you': () => this.speak('You\'re welcome! Happy gardening!')
        };
    }
    
    startListening() {
        if (this.recognition && !this.isListening) {
            this.recognition.start();
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    processCommand(transcript) {
        const lowerCommand = transcript.toLowerCase();
        
        // Check for matching commands
        for (const [keyword, action] of Object.entries(this.commands)) {
            if (lowerCommand.includes(keyword)) {
                action();
                return;
            }
        }
        
        // Handle disease-specific queries
        if (lowerCommand.includes('disease') || lowerCommand.includes('sick')) {
            this.speak('I can help identify plant diseases. Please upload a photo of the affected plant for analysis.');
            this.navigateTo('analyze');
        } else if (lowerCommand.includes('treatment') || lowerCommand.includes('cure')) {
            this.speak('I can provide treatment recommendations after analyzing your plant. Would you like to upload a photo now?');
        } else {
            this.speak('I didn\'t quite understand that. You can say things like "analyze plant", "show history", or "help".');
        }
    }
    
    speak(text) {
        if (this.synthesis) {
            // Cancel any ongoing speech
            this.synthesis.cancel();
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 1;
            utterance.pitch = 1;
            utterance.volume = 1;
            utterance.voice = this.synthesis.getVoices().find(v => v.name.includes('Google') || v.name.includes('Female'));
            
            utterance.onstart = () => this.isSpeaking = true;
            utterance.onend = () => this.isSpeaking = false;
            
            this.synthesis.speak(utterance);
        }
    }
    
    navigateTo(section) {
        if (window.app && window.app.switchSection) {
            window.app.switchSection(section);
            this.speak(`Navigating to ${section} section`);
        }
    }
    
    triggerUpload() {
        document.getElementById('selectFileBtn')?.click();
        this.speak('Please select a plant image to analyze');
    }
    
    showListeningIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'voice-indicator';
        indicator.className = 'voice-indicator';
        indicator.innerHTML = `
            <div class="pulse-ring"></div>
            <i class="fas fa-microphone"></i>
            <span>Listening...</span>
        `;
        document.body.appendChild(indicator);
    }
    
    hideListeningIndicator() {
        const indicator = document.getElementById('voice-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
}

// Initialize voice assistant
document.addEventListener('DOMContentLoaded', () => {
    window.voiceAssistant = new VoiceAssistant();
    
    // Add voice command button to UI
    const navActions = document.querySelector('.nav-actions');
    if (navActions) {
        const voiceBtn = document.createElement('button');
        voiceBtn.className = 'voice-btn';
        voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceBtn.onclick = () => window.voiceAssistant.startListening();
        navActions.insertBefore(voiceBtn, navActions.firstChild);
    }
});