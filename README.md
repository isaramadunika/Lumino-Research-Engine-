# LuMino Research Engine

A modern design research platform built with Next.js, React, TypeScript, and Tailwind CSS.

## ✅ Project Setup Complete

This project has been successfully configured with:

- **Next.js 15** - React framework for production
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui Ready** - Component library structure

## 📁 Project Structure

```
LuMino Reserach Engine/
├── app/
│   ├── layout.tsx           # Root layout component
│   ├── page.tsx             # Home page
│   ├── demo/
│   │   └── page.tsx         # Hero component demo page
│   └── globals.css          # Global Tailwind styles
├── components/
│   └── ui/
│       └── hero-ascii.tsx   # Hero component with UnicornStudio integration
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── next.config.js           # Next.js configuration
└── postcss.config.js        # PostCSS configuration
```

## 🚀 Running the Project

### Development Server

The development server is already running at `http://localhost:3000`

To manually start:

```bash
npm run dev
```

Visit:
- **Home Page**: `http://localhost:3000`
- **Hero Demo**: `http://localhost:3000/demo`

### Production Build

```bash
npm run build
npm start
```

## 📦 Installed Dependencies

- **next**: ^15.0.0
- **react**: ^18.3.1
- **react-dom**: ^18.3.1
- **tailwindcss**: ^3.4.1
- **typescript**: ^5.3.3
- **autoprefixer**: ^10.4.16
- **postcss**: ^8.4.32

## 🎨 Hero Component Features

The `hero-ascii.tsx` component includes:

✨ **Features:**
- UnicornStudio animation integration
- Responsive design (mobile & desktop)
- Tailwind CSS styling
- ASCII/technical aesthetic
- Animated elements
- Mobile-optimized stars background
- Desktop Vitruvian animation

### Component Props

Currently, the component doesn't accept props - it's a self-contained hero section. To customize:

1. Edit the UnicornStudio project ID in `data-us-project="whwOGlfJ5Rz2rHaEUgHl"`
2. Modify text content and styling classes
3. Adjust animations in the CSS-in-JS sections

## 🛠️ Adding New Components

To add more UI components using shadcn/ui:

```bash
npx shadcn-ui@latest add [component-name]
```

## 📝 Important Notes

### Component Path Convention

Components are located in `/components/ui/` following shadcn/ui conventions:
- This structure ensures consistency when adding more shadcn components
- Allows for organized component management
- Simplifies imports using the `@/components/ui/` path alias

### Tailwind CSS

All styles use Tailwind CSS utility classes. The configuration is set up in `tailwind.config.ts` and includes:
- Container queries support
- Custom color schemes capability
- Animation utilities
- Responsive design breakpoints

### TypeScript

The project uses strict TypeScript mode for type safety. All files should use `.tsx` for JSX components.

## 🔗 Useful Links

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 🐛 Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
npm run dev -- -p 3001
```

### Dependencies Not Installing

Clear cache and reinstall:

```bash
rm -r node_modules package-lock.json
npm install
```

### Build Errors

Ensure TypeScript is compiling correctly:

```bash
npx tsc --noEmit
```

## 📄 License

This project is ready for development. Customize as needed for your use case.

---

**Last Updated**: October 31, 2025
