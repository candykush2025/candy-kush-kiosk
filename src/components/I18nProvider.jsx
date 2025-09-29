"use client";
import { Suspense } from "react";
import { I18nextProvider } from "react-i18next";
import i18n from "../i18n";
import I18nLangUpdater from "./I18nLangUpdater";

export default function I18nProvider({ children }) {
  return (
    <I18nextProvider i18n={i18n}>
      <Suspense fallback={null}>
        <I18nLangUpdater />
        {children}
      </Suspense>
    </I18nextProvider>
  );
}
