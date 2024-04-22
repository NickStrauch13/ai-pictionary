import torch
import math
import matplotlib
matplotlib.use('Agg')  # Set the backend before importing pyplot
import matplotlib.pyplot as plt


def create_feature_map_plot(model, img, layer_name="layer1", filepath='./static/images/feature_maps.png', k=10) -> None:
    """
    Create a plot of the feature maps of a specific layer in a PyTorch model.
    
    Args:
        model: PyTorch model
        img: torch tensor, already preprocessed by input transform
        layer_name: The layer name in the model to get the feature maps from. 
        filepath: Filepath to save the plot
        k: Number of feature map channels to display
    """
    feature_maps = get_feature_maps(model, img, layer_name)
    show_k_feature_map_channels(feature_maps[0], filepath, k)


def get_feature_maps(model, img, layer_name="layer1") -> list:
    """
    Get the feature maps of a specific layer in a PyTorch model.

    Args:
        model: PyTorch model
        img: torch tensor, already preprocessed by input transform
        layer_name: The layer name in the model to get the feature maps from

    Returns:
        feature_maps: List of feature maps
    """
    feature_maps = []
    def hook_fn(module, input, output):
        feature_maps.append(output)
    for name, layer in model.named_modules():
        if name == layer_name:
            layer.register_forward_hook(hook_fn)
    with torch.no_grad():
        model(img)
    return feature_maps


def show_k_feature_map_channels(feature_map, filepath='./static/images/feature_maps.png', k=10) -> None:
    """
    Display the first k feature map channels in a grid.
    
    Args:
        feature_map: List of feature maps
        filepath: Filepath to save the plot
        k: Number of feature map channels to display
    """
    # Calculate rows and columns for subplots
    num_columns = min(k, 5)  
    num_rows = math.ceil(k / num_columns)
    # Adjust figsize based on rows and columns for better visibility
    fig_width = num_columns * 4  
    fig_height = num_rows * 3.2  
    fig, ax = plt.subplots(num_rows, num_columns, figsize=(fig_width, fig_height))
    # Flatten the axes array for easier iteration if there are multiple axes
    ax_flat = ax.flat if k > 1 else [ax]
    # Display the first k feature map channels
    for i in range(k):
        # Handle case where k=1 and ax is not an array
        current_ax = ax_flat[i] if k > 1 else ax
        # Plot the feature map
        current_ax.imshow(feature_map[0, i].cpu().numpy(), cmap="viridis")
        current_ax.axis('off')  # Hide axes ticks
    for j in range(i + 1, num_rows * num_columns):
        fig.delaxes(ax_flat[j])
    plt.tight_layout()
    plt.savefig(filepath)
    plt.clf()
    plt.close()
