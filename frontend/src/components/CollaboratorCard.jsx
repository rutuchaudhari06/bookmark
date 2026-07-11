export default function CollaboratorCard({ userId, onRemove }) {
  return (
    <div style={{ border: "1px solid gray", padding: "6px", margin: "6px 0" }}>
      <span>{userId}</span>
      <button onClick={() => onRemove(userId)} style={{ marginLeft: "10px" }}>
        Remove
      </button>
    </div>
  );
}
