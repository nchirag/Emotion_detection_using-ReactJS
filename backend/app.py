from flask import Flask, request, jsonify
from deepface import DeepFace
from io import BytesIO
import base64
from PIL import Image
import numpy as np
from textblob import TextBlob 
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

@app.route("/get_suggestions", methods=["POST"])
def get_suggestions():
    try:
        # Get the emotion data from the frontend
        data = request.get_json()
        emotion_data = data["emotion_data"]

        # Analyze the emotion data and generate suggestions
        suggestions = analyze_emotion_data(emotion_data)

        return jsonify({"suggestions": suggestions})
    except Exception as e:
        return jsonify({"error": str(e)})

def analyze_emotion_data(emotion_data):
    suggestions = []

    # Calculate the most frequent emotion
    most_frequent_emotion = max(emotion_data, key=lambda x: x["count"])["emotion"]

    # Generate suggestions based on the most frequent emotion
    if most_frequent_emotion == "happy":
        suggestions.append("You seem to be in a positive mood! Keep up the good vibes.")
    elif most_frequent_emotion == "sad":
        suggestions.append("It looks like you're feeling down. Try listening to uplifting music or talking to a friend.")
    elif most_frequent_emotion == "angry":
        suggestions.append("You seem to be feeling angry. Take a deep breath and try to relax.")
    elif most_frequent_emotion == "surprise":
        suggestions.append("You seem surprised! Embrace the unexpected and enjoy the moment.")
    elif most_frequent_emotion == "fear":
        suggestions.append("It looks like you're feeling fearful. Try focusing on positive thoughts and taking small steps to overcome your fears.")
    elif most_frequent_emotion == "neutral":
        suggestions.append("You seem to be in a neutral state. Try engaging in an activity that excites you.")

    # Use TextBlob for sentiment analysis
    sentiment_text = " ".join(suggestions)
    blob = TextBlob(sentiment_text)
    sentiment_score = blob.sentiment.polarity

    if sentiment_score > 0:
        suggestions.append("Overall, your emotions seem positive. Keep it up!")
    elif sentiment_score < 0:
        suggestions.append("Overall, your emotions seem negative. Try to focus on the bright side.")
    else:
        suggestions.append("Overall, your emotions seem balanced. Maintain this equilibrium.")

    return suggestions

if __name__ == "__main__":
    app.run(debug=True)