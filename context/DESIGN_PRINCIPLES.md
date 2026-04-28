# Next.js Frontend Design Principles

This document outlines the core design and development principles for our Next.js 15 projects. Adhering to these guidelines ensures consistency, maintainability, and scalability across the application.

## 1. Component Architecture

Our component strategy is built around a clear hierarchy to maximize reusability and maintain a consistent look and feel.

### Component Source Priority:

1. **Custom Components** (`/components/custom`): Always check for an existing custom component that meets your needs first. Our custom library is the single source of truth for UI elements.

2. **shadcn/ui Components** (`/components/ui`): If a suitable custom component is not available, use a component from the shadcn/ui library. These are pre-styled, accessible components that ensure design consistency.

3. **Never Use Radix UI Directly**: Do not import or use Radix UI components directly. Always use shadcn/ui components instead, which are already built on top of Radix UI with our design system applied.

### Creating Custom Components:

- **Build on shadcn/ui**: New custom components should be built on top of shadcn/ui components, not Radix UI directly
- When a shadcn/ui component is used frequently with the same customizations (styles, props, logic), create a new custom component that wraps it
- Place all new custom components in the `/components/custom` directory
- Only use Radix UI primitives directly when absolutely necessary for custom components that require functionality not available in shadcn/ui (extremely rare)
- Replace all instances of heavily customized shadcn/ui components with new custom components to ensure consistency
- Use Server Components by default unless client-side interactivity is needed
- Mark components with `'use client'` directive only when necessary

### Page Components:

- Page-specific components can live under `/components` folder with appropriate structure:
  - `/components/dashboard/*` - Dashboard-specific components
  - `/components/resume/*` - Resume page components
  - `/components/job/*` - Job page components
  - `/components/application/*` - Application page components
- These components can combine multiple custom and shadcn/ui components for page-specific needs

## 2. Styling and Theming

A consistent visual identity is crucial. All styling should be managed centrally.

### Use Tailwind CSS:
- All styling must be done using Tailwind CSS utility classes
- Avoid writing custom CSS files or using the `style` attribute for layout and design
- Use the `cn()` utility from `/lib/utils` for conditional class names
- Leverage Tailwind's built-in responsive modifiers (sm:, md:, lg:, xl:, 2xl:)

### Centralized Color Palette:
- Never hardcode color values (e.g., `text-[#FF0000]`, `bg-blue-500`)
- All colors must be defined as CSS variables in `styles/globals.css` and mapped in `tailwind.config.js`
- Use semantic color tokens (e.g., `text-primary`, `bg-accent`, `border-muted`)
- Support dark mode with CSS variables that change based on `.dark` class or `data-theme` attribute

### Icons:
- Use `lucide-react` as the primary icon library for consistency
- Icons should be imported individually to optimize bundle size
- Set consistent icon sizes using Tailwind classes (e.g., `w-4 h-4`, `w-5 h-5`)

## 3. Forms and Data Handling

Standardizing how we handle forms and API data is key to a robust and predictable application.

### Form Management:
- Use `react-hook-form` for managing all form state, validation, and submissions
- Integrate `zod` for schema-based validation to ensure type safety and clear validation rules
- Create reusable form components that encapsulate common patterns
- Display inline validation errors using the form's error state
- Implement optimistic updates for better UX when appropriate

### API Integration & Data Fetching:
- Use **TanStack Query v5** (React Query) for all server-state management, including data fetching, caching, and synchronization
- Create custom hooks for API calls (e.g., `useGetUsers`, `useUpdatePost`) to encapsulate TanStack Query logic
- Implement proper error handling with retry logic and error boundaries
- Use React Suspense boundaries with TanStack Query's `suspense: true` option where appropriate
- Configure sensible defaults for `staleTime`, `gcTime`, and `refetchOnWindowFocus`

## 4. State Management

To avoid complexity, we follow a clear pattern for managing state.

### Local State:
- Use React's built-in hooks (`useState`, `useReducer`) for state that is local to a single component
- Prefer `useReducer` for complex state logic with multiple sub-values

### Shared & Persistent State:
- **Zustand**: Primary solution for global client-side state management
  - Use Zustand's `persist` middleware for localStorage persistence
  - Create separate stores for different domains (e.g., `useAuthStore`, `useUIStore`)
  - Leverage Zustand's subscriptions for fine-grained reactivity
  - Use selectors to prevent unnecessary re-renders

- **React Context**: Reserved for simple, low-frequency global state
  - Theme preferences
  - User authentication status
  - Feature flags
  - Avoid using Context for frequently changing data

### Server State:
- Always use TanStack Query for server state - never store server data in Zustand or Context
- Leverage TanStack Query's cache as the source of truth for server data

## 5. Code Quality and Consistency

Maintaining high code quality is a shared responsibility.

### TypeScript:
- Use TypeScript strict mode for all new code
- Define explicit types for props, API responses, and function parameters
- Leverage TypeScript's utility types (`Partial`, `Pick`, `Omit`, etc.)
- Use `satisfies` operator for better type inference where applicable
- Avoid `any` type - use `unknown` when type is truly unknown
- Create shared type definitions in `/types` directory

### Linting and Formatting:
- Adhere to the project's ESLint and Prettier rules
- Code must be free of linting errors before being committed
- Use husky and lint-staged for pre-commit hooks
- Configure VS Code to format on save

### File and Folder Structure:
```
/app              # Next.js App Router pages and layouts
  /(auth)         # Auth group with shared layout
  /(dashboard)    # Dashboard group with shared layout
/components       
  /ui             # shadcn/ui components
  /custom         # Custom reusable components
/hooks            # Custom React hooks
/lib              # Utility functions and configurations
  /api            # API client and endpoints
  /utils          # Helper functions
/styles           # Global CSS and theme files
/types            # TypeScript type definitions
/public           # Static assets
```

### Component Best Practices:
- Keep components under 200 lines when possible
- Extract complex logic into custom hooks
- Use composition over inheritance
- Implement proper loading and error states
- Add JSDoc comments for complex components
- Use descriptive variable and function names

### Performance Optimization:
- Use Next.js 15 Server Components by default
- Implement code splitting with dynamic imports
- Optimize images with `next/image` component
- Use `loading.tsx` and `error.tsx` files for better UX
- Implement proper caching strategies
- Monitor bundle size with `@next/bundle-analyzer`