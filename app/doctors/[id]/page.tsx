'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
function getApiBase():string|null{ let b=process.env.NEXT_PUBLIC_API_BASE_URL??''; b=b.trim().replace(/^['"]|['"]$/g,'').replace(/\/+$/,''); try{ return b?new URL(b).toString().replace(/\/$/,''):null;}catch{return null} }
async function callApi(p:string,i?:RequestInit){ const b=getApiBase(); const u=b?`${b}${p}`:p; return fetch(u,i); }
const demoSlots=(id:string)=>{ const now=Date.now(); return [
  {id:`${id}-s1`,start:new Date(now+2*3600e3).toISOString(),label:'Aujourd’hui 14:00'},
  {id:`${id}-s2`,start:new Date(now+3*3600e3).toISOString(),label:'Aujourd’hui 15:00'},
  {id:`${id}-s3`,start:new Date(now+26*3600e3).toISOString(),label:'Demain 10:00'},
];};
export default function DoctorDetail({ params }:{ params:{ id:string } }){
  const router=useRouter(); const [doctor,setDoctor]=useState<any>(null); const [slots,setSlots]=useState<any[]>([]);
  const [err,setErr]=useState<string|null>(null); const [loading,setLoading]=useState(false);
  useEffect(()=>{(async()=>{ try{ const b=getApiBase(); const url=b?`${b}/search/doctors`:`/search/doctors`; const r=await fetch(url); const list=await r.json().catch(()=>[]); const found=list.find((d:any)=>d.id===params.id) || list[0];
    setDoctor(found || {id:params.id,name:'Dr. Démo',specialty:'Médecine générale',city:'Paris',hospital:'Centre'}); setSlots(demoSlots(params.id));
  }catch{ setDoctor({id:params.id,name:'Dr. Démo',specialty:'Médecine générale',city:'Paris',hospital:'Centre'}); setSlots(demoSlots(params.id)); } })(); },[params.id]);
  async function book(slotId:string){ setErr(null); setLoading(true); try{ const t=localStorage.getItem('token'); if(!t){ setErr('Veuillez vous connecter.'); router.push('/auth/login'); return; }
    const r=await callApi('/appointments',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${t}`},body:JSON.stringify({slotId,notes:`RDV avec ${doctor?.name}`})});
    if(!r.ok){ setErr(`Erreur ${r.status}`); return; } const d=await r.json(); router.push(`/doctors/${params.id}/success?aid=${d.id||''}`);
  }catch(e:any){ setErr(e?.message||'Erreur réseau'); } finally{ setLoading(false); } }
  if(!doctor) return <div style={{padding:'24px 0'}}>Chargement…</div>;
  return (<div style={{display:'grid',gap:16,padding:'24px 0'}}>
    <a className="link" href="/doctors">← Retour à la liste</a>
    <div className="card"><h1 style={{margin:'4px 0 6px'}}>{doctor.name}</h1><div className="small" style={{color:'var(--muted)'}}>{doctor.specialty} • {doctor.city} • {doctor.hospital}</div><p style={{marginTop:12}}>Consultation en présentiel. Apportez votre pièce d’identité et carte vitale.</p></div>
    <div id="slots" className="card"><h3>Créneaux disponibles</h3><div className="row" style={{flexWrap:'wrap',gap:8,marginTop:8}}>{slots.map(s=>(<button key={s.id} className="btn outline" disabled={loading} onClick={()=>book(s.id)}>{s.label}</button>))}</div>{err&&<div className="banner error" style={{marginTop:12}}>{err}</div>}</div>
  </div>);
}