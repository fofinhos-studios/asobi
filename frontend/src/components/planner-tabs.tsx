import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react";
import type { ComponentChildren } from "preact";
import { useLayoutEffect, useRef } from "preact/hooks";
import { useLanguage } from "../i18n/i18n";
import type { PlannerTab } from "../services/planner-storage";
import { Button } from "./ui";

const steps: PlannerTab[] = ["games", "availability", "schedule"];
interface Props {
  activeTab: PlannerTab;
  onChange: (tab: PlannerTab) => void;
  games: ComponentChildren;
  availability: ComponentChildren;
  schedule: ComponentChildren;
}

export function PlannerTabs({ activeTab, onChange, ...panels }: Props) {
  const { t } = useLanguage();
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);
  const panelRefs = useRef<Array<HTMLDivElement | null>>([]);
  const focusPanel = useRef(false);
  const current = steps.indexOf(activeTab);
  useLayoutEffect(() => {
    if (focusPanel.current) {
      panelRefs.current[current]?.focus();
      focusPanel.current = false;
    }
  }, [current]);
  const advance = (index: number) => {
    focusPanel.current = true;
    onChange(steps[index]);
  };
  return (
    <div class="asobi-workflow">
      <div class="asobi-tabs" role="tablist" aria-label={t.workflow.label}>
        {steps.map((step, index) => (
          <button
            key={step}
            ref={(el) => {
              buttons.current[index] = el;
            }}
            type="button"
            role="tab"
            id={`planner-tab-${step}`}
            aria-controls={`planner-panel-${step}`}
            aria-selected={activeTab === step}
            tabIndex={activeTab === step ? 0 : -1}
            onClick={() => onChange(step)}
            onKeyDown={(event) => {
              let next: number;
              if (event.key === "ArrowRight") next = (index + 1) % steps.length;
              else if (event.key === "ArrowLeft")
                next = (index + steps.length - 1) % steps.length;
              else if (event.key === "Home") next = 0;
              else if (event.key === "End") next = steps.length - 1;
              else return;
              event.preventDefault();
              onChange(steps[next]);
              buttons.current[next]?.focus();
            }}
          >
            <span class="asobi-tabs__number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span>{t.workflow[step]}</span>
          </button>
        ))}
      </div>
      {steps.map((step, index) => (
        <div
          key={step}
          ref={(el) => {
            panelRefs.current[index] = el;
          }}
          class={`asobi-tab-panel asobi-tab-panel--${step}`}
          role="tabpanel"
          id={`planner-panel-${step}`}
          aria-labelledby={`planner-tab-${step}`}
          hidden={activeTab !== step}
          tabIndex={-1}
        >
          {panels[step]}
        </div>
      ))}
      <div class="asobi-step-actions">
        {current > 0 && (
          <Button onClick={() => advance(current - 1)}>
            <ArrowLeftIcon aria-hidden="true" />
            {t.workflow.back}
          </Button>
        )}
        {current < steps.length - 1 && (
          <Button
            class="asobi-step-actions__next"
            variant="primary"
            onClick={() => advance(current + 1)}
          >
            {current === 0 ? t.workflow.next : t.workflow.result}
            <ArrowRightIcon aria-hidden="true" />
          </Button>
        )}
      </div>
    </div>
  );
}
