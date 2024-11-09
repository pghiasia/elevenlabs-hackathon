/** @type {import('tailwindcss').Config} */
module.exports = {
	darkMode: ["class"],
	content: [
	  './pages/**/*.{ts,tsx}',
	  './components/**/*.{ts,tsx}',
	  './app/**/*.{ts,tsx}',
	  './src/**/*.{ts,tsx}',
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
		colors: {
		  red: {
			100: "#FFE6E6",
			300: "#FF9999",
			500: "#FF3333",
			600: "#FF0000",
			700: "#CC0000",
			800: "#990000",
			900: "#660000",
		  },
		  blue: {
			100: "#E6F0FF",
			300: "#99C2FF",
			500: "#3377FF",
			600: "#0055FF",
			700: "#0044CC",
			800: "#003399",
			900: "#002266",
		  },
		  purple: {
			100: "#F3E6FF",
			300: "#CC99FF",
			500: "#9933FF",
			600: "#7700FF",
			700: "#5F00CC",
			800: "#470099",
			900: "#2F0066",
		  },
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
  }