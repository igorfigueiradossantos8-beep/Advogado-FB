import { useEffect, useState } from "react";
import { agendaAPI, financeiroAPI } from "../api";

export default function Dashboard({ processos = [], avisar }) {
  const [eventos, setEventos] = useState([]);
  const [financeiro, setFinanceiro] = useState([]);

  useEffect(() => {
    async function carregarDados() {
      try {
        const agendaRes = await agendaAPI();
        setEventos(agendaRes.data);
      } catch {
        setEventos([]);
      }

      try {
        const financeiroRes = await financeiroAPI();
        setFinanceiro(financeiroRes.data);
      } catch {
        setFinanceiro([]);
      }
    }

    carregarDados();
  }, []);

  const total = financeiro.reduce((s, f) => s + (f.valor_total || 0), 0);
  const pago = financeiro.reduce((s, f) => s + (f.valor_pago || 0), 0);
  const falta = financeiro.reduce((s, f) => s + (f.falta_pagar || 0), 0);

  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Visão geral</span>
          <h1>Dashboard</h1>
          <p>Resumo geral do escritório.</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <div className="card">
          <h3>Processos</h3>
          <p>{processos.length}</p>
        </div>

        <div className="card">
          <h3>Total contratado</h3>
          <p>R$ {total.toFixed(2)}</p>
        </div>

        <div className="card">
          <h3>Recebido</h3>
          <p>R$ {pago.toFixed(2)}</p>
        </div>

        <div className="card">
          <h3>Falta receber</h3>
          <p>R$ {falta.toFixed(2)}</p>
        </div>
      </section>

      <section className="dashboard-section">
        <h2>Processos recentes</h2>

        {processos.length > 0 ? (
          processos.slice(0, 5).map((p) => (
            <div key={p.id} className="list-item">
              <div>
                <strong>{p.titulo}</strong>
                <p>{p.categoria || "Outros"}</p>
              </div>

              <span>{p.status}</span>
            </div>
          ))
        ) : (
          <p>Nenhum processo</p>
        )}
      </section>

      <section className="dashboard-section">
        <h2>Agenda</h2>

        {eventos.length > 0 ? (
          eventos.slice(0, 5).map((e) => (
            <div key={e.id} className="list-item">
              <div>
                <strong>{e.titulo}</strong>
                <p>{e.tipo}</p>
              </div>

              <span>{e.data_inicio}</span>
            </div>
          ))
        ) : (
          <p>Nenhum evento</p>
        )}
      </section>
    </div>
  );
}