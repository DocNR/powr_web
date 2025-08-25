import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Provider } from 'jotai';
import { ThemeProvider } from "@/components/theme-provider";
import { NavigationProvider } from "@/providers/NavigationProvider";
import { SubNavigationProvider } from "@/providers/SubNavigationProvider";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import InstallButton from "@/components/InstallButton";
import { ToastProvider } from "@/providers/ToastProvider";
import { WeightUnitsProvider } from "@/providers/WeightUnitsProvider";
import { NostrLoginProvider } from "@/providers/NostrLoginProvider";
import { LibraryDataProvider } from "@/providers/LibraryDataProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "POWR",
  description: "Track your workouts on Nostr with POWR",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "POWR",
  },
  icons: {
    icon: [
      { url: "/assets/logos/powr-logo.svg", type: "image/svg+xml" },
      { url: "/icon-48.png", sizes: "48x48", type: "image/png" },
      { url: "/icon-72.png", sizes: "72x72", type: "image/png" },
      { url: "/icon-96.png", sizes: "96x96", type: "image/png" },
      { url: "/icon-144.png", sizes: "144x144", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-256.png", sizes: "256x256", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon-180x180.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icon-167x167.png", sizes: "167x167", type: "image/png" },
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "apple-mobile-web-app-title": "POWR",
    "theme-color": "#000000",
    "msapplication-TileColor": "#000000",
    "msapplication-config": "/browserconfig.xml",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Critical: Manual viewport for better PWA zoom prevention */}
        <meta 
          name="viewport" 
          content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover" 
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Provider>
            <NostrLoginProvider>
              <LibraryDataProvider>
                <WeightUnitsProvider>
                  <NavigationProvider>
                    <SubNavigationProvider>
                      <ToastProvider>
                        <ServiceWorkerRegistration />
                        <InstallButton />
                        {children}
                      </ToastProvider>
                    </SubNavigationProvider>
                  </NavigationProvider>
                </WeightUnitsProvider>
              </LibraryDataProvider>
            </NostrLoginProvider>
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}
