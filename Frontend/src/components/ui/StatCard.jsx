function StatCard({ title, value, hint }) {
  return (
    <article className="stat-card">
      <p className="stat-title">{title}</p>
      <h3>{value}</h3>
      <small>{hint}</small>
    </article>
  );
}

export default StatCard;