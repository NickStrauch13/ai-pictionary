from src.main import func


def test_func():
    assert func(3) == 4
    assert func(4) == 5
    assert func(-1) == 0
