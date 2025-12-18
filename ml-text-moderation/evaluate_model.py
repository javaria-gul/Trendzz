"""
Model Evaluation Script
Evaluates trained model on test set and generates detailed reports
"""

import os
import torch
import pandas as pd
import numpy as np
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from sklearn.metrics import (
    classification_report,
    confusion_matrix,
    roc_auc_score,
    precision_recall_curve
)
import matplotlib.pyplot as plt
import seaborn as sns

class ModelEvaluator:
    """Evaluate trained toxic content classifier"""
    
    def __init__(self, model_path='models/toxic-classifier'):
        self.model_path = model_path
        self.label_columns = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']
        
        print(f"📊 Loading model from: {model_path}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSequenceClassification.from_pretrained(model_path)
        self.model.eval()
        
        # Use GPU if available
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model.to(self.device)
        
        print(f"✅ Model loaded on {self.device}")
    
    def load_test_data(self, test_path='data/test_dataset.csv'):
        """Load test dataset"""
        print(f"\n📂 Loading test data from: {test_path}")
        
        if not os.path.exists(test_path):
            raise FileNotFoundError(f"Test dataset not found: {test_path}")
        
        df = pd.read_csv(test_path)
        print(f"✅ Loaded {len(df)} test samples")
        
        return df
    
    def predict(self, texts, batch_size=16):
        """Make predictions on texts"""
        all_predictions = []
        
        for i in range(0, len(texts), batch_size):
            batch_texts = texts[i:i+batch_size]
            
            # Tokenize
            encodings = self.tokenizer(
                batch_texts,
                truncation=True,
                padding=True,
                max_length=256,
                return_tensors='pt'
            )
            
            # Move to device
            input_ids = encodings['input_ids'].to(self.device)
            attention_mask = encodings['attention_mask'].to(self.device)
            
            # Predict
            with torch.no_grad():
                outputs = self.model(input_ids=input_ids, attention_mask=attention_mask)
                logits = outputs.logits
                
                # Apply sigmoid for multi-label
                predictions = torch.sigmoid(logits).cpu().numpy()
                all_predictions.extend(predictions)
        
        return np.array(all_predictions)
    
    def evaluate(self, threshold=0.5):
        """Evaluate model on test set"""
        print("\n" + "="*60)
        print("🧪 Starting Model Evaluation")
        print("="*60)
        
        # Load test data
        df = self.load_test_data()
        texts = df['text'].tolist()
        true_labels = df[self.label_columns].values
        
        # Make predictions
        print(f"\n🔮 Making predictions on {len(texts)} samples...")
        predictions = self.predict(texts)
        predictions_binary = (predictions > threshold).astype(int)
        
        print("✅ Predictions complete")
        
        # Calculate metrics for each label
        print("\n📊 Per-Label Metrics:")
        print("-" * 60)
        
        results = {}
        for i, label in enumerate(self.label_columns):
            y_true = true_labels[:, i]
            y_pred = predictions_binary[:, i]
            y_score = predictions[:, i]
            
            # Classification report
            report = classification_report(y_true, y_pred, output_dict=True, zero_division=0)
            
            # AUC
            try:
                auc = roc_auc_score(y_true, y_score)
            except:
                auc = 0.0
            
            results[label] = {
                'precision': report['1']['precision'],
                'recall': report['1']['recall'],
                'f1': report['1']['f1-score'],
                'auc': auc,
                'support': report['1']['support']
            }
            
            print(f"\n{label.upper()}")
            print(f"  Precision: {results[label]['precision']:.4f}")
            print(f"  Recall:    {results[label]['recall']:.4f}")
            print(f"  F1-Score:  {results[label]['f1']:.4f}")
            print(f"  AUC:       {results[label]['auc']:.4f}")
            print(f"  Support:   {int(results[label]['support'])}")
        
        # Overall metrics
        print("\n" + "="*60)
        print("📈 Overall Metrics:")
        print("-" * 60)
        
        # Flatten for overall metrics
        true_flat = true_labels.flatten()
        pred_flat = predictions_binary.flatten()
        score_flat = predictions.flatten()
        
        overall_report = classification_report(true_flat, pred_flat, zero_division=0)
        print(overall_report)
        
        try:
            overall_auc = roc_auc_score(true_flat, score_flat)
            print(f"Overall AUC: {overall_auc:.4f}")
        except:
            overall_auc = 0.0
        
        # Save results
        results_df = pd.DataFrame(results).T
        results_df.to_csv('evaluation_results.csv')
        print(f"\n💾 Results saved to: evaluation_results.csv")
        
        # Sample predictions
        print("\n" + "="*60)
        print("🔍 Sample Predictions:")
        print("-" * 60)
        
        for i in range(min(5, len(df))):
            print(f"\nSample {i+1}:")
            print(f"Text: {texts[i][:80]}...")
            print(f"True: {true_labels[i]}")
            print(f"Pred: {predictions_binary[i]}")
            print(f"Score: {predictions[i]}")
        
        print("\n" + "="*60)
        print("✅ Evaluation Complete!")
        print("="*60)
        
        return results, predictions

def main():
    """Main evaluation function"""
    try:
        evaluator = ModelEvaluator()
        results, predictions = evaluator.evaluate(threshold=0.5)
        
        print("\n✨ Evaluation successful!")
        print("   Results saved to: evaluation_results.csv")
        
    except Exception as e:
        print(f"\n❌ Evaluation failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()
