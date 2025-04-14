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
        border: "#e0d6fa",
        input: "#e0d6fa",
        ring: "#5a2ee5",
        background: '#f8f5fd',
        foreground: "#1a1a1d",
        primary: '#1a1a1d',
        secondary: '#e0d6fa',
        destructive: {
          DEFAULT: "#e11d48",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#e9e2f8",
          foreground: "#64638f",
        },
        accent: '#5a2ee5',
        popover: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1d",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#1a1a1d",
        },
        highlight: '#ffd866',
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