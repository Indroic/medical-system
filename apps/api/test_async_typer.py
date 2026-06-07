import typer

if not hasattr(typer, 'clear'):
    setattr(typer, 'clear', lambda: None)
print("SUCCESS!")
