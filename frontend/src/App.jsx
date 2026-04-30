import { useEffect, useState } from "react";
import "./styles.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Processos from "./pages/Processos";
import NovoProcesso from "./pages/NovoProcesso";
import Clientes from "./pages/Clientes";
import Financeiro from "./pages/Financeiro";
import Agenda from "./pages/Agenda";

import Sidebar from "./components/Sidebar";
import Toast from "./components/Toast";

import {
  perfilAPI,
  processosAPI,
  deletarProcessoAPI,
  editarProcessoAPI,
} from "./api";

export default function App() {
  const [logado, setLogado] = useState(!!localStorage.getItem("token"));
  const [usuario, setUsuario] = useState(null);
  const [processos, setProcessos] = useState([]);
  const [tela, setTela] = useState("dashboard");
  const [toast, setToast] = useState("");
  const [categoria, setCategoria] = useState("");

  const avisar = (texto) => {
    setToast(texto);
    setTimeout(() => setToast(""), 2500);
  };

  const sair = () => {
    localStorage.clear();
    setLogado(false);
    setUsuario(null);
    setProcessos([]);
  };

  const carregarPerfil = async () => {
    try {
      const res = await perfilAPI();
      setUsuario(res.data);
    } catch {
      sair();
    }
  };

  const carregarProcessos = async () => {
    try {
      const res = await processosAPI();
      setProcessos(res.data);
    } catch {
      avisar("Erro ao carregar processos");
    }
  };

  const deletar = async (id) => {
    const confirmar = window.confirm("Tem certeza que deseja excluir?");
    if (!confirmar) return;

    try {
      await deletarProcessoAPI(id);
      avisar("Processo excluído");
      carregarProcessos();
    } catch {
      avisar("Você não tem permissão");
    }
  };

  const editar = async (id, dados) => {
    try {
      await editarProcessoAPI(id, dados);
      avisar("Processo atualizado");
      carregarProcessos();
    } catch {
      avisar("Erro ao editar");
    }
  };

  useEffect(() => {
    if (logado) {
      carregarPerfil();
      carregarProcessos();
    }
  }, [logado]);

  const processosFiltrados = categoria
    ? processos.filter((p) => (p.categoria || "Outros") === categoria)
    : processos;

  if (!logado) {
    return <Login setLogado={setLogado} />;
  }

  if (!usuario) {
    return <div className="container">Carregando...</div>;
  }

  return (
    <div className="app-layout">
      <Sidebar usuario={usuario} setTela={setTela} sair={sair} />

      <main className="main-content">
        {/* 🔥 FILTRO DE CATEGORIAS */}
        <div className="filtro-categorias">
          <button onClick={() => setCategoria("")}>Todas</button>

          {[...new Set(processos.map((p) => p.categoria || "Outros"))].map(
            (cat) => (
              <button key={cat} onClick={() => setCategoria(cat)}>
                {cat}
              </button>
            )
          )}
        </div>

        {tela === "dashboard" && (
          <Dashboard
            avisar={avisar}
            processos={processosFiltrados}
            categoria={categoria}
          />
        )}

        {tela === "processos" && (
          <Processos
            processos={processosFiltrados}
            usuario={usuario}
            deletar={deletar}
            editar={editar}
          />
        )}

        {tela === "novo" && (
          <NovoProcesso
            carregarProcessos={carregarProcessos}
            setTela={setTela}
            avisar={avisar}
          />
        )}

        {tela === "clientes" && (
          <Clientes usuario={usuario} avisar={avisar} />
        )}

        {tela === "financeiro" && (
          <Financeiro
            usuario={usuario}
            avisar={avisar}
            categoria={categoria}
          />
        )}

        {tela === "agenda" && (
          <Agenda usuario={usuario} avisar={avisar} />
        )}
      </main>

      <Toast texto={toast} />
    </div>
  );
}