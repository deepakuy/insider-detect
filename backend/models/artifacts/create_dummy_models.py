import joblib
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.dummy import DummyClassifier
from sklearn.preprocessing import StandardScaler
import os

# Create dummy models that can be loaded properly
def create_dummy_models():
    model_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Create a simple dummy classifier
    dummy_rf = DummyClassifier(strategy="most_frequent")
    dummy_rf.fit(np.array([[1, 2, 3]]), np.array([0]))
    
    dummy_xgb = DummyClassifier(strategy="most_frequent")
    dummy_xgb.fit(np.array([[1, 2, 3]]), np.array([0]))
    
    # Create a dummy scaler
    scaler = StandardScaler()
    scaler.fit(np.array([[1, 2, 3]]))
    
    # Save the models
    joblib.dump(dummy_rf, os.path.join(model_dir, "rf_model.pkl"))
    joblib.dump(dummy_xgb, os.path.join(model_dir, "xgb_model.pkl"))
    joblib.dump(scaler, os.path.join(model_dir, "scaler.pkl"))
    
    print("Dummy models created successfully!")

if __name__ == "__main__":
    create_dummy_models()
