# MinimalistHero Integration Notes

Current project status:
- This repo is currently static HTML/CSS/JS.
- It does **not** yet run React + TypeScript + Tailwind + shadcn components.

Files added now:
- `components/ui/minimalist-hero.tsx`
- `components/ui/demo.tsx`

## Required dependencies
- `lucide-react`
- `framer-motion`

Install (after React project init):
```bash
npm install lucide-react framer-motion
```

## Why `/components/ui` is important
Use `/components/ui` for shared primitives and reusable design-system components because:
- predictable imports: `@/components/ui/...`
- aligns with shadcn conventions and generated code
- easier maintenance and component discovery

## If project is not setup yet (this repo currently)

### 1) Initialize React + TypeScript + Tailwind
```bash
cd "/Users/aloysius/Documents/New project"
npm create vite@latest . -- --template react-ts
npm install
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### 2) Tailwind config
Set `tailwind.config.ts` content paths:
- `./index.html`
- `./src/**/*.{ts,tsx}`
- `./components/**/*.{ts,tsx}`

### 3) shadcn init
```bash
npx shadcn@latest init
```
Recommended:
- components path: `components`
- utils path: `lib/utils`
- Tailwind css file: your main global css

### 4) TS path alias
In `tsconfig.json`, ensure:
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

## Questions to confirm before full rollout
1. What props/text should be fixed vs dynamic for your brand?
2. Should mobile keep the same full-screen hero or a shorter stacked variant?
3. Do you want global state (menu open/cart) wired into this hero?
4. Which page should this hero replace first (`index` only)?
5. Should the social icons link to real URLs now?

## Suggested first placement
- Use this component in your React `App.tsx` for home page first.
- Then extract current static home content into React sections.
