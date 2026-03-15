// src/components/patient/FindCare.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import { CLINICS as FALLBACK_CLINICS, GEO, geoToXY } from '../../data';
import { apiGet } from '../../lib/api';

const W = 800, H = 600;

// Road-like paths across the GTA for visual context
const ROADS = [
  // Highway 401 (east-west)
  'M 0,260 Q 200,255 400,250 Q 600,245 800,240',
  // Highway 407 (east-west, north)
  'M 0,180 Q 200,175 400,170 Q 600,165 800,160',
  // DVP (north-south)
  'M 480,0 Q 475,150 470,300 Q 465,450 460,600',
  // Highway 404 (north-south)
  'M 520,0 Q 515,150 510,300 Q 505,450 500,600',
  // Gardiner Expressway (south)
  'M 0,420 Q 150,410 300,400 Q 450,390 600,385',
  // Highway 427 (north-south west)
  'M 180,0 Q 175,200 170,400 Q 165,500 160,600',
  // QEW (southwest)
  'M 0,380 Q 100,390 200,400 Q 300,420 400,440',
];

function starsH(r) {
  return Array.from({length:5},(_,i)=><span key={i} style={{color:i<Math.floor(r)?'#f59e0b':'rgba(255,255,255,.13)',fontSize:'.65rem'}}>&#9733;</span>);
}

export default function FindCare() {
  const { openModal, toast } = useApp();
  const [allClinics, setAllClinics] = useState(FALLBACK_CLINICS);
  const [vis, setVis]       = useState(FALLBACK_CLINICS);
  const [selId, setSelId]   = useState(null);
  const [detOpen, setDet]   = useState(false);
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(new Set(['all']));
  const [sort, setSort]     = useState('dist');
  const [mapFilt, setMapFilt] = useState('all');
  const [selSlot, setSelSlot] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  // SVG pan/zoom state
  const svgRef = useRef(null);
  const [vb, setVb] = useState({ x: 0, y: 0, w: W, h: H });
  const drag = useRef(null);

  useEffect(() => {
    apiGet('/providers')
      .then(data => {
        if (data?.length && data[0]?.lat) { setAllClinics(data); setVis(data); }
      })
      .catch(() => {});
  }, []);

  const selClinic = allClinics.find(c=>c.id===selId);

  const applyFilters = useCallback((s=search, f=filters, sf=sort, mf=mapFilt) => {
    let list = allClinics.filter(c => {
      const mq = !s || c.name.toLowerCase().includes(s.toLowerCase()) || c.spec.toLowerCase().includes(s.toLowerCase()) || c.langs.some(l=>l.toLowerCase().includes(s.toLowerCase()));
      let mf2 = true;
      if (!f.has('all')) mf2 = [...f].some(fv => fv==='__acc'?c.acc:fv==='__open'?c.open:c.spec===fv);
      let mm = true;
      if (mf==='__open') mm=c.open; if (mf==='__acc') mm=c.acc;
      return mq && mf2 && mm;
    });
    if (sf==='dist') list.sort((a,b)=>a.dist-b.dist);
    else if (sf==='rating') list.sort((a,b)=>b.rating-a.rating);
    else if (sf==='wait') list.sort((a,b)=>a.wait-b.wait);
    else list.sort((a,b)=>a.name.localeCompare(b.name));
    setVis(list);
  }, [allClinics]);

  function toggleFilter(type) {
    setFilters(prev => {
      const next = new Set(prev);
      if (type==='all') return new Set(['all']);
      next.delete('all');
      next.has(type) ? next.delete(type) : next.add(type);
      if (!next.size) return new Set(['all']);
      return next;
    });
  }

  useEffect(() => { applyFilters(search, filters, sort, mapFilt); }, [search, filters, sort, mapFilt]);

  // Pan handlers
  function onMouseDown(e) {
    if (e.button !== 0) return;
    drag.current = { sx: e.clientX, sy: e.clientY, vx: vb.x, vy: vb.y };
  }
  function onMouseMove(e) {
    if (!drag.current) return;
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = (e.clientX - drag.current.sx) * (vb.w / rect.width);
    const dy = (e.clientY - drag.current.sy) * (vb.h / rect.height);
    setVb(v => ({ ...v, x: drag.current.vx - dx, y: drag.current.vy - dy }));
  }
  function onMouseUp() { drag.current = null; }

  // Zoom handler
  function onWheel(e) {
    e.preventDefault();
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const mx = ((e.clientX - rect.left) / rect.width) * vb.w + vb.x;
    const my = ((e.clientY - rect.top) / rect.height) * vb.h + vb.y;
    const factor = e.deltaY > 0 ? 1.15 : 0.87;
    const nw = Math.max(200, Math.min(W * 2, vb.w * factor));
    const nh = Math.max(150, Math.min(H * 2, vb.h * factor));
    setVb({
      x: mx - (mx - vb.x) * (nw / vb.w),
      y: my - (my - vb.y) * (nh / vb.h),
      w: nw,
      h: nh,
    });
  }

  function zoom(dir) {
    const factor = dir === 'in' ? 0.8 : 1.25;
    setVb(v => {
      const cx = v.x + v.w / 2, cy = v.y + v.h / 2;
      const nw = Math.max(200, Math.min(W * 2, v.w * factor));
      const nh = Math.max(150, Math.min(H * 2, v.h * factor));
      return { x: cx - nw / 2, y: cy - nh / 2, w: nw, h: nh };
    });
  }

  function handlePinClick(c) {
    setSelId(c.id);
    setDet(true);
    setSelSlot(null);
    // Center map on clinic
    const { x, y } = geoToXY(c.lat, c.lng, W, H);
    setVb(v => ({ ...v, x: x - v.w / 2, y: y - v.h / 2 }));
  }

  return (
    <div className="viewflex-content">
      {/* Left panel */}
      <div className="fpanel">
        <div style={{ padding:'1rem 1.15rem 0' }}>
          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', fontWeight:700, marginBottom:'.2rem' }}>Find Care Near You</div>
          <div style={{ fontSize:'.67rem', color:'var(--muted)' }}>{vis.length} clinics in the GTA</div>
        </div>
        {/* Search */}
        <div style={{ position:'relative', margin:'.72rem 1.15rem 0' }}>
          <span style={{ position:'absolute', left:'.75rem', top:'50%', transform:'translateY(-50%)', fontSize:'.82rem', color:'var(--muted)' }}>&#128269;</span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Clinic, specialty, or language..." style={{ width:'100%', background:'var(--card)', border:'1px solid var(--border)', borderRadius:10, padding:'.58rem .85rem .58rem 2.2rem', color:'var(--white)', fontFamily:"'DM Sans',sans-serif", fontSize:'.77rem', outline:'none' }}/>
        </div>
        {/* Filters */}
        <div style={{ display:'flex', gap:'.3rem', padding:'.58rem 1.15rem', overflowX:'auto', flexShrink:0 }}>
          {[['all','All'],['Family Medicine','Family'],['Cardiology','Cardiology'],['Internal Medicine','Internal'],['Mental Health','Mental'],['Paediatrics','Paeds'],['__acc','Accepting'],['__open','Open Now']].map(([v,l])=>(
            <button key={v} onClick={()=>toggleFilter(v)} style={{ whiteSpace:'nowrap', padding:'.26rem .68rem', borderRadius:100, fontSize:'.65rem', fontWeight:500, cursor:'pointer', border:`1px solid ${filters.has(v)?'var(--bh)':'var(--border)'}`, background: filters.has(v)?'rgba(109,40,217,.18)':'transparent', color: filters.has(v)?'var(--white)':'var(--dim)', fontFamily:"'DM Sans',sans-serif", flexShrink:0 }}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0 1.15rem .45rem', fontSize:'.65rem', color:'var(--muted)' }}>
          <span>{vis.length} clinics</span>
          <select value={sort} onChange={e=>setSort(e.target.value)} style={{ background:'transparent', border:'none', color:'var(--amethyst)', fontFamily:"'DM Sans',sans-serif", fontSize:'.65rem', cursor:'pointer', outline:'none' }}>
            <option value="dist">Nearest</option><option value="rating">Top rated</option>
            <option value="wait">Shortest wait</option><option value="name">A-Z</option>
          </select>
        </div>
        {/* Clinic list */}
        <div style={{ flex:1, overflowY:'auto', padding:'0 .6rem .7rem' }}>
          {vis.map(c => (
            <div key={c.id} className={`ccard${selId===c.id?' sel':''}`} onClick={()=>handlePinClick(c)}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'.35rem', marginBottom:'.48rem' }}>
                <div><div style={{ fontSize:'.82rem', fontWeight:600 }}>{c.icon} {c.name}</div><div style={{ fontSize:'.62rem', color:'var(--amethyst)', marginTop:'.1rem' }}>{c.spec}</div></div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'.22rem', flexShrink:0 }}>
                  <span className={`chip chip-${c.acc?'g':'r'}`}>{c.acc?'&#10003; Accepting':'Waitlist'}</span>
                  <span style={{ fontSize:'.6rem', color:'var(--muted)', fontFamily:"'DM Mono',monospace" }}>{c.dist}km</span>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:'.28rem', marginBottom:'.42rem' }}>
                <div style={{ display:'flex', gap:1 }}>{starsH(c.rating)}</div>
                <span style={{ fontFamily:"'DM Mono',monospace", fontSize:'.7rem' }}>{c.rating}</span>
                <span style={{ fontSize:'.6rem', color:'var(--muted)' }}>({c.rc.toLocaleString()})</span>
              </div>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'.28rem', marginBottom:'.48rem' }}>
                <span className={`chip chip-${c.open?'g':'r'}`}>{c.open?'● Open':'● Closed'}</span>
                <span className="chip chip-y">&#9201; {c.wait}d</span>
                {c.langs.slice(0,3).map(l=><span key={l} className="chip chip-t">&#127760; {l}</span>)}
                {c.langs.length>3&&<span className="chip chip-t">+{c.langs.length-3}</span>}
              </div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                <span style={{ fontSize:'.62rem', color:'var(--muted)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginRight:'.5rem' }}>&#128205; {c.addr}</span>
                <button className="btn btn-p" style={{ fontSize:'.67rem', padding:'.34rem .82rem' }} onClick={e=>{ e.stopPropagation(); openModal('clinicBook',{clinic:c}); }}>Book &rarr;</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Map area - SVG */}
      <div style={{ flex:1, position:'relative', background:'#080515', overflow:'hidden' }}>
        <svg
          ref={svgRef}
          viewBox={`${vb.x} ${vb.y} ${vb.w} ${vb.h}`}
          style={{ width:'100%', height:'100%', cursor: drag.current ? 'grabbing' : 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onWheel={onWheel}
        >
          {/* Background */}
          <rect x={-200} y={-200} width={W+400} height={H+400} fill="#080515"/>

          {/* Grid lines */}
          {Array.from({length:17},(_,i)=>i*50).map(v=>(
            <g key={`grid-${v}`}>
              <line x1={v} y1={-200} x2={v} y2={H+200} stroke="rgba(139,92,246,.06)" strokeWidth="0.5"/>
              <line x1={-200} y1={v} x2={W+200} y2={v} stroke="rgba(139,92,246,.06)" strokeWidth="0.5"/>
            </g>
          ))}

          {/* Lake Ontario (bottom area) */}
          <ellipse cx={400} cy={620} rx={500} ry={180} fill="rgba(14,116,144,.08)" stroke="rgba(14,116,144,.15)" strokeWidth="1"/>
          <text x={400} y={570} textAnchor="middle" fill="rgba(14,116,144,.25)" fontSize="12" fontFamily="'DM Sans',sans-serif">Lake Ontario</text>

          {/* Roads */}
          {ROADS.map((d,i)=>(
            <path key={i} d={d} fill="none" stroke="rgba(139,92,246,.12)" strokeWidth="1.5" strokeLinecap="round"/>
          ))}

          {/* Clinic markers */}
          {vis.map(c => {
            const { x, y } = geoToXY(c.lat, c.lng, W, H);
            const isSel = c.id === selId;
            return (
              <g key={c.id} style={{ cursor:'pointer' }}
                onClick={(e) => { e.stopPropagation(); handlePinClick(c); }}
                onMouseEnter={(e) => {
                  const svg = svgRef.current;
                  const rect = svg.getBoundingClientRect();
                  const px = ((x - vb.x) / vb.w) * rect.width + rect.left;
                  const py = ((y - vb.y) / vb.h) * rect.height + rect.top;
                  setTooltip({ c, px, py });
                }}
                onMouseLeave={() => setTooltip(null)}
              >
                {isSel && <circle cx={x} cy={y} r={14} fill="none" stroke="rgba(109,40,217,.35)" strokeWidth="3">
                  <animate attributeName="r" values="14;18;14" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="1;.3;1" dur="2s" repeatCount="indefinite"/>
                </circle>}
                <circle cx={x} cy={y} r={isSel ? 7 : 5} fill={c.color} stroke="rgba(255,255,255,.85)" strokeWidth={isSel ? 2.5 : 1.5}/>
              </g>
            );
          })}
        </svg>

        {/* Tooltip (HTML overlay) */}
        {tooltip && (
          <div style={{
            position:'absolute',
            left: tooltip.px + 12,
            top: tooltip.py - 10,
            background:'rgba(19,10,37,.96)',
            border:'1px solid var(--border)',
            borderRadius:9,
            padding:'.55rem .75rem',
            zIndex:1001,
            pointerEvents:'none',
            minWidth:160,
            fontFamily:"'DM Sans',sans-serif",
          }}>
            <div style={{ fontWeight:700, fontSize:'.78rem', marginBottom:'.15rem' }}>{tooltip.c.name}</div>
            <div style={{ fontSize:'.65rem', color:'var(--muted)', marginBottom:'.2rem' }}>{tooltip.c.spec}</div>
            <div style={{ color:'#f59e0b', fontSize:'.65rem', marginBottom:'.15rem' }}>{'★'.repeat(Math.round(tooltip.c.rating))}{'☆'.repeat(5-Math.round(tooltip.c.rating))} {tooltip.c.rating}</div>
            <div style={{ fontSize:'.6rem', color:'var(--dim)' }}>{tooltip.c.acc?'✓ Accepting':'Waitlist'} · {tooltip.c.dist}km</div>
          </div>
        )}

        {/* Zoom controls */}
        <div style={{ position:'absolute', bottom:'.85rem', right:'.85rem', zIndex:1000, display:'flex', flexDirection:'column', gap:'.3rem' }}>
          <button onClick={()=>zoom('in')} style={{ width:30, height:30, borderRadius:7, background:'rgba(19,10,37,.94)', border:'1px solid var(--border)', color:'var(--white)', cursor:'pointer', fontSize:'.9rem', display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
          <button onClick={()=>zoom('out')} style={{ width:30, height:30, borderRadius:7, background:'rgba(19,10,37,.94)', border:'1px solid var(--border)', color:'var(--white)', cursor:'pointer', fontSize:'.9rem', display:'flex', alignItems:'center', justifyContent:'center' }}>-</button>
          <button onClick={()=>setVb({x:0,y:0,w:W,h:H})} style={{ width:30, height:30, borderRadius:7, background:'rgba(19,10,37,.94)', border:'1px solid var(--border)', color:'var(--white)', cursor:'pointer', fontSize:'.65rem', display:'flex', alignItems:'center', justifyContent:'center' }}>&#8634;</button>
        </div>

        {/* Map filter controls */}
        <div style={{ position:'absolute', top:'.85rem', left:'.85rem', zIndex:1000, display:'flex', gap:'.35rem', flexWrap:'wrap' }}>
          {[['all','All'],['__open','Open Now'],['__acc','Accepting']].map(([v,l])=>(
            <button key={v} onClick={()=>setMapFilt(v)} style={{ background:'rgba(19,10,37,.94)', border:`1px solid ${mapFilt===v?'var(--bh)':'var(--border)'}`, padding:'.4rem .72rem', borderRadius:8, fontSize:'.69rem', color: mapFilt===v?'var(--white)':'var(--dim)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
          ))}
        </div>

        {/* Stats overlay */}
        <div style={{ position:'absolute', top:'.85rem', right:'.85rem', zIndex:1000, background:'rgba(19,10,37,.94)', border:'1px solid var(--border)', borderRadius:10, padding:'.68rem .9rem' }}>
          {[['Showing',vis.length],['Accepting',vis.filter(c=>c.acc).length],['Languages','10+']].map(([l,v])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1.4rem', marginBottom:'.24rem', fontSize:'.66rem', color:'var(--dim)' }}>
              <span>{l}</span><span style={{ fontFamily:"'DM Mono',monospace", fontSize:'.72rem', color:'var(--white)', fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ position:'absolute', bottom:'.85rem', left:'.85rem', zIndex:1000, background:'rgba(19,10,37,.94)', border:'1px solid var(--border)', borderRadius:10, padding:'.65rem .85rem' }}>
          <div style={{ fontSize:'.52rem', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'.42rem' }}>Specialty</div>
          {[['#7c3aed','Family'],['#db2777','Cardiology'],['#0891b2','Internal'],['#059669','Mental Health'],['#d97706','Paediatrics'],['#6366f1','Other']].map(([c,l])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', gap:'.42rem', marginBottom:'.24rem', fontSize:'.63rem', color:'var(--dim)' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:c, flexShrink:0 }}/>{l}
            </div>
          ))}
        </div>

        {/* Detail panel */}
        <div className={`det${detOpen?' open':''}`}>
          <div onClick={()=>setDet(false)} style={{ position:'absolute', top:'.85rem', right:'.85rem', width:26, height:26, borderRadius:'50%', background:'rgba(255,255,255,.06)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', fontSize:'.72rem', zIndex:1 }}>&#10005;</div>
          {selClinic && (
            <div>
              <div style={{ padding:'1.6rem 1.3rem 1rem', borderBottom:'1px solid var(--border)' }}>
                <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#2d1a5c,var(--violet))', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', marginBottom:'.82rem' }}>{selClinic.icon}</div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', fontWeight:700, marginBottom:'.18rem' }}>{selClinic.name}</div>
                <div style={{ fontSize:'.72rem', color:'var(--amethyst)', marginBottom:'.6rem' }}>{selClinic.spec}</div>
                <div style={{ display:'flex', alignItems:'center', gap:'.6rem', marginBottom:'.6rem' }}>
                  <div style={{ display:'flex', gap:2 }}>{starsH(selClinic.rating)}</div>
                  <span style={{ fontFamily:"'Playfair Display',serif", fontSize:'1.05rem', fontWeight:700 }}>{selClinic.rating}</span>
                  <span style={{ fontSize:'.65rem', color:'var(--muted)' }}>{selClinic.rc.toLocaleString()} reviews</span>
                </div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:'.3rem' }}>
                  <span className={`chip chip-${selClinic.acc?'g':'r'}`}>{selClinic.acc?'✓ Accepting':'Waitlist'}</span>
                  <span className={`chip chip-${selClinic.open?'g':'r'}`}>{selClinic.open?'● Open':'● Closed'}</span>
                  <span className="chip chip-y">&#9201; {selClinic.wait}d wait</span>
                </div>
              </div>
              {/* Info */}
              <div style={{ padding:'.9rem 1.3rem', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:'.56rem', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'.6rem' }}>Clinic Info</div>
                {[['&#128205;',selClinic.addr],['&#128222;',selClinic.phone],['&#128336;',selClinic.hours],['&#127760;',selClinic.langs.join(' · ')]].map(([ico,val],i)=>(
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:'.55rem', marginBottom:'.45rem', fontSize:'.74rem', color:'var(--dim)' }}>
                    <span style={{ width:17, textAlign:'center', fontSize:'.78rem', flexShrink:0, marginTop:'.04rem' }} dangerouslySetInnerHTML={{__html:ico}}/>{val}
                  </div>
                ))}
              </div>
              {/* Slots */}
              <div style={{ padding:'.9rem 1.3rem', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:'.56rem', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'.6rem' }}>Next Available Slots</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'.35rem' }}>
                  {selClinic.slots.map((s,i)=>(
                    <div key={i} onClick={()=>setSelSlot(s)} style={{ padding:'.4rem .3rem', borderRadius:7, textAlign:'center', fontSize:'.64rem', fontWeight:500, cursor:'pointer', border:`1px solid ${selSlot===s?'var(--bh)':'var(--border)'}`, background: selSlot===s?'rgba(109,40,217,.22)':'rgba(255,255,255,.02)', color: selSlot===s?'var(--white)':'var(--dim)', transition:'all .2s' }}>
                      <span style={{ fontSize:'.52rem', color: selSlot===s?'var(--lavender)':'var(--muted)', display:'block' }}>{s.d}</span>{s.t}
                    </div>
                  ))}
                </div>
              </div>
              {/* Reviews */}
              <div style={{ padding:'.9rem 1.3rem', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:'.56rem', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'.6rem' }}>Patient Reviews</div>
                {selClinic.reviews.map((r,i)=>(
                  <div key={i} style={{ background:'rgba(255,255,255,.025)', border:'1px solid rgba(255,255,255,.05)', borderRadius:9, padding:'.75rem', marginBottom:'.55rem' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'.3rem' }}>
                      <div><span style={{ fontSize:'.72rem', fontWeight:600 }}>{r.a}</span> <span style={{ fontSize:'.56rem', color:'var(--amethyst)' }}>· {r.l}</span></div>
                      <span style={{ color:'#f59e0b', fontSize:'.6rem' }}>{'★'.repeat(r.s)}</span>
                    </div>
                    <div style={{ fontSize:'.7rem', color:'var(--dim)', lineHeight:1.6 }}>"{r.t}"</div>
                    <div style={{ fontSize:'.58rem', color:'var(--muted)', marginTop:'.28rem' }}>{r.d}</div>
                  </div>
                ))}
              </div>
              {/* Book CTA */}
              <div style={{ padding:'1rem 1.3rem' }}>
                <button className="mcta" onClick={()=>openModal('clinicBook',{clinic:selClinic})}>Book Appointment &rarr;</button>
                <div style={{ fontSize:'.62rem', color:'var(--muted)', textAlign:'center', marginTop:'.5rem' }}>&#127760; Reminders in your language · PHIPA compliant</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
