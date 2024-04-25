import os
import torch
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
from PIL import Image
from sklearn.model_selection import train_test_split


class CustomImageFolderDataset(Dataset):
    def __init__(self, image_paths, extra_transforms=True):
        """
        Custom dataset for loading images from a folder structure.
        Applies a base transform for train, val, and test sets.
        Applies extra transforms for training/val when specified.
        """
        self.base_transform = transforms.Compose([
                            transforms.ToTensor(),
                            transforms.Normalize(
                                mean=[0.485, 0.456, 0.406],
                                std=[0.229, 0.224, 0.225])
                            ])
        self.images = image_paths
        self.extra_transforms = extra_transforms
        self.label_map = {"Airplane": 0, "Bicycle": 1, "Butterfly": 2, "Car": 3, "Flower": 4, "House": 5, "Ladybug": 6, "Train": 7, "Tree": 8, "Whale": 9}

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        img_path = self.images[idx]
        image = Image.open(img_path).convert("RGB")
        images = []
        # Apply base transform
        images.append(self.base_transform(image))
        # Horizontal flip
        if self.extra_transforms:
            images.append(self.base_transform(transforms.functional.hflip(image)))
        # Random rotation
        if self.extra_transforms:
            rotation_transform = transforms.RandomRotation((-30,30), fill=(255, 255, 255))
            images.append(self.base_transform(rotation_transform(image)))
        # Random Translation
        if self.extra_transforms:
            translation_transform = transforms.RandomAffine(0, translate=(0.2, 0.2), scale=(0.6, 1.4), fill=(255, 255, 255))
            images.append(self.base_transform(translation_transform(image)))
        # Assuming the folder names represent the labels, extract label from the file path
        label = img_path.split(os.sep)[-2]
        label = self.label_map[label]
        return images, label
    

def custom_collate_fn(batch):
    """
    Custom collate function to combine multiple images into a single batch tensor.
    
    Args:
    - batch: List of tuples (images, label), where 'images' is a list of 4 transformed images.
    
    Returns:
    - images_tensor: A tensor containing all images stacked together.
    - labels_tensor: A tensor containing all labels, repeated for each image transformation.
    """
    images_list = []
    labels_list = []
    for images, label in batch:
        # Stack all 4 images together, adding an extra dimension for 'stacking'
        images_stack = torch.stack(images, dim=0)
        images_list.append(images_stack)
        # Repeat the label 4 times to match the number of images
        labels_list.extend([label] * len(images))
    # Concatenate all images and labels from the batch together
    images_tensor = torch.cat(images_list, dim=0)
    labels_tensor = torch.tensor(labels_list)
    
    return images_tensor, labels_tensor


def get_dataloaders(data_root_dir: str, batch_size: int = 8):
    """
    Get the dataloaders for the train, val, and test sets.

    Args:
    - data_root_dir: The root directory containing the image folders.
    - batch_size: The batch size to use for the dataloaders.

    Returns:
    - train_loader: DataLoader for the training set.
    - val_loader: DataLoader for the validation set.
    - test_loader: DataLoader for the test set.
    """
    # Collect imagefolder data paths
    all_image_paths = [os.path.join(dp, f) for dp, dn, filenames in os.walk(data_root_dir) for f in filenames if os.path.splitext(f)[1].lower() in ['.png', '.jpg', '.jpeg']]
    train_image_paths, test_image_paths = train_test_split(all_image_paths, test_size=0.1)
    train_image_paths, val_image_paths = train_test_split(train_image_paths, test_size=0.1)
    # Create datasets
    train_dataset = CustomImageFolderDataset(train_image_paths, extra_transforms=True)
    val_dataset = CustomImageFolderDataset(val_image_paths, extra_transforms=True)
    test_dataset = CustomImageFolderDataset(test_image_paths, extra_transforms=False)
    # Create dataloaders
    train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True, num_workers=0, collate_fn=custom_collate_fn)
    val_loader = DataLoader(val_dataset, batch_size=1, shuffle=True, num_workers=0, collate_fn=custom_collate_fn)
    test_loader = DataLoader(test_dataset, batch_size=1, shuffle=False, num_workers=0, collate_fn=custom_collate_fn)
    return train_loader, val_loader, test_loader

