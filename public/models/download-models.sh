#!/bin/bash

# Download face-api.js models
echo "Downloading face-api.js models..."

# Base URL for the models
BASE_URL="https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights"

# Download tiny face detector model
wget -O tiny_face_detector_model-shard1 "$BASE_URL/tiny_face_detector_model-shard1"
wget -O tiny_face_detector_model-weights_manifest.json "$BASE_URL/tiny_face_detector_model-weights_manifest.json"

# Download face landmark model
wget -O face_landmark_68_model-shard1 "$BASE_URL/face_landmark_68_model-shard1"
wget -O face_landmark_68_model-weights_manifest.json "$BASE_URL/face_landmark_68_model-weights_manifest.json"

# Download face recognition model
wget -O face_recognition_model-shard1 "$BASE_URL/face_recognition_model-shard1"
wget -O face_recognition_model-shard2 "$BASE_URL/face_recognition_model-shard2"
wget -O face_recognition_model-weights_manifest.json "$BASE_URL/face_recognition_model-weights_manifest.json"

# Download face expression model
wget -O face_expression_model-shard1 "$BASE_URL/face_expression_model-shard1"
wget -O face_expression_model-weights_manifest.json "$BASE_URL/face_expression_model-weights_manifest.json"

echo "All models downloaded successfully!"