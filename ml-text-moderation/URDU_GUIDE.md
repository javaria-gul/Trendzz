# 🎯 اردو میں مکمل گائیڈ

## ML Model Training اور Testing - قدم بہ قدم

---

## ⚙️ حصہ 1: سیٹ اپ (صرف پہلی بار)

### قدم 1: PowerShell کھولیں

```powershell
cd C:\Users\USER\Desktop\SocialMediaPlatform\Trendzz\ml-text-moderation
```

### قدم 2: سیٹ اپ چلائیں

```powershell
.\setup.bat
```

**وقت:** 5-10 منٹ

یہ سب کچھ install کر دے گا:
- Python virtual environment
- PyTorch (ML library)
- Transformers (NLP models)
- Flask (API server)

---

## 📊 حصہ 2: Training Data اکٹھا کریں

### قدم 3: ڈیٹا جمع کریں

```powershell
.\collect-data.bat
```

**وقت:** 1 منٹ سے کم

یہ بنائے گا:
- English examples
- Urdu/Hindi examples
- Arabic examples

### قدم 4: اپنا ڈیٹا شامل کریں (ضروری!)

**فائل کھولیں:** `data\custom_dataset_template.csv`

**اس طرح لکھیں:**

```csv
text,toxic,severe_toxic,obscene,threat,insult,identity_hate,language
"اچھی post ہے",0,0,0,0,0,0,ur
"تم بیوقوف ہو",1,0,0,0,1,0,ur
"Great post",0,0,0,0,0,0,en
"You idiot",1,0,0,0,1,0,en
```

**نمبر کا مطلب:**
- `1` = ہاں، یہ toxic/bad ہے
- `0` = نہیں، یہ ٹھیک ہے

**کم از کم 20-50 مثالیں شامل کریں!**

پھر دوبارہ چلائیں:
```powershell
.\collect-data.bat
```

---

## 🏋️ حصہ 3: Model Training

### قدم 5: ماڈل ٹرین کریں

```powershell
.\train-model.bat
```

**Y دبائیں اور Enter**

**کیا ہوگا:**
- Model ڈاؤنلوڈ ہوگا
- Training شروع ہوگی
- 5 epochs چلیں گے
- ہر epoch میں numbers بہتر ہوں گے

**وقت:** 
- CPU پر: 30-60 منٹ
- GPU پر: 10-20 منٹ

**کیا دیکھنا ہے:**
```
Epoch 1/5: Loss: 0.542, F1: 0.723
Epoch 2/5: Loss: 0.389, F1: 0.812
Epoch 3/5: Loss: 0.267, F1: 0.876
Epoch 4/5: Loss: 0.198, F1: 0.891
Epoch 5/5: Loss: 0.156, F1: 0.903
```

Loss کم ہونا چاہیے ⬇️ (اچھا!)
F1 زیادہ ہونا چاہیے ⬆️ (اچھا!)

---

## 🚀 حصہ 4: ML Service شروع کریں

### قدم 6: API Server چلائیں

```powershell
.\start-ml-service.bat
```

**یہ ٹرمینل کھلا رکھیں!** ❗

آپ دیکھیں گے:
```
✅ ML Moderation Service Ready!
Starting server on http://0.0.0.0:5001
```

---

## 🧪 حصہ 5: Test کریں

### قدم 7: Service Test کریں

**نیا PowerShell کھولیں:**

```powershell
cd C:\Users\USER\Desktop\SocialMediaPlatform\Trendzz\ml-text-moderation
.\venv\Scripts\activate
python test_service.py
```

**نتیجہ:**
```
Test 1: Normal content
  ✅ PASSED

Test 2: Toxic content  
  ✅ PASSED - Content FAIL
  
Test 3: Positive content
  ✅ PASSED

Success Rate: 100.0%
🎉 All tests passed!
```

---

## 🔗 حصہ 6: Backend کے ساتھ Test

### قدم 8: Backend شروع کریں

**تیسرا PowerShell کھولیں:**

```powershell
cd C:\Users\USER\Desktop\SocialMediaPlatform\Trendzz\backend
npm run dev
```

### قدم 9: Post بنا کر Test کریں

**اپنے app میں:**

**Test 1 - Bad content:**
```
"You are an idiot"
```
❌ Block ہونا چاہیے!

**Test 2 - Good content:**
```
"Beautiful day today!"
```
✅ Post بننا چاہیے!

---

## 🎯 روزانہ استعمال

ہر بار صرف یہ چلائیں:

```powershell
# ٹرمینل 1: ML Service
cd ml-text-moderation
.\start-ml-service.bat

# ٹرمینل 2: Backend  
cd backend
npm run dev

# ٹرمینل 3: Frontend
cd frontend
npm start
```

---

## 🔄 Model بہتر بنانے کے لیے

### ہر ہفتے/مہینے:

1. اپنے app سے مثالیں اکٹھی کریں
2. `custom_dataset_template.csv` میں شامل کریں
3. دوبارہ train کریں:
   ```powershell
   .\collect-data.bat
   .\train-model.bat
   ```

**زیادہ data = بہتر model!** 📈

---

## ⚠️ مسائل اور حل

### "Python is not recognized"
**حل:** Python install کریں python.org سے

### Training بہت slow ہے
**حل:** `config.yaml` میں:
- `num_epochs: 5` بدل کر `3` کریں
- `batch_size: 16` بدل کر `8` کریں

### Accuracy کم ہے (70% سے کم)
**حل:** 
- زیادہ data شامل کریں (100+ مثالیں)
- اچھے اور برے دونوں برابر ہونے چاہیں

### بہت زیادہ false positives
**حل:** `postController.js` میں:
```javascript
const moderationCheck = await checkContentAllowed(content, 0.8);
// 0.7 سے 0.8 کیا - زیادہ strict نہیں ہوگا
```

---

## ✅ کامیابی کی علامات

- ✅ `venv/` folder بن گیا
- ✅ `models/toxic-classifier/` بن گیا  
- ✅ ML service چل رہی ہے
- ✅ Backend چل رہا ہے
- ✅ Posts automatically moderate ہو رہی ہیں
- ✅ Tests pass ہو رہے ہیں

---

## 🎉 مبارک ہو!

آپ کا ML moderation system تیار ہے! 🚀

**اب کیا کریں:**
1. App استعمال کریں
2. اچھی اور بری posts try کریں  
3. دیکھیں کہ ML کیسے block کرتا ہے
4. مزید data جمع کرتے رہیں
5. ہر مہینے retrain کریں

---

**کوئی سوال؟ STEP_BY_STEP_GUIDE.md دیکھیں (English میں)!**
