# Antalia Properties - Luxury Real Estate Landing Page

A modern, responsive landing page for Antalia Properties, showcasing luxury real estate properties in Antalya, Turkey. Built with Next.js 15, TypeScript, and Tailwind CSS, featuring smooth animations, accessibility features, and a professional design.

## 🚀 Live Demo

[View Live Demo](https://your-demo-link.com) *(Replace with actual deployment URL)*

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Key Components](#key-components)
- [Design System](#design-system)
- [Performance](#performance)
- [Accessibility](#accessibility)
- [Browser Support](#browser-support)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Core Functionality
- **Property Showcase**: Display luxury properties with detailed information
- **Responsive Design**: Optimized for all device sizes (mobile, tablet, desktop)
- **Interactive Animations**: Smooth transitions using Framer Motion
- **Contact Form**: Functional inquiry form with validation
- **Image Gallery**: High-quality property images with lazy loading
- **SEO Optimized**: Meta tags, semantic HTML, and structured data

### User Experience
- **Fast Loading**: Optimized images and code splitting
- **Accessibility**: WCAG 2.1 compliant with screen reader support
- **Smooth Scrolling**: Enhanced navigation experience
- **Modern UI**: Clean, professional design with glass morphism effects
- **Mobile-First**: Progressive enhancement approach

### Technical Features
- **TypeScript**: Full type safety and better development experience
- **Component Architecture**: Reusable, maintainable React components
- **CSS-in-JS**: Tailwind CSS with custom utilities
- **Performance Monitoring**: Built-in performance optimizations
- **Error Handling**: Graceful error boundaries and fallbacks

## 🛠 Tech Stack

### Frontend Framework
- **Next.js 15.1.0** - React framework with SSR/SSG capabilities
- **React 18.3.0** - Component-based UI library
- **TypeScript 5.0** - Type-safe JavaScript

### Styling & UI
- **Tailwind CSS 3.3** - Utility-first CSS framework
- **Framer Motion 10.18** - Animation library
- **Lucide React 0.542** - Icon library
- **Radix UI** - Accessible component primitives

### Development Tools
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Build & Deployment
- **Vercel** - Recommended deployment platform
- **npm** - Package management

## 📁 Project Structure

```
landing-page-project/
├── app/                          # Next.js 13+ app directory
│   ├── about/                    # About page
│   ├── api/                      # API routes
│   │   └── contact/              # Contact form API
│   ├── contact/                  # Contact page
│   ├── properties/               # Property pages
│   │   ├── [id]/                 # Dynamic property detail pages
│   │   └── page.tsx              # Properties listing
│   ├── testimonials/             # Testimonials page
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Homepage
├── components/                   # Reusable components
│   ├── contact/                  # Contact-related components
│   ├── property/                 # Property-specific components
│   ├── ui/                       # Base UI components
│   ├── AboutSection.tsx          # About section component
│   ├── ContactForm.tsx           # Contact form component
│   ├── Footer.tsx                # Footer component
│   ├── Header.tsx                # Header component
│   ├── MotionWrapper.tsx         # Animation wrapper
│   ├── Navigation.tsx            # Navigation component
│   ├── ServicesSection.tsx       # Services section
│   └── TestimonialCard.tsx       # Testimonial card
├── data/                         # Static data
│   ├── properties.ts             # Property data
│   ├── propertyListings.ts       # Property listings
│   └── testimonials.ts           # Testimonials data
├── lib/                          # Utility functions
│   └── utils.ts                  # Helper utilities
├── public/                       # Static assets
│   ├── images/                   # Image assets
│   └── hero-property.jpg         # Hero image
├── styles/                       # Additional styles
│   └── globals.css               # Global CSS
├── types/                        # TypeScript type definitions
│   └── property.ts               # Property type definitions
├── package.json                  # Dependencies and scripts
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
└── next.config.js                # Next.js configuration
```

## 🚀 Installation

### Prerequisites
- Node.js 18.0 or later
- npm or yarn package manager

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/antalia-properties.git
   cd antalia-properties
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open in browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

## 💻 Usage

### Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Type checking
npm run type-check
```

### Environment Variables

Create a `.env.local` file in the root directory:

```env
# Contact form configuration
NEXT_PUBLIC_CONTACT_EMAIL=your-email@example.com
NEXT_PUBLIC_CONTACT_PHONE=+90-242-300-0000

# Analytics (optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
```

## 🧩 Key Components

### Homepage (`app/page.tsx`)
- **Hero Section**: Eye-catching banner with call-to-action
- **Properties Grid**: Featured property listings
- **About Section**: Company information and statistics
- **Contact Form**: Lead generation form

### Property Components
- **PropertyCard**: Individual property display
- **ImageGallery**: Property image carousel
- **PropertyDetails**: Detailed property information

### Layout Components
- **Header**: Navigation and branding
- **Footer**: Links and company information
- **Navigation**: Responsive menu system

### UI Components
- **Button**: Reusable button component
- **ContactForm**: Form with validation
- **MotionWrapper**: Animation wrapper

## 🎨 Design System

### Color Palette
- **Primary**: Emerald (#10b981) - Trust and growth
- **Secondary**: Slate (#64748b) - Professional and modern
- **Accent**: White (#ffffff) - Clean and minimal
- **Background**: Light gray (#f8fafc) - Subtle and elegant

### Typography
- **Font Family**: Inter (Google Fonts)
- **Headings**: Bold, tracking-tight
- **Body**: Regular weight, readable line height
- **Responsive**: Fluid typography scaling

### Spacing & Layout
- **Grid System**: CSS Grid and Flexbox
- **Breakpoints**: Mobile-first responsive design
- **Spacing Scale**: Tailwind's spacing system
- **Container**: Max-width with responsive padding

### Animation Principles
- **Performance**: GPU-accelerated transforms
- **Accessibility**: Respects `prefers-reduced-motion`
- **Timing**: Smooth, natural easing functions
- **Purpose**: Enhances UX without distraction

## ⚡ Performance

### Optimization Features
- **Image Optimization**: Next.js Image component with lazy loading
- **Code Splitting**: Automatic route-based splitting
- **Bundle Analysis**: Optimized bundle size
- **Caching**: Static generation where possible
- **Compression**: Gzip/Brotli compression

### Performance Metrics
- **Lighthouse Score**: 95+ across all categories
- **First Contentful Paint**: < 1.5s
- **Largest Contentful Paint**: < 2.5s
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### Monitoring
- **Core Web Vitals**: Real-time monitoring
- **Error Tracking**: Comprehensive error reporting
- **Analytics**: User behavior insights

## ♿ Accessibility

### WCAG 2.1 Compliance
- **Level AA**: Meets WCAG 2.1 AA standards
- **Keyboard Navigation**: Full keyboard accessibility
- **Screen Readers**: Semantic HTML and ARIA labels
- **Color Contrast**: 4.5:1 minimum contrast ratio
- **Focus Management**: Visible focus indicators

### Accessibility Features
- **Skip Links**: Quick navigation to main content
- **Alt Text**: Descriptive image alternatives
- **Form Labels**: Proper form labeling
- **Heading Structure**: Logical heading hierarchy
- **Motion Preferences**: Respects reduced motion

### Testing
- **Automated Testing**: axe-core integration
- **Manual Testing**: Screen reader testing
- **User Testing**: Accessibility user testing

## 🌐 Browser Support

### Supported Browsers
- **Chrome**: 90+
- **Firefox**: 88+
- **Safari**: 14+
- **Edge**: 90+

### Progressive Enhancement
- **Core Functionality**: Works without JavaScript
- **Enhanced Experience**: JavaScript enhancements
- **Fallbacks**: Graceful degradation

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Code Standards
- **TypeScript**: Strict type checking
- **ESLint**: Code quality enforcement
- **Prettier**: Code formatting
- **Conventional Commits**: Standardized commit messages

### Testing
- **Unit Tests**: Component testing
- **Integration Tests**: Feature testing
- **E2E Tests**: User journey testing

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact

**Ahmed [Your Name]**
- Email: your.email@example.com
- LinkedIn: [Your LinkedIn Profile]
- Portfolio: [Your Portfolio Website]

## 🙏 Acknowledgments

- **Design Inspiration**: Modern real estate websites
- **Icons**: Lucide React icon library
- **Images**: Unsplash for high-quality property images
- **Fonts**: Google Fonts (Inter)
- **Framework**: Next.js team for the amazing framework

---

**Built with ❤️ using Next.js, TypeScript, and Tailwind CSS**
