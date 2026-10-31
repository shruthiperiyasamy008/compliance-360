from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base, SessionLocal
from .seed import seed_database
from .auth_routes import router as auth_router
from .routes import router as core_router
from .scheduler import monitor_worker

# Create tables for all models
Base.metadata.create_all(bind=engine)

# Seed realistic demo data
with SessionLocal() as db:
    seed_database(db)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Launch scheduled in-process monitoring thread
    monitor_worker.start()
    yield
    # Shutdown
    monitor_worker.stop()

app = FastAPI(
    title="ComplianceTwin 360 API",
    description="Integrated AICTE Approval Workflow, Alert Intelligence and AI Decision Support System",
    version="2.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(core_router)

@app.get("/")
def root():
    return {
        "system": "ComplianceTwin 360",
        "description": "Integrated AICTE Approval Workflow, Compliance Monitoring and Alert Management System",
        "status": "OPERATIONAL",
        "version": "2.0.0-AI-Alerts"
    }
