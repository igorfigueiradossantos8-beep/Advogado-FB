import { useState } from "react";
import ProcessCard from "../components/ProcessCard";

export default function Processos({ processos, usuario, deletar, editar }) {
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState("Todos");

  const filtrados = processos.filter((p) => {
    const texto = `${p.titulo} ${p.descricao} ${p.status} ${p.categoria || ""}`.toLowerCase();
    const bateBusca = texto.includes(busca.toLowerCase());
    const bateFiltro = filtro === "Todos" || p.status === filtro;
    return bateBusca && bateFiltro;
  });

  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Gestão de casos</span>
          <h1>Processos</h1>
          <p>Pesquise, filtre e acompanhe seus processos jurídicos.</p>
        </div>
      </section>

      <section className="toolbar">
        <input
          className="input"
          placeholder="Pesquisar processo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select
          className="input"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
        >
          <option>Todos</option>
          <option>Em andamento</option>
          <option>Urgente</option>
          <option>Finalizado</option>
          <option>Arquivado</option>
        </select>
      </section>

      <div className="process-grid">
        {filtrados.length > 0 ? (
          filtrados.map((p) => (
            <ProcessCard
              key={p.id}
              p={p}
              usuario={usuario}
              deletar={deletar}
              editar={editar}
            />
          ))
        ) : (
          <div className="empty-state">
            <p>Nenhum processo encontrado</p>
          </div>
        )}
      </div>
    </div>
  );
}