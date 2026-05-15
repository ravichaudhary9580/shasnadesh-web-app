# Shasnadesh Frontend

A bilingual (Hindi + English) blog PWA built with React + TailwindCSS + Tiptap.

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx          # Public top nav
│   ├── BlogCard.jsx        # Blog card (featured + grid)
│   ├── SearchFilter.jsx    # Search bar + category pills + sort
│   └── admin/
│       ├── AdminLayout.jsx # Sidebar + layout for admin
│       └── RichEditor.jsx  # Tiptap rich text editor
├── context/
│   └── AuthContext.jsx     # JWT auth context
├── pages/
│   ├── Home.jsx            # Public blog listing
│   ├── BlogDetail.jsx      # Full blog reader
│   ├── Login.jsx           # Admin login
│   └── admin/
│       ├── Dashboard.jsx   # Stats + quick actions
│       ├── ManageBlogs.jsx # Blog CRUD table
│       ├── BlogEditor.jsx  # Create/Edit blog
│       └── Analytics.jsx  # Charts + analytics
├── services/
│   └── api.js              # Axios API layer
├── App.jsx                 # Routes
├── index.js                # Entry + SW registration
└── index.css               # Tailwind + global styles
```

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Edit .env and set your backend URL:
# REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Start dev server
```bash
npm start
```

### 4. Build for production
```bash
npm run build
```

## Deploy to Vercel
1. Push to GitHub
2. Import repo in Vercel
3. Set env var: `REACT_APP_API_URL=https://your-backend.vercel.app/api`
4. Deploy

## Features
- **Public**: Blog listing, search, filter by category, sort, infinite pagination
- **Blog reader**: Full content with images, PDFs, video, links, Hindi font support
- **Admin**: JWT-protected dashboard, analytics charts, blog CRUD table
- **Editor**: Tiptap rich editor — headings, bold/italic/underline, color, font family (Hindi + English fonts), image upload, YouTube embed, links, blockquotes, code blocks
- **PWA**: Service worker + manifest → installable on Android/iOS → APK via PWABuilder

## Convert to APK (Play Store)
1. Deploy frontend to a public HTTPS URL
2. Visit https://www.pwabuilder.com
3. Enter your URL → Generate → Download Android APK package
4. Upload to Google Play Console
