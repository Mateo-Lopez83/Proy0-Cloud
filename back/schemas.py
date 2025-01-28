from pydantic import BaseModel, EmailStr

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
