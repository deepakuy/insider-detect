"""
Machine Learning Model Training Pipeline
Train Random Forest and XGBoost models for insider + APT threat detection.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, GridSearchCV, StratifiedKFold
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, roc_auc_score, roc_curve, precision_recall_curve, f1_score
from sklearn.preprocessing import StandardScaler
from imblearn.over_sampling import SMOTE
import xgboost as xgb
import joblib
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import json
import sys

# Robust import handling so this script can be run as:
#   - python models/train.py    (from backend directory)
#   - python -m backend.models.train (from project root)
try:
    # When running from backend directory, 'app' is discoverable
    from app.features.engineering import FeatureEngineer  # type: ignore
except ModuleNotFoundError:
    try:
        # When running from project root as a module
        from backend.app.features.engineering import FeatureEngineer  # type: ignore
    except ModuleNotFoundError:
        # Final fallback: adjust sys.path dynamically
        current_file = Path(__file__).resolve()
        candidate_paths = [
            current_file.parents[1] / "app",          # backend/app
            current_file.parents[2] / "app",          # <project>/app
            current_file.parents[1],                   # backend
            current_file.parents[2],                   # <project>
        ]
        for p in candidate_paths:
            if p.exists() and str(p) not in sys.path:
                sys.path.insert(0, str(p))
        try:
            from app.features.engineering import FeatureEngineer  # type: ignore
        except ModuleNotFoundError:
            # As a last resort, if backend/app was added directly
            from features.engineering import FeatureEngineer  # type: ignore


sns.set_style("whitegrid")

MODEL_DIR = Path(__file__).resolve().parent / "artifacts"
MODEL_DIR.mkdir(exist_ok=True)
PLOTS_DIR = Path(__file__).resolve().parent / "plots"
PLOTS_DIR.mkdir(exist_ok=True)

class ThreatDetectionTrainer:
    def __init__(self, data_path='../../data/synthetic_events.csv'):
        self.data_path = data_path
        self.models = {}
        self.scaler = None
        self.feature_cols = []
        self.X_train = None
        self.X_test = None
        self.y_train = None
        self.y_test = None

    def load_and_prepare_data(self):
        print("="*70)
        print(" STEP 1: LOADING AND PREPARING DATA")
        print("="*70)

        # Resolve absolute path to data/synthetic_events.csv relative to this file
        data_csv_path = (Path(__file__).resolve().parents[2] / 'data' / 'synthetic_events.csv')
        df = pd.read_csv(str(data_csv_path))
        print(f"   Loaded {len(df):,} events")

        # Derive label if missing: treat non-benign threat_type as malicious
        if 'is_malicious' not in df.columns:
            if 'threat_type' in df.columns:
                df['is_malicious'] = (df['threat_type'].fillna('benign') != 'benign').astype(int)
            else:
                # Fallback: no labels present; assume all benign
                df['is_malicious'] = 0

        print(f"   Benign: {(df['is_malicious']==0).sum():,}")
        print(f"   Malicious: {(df['is_malicious']==1).sum():,}")

        engineer = FeatureEngineer()
        df_features = engineer.compute_batch_features(df)

        self.feature_cols = [
            'login_count_1h',
            'failed_login_rate_1h',
            'bytes_transferred_1h',
            'unique_dst_ips_1h',
            'unique_files_24h',
            'off_hours_ratio_24h',
            'privilege_change_flag',
            'geo_anomaly_score',
            'dst_ip_entropy_1h'
        ]

        df_clean = df_features.dropna(subset=['is_malicious'] + self.feature_cols)
        X = df_clean[self.feature_cols].fillna(0)
        y = df_clean['is_malicious']

        print(f"   Feature matrix shape: {X.shape}")
        print(f"   Features: {', '.join(self.feature_cols)}")

        return X, y

    def split_and_scale(self, X, y):
        print("="*70)
        print("  STEP 2: SPLITTING AND SCALING DATA")
        print("="*70)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.3, random_state=42, stratify=y
        )

        print(f"   Train set: {len(X_train):,} samples")
        print(f"   Test set: {len(X_test):,} samples")

        smote = SMOTE(random_state=42)
        X_train_bal, y_train_bal = smote.fit_resample(X_train, y_train)

        print(f"   After SMOTE: {len(X_train_bal):,} samples")

        self.scaler = StandardScaler()
        X_train_scaled = self.scaler.fit_transform(X_train_bal)
        X_test_scaled = self.scaler.transform(X_test)

        joblib.dump(self.scaler, MODEL_DIR / 'scaler.pkl')

        self.X_train = X_train_scaled
        self.X_test = X_test_scaled
        self.y_train = y_train_bal
        self.y_test = y_test

    def train_random_forest(self):
        print("="*70)
        print(" STEP 3: TRAINING RANDOM FOREST")
        print("="*70)

        param_grid = {
            'n_estimators': [100, 200],
            'max_depth': [10, 20, None],
            'min_samples_split': [2, 5],
            'min_samples_leaf': [1, 2],
            'class_weight': ['balanced']
        }

        rf = RandomForestClassifier(random_state=42, n_jobs=-1)

        grid_search = GridSearchCV(
            rf, param_grid, cv=StratifiedKFold(5),
            scoring='f1', n_jobs=-1, verbose=1
        )

        grid_search.fit(self.X_train, self.y_train)

        print(f"   Best parameters: {grid_search.best_params_}")
        print(f"   Best CV F1: {grid_search.best_score_:.4f}")

        y_pred = grid_search.predict(self.X_test)
        y_prob = grid_search.predict_proba(self.X_test)[:, 1]

        print("   Test classification report:")
        print(classification_report(self.y_test, y_pred, target_names=['Benign','Malicious']))
        print(f"   Test ROC AUC: {roc_auc_score(self.y_test, y_prob):.4f}")

        self.models['random_forest'] = grid_search.best_estimator_
        joblib.dump(grid_search.best_estimator_, MODEL_DIR / 'rf_model.pkl')

    def train_xgboost(self):
        print("="*70)
        print(" STEP 4: TRAINING XGBOOST")
        print("="*70)

        scale_pos_weight = (self.y_train == 0).sum() / (self.y_train == 1).sum()

        param_grid = {
            'max_depth': [6, 10],
            'learning_rate': [0.01, 0.1],
            'n_estimators': [100, 200],
            'min_child_weight': [1, 3],
            'scale_pos_weight': [scale_pos_weight],
        }

        xgb_model = xgb.XGBClassifier(
            objective='binary:logistic',
            eval_metric='logloss',
            use_label_encoder=False,
            random_state=42,
            n_jobs=-1,
        )

        grid_search = GridSearchCV(
            xgb_model, param_grid, cv=StratifiedKFold(5),
            scoring='f1', n_jobs=-1, verbose=1
        )

        grid_search.fit(self.X_train, self.y_train)

        print(f"   Best parameters: {grid_search.best_params_}")
        print(f"   Best CV F1: {grid_search.best_score_:.4f}")

        y_pred = grid_search.predict(self.X_test)
        y_prob = grid_search.predict_proba(self.X_test)[:, 1]

        print("   Test classification report:")
        print(classification_report(self.y_test, y_pred, target_names=['Benign','Malicious']))
        print(f"   Test ROC AUC: {roc_auc_score(self.y_test, y_prob):.4f}")

        self.models['xgboost'] = grid_search.best_estimator_
        joblib.dump(grid_search.best_estimator_, MODEL_DIR / 'xgb_model.pkl')

    def generate_eval_plots(self):
        print("="*70)
        print(" STEP 5: GENERATING EVALUATION PLOTS")
        print("="*70)

        fig, axs = plt.subplots(2, 2, figsize=(15, 12))

        for name, model in self.models.items():
            y_prob = model.predict_proba(self.X_test)[:, 1]
            fpr, tpr, _ = roc_curve(self.y_test, y_prob)
            axs[0, 0].plot(fpr, tpr, label=f"{name} AUC: {roc_auc_score(self.y_test, y_prob):.3f}")

            precision, recall, _ = precision_recall_curve(self.y_test, y_prob)
            axs[0, 1].plot(recall, precision, label=name)

        if 'random_forest' in self.models:
            importances = self.models['random_forest'].feature_importances_
            indices = np.argsort(importances)[::-1]
            axs[1, 0].barh(range(len(self.feature_cols)), importances[indices], color='steelblue')
            axs[1, 0].set_yticks(range(len(self.feature_cols)))
            axs[1, 0].set_yticklabels([self.feature_cols[i] for i in indices])
            axs[1, 0].set_title("Feature Importances")

        if 'xgboost' in self.models:
            from sklearn.metrics import confusion_matrix
            import seaborn as sns
            y_pred = self.models['xgboost'].predict(self.X_test)
            cm = confusion_matrix(self.y_test, y_pred)
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', ax=axs[1, 1])
            axs[1, 1].set_title("Confusion Matrix (XGBoost)")

        for ax in axs.flatten():
            ax.legend()
            ax.grid(True)

        plt.tight_layout()
        plt.savefig(PLOTS_DIR / "model_evaluation.png")
        print(f"   Saved plots to {PLOTS_DIR / 'model_evaluation.png'}")

    def save_metrics(self):
        metrics = {}
        for name, model in self.models.items():
            y_pred = model.predict(self.X_test)
            y_prob = model.predict_proba(self.X_test)[:, 1]
            metrics[name] = {
                "accuracy": (y_pred == self.y_test).mean(),
                "precision": classification_report(self.y_test, y_pred, output_dict=True)['1']['precision'],
                "recall": classification_report(self.y_test, y_pred, output_dict=True)['1']['recall'],
                "f1_score": f1_score(self.y_test, y_pred),
                "roc_auc": roc_auc_score(self.y_test, y_prob),
            }
        with open(MODEL_DIR / "metrics_report.json", 'w') as f:
            json.dump(metrics, f, indent=4)
        print(f"   Saved metrics to {MODEL_DIR / 'metrics_report.json'}")

    def run(self):
        print("\n Starting ML Model Training Pipeline \n")
        X, y = self.load_and_prepare_data()
        self.split_and_scale(X, y)
        self.train_random_forest()
        self.train_xgboost()
        self.generate_eval_plots()
        self.save_metrics()
        print("\n TRAINING COMPLETE !\n")
        print("Artifacts saved in: ", MODEL_DIR)

if __name__ == '__main__':
    trainer = ThreatDetectionTrainer()
    trainer.run()
