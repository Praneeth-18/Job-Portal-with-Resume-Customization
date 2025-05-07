/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-roboto)'],
      },
      colors: {
        border: "var(--color-border)",
        input: "var(--color-border)",
        ring: "var(--primary)",
        background: "var(--background-solid)",
        foreground: "var(--foreground)",
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--foreground)",
        },
        destructive: {
          DEFAULT: "hsl(0 100% 50%)",
          foreground: "var(--foreground)",
        },
        muted: {
          DEFAULT: "var(--glass-bg)",
          foreground: "var(--glass-highlight)",
        },
        card: {
          DEFAULT: "var(--card-bg)",
          foreground: "var(--foreground)",
        },
        layer: {
          DEFAULT: "var(--glass-bg)",
          foreground: "var(--foreground)",
        },
      },
      boxShadow: {
        card: '0 8px 20px rgba(0, 0, 0, 0.25)',
        'card-hover': '0 12px 28px rgba(0, 0, 0, 0.35)',
      },
      borderRadius: {
        lg: "var(--radius-md)",
        md: "var(--radius-sm)",
        sm: "var(--radius-sm)",
        "ios": "var(--radius-md)",
        "ios-lg": "var(--radius-lg)",
        "ios-xl": "var(--radius-xl)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}; 