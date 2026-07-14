# Public Assets Directory

This folder contains all static assets that are publicly accessible in the application.

## Structure

```
/public
├── images/           # All image assets
│   ├── hero/        # Hero section images
│   ├── services/    # Service-related images
│   ├── lookbook/    # Lookbook gallery images
│   ├── team/        # Team member photos
│   └── testimonials/ # Customer testimonial photos
├── fonts/           # Custom fonts (if needed)
└── favicon.ico      # Site favicon
```

## Usage

### Images
All images in the public folder can be referenced directly:

```tsx
// Direct reference
<img src="/images/hero/banner.jpg" alt="Banner" />

// Using the centralized config (recommended)
import { IMAGES } from '../config/assets';
<img src={IMAGES.hero.banner} alt="Banner" />
```

### Icons
Icons are managed through the icon configuration system using lucide-react:

```tsx
// Using the Icon component (recommended)
import { Icon } from './components/Icon';
<Icon name="calendar" size={20} />

// Direct import from lucide-react
import { Calendar } from 'lucide-react';
<Calendar size={20} />

// Using the icons config
import { icons } from '../config/icons';
const CalendarIcon = icons.calendar;
<CalendarIcon size={20} />
```

## Best Practices

1. **Use the centralized configs**: Import images from `/config/assets.ts` and icons from `/config/icons.ts`
2. **Optimize images**: Compress images before adding them to the public folder
3. **Consistent naming**: Use kebab-case for all file names (e.g., `hero-banner.jpg`)
4. **Organize by feature**: Keep related images in their respective folders
5. **Use the Icon component**: For consistent icon sizing and styling throughout the app
