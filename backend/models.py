from sqlalchemy import Column, Integer, String, DateTime, Float
from database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    senha = Column(String)
    tipo = Column(String)


class Processo(Base):
    __tablename__ = "processos"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String)
    descricao = Column(String)
    status = Column(String)
    categoria = Column(String, default="Outros")
    dono_email = Column(String)
    arquivo = Column(String, nullable=True)
    data_criacao = Column(DateTime)
    data_atualizacao = Column(DateTime)


class Cliente(Base):
    __tablename__ = "clientes"

    id = Column(Integer, primary_key=True, index=True)
    nome = Column(String)
    email = Column(String)
    telefone = Column(String)
    cpf_cnpj = Column(String)
    observacoes = Column(String)


class Financeiro(Base):
    __tablename__ = "financeiro"

    id = Column(Integer, primary_key=True, index=True)
    cliente = Column(String)
    processo = Column(String)
    categoria = Column(String, default="Outros")
    valor_total = Column(Float, default=0)
    valor_pago = Column(Float, default=0)
    vencimento = Column(String)
    status = Column(String)
    dono_email = Column(String)


class Agenda(Base):
    __tablename__ = "agenda"

    id = Column(Integer, primary_key=True, index=True)
    titulo = Column(String)
    tipo = Column(String)
    data_inicio = Column(String)
    data_fim = Column(String)
    processo = Column(String)
    observacoes = Column(String)