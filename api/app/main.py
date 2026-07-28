from fastapi import FastAPI

from app.routers.auth import router as auth_router
from app.routers.admin import router as admin_router
from app.routers.categories import router as categories_router
from app.routers.tasks import router as tasks_router

app = FastAPI(
    title="Task Tracker Lite API",
    version="0.1.0",
    docs_url="/docs",
    redoc_url=None,
)
app.include_router(auth_router)
app.include_router(categories_router)
app.include_router(tasks_router)
app.include_router(admin_router)


@app.get("/health", tags=["system"])
async def health() -> dict[str, str]:
    return {"status": "ok"}
