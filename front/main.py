from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Annotated
import sys
sys.path.append('./back')
import models
import database
from sqlalchemy.orm import Session


app = FastAPI()
models.Base.metadata.create_all(bind=database.engine)

def get_usuarios():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

class UsuarioResponse(BaseModel):
    ID: int
    nombre_usuario: str
    imagen_perfil: str

    class Config:
        from_attributes = True  # Enable ORM mode for Pydantic
@app.get("/", response_model=List[UsuarioResponse])
def get_all_usuarios(db: Session = Depends(get_usuarios)):
    usuarios = db.query(models.USUARIO).all()
    return usuarios

