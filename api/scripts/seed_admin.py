import asyncio

from sqlalchemy import select

from app.core.config import settings
from app.core.security import hash_password
from app.db.session import AsyncSessionLocal
from app.models.user import User, UserRole
from app.services.auth_service import normalize_email


async def seed_admin() -> None:
    async with AsyncSessionLocal() as db:
        existing_admin = await db.scalar(select(User.id).where(User.role == UserRole.ADMIN).limit(1))
        if existing_admin is not None:
            print("Admin seed skipped: an admin already exists")
            return

        admin = User(
            name=settings.admin_name.strip(),
            email=normalize_email(str(settings.admin_email)),
            password_hash=hash_password(settings.admin_password),
            role=UserRole.ADMIN,
        )
        db.add(admin)
        await db.commit()
        print(f"Admin created: {admin.email}")


if __name__ == "__main__":
    asyncio.run(seed_admin())
