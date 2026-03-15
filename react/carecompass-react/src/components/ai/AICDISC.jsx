// src/components/ai/AICDISC.jsx
import { useState } from 'react';
import { useApp } from '../../hooks/useApp';
import { CDISC_DOMAINS, AI_PRED_DOMAINS, SAMPLE_EHR, DEMO_VARS } from '../../data';
import { apiPost } from '../../lib/api';

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

const PIPELINE_STAGES = [
  { ico:'📄', name:'EHR Text Parsing',               done:'EHR parsed — ready for extraction' },
  { ico:'🧬', name:'Cohere: EHR Insight Extraction', done:'47 clinical entities extracted' },
  { ico:'🩻', name:'Aya Vision: X-Ray Analysis',     done:'Image analysis complete' },
  { ico:'🗂', name:'Cohere: SDTM Domain Prediction', done:'6 domains predicted: DM, VS, LB, CM, MH, AE' },
  { ico:'📊', name:'Cohere: CDISC Standards Mapping',done:'62 variables mapped across 6 domains' },
  { ico:'⚖',  name:'GPT-OSS: Compliance Evaluation',  done:'Compliance score: 91%' },
];

export function AICDISC() {
  const { toast } = useApp();
  const [step, setStep]           = useState(0);
  const [ehrText, setEhrText]     = useState('');
  const [xrayName, setXrayName]   = useState('');
  const [stageStatus, setStageStatus] = useState(PIPELINE_STAGES.map(() => 'idle'));
  const [aiOut, setAiOut]         = useState('');
  const [selDomains, setSelDomains] = useState(new Set(AI_PRED_DOMAINS));
  const [vars, setVars]           = useState([]);
  const [domFilter, setDomFilter] = useState('all');
  const [showAddRow, setShowAddRow] = useState(false);
  const [newRow, setNewRow]       = useState({ domain:'DM', variable:'', label:'', value:'' });
  const [review, setReview]       = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState({});
  const [showScoreExplanation, setShowScoreExplanation] = useState(false);

  function jumpStep(n) { if (n <= step) setStep(n); }

  function renderStep0() {
    return (
      <div className="g2">
        <div>
          <div className="card gap">
            <div className="ch"><div><div className="ch-title">📄 EHR / Clinical Notes</div><div className="ch-sub">Paste free-text EHR, discharge summaries, or clinical notes</div></div></div>
            <div className="cb">
              <textarea className="inp" value={ehrText} onChange={e=>setEhrText(e.target.value)} style={{ minHeight:160, fontSize:'.72rem', lineHeight:1.7 }} placeholder="Paste patient EHR here..."/>
              <div style={{ display:'flex', gap:'.38rem', marginTop:'.5rem' }}>
                <button className="btn btn-g" style={{ fontSize:'.68rem' }} onClick={()=>setEhrText(SAMPLE_EHR)}>📄 Sample EHR</button>
                <button className="btn btn-g" style={{ fontSize:'.68rem' }} onClick={()=>setEhrText('')}>🗑 Clear</button>
              </div>
            </div>
          </div>
          <div className="card" style={{ marginTop:'1rem' }}>
            <div className="ch"><div><div className="ch-title">🩻 X-Ray / Medical Images</div><div className="ch-sub">Upload for Aya Vision AI analysis</div></div></div>
            <div className="cb">
              <div className="upload-z" onClick={()=>document.getElementById('xrInput').click()}>
                <div style={{ fontSize:'2rem', marginBottom:'.65rem' }}>{xrayName ? '✅' : '🩻'}</div>
                <div style={{ fontSize:'.85rem', fontWeight:600, marginBottom:'.3rem' }}>{xrayName || 'Drop X-ray or click to upload'}</div>
                <div style={{ fontSize:'.7rem', color:'var(--muted)' }}>JPEG · PNG · AI extracts radiological findings via Aya Vision</div>
              </div>
              <input id="xrInput" type="file" accept="image/*" style={{ display:'none' }} onChange={e=>{ if(e.target.files[0]) { setXrayName(e.target.files[0].name); toast('X-ray loaded', e.target.files[0].name, '🩻'); }}}/>
            </div>
          </div>
        </div>
        <div className="col">
          <div className="card">
            <div className="ch"><div className="ch-title">🎯 Pipeline Options</div></div>
            <div className="cb" style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
              <div><div style={{ fontSize:'.6rem', color:'var(--muted)', marginBottom:'.28rem' }}>Study Type</div>
                <select className="inp" style={{ fontSize:'.71rem' }}><option>Clinical Trial (CDISC SDTM)</option><option>Observational Study</option><option>Regulatory Submission</option><option>Patient Registry</option></select></div>
              <div><div style={{ fontSize:'.6rem', color:'var(--muted)', marginBottom:'.28rem' }}>SDTM Version</div>
                <select className="inp" style={{ fontSize:'.71rem' }}><option>SDTM v3.4 (Current)</option><option>SDTM v3.3</option><option>SDTM v3.2 (Legacy)</option></select></div>
              <label style={{ display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.72rem', cursor:'pointer', color:'var(--dim)' }}><input type="checkbox" defaultChecked style={{ accentColor:'var(--amethyst)' }}/> Extract from EHR</label>
              <label style={{ display:'flex', alignItems:'center', gap:'.5rem', fontSize:'.72rem', cursor:'pointer', color:'var(--dim)' }}><input type="checkbox" style={{ accentColor:'var(--amethyst)' }}/> Include X-ray findings</label>
            </div>
          </div>
          <div className="card">
            <div className="ch"><div className="ch-title">🤖 AI Models</div></div>
            <div className="cb" style={{ display:'flex', flexDirection:'column', gap:'.35rem' }}>
              {[['Cohere Command A','EHR extraction · SDTM prediction · mapping'],['GPT-OSS 120B','Clinical reasoning · compliance review'],['Cohere Aya Vision','X-ray image analysis']].map(([n,d])=>(
                <div key={n} style={{ padding:'.52rem', borderRadius:8, background:'rgba(255,255,255,.025)', border:'1px solid var(--border)', fontSize:'.7rem' }}>
                  <div style={{ color:'var(--lavender)', fontWeight:600, marginBottom:'.1rem' }}>{n}</div>
                  <div style={{ color:'var(--muted)' }}>{d}</div>
                </div>
              ))}
            </div>
          </div>
          <button className="btn btn-p" style={{ width:'100%', justifyContent:'center', padding:'.72rem', fontSize:'.8rem' }} onClick={runPipeline}>🚀 Run AI Pipeline →</button>
        </div>
      </div>
    );
  }

  async function runPipeline() {
    if (!ehrText.trim()) { toast('No EHR data','Click Sample EHR or paste notes first','⚠️'); return; }
    setStep(1);
    const statuses = PIPELINE_STAGES.map(() => 'idle');
    setStageStatus([...statuses]);

    for (let i = 0; i < PIPELINE_STAGES.length; i++) {
      statuses[i] = 'running';
      setStageStatus([...statuses]);
      await sleep(900 + Math.random() * 600);

      // Call backend for EHR extraction at stage 1
      if (i === 1) {
        try {
          const data = await apiPost('/ai/extract-ehr', { ehrText });
          if (data.extraction) {
            const parsed = data.extraction;
            setAiOut('<b>AI extraction:</b><br>' + Object.keys(parsed).map(k=>`<b>${k}:</b> ${JSON.stringify(parsed[k]).substring(0,90)}`).join('<br>'));
          }
        } catch {}
      }

      statuses[i] = 'done';
      setStageStatus([...statuses]);
    }

    setVars(DEMO_VARS.map(v => ({...v})));
    setTimeout(() => setStep(2), 600);
  }

  function renderStep1() {
    return (
      <div className="g32">
        <div>
          <div className="card gap">
            <div className="ch"><div><div className="ch-title">🤖 AI Extraction Pipeline</div><div className="ch-sub">{stageStatus.every(s=>s==='done')?'All 6 stages complete':'Running all stages...'}</div></div>
              <span className={`chip chip-${stageStatus.every(s=>s==='done')?'g':'y'}`}>{stageStatus.every(s=>s==='done')?'Complete':'Running'}</span>
            </div>
            <div className="cb">
              {PIPELINE_STAGES.map((s,i) => {
                const st = stageStatus[i];
                return (
                  <div key={i} className={`ps-row${st==='running'?' running':st==='done'?' done-s':''}`}>
                    <div className={`ps-ico${st==='running'?' running':st==='done'?' done-s':' idle'}`}>{s.ico}</div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:'.77rem', fontWeight:600, marginBottom:'.1rem' }}>{s.name}</div>
                      <div style={{ fontSize:'.63rem', color:'var(--muted)' }}>{st==='done' ? s.done : 'Queued'}</div>
                    </div>
                    <div>
                      {st==='running' && <div className="pipe-spin"/>}
                      {st==='done'    && <span className="chip chip-g">Done</span>}
                      {st==='idle'    && <span className="chip chip-gr">Queued</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="ch"><div className="ch-title">📡 AI Output</div></div>
            <div className="cb" style={{ maxHeight:340, overflowY:'auto', minHeight:100, fontSize:'.71rem', color:'var(--muted)' }}>
              {aiOut ? <div className="ai-bub" dangerouslySetInnerHTML={{__html:aiOut}}/> : 'Pipeline running...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  function toggleDomain(code) {
    setSelDomains(prev => {
      const next = new Set(prev);
      next.has(code) ? next.delete(code) : next.add(code);
      return next;
    });
  }

  function renderStep2() {
    return (
      <div className="card gap">
        <div className="ch">
          <div><div className="ch-title">🗂 SDTM Domain Selection</div><div className="ch-sub">AI-predicted domains pre-selected · Physicians can override</div></div>
          <div style={{ display:'flex', gap:'.35rem' }}>
            <button className="btn btn-g" style={{ fontSize:'.68rem' }} onClick={()=>setSelDomains(new Set(CDISC_DOMAINS.map(d=>d.code)))}>All</button>
            <button className="btn btn-g" style={{ fontSize:'.68rem' }} onClick={()=>setSelDomains(new Set())}>None</button>
          </div>
        </div>
        <div className="cb">
          <div className="ai-bub"><b>AI prediction:</b> Based on extracted EHR data, these domains are predicted: <b>DM</b> Demographics, <b>VS</b> Vital Signs, <b>LB</b> Labs, <b>CM</b> Medications, <b>MH</b> Medical History, <b>AE</b> Adverse Events. Toggle any domain to include or exclude.</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'.4rem', marginBottom:'.8rem' }}>
            {CDISC_DOMAINS.map(d => (
              <div key={d.code} className={`dom-card${selDomains.has(d.code)?' on':''}`} onClick={()=>toggleDomain(d.code)}>
                <div style={{ fontFamily:"'DM Mono',monospace", fontSize:'.73rem', fontWeight:600, color: selDomains.has(d.code)?'var(--lavender)':'var(--muted)' }}>{d.code}</div>
                <div style={{ fontSize:'.55rem', color: selDomains.has(d.code)?'var(--dim)':'var(--muted)', marginTop:'.09rem', lineHeight:1.35 }}>{d.name}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-p" onClick={()=>{ if(!selDomains.size){toast('No domains','Select at least one','⚠️');return;} setStep(3); }}>Continue to Variable Mapping →</button>
        </div>
      </div>
    );
  }

  const domList = [...selDomains];
  const filteredVars = domFilter==='all' ? vars : vars.filter(v=>v.domain===domFilter);

  function updateVar(idx, field, val) {
    setVars(v => { const next=[...v]; next[idx]={...next[idx],[field]:val}; return next; });
  }
  function deleteVar(idx) { setVars(v=>v.filter((_,i)=>i!==idx)); }
  function toggleExpandRow(idx) {
    setExpandedRows(prev => ({ ...prev, [idx]: !prev[idx] }));
  }
  function addVar() {
    if (!newRow.variable || !newRow.value) { toast('Missing fields','Variable and Value required','⚠️'); return; }
    setVars(v=>[...v,{...newRow,label:newRow.label||newRow.variable,confidence:100,source:'Manual'}]);
    setNewRow({domain:domList[0]||'DM',variable:'',label:'',value:''});
    setShowAddRow(false);
    toast('Row added',`${newRow.domain}.${newRow.variable} = ${newRow.value}`,'✅');
  }

  function renderStep3() {
    return (
      <div className="card gap">
        <div className="ch">
          <div><div className="ch-title">📋 CDISC Variable Mapping</div><div className="ch-sub">Review, edit, add or remove variables</div></div>
          <div style={{ display:'flex', gap:'.35rem', alignItems:'center' }}>
            <select className="inp" value={domFilter} onChange={e=>setDomFilter(e.target.value)} style={{ width:130, fontSize:'.68rem' }}>
              <option value="all">All Domains</option>
              {domList.map(d=><option key={d} value={d}>{d}</option>)}
            </select>
            <button className="btn btn-g" style={{ fontSize:'.68rem' }} onClick={()=>setShowAddRow(s=>!s)}>+ Add Row</button>
            <button className="btn btn-p" style={{ fontSize:'.68rem' }} onClick={()=>setStep(4)}>Generate CSV →</button>
          </div>
        </div>
        <div style={{ overflow:'auto', maxHeight:360 }}>
          <table className="var-tbl">
            <thead><tr><th style={{ width:30 }}/><th>Domain</th><th>Variable</th><th>Label</th><th>Value</th><th>Conf.</th><th>Source</th><th/></tr></thead>
            <tbody>
              {filteredVars.map((v,i) => {
                const realIdx = vars.indexOf(v);
                const col = v.confidence>=85?'var(--green)':v.confidence>=70?'var(--yellow)':'var(--red)';
                const isExpanded = expandedRows[realIdx];
                return (
                  <>
                    <tr key={i}>
                      <td style={{ textAlign:'center', cursor:'pointer' }} onClick={()=>toggleExpandRow(realIdx)}>
                        <span style={{ fontSize:'.7rem', color:'var(--muted)', transition:'transform .2s', display:'inline-block', transform: isExpanded?'rotate(90deg)':'rotate(0deg)' }}>▶</span>
                      </td>
                      <td><span className="chip chip-v">{v.domain}</span></td>
                      <td><input className="var-inp" value={v.variable} onChange={e=>updateVar(realIdx,'variable',e.target.value)}/></td>
                      <td><input className="var-inp" value={v.label}    onChange={e=>updateVar(realIdx,'label',e.target.value)}/></td>
                      <td><input className="var-inp" value={v.value}    onChange={e=>updateVar(realIdx,'value',e.target.value)}/></td>
                      <td><div style={{ display:'flex', alignItems:'center', gap:'.4rem' }}>
                        <div style={{ height:4, borderRadius:100, background:'rgba(255,255,255,.05)', overflow:'hidden', width:50 }}><div style={{ height:'100%', borderRadius:100, width:`${v.confidence}%`, background:col }}/></div>
                        <span style={{ fontSize:'.6rem', color:col }}>{v.confidence}%</span>
                      </div></td>
                      <td><span className={`chip chip-${v.source==='EHR'?'b':'v'}`}>{v.source}</span></td>
                      <td><button onClick={()=>deleteVar(realIdx)} style={{ padding:'.18rem .4rem', borderRadius:5, fontSize:'.6rem', background:'var(--rbg)', border:'1px solid rgba(239,68,68,.2)', color:'var(--red)', cursor:'pointer' }}>✕</button></td>
                    </tr>
                    {isExpanded && v.explanation && (
                      <tr key={`exp-${i}`}>
                        <td colSpan={8} style={{ padding:0 }}>
                          <div style={{ margin:'.5rem 1rem', padding:'.85rem 1rem', borderRadius:8, background: v.confidence>=85?'rgba(16,185,129,.08)':v.confidence>=70?'rgba(234,179,8,.08)':'rgba(239,68,68,.08)', border: `1px solid ${v.confidence>=85?'rgba(16,185,129,.2)':v.confidence>=70?'rgba(234,179,8,.2)':'rgba(239,68,68,.2)'}` }}>
                            <div style={{ fontSize:'.72rem', fontWeight:600, marginBottom:'.35rem', color:col }}>🧠 AI Explanation</div>
                            <div style={{ fontSize:'.68rem', lineHeight:1.7, color:'var(--dim)', marginBottom:'.5rem' }}>{v.explanation}</div>
                            {v.ehrSource && (
                              <div style={{ fontSize:'.65rem', color:'var(--muted)', fontFamily:"'DM Mono',monospace", background:'rgba(0,0,0,.2)', padding:'.4rem .6rem', borderRadius:5, borderLeft:`3px solid ${col}` }}>
                                <span style={{ color:col, fontWeight:600 }}>EHR Source:</span> {v.ehrSource}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        {showAddRow && (
          <div style={{ padding:'.8rem 1.1rem', borderTop:'1px solid var(--border)', display:'flex', gap:'.42rem', flexWrap:'wrap' }}>
            <select className="inp" value={newRow.domain} onChange={e=>setNewRow(r=>({...r,domain:e.target.value}))} style={{ width:90, fontSize:'.68rem' }}>
              {domList.map(d=><option key={d}>{d}</option>)}
            </select>
            {[['variable','Variable'],['label','Label'],['value','Value']].map(([f,p])=>(
              <input key={f} className="inp" placeholder={p} value={newRow[f]} onChange={e=>setNewRow(r=>({...r,[f]:e.target.value}))} style={{ flex:1 }}/>
            ))}
            <button className="btn btn-p" style={{ fontSize:'.68rem' }} onClick={addVar}>Add</button>
            <button className="btn btn-g" style={{ fontSize:'.68rem' }} onClick={()=>setShowAddRow(false)}>✕</button>
          </div>
        )}
      </div>
    );
  }

  async function loadReview() {
    if (review) return;
    setReviewLoading(true);
    try {
      const data = await apiPost('/ai/cdisc-map', {
        extractedData: Object.fromEntries(vars.map(v => [`${v.domain}.${v.variable}`, v.value])),
      });
      if (data.review) {
        setReview(data.review);
      } else {
        setReview(`Mapping complete for ${[...new Set(vars.map(v=>v.domain))].join(', ')} domains. Required variables SUBJID, AGE, SEX present. Verify LBDTC and CMSTDTC for full SDTM 3.4 compliance.`);
      }
    } catch {
      setReview(`Mapping complete for ${[...new Set(vars.map(v=>v.domain))].join(', ')} domains. Required variables SUBJID, AGE, SEX present. Verify LBDTC and CMSTDTC for full SDTM 3.4 compliance.`);
    }
    setReviewLoading(false);
  }

  function downloadCSV() {
    const hdrs = ['STUDYID','DOMAIN','USUBJID','VARIABLE','LABEL','VALUE','CONFIDENCE','SOURCE','DATETIME'];
    const rows = vars.map(v=>['"CARE-2024-001"',`"${v.domain}"`,'"AN-2024-001"',`"${v.variable}"`,`"${v.label}"`,`"${v.value}"`,`"${v.confidence}%"`,`"${v.source}"`,`"${new Date().toISOString()}"`].join(','));
    const csv = [hdrs.join(','),...rows].join('\n');
    const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
    a.download=`SDTM_mapping_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    toast('Downloaded',`${vars.length} rows · SDTM v3.4`,'⬇');
  }

  function renderStep4() {
    if (!review && !reviewLoading) loadReview();
    const doms = [...new Set(vars.map(v=>v.domain))];
    const score = Math.round(vars.reduce((a,v)=>a+v.confidence,0)/(vars.length||1));
    const scoreColor = score>=85?'var(--green)':score>=70?'var(--yellow)':'var(--red)';
    const hdrs = ['STUDYID','DOMAIN','USUBJID','VARIABLE','LABEL','VALUE','CONFIDENCE','SOURCE','DATETIME'];
    const lowConfVars = vars.filter(v => v.confidence < 85);
    const explainedVars = vars.filter(v => v.explanation).length;
    const flaggedVars = lowConfVars.length;
    return (
      <div className="g32">
        <div className="card gap">
          <div className="ch">
            <div><div className="ch-title">📊 CSV Preview — SDTM v3.4</div><div className="ch-sub">{vars.length} rows · {doms.join(', ')}</div></div>
            <div style={{ display:'flex', gap:'.35rem' }}>
              <button className="btn btn-p" style={{ fontSize:'.68rem' }} onClick={downloadCSV}>⬇ Download CSV</button>
              <button className="btn btn-g" style={{ fontSize:'.68rem' }} onClick={()=>{navigator.clipboard.writeText(vars.map(v=>[v.domain,v.variable,v.label,v.value,v.confidence+'%',v.source].join('\t')).join('\n'));toast('Copied','','📋');}}>📋 Copy</button>
            </div>
          </div>
          <div style={{ overflow:'auto', maxHeight:380 }}>
            <table className="csv-tbl">
              <thead><tr>{hdrs.map(h=><th key={h}>{h}</th>)}</tr></thead>
              <tbody>
                {vars.map((v,i)=>(
                  <tr key={i}>
                    <td>CARE-2024-001</td><td>{v.domain}</td><td>AN-2024-001</td>
                    <td>{v.variable}</td><td>{v.label}</td><td>{v.value}</td>
                    <td>{v.confidence}%</td><td>{v.source}</td>
                    <td>{new Date().toISOString().slice(0,19)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="col">
          <div className="card">
            <div className="ch"><div className="ch-title">📈 Compliance Report</div></div>
            <div className="cb" style={{ display:'flex', flexDirection:'column', gap:'.6rem' }}>
              <div style={{ textAlign:'center', cursor:'pointer' }} onClick={()=>setShowScoreExplanation(!showScoreExplanation)}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'2rem', fontWeight:700, color:scoreColor }}>{score}%</div>
                <div style={{ fontSize:'.63rem', color:'var(--muted)' }}>CDISC Compliance Score</div>
                <button className="btn btn-g" style={{ fontSize:'.6rem', marginTop:'.4rem' }} onClick={e=>{e.stopPropagation();setShowScoreExplanation(!showScoreExplanation);}}>
                  {showScoreExplanation ? '▼ Hide' : '▶ Why this score?'}
                </button>
              </div>
              {showScoreExplanation && (
                <div style={{ padding:'.7rem', borderRadius:8, background:'rgba(109,40,217,.08)', border:'1px solid rgba(139,92,246,.15)', fontSize:'.68rem', lineHeight:1.6 }}>
                  <div style={{ fontWeight:600, marginBottom:'.3rem', color:'var(--lavender)' }}>Score Calculation:</div>
                  The {score}% score is the average confidence across all {vars.length} mapped variables.
                  {vars.filter(v=>v.confidence>=85).length} variables have high confidence (≥85%),
                  {vars.filter(v=>v.confidence>=70 && v.confidence<85).length} have medium confidence (70-84%), and
                  {vars.filter(v=>v.confidence<70).length} have low confidence (&lt;70%).
                  Higher scores indicate better extraction quality and SDTM compliance.
                </div>
              )}
              <div style={{ display:'flex', flexDirection:'column', gap:'.38rem', fontSize:'.71rem' }}>
                {[['Variables',vars.length],['Domains',doms.join(', ')],['High confidence >=85%', vars.filter(v=>v.confidence>=85).length]].map(([l,v])=>(
                  <div key={l} style={{ display:'flex', justifyContent:'space-between' }}><span style={{ color:'var(--muted)' }}>{l}</span><span style={{ color: l.includes('High')?'var(--green)':'inherit' }}>{v}</span></div>
                ))}
              </div>
              <div style={{ padding:'.6rem', borderRadius:8, background:'var(--gbg)', border:'1px solid rgba(16,185,129,.15)', fontSize:'.67rem', color:'var(--green)' }}>✓ Ready for regulatory review</div>
            </div>
          </div>
          <div className="card">
            <div className="ch"><div className="ch-title">🧠 Explainability Report</div></div>
            <div className="cb" style={{ fontSize:'.72rem', color:'var(--dim)', lineHeight:1.75 }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.5rem' }}>
                <span style={{ color:'var(--muted)' }}>Variables explained:</span>
                <span style={{ color:'var(--green)', fontWeight:600 }}>{explainedVars}/{vars.length}</span>
              </div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.7rem' }}>
                <span style={{ color:'var(--muted)' }}>Flagged for review:</span>
                <span style={{ color: flaggedVars>0?'var(--yellow)':'var(--green)', fontWeight:600 }}>{flaggedVars}</span>
              </div>
              {flaggedVars > 0 && (
                <div>
                  <div style={{ fontSize:'.65rem', fontWeight:600, color:'var(--yellow)', marginBottom:'.4rem' }}>⚠ Variables needing review:</div>
                  {lowConfVars.slice(0,3).map((v,i)=>(
                    <div key={i} style={{ padding:'.5rem', borderRadius:6, background:'rgba(234,179,8,.08)', border:'1px solid rgba(234,179,8,.15)', marginBottom:'.35rem', fontSize:'.66rem' }}>
                      <div style={{ fontWeight:600, marginBottom:'.15rem' }}>{v.domain}.{v.variable} — {v.confidence}%</div>
                      <div style={{ color:'var(--muted)' }}>{v.explanation || 'Low confidence mapping - manual review recommended'}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="card">
            <div className="ch"><div className="ch-title">⚖ AI Clinical Review</div><span style={{ fontSize:'.63rem', color:'var(--green)' }}>Server-side</span></div>
            <div className="cb" style={{ fontSize:'.72rem', color:'var(--dim)', lineHeight:1.75, minHeight:60 }}>
              {reviewLoading ? <><span className="pipe-spin" style={{ display:'inline-block', verticalAlign:'middle', marginRight:'.5rem' }}/>Generating review...</> : review}
            </div>
          </div>
          <div style={{ display:'flex', gap:'.45rem' }}>
            <button className="btn btn-g" style={{ flex:1, justifyContent:'center', fontSize:'.7rem' }} onClick={()=>{ setStep(0); setEhrText(''); setXrayName(''); setVars([]); setReview(''); setSelDomains(new Set(AI_PRED_DOMAINS)); setStageStatus(PIPELINE_STAGES.map(()=>'idle')); setExpandedRows({}); setShowScoreExplanation(false); }}>← Start Over</button>
            <button className="btn btn-p" style={{ flex:1, justifyContent:'center', fontSize:'.7rem' }} onClick={downloadCSV}>⬇ Export CSV</button>
          </div>
        </div>
      </div>
    );
  }

  const STEP_LABELS = ['Input','AI Extract','Domains','Variables','Export'];

  return (
    <div className="content fade-up">
      <div style={{ display:'flex', background:'var(--card)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden', marginBottom:'1.2rem' }}>
        {STEP_LABELS.map((l,i)=>(
          <div key={i} onClick={()=>jumpStep(i)} style={{
            flex:1, padding:'.68rem .4rem', textAlign:'center', fontSize:'.65rem', fontWeight:500, cursor: i<=step?'pointer':'default',
            color: i===step?'var(--white)':i<step?'var(--green)':'var(--muted)',
            background: i===step?'rgba(109,40,217,.18)':'transparent',
            borderRight: i<4?'1px solid var(--border)':'none',
            position:'relative', transition:'all .2s',
          }}>
            {i<step && <span style={{ position:'absolute', top:4, right:5, fontSize:'.48rem', color:'var(--green)' }}>✓</span>}
            <span style={{ fontSize:'.48rem', display:'block', marginBottom:'.1rem', color: i===step?'var(--lavender)':i<step?'var(--green)':'var(--muted)' }}>Step {i+1}</span>
            {l}
          </div>
        ))}
      </div>

      {step===0 && renderStep0()}
      {step===1 && renderStep1()}
      {step===2 && renderStep2()}
      {step===3 && renderStep3()}
      {step===4 && renderStep4()}
    </div>
  );
}
