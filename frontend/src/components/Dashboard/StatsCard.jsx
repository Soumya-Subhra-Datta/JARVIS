export default function StatsCard({ icon, label, value, color }) {
  return (
    <div className="card stats-card">
      <div className="stats-icon" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div className="stats-info">
        <h3>{value}</h3>
        <p>{label}</p>
      </div>
    </div>
  );
}
