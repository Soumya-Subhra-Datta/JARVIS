import { useState, useRef, useCallback } from 'react';
import { FiMic, FiMicOff, FiStopCircle } from 'react-icons/fi';

export default function MicButton({ onTranscript, onSend, disabled, autoSend }) {
  const [isListening, setIsListening] = useState(false);
  const transcriptRef = useRef('');
  const isListeningRef = useRef(false);
  const recognitionRef = useRef(null);
  const restartTimeoutRef = useRef(null);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    isListeningRef.current = false;
    setIsListening(false);
    transcriptRef.current = '';
  }, []);

  const startListening = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = !autoSend;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      transcriptRef.current = transcript;
      if (onTranscript) onTranscript(transcript);
    };

    recognition.onerror = () => {
      isListeningRef.current = false;
      setIsListening(false);
    };

    recognition.onend = () => {
      if (!autoSend) {
        isListeningRef.current = false;
        setIsListening(false);
        return;
      }
      const text = transcriptRef.current.trim();
      transcriptRef.current = '';
      if (text && onSend) onSend(text);
      if (isListeningRef.current) {
        restartTimeoutRef.current = setTimeout(() => {
          if (isListeningRef.current) startListening();
        }, 300);
      }
    };

    recognitionRef.current = recognition;
    isListeningRef.current = true;
    recognition.start();
    setIsListening(true);
  }, [autoSend, onTranscript, onSend]);

  const toggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  return (
    <button
      className={`mic-button ${isListening ? 'active' : ''}`}
      onClick={toggle}
      disabled={disabled}
      title={isListening ? 'Stop listening' : (autoSend ? 'Tap and speak — auto-sends on pause' : 'Start voice input')}
    >
      {isListening ? (autoSend ? <FiStopCircle /> : <FiMicOff />) : <FiMic />}
    </button>
  );
}
