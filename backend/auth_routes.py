from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from .database import get_db
from .models import User, UserRole, Institution
from .schemas import InstitutionRegister, TokenResponse
from .auth import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username.lower().strip()).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(status_code=400, detail="User account is inactive")

    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value, "user_id": user.id}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role.value,
        "institution_id": user.institution_id,
        "institution_name": user.institution.name if user.institution else None
    }

@router.post("/register-institution")
def register_institution(payload: InstitutionRegister, db: Session = Depends(get_db)):
    # Check existing user
    existing_user = db.query(User).filter(User.email == payload.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email is already registered")

    # Check existing institution aicte_id
    existing_inst = db.query(Institution).filter(Institution.aicte_id == payload.aicte_id.strip()).first()
    if existing_inst:
        raise HTTPException(status_code=400, detail="Institution AICTE Permanent ID already registered")

    # Create institution record
    new_inst = Institution(
        aicte_id=payload.aicte_id.strip(),
        name=payload.institution_name.strip(),
        category=payload.category,
        region=payload.region,
        state=payload.state,
        address=payload.address,
        contact_email=payload.email,
        contact_phone=payload.contact_phone,
        head_of_institution=payload.head_of_institution,
        established_year=payload.established_year,
        created_at=datetime.utcnow()
    )
    db.add(new_inst)
    db.flush()

    # Create institution user
    hashed_pwd = get_password_hash(payload.password)
    new_user = User(
        email=payload.email.lower().strip(),
        hashed_password=hashed_pwd,
        full_name=payload.full_name.strip(),
        role=UserRole.INSTITUTION_USER,
        institution_id=new_inst.id,
        is_active=True,
        created_at=datetime.utcnow()
    )
    db.add(new_user)
    db.commit()

    return {"message": "Institution registered successfully. You may now log in to the Institution Portal."}

@router.get("/me")
def get_current_user_profile(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "role": current_user.role.value,
        "institution_id": current_user.institution_id,
        "institution_name": current_user.institution.name if current_user.institution else None,
        "aicte_id": current_user.institution.aicte_id if current_user.institution else None
    }

