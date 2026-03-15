// src/components/ai/AITranslation.jsx
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { CLINICAL_PHRASES, DEMO_TRANSLATIONS, REVERSE_INDEX } from '../../data';
import { apiPost } from '../../lib/api';

const LANGS = ['English','French','Spanish','Portuguese','Mandarin','Cantonese','Arabic','Urdu','Hindi','Punjabi','Tamil','Tagalog','Igbo','Yoruba','Somali','Tigrinya','Ukrainian','Polish','Korean','Japanese','Farsi','Vietnamese','Bengali'];

// Language code mapping for Web Speech API
const LANG_CODES = {
  'English': 'en-US', 'French': 'fr-FR', 'Spanish': 'es-ES', 'Arabic': 'ar-SA',
  'Urdu': 'ur-PK', 'Hindi': 'hi-IN', 'Mandarin': 'zh-CN', 'Cantonese': 'zh-HK',
  'Igbo': 'ig-NG', 'Korean': 'ko-KR', 'Tagalog': 'tl-PH', 'Yoruba': 'yo-NG',
  'Portuguese': 'pt-PT', 'Punjabi': 'pa-IN', 'Tamil': 'ta-IN', 'Somali': 'so-SO',
  'Tigrinya': 'ti-ER', 'Ukrainian': 'uk-UA', 'Polish': 'pl-PL', 'Japanese': 'ja-JP',
  'Farsi': 'fa-IR', 'Vietnamese': 'vi-VN', 'Bengali': 'bn-IN'
};

