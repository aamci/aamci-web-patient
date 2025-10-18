'use client';
export default function Error({ error, reset }: { error: any; reset: () => void }) {
  return (
    <div style={{padding:24}}>
      <h2>Une erreur est survenue</h2>
      <pre style={{whiteSpace:'pre-wrap', background:'#f6f6f6', padding:12}}>
        {String(error?.message || error)}
      </pre>
      <button className="btn" onClick={() => reset()}>Recharger</button>
    </div>
  );
}