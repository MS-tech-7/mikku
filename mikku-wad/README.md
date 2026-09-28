# mikku — Student Freelance & Task Marketplace

**Skills • Opportunities • Together**

A syllabus-friendly Web Application Development project built with:

- HTML5
- CSS3
- JavaScript
- jQuery
- AJAX
- Node.js + Express
- MongoDB + Mongoose
- bcryptjs for password hashing
- express-session for login sessions

## 1. Project structure

```text
mikku-wad/
├── client/
│   ├── assets/
│   │   └── mikku-logo.png
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Service.js
│   │   └── Task.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── services.js
│   │   ├── tasks.js
│   │   └── users.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── seed.js
│   └── .env.example
├── .gitignore
├── package.json
└── README.md
```

## 2. Requirements

Install:

1. VS Code
2. Node.js LTS
3. MongoDB Community Server OR a MongoDB Atlas database
4. Git (recommended)

Check Node/npm:

```bash
node -v
npm -v
```

## 3. Install dependencies

Open the `mikku-wad` folder in VS Code terminal:

```bash
npm install
```

## 4. Configure MongoDB

### Option A — Local MongoDB

Run MongoDB locally. The default connection used by this project is:

```text
mongodb://127.0.0.1:27017/mikku
```

### Option B — MongoDB Atlas

Create a database and put the connection string in `server/.env`.

Copy:

```text
server/.env.example
```

to:

```text
server/.env
```

Example:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/mikku
SESSION_SECRET=change-this-secret
```

## 5. Run

From the project root:

```bash
npm start
```

Open:

```text
http://localhost:5000
```

For automatic restart during development:

```bash
npm run dev
```

## 6. Demo data

After MongoDB is running:

```bash
npm run seed
```

Demo users:

- Student: `student1` / `student123`
- Teacher: `teacher1` / `teacher123`
- Society Head: `society1` / `society123`

## 7. Important educational note

The registration form collects a phone number and institutional ID card number. The starter project validates their format and stores them in MongoDB. It does **not** perform real OTP/college-ID verification.

For a production version, add an OTP provider and an institutional verification service.

## 8. WAD syllabus mapping

The application deliberately demonstrates the syllabus:

| Syllabus area | Where it appears |
|---|---|
| HTML structure, headings, links, forms, images, tables | `client/index.html` |
| CSS selectors, ID/class, box model, Flexbox/Grid, responsive design, transitions/animations | `client/styles.css` |
| JavaScript, DOM, events, form validation | `client/app.js` |
| jQuery selection, updating content, `.each()`, events | `client/app.js` |
| jQuery AJAX | `client/app.js` |
| HTTP requests and client/server architecture | `server/server.js` + route files |
| Server-side scripting | Express routes |
| Database | MongoDB + Mongoose |
| SVG | Loading icon is CSS/image based; SVG can be added to the logo area later |

## 9. Suggested next development stages

1. Finish and test authentication.
2. Add service editing/deletion.
3. Add full task-owner offer review and acceptance.
4. Add ratings/reviews.
5. Add admin dashboard.
6. Add real OTP verification.
7. Add file/image upload for portfolios.
8. Deploy frontend/backend and use MongoDB Atlas.
