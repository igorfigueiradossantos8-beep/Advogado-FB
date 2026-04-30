import { useEffect, useState } from "react";
import { clientesAPI, criarClienteAPI, deletarClienteAPI } from "../api";

export default function Clientes({ usuario, avisar }) {
  const [clientes, setClientes] = useState([]);

  const [nome, setNome] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [telefone, setTelefone] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const carregarClientes = async () => {
    try {
      const res = await clientesAPI();
      setClientes(res.data);
    } catch {
      avisar("Sem permissão para ver clientes");
    }
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const criarCliente = async () => {
    try {
      await criarClienteAPI({
        nome,
        email_cliente: emailCliente,
        telefone,
        cpf_cnpj: cpfCnpj,
        observacoes,
      });

      setNome("");
      setEmailCliente("");
      setTelefone("");
      setCpfCnpj("");
      setObservacoes("");

      avisar("Cliente cadastrado");
      carregarClientes();
    } catch {
      avisar("Erro ao cadastrar cliente");
    }
  };

  const deletarCliente = async (id) => {
    try {
      await deletarClienteAPI(id);
      avisar("Cliente excluído");
      carregarClientes();
    } catch {
      avisar("Apenas advogado pode excluir clientes");
    }
  };

  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Gestão de clientes</span>
          <h1>Clientes</h1>
          <p>Cadastre clientes para organizar o escritório no dia a dia.</p>
        </div>
      </section>

      <section className="form-card">
        <label>Nome completo</label>
        <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} />

        <label>Email</label>
        <input className="input" value={emailCliente} onChange={(e) => setEmailCliente(e.target.value)} />

        <label>Telefone</label>
        <input className="input" value={telefone} onChange={(e) => setTelefone(e.target.value)} />

        <label>CPF/CNPJ</label>
        <input className="input" value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} />

        <label>Observações</label>
        <textarea className="input textarea" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />

        <button className="button create-btn" onClick={criarCliente}>
          Cadastrar Cliente
        </button>
      </section>

      <section className="process-grid">
        {clientes.map((c) => (
          <div className="process-card" key={c.id}>
            <div className="process-top">
              <span className="status-badge em-andamento">Cliente</span>
              <small>ID #{c.id}</small>
            </div>

            <h3>{c.nome}</h3>
            <p className="process-desc">{c.observacoes}</p>

            <div className="process-meta">
              <span>📧 {c.email}</span>
              <span>📞 {c.telefone}</span>
              <span>🪪 {c.cpf_cnpj}</span>
            </div>

            {usuario.tipo === "advogado" && (
              <div className="process-actions">
                <button className="danger-btn" onClick={() => deletarCliente(c.id)}>
                  Excluir Cliente
                </button>
              </div>
            )}
          </div>
        ))}
      </section>
    </div>
  );
}