# Youth Scrapbook AI Generator UI

This is a React + TypeScript + Tailwind CSS implementation of the "Youth Scrapbook AI Generator" UI interface.

## Features

- **Upload Page**: Clean, drag-and-drop style upload interface with pastoral aesthetics.
- **Loading Page**: Animated loading state with healing messages.
- **Editor Page**: 
  - Drag-and-drop functionality for elements.
  - Sidebar with tabs (Images, Decorations, Text, Doodles, Backgrounds).
  - Canvas area for composition.
- **Responsive Design**: Adapts to different screen sizes.

## Tech Stack

- React 19
- TypeScript
- Tailwind CSS
- Lucide React (Icons)
- Vite

## How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development server:
   ```bash
   npm run dev
   ```

3. Open your browser at the provided URL (usually `http://localhost:5173`).

## Usage Flow

1. **Upload**: Click "Select Image" or the upload card to simulate an image upload.
2. **Loading**: Watch the loading animation (simulated for 3 seconds).
3. **Editor**: Drag elements from the sidebar onto the canvas. Switch tabs to see different items.
4. **Export**: Once in the editor, the "Export PDF" button in the top bar becomes enabled.
