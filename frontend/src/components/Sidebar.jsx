import { BRAND } from "../brand";

export default function Sidebar({ usuario, setTela, sair }) {
  return (
    <aside className="sidebar">
      <div>
        <div className="brand">
          <div className="brand-icon">{BRAND.iniciais}</div>
          <div>
            <h2 className="sidebar-logo">{BRAND.nomeCurto}</h2>
            <p>{BRAND.subtitulo}</p>
          </div>
        </div>

        <div className="lawyer-card">
          <div className="lawyer-icon">⚖️</div>
          <h3>{BRAND.advogado}</h3>
          <p>{BRAND.oab}</p>
          <p>{BRAND.telefone}</p>
          <div className="signature-line"></div>
          <small>Assinatura</small>
        </div>

        <div className="user-card">
          <span className="user-label">Conta conectada</span>
          <p>{usuario.email}</p>
          <strong>{usuario.tipo}</strong>
        </div>

        <nav className="menu">
          <button onClick={() => setTela("dashboard")}>📊 Dashboard</button>
          <button onClick={() => setTela("processos")}>📁 Processos</button>
          <button onClick={() => setTela("novo")}>➕ Novo Processo</button>

          {usuario.tipo !== "cliente" && (
            <>
            <button onClick={() => setTela("agenda")}>📅 Agenda</button>
              <button onClick={() => setTela("clientes")}>👥 Clientes</button>
              <button onClick={() => setTela("financeiro")}>💰 Financeiro</button>
            </>
          )}

          {usuario.tipo === "cliente" && (
            <button onClick={() => setTela("financeiro")}>💰 Meus pagamentos</button>
          )}
        </nav>
      </div>

      <button className="logout-btn" onClick={sair}>
        🚪 Sair da conta
      </button>
    </aside>
  );
}