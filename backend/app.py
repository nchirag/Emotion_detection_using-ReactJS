from flask import Flask, request, jsonify
from deepface import DeepFace
from io import BytesIO
import base64
from PIL import Image
import numpy as np

from flask_cors import CORS

app = Flask(__name__)
CORS(app)
@app.route("/analyze", methods=["POST"])
def analyze():
    try:
        # Get the image from the frontend
        data = request.get_json()
        image_data = data['image']
        
        # Remove the prefix "data:image/jpeg;base64,"
        image_data = image_data.split(",")[1]
        
        # Decode the base64 image data
        img_bytes = base64.b64decode(image_data)
        img = Image.open(BytesIO(img_bytes))
        
        # Convert to array
        img_array = np.array(img)
        
        # Use DeepFace for emotion recognition
        result = DeepFace.analyze(img_array, actions=["emotion"])
        
        # Get the detected emotion
        detected_emotion = result[0]["dominant_emotion"]
        
        return jsonify({"emotion": detected_emotion})
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True)
