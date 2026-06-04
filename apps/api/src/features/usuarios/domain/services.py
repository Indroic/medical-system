import hashlib
import hmac

from hexcore.domain.services import BaseDomainService

from .entities import User
from .exceptions import InvalidCredentialsException, UserAlreadyExistsException
from .repositories import IUserRepository


def _hash_password(password: str) -> str:
    """Hash SHA-256 simple. En producción usar bcrypt/argon2."""
    return hashlib.sha256(password.encode()).hexdigest()


def _verify_password(plain: str, hashed: str) -> bool:
    return hmac.compare_digest(_hash_password(plain), hashed)


class AuthService(BaseDomainService):
    def __init__(self, user_repo: IUserRepository) -> None:
        self._user_repo = user_repo
        super().__init__()

    async def registrar_usuario(
        self, email: str, password: str, nombre: str, rol: str = "medico"
    ) -> User:
        existente = await self._user_repo.get_by_email(email)
        if existente is not None:
            raise UserAlreadyExistsException(email)

        user = User(
            email=email,
            hashed_password=_hash_password(password),
            nombre=nombre,
            rol=rol,
        )
        user.registrar()  # emite UserRegistradoEvent
        await self._user_repo.save(user)
        return user

    async def autenticar(self, email: str, password: str) -> User:
        user = await self._user_repo.get_by_email(email)
        if user is None or not _verify_password(password, user.hashed_password):
            raise InvalidCredentialsException()
        return user
