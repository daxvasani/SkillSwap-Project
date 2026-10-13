# SkillSwap — Backend MVP

A simple Node.js + Express + MongoDB backend for the SkillSwap college skill-exchange platform.
Built to be easy to read, run, and explain in a viva — not a production system.

---

## 1. What Was Implemented

- **Authentication**: register, login, JWT-based sessions, `GET /api/auth/me`
- **User profiles**: view any user, update your own profile
- **Skills**: post/edit/delete a skill you can teach, browse/search/filter all skills
- **Same-college restriction**: swap requests are only allowed between students from the same college
- **Swap requests**: send, accept, reject, cancel, complete — with authorization checks (only the receiver can accept/reject, only the sender can cancel)
- **Bookings**: schedule a session for an accepted swap, with a basic overlap check so a student can't double-book the same time slot
- **Reviews & ratings**: rate a completed session (1–5 stars); the reviewed user's average rating (and their skill's rating) is recalculated automatically
- **Notifications**: a database-backed notification is created automatically for every important event (new swap request, accepted/rejected, new booking, session completed, review received)
- **Frontend integration**: `script.js` was rewritten to call the real API instead of using hard-coded data and fake login; a small dashboard (Profile / My Skills / Swaps / Bookings / Notifications) and a few modals were added using the existing design system — no redesign, no new framework

---

## 2. Final Folder Structure

```
SkillSwap/
│
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── script.js
│
└── backend/
    ├── server.js
    ├── package.json
    ├── .env.example
    ├── .gitignore
    ├── seed.js
    ├── README.md
    │
    ├── config/
    │   └── db.js
    │
    ├── models/
    │   ├── User.js
    │   ├── Skill.js
    │   ├── SwapRequest.js
    │   ├── Booking.js
    │   ├── Review.js
    │   └── Notification.js
    │
    ├── routes/
    │   ├── authRoutes.js
    │   ├── userRoutes.js
    │   ├── skillRoutes.js
    │   ├── swapRoutes.js
    │   ├── bookingRoutes.js
    │   ├── reviewRoutes.js
    │   └── notificationRoutes.js
    │
    ├── controllers/
    │   ├── authController.js
    │   ├── userController.js
    │   ├── skillController.js
    │   ├── swapController.js
    │   ├── bookingController.js
    │   ├── reviewController.js
    │   └── notificationController.js
    │
    └── middleware/
        └── authMiddleware.js
```

---

## 3. Installation Commands

From the `backend/` folder:

```bash
cd backend
npm install
```

This installs: `express`, `mongoose`, `bcryptjs`, `jsonwebtoken`, `cors`, `dotenv`, and `nodemon` (dev only).

---

## 4. MongoDB Setup

You need a running MongoDB instance. Either:

- **Local MongoDB** — install MongoDB Community Server and run it (`mongod`). Default URI: `mongodb://127.0.0.1:27017/skillswap`
- **MongoDB Atlas (cloud, free tier)** — create a cluster at mongodb.com, create a database user, get the connection string, and use it as `MONGO_URI`

---

## 5. .env Setup

Copy the example file and fill in your own values:

```bash
cp .env.example .env
```

`.env`:
```
MONGO_URI=mongodb://127.0.0.1:27017/skillswap
JWT_SECRET=replace_this_with_a_long_random_secret
PORT=5000
```

Never commit `.env` — it's already in `.gitignore`.

---

## 6. How to Start the Backend

```bash
cd backend
npm install
npm run dev        # uses nodemon, auto-restarts on changes
```
or
```bash
npm start           # plain node
```

You should see:
```
✅ MongoDB connected
🚀 SkillSwap backend running on http://localhost:5000
```

**Optional — seed sample data** (a few students and skills, some sharing the same college so you can demo swaps):
```bash
npm run seed
```
All seeded users share the password `password123`. Example login: `ananya@parul.edu` / `password123`.

---

## 7. How to Start the Frontend

The frontend is plain HTML/CSS/JS, no build step. Open `frontend/index.html` with **VS Code Live Server** (or any static server). Do not open it as a `file://` URL directly if you hit CORS issues — Live Server avoids that.

Make sure the backend is running on `http://localhost:5000` first — the frontend calls it directly.

---

## 8. How Frontend Connects to Backend

`script.js` defines:
```js
const API_URL = "http://localhost:5000/api";
```

Every action (login, browsing skills, sending a swap request, etc.) calls `fetch()` against this URL. The JWT returned at login/signup is stored in `localStorage` under `skillswap_token` and sent as `Authorization: Bearer <token>` on every request that needs it.

