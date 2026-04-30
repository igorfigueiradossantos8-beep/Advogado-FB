from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from datetime import datetime
import os

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
def criar_usuario(email: str, senha: str, tipo: str, db: Session = Depends(get_db)):
    if tipo not in ["advogado", "secretario", "cliente"]:
        raise HTTPException(status_code=400, detail="Tipo inválido")

    existe = db.query(models.Usuario).filter(models.Usuario.email == email).first()
    if existe:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    usuario = models.Usuario(
        email=email,
        senha=hash_senha(senha),
        tipo=tipo
    )

    db.add(usuario)
    db.commit()
    db.refresh(usuario)

    return {"msg": "Usuário criado"}


@app.post("/login")
def login(email: str, senha: str, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == email).first()

    if not usuario:
        raise HTTPException(status_code=400, detail="Usuário não encontrado")

    if not verificar_senha(senha, usuario.senha):
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
    titulo: str,
    descricao: str,
    status: str,
    categoria: str = "Outros",
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)

    processo = models.Processo(
        titulo=titulo,
        descricao=descricao,
        status=status,
        categoria=categoria,
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
    titulo: str,
    descricao: str,
    status: str,
    categoria: str = "Outros",
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    processo = db.query(models.Processo).filter(models.Processo.id == id).first()

    if not processo:
        raise HTTPException(status_code=404, detail="Processo não encontrado")

    if usuario.tipo not in ["advogado", "secretario"] and processo.dono_email != usuario.email:
        raise HTTPException(status_code=403, detail="Sem permissão")

    processo.titulo = titulo
    processo.descricao = descricao
    processo.status = status
    processo.categoria = categoria
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
    nome: str,
    email_cliente: str,
    telefone: str,
    cpf_cnpj: str,
    observacoes: str,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    cliente = models.Cliente(
        nome=nome,
        email=email_cliente,
        telefone=telefone,
        cpf_cnpj=cpf_cnpj,
        observacoes=observacoes
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
    cliente: str,
    processo: str,
    valor_total: float,
    valor_pago: float,
    vencimento: str,
    status: str,
    dono_email: str,
    categoria: str = "Outros",
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    status_auto = calcular_status_financeiro(valor_total, valor_pago)

    item = models.Financeiro(
        cliente=cliente,
        processo=processo,
        categoria=categoria,
        valor_total=valor_total,
        valor_pago=valor_pago,
        vencimento=vencimento,
        status=status_auto,
        dono_email=dono_email
    )

    db.add(item)
    db.commit()
    db.refresh(item)

    return item


@app.put("/financeiro/{id}")
def editar_financeiro(
    id: int,
    cliente: str,
    processo: str,
    valor_total: float,
    valor_pago: float,
    vencimento: str,
    status: str,
    dono_email: str,
    categoria: str = "Outros",
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    item = db.query(models.Financeiro).filter(models.Financeiro.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")

    item.cliente = cliente
    item.processo = processo
    item.categoria = categoria
    item.valor_total = valor_total
    item.valor_pago = valor_pago
    item.vencimento = vencimento
    item.status = calcular_status_financeiro(valor_total, valor_pago)
    item.dono_email = dono_email

    db.commit()
    db.refresh(item)

    return item


@app.put("/financeiro/{id}/pagar")
def pagar_financeiro(
    id: int,
    valor: float,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    item = db.query(models.Financeiro).filter(models.Financeiro.id == id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Registro financeiro não encontrado")

    item.valor_pago = (item.valor_pago or 0) + valor
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
    titulo: str,
    tipo: str,
    data_inicio: str,
    data_fim: str,
    processo: str,
    observacoes: str,
    email: str = Depends(get_usuario_logado),
    db: Session = Depends(get_db)
):
    usuario = get_usuario_obj(email, db)
    exigir_equipe(usuario)

    item = models.Agenda(
        titulo=titulo,
        tipo=tipo,
        data_inicio=data_inicio,
        data_fim=data_fim,
        processo=processo,
        observacoes=observacoes
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