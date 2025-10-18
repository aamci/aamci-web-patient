export const dynamic = 'force-dynamic';
export default function Debug() {
  return (
    <div style={{padding:24}}>
      <h1>Debug</h1>
      <ul>
        <li>NEXT_PUBLIC_API_BASE_URL: <code>{process.env.NEXT_PUBLIC_API_BASE_URL || '(vide)'}</code></li>
        <li>Mode: <code>{process.env.NODE_ENV}</code></li>
      </ul>
      <p><a className="btn" href="/doctors">Aller sur /doctors</a></p>
    </div>
  );
}