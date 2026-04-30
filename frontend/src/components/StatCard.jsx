export default function StatCard({ titulo, valor, icon = "📌" }) {
  return (
    <div className="stat-card">
      <div className="stat-icon">{icon}</div>
      <div>
        <h3>{valor}</h3>
        <p>{titulo}</p>
      </div>
    </div>
  );
}