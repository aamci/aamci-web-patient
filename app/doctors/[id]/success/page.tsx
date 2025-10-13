export default function Success({ searchParams }:{ searchParams:{ aid?:string } }){
  return (<div style={{display:'grid',gap:16,padding:'24px 0'}}>
    <div className="card"><h2>Rendez-vous confirmé 🎉</h2><p>ID de la réservation : <code>{searchParams.aid||'n/a'}</code></p>
    <div className="row" style={{marginTop:12}}><a className="btn primary" href="/doctors">Retour à la liste</a><a className="btn ghost" href="/protected">Voir mon profil</a></div></div>
  </div>);
}