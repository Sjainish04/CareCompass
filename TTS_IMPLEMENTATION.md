# Text-to-Speech Implementation Guide

## Overview

The CareCompass Voice Recorder now includes comprehensive text-to-speech (TTS) capabilities for reading back transcripts and AI insights. This document covers the implementation and available TTS options.

## Features Implemented

### 1. Speech Recognition Improvements
- **Browser Compatibility Check**: Properly detects Chrome/Edge support for `webkitSpeechRecognition`
- **Error Handling**: Added `onerror` handler for microphone access and recognition errors
- **Fixed Closure Issue**: Uses refs (`runningRef`, `pausedRef`) instead of stale closure variables
- **Language Selection**: Supports multiple languages with proper BCP47 codes (en-CA, fr-CA, es-US, etc.)
- **Demo Mode**: Interactive demo with "Next Line" button when Speech Recognition is unavailable

### 2. Text-to-Speech Features
- **Per-Line Playback**: Each transcript line has a 🔊 button to read it aloud
- **Play All**: Reads the entire transcript sequentially
- **Voice Differentiation**: Uses different voices for Doctor vs Patient (when available)
- **Visual Feedback**: Highlights the currently speaking line
- **Playback Control**: Stop button to cancel ongoing speech

### 3. TTS Modes

#### Browser TTS (Default - FREE)
- Uses Web Speech API (`speechSynthesis`)
- Built into Chrome, Edge, Safari, Firefox
- No API keys required
- Good quality voices
- Works offline
- Supports multiple languages

#### ElevenLabs TTS (Premium Option)
- High-quality neural voices
- Requires API key (`ELEVENLABS_API_KEY` in `.env`)
- Backend endpoint: `POST /api/ai/tts`
- Automatically falls back to browser TTS if API key missing or request fails

## Free Open-Source TTS Alternatives

### 1. **Web Speech API** (Implemented)
- **Status**: PRIMARY IMPLEMENTATION
- **Cost**: FREE
- **Quality**: Good
- **Platform**: Browser-based
- **Languages**: 40+ languages
- **Setup**: No setup required
- **Use Case**: Best for web applications

### 2. **Piper TTS**
- **Repository**: https://github.com/rhasspy/piper
- **Cost**: FREE (Open Source)
- **Quality**: Excellent
- **Platform**: Local/Server
- **Languages**: 40+ languages, 100+ voices
- **Setup**: Requires local installation
- **Use Case**: High-quality local TTS, privacy-focused
- **Integration**: Can run as a local server with API

### 3. **Coqui TTS**
- **Repository**: https://github.com/coqui-ai/TTS
- **Cost**: FREE (Open Source)
- **Quality**: Excellent (Neural TTS)
- **Platform**: Python-based, Local/Server
- **Languages**: 40+ languages
- **Setup**: `pip install TTS`
- **Use Case**: State-of-the-art voice cloning, neural TTS
- **Integration**: Python API or HTTP server

### 4. **Mozilla TTS (Archived but still usable)**
- **Repository**: https://github.com/mozilla/TTS
- **Cost**: FREE (Open Source)
- **Quality**: Good
- **Platform**: Python-based
- **Languages**: 20+ languages
- **Status**: Archived but functional
- **Use Case**: Research, educational projects

### 5. **eSpeak NG**
- **Repository**: https://github.com/espeak-ng/espeak-ng
- **Cost**: FREE (Open Source)
- **Quality**: Basic (robotic but clear)
- **Platform**: Cross-platform
- **Languages**: 100+ languages
- **Setup**: Lightweight, easy installation
- **Use Case**: Accessibility, low resource environments

## Implementation Details

### Frontend (AIRecorder.jsx)

#### TTS Functions
```javascript
// Speak individual line
speakLine(lineIndex)

// Speak entire transcript
playAllTranscript()

// Browser TTS with voice selection
speakWithBrowser(text, speaker)
```

#### Key Features
- Automatic voice selection (male for doctor, female for patient)
- Language support via `utterance.lang`
- Visual feedback with `speakingLine` state
- Graceful error handling

### Backend (api/ai/tts)

#### Endpoint
```
POST /api/ai/tts
Body: { text: string, voice_id?: string }
```

#### Response
- With ElevenLabs key: Returns audio/mpeg stream
- Without key: Returns JSON `{ mode: 'browser' }`

#### Error Handling
- Falls back to browser mode on API errors
- Catches network failures
- Handles missing API keys gracefully

## Configuration

### Environment Variables

```bash
# Optional - falls back to browser TTS if not provided
ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
```

