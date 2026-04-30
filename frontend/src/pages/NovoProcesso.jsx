import { useState } from "react";
import { criarProcessoAPI, uploadPDF } from "../api";

export default function NovoProcesso({ carregarProcessos, setTela, avisar }) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("Em andamento");
  const [categoria, setCategoria] = useState("Trabalhista");
  const [arquivo, setArquivo] = useState(null);
  const [loading, setLoading] = useState(false);

  const criar = async () => {
    if (!titulo.trim()) {
      avisar("Digite um título");
      return;
    }

    setLoading(true);

    try {
      const res = await criarProcessoAPI({
        titulo,
        descricao,
        status,
        categoria,
      });

      const id = res.data.id;

      if (arquivo) {
        if (arquivo.type !== "application/pdf") {
          avisar("Envie apenas PDF");
        } else {
          await uploadPDF(id, arquivo);
        }
      }

      avisar("Processo criado com sucesso ✅");

      setTitulo("");
      setDescricao("");
      setStatus("Em andamento");
      setCategoria("Trabalhista");
      setArquivo(null);

      await carregarProcessos();
      setTela("processos");
    } catch (err) {
      console.error(err);
      avisar("Erro ao criar processo ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <section className="page-hero">
        <div>
          <span className="eyebrow">Novo cadastro</span>
          <h1>Novo Processo</h1>
          <p>Cadastre um novo processo jurídico no sistema.</p>
        </div>
      </section>

      <section className="form-card">
        <label>Título</label>
        <input
          className="input"
          placeholder="Ex: Processo Trabalhista"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
        />

        <label>Descrição</label>
        <textarea
          className="input textarea"
          placeholder="Detalhes do processo"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
        />

        <label>Status</label>
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

        <label>Categoria / pasta</label>
        <input
          className="input"
          placeholder="Ex: Trabalhista, Criminal, Cível, Família..."
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        />

        <label>Arquivo PDF (opcional)</label>
        <input
          className="input"
          type="file"
          accept="application/pdf"
          onChange={(e) => setArquivo(e.target.files[0])}
        />

        <button className="button create-btn" onClick={criar} disabled={loading}>
          {loading ? "Criando..." : "Criar Processo"}
        </button>
      </section>
    </div>
  );
}