# Workshops Page Components

This directory contains all components for the Pearl Wishes Studio Workshops page, following a minimal grayscale wireframe design with sharp edges and clean lines.

## Design Specifications

### Desktop Frame
- **Width**: 1440px
- **Height**: ~4200px
- **Grid**: 12 columns
- **Margins**: 80px (left/right)
- **Gutter**: 24px

### Mobile Frame
- **Width**: 390px
- **Height**: ~5200px
- **Grid**: 4 columns
- **Margins**: 20px (left/right)
- **Gutter**: 16px

### Global Design System
- **Spacing**: 8px increments
- **Corner Radius**: 0px (sharp edges)
- **Font**: Montserrat
- **Colors**: Grayscale palette only
- **Button Height**: 44px (h-11 in Tailwind)
- **Input Height**: 44px (h-11 in Tailwind)

## Reusable Components

### 1. Top Navigation (`WorkshopsNavbar.tsx`)
- Fixed position navbar
- Active state shows "Workshops" tab
- Mobile hamburger menu
- Responsive design

### 2. Button Variants (`ButtonVariants.tsx`)
- **Primary**: Dark background (gray-800), white text
- **Secondary**: Border outline, gray text
- **Tertiary**: Link style with underline
- All variants: 44px height, disabled states

### 3. Input Field (`InputField.tsx`)
- **States**: Default, With Icon, Error
- Height: 44px
- Icon positioning: Left-aligned
- Error indicators with icon

### 4. Dropdown (`FilterSection.tsx`)
- Closed/Open states
- Animated chevron rotation
- Clean dropdown menu

### 5. Filter Chip (`FilterChip.tsx`)
- Default/Selected states
- Height: 32px (h-8)
- Used for filtering by Level and Topic

### 6. Tag/Pill (`Tag.tsx`)
- **Variants**:
  - Level: Light gray (e.g., "Beginner", "Advanced")
  - Topic: Medium gray (e.g., "Gel Techniques", "Nail Art")
  - Status: Dark gray/black (e.g., "Sold Out")

### 7. Workshop Card (`WorkshopCard.tsx`)
- Default/Hover states
- Sold-out overlay
- Gray placeholder image (200px height)
- Workshop details with icons
- Price and CTA button

### 8. Instructor Card (`InstructorCard.tsx`)
- Photo placeholder (256px height)
- Name, title, specialties
- Stats: experience years, workshops taught
- Profile link button

### 9. Section Header
Used throughout the page:
- Eyebrow text (uppercase, tracking-wider, gray-500)
- Main title (text-4xl, gray-900)
- Subtitle (text-lg, gray-600)

### 10. Accordion Item (`AccordionItem.tsx`)
- Collapsed/Expanded states
- Animated chevron
- Used for FAQ and Policies sections

### 11. Pagination
- Previous/Next buttons
- Numbered page buttons
- Active state styling
- Disabled states

## Page Sections

### 1. Hero Section (`WorkshopHero.tsx`)
- Large title and description
- Two CTA buttons (primary + secondary)
- Gray background (bg-gray-50)

### 2. Filter Section (`FilterSection.tsx`)
- Search input with icon
- Date dropdown
- Filter chips for Level and Topic
- Responsive layout

### 3. Workshop Grid (`WorkshopGrid.tsx`)
- 3-column grid on desktop
- 2-column on tablet
- 1-column on mobile
- Pagination controls
- Dynamic filtering

### 4. Instructor Section (`InstructorSection.tsx`)
- 4-column grid on desktop
- 2-column on tablet
- 1-column on mobile
- Instructor cards

### 5. FAQ Section (`WorkshopFAQ.tsx`)
- Two-column layout (FAQs + Policies)
- Accordion components
- Responsive stack on mobile

## Color Palette (Grayscale)

```css
/* Backgrounds */
bg-white         /* #ffffff */
bg-gray-50       /* Very light gray */
bg-gray-100      /* Light gray */
bg-gray-200      /* Image placeholders */
bg-gray-800      /* Primary buttons */
bg-gray-900      /* Button hover, active text */

/* Borders */
border-gray-200  /* Light borders */
border-gray-300  /* Default borders */
border-gray-400  /* Medium borders */

/* Text */
text-gray-500    /* Eyebrow, icons */
text-gray-600    /* Body text, subtitles */
text-gray-700    /* Secondary text, labels */
text-gray-800    /* Dark text */
text-gray-900    /* Primary headings */
```

## Usage Example

```tsx
import Workshops from './pages/Workshops';

// In your router
{
  path: "/workshops",
  Component: Workshops,
}
```

## Component Props

See individual component files for detailed prop interfaces. All components use TypeScript for type safety.

## Responsive Breakpoints

Following Tailwind's default breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1023px
- **Desktop**: ≥ 1024px

## Notes

- All images are gray placeholders to maintain wireframe aesthetic
- No curved elements - all corners are sharp (0px radius)
- Spacing follows strict 8px system
- Montserrat font family used throughout
- Hover states on interactive elements
- Clean, minimal design philosophy
