export const dynamic = "force-dynamic";

export default function HealthPage() {
  return (
    <div style={{ padding: 24 }}>
      <h2>✅ Web-Patient Front is Healthy</h2>
      <p>Environment: {process.env.NODE_ENV}</p>
      <p>NEXT_PUBLIC_API_BASE_URL: {process.env.NEXT_PUBLIC_API_BASE_URL}</p>
      <p>Timestamp: {new Date().toLocaleString()}</p>
    </div>
  );
}