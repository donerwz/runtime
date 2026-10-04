# Runtime

<img src="images/runtimelogo.png">

A web application that helps people working on volunteer hours track their time conveniently and easily.

## Tools Used

- Tiger Data
- Gemini API

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- A Postgres + TimescaleDB database (we use Tiger Data)
- A Gemini API key

### 1. Clone the repo

```bash
git clone <repo-url>
cd runtime
```

### 2. Create your environment file

```bash
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Your Postgres connection string |
| `GEMINI_API_KEY` | Your Gemini API key |
| `SECRET_KEY` | Any random string |

### 3. Set up Python environment

```bash
python3 -m venv .venv

# macOS / Linux
source .venv/bin/activate

# Windows
.venv\Scripts\activate

pip install -r backend/requirements.txt
```

### 4. Run database migrations

```bash
python3 -m seed.run_migrations
```

### 5. Seed fake data (optional)

```bash
python3 -m seed.seed
```

Save the tokens it prints — you'll need them to log in.

### 6. Start the backend

```bash
uvicorn backend.main:app --reload
```

Backend runs at `http://localhost:8000`. Check `http://localhost:8000/health` to verify.

### 7. Start the dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard runs at `http://localhost:5173`. Log in with your supervisor token.

### 8. Run the desktop agent (optional)

```bash
# From the root of the repo with .venv active
pip install -r agent/requirements.txt
python3 -m agent.main
```

A tray icon will appear. Click it → **Set Token** → paste a volunteer token → select apps to track.
