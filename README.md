# Smart Recipe Finder — Frontend

React + TypeScript SPA for a recipe platform with semantic search, ratings, comments, follows, and real-time notifications.

Backend — [smart-recipe-finder-backend](https://github.com/cesar0k/smart-recipe-finder-backend)

## Tech Stack

| | |
|---|---|
| Core | React 19, TypeScript, Vite |
| Server state | TanStack Query (React Query) |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix UI) |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |
| API client | Orval (auto-generated hooks from OpenAPI spec) |
| i18n | i18next + browser language detection |
| Auth | JWT in memory + refresh token in localStorage |
| Real-time | WebSocket with auto-reconnect and exponential backoff |

## Features

### Recipes

- Browse, search, and filter recipes.
- Create, edit, and delete own recipes.
- Draft/moderation workflow — see status badges (pending, approved, rejected, has pending draft).
- Image gallery (up to 5 photos per recipe) with thumbnail lazy-loading.
- Similar recipes sidebar.
- Category shelves on the home feed.

### Search & Discovery

- Natural-language semantic search.
- Ingredient include/exclude filters.
- Sort by: newest, popular, top rated, most favorited.
- Filter by cooking time, difficulty, cuisine, and more.

### Engagement

- Star ratings (1–5) with animated button and live average.
- Threaded comments with reply, delete, and report actions.
- Favorites with animated heart button and count.
- Follow/unfollow authors with debounced requests and optimistic UI.
- Follower and following list pages per profile.

### User System

- Registration and login (local credentials or Google OAuth2).
- Public and own profile pages with recipe lists, follower counts, and follow button.
- Avatar upload with in-browser crop dialog.
- Email verification banner (soft — does not block access).
- Password reset via email link.
- Email change with confirmation to new address.
- Language preference for transactional and notification emails (`ru` / `en`).

### Notifications

- Real-time in-app notification panel (WebSocket).
- Infinite scroll inside the dropdown.
- Unread count badge.
- Notifications for: new comment, comment reply, recipe approved/rejected, draft approved/rejected, new follower, new recipe from followed author, recipe deleted, new pending recipe (moderators).
- Per-type email notification toggles in profile settings.

### Moderation

- Moderation queue for pending recipes and reported comments.
- Inline approve/reject with optional rejection reason.
- Moderators and admins see role badge on profiles.

## Getting Started

### Prerequisites

- Node.js 20+
- Backend running at `http://localhost:8001` (or configure `VITE_API_URL`).

### 1. Clone and install

```bash
git clone https://github.com/cesar0k/smart-recipe-finder-frontend.git
cd smart-recipe-finder-frontend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Key variables:

```dotenv
VITE_API_URL=http://localhost:8001
VITE_WS_URL=ws://localhost:8001        # optional, derived from API URL if omitted
VITE_GOOGLE_CLIENT_ID=                 # optional, enables Google sign-in button
```

### 3. Start dev server

```bash
npm run dev
```

App available at `http://localhost:5173`.

## API Code Generation

API hooks are auto-generated from the backend's OpenAPI spec using Orval. Never edit files inside `src/api/` manually.

```bash
npm run gen:api
```

Requires the backend to be running (falls back to the committed `openapi.json` snapshot if unreachable).

## Project Structure

```
src/
├── api/                  # Auto-generated hooks and models (Orval) — do not edit
├── components/           # Shared UI (layout, skeletons, shadcn/ui wrappers)
├── features/
│   ├── recipes/          # Recipe components, hooks, and utilities
│   │   ├── components/   # RecipeCard, FavoriteButton, StarRatingButton, RecipeComments…
│   │   └── hooks/        # useUpdateRecipeInCaches, useHomeRecipes…
│   ├── profile/          # EmailVerificationBanner
│   └── users/            # FollowButton
├── hooks/                # Shared hooks (useDismissSplash, useNotificationWS…)
├── lib/
│   ├── auth/             # AuthContext, token storage
│   ├── ws/               # WebSocket client with reconnect logic
│   └── i18n.ts           # i18next setup with browser language detection
├── locales/              # en.json, ru.json
└── pages/                # Route-level components (lazy-loaded)
```
