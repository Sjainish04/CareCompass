// src/components/patient/FindCare.jsx
import { useState, useEffect, useCallback, useRef } from 'react';
import { useApp } from '../../hooks/useApp';
import { CLINICS as FALLBACK_CLINICS } from '../../data';
import { apiGet } from '../../lib/api';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

// GTA center coordinates
const GTA_CENTER = [-79.3832, 43.6532]; // [lng, lat]
const GTA_ZOOM = 10.5;

// Specialty → color mapping
const SPEC_COLORS = {
  'Family Medicine': '#7c3aed',
  'Cardiology':      '#db2777',
  'Internal Medicine':'#0891b2',
  'Mental Health':   '#059669',
  'Paediatrics':     '#d97706',
  'Orthopaedics':    '#6366f1',
};

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

  // MapLibre refs
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);

  useEffect(() => {
    apiGet('/providers')
      .then(data => {
        if (data?.length && data[0]?.lat) { setAllClinics(data); setVis(data); }
      })
      .catch(() => {});
  }, []);

  // Initialize MapLibre
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
            paint: {
              'raster-saturation': -0.85,
              'raster-brightness-max': 0.35,
              'raster-contrast': 0.15,
            }
          }
        ]
      },
      center: GTA_CENTER,
      zoom: GTA_ZOOM,
      maxZoom: 17,
      minZoom: 8,
    });

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-right');

    return () => {
      markers.current.forEach(m => m.remove());
      markers.current = [];
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update markers when visible clinics change
  useEffect(() => {
    if (!map.current) return;

    // Remove old markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    vis.forEach(c => {
      if (!c.lat || !c.lng) return;

      const color = SPEC_COLORS[c.spec] || c.color || '#7c3aed';
      const isSel = c.id === selId;

      // Create custom marker element
      const el = document.createElement('div');
      el.style.cssText = `
        width: ${isSel ? 28 : 20}px;
        height: ${isSel ? 28 : 20}px;
        border-radius: 50%;
        background: ${color};
        border: ${isSel ? '3px' : '2px'} solid rgba(255,255,255,0.9);
        cursor: pointer;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(0,0,0,0.4)${isSel ? ', 0 0 0 4px rgba(109,40,217,0.35)' : ''};
      `;

      el.addEventListener('mouseenter', () => {
        if (!isSel) {
          el.style.width = '26px';
          el.style.height = '26px';
          el.style.boxShadow = '0 2px 12px rgba(0,0,0,0.5)';
        }
      });
      el.addEventListener('mouseleave', () => {
        if (!isSel) {
          el.style.width = '20px';
          el.style.height = '20px';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
        }
      });

      // Popup content
      const popupHTML = `
        <div style="font-family:'DM Sans',sans-serif;min-width:180px;color:#fff;">
          <div style="font-weight:700;font-size:.82rem;margin-bottom:4px;">${c.icon || '🏥'} ${c.name}</div>
          <div style="font-size:.68rem;color:#a78bfa;margin-bottom:4px;">${c.spec}</div>
          <div style="color:#f59e0b;font-size:.68rem;margin-bottom:4px;">${'★'.repeat(Math.round(c.rating))}${'☆'.repeat(5-Math.round(c.rating))} ${c.rating}</div>
          <div style="font-size:.64rem;color:#ccc;">${c.acc?'✓ Accepting':'Waitlist'} · ${c.dist}km · ${c.wait}d wait</div>
        </div>
      `;

      const popup = new maplibregl.Popup({
        offset: 14,
        closeButton: false,
        closeOnClick: false,
        className: 'cc-map-popup',
      }).setHTML(popupHTML);

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([c.lng, c.lat])
        .setPopup(popup)
        .addTo(map.current);

      el.addEventListener('mouseenter', () => marker.togglePopup());
      el.addEventListener('mouseleave', () => marker.togglePopup());
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        handlePinClick(c);
      });

      markers.current.push(marker);
    });
  }, [vis, selId]);

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

  function handlePinClick(c) {
    setSelId(c.id);
    setDet(true);
    setSelSlot(null);
    if (map.current && c.lat && c.lng) {
      map.current.flyTo({ center: [c.lng, c.lat], zoom: 14, duration: 800 });
    }
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

      {/* Map area - MapLibre GL */}
      <div style={{ flex:1, position:'relative', overflow:'hidden' }}>
        <div ref={mapContainer} style={{ width:'100%', height:'100%' }} />

        {/* Map filter controls */}
        <div style={{ position:'absolute', top:'.85rem', left:'.85rem', zIndex:10, display:'flex', gap:'.35rem', flexWrap:'wrap' }}>
          {[['all','All'],['__open','Open Now'],['__acc','Accepting']].map(([v,l])=>(
            <button key={v} onClick={()=>setMapFilt(v)} style={{ background:'rgba(19,10,37,.94)', border:`1px solid ${mapFilt===v?'var(--bh)':'var(--border)'}`, padding:'.4rem .72rem', borderRadius:8, fontSize:'.69rem', color: mapFilt===v?'var(--white)':'var(--dim)', cursor:'pointer', fontFamily:"'DM Sans',sans-serif" }}>{l}</button>
          ))}
        </div>

        {/* Stats overlay */}
        <div style={{ position:'absolute', top:'.85rem', right:'.85rem', zIndex:10, background:'rgba(19,10,37,.94)', border:'1px solid var(--border)', borderRadius:10, padding:'.68rem .9rem' }}>
          {[['Showing',vis.length],['Accepting',vis.filter(c=>c.acc).length],['Languages','10+']].map(([l,v])=>(
            <div key={l} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:'1.4rem', marginBottom:'.24rem', fontSize:'.66rem', color:'var(--dim)' }}>
              <span>{l}</span><span style={{ fontFamily:"'DM Mono',monospace", fontSize:'.72rem', color:'var(--white)', fontWeight:500 }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ position:'absolute', bottom:'.85rem', left:'.85rem', zIndex:10, background:'rgba(19,10,37,.94)', border:'1px solid var(--border)', borderRadius:10, padding:'.65rem .85rem' }}>
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
                  {(selClinic.slots || []).map((s,i)=>(
                    <div key={i} onClick={()=>setSelSlot(s)} style={{ padding:'.4rem .3rem', borderRadius:7, textAlign:'center', fontSize:'.64rem', fontWeight:500, cursor:'pointer', border:`1px solid ${selSlot===s?'var(--bh)':'var(--border)'}`, background: selSlot===s?'rgba(109,40,217,.22)':'rgba(255,255,255,.02)', color: selSlot===s?'var(--white)':'var(--dim)', transition:'all .2s' }}>
                      <span style={{ fontSize:'.52rem', color: selSlot===s?'var(--lavender)':'var(--muted)', display:'block' }}>{s.d}</span>{s.t}
                    </div>
                  ))}
                </div>
              </div>
              {/* Reviews */}
              <div style={{ padding:'.9rem 1.3rem', borderBottom:'1px solid var(--border)' }}>
                <div style={{ fontSize:'.56rem', fontWeight:600, letterSpacing:'.1em', textTransform:'uppercase', color:'var(--muted)', marginBottom:'.6rem' }}>Patient Reviews</div>
                {(selClinic.reviews || []).map((r,i)=>(
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
