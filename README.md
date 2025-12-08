# 🚀 Travel Buddy Backend – REST API

A scalable and secure backend powering the **Travel Buddy** platform — helping users find compatible travel partners, manage profiles, chat, subscribe for premium features, and more.

Built with:

- **Node.js + Express**
- **Prisma ORM**
- **PostgreSQL**
- **TypeScript**
- **JWT Authentication**
- **Role-based Access Control**
- **Modular Service Architecture**

---

## 📦 Features

### 🔐 Authentication & User Management
- Register & Login  
- JWT Access + Refresh tokens  
- Forgot/Reset Password  
- Update profile & profile photo  
- Role-based (Admin, Moderator, User)

### 🧳 Traveler Profile System
- Create/update traveler profile  
- Travel style, interests, languages  
- Location (city/country)  
- Profile photo upload  

### 🤝 Smart Travel Buddy Matching
Weighted algorithm matching based on:
- Interests  
- Travel style  
- Languages  
- Location  
- Safety Score  
- Returns match percentage & match reasons  

### 💳 Subscription System
- Free & Premium plans  
- Stripe integration  
- Webhooks  
- Subscription validation  

### 💬 Chat System
- One-to-one messaging  
- Real-time (Socket.io)  
- Seen/unseen messages  

### 🛠 Admin Panel
- View all users  
- Soft delete traveler  
- Manage reported profiles  
- View subscriptions  

---

## ⚙️ Tech Stack

| Layer | Technology |
|-------|------------|
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | JWT |
| Storage | Multer / Cloud Storage |
| Payments | Stripe |
| Realtime | Socket.io |

---

## 📁 Project Structure

src/
├── app/modules/
│ ├── auth/
│ ├── user/
│ ├── traveler/
│ ├── matching/
│ ├── subscription/
│ ├── chat/
│ └── admin/
├── middleware/
├── utils/
├── prisma/
└── server.ts

yaml
Copy code

---

## 🛠 Installation

### **1. Clone Repo**
```bash
git clone https://github.com/yourname/travel-buddy-backend.git
cd travel-buddy-backend
2. Install Dependencies
bash
Copy code
npm install
3. Setup Environment
Create a .env file:

ini
Copy code
DATABASE_URL="postgresql://user:password@localhost:5432/travelbuddy"
JWT_ACCESS_SECRET="your_access_secret"
JWT_REFRESH_SECRET="your_refresh_secret"
STRIPE_SECRET_KEY="your_stripe_key"
STRIPE_WEBHOOK_SECRET="your_webhook_secret"
SERVER_URL="http://localhost:5000"
CLIENT_URL="http://localhost:3000"
NODE_ENV="development"
4. Prisma Setup
Generate client:

bash
Copy code
npx prisma generate
Run migrations:

bash
Copy code
npx prisma migrate dev --name init
5. Start Development Server
bash
Copy code
npm run dev
Server runs at:

arduino
Copy code
http://localhost:5000
🔗 API Routes
Auth Routes /auth
Method	Route	Description
POST	/register	Register new user
POST	/login	Login & get tokens
POST	/refresh-token	Refresh access token
POST	/change-password	Change password
POST	/update-profile	Update profile
POST	/upload-photo	Upload profile picture

Traveler Routes /traveler
Method	Route	Description
GET	/	Get all travelers
GET	/:id	Get traveler by ID
PATCH	/soft/:id	Soft delete traveler
GET	/recommendations	Get recommended travel buddies

Matching Routes /match
Method	Route	Description
GET	/recommended	Smart traveler matching
GET	/:id	Match details

Chat Routes /chat
Method	Route	Description
GET	/conversations	Get chat list
GET	/:userId	Get messages
POST	/send	Send a message

Socket.io Events:

join_room

send_message

receive_message

Subscription Routes /subscription
Method	Route	Description
POST	/create	Create subscription
POST	/webhook	Stripe webhook
GET	/plans	Get plan pricing
GET	/my-subscription	Get user subscription

Admin Routes /admin
Method	Route	Description
GET	/users	List all users
PATCH	/user/:id/block	Block user
PATCH	/user/:id/unblock	Unblock user
GET	/reports	Reported profiles

🧮 Matching Algorithm (How It Works)
The matching score is calculated using weighted logic:

Criteria	Weight
Interest match	40%
Travel style	20%
Languages	15%
Same city	10%
Same country	10%
Safety Score	20%

Example Match Response
json
Copy code
{
  "userId": "abc123",
  "name": "John Doe",
  "matchPercentage": 87,
  "matchReasons": [
    "Matched interests: Hiking, Beaches",
    "Same travel style: Adventure",
    "High safety score"
  ]
}
🧪 Testing
bash
Copy code
npm run test
🚀 Build for Production
bash
Copy code
npm run build
npm start
🤝 Contributing
Contributions are welcome!
Please open an issue or submit a pull request.

📄 License
MIT License © 2025 Travel Buddy

yaml
Copy code

---

If you want:

✅ README for Frontend  
✅ ER Diagram  
✅ Postman Collection  
✅ Swagger API Docs  

Just tell me — I'll generate them!