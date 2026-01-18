#  Trendzz — Social Media + AI-Powered Trend Prediction Platform

**Trendzz** is a full-stack MERN (MongoDB, Express, React, Node.js) based social media web application.  
It allows users to connect, post, and engage — while an integrated **Machine Learning module** analyzes user activity & content trends to predict emerging topics.


## 🌟 Features

###  AI & Machine Learning
- Integrated **Python ML module** for real-time **trend prediction**.
- Predicts popular hashtags, keywords & content types.
- Analyzes user engagement metrics.

###  Social Platform Features
- **User Authentication** (Signup/Login with JWT)
- **Home Feed** displaying all posts
- **Like / Comment system**
- **Profile Page** (upcoming)
- **Groups & Communities** (upcoming)

### ⚙️ Tech Stack
- **Frontend:** React + Vite  
- **Backend:** Node.js + Express  
- **Database:** MongoDB (Mongoose ODM)  
- **ML Integration:** Python (Flask API)  
- **Version Control:** GitHub  
- **Deployment:** Vercel (Frontend), Render / Railway (Backend)


## 🧩 Installation & Setup Guide

Follow these steps to run **Trendzz** locally 👇

### 1️⃣ Clone the Repository

git clone https://github.com/<your-username>/trendzz.git
cd trendzz

### 2️⃣ Install Dependencies
For Backend:
cd server
npm install

For Frontend:
cd ../client
npm install

### 3️⃣ Setup MongoDB

Install MongoDB on your machine or create a free cluster on MongoDB Atlas

Create a .env file in /server with:

MONGO_URI=mongodb://127.0.0.1:27017/trendzz
JWT_SECRET=yourSecretKey
PORT=5000


Start MongoDB service (Windows users may need Admin mode):

net start MongoDB

### 4️⃣ Run the Application
Backend:
cd server
npm start

Frontend:
cd ../client
npm run dev


Then open:
 http://localhost:3000

### 5️⃣ (Optional) Run the ML Flask API

If you’re using ML predictions locally:

cd ml-model
pip install -r requirements.txt
python app.py


This will start the Flask server at http://localhost:5001.






🖤 Support

If you like this project, don’t forget to ⭐ the repo and share your feedback!

🧾 License

This project is licensed under the MIT License — feel free to use and modify for your own learning or development.



