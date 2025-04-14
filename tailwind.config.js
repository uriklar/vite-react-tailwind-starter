/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "#E5E7EB", // Tailwind gray-200
        input: "#E0E0E0",
        ring: "#C4B5FD", // soft lavender ring
        background: "#FAF8FF", // lighter, airier purple
        foreground: "#1F1F1F",

        primary: "#0C0C0D",
        secondary: "#E6DBFB", // lighter version of your current #d5c8f9
        destructive: {
          DEFAULT: "#EF4444",
          foreground: "#FFFFFF",
        },
        muted: {
          DEFAULT: "#F3F4F6", // light gray
          foreground: "#6B7280", // gray-500
        },
        accent: "#6837F8", // keep as-is for vividness
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#1F1F1F",
        },
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#1F1F1F",
        },
        highlight: "#FDE68A", // replaces sharp #fce07f with soft pastel gold
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        montserrat: ['Montserrat', 'sans-serif'],
      },
      boxShadow: {
        'custom': '0 4px 6px -1px rgba(104, 55, 248, 0.1), 0 2px 4px -1px rgba(104, 55, 248, 0.06)',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}