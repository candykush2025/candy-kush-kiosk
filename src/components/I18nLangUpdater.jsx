"use client";
import { useEffect, useState } from "react";
import i18n from "../i18n";

export default function I18nLangUpdater() {
  const [lng, setLng] = useState(i18n.language || "en");

  useEffect(() => {
    const handler = (l) => {
      setLng(l);
      if (typeof document !== "undefined") {
        document.documentElement.lang = l;
      }
    };
    i18n.on("languageChanged", handler);
    // initial sync
    handler(i18n.language || "en");
    return () => i18n.off("languageChanged", handler);
  }, []);

  return null; // no UI needed
}
