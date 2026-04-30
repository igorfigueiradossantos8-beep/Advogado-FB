export default function Toast({ texto }) {
  if (!texto) return null;

  return <div className="toast">{texto}</div>;
}