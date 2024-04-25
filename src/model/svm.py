import cv2
import os
import numpy as np
from typing import Tuple
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.svm import SVC
from joblib import dump


def create_svm_dataset(data_root_dir: str = "../../data/", image_size: tuple = (128, 128)) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    """
    Create a dataset for training the SVM model.

    Args:
    - data_root_dir: The root directory containing the image folders.
    - image_size: The size to resize the images to.

    Returns:
    - X_train: The scaled training data.
    - X_test: The scaled test data.
    - y_train: The training labels.
    - y_test: The test labels.
    """
    # Load the image data and set labels
    categories = os.listdir(data_root_dir)
    labels = []
    images = []
    for category in categories:
        category_path = os.path.join(data_root_dir, category)
        for image_name in os.listdir(category_path):
            image_path = os.path.join(category_path, image_name)
            image = cv2.imread(image_path, cv2.IMREAD_COLOR)
            image = cv2.resize(image, image_size)
            images.append(image.flatten())
            labels.append(categories.index(category))
    # Create numpy arrays
    X = np.array(images)
    y = np.array(labels)
    # Make train-test splits
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=0)
    # Scale the data
    scaler = StandardScaler()
    X_train = scaler.fit_transform(X_train)
    X_test = scaler.transform(X_test)
    return X_train, X_test, y_train, y_test


def train_svm(X_train: np.ndarray, y_train: np.ndarray) -> SVC:
    """
    Train an SVM model on the given data.

    Args:
    - X_train: The scaled training data.
    - y_train: The training labels.

    Returns:
    - model: The trained SVM model.
    """
    model = SVC(kernel='linear')
    model.fit(X_train, y_train)
    return model


def main():
    """
    Train an SVM model on the image data and save it.
    """
    X_train, X_test, y_train, y_test = create_svm_dataset()
    model = train_svm(X_train, y_train)
    dump(model, '../../saved_models/svm_model.joblib')


if __name__ == "__main__":
    main()
