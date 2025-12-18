"""
Model Training Script
Fine-tunes multilingual transformer model for toxic content classification
"""

import os
import torch
import pandas as pd
import numpy as np
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    XLMRobertaTokenizer,
    TrainingArguments,
    Trainer,
    EarlyStoppingCallback
)
from datasets import Dataset
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_recall_fscore_support, roc_auc_score
import yaml
from augmentation import TextAugmenter, augment_dataset

class ToxicityTrainer:
    """Train toxic content classification model"""
    
    def __init__(self, config_path='config.yaml'):
        # Load configuration
        # Get script directory for absolute paths
        self.script_dir = os.path.dirname(os.path.abspath(__file__))
        config_path = os.path.join(self.script_dir, config_path) if not os.path.isabs(config_path) else config_path
        
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        self.model_name = self.config['model']['base_model']
        self.max_length = self.config['model']['max_length']
        self.num_labels = self.config['model']['num_labels']
        
        # Label columns
        self.label_columns = ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']
        
        print(f"🚀 Initializing ToxicityTrainer")
        print(f"   Base Model: {self.model_name}")
        print(f"   Max Length: {self.max_length}")
        print(f"   Num Labels: {self.num_labels}")
    
    def load_data(self, data_path='data/merged_dataset.csv'):
        """Load and prepare dataset"""
        data_path = os.path.join(self.script_dir, data_path) if not os.path.isabs(data_path) else data_path
        print(f"\n📂 Loading data from: {data_path}")
        
        if not os.path.exists(data_path):
            raise FileNotFoundError(f"Dataset not found: {data_path}")
        
        df = pd.read_csv(data_path)
        
        # Ensure all label columns exist
        for col in self.label_columns:
            if col not in df.columns:
                df[col] = 0
        
        print(f"✅ Loaded {len(df)} samples")
        print(f"   Toxic samples: {df['toxic'].sum()}")
        print(f"   Non-toxic samples: {(df['toxic'] == 0).sum()}")
        
        return df
    
    def augment_data(self, df):
        """Augment training data"""
        if not self.config['augmentation']['enabled']:
            print("⏭️ Data augmentation disabled")
            return df
        
        print("\n🔄 Augmenting data...")
        augmenter = TextAugmenter(
            aug_probability=self.config['augmentation']['aug_probability']
        )
        
        # Augment only toxic samples (minority class)
        augmented_df = augment_dataset(df, augmenter, aug_per_sample=2)
        
        return augmented_df
    
    def prepare_datasets(self, df):
        """Split data into train/val/test sets"""
        print("\n✂️ Splitting data...")
        
        # First split: separate test set
        train_val_df, test_df = train_test_split(
            df,
            test_size=self.config['training']['test_split'],
            random_state=42,
            stratify=df['toxic']
        )
        
        # Second split: separate validation set
        train_df, val_df = train_test_split(
            train_val_df,
            test_size=self.config['training']['validation_split'],
            random_state=42,
            stratify=train_val_df['toxic']
        )
        
        print(f"✅ Train: {len(train_df)} samples")
        print(f"✅ Validation: {len(val_df)} samples")
        print(f"✅ Test: {len(test_df)} samples")
        
        return train_df, val_df, test_df
    
    def tokenize_data(self, df, tokenizer):
        """Tokenize text data"""
        print(f"\n🔤 Tokenizing {len(df)} samples...")
        
        # Prepare texts and labels
        texts = df['text'].tolist()
        labels = df[self.label_columns].values.astype(float)
        
        # Tokenize
        encodings = tokenizer(
            texts,
            truncation=True,
            padding='max_length',
            max_length=self.max_length,
            return_tensors='pt'
        )
        
        # Create dataset
        dataset = Dataset.from_dict({
            'input_ids': encodings['input_ids'],
            'attention_mask': encodings['attention_mask'],
            'labels': labels
        })
        
        print(f"✅ Tokenization complete")
        
        return dataset
    
    def compute_metrics(self, pred):
        """Compute evaluation metrics"""
        labels = pred.label_ids
        preds = pred.predictions
        
        # Apply sigmoid for multi-label classification
        preds_sigmoid = 1 / (1 + np.exp(-preds))
        preds_binary = (preds_sigmoid > 0.5).astype(int)
        
        # Calculate metrics
        accuracy = accuracy_score(labels.flatten(), preds_binary.flatten())
        precision, recall, f1, _ = precision_recall_fscore_support(
            labels.flatten(),
            preds_binary.flatten(),
            average='binary'
        )
        
        try:
            auc = roc_auc_score(labels, preds_sigmoid, average='macro')
        except:
            auc = 0.0
        
        return {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1': f1,
            'auc': auc
        }
    
    def train(self, output_dir='models/toxic-classifier'):
        """Train the model"""
        # Make output path absolute
        output_dir = os.path.join(self.script_dir, output_dir) if not os.path.isabs(output_dir) else output_dir
        
        print("\n" + "="*60)
        print("🏋️ Starting Model Training")
        print("="*60)
        
        # Load data
        df = self.load_data()
        
        # Augment data
        df = self.augment_data(df)
        
        # Split datasets
        train_df, val_df, test_df = self.prepare_datasets(df)
        
        # Save test set for later evaluation
        test_path = os.path.join(self.script_dir, 'data/test_dataset.csv')
        test_df.to_csv(test_path, index=False)
        print("💾 Saved test dataset for later evaluation")
        
        # Load tokenizer and model
        print(f"\n📥 Loading model: {self.model_name}")
        tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        model = AutoModelForSequenceClassification.from_pretrained(
            self.model_name,
            num_labels=self.num_labels,
            problem_type="multi_label_classification"
        )
        
        # Tokenize datasets
        train_dataset = self.tokenize_data(train_df, tokenizer)
        val_dataset = self.tokenize_data(val_df, tokenizer)
        
        # Training arguments
        training_args = TrainingArguments(
            output_dir=output_dir,
            num_train_epochs=self.config['training']['num_epochs'],
            per_device_train_batch_size=self.config['training']['batch_size'],
            per_device_eval_batch_size=self.config['training']['batch_size'],
            learning_rate=self.config['training']['learning_rate'],
            weight_decay=self.config['training']['weight_decay'],
            warmup_steps=self.config['training']['warmup_steps'],
            gradient_accumulation_steps=self.config['training']['gradient_accumulation_steps'],
            
            # Evaluation
            eval_strategy="epoch",
            save_strategy="epoch",
            load_best_model_at_end=True,
            metric_for_best_model="f1",
            
            # Logging
            logging_dir=self.config['logging']['tensorboard_dir'],
            logging_steps=100,
            report_to="tensorboard",
            
            # Other
            save_total_limit=3,
            fp16=torch.cuda.is_available(),
            dataloader_num_workers=0,
        )
        
        # Early stopping callback
        early_stopping = EarlyStoppingCallback(
            early_stopping_patience=self.config['training']['early_stopping_patience'],
            early_stopping_threshold=self.config['training']['early_stopping_threshold']
        )
        
        # Initialize trainer
        trainer = Trainer(
            model=model,
            args=training_args,
            train_dataset=train_dataset,
            eval_dataset=val_dataset,
            compute_metrics=self.compute_metrics,
            callbacks=[early_stopping]
        )
        
        # Train
        print("\n🏃 Starting training...")
        print(f"   Device: {'GPU' if torch.cuda.is_available() else 'CPU'}")
        
        trainer.train()
        
        # Save final model
        print(f"\n💾 Saving model to: {output_dir}")
        trainer.save_model(output_dir)
        tokenizer.save_pretrained(output_dir)
        
        # Final evaluation on validation set
        print("\n📊 Final Evaluation on Validation Set:")
        eval_results = trainer.evaluate()
        for key, value in eval_results.items():
            print(f"   {key}: {value:.4f}")
        
        print("\n" + "="*60)
        print("✅ Training Complete!")
        print("="*60)
        print(f"Model saved to: {output_dir}")
        print(f"Test dataset saved to: data/test_dataset.csv")
        print("\nNext steps:")
        print("  1. Run evaluation: python evaluate_model.py")
        print("  2. Start inference API: python app.py")
        
        return trainer, eval_results

def main():
    """Main training function"""
    try:
        trainer = ToxicityTrainer()
        trainer.train()
    except Exception as e:
        print(f"\n❌ Training failed: {str(e)}")
        raise

if __name__ == "__main__":
    main()
