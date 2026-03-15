// src/components/patient/Navigator.jsx
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../../hooks/useApp';
import { CHAT_RESPONSES } from '../../data';
import { apiPost, apiGet, apiDelete } from '../../lib/api';

const INIT_MSGS = [
  { role:'nav', text:"Ndewo Amara! 👋 I'm Fatima, your personal CareCompass navigator. Your Dec 18 cardiology appointment with Dr. Patel is confirmed. Would you like a reminder in Igbo?", time:'10:32 AM' },
];

function getLocalReply(msg) {
  const lower = msg.toLowerCase();
  const match = CHAT_RESPONSES.find(r => r.match.some(k => lower.includes(k)));
  return match?.reply || "I'm looking into that for you now, Amara! I'll have an answer within a few minutes. Is there anything else urgent?";
}

function now() { return new Date().toLocaleTimeString('en-CA', { hour:'2-digit', minute:'2-digit' }); }

export default function Navigator() {
  const { toast } = useApp();
  const [msgs, setMsgs] = useState(INIT_MSGS);
  const [inp, setInp]   = useState('');
  const [typing, setTyping] = useState(false);
  const boxRef = useRef(null);
  const loaded = useRef(false);

  useEffect(() => { if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight; }, [msgs, typing]);

  // Load history on mount
  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    apiGet('/navigator/messages')
      .then(data => {
        if (data?.length) {
          const history = data.map(m => ({
            role: m.role === 'user' ? 'usr' : 'nav',
            text: m.content,
            time: new Date(m.created_at).toLocaleTimeString('en-CA', { hour:'2-digit', minute:'2-digit' }),
          }));
          setMsgs(history);
        }
      })
      .catch(() => {}); // Keep initial messages on failure
  }, []);

  async function send(text) {
    if (!text?.trim()) return;
    setInp('');
    setMsgs(m => [...m, { role:'usr', text, time:now() }]);
    setTyping(true);

    try {
      const data = await apiPost('/navigator/message', { text });
      setTyping(false);
      setMsgs(m => [...m, { role:'nav', text: data.response, time:now() }]);
    } catch {
      // Fallback to local keyword matching
      setTimeout(() => {
        setTyping(false);
        setMsgs(m => [...m, { role:'nav', text: getLocalReply(text), time:now() }]);
      }, 800);
    }
  }

  async function clearChat() {
    try { await apiDelete('/navigator/messages'); } catch {}
    setMsgs([{ role:'nav', text:"Chat cleared! How can I help you, Amara?", time:now() }]);
    toast('Cleared','Fresh conversation started','🗑️');
  }

  const quickRequests = [
    ['📅','Book orthopaedics','Book my orthopaedics appointment at Sunnybrook'],
    ['📱','Resend Igbo reminder','Resend my Igbo reminder for the cardiology appointment'],
    ['📄','Documents needed','What documents do I need for my Dec 18 appointment?'],
    ['🩸','Explain blood work','Can you explain my blood work results?'],
  ];

  return (
    <div className="viewflex-content">
      <div className="card" style={{ borderRadius:0, border:'none', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', flex:1 }}>
        <div className="ch">
          <div style={{ display:'flex', alignItems:'center', gap:'.72rem' }}>
            <div style={{ width:36, height:36, borderRadius:'50%', background:'linear-gradient(135deg,var(--violet),var(--amethyst))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.92rem', position:'relative' }}>
              🧭<span style={{ position:'absolute', bottom:0, right:0, width:9, height:9, borderRadius:'50%', background:'var(--green)', border:'1.5px solid var(--card)' }}/>
            </div>
            <div><div className="ch-title">Fatima — Your Navigator</div><div className="ch-sub" style={{ color:'var(--green)' }}>● Online · Igbo · English · Yoruba</div></div>
          </div>
          <div style={{ display:'flex', gap:'.35rem' }}>
            <button className="btn btn-g" style={{ fontSize:'.67rem' }} onClick={() => toast('Language set','Chat language: Igbo · English','🌐')}>🌐 Igbo</button>
            <button className="btn btn-g" style={{ fontSize:'.67rem' }} onClick={clearChat}>Clear</button>
          </div>
        </div>

        <div ref={boxRef} style={{ padding:'.85rem 1.2rem', display:'flex', flexDirection:'column', gap:'.55rem', flex:1, overflowY:'auto' }}>
          {msgs.map((m, i) => (
            <div key={i} className={`cmsg${m.role==='usr'?' cmsg-r':''}`}>
              <div className={`cav ${m.role==='nav'?'cav-nav':'cav-usr'}`}>{m.role==='nav'?'F':'A'}</div>
              <div>
                <div className={`cbbl ${m.role==='nav'?'cbbl-nav':'cbbl-usr'}`} style={{ whiteSpace:'pre-line' }}>{m.text}</div>
                <div style={{ fontSize:'.58rem', color:'var(--muted)', marginTop:'.22rem', padding:'0 .3rem', textAlign: m.role==='usr'?'right':'left' }}>{m.time}</div>
              </div>
            </div>
          ))}
          {typing && (
            <div className="cmsg">
              <div className="cav cav-nav">F</div>
              <div><div className="cbbl cbbl-nav" style={{ display:'flex', alignItems:'center', gap:4, padding:'.5rem .85rem' }}><span className="ctyping"><span/><span/><span/></span></div></div>
            </div>
          )}
        </div>

        <div style={{ display:'flex', gap:'.5rem', padding:'.85rem 1.2rem', borderTop:'1px solid var(--border)', flexShrink:0 }}>
          <input
            value={inp} onChange={e=>setInp(e.target.value)}
            onKeyDown={e=>{ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); send(inp); }}}
            placeholder="Ask Fatima anything... (Igbo or English)"
            style={{ flex:1, background:'rgba(255,255,255,.05)', border:'1px solid var(--border)', borderRadius:9, padding:'.6rem .85rem', color:'var(--white)', fontFamily:"'DM Sans',sans-serif", fontSize:'.78rem', outline:'none' }}
          />
          <button onClick={()=>send(inp)} style={{ width:36, height:36, borderRadius:9, background:'linear-gradient(135deg,var(--violet),var(--amethyst))', border:'none', color:'var(--white)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'.9rem', flexShrink:0 }}>➤</button>
        </div>
      </div>

      <div style={{ width:280, borderLeft:'1px solid var(--border)', display:'flex', flexDirection:'column', overflowY:'auto', background:'var(--surface)', flexShrink:0 }}>
        <div style={{ padding:'.9rem 1rem', borderBottom:'1px solid var(--border)' }}><div className="ch-title" style={{ fontSize:'.78rem' }}>⚡ Quick Requests</div></div>
        <div style={{ padding:'.7rem .8rem', display:'flex', flexDirection:'column', gap:'.28rem' }}>
          {quickRequests.map(([ico,lbl,msg],i)=>(
            <button key={i} className="qa" onClick={()=>send(msg)}>
              <span className="qa-ico">{ico}</span><span style={{ fontSize:'.72rem' }}>{lbl}</span><span className="qa-arr">›</span>
            </button>
          ))}
        </div>
        <div style={{ padding:'.9rem 1rem', borderTop:'1px solid var(--border)', marginTop:'auto' }}>
          <div style={{ fontSize:'.62rem', color:'var(--muted)', lineHeight:1.65 }}>Fatima speaks <b style={{ color:'var(--lavender)' }}>Igbo</b>, English, and Yoruba.<br/>Reminders always in your preferred language.</div>
        </div>
      </div>
    </div>
  );
}
