import { useLanguage } from "../i18n/i18n";

export function AsobiBrand() {
  const { t } = useLanguage();
  return (
    <a class="asobi-brand" href="#top" aria-label="Asobi">
      <img src="/asobi-mark.png" width="48" height="48" alt="" />
      <span class="asobi-brand__name">asobi</span>
      <span class="asobi-brand__subtitle">{t.asobi.subtitle}</span>
    </a>
  );
}
