import type { ComponentChildren } from "preact";
import { useRef } from "preact/hooks";
import { useLanguage } from "../i18n/i18n";
import type { PlannerTab } from "../services/planner-storage";

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
      {steps.map((step) => (
        <div
          key={step}
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
    </div>
  );
}
