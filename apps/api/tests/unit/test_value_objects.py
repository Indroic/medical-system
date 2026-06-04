from src.features.analizador.domain.value_objects import CoordenadasBBox, Hallazgo


def test_coordenadas_bbox_area():
    bbox = CoordenadasBBox(x_min=10.0, y_min=10.0, x_max=20.0, y_max=30.0)
    # width = 10, height = 20 -> area = 200
    assert bbox.area == 200.0


def test_coordenadas_bbox_area_invalida():
    bbox = CoordenadasBBox(x_min=20.0, y_min=30.0, x_max=10.0, y_max=10.0)
    # Si las coordenadas están invertidas, el área no debe ser negativa
    assert bbox.area == 0.0


def test_hallazgo_es_critico():
    critico = Hallazgo("tumor", 0.99, CoordenadasBBox(0,0,1,1))
    no_critico = Hallazgo("tejido_sano", 0.99, CoordenadasBBox(0,0,1,1))
    
    assert critico.es_critico() is True
    assert no_critico.es_critico() is False