### Frontend Settings
Users can toggle between:
- **Browser TTS** (Free, default)
- **ElevenLabs** (Premium, requires API key)

## Usage Examples

### For Developers

#### Adding Custom TTS Provider
```javascript
// In AIRecorder.jsx, add new mode to ttsMode state
const [ttsMode, setTtsMode] = useState('browser'); // 'browser', 'elevenlabs', 'custom'

// Add handler in speakLine function
if (ttsMode === 'custom') {
  // Your custom TTS implementation
  await customTTS(line.text);
}
```

#### Integrating Piper TTS
```bash
# Install Piper
pip install piper-tts

# Run as server
piper-server --port 5050

# Call from frontend
const response = await fetch('http://localhost:5050/tts', {
  method: 'POST',
  body: JSON.stringify({ text: line.text, voice: 'en_US-lessac-medium' })
});
```

### For Users

1. **Using Browser TTS** (Default)
   - Just click the 🔊 button next to any transcript line
   - Or click "Play All" to read the entire transcript

2. **Using ElevenLabs**
   - Add your API key to `.env`: `ELEVENLABS_API_KEY=sk-...`
   - Select "ElevenLabs (Premium)" in Settings
   - Restart the backend
   - TTS will now use ElevenLabs voices

## Browser Compatibility

### Speech Recognition
| Browser | Support | Notes |
|---------|---------|-------|
| Chrome | ✅ Full | webkitSpeechRecognition |
| Edge | ✅ Full | webkitSpeechRecognition |
| Safari | ⚠️ Partial | Limited support |
| Firefox | ❌ None | Falls back to demo mode |

### Text-to-Speech
| Browser | Support | Voices |
|---------|---------|--------|
| Chrome | ✅ Full | 20+ voices |
| Edge | ✅ Full | 30+ voices |
| Safari | ✅ Full | 40+ voices |
| Firefox | ✅ Full | System voices |

## Troubleshooting

### Speech Recognition Not Working
- **Check Browser**: Use Chrome or Edge
- **Microphone Permission**: Allow microphone access
- **HTTPS Required**: Speech recognition requires secure context
- **Demo Mode**: If unavailable, click "Next Line" in demo mode

### Text-to-Speech Not Working
- **Check Browser Support**: All modern browsers support Web Speech API
- **Volume**: Ensure system volume is not muted
- **Voice Loading**: Voices may take a moment to load on first use
- **ElevenLabs Issues**: Check API key, network, and fallback to browser mode

### Voice Not Changing Between Speakers
- **Limited Voices**: Not all systems have male/female voice pairs
- **Manual Selection**: Use browser's voice settings to see available voices
- **Alternative**: Use ElevenLabs with different `voice_id` parameters

## Future Enhancements

### Potential Improvements
1. **Voice Cloning**: Implement doctor/patient voice profiles
2. **Emotion Detection**: Adjust prosody based on transcript content
3. **Multi-language Support**: Auto-detect and switch languages
4. **Offline Mode**: Cache voices for offline playback
5. **Speed Control**: Add playback rate adjustment
6. **Pitch Control**: Customize voice pitch per speaker
7. **SSML Support**: Add emphasis, pauses, and pronunciation hints

### Advanced Integrations
- **Azure Cognitive Services**: Enterprise-grade TTS
- **Google Cloud TTS**: High-quality neural voices
- **Amazon Polly**: AWS TTS service
- **Local LLM TTS**: Integrate with local language models

## Resources

### Documentation
- [Web Speech API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [ElevenLabs API Docs](https://docs.elevenlabs.io/)
- [Piper TTS Documentation](https://github.com/rhasspy/piper)
- [Coqui TTS Documentation](https://tts.readthedocs.io/)

### Best Practices
- Always provide fallback to browser TTS
- Handle errors gracefully
- Test across multiple browsers
- Consider privacy implications of cloud TTS
- Respect user preferences for voice selection
- Provide visual feedback during playback

## License Considerations

- **Web Speech API**: Browser native (no license needed)
- **ElevenLabs**: Commercial license required
- **Piper TTS**: MIT License
- **Coqui TTS**: MPL 2.0 License
- **Mozilla TTS**: MPL 2.0 License
- **eSpeak NG**: GPL-3.0 License

## Conclusion

The CareCompass TTS implementation prioritizes:
1. **Accessibility**: Free browser-based TTS for all users
2. **Quality**: Optional premium voices via ElevenLabs
3. **Flexibility**: Easy integration of alternative TTS providers
4. **Privacy**: Local TTS options available
5. **User Experience**: Visual feedback and intuitive controls

Choose the TTS solution that best fits your needs, budget, and privacy requirements.
