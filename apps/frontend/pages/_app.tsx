import type { AppProps } from "next/app";
import "../app/globals.css";

import { Providers } from "../app/provider";
import { ThemeProvider } from "../app/theme-provider";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Providers>
      <ThemeProvider>
        <Component {...pageProps} />
      </ThemeProvider>
    </Providers>
  );
}

