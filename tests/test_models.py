import torch
from src.model.resnet18 import CustomResNet18
from src.model.resnet50 import CustomResNet50
from src.model.svm import create_svm_dataset, train_svm


def test_resnet18_model():
    """
    Verify that the CustomResNet18 model can be instantiated
    and has the custom classifier appended with the correct number of output features.
    """
    model = CustomResNet18()
    assert model is not None
    assert model.model.fc.out_features == 10


def test_resnet50_model():
    """
    Verify that the CustomResNet50 model can be instantiated
    and has the custom classifier appended with the correct number of output features.
    """
    model = CustomResNet50()
    assert model is not None
    assert model.model.fc.out_features == 10


def test_resnet18_forward():
    """
    Verify that the forward pass of the CustomResNet18 model is successful.
    """
    model = CustomResNet18()
    input_tensor = torch.randn(1, 3, 128, 128)
    output = model(input_tensor)
    assert output is not None


def test_resnet50_forward():
    """
    Verify that the forward pass of the CustomResNet50 model is successful.
    """
    model = CustomResNet50()
    input_tensor = torch.randn(1, 3, 128, 128)
    output = model(input_tensor)
    assert output is not None


def test_svm_dataset():
    """
    Verify that the SVM dataset can be created and the data is split correctly.
    """
    X_train, X_test, y_train, y_test = create_svm_dataset(data_root_dir="data", image_size=(128, 128))
    assert X_train is not None
    assert X_test is not None
    assert y_train is not None
    assert y_test is not None


def test_svm_model():
    """
    Verify that the SVM model can be trained on the given data.
    """
    X_train, X_test, y_train, y_test = create_svm_dataset(data_root_dir="./data", image_size=(128, 128))
    model = train_svm(X_train, y_train)
    assert model is not None