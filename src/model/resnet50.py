import torch
from torchvision import models
import numpy as np
from collections import OrderedDict
from data_processing import get_dataloaders
from train_model import train_model
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"


class CustomResNet50(torch.nn.Module):
    """
    Define a ResNet50 model with a custom classifier.
    Freeze the pre-trained weights.
    """
    def __init__(self):
        super(CustomResNet50, self).__init__()
        # Load in model pre-trained on ImageNet
        self.model = models.resnet50(weights="DEFAULT")
        # Freeze parameters
        for param in self.model.parameters():
            param.requires_grad = False
        # Add custom classifier
        classifier = torch.nn.Sequential(OrderedDict([
            ('fc1', torch.nn.Linear(2048, 512)),
            ('relu', torch.nn.ReLU()),
            ('fc2', torch.nn.Linear(512, 10)),
            ('output', torch.nn.Softmax(dim=1))
        ]))
        self.model.fc = classifier
        self.model = self.model.to(DEVICE)
    
    def forward(self, x):
        return self.model(x)


def main():
    """
    Instantiate the CustomResNet50 model and train it.
    """
    # Instantiate model
    model = CustomResNet50()
    # Setup dataloaders
    train_loader, val_loader, test_loader = get_dataloaders("../../data/")
    # Train model
    train_losses, val_losses = train_model(model, train_loader, val_loader, device=DEVICE)
    # Save model
    torch.save(model.state_dict(), "../../saved_models/resnet50.pth")


if __name__ == "__main__":
    main()