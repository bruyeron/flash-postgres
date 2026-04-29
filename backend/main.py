"""
Flash Production API - Backend FastAPI (Optimisé & Production Ready)
"""

from contextlib import asynccontextmanager
import time

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from database import Base, engine, SessionLocal
from models import db_models  # noqa: F401

import services.auth_service as auth_svc

from routers import auth, csv, comments, manual


# ─────────────────────────────────────────────
# DB WAIT HELPER (CRITIQUE DOCKER)
# ─────────────────────────────────────────────

def wait_for_db(engine, retries=10, delay=2):
    """
    Attend que PostgreSQL soit prêt avant d'exécuter create_all()
    """
    for i in range(retries):
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
                print("✅ Database connected")
                return
        except OperationalError:
            print(f"⏳ Database not ready ({i+1}/{retries})")
            time.sleep(delay)

    raise Exception("❌ Database unreachable after retries")


# ─────────────────────────────────────────────
# LIFESPAN (STARTUP / SHUTDOWN)
# ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):

    print("🚀 Starting Flash API...")

    # 1. Attendre DB
    wait_for_db(engine)

    # 2. Créer tables
    Base.metadata.create_all(bind=engine)
    print("📦 Database schema ready")

    # 3. Bootstrap admin
    db = SessionLocal()
    try:
        auth_svc.bootstrap_admin(db)
        print("👤 Admin bootstrap complete")
    except Exception as e:
        print(f"⚠️ Bootstrap warning: {e}")
    finally:
        db.close()

    print("✅ Backend initialized successfully")

    yield

    print("🛑 Shutting down API...")


# ─────────────────────────────────────────────
# FASTAPI APP
# ─────────────────────────────────────────────

app = FastAPI(
    title="Flash Production API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)


# ─────────────────────────────────────────────
# CORS CONFIG (PROD READY)
# ─────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://10.160.33.137:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# ROUTES
# ─────────────────────────────────────────────

app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(csv.router, prefix="/api/csv", tags=["CSV"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(manual.router, prefix="/api/manual", tags=["Manual"])


# ─────────────────────────────────────────────
# HEALTHCHECK API
# ─────────────────────────────────────────────

@app.get("/api/health")
def health():
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        return {
            "status": "ok",
            "database": "connected",
            "api": "running"
        }
    except Exception as e:
        return {
            "status": "error",
            "database": str(e)
        }
    finally:
        db.close()