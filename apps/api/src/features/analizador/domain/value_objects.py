from dataclasses import dataclass


@dataclass(frozen=True, slots=True)
class CoordenadasBBox:
    x_min: float
    y_min: float
    x_max: float
    y_max: float

    @property
    def area(self) -> float:
        return max(0.0, self.x_max - self.x_min) * max(0.0, self.y_max - self.y_min)


@dataclass(frozen=True, slots=True)
class Hallazgo:
    """Value Object inmutable. Representa una detección individual del modelo."""
    etiqueta: str
    confianza: float   # 0.0 – 1.0
    bbox: CoordenadasBBox
    image_index: int = 0
    # Dimensiones en píxeles de la imagen ORIGINAL sobre la que se calculó el
    # bbox. Son imprescindibles para dibujarlo: el visor muestra una versión
    # redimensionada por imgproxy, así que sin conocer el tamaño original no se
    # puede convertir el bbox al espacio de la imagen mostrada.
    # 0 = desconocido (hallazgos guardados antes de añadir estos campos).
    img_width: int = 0
    img_height: int = 0

    def es_critico(self) -> bool:
        return self.etiqueta in {"tumor", "hemorragia", "isquemia"}
