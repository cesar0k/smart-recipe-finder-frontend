# Smart Recipe Finder (Frontend)

Backend – [Smart Recipe Finder Backend](https://github.com/cesar0k/smart-recipe-finder)

## Tech Stack

- **Core:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/).
- **State Management & Data Fetching:** [TanStack Query (React Query)](https://tanstack.com/query) for server state, and [Zustand](https://zustand-demo.pmnd.rs/) for global client state.
- **Routing:** [React Router v7](https://reactrouter.com/).
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives).
- **Forms & Validation:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/).
- **API Client:** [Orval](https://orval.dev/) - automatic TypeScript hook generation from OpenAPI spec.

## Features

- **Recipe Management:** Create, read, update, and delete recipes.
- **Smart Search:** Search for recipes by name, and filter by ingredients to include or exclude.
- **Internationalization:** Support for multiple languages (English and Russian).

## Project Structure

```text
src/
├── api/             # Auto-generated API hooks and models (Orval)
│   ├── model/       # API model definitions
│   ├── recipes/     # API hooks for recipes
│   └── root/        # API hooks for root
├── components/      # Shared UI components (Buttons, Inputs, Skeletons)
│   ├── layout/      # Layout components (e.g., Footer)
│   ├── skeletons/   # Skeleton components (e.g., RecipeCardSkeleton)
│   └── ui/          # shadcn/ui components
├── features/        # Business logic divided by domain
│   └── recipes/     # All recipe-related components, hooks, and types
│       ├── components/ # Recipe-specific components
│       ├── hooks/      # Recipe-specific hooks
│       ├── lib/        # Recipe-specific utilities
│       └── types/      # Recipe-specific types
├── pages/           # Page layout components (HomePage, RecipePage)
├── locales/         # Localization files (e.g., en.json, ru.json)
└── lib/             # Utilities and helpers
```

## Getting Started

### Prerequisites

- Node.js (v20+)
- The backend service running (locally or remotely).

### 1. Clone the repository

```bash
git clone https://github.com/cesar0k/smart-recipe-finder-frontend.git
cd smart-recipe-finder-frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Create a `.env` file in the root directory:

```env
# URL of your backend API
VITE_API_URL=http://localhost:8000
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## API Code Generation

This project uses **Orval** to generate React Query hooks based on the backend's `openapi.json`. You don't need to write `fetch` requests manually.

If the backend API changes:

1. Ensure the backend is running at the URL specified in `.env`.
2. Run the generation command:

```bash
npm run gen:api
```

This will update `src/api/recipes/recipes.ts` and TypeScript interfaces.
