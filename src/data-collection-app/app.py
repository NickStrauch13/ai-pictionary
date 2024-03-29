from flask import Flask, render_template, request, jsonify
import boto3
from botocore.exceptions import NoCredentialsError
import base64
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/save', methods=['POST'])
def save():
    img_data = request.form['imgData']
    img_data = base64.b64decode(img_data.split(',')[1])
    
    # Specify the path to save the image
    img_path = 'saved_images/drawing.png'
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(img_path), exist_ok=True)
    
    with open(img_path, 'wb') as f:
        f.write(img_data)
    
    return 'Drawing saved successfully', 200


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