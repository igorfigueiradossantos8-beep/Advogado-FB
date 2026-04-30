import { useEffect, useState } from "react";
import {
  financeiroAPI,
  criarFinanceiroAPI,
  editarFinanceiroAPI,
  deletarFinanceiroAPI,
  pagarFinanceiroAPI,
} from "../api";

export default function Financeiro({ usuario, avisar, categoria }) {
  const [itens, setItens] = useState([]);

  const [cliente, setCliente] = useState("");
  const [processo, setProcesso] = useState("");
  const [categoriaItem, setCategoriaItem] = useState("Outros");
  const [valorTotal, setValorTotal] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [vencimento, setVencimento] = useState("");
  const [donoEmail, setDonoEmail] = useState("");

  const [editandoId, setEditandoId] = useState(null);
  const [editForm, setEditForm] = useState({});

  const carregar = async () => {
    try {
      const res = await financeiroAPI();
      setItens(res.data);
    } catch {
      avisar("Erro ao carregar financeiro");
    }
  };

  useEffect(() => {
    carregar();
  }, []);

  const criar = async () => {
    try {
      await criarFinanceiroAPI({
        cliente,
        processo,
        categoria: categoriaItem,
        valor_total: Number(valorTotal || 0),
        valor_pago: Number(valorPago || 0),
        vencimento,
        status: "Pendente",
        email: donoEmail,
      });

      setCliente("");
      setProcesso("");
      setCategoriaItem("Outros");
      setValorTotal("");
      setValorPago("");
      setVencimento("");
      setDonoEmail("");

      avisar("Financeiro cadastrado");
      carregar();
    } catch {
      avisar("Erro ao cadastrar financeiro");
    }
  };

  const iniciarEdicao = (item) => {
    setEditandoId(item.id);
    setEditForm({
      cliente: item.cliente || "",
      processo: item.processo || "",
      categoria: item.categoria || "Outros",
      valor_total: item.valor_total || 0,
      valor_pago: item.valor_pago || 0,
      vencimento: item.vencimento || "",
      status: item.status || "Pendente",
      email: item.dono_email || "",
    });
  };

  const salvarEdicao = async (id) => {
    try {
      await editarFinanceiroAPI(id, editForm);
      avisar("Financeiro atualizado");
      setEditandoId(null);
      carregar();
    } catch {
      avisar("Erro ao editar financeiro");
    }
  };

  const adicionarPagamento = async (id) => {
    const valor = prompt("Quanto foi pago agora?");

    if (!valor) return;

    try {
      await pagarFinanceiroAPI(id, Number(valor));
      avisar("Pagamento adicionado");
      carregar();
    } catch {
      avisar("Erro ao adicionar pagamento");
    }
  };

  const excluir = async (id) => {
    try {
      await deletarFinanceiroAPI(id);
      avisar("Registro excluído");
      carregar();
    } catch {
      avisar("Apenas advogado pode excluir");
    }
  };

  const calcularRestante = (item) => {
    return Number(item.valor_total || 0) - Number(item.valor_pago || 0);
  };

  const calcularTempo = (vencimento) => {
    if (!vencimento) return "Sem vencimento";

    const hoje = new Date();
    const data = new Date(vencimento);
    const diff = Math.ceil((data - hoje) / (1000 * 60 * 60 * 24));

    if (diff > 0) return `Faltam ${diff} dia(s)`;
    if (diff === 0) return "Vence hoje";
    return `Atrasado há ${Math.abs(diff)} dia(s)`;
  };

  const itensFiltrados = categoria
    ? itens.filter((item) => (item.categoria || "Outros") === categoria)
    : itens;

  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Controle financeiro</span>
          <h1>Financeiro</h1>
          <p>Controle pagamentos, valores pendentes e vencimentos.</p>
        </div>
      </section>

      {usuario.tipo !== "cliente" && (
        <section className="form-card">
          <label>Cliente</label>
          <input
            className="input"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />

          <label>Processo</label>
          <input
            className="input"
            value={processo}
            onChange={(e) => setProcesso(e.target.value)}
          />

          <label>Categoria / pasta</label>
          <input
            className="input"
            placeholder="Ex: Trabalhista, Criminal, Família..."
            value={categoriaItem}
            onChange={(e) => setCategoriaItem(e.target.value)}
          />

          <label>Valor total</label>
          <input
            className="input"
            type="number"
            value={valorTotal}
            onChange={(e) => setValorTotal(e.target.value)}
          />

          <label>Valor pago</label>
          <input
            className="input"
            type="number"
            value={valorPago}
            onChange={(e) => setValorPago(e.target.value)}
          />

          <label>Vencimento</label>
          <input
            className="input"
            type="date"
            value={vencimento}
            onChange={(e) => setVencimento(e.target.value)}
          />

          <label>Email do cliente dono</label>
          <input
            className="input"
            value={donoEmail}
            onChange={(e) => setDonoEmail(e.target.value)}
          />

          <button className="button create-btn" onClick={criar}>
            Cadastrar financeiro
          </button>
        </section>
      )}

      <section className="process-grid">
        {itensFiltrados.map((item) => (
          <div className="process-card" key={item.id}>
            {editandoId === item.id ? (
              <div className="edit-box">
                <label>Cliente</label>
                <input
                  className="input"
                  value={editForm.cliente}
                  onChange={(e) =>
                    setEditForm({ ...editForm, cliente: e.target.value })
                  }
                />

                <label>Processo</label>
                <input
                  className="input"
                  value={editForm.processo}
                  onChange={(e) =>
                    setEditForm({ ...editForm, processo: e.target.value })
                  }
                />

                <label>Categoria</label>
                <input
                  className="input"
                  value={editForm.categoria}
                  onChange={(e) =>
                    setEditForm({ ...editForm, categoria: e.target.value })
                  }
                />

                <label>Valor total</label>
                <input
                  className="input"
                  type="number"
                  value={editForm.valor_total}
                  onChange={(e) =>
                    setEditForm({ ...editForm, valor_total: e.target.value })
                  }
                />

                <label>Valor pago</label>
                <input
                  className="input"
                  type="number"
                  value={editForm.valor_pago}
                  onChange={(e) =>
                    setEditForm({ ...editForm, valor_pago: e.target.value })
                  }
                />

                <label>Vencimento</label>
                <input
                  className="input"
                  type="date"
                  value={editForm.vencimento}
                  onChange={(e) =>
                    setEditForm({ ...editForm, vencimento: e.target.value })
                  }
                />

                <label>Email do cliente</label>
                <input
                  className="input"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />

                <div className="process-actions">
                  <button className="edit-btn" onClick={() => salvarEdicao(item.id)}>
                    Salvar
                  </button>

                  <button
                    className="danger-btn"
                    onClick={() => setEditandoId(null)}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="process-top">
                  <span className="status-badge">{item.status}</span>
                  <span className="category-badge">
                    📁 {item.categoria || "Outros"}
                  </span>
                  <small>ID #{item.id}</small>
                </div>

                <h3>{item.cliente}</h3>
                <p className="process-desc">{item.processo}</p>

                <div className="process-meta">
                  <span>
                    💰 Total: R$ {Number(item.valor_total || 0).toFixed(2)}
                  </span>
                  <span>
                    ✅ Pago: R$ {Number(item.valor_pago || 0).toFixed(2)}
                  </span>
                  <span>
                    ❌ Deve: R$ {calcularRestante(item).toFixed(2)}
                  </span>
                  <span>📅 Vencimento: {item.vencimento}</span>
                  <span>⏳ {calcularTempo(item.vencimento)}</span>
                  <span>👤 Cliente: {item.dono_email}</span>
                </div>

                {usuario.tipo !== "cliente" && (
                  <div className="process-actions">
                    <button
                      className="edit-btn"
                      onClick={() => adicionarPagamento(item.id)}
                    >
                      Adicionar pagamento
                    </button>

                    <button
                      className="edit-btn"
                      onClick={() => iniciarEdicao(item)}
                    >
                      Editar
                    </button>

                    {usuario.tipo === "advogado" && (
                      <button
                        className="danger-btn"
                        onClick={() => excluir(item.id)}
                      >
                        Excluir
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}