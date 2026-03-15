// src/components/ai/AIRecorder.jsx
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { apiPost } from '../../lib/api';

const DEMO = [[0,'Good morning Amara. How are you feeling today?'],[1,'Good morning Doctor. Chest pain and difficulty breathing for about three weeks.'],[0,'On a scale of one to ten, how severe is the chest pain?'],[1,'About six or seven. Worse when I exert myself.'],[0,'Any palpitations or dizziness?'],[1,'Yes, my heart feels like it is racing sometimes.'],[0,'You are on Lisinopril. Taking it regularly?'],[1,'Yes every morning. But my blood pressure is still high.'],[0,'We will order blood work and refer you to Mount Sinai cardiology.'],[1,'Thank you doctor. I have been very worried.'],[0,'Your CareCompass navigator will coordinate everything in Igbo.']];

const LANGUAGES = [
  { code: 'en-CA', name: 'English (Canada)' },
  { code: 'fr-CA', name: 'French (Canada)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-US', name: 'Spanish (US)' },
  { code: 'zh-CN', name: 'Chinese (Mandarin)' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'ar-SA', name: 'Arabic' },
];

function fmtTime(s) { return String(Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'); }

export function AIRecorder() {
  const { toast } = useApp();
  const [lines, setLines]       = useState([]);
  const [running, setRunning]   = useState(false);
  const [paused, setPaused]     = useState(false);
  const [secs, setSecs]         = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const [counts, setCounts]     = useState({dr:0,pt:0});
  const [waveH, setWaveH]       = useState(Array(24).fill(4));
  const [insights, setInsights] = useState([]);
  const [insLoading, setInsLoading] = useState(false);
  const [spk1, setSpk1] = useState('Doctor');
  const [spk2, setSpk2] = useState('Patient');
  const [language, setLanguage] = useState('en-CA');
  const [demoMode, setDemoMode] = useState(false);
  const [demoIndex, setDemoIndex] = useState(0);
  const [ttsMode, setTtsMode] = useState('browser'); // 'browser' or 'elevenlabs'
  const [speaking, setSpeaking] = useState(false);
  const [speakingLine, setSpeakingLine] = useState(null);
  const boxRef  = useRef(null);
  const timerRef = useRef(null);
  const waveRef  = useRef(null);
  const demoRef  = useRef(null);
  const recoRef  = useRef(null);
  const secsRef  = useRef(0);
  const runningRef = useRef(false);
  const pausedRef = useRef(false);

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = 99999; }, [lines]);

  // Cleanup speech synthesis on unmount
  useEffect(() => {
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  function addLine(text, spk) {
    setLines(l => [...l, { text, spk, time:Date.now(), ts:new Date().toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit',second:'2-digit'}) }]);
    setWordCount(w => w + text.split(/\s+/).length);
    setCounts(c => spk===0 ? {...c,dr:c.dr+1} : {...c,pt:c.pt+1});
  }

  function startRec() {
    setRunning(true);
    runningRef.current = true;
    setPaused(false);
    pausedRef.current = false;
    setLines([]);
    setWordCount(0);
    setCounts({dr:0,pt:0});
    setSecs(0);
    secsRef.current=0;
    setDemoIndex(0);

    timerRef.current = setInterval(() => { secsRef.current++; setSecs(secsRef.current); }, 1000);
    waveRef.current  = setInterval(() => setWaveH(Array(24).fill(0).map(()=>4+Math.random()*30)), 80);

    // Check for speech recognition support
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setDemoMode(true);
      toast('Demo Mode', 'Speech recognition requires Chrome/Edge. Running in demo mode.', '⚠️');
      return;
    }

    setDemoMode(false);
    const r = new SR();
    r.continuous = true;
    r.interimResults = true;
    r.lang = language;
    recoRef.current = r;
    let spk = 0;

    r.onresult = e => {
      let ft='';
      for (let i=e.resultIndex; i<e.results.length; i++) {
        if (e.results[i].isFinal) ft += e.results[i][0].transcript + ' ';
      }
      if (ft.trim()) {
        addLine(ft.trim(), spk);
        spk = 1 - spk;
      }
    };

    r.onerror = (e) => {
      console.error('Speech recognition error:', e.error);
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        toast('Microphone Error', 'Please allow microphone access', '🎤');
      } else if (e.error === 'no-speech') {
        // Ignore no-speech errors, just restart
      } else {
        toast('Recognition Error', `Error: ${e.error}`, '⚠️');
      }
    };

    r.onend = () => {
      if (runningRef.current && !pausedRef.current) {
        try {
          r.start();
        } catch (err) {
          console.error('Failed to restart recognition:', err);
        }
      }
    };

    try {
      r.start();
    } catch (err) {
      console.error('Failed to start recognition:', err);
      toast('Error', 'Failed to start speech recognition', '⚠️');
    }
  }

  function advanceDemo() {
    if (demoIndex >= DEMO.length) return;
    addLine(DEMO[demoIndex][1], DEMO[demoIndex][0]);
    setDemoIndex(i => i + 1);
  }

  function stopRec() {
    setRunning(false);
    runningRef.current = false;
    setPaused(false);
    pausedRef.current = false;
    clearInterval(timerRef.current);
    clearInterval(waveRef.current);
    clearInterval(demoRef.current);
    if (recoRef.current) {
      try {
        recoRef.current.stop();
        recoRef.current = null;
      } catch (err) {
        console.error('Error stopping recognition:', err);
      }
    }
    setWaveH(Array(24).fill(4));
    toast('Recording stopped', `${lines.length} utterances · ${fmtTime(secsRef.current)}`, '⏹');
  }

  function togglePause() {
    const newPaused = !paused;
    setPaused(newPaused);
    pausedRef.current = newPaused;

    if (newPaused) {
      clearInterval(waveRef.current);
      if (recoRef.current) {
        try {
          recoRef.current.stop();
        } catch (err) {
          console.error('Error pausing recognition:', err);
        }
      }
    } else {
      waveRef.current = setInterval(() => setWaveH(Array(24).fill(0).map(() => 4 + Math.random() * 30)), 80);
      if (recoRef.current && !demoMode) {
        try {
          recoRef.current.start();
        } catch (err) {
          console.error('Error resuming recognition:', err);
        }
      }
    }
  }

  async function runInsights() {
    if (!lines.length) { toast('No transcript','Record first','⚠️'); return; }
    setInsLoading(true);
    const transcript = lines.map(l=>`[${l.spk===0?spk1:spk2}]: ${l.text}`).join('\n');

    const DEMO_INS = [
      {tag:'CHIEF COMPLAINT',text:'Chest tightness and shortness of breath, 3-week duration, worsening with exertion.',color:'#14b8a6'},
      {tag:'SYMPTOMS',text:'Palpitations (racing heart), exertional dyspnea, severity 6-7/10.',color:'#8b5cf6'},
      {tag:'MEDICATIONS',text:'Lisinopril 10mg daily — patient reports adherence but BP remains elevated.',color:'#10b981'},
      {tag:'ACTION ITEMS',text:'Cardiology referral ordered, blood work requested, BP recheck in 2 weeks.',color:'#c4b5fd'},
      {tag:'RISK FLAG',text:'Uncontrolled hypertension — consider dose escalation per physician judgment.',color:'#ef4444'},
    ];

    try {
      const data = await apiPost('/ai/clinical-insights', { transcript });
      if (data && data.insights) {
        const colors={CHIEF:'#14b8a6',SYMPTOM:'#8b5cf6',MEDICATION:'#10b981',ACTION:'#c4b5fd',RISK:'#ef4444'};
        const parsed=[];
        const insightLines = data.insights.split('\n').filter(line => line.trim());
        insightLines.forEach(line => {
          const m = line.match(/^([A-Z][A-Z\s]+):/);
          if (m) {
            const key = Object.keys(colors).find(k => m[1].includes(k)) || 'CHIEF';
            parsed.push({
              tag: m[1].trim(),
              text: line.replace(m[0], '').trim(),
              color: colors[key]
            });
          }
        });
        setInsights(parsed.length ? parsed : DEMO_INS);
        toast('Insights generated','AI clinical analysis complete','🤖');
      } else {
        setInsights(DEMO_INS);
        toast('Using demo insights','Backend returned no data','ℹ️');
      }
    } catch (err) {
      console.error('Insights error:', err);
      setInsights(DEMO_INS);
      toast('Error generating insights', 'Using demo data', '⚠️');
    }
    setInsLoading(false);
  }

  function copyInsights() {
    if (!insights.length) { toast('No insights','Generate insights first','⚠️'); return; }
    const text = insights.map(i => `${i.tag}: ${i.text}`).join('\n\n');
    navigator.clipboard.writeText(text).then(() => {
      toast('Copied', 'Insights copied to clipboard', '📋');
    }).catch(() => {
      toast('Copy failed', 'Unable to copy to clipboard', '⚠️');
    });
  }

  function exportTr() {
    if (!lines.length) { toast('No transcript','','⚠️'); return; }
    const text = lines.map(l=>`[${fmtTime(Math.floor((l.time-lines[0].time)/1000))}] [${l.spk===0?spk1:spk2}] ${l.text}`).join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type:'text/plain'}));
    a.download=`transcript_${new Date().toISOString().slice(0,10)}.txt`; a.click();
    toast('Exported','Saved as .txt','📄');
  }

  // Text-to-Speech Functions
  async function speakLine(lineIndex) {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeakingLine(null);
      return;
    }

    const line = lines[lineIndex];
    if (!line) return;

    setSpeaking(true);
    setSpeakingLine(lineIndex);

    if (ttsMode === 'elevenlabs') {
      try {
        const response = await fetch('/api/ai/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: line.text }),
        });

        if (!response.ok) throw new Error('TTS request failed');

        const data = await response.json();
        if (data.mode === 'browser') {
          // Fallback to browser TTS
          speakWithBrowser(line.text, line.spk);
        } else {
          // Play audio from ElevenLabs
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audio.onended = () => {
            setSpeaking(false);
            setSpeakingLine(null);
          };
          audio.play();
        }
      } catch (err) {
        console.error('ElevenLabs TTS error:', err);
        toast('TTS Error', 'Falling back to browser TTS', '⚠️');
        speakWithBrowser(line.text, line.spk);
      }
    } else {
      speakWithBrowser(line.text, line.spk);
    }
  }

  function speakWithBrowser(text, speaker) {
    if (!window.speechSynthesis) {
      toast('TTS Not Supported', 'Your browser does not support text-to-speech', '⚠️');
      setSpeaking(false);
      setSpeakingLine(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();

    // Try to select different voices for doctor vs patient
    if (voices.length > 0) {
      if (speaker === 0) {
        // Doctor - prefer male voice
        const maleVoice = voices.find(v => v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel'));
        if (maleVoice) utterance.voice = maleVoice;
      } else {
        // Patient - prefer female voice
        const femaleVoice = voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Victoria'));
        if (femaleVoice) utterance.voice = femaleVoice;
      }
    }

    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.lang = language;

    utterance.onend = () => {
      setSpeaking(false);
      setSpeakingLine(null);
    };

    utterance.onerror = (err) => {
      console.error('Speech synthesis error:', err);
      setSpeaking(false);
      setSpeakingLine(null);
      toast('TTS Error', 'Speech synthesis failed', '⚠️');
    };

    window.speechSynthesis.cancel(); // Clear any existing speech
    window.speechSynthesis.speak(utterance);
  }

  async function playAllTranscript() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      setSpeakingLine(null);
      return;
    }

    if (!lines.length) {
      toast('No transcript', 'Record something first', '⚠️');
      return;
    }

    setSpeaking(true);
    for (let i = 0; i < lines.length; i++) {
      if (!speaking) break; // Stop if user cancelled
      setSpeakingLine(i);
      await new Promise((resolve) => {
        speakWithBrowser(lines[i].text, lines[i].spk);
        const checkInterval = setInterval(() => {
          if (!window.speechSynthesis.speaking) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);
      });
    }
    setSpeaking(false);
    setSpeakingLine(null);
  }

  return (
    <div className="content fade-up">
      {demoMode && running && (
        <div style={{
          background: 'linear-gradient(135deg, #f59e0b, #f97316)',
          color: '#fff',
          padding: '.75rem 1.2rem',
          borderRadius: 12,
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '.8rem',
          fontWeight: 500,
          boxShadow: '0 4px 12px rgba(245,158,11,.3)'
        }}>
          <span>⚠️ Speech recognition requires Chrome/Edge. Running in demo mode.</span>
          <button
            className="btn btn-g"
            style={{fontSize:'.7rem', padding:'.4rem .8rem'}}
            onClick={advanceDemo}
            disabled={demoIndex >= DEMO.length}
          >
            {demoIndex >= DEMO.length ? 'Demo Complete' : 'Next Line →'}
          </button>
        </div>
      )}

      <div className="g23">
        <div className="col">
          <div className="card">
            <div className="ch"><div><div className="ch-title">🎙 Doctor-Patient Recorder</div><div className="ch-sub">Real-time transcription with speaker diarization</div></div></div>
            <div className="cb" style={{textAlign:'center'}}>
              <div style={{width:76,height:76,borderRadius:'50%',background:running?'linear-gradient(135deg,var(--red),#f87171)':'linear-gradient(135deg,var(--violet),var(--amethyst))',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.7rem',margin:'0 auto .9rem',position:'relative',boxShadow:running?'0 4px 20px rgba(239,68,68,.5)':'0 4px 20px rgba(109,40,217,.4)',transition:'all .28s'}} onClick={()=>running?stopRec():startRec()}>
                {running?'⏹':'🎙'}
                {running&&<span style={{position:'absolute',inset:-8,borderRadius:'50%',border:'2px solid rgba(239,68,68,.35)',animation:'ripple 1.5s infinite'}}/>}
              </div>
              <div style={{fontSize:'.76rem',color:'var(--muted)',marginBottom:'.32rem'}}>{running?'Recording...':'Click to start recording'}</div>
              <div style={{fontFamily:"'DM Mono',monospace",fontSize:'1.35rem',fontWeight:500,marginBottom:'.55rem'}}>{fmtTime(secs)}</div>
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:'2.5px',height:38,marginBottom:'.55rem'}}>
                {waveH.map((h,i)=><div key={i} className="wbar" style={{height:h}}/>)}
              </div>
              <div style={{display:'flex',justifyContent:'center',gap:'.5rem',flexWrap:'wrap'}}>
                {running&&<button className="btn btn-g" style={{fontSize:'.69rem'}} onClick={togglePause}>{paused?'▶ Resume':'⏸ Pause'}</button>}
                <button className="btn btn-teal" style={{fontSize:'.69rem'}} onClick={runInsights}>🤖 AI Insights</button>
                <button className="btn btn-g" style={{fontSize:'.69rem'}} onClick={exportTr}>📄 Export</button>
                <button className="btn btn-g" style={{fontSize:'.69rem'}} onClick={()=>{setLines([]);setWordCount(0);setCounts({dr:0,pt:0});setInsights([]);}}>🗑 Clear</button>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="ch"><div className="ch-title">📝 Speaker Labels</div></div>
            <div className="cb" style={{display:'flex',gap:'.65rem'}}>
              <div className="mfield" style={{flex:1,margin:0}}><label className="mlbl">Speaker 1 (Doctor)</label><input className="inp" value={spk1} onChange={e=>setSpk1(e.target.value)}/></div>
              <div className="mfield" style={{flex:1,margin:0}}><label className="mlbl">Speaker 2 (Patient)</label><input className="inp" value={spk2} onChange={e=>setSpk2(e.target.value)}/></div>
            </div>
          </div>

          <div className="card" style={{flex:1}}>
            <div className="ch">
              <div className="ch-title">📄 Live Transcript</div>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.68rem',color:'var(--green)'}}>{lines.length} utterances</span>
                {lines.length > 0 && (
                  <button
                    className="btn btn-g"
                    style={{fontSize:'.65rem',padding:'.3rem .6rem'}}
                    onClick={playAllTranscript}
                  >
                    {speaking ? '⏹ Stop' : '▶ Play All'}
                  </button>
                )}
              </div>
            </div>
            <div ref={boxRef} className="cb" style={{maxHeight:300,overflowY:'auto',minHeight:80}}>
              {!lines.length ? <div style={{fontSize:'.68rem',color:'var(--muted)',textAlign:'center',padding:'.4rem'}}>Start recording to see transcript here...</div>
                : lines.map((l,i)=>(
                  <div
                    key={i}
                    style={{
                      display:'flex',
                      gap:'.7rem',
                      padding:'.65rem 0',
                      borderBottom:'1px solid rgba(255,255,255,.04)',
                      background: speakingLine === i ? 'rgba(139,92,246,.1)' : 'transparent',
                      transition: 'background .2s'
                    }}
                  >
                    <div style={{flexShrink:0,width:70,display:'flex',flexDirection:'column',alignItems:'flex-end',gap:'.18rem'}}>
                      <span className={`spk-badge ${l.spk===0?'spk-dr':'spk-pt'}`}>{l.spk===0?spk1:spk2}</span>
                    </div>
                    <div style={{flex:1,fontSize:'.75rem',lineHeight:1.65,color:'var(--dim)'}}>{l.text}</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'.3rem',alignItems:'flex-end'}}>
                      <span style={{fontFamily:"'DM Mono',monospace",fontSize:'.57rem',color:'var(--muted)',flexShrink:0}}>{l.ts}</span>
                      <button
                        className="btn btn-g"
                        style={{fontSize:'.6rem',padding:'.2rem .5rem'}}
                        onClick={() => speakLine(i)}
                        title="Speak this line"
                      >
                        {speakingLine === i ? '⏹' : '🔊'}
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="ch"><div className="ch-title">📊 Session Stats</div></div>
            <div className="cb" style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'.6rem'}}>
              {[['Duration',fmtTime(secs)],['Words',wordCount],[spk1+' turns',counts.dr],[spk2+' turns',counts.pt]].map(([l,v])=>(
                <div key={l} style={{padding:'.65rem',borderRadius:9,background:'rgba(255,255,255,.025)',border:'1px solid var(--border)',textAlign:'center'}}>
                  <div style={{fontFamily:"'Playfair Display',serif",fontSize:'1.2rem',fontWeight:700}}>{v}</div>
                  <div style={{fontSize:'.62rem',color:'var(--muted)',marginTop:'.1rem'}}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="ch">
              <div className="ch-title">🤖 AI Clinical Insights</div>
              <div style={{display:'flex',gap:'.5rem',alignItems:'center'}}>
                <span style={{fontSize:'.63rem',color:'var(--green)'}}>Server-side</span>
                {insights.length > 0 && (
                  <button
                    className="btn btn-g"
                    style={{fontSize:'.65rem',padding:'.3rem .6rem'}}
                    onClick={copyInsights}
                  >
                    📋 Copy
                  </button>
                )}
              </div>
            </div>
            <div className="cb" style={{minHeight:100}}>
              {insLoading ? <div style={{fontSize:'.73rem',color:'var(--muted)'}}>Analyzing conversation... <span className="pipe-spin" style={{display:'inline-block',verticalAlign:'middle',marginLeft:'.5rem'}}/></div>
                : !insights.length ? <div style={{fontSize:'.7rem',color:'var(--muted)'}}>Record a conversation then click 🤖 AI Insights above.</div>
                : insights.map((s,i)=>(
                  <div key={i} className="insight-item">
                    <div className="ins-tag" style={{color:s.color}}>{s.tag}</div>{s.text}
                  </div>
                ))}
            </div>
          </div>

          <div className="card">
            <div className="ch"><div className="ch-title">⚙️ Settings</div></div>
            <div className="cb" style={{display:'flex',flexDirection:'column',gap:'.45rem'}}>
              <div className="mfield" style={{margin:0}}>
                <label className="mlbl">Recording language</label>
                <select
                  className="inp"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  disabled={running}
                >
                  {LANGUAGES.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mfield" style={{margin:0}}>
                <label className="mlbl">Text-to-Speech Mode</label>
                <select
                  className="inp"
                  value={ttsMode}
                  onChange={(e) => setTtsMode(e.target.value)}
                >
                  <option value="browser">Browser TTS (Free)</option>
                  <option value="elevenlabs">ElevenLabs (Premium)</option>
                </select>
              </div>
              <div style={{fontSize:'.68rem',color:'var(--muted)',marginTop:'.3rem',padding:'.5rem',background:'rgba(139,92,246,.1)',borderRadius:6,border:'1px solid rgba(139,92,246,.2)'}}>
                <div style={{fontWeight:600,marginBottom:'.3rem',color:'var(--violet)'}}>🎙 Speech Recognition:</div>
                <div style={{marginBottom:'.2rem'}}>✓ Chrome/Edge - Full support (webkitSpeechRecognition)</div>
                <div>✓ Other browsers - Demo mode</div>
                <div style={{fontWeight:600,marginTop:'.5rem',marginBottom:'.3rem',color:'var(--violet)'}}>🔊 Text-to-Speech Options:</div>
                <div style={{marginBottom:'.2rem'}}>• <strong>Browser TTS</strong> - Free, built-in Web Speech API</div>
                <div style={{marginBottom:'.2rem'}}>• <strong>ElevenLabs</strong> - Premium quality (requires API key)</div>
                <div style={{marginTop:'.5rem'}}>Open-source alternatives: Piper TTS, Coqui TTS, Mozilla TTS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
