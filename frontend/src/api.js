import axios from "axios";

export const API = "https://advogado-fb.onrender.com";

const api = axios.create({
  baseURL: API,
});

// 🔐 Token automático
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// ================= LOGIN =================

export const loginAPI = (email, senha) =>
  api.post(`/login?email=${encodeURIComponent(email)}&senha=${encodeURIComponent(senha)}`);

export const perfilAPI = () => api.get("/me");

// ================= PROCESSOS =================

export const processosAPI = () => api.get("/processos");

export const criarProcessoAPI = (dados) =>
  api.post(
    `/processos?titulo=${encodeURIComponent(dados.titulo)}&descricao=${encodeURIComponent(dados.descricao)}&status=${encodeURIComponent(dados.status)}&categoria=${encodeURIComponent(dados.categoria || "Outros")}`
  );

export const editarProcessoAPI = (id, dados) =>
  api.put(
    `/processos/${id}?titulo=${encodeURIComponent(dados.titulo)}&descricao=${encodeURIComponent(dados.descricao)}&status=${encodeURIComponent(dados.status)}&categoria=${encodeURIComponent(dados.categoria || "Outros")}`
  );

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

// ================= CLIENTES =================

export const clientesAPI = () => api.get("/clientes");

export const criarClienteAPI = (dados) =>
  api.post(
    `/clientes?nome=${encodeURIComponent(dados.nome)}&email_cliente=${encodeURIComponent(dados.email)}&telefone=${encodeURIComponent(dados.telefone)}&cpf_cnpj=${encodeURIComponent(dados.cpf)}&observacoes=${encodeURIComponent(dados.obs)}`
  );

export const deletarClienteAPI = (id) =>
  api.delete(`/clientes/${id}`);

// ================= FINANCEIRO =================

export const financeiroAPI = () => api.get("/financeiro");

export const criarFinanceiroAPI = (dados) =>
  api.post(
    `/financeiro?cliente=${encodeURIComponent(dados.cliente)}&processo=${encodeURIComponent(dados.processo)}&valor_total=${dados.valor_total}&valor_pago=${dados.valor_pago}&vencimento=${dados.vencimento}&status=Pendente&dono_email=${encodeURIComponent(dados.email)}&categoria=${encodeURIComponent(dados.categoria || "Outros")}`
  );

export const editarFinanceiroAPI = (id, dados) =>
  api.put(
    `/financeiro/${id}?cliente=${encodeURIComponent(dados.cliente)}&processo=${encodeURIComponent(dados.processo)}&valor_total=${dados.valor_total}&valor_pago=${dados.valor_pago}&vencimento=${dados.vencimento}&status=${encodeURIComponent(dados.status || "Pendente")}&dono_email=${encodeURIComponent(dados.email)}&categoria=${encodeURIComponent(dados.categoria || "Outros")}`
  );

export const pagarFinanceiroAPI = (id, valor) =>
  api.put(`/financeiro/${id}/pagar?valor=${valor}`);

export const deletarFinanceiroAPI = (id) =>
  api.delete(`/financeiro/${id}`);

// ================= AGENDA =================

export const agendaAPI = () => api.get("/agenda");

export const criarAgendaAPI = (dados) =>
  api.post(
    `/agenda?titulo=${encodeURIComponent(dados.titulo)}&tipo=${encodeURIComponent(dados.tipo)}&data_inicio=${dados.inicio}&data_fim=${dados.fim}&processo=${encodeURIComponent(dados.processo)}&observacoes=${encodeURIComponent(dados.obs)}`
  );

export const deletarAgendaAPI = (id) =>
  api.delete(`/agenda/${id}`);

export default api;