import axios from "axios";

export const API = "https://advogado-fb.onrender.com";

const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export const loginAPI = (email, senha) =>
  api.post("/login", { email, senha });

export const cadastrarAPI = (email, senha, tipo) =>
  api.post("/usuarios", { email, senha, tipo });

export const perfilAPI = () => api.get("/me");

export const processosAPI = () => api.get("/processos");

export const criarProcessoAPI = (dados) =>
  api.post("/processos", dados);

export const editarProcessoAPI = (id, dados) =>
  api.put(`/processos/${id}`, dados);

export const deletarProcessoAPI = (id) =>
  api.delete(`/processos/${id}`);

export const uploadPDF = (id, arquivo) => {
  const formData = new FormData();
  formData.append("arquivo", arquivo);

  return api.post(`/processos/${id}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const clientesAPI = () => api.get("/clientes");

export const criarClienteAPI = (dados) =>
  api.post("/clientes", {
    nome: dados.nome,
    email_cliente: dados.email,
    telefone: dados.telefone,
    cpf_cnpj: dados.cpf,
    observacoes: dados.obs,
  });

export const deletarClienteAPI = (id) =>
  api.delete(`/clientes/${id}`);

export const financeiroAPI = () => api.get("/financeiro");

export const criarFinanceiroAPI = (dados) =>
  api.post("/financeiro", {
    cliente: dados.cliente,
    processo: dados.processo,
    valor_total: Number(dados.valor_total || 0),
    valor_pago: Number(dados.valor_pago || 0),
    vencimento: dados.vencimento,
    status: dados.status || "Pendente",
    dono_email: dados.email || dados.dono_email,
    categoria: dados.categoria || "Outros",
  });

export const editarFinanceiroAPI = (id, dados) =>
  api.put(`/financeiro/${id}`, {
    cliente: dados.cliente,
    processo: dados.processo,
    valor_total: Number(dados.valor_total || 0),
    valor_pago: Number(dados.valor_pago || 0),
    vencimento: dados.vencimento,
    status: dados.status || "Pendente",
    dono_email: dados.email || dados.dono_email,
    categoria: dados.categoria || "Outros",
  });

export const pagarFinanceiroAPI = (id, valor) =>
  api.put(`/financeiro/${id}/pagar`, { valor: Number(valor) });

export const deletarFinanceiroAPI = (id) =>
  api.delete(`/financeiro/${id}`);

export const agendaAPI = () => api.get("/agenda");

export const criarAgendaAPI = (dados) =>
  api.post("/agenda", {
    titulo: dados.titulo,
    tipo: dados.tipo,
    data_inicio: dados.inicio,
    data_fim: dados.fim,
    processo: dados.processo,
    observacoes: dados.obs,
  });

export const deletarAgendaAPI = (id) =>
  api.delete(`/agenda/${id}`);

export default api;