import { useState } from "react";
import { API } from "../api";

export default function ProcessCard({ p, usuario, deletar, editar }) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(p.titulo);
  const [descricao, setDescricao] = useState(p.descricao);
  const [status, setStatus] = useState(p.status);
  const [categoria, setCategoria] = useState(p.categoria || "Outros");

  const salvar = () => {
    if (!editar) {
      alert("Erro ao editar");
      return;
    }

    editar(p.id, { titulo, descricao, status, categoria });
    setEditando(false);
  };

  const podeEditar =
    usuario.tipo === "advogado" || usuario.tipo === "secretario";

  const podeExcluir = usuario.tipo === "advogado";

  const calcularTempo = () => {
    if (!p.data_criacao) return "";

    const criada = new Date(p.data_criacao);
    const agora = new Date();
    const diffMs = agora - criada;
    const dias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (dias > 0) return `${dias} dia(s) aberto`;
    return "Aberto hoje";
  };

  return (
    <div className="process-card">
      <div className="process-top">
        <span className="status-badge">{p.status}</span>
        <span className="category-badge">📁 {p.categoria || "Outros"}</span>
        <small>ID #{p.id}</small>
      </div>

      {!editando ? (
        <>
          <h3>{p.titulo}</h3>
          <p className="process-desc">{p.descricao}</p>

          <div className="process-meta">
            <span>👤 {p.dono_email}</span>

            {(usuario.tipo === "advogado" ||
              usuario.tipo === "secretario") && (
              <span>⏱️ {calcularTempo()}</span>
            )}
          </div>

          <div className="process-actions">
            {p.arquivo && (
              <a
                className="pdf-link"
                href={`${API}/${p.arquivo}`}
                target="_blank"
                rel="noreferrer"
              >
                📄 Ver PDF
              </a>
            )}

            {podeEditar && (
              <button className="edit-btn" onClick={() => setEditando(true)}>
                Editar
              </button>
            )}

            {podeExcluir && (
              <button className="danger-btn" onClick={() => deletar(p.id)}>
                Excluir
              </button>
            )}
          </div>
        </>
      ) : (
        <div className="edit-box">
          <input
            className="input"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
          />

          <textarea
            className="input textarea"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option>Em andamento</option>
            <option>Urgente</option>
            <option>Finalizado</option>
            <option>Arquivado</option>
          </select>

          <input
            className="input"
            placeholder="Categoria / pasta"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />

          <div className="process-actions">
            <button className="edit-btn" onClick={salvar}>
              Salvar
            </button>

            <button className="danger-btn" onClick={() => setEditando(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}