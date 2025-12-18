"""
Download model with retry logic
"""
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import time

model_name = "distilbert-base-multilingual-cased"
max_retries = 5

print(f"🔽 Downloading model: {model_name}")
print(f"📦 Size: ~250MB")
print(f"🔄 Will retry up to {max_retries} times if interrupted\n")

for attempt in range(1, max_retries + 1):
    try:
        print(f"Attempt {attempt}/{max_retries}...")
        
        # Download tokenizer
        print("  ├─ Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(model_name)
        print("  ├─ ✅ Tokenizer downloaded")
        
        # Download model
        print("  ├─ Downloading model weights...")
        model = AutoModelForSequenceClassification.from_pretrained(
            model_name,
            num_labels=6,
            problem_type="multi_label_classification"
        )
        print("  └─ ✅ Model downloaded")
        
        print("\n✅ Download complete! Model cached locally.")
        print("Ab `python train_model.py` run kar sakte ho.")
        break
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Download interrupted by user. Exiting...")
        break
    except Exception as e:
        print(f"  └─ ❌ Error: {e}")
        if attempt < max_retries:
            wait_time = attempt * 5
            print(f"  ⏳ Waiting {wait_time} seconds before retry...\n")
            time.sleep(wait_time)
        else:
            print("\n❌ Failed after all retries. Check internet connection.")
