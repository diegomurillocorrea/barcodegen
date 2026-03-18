import "./globals.css";
import Script from "next/script";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://example.com"
  ),
  title: {
    default: "DAIEGO BarCodeGen",
    template: "%s | DAIEGO BarCodeGen",
  },
  description:
    "Genera códigos de barras CODE128 a partir de nombres o números. Copia la imagen o descárgala en PNG.",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      {
        url: "/globe.svg",
        sizes: "any",
      },
    ],
  },
  openGraph: {
    title: "DAIEGO BarCodeGen",
    description:
      "Genera códigos de barras CODE128 a partir de nombres o números. Copia la imagen o descárgala en PNG.",
    type: "website",
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: "DAIEGO BarCodeGen",
    description:
      "Genera códigos de barras CODE128 a partir de nombres o números. Copia la imagen o descárgala en PNG.",
  },
};

export const viewport = {
  themeColor: "#22c55e",
};

export default function GeneradorCodigosDeBarraLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
            (function () {
              try {
                var stored = window.localStorage.getItem('theme');
                var systemDark = !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
                var theme = stored === 'light' || stored === 'dark' ? stored : (systemDark ? 'dark' : 'light');
                document.documentElement.dataset.theme = theme;
              } catch (e) {}
            })();
          `}
        </Script>
      </head>
      <body className={poppins.className}>
        <div className="min-h-screen flex flex-col">
          <main className="flex-1 flex items-center justify-center">{children}</main>
          <footer className="w-full bg-(--accent) text-black">
            <div className="w-full px-6 py-3 flex items-center justify-between text-sm font-medium">
              <span>DAIEGO SYS</span>
              <span>DAIEGO LLC &copy; 2026</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
};