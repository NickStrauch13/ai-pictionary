from flask import Flask, render_template, request, jsonify
import boto3
from botocore.exceptions import NoCredentialsError
import base64
import os
from io import BytesIO
from PIL import Image
import torch
from scripts.setup_model import load_model


app = Flask(__name__)
label_map = {"Airplane": 0, "Bicycle": 1, "Butterfly": 2, "Car": 3, "Flower": 4, "House": 5, "Ladybug": 6, "Train": 7, "Tree": 8, "Whale": 9}
model, device, input_transform = load_model()


@app.route('/')
def index():
    return render_template('index.html')


@app.route('/predict', methods=['POST'])
def predict():
    # Extract the image data from the request
    data = request.json
    image_data = data.get('image')
    subject = data.get('sketchsubject')
    # Decode and prepare the base64-encoded image data
    image_data = base64.b64decode(image_data)
    image = Image.open(BytesIO(image_data)).convert("RGB")
    image = input_transform(image).unsqueeze(0).to(device)
    # Perform inference
    with torch.no_grad():
        output = model(image)
    # Get the predicted class
    _, predicted = torch.max(output, 1)
    # print all classes and their scores
    classes_and_scores = {}
    for i, (key, value) in enumerate(label_map.items()):
        classes_and_scores[key] = output[0][i].item()
    predicted_class = list(label_map.keys())[list(label_map.values()).index(predicted.item())]
    return jsonify({'predicted_class': predicted_class, 'target': subject, 'all_predictions': classes_and_scores})
    # ...



@app.route('/generate-presigned-url', methods=['POST'])
def generate_presigned_url():
    # Extract filename from the request
    data = request.json
    filename = data.get('filename')
    subject = data.get('sketchsubject')
    
    try:
        s3_client = boto3.client('s3')
        presigned_url = s3_client.generate_presigned_url('put_object',
                                                         Params={'Bucket': 'ai-pictionary-data',
                                                                 'Key': f"{subject}/{filename}",
                                                                 'ContentType': 'image/png'},
                                                         ExpiresIn=3600)
        return jsonify({'url': presigned_url})
    except NoCredentialsError:
        return jsonify({'error': 'Credentials not available'}), 403


if __name__ == '__main__':
    app.run(debug=True)

# Things to add:
    # unkown class
    # "helpful tips": "Hint: The object of the game is to score as many points as possible." "Hint: Make your drawings better." 