function normalize(s) {
  return s.toLowerCase().trim().replace(/[?.,!;:'"¿¡]/g, '').trim();
}

function findDemoTranslation(text, tgt) {
  // 1. Exact match
  if (DEMO_TRANSLATIONS[text]?.[tgt]) return DEMO_TRANSLATIONS[text][tgt];

  const norm = normalize(text);

  // 2. Case-insensitive + trimmed, and 3. Stripped punctuation
  for (const [key, langs] of Object.entries(DEMO_TRANSLATIONS)) {
    if (normalize(key) === norm && langs[tgt]) return langs[tgt];
  }

  // 4. Reverse lookup — input is a known translation in another language
  const englishKey = REVERSE_INDEX[norm] || REVERSE_INDEX[text.toLowerCase().trim()];
  if (englishKey && DEMO_TRANSLATIONS[englishKey]?.[tgt]) {
    return DEMO_TRANSLATIONS[englishKey][tgt];
  }

  // 5. Substring containment
  for (const [key, langs] of Object.entries(DEMO_TRANSLATIONS)) {
    const normKey = normalize(key);
    if ((normKey.includes(norm) || norm.includes(normKey)) && langs[tgt]) return langs[tgt];
  }

  // 6. Word overlap >= 50%
  const inputWords = new Set(norm.split(/\s+/).filter(Boolean));
  if (inputWords.size > 0) {
    for (const [key, langs] of Object.entries(DEMO_TRANSLATIONS)) {
      const keyWords = normalize(key).split(/\s+/).filter(Boolean);
      const overlap = keyWords.filter(w => inputWords.has(w)).length;
      if (overlap / Math.max(keyWords.length, 1) >= 0.5 && langs[tgt]) return langs[tgt];
    }
  }

  return null;
}

async function doTranslate(text, src, tgt) {
  if (src===tgt) return { translation: text, mode: 'live' };
  try {
    const data = await apiPost('/ai/translate', { text, sourceLang: src, targetLang: tgt });
    if (data.translation) return { translation: data.translation, mode: data.mode || 'live' };
  } catch {}
  // Fallback to demo translations with fuzzy matching
  const match = findDemoTranslation(text, tgt);
  if (match) return { translation: match, mode: 'demo' };
  // Graceful fallback for truly unknown text
  return { translation: `[${tgt}] ${text}`, mode: 'demo' };
}

export function AITranslation() {
  const { toast } = useApp();
  const [srcLang, setSrcLang] = useState('English');
  const [tgtLang, setTgtLang] = useState('Igbo');
  const [srcText, setSrcText] = useState('');
  const [tgtText, setTgtText] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [phrases, setPhrases] = useState(CLINICAL_PHRASES.slice(0,9));
  const [mode, setMode] = useState('Text');
  const [isListening, setIsListening] = useState(false);
  const [apiMode, setApiMode] = useState('demo');
  const debounce = useRef(null);
  const recognition = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!recognition.current) {
        recognition.current = new SpeechRecognition();
      }
    }

    return () => {
      if (recognition.current && isListening) {
        recognition.current.stop();
      }
    };
  }, []);

  async function translate(text=srcText, s=srcLang, t=tgtLang) {
    if (!text.trim()) return;
    setLoading(true);
    const result = await doTranslate(text, s, t);
    setTgtText(result.translation || '');
    setApiMode(result.mode);
    setLoading(false);
    setHistory(h => [{src:text,tgt:result.translation,sL:s,tL:t,ts:new Date().toLocaleTimeString('en-CA',{hour:'2-digit',minute:'2-digit'}),mode:result.mode},...h.slice(0,19)]);
  }

  function debouncedTranslate(text) {
    setSrcText(text);
    clearTimeout(debounce.current);
    debounce.current = setTimeout(()=>translate(text),900);
  }

  function startListening() {
    if (!recognition.current) {
      toast('Speech not supported', 'Your browser does not support speech recognition', '⚠️');
      return;
    }

    const langCode = LANG_CODES[srcLang] || 'en-US';
    recognition.current.lang = langCode;

    if (mode === 'Live') {
      recognition.current.continuous = true;
      recognition.current.interimResults = true;

      recognition.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setSrcText(prev => {
            const newText = (prev + ' ' + finalTranscript).trim();
            translate(newText);
            return newText;
          });
        } else if (interimTranscript) {
          // Show interim results (don't translate yet)
          setSrcText(prev => (prev + ' ' + interimTranscript).trim());
        }
      };

      recognition.current.onend = () => {
        setIsListening(prev => {
          // Auto-restart in Live mode if still listening
          if (prev && mode === 'Live') {
            try {
              recognition.current.start();
              return true;
            } catch (err) {
              console.error('Failed to restart recognition:', err);
              return false;
            }
          }
          return false;
        });
      };
    } else {
      // Voice mode - single recognition
      recognition.current.continuous = false;
      recognition.current.interimResults = false;

      recognition.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setSrcText(transcript);
        translate(transcript);
      };

      recognition.current.onend = () => {
        setIsListening(false);
      };
    }

    recognition.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') {
        toast('Microphone access denied', 'Please allow microphone access', '🎙');
      } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
        toast('Speech recognition error', event.error, '⚠️');
      }
    };

    try {
      recognition.current.start();
      setIsListening(true);
      toast(mode === 'Live' ? 'Listening continuously...' : 'Listening...', `Speak in ${srcLang}`, '🎙');
    } catch (err) {
      console.error('Error starting recognition:', err);
      toast('Failed to start', 'Could not start speech recognition', '⚠️');
    }
  }

  function stopListening() {
    if (recognition.current) {
      recognition.current.stop();
      setIsListening(false);
      toast('Stopped listening', '', '🛑');
    }
  }

  function switchMode(newMode) {
    if (isListening) {
      stopListening();
    }
    setMode(newMode);

    if (newMode === 'Voice') {
      toast('Voice mode activated', 'Click the microphone to record', '🎙');
    } else if (newMode === 'Live') {
      toast('Live mode activated', 'Click the microphone for continuous translation', '🔴');
    }
  }

  function swap() {
    const [ns,nt,nst,ntt] = [tgtLang,srcLang,tgtText,srcText];
    setSrcLang(ns); setTgtLang(nt); setSrcText(nst); setTgtText(ntt);
  }

  return (
    <div className="content fade-up">
      <div className="g32">
        <div className="col">
          <div className="card">
            <div className="ch">
              <div>
                <div className="ch-title">🌐 Real-Time Translation</div>
                <div className="ch-sub">
                  23 languages · clinical grade · {apiMode === 'demo' ? <span style={{color:'var(--amber)',fontWeight:600}}>Demo Mode</span> : <span style={{color:'var(--green)',fontWeight:600}}>Live AI</span>}
                </div>
              </div>
              <div style={{display:'flex',gap:'.35rem'}}>
                {['Text','Voice','Live'].map(m=>(
                  <button
                    key={m}
                    onClick={()=>switchMode(m)}
                    style={{
                      padding:'.3rem .7rem',
                      borderRadius:6,
                      border:'none',
                      fontFamily:"'DM Sans',sans-serif",
                      fontSize:'.67rem',
                      fontWeight:500,
                      cursor:'pointer',
                      transition:'all .2s',
                      background: m===mode?'var(--violet)':'rgba(255,255,255,.04)',
                      color: m===mode?'var(--white)':'var(--muted)'
                    }}
                  >
                    {m === 'Voice' ? '🎙 ' : m === 'Live' ? '🔴 ' : ''}{m}
                  </button>
                ))}
              </div>
            </div>
            <div className="cb">
              <div style={{display:'flex',alignItems:'center',gap:'.8rem',marginBottom:'.85rem'}}>
                <select className="lang-sel" value={srcLang} onChange={e=>{setSrcLang(e.target.value);translate(srcText,e.target.value,tgtLang);}}>
                  {LANGS.map(l=><option key={l}>{l}</option>)}
                </select>
                <div onClick={swap} style={{width:36,height:36,borderRadius:'50%',background:'rgba(109,40,217,.2)',border:'1px solid rgba(139,92,246,.25)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',fontSize:'.95rem',color:'var(--lavender)',flexShrink:0,transition:'all .22s'}} onMouseEnter={e=>e.target.style.transform='rotate(180deg)'} onMouseLeave={e=>e.target.style.transform=''}>⇄</div>
                <select className="lang-sel" value={tgtLang} onChange={e=>{setTgtLang(e.target.value);translate(srcText,srcLang,e.target.value);}}>
                  {LANGS.map(l=><option key={l}>{l}</option>)}
                </select>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr auto 1fr',gap:'.7rem',alignItems:'start',marginBottom:'.85rem'}}>
                <div>
                  <div style={{fontSize:'.58rem',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'.35rem'}}>{srcLang}</div>
                  <textarea
                    className="tr-area"
                    value={srcText}
                    onChange={e=>debouncedTranslate(e.target.value)}
                    placeholder={mode === 'Text' ? 'Type or paste text to translate...' : 'Click microphone to record...'}
                    disabled={mode !== 'Text'}
                    style={{opacity: mode === 'Text' ? 1 : 0.7}}
                  />
                  <div style={{fontSize:'.61rem',color:'var(--muted)',marginTop:'.35rem',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                    <span>{srcText.length} chars</span>
                    {(mode === 'Voice' || mode === 'Live') && (
                      <button
                        onClick={isListening ? stopListening : startListening}
                        style={{
                          background: isListening ? 'var(--red)' : 'var(--violet)',
                          border: 'none',
                          borderRadius: '50%',
                          width: 36,
                          height: 36,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '1.1rem',
                          animation: isListening ? 'pulse 1.5s ease-in-out infinite' : 'none',
                          transition: 'all 0.3s'
                        }}
                      >
                        {isListening ? '🛑' : '🎙️'}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',paddingTop:'2.8rem',fontSize:'1.1rem',color:loading?'var(--amethyst)':'var(--muted)'}}>
                  {loading ? (
                    <div style={{
                      width: 24,
                      height: 24,
                      border: '3px solid rgba(139,92,246,.2)',
                      borderTop: '3px solid var(--violet)',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                  ) : '→'}
                </div>
                <div>
                  <div style={{fontSize:'.58rem',fontWeight:600,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--muted)',marginBottom:'.35rem'}}>{tgtLang}</div>
                  <textarea className="tr-area out" value={tgtText} readOnly placeholder="Translation will appear here..."/>
                  <div style={{display:'flex',gap:'.38rem',marginTop:'.35rem'}}>
                    <button className="btn btn-g" style={{fontSize:'.66rem',padding:'.3rem .6rem'}} onClick={()=>{navigator.clipboard.writeText(tgtText);toast('Copied','','📋');}}>📋</button>
                    <button className="btn btn-g" style={{fontSize:'.66rem',padding:'.3rem .6rem'}} onClick={()=>{if(window.speechSynthesis)window.speechSynthesis.speak(new SpeechSynthesisUtterance(tgtText));toast('Speaking...','','🔊');}}>🔊</button>
                  </div>
                </div>
              </div>
              {mode === 'Text' && <button className="btn btn-p" style={{width:'100%',justifyContent:'center'}} onClick={()=>translate()}>Translate →</button>}
              {isListening && (
                <div style={{
                  fontSize: '.72rem',
                  color: 'var(--amethyst)',
                  textAlign: 'center',
                  padding: '.5rem',
                  background: 'rgba(139,92,246,.1)',
                  borderRadius: 6,
                  fontWeight: 500
                }}>
                  {mode === 'Live' ? '🔴 Listening continuously... Speak in ' + srcLang : '🎙️ Recording... Speak now'}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="ch"><div className="ch-title">📋 Translation History</div><button className="cl" onClick={()=>setHistory([])}>Clear</button></div>
            <div className="cb" style={{maxHeight:200,overflowY:'auto'}}>
              {!history.length ? <div style={{fontSize:'.68rem',color:'var(--muted)',textAlign:'center',padding:'.8rem'}}>No translations yet</div>
                : history.slice(0,8).map((h,i)=>(
                  <div key={i} style={{display:'flex',gap:'.65rem',padding:'.65rem 0',borderBottom:'1px solid rgba(255,255,255,.04)',fontSize:'.7rem'}}>
                    <span style={{fontSize:'.58rem',color:'var(--amethyst)',flexShrink:0,width:62}}>{h.sL.slice(0,4)}→{h.tL.slice(0,4)}</span>
                    <span style={{flex:1,color:'var(--dim)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.src.slice(0,42)}</span>
                    <span style={{flex:1,color:'var(--lavender)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{h.tgt?.slice(0,42)}</span>
                    <span style={{fontSize:'.56rem',color:'var(--muted)',flexShrink:0}}>{h.ts}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="col">
          <div className="card">
            <div className="ch"><div className="ch-title">⚡ Clinical Quick Phrases</div><button className="cl" onClick={()=>setPhrases(CLINICAL_PHRASES)}>Load more +</button></div>
            <div className="cb" style={{display:'grid',gridTemplateColumns:'repeat(1,1fr)',gap:'.35rem'}}>
              {phrases.map((p,i)=>(
                <button key={i} className="qph" onClick={()=>{setSrcText(p);translate(p);}}>{p}</button>
              ))}
            </div>
          </div>
          <div className="card">
            <div className="ch"><div className="ch-title">📊 Session Stats</div></div>
            <div className="cb" style={{display:'flex',flexDirection:'column',gap:'.45rem',fontSize:'.73rem'}}>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Translations</span><span style={{fontFamily:"'DM Mono',monospace"}}>{history.length}</span></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Source language</span><span>{srcLang}</span></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>Target language</span><span>{tgtLang}</span></div>
              <div style={{display:'flex',justifyContent:'space-between'}}><span style={{color:'var(--muted)'}}>AI backend</span><span style={{color:'var(--green)'}}>Server-side</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
