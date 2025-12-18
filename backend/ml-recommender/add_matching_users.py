# import pymongo
# from bson import ObjectId

# client = pymongo.MongoClient("mongodb://127.0.0.1:27017/")
# db = client["trendzz"]

# # Users jo aapke profile se match karein
# matching_users = [
#     {
#         "name": "Same Batch Friend",
#         "username": "batchmate2021",
#         "email": "batchmate@example.com",
#         "password": "test123",
#         "batch": "2021",          # Aapka batch
#         "semester": "3rd",        # Aapka semester
#         "department": "Computer Science",
#         "role": "student",
#         "interests": ["Programming", "AI"],
#         "status": "active"
#     },
#     {
#         "name": "Same Department",
#         "username": "csstudent",
#         "email": "cs@example.com",
#         "password": "test123",
#         "batch": "2021",
#         "semester": "4th",
#         "department": "Computer Science",
#         "role": "student",
#         "interests": ["Web Development"],
#         "status": "active"
#     },
#     {
#         "name": "Similar Interests",
#         "username": "coder",
#         "email": "coder@example.com",
#         "password": "test123",
#         "batch": "2022",
#         "semester": "3rd",
#         "department": "Software Engineering",
#         "role": "student",
#         "interests": ["Programming", "AI", "Web Development"],
#         "status": "active"
#     }
# ]

# print("Adding matching users...")
# for user in matching_users:
#     # Check if exists
#     existing = db.users.find_one({"email": user["email"]})
#     if not existing:
#         db.users.insert_one(user)
#         print(f"✅ Added: {user['name']} (Batch: {user['batch']}, Sem: {user['semester']})")

# print(f"\n📊 Total users now: {db.users.count_documents({})}")