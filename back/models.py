from sqlalchemy import Column, ForeignKey, Integer, String, Text, Date, Boolean
from sqlalchemy.orm import relationship
from database import Base

class USUARIO(Base):
    __tablename__ = "USUARIO"

    ID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre_usuario = Column(String(255), nullable=False)
    contrasenia = Column(String(255), nullable=False)  
    imagen_perfil = Column(Text, default="default_profile_image.png")
    is_active = Column(Boolean, default=True) 
    email = Column(String(255), unique=True, index=True, nullable=False)  
    is_superuser = Column(Boolean, default=False)  
    tareas = relationship("TAREA", back_populates="usuario")

class CATEGORIA(Base):
    __tablename__ = "CATEGORIA"

    ID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    description = Column(Text)
    tareas = relationship("TAREA", back_populates="categoria")

class TAREA(Base):
    __tablename__ = "TAREA"

    ID = Column(Integer, primary_key=True, index=True, autoincrement=True)
    texto_tarea = Column(Text, nullable=False)
    fecha_creacion = Column(Date, nullable=False)
    fecha_tentativa_finalizacion = Column(Date)
    estado = Column(String(50), nullable=False)

    ID_Usuario = Column(Integer, ForeignKey("USUARIO.ID", ondelete="CASCADE"), nullable=False)
    ID_Categoria = Column(Integer, ForeignKey("CATEGORIA.ID", ondelete="SET NULL"))

    usuario = relationship("USUARIO", back_populates="tareas")
    categoria = relationship("CATEGORIA", back_populates="tareas")