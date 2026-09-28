import { IconContext } from "@phosphor-icons/react";
import { Analytics } from "@vercel/analytics/react";
import { Suspense, lazy } from "preact/compat";

import { LanguageProvider } from "./i18n/i18n";
import { HomePage } from "./pages/home";

const Gallery = import.meta.env.DEV
  ? lazy(() =>
      import("./components/design-system-gallery").then((module) => ({
        default: module.DesignSystemGallery,
      })),
    )
  : null;

export function App() {
  return (
    <LanguageProvider>
      <IconContext.Provider
        value={{ weight: "regular", color: "currentColor", size: 20 }}
      >
        {Gallery &&
        new URLSearchParams(window.location.search).has("design-system") ? (
          <Suspense fallback={null}>
            <Gallery />
          </Suspense>
        ) : (
          <HomePage />
        )}
      </IconContext.Provider>
      <Analytics />
    </LanguageProvider>
  );
}
