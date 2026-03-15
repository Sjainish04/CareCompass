# Quick Start - Voice Recorder & TTS

## Immediate Use (No Setup Required)

### 1. Start the Application
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd react/carecompass-react
npm run dev
```

### 2. Use Voice Recorder
1. Open app in **Chrome or Edge** (required for speech recognition)
2. Navigate to AI Recorder page
3. Click the 🎙 microphone button
4. Allow microphone access when prompted
5. Start speaking - transcript appears in real-time

### 3. Use Text-to-Speech (FREE)
- **Individual Lines**: Click 🔊 button next to any transcript line
- **Full Transcript**: Click "Play All" button at the top
- **Stop Playback**: Click ⏹ button while speaking

**No API keys needed!** Uses built-in browser voices.

## Add ElevenLabs (Optional Premium Voices)

### Step 1: Get API Key
1. Visit https://elevenlabs.io
2. Sign up for free account
3. Go to Profile → API Keys
4. Copy your API key

### Step 2: Configure
```bash
# Edit .env file in project root
ELEVENLABS_API_KEY=your_api_key_here
```

### Step 3: Restart Backend
```bash
cd backend
# Stop current process (Ctrl+C)
npm run dev
```

### Step 4: Select in UI
1. Go to AI Recorder page
2. Settings panel → Text-to-Speech Mode
3. Select "ElevenLabs (Premium)"
4. TTS buttons now use ElevenLabs voices

## Troubleshooting

### "Speech recognition requires Chrome/Edge"
**Solution**: Use Chrome or Edge browser. Firefox/Safari not supported.
- Demo mode will activate automatically
- Click "Next Line" to see demo transcript

### Microphone not working
**Check**:
- Browser permissions (click 🔒 icon in address bar)
- System microphone settings
- Microphone hardware connection

### TTS not playing sound
**Check**:
- System volume not muted
- Browser not muted
- Voices loaded (may take a moment on first use)

### ElevenLabs not working
**Check**:
- API key is correct in `.env`
- Backend restarted after adding key
- Internet connection active
**Fallback**: App automatically uses browser TTS if ElevenLabs fails

## Free Alternatives to ElevenLabs

### Best Open-Source Options

#### 1. Piper TTS (Recommended for High Quality)
```bash
# Install
pip install piper-tts

# Run
piper --model en_US-lessac-medium --output_file output.wav
```
**Pros**: Excellent quality, 100+ voices, runs locally
**Use Case**: Privacy-focused, offline capable

#### 2. Coqui TTS (Best for Voice Cloning)
```bash
# Install
pip install TTS

# Run
tts --text "Hello world" --model_name tts_models/en/ljspeech/tacotron2-DDC
```
**Pros**: Neural TTS, voice cloning, many models
**Use Case**: Custom voices, advanced features

#### 3. Browser TTS (Already Implemented)
**Pros**: FREE, no setup, works immediately
**Cons**: Limited voice customization
**Use Case**: Quick start, cross-platform

## Language Support

Select from dropdown in Settings:
- English (Canada) - en-CA
- French (Canada) - fr-CA
- English (US) - en-US
- Spanish (US) - es-US
- Chinese (Mandarin) - zh-CN
- Hindi - hi-IN
- Arabic - ar-SA

## Features Summary

✅ Real-time speech recognition (Chrome/Edge only)
✅ Speaker diarization (Doctor/Patient labels)
✅ Text-to-speech for transcript playback
✅ AI-powered clinical insights
✅ Export transcript to .txt file
✅ Multiple language support
✅ Copy insights to clipboard
✅ Demo mode for unsupported browsers

## Files to Check

- **Frontend**: `react/carecompass-react/src/components/ai/AIRecorder.jsx`
- **Backend**: `backend/src/routes/ai.js`
- **Config**: `.env` (add ELEVENLABS_API_KEY here)
- **Docs**: `TTS_IMPLEMENTATION.md` (detailed guide)

## Support

For detailed information:
- Read `TTS_IMPLEMENTATION.md` for full documentation
- Read `VOICE_RECORDER_FIXES.md` for changes made
- Check browser console for error messages
- Verify backend logs for API issues

## Development Tips

### Test Different Browsers
```bash
# Chrome (recommended)
# Edge (recommended)
# Firefox (demo mode only)
# Safari (limited support)
```

### Debug Mode
Open browser console (F12) to see:
- Speech recognition errors
- TTS errors
- API call responses
- State changes

### API Testing
```bash
# Test ElevenLabs endpoint
curl -X POST http://localhost:3001/api/ai/tts \
  -H "Content-Type: application/json" \
  -d '{"text":"Hello world"}'
```

## Quick Reference

| Feature | Shortcut | Notes |
|---------|----------|-------|
| Start Recording | Click 🎙 | Requires mic permission |
| Stop Recording | Click ⏹ | Stops all recording |
| Pause/Resume | ⏸/▶ button | Only while recording |
| Speak Line | 🔊 button | Per-line TTS |
| Play All | ▶ Play All | Full transcript |
| AI Insights | 🤖 button | Generates insights |
| Export | 📄 button | Downloads .txt |
| Copy Insights | 📋 button | Copies to clipboard |
| Clear | 🗑 button | Clears transcript |

## That's It!

The voice recorder is ready to use immediately with browser TTS. ElevenLabs is optional for premium voices but not required.

**Default Mode**: Browser TTS (FREE, works immediately)
**Premium Mode**: ElevenLabs (requires API key)
**Fallback**: Demo mode (no speech recognition)

Enjoy! 🎉
