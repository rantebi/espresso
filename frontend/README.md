# Trial Issue Log - Frontend

A React + TypeScript frontend application for viewing and managing clinical trial site visit issues.

## Features

- **Issue List Display**: View all issues in a clean, card-based layout
- **Infinite Scroll**: Automatically loads 10 issues at a time as you scroll
- **Multiple Pages**: 
  - Home page (`/`) - Displays issue list
  - Issues page (`/issues`) - Dedicated issues page
- **Responsive Design**: Works on desktop and mobile devices
- **Real-time Updates**: Fetches data from the backend API

## Prerequisites

- Node.js (LTS version 20.x or higher recommended)
- npm (comes with Node.js)
- Backend API running on `http://localhost:3000`

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

## Running the Application

### Development Mode

Start the development server:
```bash
npm run dev
```

The application will start on `http://localhost:5173` (or the next available port).

The Vite dev server is configured to proxy API requests to `http://localhost:3000/api`.

### Production Build

1. Build the application:
```bash
npm run build
```

2. Preview the production build:
```bash
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── IssueList.tsx        # Issue list component with infinite scroll
│   │   └── IssueList.css         # Styles for issue list
│   ├── pages/
│   │   ├── Home.tsx             # Home page
│   │   ├── Home.css
│   │   ├── Issues.tsx           # Issues page
│   │   └── Issues.css
│   ├── services/
│   │   └── api.ts               # API service for backend communication
│   ├── types/
│   │   └── index.ts             # TypeScript type definitions
│   ├── App.tsx                   # Main app component with routing
│   ├── App.css                   # App styles
│   ├── main.tsx                  # Application entry point
│   └── index.css                 # Global styles
├── index.html                    # HTML template
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json
└── README.md
```

## Features Explained

### Infinite Scroll

The `IssueList` component implements infinite scroll using the Intersection Observer API:

- Loads 10 issues per page
- Automatically fetches the next page when the user scrolls near the bottom
- Shows loading indicator while fetching
- Displays "No more issues" message when all issues are loaded

### API Integration

The frontend communicates with the backend API through the `issueService`:

- `getIssues(page, pageSize)` - Fetches paginated list of issues
- `getIssueById(id)` - Fetches a single issue by ID

API base URL can be configured via `VITE_API_URL` environment variable (defaults to `http://localhost:3000/api`).

## Environment Variables

Create a `.env` file in the frontend directory (optional):

```env
VITE_API_URL=http://localhost:3000/api
```

## Styling

The application uses CSS modules and custom CSS for styling:

- **Color Scheme**: Clean, modern design with color-coded severity and status badges
- **Responsive**: Mobile-friendly layout that adapts to different screen sizes
- **Accessibility**: Proper semantic HTML and ARIA attributes

## Development

### Tech Stack

- **React 19** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Axios** - HTTP client for API requests

### Code Quality

- TypeScript strict mode enabled
- Component-based architecture
- Reusable components
- Type-safe API integration

## Troubleshooting

### API Connection Issues

If you see "Failed to load issues":
1. Ensure the backend server is running on `http://localhost:3000`
2. Check that CORS is enabled on the backend
3. Verify the API URL in `.env` file or `vite.config.ts`

### Port Already in Use

If port 5173 is already in use, Vite will automatically use the next available port.

### Build Errors

If you encounter build errors:
1. Ensure all dependencies are installed: `npm install`
2. Check TypeScript errors: `npm run build`
3. Clear node_modules and reinstall if needed

## Next Steps

Future enhancements could include:
- Filtering and search functionality
- Issue detail view
- Create/edit issue forms
- Dashboard with statistics
- CSV import interface

