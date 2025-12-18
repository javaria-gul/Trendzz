"""
Data Augmentation Module
Augments training data to increase diversity and reduce overfitting
"""

import random
import pandas as pd
from typing import List
import re

class TextAugmenter:
    """Augment text data for better model training"""
    
    def __init__(self, aug_probability=0.3):
        self.aug_probability = aug_probability
        
        # Simple synonym replacements for common words
        self.synonyms = {
            'stupid': ['dumb', 'foolish', 'idiotic', 'moronic'],
            'hate': ['despise', 'loathe', 'detest'],
            'kill': ['murder', 'eliminate', 'destroy'],
            'bad': ['terrible', 'awful', 'horrible'],
            'good': ['great', 'excellent', 'wonderful', 'nice'],
            'idiot': ['fool', 'moron', 'dummy'],
        }
    
    def synonym_replacement(self, text: str, n=2) -> str:
        """Replace n words with their synonyms"""
        words = text.split()
        new_words = words.copy()
        random_word_list = list(set([word for word in words if word.lower() in self.synonyms]))
        random.shuffle(random_word_list)
        num_replaced = 0
        
        for random_word in random_word_list:
            synonyms = self.synonyms[random_word.lower()]
            synonym = random.choice(synonyms)
            new_words = [synonym if word.lower() == random_word.lower() else word for word in new_words]
            num_replaced += 1
            if num_replaced >= n:
                break
        
        return ' '.join(new_words)
    
    def random_insertion(self, text: str, n=1) -> str:
        """Randomly insert n words into the text"""
        words = text.split()
        for _ in range(n):
            self._add_random_word(words)
        return ' '.join(words)
    
    def _add_random_word(self, words: List[str]):
        """Add a random word at a random position"""
        synonyms_flat = [syn for syns in self.synonyms.values() for syn in syns]
        random_word = random.choice(synonyms_flat)
        random_idx = random.randint(0, len(words))
        words.insert(random_idx, random_word)
    
    def random_swap(self, text: str, n=2) -> str:
        """Randomly swap n pairs of words"""
        words = text.split()
        for _ in range(n):
            words = self._swap_word(words)
        return ' '.join(words)
    
    def _swap_word(self, words: List[str]) -> List[str]:
        """Swap two random words"""
        if len(words) < 2:
            return words
        random_idx_1 = random.randint(0, len(words) - 1)
        random_idx_2 = random_idx_1
        counter = 0
        while random_idx_2 == random_idx_1:
            random_idx_2 = random.randint(0, len(words) - 1)
            counter += 1
            if counter > 3:
                return words
        words[random_idx_1], words[random_idx_2] = words[random_idx_2], words[random_idx_1]
        return words
    
    def random_deletion(self, text: str, p=0.1) -> str:
        """Randomly delete words with probability p"""
        words = text.split()
        if len(words) == 1:
            return text
        
        new_words = []
        for word in words:
            if random.random() > p:
                new_words.append(word)
        
        if len(new_words) == 0:
            return random.choice(words)
        
        return ' '.join(new_words)
    
    def augment(self, text: str, num_aug=1) -> List[str]:
        """
        Generate augmented versions of text
        Returns list of augmented texts
        """
        augmented_texts = []
        
        for _ in range(num_aug):
            # Randomly choose augmentation technique
            technique = random.choice([
                'synonym',
                'insertion',
                'swap',
                'deletion'
            ])
            
            if technique == 'synonym' and random.random() < self.aug_probability:
                aug_text = self.synonym_replacement(text)
            elif technique == 'insertion' and random.random() < self.aug_probability:
                aug_text = self.random_insertion(text)
            elif technique == 'swap' and random.random() < self.aug_probability:
                aug_text = self.random_swap(text)
            elif technique == 'deletion' and random.random() < self.aug_probability:
                aug_text = self.random_deletion(text)
            else:
                aug_text = text
            
            if aug_text != text:
                augmented_texts.append(aug_text)
        
        return augmented_texts

def augment_dataset(df: pd.DataFrame, augmenter: TextAugmenter, aug_per_sample=2) -> pd.DataFrame:
    """
    Augment entire dataset
    
    Args:
        df: DataFrame with 'text' column
        augmenter: TextAugmenter instance
        aug_per_sample: Number of augmented samples per original sample
    
    Returns:
        Augmented DataFrame
    """
    print(f"🔄 Augmenting dataset... (creating {aug_per_sample} variations per sample)")
    
    augmented_rows = []
    
    for idx, row in df.iterrows():
        # Keep original
        augmented_rows.append(row.to_dict())
        
        # Only augment toxic samples (minority class)
        if row.get('toxic', 0) == 1:
            aug_texts = augmenter.augment(row['text'], num_aug=aug_per_sample)
            
            for aug_text in aug_texts:
                new_row = row.to_dict()
                new_row['text'] = aug_text
                augmented_rows.append(new_row)
    
    augmented_df = pd.DataFrame(augmented_rows)
    
    print(f"✅ Original samples: {len(df)}")
    print(f"✅ Augmented samples: {len(augmented_df)}")
    print(f"✅ New samples added: {len(augmented_df) - len(df)}")
    
    return augmented_df

if __name__ == "__main__":
    # Test augmentation
    augmenter = TextAugmenter()
    
    test_text = "You are a stupid idiot and I hate you"
    print(f"Original: {test_text}")
    print()
    
    augmented = augmenter.augment(test_text, num_aug=3)
    for i, aug_text in enumerate(augmented, 1):
        print(f"Augmented {i}: {aug_text}")
