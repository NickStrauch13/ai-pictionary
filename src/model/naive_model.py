import json
import torch
from torchvision import transforms
import numpy as np
from collections import Counter
from PIL import Image
from data_processing import get_dataloaders


def color_classifier(image: Image, colormap_path: str = "colormap.json") -> int:
    """
    Classify an image based on its dominant color.
    
    Args:
    - image: A PIL Image object.
    - colormap_path: The path to the json file that contains the dominant color for each class.
    
    Returns:
    - label: The predicted label for the image.
    """
    # Load the json file that contains the dominant color for each class
    with open(colormap_path, "r") as f:
        rgb_color_classes = json.load(f)
    # The keys are strings of tuples, convert them to actual tuples
    rgb_color_classes = {tuple(eval(k)): v for k, v in rgb_color_classes.items()}
    # rgb_color_classes = {(131, 0, 131): [2], (255, 0, 0): [4, 6], (0, 0, 0): [0, 1, 3, 5, 7], (0, 83, 0): [8], (0, 0, 255): [9]}

    # Get the dominant color of the image
    dominant_rgb_color = get_dominant_color(image)
    
    # Find the closest dominant color in the dictionary. If there are multiple labels for the color, random selection.
    min_distance = np.inf
    label = None
    for rgb_color, labels in rgb_color_classes.items():
        distance = np.linalg.norm(np.array(rgb_color) - np.array(dominant_rgb_color))
        if distance < min_distance:
            min_distance = distance
            label = labels
    if len(label) > 1:
        label = np.random.choice(label)
    else:
        label = label[0]
    return label


def get_dominant_color(image):
    """
    Get the dominant color in an image.
    
    Args:
    - image: A PIL Image object.
    
    Returns:
    - dominant_color: A tuple representing the RGB values of the dominant color.
    """
    # Get the RGB values of all pixels
    pixels = np.array(image)
    pixels = pixels.reshape(-1, 3)
    
    # Count the frequency of each color
    counter = Counter(map(tuple, pixels))
    
    # Get the second most common color (most common is the background)
    try:
        dominant_color = counter.most_common(2)[1][0]
    except IndexError:
        # If the image is blank
        dominant_color = counter.most_common(1)[0][0]
    
    return dominant_color


def unnormalize_image(image):
    """
    Unnormalize an image tensor and convert to pil image
    
    Args:
    - image: A tensor of shape (C, H, W).
    
    Returns:
    - image_unnorm: A PIL Image object, unormalized.
    """
    pil_transform = transforms.ToPILImage()
    mean = torch.tensor([0.485, 0.456, 0.406]).view(3, 1, 1)
    std = torch.tensor([0.229, 0.224, 0.225]).view(3, 1, 1)
    image_unnorm = image * std + mean
    image_unnorm = image_unnorm.clip(0, 1)
    image_unnorm = pil_transform(image_unnorm)
    return image_unnorm


def create_color_classifier_json(train_loader, output_path="colormap.json"):
    """
    Create the json file that contains the dominant color for each class in the training data.

    Args:
    - train_loader: A DataLoader object for the training data.
    - output_path: The path to save the json file.
    """
    dominant_colors = {}
    # Get the dominant color for each class
    for images, labels in train_loader:
        for i in range(len(images)):
            image = images[i]
            label = labels[i].item()
            
            # Unnormalize the image
            mean = torch.tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
            std = torch.tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)
            image_unnorm = image * std + mean
            image_unnorm = image_unnorm.clip(0, 1) 
            
            image_unnorm = transforms.ToPILImage()(image_unnorm[0])
            dominant_color = get_dominant_color(image_unnorm)
            if label not in dominant_colors:
                dominant_colors[label] = {dominant_color: 1}
            else:
                if dominant_color not in dominant_colors[label]:
                    dominant_colors[label][dominant_color] = 1
                else:
                    dominant_colors[label][dominant_color] += 1

    # Get the most common color for each class
    final_dict = {}
    for label, colors in dominant_colors.items():
        most_common_color = str(max(colors, key=colors.get))
        if most_common_color not in final_dict:
            final_dict[most_common_color] = [label]
        else:
            final_dict[most_common_color].append(label)

    with open(output_path, "w") as f:
        json.dump(final_dict, f)

    
if __name__ == "__main__":
    # Example usage
    train_loader, val_loader, test_loader = get_dataloaders(data_root_dir="../../data", batch_size=1)
    create_color_classifier_json(train_loader)
    for images, labels in test_loader:
        image = images[0]
        label = labels[0].item()
        image_unnorm = unnormalize_image(image)
        predicted_label = color_classifier(image_unnorm)
        print(f"True label: {label}, Predicted label: {predicted_label}")
        break