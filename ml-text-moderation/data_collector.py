"""
Data Collection and Preparation Module
Collects toxic/non-toxic examples from multiple sources and prepares training dataset
"""

import pandas as pd
import os
import json
from typing import List, Dict
import requests
from tqdm import tqdm

class DatasetCollector:
    """Collect and prepare training data from multiple sources"""
    
    def __init__(self, output_dir='data/'):
        self.output_dir = output_dir
        os.makedirs(output_dir, exist_ok=True)
        
    def download_jigsaw_toxic_dataset(self):
        """
        Download Jigsaw Toxic Comment Classification dataset
        This is a high-quality labeled dataset with 150k+ examples
        """
        print("📥 Downloading Jigsaw Toxic Comment dataset...")
        
        # Dataset available on Kaggle
        # For this example, we'll create a sample structure
        # In production, download from: https://www.kaggle.com/c/jigsaw-toxic-comment-classification-challenge
        
        sample_data = {
            'text': [
                "Hello, how are you?",
                "You are an idiot and should die",
                "Great post, thanks for sharing!",
                "I fucking hate you all",
                "This is helpful information",
                "Kill yourself you worthless piece of shit",
            ],
            'toxic': [0, 1, 0, 1, 0, 1],
            'severe_toxic': [0, 1, 0, 1, 0, 1],
            'obscene': [0, 1, 0, 1, 0, 1],
            'threat': [0, 1, 0, 0, 0, 1],
            'insult': [0, 1, 0, 1, 0, 1],
            'identity_hate': [0, 0, 0, 0, 0, 0]
        }
        
        df = pd.DataFrame(sample_data)
        filepath = os.path.join(self.output_dir, 'jigsaw_toxic_en.csv')
        df.to_csv(filepath, index=False)
        
        print(f"✅ Saved English toxic dataset: {filepath}")
        print(f"   Samples: {len(df)}, Toxic: {df['toxic'].sum()}")
        
        return df
    
    def create_multilingual_dataset(self):
        """
        Create multilingual toxic dataset
        Combines translations and native examples
        """
        print("🌍 Creating multilingual dataset...")
        
        # Sample multilingual toxic/non-toxic examples
        multilingual_data = {
            'text': [
                # English
                "This is a great community",
                "You are stupid",
                "Thanks for the help!",
                "I will kill you",
                
                # Urdu/Hindi (Romanized)
                "Bahut acha hai ye",
                "tu bhenchod hai",
                "Shukriya dost",
                "tujhe maar dunga",
                
                # Urdu (Native)
                "یہ بہت اچھا ہے",
                "تم بیوقوف ہو",
                "شکریہ دوست",
                "میں تمہیں مار دوں گا",
                
                # Arabic
                "هذا رائع",
                "أنت غبي",
                "شكرا لك",
                "سأقتلك",
            ],
            'language': [
                'en', 'en', 'en', 'en',
                'ur', 'ur', 'ur', 'ur',
                'ur', 'ur', 'ur', 'ur',
                'ar', 'ar', 'ar', 'ar',
            ],
            'toxic': [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
            'severe_toxic': [0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
            'obscene': [0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            'threat': [0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1],
            'insult': [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0],
            'identity_hate': [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
        }
        
        df = pd.DataFrame(multilingual_data)
        filepath = os.path.join(self.output_dir, 'multilingual_toxic.csv')
        df.to_csv(filepath, index=False)
        
        print(f"✅ Saved multilingual dataset: {filepath}")
        print(f"   Samples: {len(df)}")
        print(f"   Languages: {df['language'].unique().tolist()}")
        
        return df
    
    def load_custom_dataset(self, filepath):
        """
        Load custom dataset from CSV
        
        Expected format:
        text,toxic,severe_toxic,obscene,threat,insult,identity_hate
        "Some text",0,0,0,0,0,0
        "Toxic text",1,0,1,0,1,0
        """
        if not os.path.exists(filepath):
            print(f"⚠️ File not found: {filepath}")
            return None
            
        df = pd.read_csv(filepath)
        print(f"✅ Loaded custom dataset: {filepath}")
        print(f"   Samples: {len(df)}")
        
        return df
    
    def merge_datasets(self, datasets: List[pd.DataFrame]):
        """Merge multiple datasets into one"""
        print("🔄 Merging datasets...")
        
        merged = pd.concat(datasets, ignore_index=True)
        
        # Remove duplicates
        merged = merged.drop_duplicates(subset=['text'])
        
        # Shuffle
        merged = merged.sample(frac=1, random_state=42).reset_index(drop=True)
        
        filepath = os.path.join(self.output_dir, 'merged_dataset.csv')
        merged.to_csv(filepath, index=False)
        
        print(f"✅ Merged dataset saved: {filepath}")
        print(f"   Total samples: {len(merged)}")
        print(f"   Toxic samples: {merged['toxic'].sum()}")
        print(f"   Non-toxic samples: {(merged['toxic'] == 0).sum()}")
        
        return merged
    
    def create_template_dataset_file(self):
        """Create a template CSV file for users to add their own data"""
        
        template_data = {
            'text': [
                'Example of a normal, friendly comment',
                'Example of a toxic comment (add actual examples here)',
                'Example of a threatening message (add actual examples here)',
            ],
            'toxic': [0, 1, 1],
            'severe_toxic': [0, 0, 1],
            'obscene': [0, 1, 0],
            'threat': [0, 0, 1],
            'insult': [0, 1, 0],
            'identity_hate': [0, 0, 0],
            'language': ['en', 'en', 'en']
        }
        
        df = pd.DataFrame(template_data)
        filepath = os.path.join(self.output_dir, 'custom_dataset_template.csv')
        df.to_csv(filepath, index=False)
        
        print(f"✅ Template created: {filepath}")
        print("   Add your own labeled examples to this file!")
        
        return filepath
    
    def collect_all(self):
        """Collect all available datasets"""
        print("=" * 60)
        print("Starting Dataset Collection")
        print("=" * 60)
        print()
        
        datasets = []
        
        # 1. Jigsaw dataset
        try:
            jigsaw_df = self.download_jigsaw_toxic_dataset()
            datasets.append(jigsaw_df)
        except Exception as e:
            print(f"⚠️ Could not load Jigsaw dataset: {e}")
        
        # 2. Multilingual dataset
        try:
            multilingual_df = self.create_multilingual_dataset()
            datasets.append(multilingual_df)
        except Exception as e:
            print(f"⚠️ Could not create multilingual dataset: {e}")
        
        # 3. Create template for custom data
        self.create_template_dataset_file()
        
        # Merge all datasets
        if datasets:
            final_dataset = self.merge_datasets(datasets)
            
            print()
            print("=" * 60)
            print("✅ Dataset Collection Complete!")
            print("=" * 60)
            print(f"Final dataset: {len(final_dataset)} samples")
            print(f"Ready for training!")
            
            return final_dataset
        else:
            print("❌ No datasets collected")
            return None

def main():
    """Main function to run data collection"""
    collector = DatasetCollector()
    dataset = collector.collect_all()
    
    if dataset is not None:
        print("\n📊 Dataset Statistics:")
        print(dataset.describe())
        print("\n🏷️ Label Distribution:")
        for col in ['toxic', 'severe_toxic', 'obscene', 'threat', 'insult', 'identity_hate']:
            if col in dataset.columns:
                print(f"  {col}: {dataset[col].sum()} ({dataset[col].mean()*100:.1f}%)")

if __name__ == "__main__":
    main()
