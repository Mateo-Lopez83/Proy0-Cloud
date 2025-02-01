from fastapi import FastAPI, HTTPException, Depends, status
from datetime import datetime, timedelta, timezone
import jwt
import uvicorn
from pydantic import BaseModel
from typing import List, Annotated, Optional
from passlib.context import CryptContext
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt.exceptions import InvalidTokenError
import models
import database
from sqlalchemy.orm import Session
from schemas import UserCreate, TareaCreate, TareaResponse, CategoriaCreate, CategoriaResponse
from fastapi.middleware.cors import CORSMiddleware



SECRET = "bfa81c42215983ed8de25989d8ffa6b25f68a28c4b46eba784a91ff06e5fa681"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30
#jwt_authentication = JWTAuthentication(secret=SECRET, lifetime_seconds=3600)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

app = FastAPI()


def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()
        
#Permitir solo al frontend mandar solicitudes
origins=[
    "http://localhost:5173"
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

#Modelos auxiliares para poder modelar los endpoints y lo de JWT

class UsuarioResponse(BaseModel):
    ID: int
    nombre_usuario: str
    imagen_perfil: str

    class Config:
        from_attributes = True  # Enable ORM mode for Pydantic

class UsuarioCreate(BaseModel):
    nombre_usuario: str
    contrasenia: str
    imagen_perfil: str = "default_profile_image.png" 
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class UserCreate(BaseModel):
    nombre_usuario: str
    email: str
    contrasenia: str

class UserResponse(BaseModel):
    ID: int
    nombre_usuario: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True


#No se si esto es necesario, solo un tutorial lo mencionaba
#(update 3 horas después) mierda mk si era necesaria JASJJASJSJJA
models.Base.metadata.create_all(bind=database.engine)

def check_contrasenia(c_plana, c_hash):
    return pwd_context.verify(c_plana, c_hash)

def get_hash_contrasenia(contrasenia):
    return pwd_context.hash(contrasenia)

def get_usuario(db: Session, username: str):
    return db.query(models.USUARIO).filter(models.USUARIO.nombre_usuario == username).first()

def verificar_user(db: Session, usuario: str, contrasenia: str):
    usuario = get_usuario(db, usuario)
    if not usuario:
        return False
    if not check_contrasenia(contrasenia, usuario.contrasenia):
        return False
    return usuario

def crear_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET, algorithm=ALGORITHM)
    return encoded_jwt




#obtener usuario de sesión
async def get_sesion_usuario(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: Session = Depends(get_db)
):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    
    user = get_usuario(db, username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(
    current_user: Annotated[models.USUARIO, Depends(get_sesion_usuario)]
):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

#Endpoint para crear un token
@app.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    user = verificar_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = crear_token(
        data={"sub": user.nombre_usuario}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/register", response_model=UserResponse)
async def register_user(
    user: UserCreate,
    db: Session = Depends(get_db)
):
    # Check if username already exists
    db_user = db.query(models.USUARIO).filter(models.USUARIO.nombre_usuario == user.nombre_usuario).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Oe loco este usuario ya existe")
    
    # Hash password
    hashed_password = get_hash_contrasenia(user.contrasenia)
    
    # Create new user
    new_user = models.USUARIO(
        nombre_usuario=user.nombre_usuario,
        email=user.email,
        contrasenia=hashed_password,
        is_active=True
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

# Protected Endpoints
@app.get("/users/me/", response_model=UserResponse)
async def read_users_me(
    current_user: Annotated[models.USUARIO, Depends(get_current_active_user)]
):
    return current_user

@app.get("/tareas/")
async def get_user_tareas(
    current_user: Annotated[models.USUARIO, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    tareas = db.query(models.TAREA).filter(models.TAREA.ID_Usuario == current_user.ID).all()
    return tareas

@app.get("/categorias/{c_id}")
async def get_tareas_por_categoria(
    c_id: int,
    db: Session = Depends(get_db)
):
   
    categoria = db.query(models.CATEGORIA).filter(models.CATEGORIA.ID == c_id).first()
    
    # If the category doesn't exist, return a 404 error
    if not categoria:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Category with ID {c_id} not found"
        )
    
   
    return categoria.nombre

@app.get("/categorias/")
async def get_user_tareas(
    db: Session = Depends(get_db)
):
    tareas = db.query(models.CATEGORIA).all()
    return tareas

@app.get("/")
async def root(db: Session = Depends(get_db)):
    try:
        # Fetch the first user from the USUARIO table
        user = db.query(models.USUARIO).first()
        
        # If no user exists, return a message
        if not user:
            return {"message": "Database is connected, but no users found."}
        
        # Return the user data
        return {
            "message": "Database connection is working!",
            "user": {
                "ID": user.ID,
                "nombre_usuario": user.nombre_usuario,
                "email": user.email,
            }
        }
    except Exception as e:
        # Handle any errors (e.g., database connection issues)
        raise HTTPException(
            status_code=500,
            detail=f"Error connecting to the database: {str(e)}"
        )


@app.post("/usuarios/", response_model=UsuarioResponse)
def create_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    db_usuario = models.USUARIO(
        nombre_usuario=usuario.nombre_usuario,
        contrasenia=usuario.contrasenia,
        imagen_perfil=usuario.imagen_perfil
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario

@app.post("/nuevaTarea/", response_model=TareaResponse)
async def create_tarea(
    tarea_data: TareaCreate,
    current_user: Annotated[models.USUARIO, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    # Create a new TAREA object with the current user's ID
    nueva_tarea = models.TAREA(
        texto_tarea = tarea_data.texto_tarea,
        fecha_creacion = datetime.now(timezone.utc),
        fecha_tentativa_finalizacion = tarea_data.fecha_tentativa_finalizacion,
        estado = tarea_data.estado,
        ID_Usuario = current_user.ID,  # Automatically set from the logged-in user
        ID_Categoria = tarea_data.ID_Categoria
    )
    
    # Add to database
    db.add(nueva_tarea)
    db.commit()
    db.refresh(nueva_tarea)
    
    return nueva_tarea

@app.post("/nuevaCategoria/", response_model=CategoriaResponse)
async def create_categoria(
    cat_data: CategoriaCreate,
    #current_user: Annotated[models.USUARIO, Depends(get_current_active_user)],
    db: Session = Depends(get_db)
):
    
    nueva_cat = models.CATEGORIA(
        nombre = cat_data.nombre,
        description = cat_data.description
    )
    db.add(nueva_cat)
    db.commit()
    db.refresh(nueva_cat)
    
    return nueva_cat

if __name__ == "__main__":
    uvicorn.run(app, host='0.0.0.0', port=8000)