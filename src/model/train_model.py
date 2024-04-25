import torch
import numpy as np


def train_model(model: torch.nn.Module, 
          train_loader: torch.utils.data.DataLoader, 
          val_loader: torch.utils.data.DataLoader, 
          lr: float = 0.001,
          epochs: int = 100, 
          device: str ='cpu', 
          best_model_path: str = "../../saved_models/best_model.pth"):
    """
    Training loop used to train the ResNet18 and ResNet50 models.

    Args:
    - model: The model to train.
    - lr: The learning rate to use.
    - epochs: The number of epochs to train for.
    - device: The device to use for training.
    - best_model_path: The path to save the best model. Used for early stopping.

    Returns:
    - train_losses: List of training losses for each epoch.
    - val_losses: List of validation losses for each epoch.
    """
    # Setup optimizer and loss function
    optimizer = torch.optim.Adam(model.fc.parameters(), lr=lr)
    criterion = torch.nn.CrossEntropyLoss()
    
    best_model = model.state_dict()
    best_val_loss = np.inf
    train_losses = []
    val_losses = []
    # Training
    for epoch in range(epochs):
        model.train()
        train_loss = 0
        for images, labels in train_loader:
            images, labels = images.to(device), labels.to(device)
            optimizer.zero_grad()
            output = model(images)
            loss = criterion(output, labels)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        train_loss = train_loss / len(train_loader)
        train_losses.append(train_loss)
        print(f"Epoch {epoch+1} Training Loss: {train_loss}")

        # Validation
        model.eval()
        val_loss = 0
        accuracy = 0
        with torch.no_grad():
            for images, labels in val_loader:
                images, labels = images.to(device), labels.to(device)
                output = model(images)
                loss = criterion(output, labels)
                val_loss += loss.item()

                ps = torch.exp(output)
                _, top_class = ps.topk(1, dim=1)
                equals = top_class == labels.view(*top_class.shape)
                accuracy += torch.mean(equals.type(torch.FloatTensor)).item()

        val_loss = val_loss / len(val_loader)
        accuracy = accuracy / len(val_loader)
        val_losses.append(val_loss)
        print(f"Epoch {epoch+1} Validation Loss: {val_loss} Accuracy: {accuracy}")

        if val_loss < best_val_loss:
            best_val_loss = val_loss
            best_model = model.state_dict()
            print("Saving new best model...")
            torch.save(best_model, best_model_path)

    return train_losses, val_losses
