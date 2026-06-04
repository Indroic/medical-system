import typer
if not hasattr(typer, 'clear'):
    setattr(typer, 'clear', lambda: None)
from async_typer import AsyncTyper
print("SUCCESS!")
