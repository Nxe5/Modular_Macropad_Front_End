# Ocho Labs Macropad Frontend

A modern Svelte-based UI for configuring and controlling the Ocho Labs Modular Macropad.

## Features

- Configure macropad keys and layouts
- Customize LED lighting effects and colors
- Adjust macropad settings
- Edit raw configuration files
- Dark/Light mode support

## Technology Stack

- **Svelte 5** with TypeScript for UI
- **Tailwind CSS** for styling
- **shadcn-svelte** for UI components
- **Axios** for API requests
- **Socket.IO** for real-time communication
- **Lucide Icons** for beautiful SVG icons
- **Zod** for schema validation

## Development Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Project Structure

- `src/` - Source code
  - `lib/` - Reusable components and utilities
    - `components/` - Svelte components
  - `app.css` - Global styles and Tailwind configuration
  - `App.svelte` - Main application component

## License

© Ocho Labs. All rights reserved.
