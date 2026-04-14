import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { AuthProvider } from "@/lib/auth";
import { Toaster } from "sonner";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
      <Toaster position="top-right" richColors closeButton />
    </AuthProvider>
  );
}
