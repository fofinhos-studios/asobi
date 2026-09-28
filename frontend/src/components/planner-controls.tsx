import {
  CalendarBlankIcon,
  ClockIcon,
  SlidersHorizontalIcon,
} from "@phosphor-icons/react";
import { useState } from "preact/hooks";
import { useLanguage } from "../i18n/i18n";
import type {
  PlanningMode,
  ScheduleAlgorithm,
  WeeklyAvailability,
} from "../types";
import { AvailabilityForm } from "./availability-form";
import { Button, Field, Input, Select } from "./ui";

interface Props {
  availability: WeeklyAvailability | null;
  planningMode: PlanningMode;
  startDate: string;
  finishByDate: string | null;
  maxSessionHours: number;
  algorithm: ScheduleAlgorithm;
  onAvailability: (value: WeeklyAvailability | null) => void;
  onPlanningMode: (value: PlanningMode) => void;
  onStartDate: (value: string) => void;
  onFinishByDate: (value: string) => void;
  onMaxSessionHours: (value: number) => void;
  onAlgorithm: (value: ScheduleAlgorithm) => void;
}

export function PlannerControls(props: Props) {
  const { t } = useLanguage();
  const [expanded, setExpanded] = useState(!props.availability);
  const open = expanded || !props.availability;
  const hours =
    props.availability?.days.reduce((sum, day) => sum + day.hours, 0) ?? 0;
  return (
    <section
      class="asobi-settings"
      id="availability"
      tabIndex={-1}
      aria-label={t.asobi.plannerSettings}
    >
      <div class="asobi-controls">
        <div class="asobi-control">
          <span class="ui-label">
            <ClockIcon aria-hidden="true" />
            {t.asobi.availability}
          </span>
          <strong class="asobi-control__total">
            {t.schedule.hoursPerWeek(hours)}
          </strong>
          <Button
            disabled={!props.availability}
            aria-expanded={open}
            aria-controls="availability-editor"
            onClick={() => setExpanded(!open)}
          >
            <SlidersHorizontalIcon aria-hidden="true" />
            {open
              ? t.asobi.hideHours
              : props.availability
                ? t.asobi.editHours
                : t.asobi.setHours}
          </Button>
        </div>
        <div class="asobi-control">
          <Field label={t.schedule.startDate} controlId="schedule-start-date">
            <Input
              id="schedule-start-date"
              type="date"
              required
              value={props.startDate}
              onInput={(e) => {
                if (e.currentTarget.value)
                  props.onStartDate(e.currentTarget.value);
              }}
            />
          </Field>
          <p class="asobi-control__hint">
            <CalendarBlankIcon aria-hidden="true" />
            {t.asobi.ready}
          </p>
        </div>
        <div class="asobi-control">
          <Field label={t.schedule.planningMode} controlId="planning-mode">
            <Select
              id="planning-mode"
              value={props.planningMode}
              onChange={(e) =>
                props.onPlanningMode(e.currentTarget.value as PlanningMode)
              }
            >
              <option value="weekly">{t.schedule.weeklyMode}</option>
              <option value="finish_by">{t.schedule.finishByMode}</option>
            </Select>
          </Field>
          {props.planningMode === "finish_by" && (
            <>
              <Field
                label={t.schedule.finishByDate}
                controlId="schedule-finish-by-date"
              >
                <Input
                  id="schedule-finish-by-date"
                  type="date"
                  min={props.startDate}
                  value={props.finishByDate ?? ""}
                  onInput={(e) => props.onFinishByDate(e.currentTarget.value)}
                />
              </Field>
              <Field
                label={t.schedule.maxSessionHours}
                controlId="schedule-max-session-hours"
              >
                <Input
                  id="schedule-max-session-hours"
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  value={props.maxSessionHours}
                  onInput={(e) => {
                    const value = e.currentTarget.valueAsNumber;
                    if (Number.isFinite(value) && value >= 0.5 && value <= 24)
                      props.onMaxSessionHours(value);
                  }}
                />
              </Field>
            </>
          )}
        </div>
        <div class="asobi-control">
          <Field label={t.schedule.algorithm} controlId="schedule-algorithm">
            <Select
              id="schedule-algorithm"
              value={props.algorithm}
              onChange={(e) =>
                props.onAlgorithm(e.currentTarget.value as ScheduleAlgorithm)
              }
            >
              <option value="sequential">{t.schedule.sequential}</option>
              <option value="alternating">{t.schedule.alternating}</option>
            </Select>
          </Field>
          <p class="asobi-control__hint">
            {props.algorithm === "sequential"
              ? t.schedule.sequentialCopy
              : t.schedule.alternatingCopy}
          </p>
        </div>
      </div>
      {props.planningMode === "finish_by" && (
        <p class="planner-inline-notice">
          {!props.finishByDate || props.finishByDate < props.startDate
            ? t.schedule.finishByRequired
            : t.schedule.finishByGuidance}
        </p>
      )}
      <div id="availability-editor" class="asobi-availability" hidden={!open}>
        <AvailabilityForm
          availability={props.availability}
          planningMode={props.planningMode}
          onChange={props.onAvailability}
        />
      </div>
    </section>
  );
}
