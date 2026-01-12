# Idea Management System (IdeaFlow)

IdeaFlow is a simple internal idea management app where team members can submit improvement ideas and track their status, while team leads can review ideas, add comments, and approve/reject them.

This workspace contains both a backend (FastAPI) and a frontend (React + Vite). **The current frontend is designed to work in “frontend-only mode”** using `localStorage` for data, so you can run and demo the full workflow without a database.

## Features

### Role-based experience

- **Team member**
	- Create ideas
	- View “My Ideas” with status
	- Edit ideas until a final decision is made (approved/rejected)
	- See latest feedback comment from the team lead

- **Team lead**
	- View all ideas in the **Team Lead Dashboard**
	- Mark ideas **In Review**
	- **Approve** / **Reject** ideas
	- Add comments (feedback)

### Data storage (frontend-only)

- Users and ideas are stored in the browser using `localStorage`.
- This makes the app easy to run locally without a backend.

## Tech Stack

- React (UI)
- React Router (routing)
- Vite (dev server + build)
- LocalStorage (demo persistence)

## Project Structure

From the repository root:

```text
backend/                  # FastAPI backend (optional)
idea-management-frontend/ # React + Vite frontend (main app)
```

Frontend highlights:

```text
idea-management-frontend/src/
	api/
		auth.js               # Frontend-only auth helpers
		ideas.js              # Frontend-only ideas store (localStorage)
	components/
		navbar.jsx
		protectedroute.jsx
	pages/
		login.jsx
		register.jsx
		dashboard.jsx         # Team lead review dashboard
		CreateIdea.jsx        # Team member idea submission
		MyIdeas.jsx           # Team member idea list + edit
```

## How to Run (Frontend-only mode)

### Prerequisites

- Node.js 18+ (recommended)
- npm (comes with Node)

### Steps

1. Open a terminal in the repo root.
2. Go to the frontend folder:

	 ```bash
	 cd idea-management-frontend
	 ```

3. Install dependencies:

	 ```bash
	 npm install
	 ```

4. Start the dev server:

	 ```bash
	 npm run dev
	 ```

5. Open the URL shown in the terminal (usually one of these):
	 - `http://localhost:5173/`
	 - or `http://localhost:5174/`, `5175`, etc. (if ports are already in use)

## How to Use

### Register

1. Click **Register**
2. Enter name + email and choose a role:
	 - **Team member**
	 - **Team lead**

### Login

1. Click **Login**
2. Enter any email/password (demo mode)
3. Choose **Login as** role

Routing behavior:
- Team lead → goes to `/dashboard`
- Team member → goes to `/myideas`

### Team member workflow

- Go to **Create idea** → submit an idea
- Go to **My ideas** → view status, edit until approved/rejected

### Team lead workflow

- Go to **Dashboard** → view all submitted ideas
- Mark **In Review**, **Approve**, or **Reject**
- Add comments (team members will see the latest feedback)

## Reset Demo Data

Because this demo uses `localStorage`, you can reset everything by clearing site data:

- Chrome/Edge: DevTools → Application → Storage → Clear site data

Or delete these keys in localStorage:

- `ims_users`
- `ims_ideas`
- `token`, `role`, `email`, `name`

## Troubleshooting

- **Port already in use**: Vite will automatically try the next port and print the URL.
- **Changes not showing**: hard refresh the browser or restart `npm run dev`.

## Notes (Backend)

The `backend/` folder contains a FastAPI implementation intended for real database storage. The current frontend is configured for a frontend-only demo flow. If you later want full DB-backed auth + persistence, we can wire the frontend back to the API.
