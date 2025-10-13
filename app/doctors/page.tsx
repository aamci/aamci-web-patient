import Link from 'next/link';
function getApiBase(){ let b=process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/^['"]|['"]$/g,'').replace(/\/+$/,'')||''; try{ return b?new URL(b).toString().replace(/\/$/,''):'';}catch{return ''} }
export default async function DoctorsPage({ searchParams }:{ searchParams:{ q?:string; city?:string } }){
  const api=getApiBase();
  const url = api? `${api}/search/doctors?q=${encodeURIComponent(searchParams.q||'')}&city=${encodeURIComponent(searchParams.city||'')}` : `/search/doctors?q=${searchParams.q||''}&city=${searchParams.city||''}`;
  const res = await fetch(url, { cache:'no-store' }); const doctors = await res.json().catch(()=>[]);
  return (<div style={{display:'grid',gap:16,padding:'24px 0'}}>
    <h1>Médecins</h1>
    <form style={{display:'grid',gridTemplateColumns:'1fr 200px 120px',gap:10}} action="/doctors">
      <input className="input" name="q" placeholder="Nom / spécialité" defaultValue={searchParams.q||''}/>
      <input className="input" name="city" placeholder="Ville" defaultValue={searchParams.city||''}/>
      <button className="btn primary">Rechercher</button>
    </form>
    <div className="grid" style={{gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
      {doctors.map((d:any)=>(<div key={d.id} className="card">
        <strong>{d.name}</strong>
        <div className="small" style={{marginTop:4,color:'var(--muted)'}}>{d.specialty} • {d.city} • {d.hospital}</div>
        <div className="row" style={{marginTop:10}}>
          <Link className="btn outline" href={`/doctors/${d.id}`}>Voir la fiche</Link>
          <Link className="btn primary" href={`/doctors/${d.id}#slots`}>Prendre RDV</Link>
        </div>
      </div>))}
      {!doctors.length && <div className="card">Aucun résultat.</div>}
    </div>
  </div>);
}