class UserNotFoundException(Exception):
    def __init__(self, identifier: str = "") -> None:
        super().__init__(f"Usuario no encontrado: {identifier}")


class InvalidCredentialsException(Exception):
    def __init__(self) -> None:
        super().__init__("Credenciales inválidas.")


class UserAlreadyExistsException(Exception):
    def __init__(self, email: str) -> None:
        super().__init__(f"Ya existe un usuario registrado con el email: {email}")
