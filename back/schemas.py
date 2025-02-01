from pydantic import BaseModel, EmailStr
from datetime import date
from typing import Optional
class UserBase(BaseModel):
    email: EmailStr
    nombre_usuario: str

class UserCreate(UserBase):
    password: str

class UserUpdate(UserBase):
    contrasenia: str

class UserDB(UserBase):
    ID: int
    is_active: bool
    is_superuser: bool

    class Config:
        orm_mode = True

class TareaCreate(BaseModel):
    texto_tarea: str
    fecha_tentativa_finalizacion: Optional[date] = None
    estado: str  # e.g., "pendiente", "en progreso", "completada"
    ID_Categoria: Optional[int] = None

class TareaResponse(BaseModel):
    ID: int
    texto_tarea: str
    fecha_creacion: date
    fecha_tentativa_finalizacion: Optional[date] = None
    estado: str
    ID_Usuario: int
    ID_Categoria: Optional[int] = None

    class Config:
        from_attributes = True 

class CategoriaCreate(BaseModel):
    nombre: str
    description: str 
    

class CategoriaResponse(BaseModel):
    ID: int
    nombre: str
    description: str 