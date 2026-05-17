import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import AnimatedOrb from '../components/UI/AnimatedOrb';
import MicButton from '../components/Voice/MicButton';
import { chatApi } from '../api/api';
import toast from 'react-hot-toast';
import { FiVolume2, FiVolumeX, FiZap } from 'react-icons/fi';

export default function VoiceAssistant() {
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [aiState, setAiState] = useState('idle');
  const [muted, setMuted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [autoMode, setAutoMode] = useState(false);
  const synthRef = useRef(window.speechSynthesis);

  useEffect(() => {
    return () => { synthRef.current?.cancel(); };
  }, []);

  const speakResponse = (text) => {
    if (muted) return;
    synthRef.current?.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.volume = 1;
    const voices = synthRef.current?.getVoices();
    const preferred = voices?.find(v => v.lang.startsWith('en') && v.name.includes('Female'));
    if (preferred) utterance.voice = preferred;
    synthRef.current?.speak(utterance);
  };

  const handleTranscript = (text) => {
    setInterimText(text);
  };

  const handleVoiceSend = async (text) => {
    const userText = text || interimText.trim();
    if (!userText) {
      toast.error('No voice input detected');
      return;
    }
    setTranscript(userText);
    setInterimText('');
    setAiState('thinking');
    setLoading(true);

    try {
      const res = await chatApi.sendMessage({ message: userText });
      const aiMessage = res.data.message;
      setResponse(aiMessage);
      setAiState(res.data.emotion || 'neutral');
      speakResponse(aiMessage);
      if (res.data.action?.type === 'open_website' && res.data.action.url) {
        window.open(res.data.action.url, '_blank');
      }
    } catch (err) {
      toast.error('Failed to process voice command');
      setAiState('idle');
    } finally {
      setLoading(false);
    }
  };

  const toggleMute = () => {
    setMuted(!muted);
    if (!muted) synthRef.current?.cancel();
  };

  const toggleAutoMode = () => {
    setAutoMode(!autoMode);
  };

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left">
          <span className="page-title">Voice Assistant</span>
        </div>
        <div className="topbar-right">
          <button className={`btn btn-sm ${autoMode ? 'btn-primary' : 'btn-secondary'}`} onClick={toggleAutoMode} title="Toggle auto-send mode">
            <FiZap />
            <span>{autoMode ? 'Auto' : 'Manual'}</span>
          </button>
          <button className="btn btn-sm btn-secondary" onClick={toggleMute}>
            {muted ? <FiVolumeX /> : <FiVolume2 />}
            <span>{muted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>
      </div>

      <div className="voice-container">
        <AnimatedOrb emotion={loading ? 'thinking' : aiState} size="normal" speaking={!muted && !!response} />

        <div className="text-center">
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 4 }}>
            {loading ? 'JARVIS is thinking...' : autoMode ? 'Speak — auto-sends on pause' : 'Speak to JARVIS'}
          </h3>
          <p className="text-muted text-sm">
            {autoMode ? 'Tap mic → speak → auto-sends when you pause' : (muted ? 'Voice output is muted' : 'Tap mic, speak, then tap Send')}
          </p>
        </div>

        <div className="transcript-box">
          {transcript && (
            <div style={{ marginBottom: 12 }}>
              <div className="text-xs text-muted mb-8">You said:</div>
              <div style={{ fontSize: 15, fontWeight: 500 }}>{transcript}</div>
            </div>
          )}
          {interimText && !transcript && !autoMode && (
            <div style={{ color: 'var(--text-muted)' }}>{interimText}</div>
          )}
          {autoMode && interimText && (
            <div style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Listening: "{interimText}"</div>
          )}
          {response && (
            <div>
              <div className="text-xs text-muted mb-8" style={{ marginTop: 12 }}>JARVIS responds:</div>
              <div className="markdown-content" style={{ fontSize: 15, textAlign: 'left' }}>
                <ReactMarkdown>{response}</ReactMarkdown>
              </div>
            </div>
          )}
          {!transcript && !interimText && !response && (
            <div className="text-muted">Click the microphone and speak...</div>
          )}
        </div>

        <div className="flex items-center gap-16">
          <MicButton onTranscript={handleTranscript} onSend={autoMode ? handleVoiceSend : undefined} disabled={loading} autoSend={autoMode} />
          {!autoMode && (
            <button
              className="btn btn-primary"
              onClick={() => handleVoiceSend()}
              disabled={loading || !interimText.trim()}
            >
              Send Voice
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
