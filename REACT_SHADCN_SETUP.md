# React + shadcn Setup For This Project

Your current project is static HTML/CSS/JS, so the TSX component cannot run yet.

## 1) Create React + TypeScript app (Vite)

```bash
cd "/Users/aloysius/Documents/New project"
npm create vite@latest . -- --template react-ts
npm install
```

## 2) Install Tailwind CSS

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Update `tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
} satisfies Config;
```

Update global CSS (usually `src/index.css`):

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

## 3) Initialize shadcn

```bash
npx shadcn@latest init
```

Recommended answers:
- TypeScript: `yes`
- Style: `Default`
- Base color: your choice
- CSS variables: `yes`
- Components path: `components`
- Utils path: `lib/utils`
- Tailwind config: `tailwind.config.ts`

## 4) Ensure aliases work

In `tsconfig.json` add:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

## 5) Install required dependency for this component

```bash
npm install lucide-react
```

## 6) Use the component

Files already added:
- `components/ui/interactive-hover-button.tsx`
- `components/ui/demo.tsx`
- `lib/utils.ts`

Example usage in app:

```tsx
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";

export default function App() {
  return (
    <main className="p-8">
      <InteractiveHoverButton text="Shop Now" />
    </main>
  );
}
```

## Why `/components/ui` matters

shadcn-generated and shared UI components are conventionally kept in `/components/ui` so:
- imports stay predictable (`@/components/ui/...`)
- generated components and custom UI live in one place
- future updates and team handoff are easier

## Notes about "use this for all buttons"

After migration to React:
1. Replace button usages with `InteractiveHoverButton` where appropriate.
2. For icon-only or tiny controls (e.g. cart quantity controls), keep simpler button variants for usability.
3. For forms and dialogs, use shadcn Button as base and this component as the CTA style variant.
