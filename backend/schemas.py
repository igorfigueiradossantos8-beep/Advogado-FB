from pydantic import BaseModel


class UsuarioCreate(BaseModel):
    email: str
    senha: str
    tipo: str


class LoginCreate(BaseModel):
    email: str
    senha: str


class ProcessoCreate(BaseModel):
    titulo: str
    descricao: str
    status: str
    categoria: str = "Outros"


class ClienteCreate(BaseModel):
    nome: str
    email_cliente: str
    telefone: str
    cpf_cnpj: str
    observacoes: str


class FinanceiroCreate(BaseModel):
    cliente: str
    processo: str
    valor_total: float
    valor_pago: float
    vencimento: str
    status: str = "Pendente"
    dono_email: str
    categoria: str = "Outros"


class PagamentoCreate(BaseModel):
    valor: float


class AgendaCreate(BaseModel):
    titulo: str
    tipo: str
    data_inicio: str
    data_fim: str
    processo: str
    observacoes: str