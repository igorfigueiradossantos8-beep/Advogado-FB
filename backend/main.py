from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
import os
from schemas import (
    UsuarioCreate,
    LoginCreate,
    ProcessoCreate,
    ClienteCreate,
    FinanceiroCreate,
    PagamentoCreate,
    AgendaCreate,
)
from database import SessionLocal, engine
import models
from security import hash_senha, verificar_senha, criar_token, get_usuario_logado

models.Base.metadata.create_all(bind=engine)

app = FastAPI()

os.makedirs("uploads", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_usuario_obj(email: str, db: Session):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuário inválido")
    return usuario


def exigir_equipe(usuario):
    if usuario.tipo not in ["advogado", "secretario"]:
        raise HTTPException(status_code=403, detail="Sem permissão")


def calcular_status_financeiro(valor_total, valor_pago):
    valor_total = valor_total or 0
    valor_pago = valor_pago or 0

    if valor_pago <= 0:
        return "Pendente"

    if valor_pago < valor_total:
        return "Parcial"

    return "Pago"


@app.get("/")
def home():
    return {"msg": "Backend funcionando"}


@app.post("/usuarios")
def criar_usuario(dados: UsuarioCreate, db: Session = Depends(get_db)):
    if dados.tipo not in ["advogado", "secretario", "cliente"]:
        raise HTTPException(status_code=400, detail="Tipo inválido")

    existe = db.query(models.Usuario).filter(models.Usuario.email == dados.email).first()
    if existe:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    usuario = models.Usuario(
        email=dados.email,
        senha=hash_senha(dados.senha),
        tipo=dados.tipo
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return {"msg": "Usuário criado"}


@app.post("/login")
def login(dados: LoginCreate, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == dados.email).first()

    if not usuario:
        raise HTTPException(status_code=400, detail="Usuário não encontrado")

    if not verificar_senha(dados.senha, usuario.senha):
        raise HTTPException(status_code=400, detail="Senha incorreta")

    token = criar_token({"sub": usuario.email})

    return {
        "access_token": token,
        "email": usuario.email,
        "tipo": usuario.tipo
    }


@app.get("/me")
def me(email: str = Depends(get_usuario_logado), db: Session = Depends(get_db)):
    usuario = get_usuario_obj(email, db)
    return {"email": usuario.email, "tipo": usuario.tipo}


@app.get("/processos")
def listar_processos(email: str = Depends(get_usuario_logado), db: Session = Depends(get_db)):
    usuario = get_usuario_obj(email, db)

    if usuario.tipo in ["advogado", "secretario"]:
        return db.query(models.Processo).all()

    return db.query(models.Processo).filter(models.Processo.dono_email == usuario.email).all()


@app.post("/processos")
def criar_processo(
    dados: ProcessoCreate,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)

    processo = models.Processo(
        titulo=dados.titulo,
        descricao=dados.descricao,
        status=dados.status,
        categoria=dados.categoria,
        dono_email=usuario.email,
        data_criacao=datetime.utcnow(),
        data_atualizacao=datetime.utcnow()
    )

    db.add(processo)
    db.commit()
    db.refresh(processo)

    return processo


@app.put("/processos/{id}")
def editar_processo(
    id: int,
    dados: ProcessoCreate,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    processo = db.query(models.Processo).filter(models.Processo.id == id).first()

    if not processo:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    if usuario.tipo not in ["advogado", "secretario"] and processo.dono_email != usuario.email:
        raise HTTPException(status_code=403, detail="Sem permissão")

    processo.titulo = dados.titulo
    processo.descricao = dados.descricao
    processo.status = dados.status
    processo.categoria = dados.categoria
    processo.data_atualizacao = datetime.utcnow()

    db.commit()
    db.refresh(processo)

    return processo


@app.delete("/processos/{id}")
def deletar_processo(id: int, email: str = Depends(get_usuario_logado), db: Session = Depends(get_db)):
    usuario = get_usuario_obj(email, db)

    if usuario.tipo != "advogado":
        raise HTTPException(status_code=403, detail="Apenas advogado pode excluir")

    processo = db.query(models.Processo).filter(models.Processo.id == id).first()

    if not processo:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    db.delete(processo)
    db.commit()

    return {"msg": "Processo deletado"}


@app.post("/processos/{id}/upload")
def upload_documento(
    id: int,
    arquivo: UploadFile = File(...),
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    processo = db.query(models.Processo).filter(models.Processo.id == id).first()

    if not processo:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    if usuario.tipo not in ["advogado", "secretario"] and processo.dono_email != usuario.email:
        raise HTTPException(status_code=403, detail="Sem permissão")

    if not arquivo.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Apenas PDF permitido")

    caminho = f"uploads/processo_{id}_{arquivo.filename}"

    with open(caminho, "wb") as f:
        f.write(arquivo.file.read())

    processo.arquivo = caminho
    db.commit()

    return {"msg": "PDF enviado", "arquivo": caminho}


@app.get("/clientes")
def listar_clientes(email: str = Depends(get_usuario_logado), db: Session = Depends(get_db)):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    return db.query(models.Cliente).all()


@app.post("/clientes")
def criar_cliente(
    dados: ClienteCreate,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    cliente = models.Cliente(
        nome=dados.nome,
        email=dados.email_cliente,
        telefone=dados.telefone,
        cpf_cnpj=dados.cpf_cnpj,
        observacoes=dados.observacoes
    )

    db.add(cliente)
    db.commit()
    db.refresh(cliente)

    return cliente


@app.delete("/clientes/{id}")
def deletar_cliente(id: int, email: str = Depends(get_usuario_logado), db: Session = Depends(get_db)):
    usuario = get_usuario_obj(email, db)

    if usuario.tipo != "advogado":
        raise HTTPException(status_code=403, detail="Apenas advogado pode excluir cliente")

    cliente = db.query(models.Cliente).filter(models.Cliente.id == id).first()

    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")

    db.delete(cliente)
    db.commit()

    return {"msg": "Cliente deletado"}


@app.get("/financeiro")
def listar_financeiro(email: str = Depends(get_usuario_logado), db: Session = Depends(get_db)):
    usuario = get_usuario_obj(email, db)

    if usuario.tipo in ["advogado", "secretario"]:
        itens = db.query(models.Financeiro).all()
    else:
        itens = db.query(models.Financeiro).filter(models.Financeiro.dono_email == usuario.email).all()

    resposta = []

    for item in itens:
        falta = (item.valor_total or 0) - (item.valor_pago or 0)
        status_auto = calcular_status_financeiro(item.valor_total, item.valor_pago)

        resposta.append({
            "id": item.id,
            "cliente": item.cliente,
            "processo": item.processo,
            "categoria": item.categoria,
            "valor_total": item.valor_total or 0,
            "valor_pago": item.valor_pago or 0,
            "falta_pagar": falta,
            "vencimento": item.vencimento,
            "status": status_auto,
            "dono_email": item.dono_email
        })

    return resposta


@app.post("/financeiro")
def criar_financeiro(
    dados: FinanceiroCreate,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    item = models.Financeiro(
        cliente=dados.cliente,
        processo=dados.processo,
        categoria=dados.categoria,
        valor_total=dados.valor_total,
        valor_pago=dados.valor_pago,
        vencimento=dados.vencimento,
        status=calcular_status_financeiro(dados.valor_total, dados.valor_pago),
        dono_email=dados.dono_email
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@app.put("/financeiro/{id}")
def editar_financeiro(
    id: int,
    dados: FinanceiroCreate,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    item = db.query(models.Financeiro).filter(models.Financeiro.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")

    item.cliente = dados.cliente
    item.processo = dados.processo
    item.categoria = dados.categoria
    item.valor_total = dados.valor_total
    item.valor_pago = dados.valor_pago
    item.vencimento = dados.vencimento
    item.status = calcular_status_financeiro(dados.valor_total, dados.valor_pago)
    item.dono_email = dados.dono_email

    db.commit()
    db.refresh(item)

    return item


@app.put("/financeiro/{id}/pagar")
def pagar_financeiro(
    id: int,
    dados: PagamentoCreate,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    item = db.query(models.Financeiro).filter(models.Financeiro.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")

    item.valor_pago = (item.valor_pago or 0) + dados.valor
    item.status = calcular_status_financeiro(item.valor_total, item.valor_pago)

    db.commit()
    db.refresh(item)

    return item


@app.delete("/financeiro/{id}")
def deletar_financeiro(id: int, email: str = Depends(get_usuario_logado), db: Session = Depends(get_db)):
    usuario = get_usuario_obj(email, db)

    if usuario.tipo != "advogado":
        raise HTTPException(status_code=403, detail="Apenas advogado pode excluir")

    item = db.query(models.Financeiro).filter(models.Financeiro.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")

    db.delete(item)
    db.commit()

    return {"msg": "Registro financeiro deletado"}


@app.get("/agenda")
def listar_agenda(email: str = Depends(get_usuario_logado), db: Session = Depends(get_db)):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    return db.query(models.Agenda).all()


@app.post("/agenda")
def criar_agenda(
    dados: AgendaCreate,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    item = models.Agenda(
        titulo=dados.titulo,
        tipo=dados.tipo,
        data_inicio=dados.data_inicio,
        data_fim=dados.data_fim,
        processo=dados.processo,
        observacoes=dados.observacoes
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@app.delete("/agenda/{id}")
def deletar_agenda(id: int, email: str = Depends(get_usuario_logado), db: Session = Depends(get_db)):
    usuario = get_usuario_obj(email, db)

    if usuario.tipo != "advogado":
        raise HTTPException(status_code=403, detail="Apenas advogado pode excluir")

    item = db.query(models.Agenda).filter(models.Agenda.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Evento não encontrado")

    db.delete(item)
    db.commit()

    return {"msg": "Evento deletado"}