---

## 9. API List

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | No | Create an account |
| POST | /api/auth/login | No | Log in, get a JWT |
| GET | /api/auth/me | Yes | Get the logged-in user |
| GET | /api/users/:id | No | Get a user's public profile |
| PUT | /api/users/profile | Yes | Update your own profile |
| GET | /api/skills | No | List/search/filter skills |
| GET | /api/skills/:id | No | Get one skill |
| POST | /api/skills | Yes | Post a new skill |
| PUT | /api/skills/:id | Yes | Edit your own skill |
| DELETE | /api/skills/:id | Yes | Delete your own skill |
| POST | /api/swaps | Yes | Send a swap request (same-college only) |
| GET | /api/swaps/my | Yes | Requests you sent |
| GET | /api/swaps/received | Yes | Requests sent to you |
| GET | /api/swaps/:id | Yes | Get one swap request |
| PUT | /api/swaps/:id/accept | Yes | Receiver accepts |
| PUT | /api/swaps/:id/reject | Yes | Receiver rejects |
| PUT | /api/swaps/:id/cancel | Yes | Sender cancels |
| PUT | /api/swaps/:id/complete | Yes | Either participant marks complete |
| POST | /api/bookings | Yes | Book a session for an accepted swap |
| GET | /api/bookings/my | Yes | Your bookings |
| GET | /api/bookings/:id | Yes | Get one booking |
| PUT | /api/bookings/:id/cancel | Yes | Cancel a booking |
| PUT | /api/bookings/:id/complete | Yes | Mark a session completed |
| POST | /api/reviews | Yes | Review a completed session |
| GET | /api/reviews/user/:userId | No | Reviews for a user |
| GET | /api/notifications | Yes | Your notifications |
| PUT | /api/notifications/:id/read | Yes | Mark one as read |
| PUT | /api/notifications/read-all | Yes | Mark all as read |

---

## 10. How Authentication Works

1. `POST /api/auth/register` hashes the password with **bcryptjs** and saves the user.
2. Both register and login return a **JWT** (`jsonwebtoken`), signed with `JWT_SECRET`, valid for 7 days.
3. The frontend stores the token in `localStorage`.
4. Protected routes use `middleware/authMiddleware.js`, which reads the `Authorization: Bearer <token>` header, verifies it, and attaches `req.user.id` — so controllers always know who's logged in **from the token**, never from data the frontend sends.

---

## 11. How Swap Requests Work

A student browsing skills clicks **Request Swap** on someone else's listing. The frontend opens a modal asking what skill they're offering, what they want to learn, and an optional message, then calls `POST /api/swaps`. The backend looks up the skill owner, checks the same-college rule (see §16), and creates a `SwapRequest` with status `pending`. A notification is created for the receiver.

---

## 12. How Accept/Reject Works

The receiver sees incoming requests under **Swaps → Received**. `PUT /api/swaps/:id/accept` or `/reject` checks that `req.user.id` really is the `receiverId` on that request before changing its status — so nobody else can accept/reject on someone's behalf. Accepting notifies the sender and unlocks the **Schedule Session** button.

---

## 13. How Notifications Work

Every important action (new request, accepted, rejected, new booking, session completed, review received) calls a shared helper, `createNotification()`, which just writes a `Notification` document. There's no WebSocket/real-time layer — the frontend simply calls `GET /api/notifications` whenever the dashboard or notification bell is opened, which is enough for this MVP (real-time push is listed under Phase 2).

---

## 14. How Booking Works

Once a swap is `accepted`, either participant can open the **Schedule Session** modal (date, start/end time, online/offline, notes) which calls `POST /api/bookings`. The backend re-checks that the swap really is `accepted`, then runs a simple overlap check: it looks for any other `scheduled` booking involving either participant on the same date where the time ranges overlap, and rejects the booking if one is found.

---

## 15. How Rating/Review Works

After a booking is marked `completed`, either participant can leave a review from **Bookings**. `POST /api/reviews` checks the booking is completed, that this reviewer hasn't already reviewed this exact booking, saves the review, then recalculates the reviewed user's `avgRating` and `totalReviews` from every review they've ever received, and updates their skill's rating too. The reviewed user gets a notification.

---

## 16. How the Same-College Restriction Works

When `POST /api/swaps` runs, it fetches both the sender's and the skill owner's `college` field and compares them (case-insensitively, trimmed). If they don't match, the request is rejected with:
```json
{ "message": "You can only swap skills with students from your college." }
```
This is enforced **server-side**, so it can't be bypassed by editing frontend code.

