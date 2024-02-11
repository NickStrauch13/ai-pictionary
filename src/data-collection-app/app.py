from flask import Flask, render_template, request
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

if __name__ == '__main__':
    app.run(debug=True)
