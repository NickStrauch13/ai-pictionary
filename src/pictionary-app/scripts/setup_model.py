import torch
from torchvision import transforms, models
from collections import OrderedDict


def load_model():
    """
    Load the model and return it along with the device and input transform.

    Returns:
        model: torch model
        device: torch device
        base_transform: torchvision transform
    """
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    base_transform = transforms.Compose([
                    transforms.ToTensor(),
                    transforms.Normalize(
                        mean=[0.485, 0.456, 0.406],
                        std=[0.229, 0.224, 0.225])
                    ])
    model = models.resnet18(weights="DEFAULT")
    classifier = torch.nn.Sequential(OrderedDict([
        ('fc1', torch.nn.Linear(512, 256)),
        ('relu', torch.nn.ReLU()),
        ('fc2', torch.nn.Linear(256, 10)),
        ('output', torch.nn.Softmax(dim=1))
    ]))
    model.fc = classifier
    model = model.to(device)
    model.load_state_dict(torch.load("./models/TL_resnet18.pth", map_location=device))
    model.eval()
    return model, device, base_transform