---

## 17. How to Test Everything Using Postman

1. **Register**: `POST http://localhost:5000/api/auth/register` with JSON body `{ firstName, lastName, email, password, college, year }`. Copy the `token` from the response.
2. Register a **second** user with the **same college** (to test swaps) and a **third** with a different college (to test the rejection).
3. **Post a skill**: `POST /api/skills`, header `Authorization: Bearer <token of user 1>`, body `{ skill, description, category, tags }`.
4. **Log in as user 2**, then `POST /api/swaps` with `{ skillId, offeredSkill, requestedSkill, message }` — should succeed (same college).
5. Try the same from **user 3** (different college) — should return the same-college error.
6. **Accept**: log in as user 1 (the skill owner/receiver), `PUT /api/swaps/:id/accept`.
7. **Book**: `POST /api/bookings` with `{ swapRequestId, date, startTime, endTime, mode, notes }`.
8. **Complete**: `PUT /api/bookings/:id/complete`.
9. **Review**: `POST /api/reviews` with `{ bookingId, rating, comment }`.
10. **Notifications**: `GET /api/notifications` as any user who was involved in the above steps — you should see entries for each action.

---

## 18. Which Frontend Files Were Changed

- `script.js` — fully rewritten: real API calls instead of hard-coded skills and fake login; added dashboard/modal logic
- `index.html` — added: a `year` field on signup, a logged-in nav state (account button, notification bell, logout), and five new modals (Dashboard, Post Skill, Swap Request, Booking, Review), all built with the existing modal/form markup
- `styles.css` — only additive changes: a small block of new rules for the dashboard list items, status pills, notification badge, and star rating input, appended at the end. Nothing existing was removed or restyled.

---

## 19. What Remains — Future Development

### Phase 2
- Smarter skill matching / recommendations
- Real-time notifications via Socket.IO
- Richer availability management (recurring slots, calendar view)

### Phase 3
- Video calling for online sessions
- Google Calendar / Outlook integration
- Payments (if the platform ever needs paid add-ons)

### Phase 4
- Admin dashboard
- User moderation & reporting
- Analytics dashboard

---

## 20. Viva Questions & Answers

**Q: Why did you hash passwords with bcrypt instead of storing them as plain text?**
A: Plain-text passwords are a major security risk if the database is ever leaked. bcrypt applies a one-way hash with a salt, so even Anthropic — I mean, even I — can't reverse it back to the original password; login just compares hashes.

**Q: How does the backend know who's making a request?**
A: From the JWT sent in the `Authorization` header, not from anything the frontend puts in the request body. `authMiddleware.js` verifies the token and sets `req.user.id`, which every controller trusts instead of a client-supplied user id.

**Q: Why store `college` on both `User` and `Skill`?**
A: So skill browsing/filtering by college doesn't need an extra database join (`populate`) every time — it's a small denormalization for read performance, common in simple MVPs.

**Q: How do you prevent double-booking?**
A: `bookingController.createBooking` queries for any other `scheduled` booking on the same date involving either participant where `startTime < newEndTime AND endTime > newStartTime` — the standard interval-overlap check.

**Q: Why not use WebSockets for notifications now?**
A: The MVP scope explicitly avoids it — notifications are just documents fetched with a normal `GET` when the user opens the panel. It's simpler to build, simpler to explain, and good enough for a college project demo. Socket.IO is listed as Phase 2.

**Q: What stops someone from accepting their own swap request?**
A: Two things: `createSwapRequest` rejects self-swaps (`receiverId === req.user.id`) up front, and `acceptSwap` additionally checks `swap.receiverId.toString() === req.user.id`, so even a modified request couldn't be accepted by the sender.

**Q: How is the average rating recalculated?**
A: `reviewController.createReview` fetches every review ever written about that user, averages the `rating` field, rounds to one decimal, and saves it back onto the `User` document (and the related `Skill` if applicable) — recomputed from scratch each time rather than incrementally updated, which is simpler and avoids drift.

**Q: Why Mongoose instead of the raw MongoDB driver?**
A: Mongoose gives schema validation (e.g. `enum` for status fields, `required` fields) and a simpler query API, which keeps the controllers short and readable — good for a project you need to explain, not a place to hand-roll validation.

**Q: What would you change if this became a real product?**
A: Move file/image uploads off base64 strings onto a storage service, add rate limiting and stronger input validation, add real-time notifications, and split the same-college check into a reusable service in case more rules get added later (e.g. year-level restrictions).
