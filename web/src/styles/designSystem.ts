// Centralized Design System
// Professional spacing, typography, timing, and animation standards

export const designSystem = {
  // Animation Timing System
  timing: {
    quick: 200,      // Quick feedback (hover, clicks)
    standard: 300,   // Standard transitions (modals, cards)
    emphasis: 500,   // Emphasized animations (winner, celebrations)
    slow: 700,       // Slow, dramatic (showdown reveal)
  },

  // Easing Functions
  easing: {
    smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    snap: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  },

  // Typography Scale (strict adherence)
  fontSize: {
    xs: '12px',      // Labels, captions
    sm: '14px',      // Body small, helper text
    base: '16px',    // Body text, buttons
    lg: '20px',      // Subheadings
    xl: '24px',      // Section headers
    '2xl': '32px',   // Page headers
    '3xl': '48px',   // Hero text, big wins
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,      // Headings
    normal: 1.5,     // Body text
    relaxed: 1.75,   // Large body text
  },

  // Spacing System (8px grid)
  spacing: {
    xs: '8px',
    sm: '16px',
    md: '24px',
    lg: '32px',
    xl: '40px',
    '2xl': '48px',
    '3xl': '64px',
    '4xl': '80px',
  },

  // Border Radius
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    full: '9999px',
  },

  // Shadow System
  shadow: {
    sm: '0 2px 4px rgba(0, 0, 0, 0.1)',
    md: '0 4px 8px rgba(0, 0, 0, 0.2)',
    lg: '0 8px 16px rgba(0, 0, 0, 0.3)',
    xl: '0 16px 32px rgba(0, 0, 0, 0.4)',
    glow: {
      cyan: '0 0 20px rgba(6, 182, 212, 0.6)',
      green: '0 0 20px rgba(16, 185, 129, 0.6)',
      red: '0 0 20px rgba(239, 68, 68, 0.6)',
      amber: '0 0 20px rgba(251, 191, 36, 0.6)',
    },
  },

  // Z-Index Layers
  zIndex: {
    base: 0,
    cards: 10,
    playerUI: 20,
    chips: 30,
    overlay: 40,
    modal: 50,
    tooltip: 60,
    notification: 70,
  },
};

// Animation Classes (Tailwind compatible)
export const animations = {
  // Hover effects
  hoverScale: 'transition-transform duration-200 ease-smooth hover:scale-105 active:scale-95',
  hoverGlow: 'transition-shadow duration-200 ease-smooth hover:shadow-glow-cyan',
  hoverBrightness: 'transition-all duration-200 ease-smooth hover:brightness-110',
  
  // Button interactions
  buttonPress: 'transition-all duration-200 ease-smooth hover:scale-105 active:scale-95 active:brightness-90',
  
  // Fade transitions
  fadeIn: 'animate-fadeIn',
  fadeOut: 'animate-fadeOut',
  
  // Slide transitions
  slideInUp: 'animate-slideInUp',
  slideInDown: 'animate-slideInDown',
  
  // Pulse/Glow
  pulseSubtle: 'animate-pulse-subtle',
  glowPulse: 'animate-glow-pulse',
};

// Tailwind config additions needed:
export const tailwindAnimations = `
  // Add to tailwind.config.js:
  
  theme: {
    extend: {
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'snap': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fadeIn': 'fadeIn 300ms ease-smooth',
        'fadeOut': 'fadeOut 300ms ease-smooth',
        'slideInUp': 'slideInUp 300ms ease-smooth',
        'slideInDown': 'slideInDown 300ms ease-smooth',
        'pulse-subtle': 'pulse-subtle 2s ease-in-out infinite',
        'glow-pulse': 'glow-pulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeOut: {
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        slideInUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'pulse-subtle': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.8' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.4)' },
          '50%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.8)' },
        },
      },
    },
  },
`;
