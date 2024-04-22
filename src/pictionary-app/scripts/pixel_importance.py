import torch
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Set the backend before importing pyplot
import matplotlib.pyplot as plt
from torchvision import transforms
from PIL import Image
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def save_n_pixel_importance_images(model, image, target_class, image_transform, n=10) -> list:
    """
    Save n images, each showing progressively more important pixels for the target class.

    Args:
        model: The model to be used for prediction
        image: The UNNORMALIZED image to be used for prediction. Shape: (3, H, W)
        target_class: The numerical class representation for the image
        image_transform: The transformations to be applied to the image
        n: The number of images to be saved

    Returns:
        filenames: List of filenames for the saved images
    """
    important_pixels = find_important_pixels(model, image, target_class, image_transform, num_pixel_groups=n)
    # Convert PIL image to numpy array and get image size
    image = np.array(image)
    image_size = image.shape[:2]
    filenames = []
    for i in range(n):
        important_pixel_groups = important_pixels[:i+1]
        curr_filename = f'./static/images/important_pixels_{i+1}.png'
        plot_important_pixels_only(image, important_pixel_groups, image_size, filename=curr_filename, highlight=True)
        filenames.append(curr_filename)
    return filenames


def find_important_pixels(model, image, target_class, image_transform, num_pixel_groups=20, k=16) -> list:
    """
    Find the most important pixels in the image for the target class.
    For each pixel grouping, remove those pixels and check the change in the prediction score.

    Args:
        model: The model to be used for prediction
        image: The UNNORMALIZED image to be used for prediction. Shape: (3, H, W)
        target_class: The numerical class representation for the image
        image_transform: The transformations to be applied to the image
        num_pixel_groups: The number of important pixel groups to be returned
        k: The pixel grouping size (k x k pixels will be checked in each iteration)
    
    Returns:
        pixel_groups: List of the most important pixels
    """
    with torch.no_grad():
        to_tensor = transforms.ToTensor()
        image = to_tensor(image).unsqueeze(0).to(DEVICE)
        # Find the prediction score for the original image
        output = model(image)
        og_score = output[0][target_class].item()

        pixel_groups = []
        # Iterate across the image with step size k
        for i in range(0, image.shape[2], k):
            for j in range(0, image.shape[3], k):
                # Create a copy of the image
                image_copy = image.clone()
                # Remove the pixel group and normalize the image
                image_copy[:, :, i:i+k, j:j+k] = 1
                image_copy = image_transform(image_copy)
                # Get the prediction score
                output = model(image_copy)
                score_diff = og_score - output[0][target_class].item()
                # Append the pixel group and the score to the list
                pixel_groups.append((i, j, score_diff, k))

        # Sort the pixel groups by the score difference
        pixel_groups = sorted(pixel_groups, key=lambda x: x[2], reverse=True)
        return pixel_groups[:num_pixel_groups]


def plot_important_pixels_only(original_image, important_pixel_groups, image_size, filename, highlight=True):
    """
    Plot an image showing only the most important pixel groups, setting all other pixels to white.

    Args:
        original_image: The original image as a PIL Image.
        important_pixel_groups: A list of tuples representing the most important pixel groups.
                                Each tuple contains (i, j, score_diff, k), where (i, j) is the top-left
                                pixel of the group, score_diff is the difference in prediction score,
                                and k is the group size.
        image_size: A tuple (width, height) specifying the size of the original image.
        filename: The filename to save the image as.
        highlight: Whether to highlight the background of the important pixels.
    """
    # Initialize a blank white image
    new_image_array = np.ones((image_size[1], image_size[0], 3), dtype=np.uint8) * 255
    original_image = np.array(original_image)

    # Process each important pixel group
    for group in important_pixel_groups:
        i, j, _, k = group
        # Loop over each pixel in the pixel group and set it in the new image
        for dx in range(k):
            for dy in range(k):
                # Make sure we don't go out of bounds
                if i+dx < image_size[1] and j+dy < image_size[0]:
                    if highlight and original_image[i+dx, j+dy].all() == 1:
                        new_image_array[i+dx, j+dy] = 240
                    else:
                        new_image_array[i+dx, j+dy] = original_image[i+dx, j+dy]

    # Convert the array back to an image
    new_image = Image.fromarray(new_image_array)
    
    # Display the image
    plt.figure(figsize=(5, 5))
    plt.imshow(new_image)
    plt.axis('off') 
    plt.savefig(filename)
    plt.clf()
    plt.close()
