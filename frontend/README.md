# Trust Platform Frontend

This frontend is built with Vite, React, TypeScript, and Tailwind CSS.

## Frontend structure

- `src/components/ui`: reusable visual primitives such as buttons, badges, and inputs.
- `src/components/blocks`: composed product sections built from UI primitives and app-specific layout.
- `src/pages`: page-level assembly and state flow.
- `src/lib`: API helpers, shared types, constants, and utilities.

Keeping `ui` separate from `blocks` makes the codebase easier to scale: primitives stay broadly reusable, while product sections can evolve without turning low-level components into page-specific code.

## Local development

1. Open a terminal in `/frontend`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:5173`

The app is local-first and points to the backend at `http://localhost:8080`.

## Build

```bash
npm run build
```

## Preview

```bash
npm run preview
```
