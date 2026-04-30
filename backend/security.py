from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

SECRET_KEY = "segredo123"
ALGORITHM = "HS256"

auth_scheme = HTTPBearer()

def hash_senha(senha: str):
    return pwd_context.hash(senha)

def verificar_senha(senha: str, hash: str):
    return pwd_context.verify(senha, hash)

def criar_token(data: dict):
    dados = data.copy()
    dados["exp"] = datetime.utcnow() + timedelta(hours=1)
    return jwt.encode(dados, SECRET_KEY, algorithm=ALGORITHM)

def get_usuario_logado(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email = payload.get("sub")

        if email is None:
            raise HTTPException(status_code=401, detail="Token inválido")

        return email

    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")