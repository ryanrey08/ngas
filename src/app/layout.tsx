import type { Metadata, Viewport } from "next";
import { Inter, Montserrat } from "next/font/google";
import { StoreProvider } from "@/store/provider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: { default: "eNGAS — New Government Accounting System", template: "%s · eNGAS" },
  description: "New Government Accounting System — appropriations, allotments, obligations, disbursements and financial reporting.",
  icons: { icon: "/logo/ngas-logo.png", apple: "/logo/ngas-logo.png" },
  applicationName: "eNGAS",
};

export const viewport: Viewport = {
  themeColor: "#D7191F",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${montserrat.variable}`}>
      <body>
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
