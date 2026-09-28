import { GameControllerIcon } from "@phosphor-icons/react";
import { AsobiBrand } from "../components/asobi-brand";
import { BacklogManager } from "../components/backlog-manager";
import { GameRoute } from "../components/game-route";
import { PlannerControls } from "../components/planner-controls";
import { PlannerGamesStep } from "../components/planner-games-step";
import { PlannerTabs } from "../components/planner-tabs";
import { ScheduleView } from "../components/schedule-view";
import { usePlanner } from "../hooks/use-planner";

export function HomePage() {
  const p = usePlanner();
  const { t } = p;
  return (
    <div class="asobi-shell" id="top">
      <a href="#planner" class="skip-link">
        {t.app.skipToPlanner}
      </a>
      <header class="asobi-header">
        <AsobiBrand />
        <label class="asobi-language">
          <span class="sr-only">{t.language.label}</span>
          <select
            value={p.language}
            onChange={(e) =>
              p.setLanguage(e.currentTarget.value as typeof p.language)
            }
          >
            <option value="en">English</option>
            <option value="pt-BR">Português (Brasil)</option>
          </select>
        </label>
      </header>
      <main id="planner" tabIndex={-1}>
        <PlannerTabs
          activeTab={p.activeTab}
          onChange={p.setActiveTab}
          games=<section
            class="asobi-library"
            id="library"
            tabIndex={-1}
            aria-labelledby="library-heading"
          >
            <div class="asobi-section-heading">
              <h1 id="library-heading">
                <GameControllerIcon aria-hidden="true" />
                {t.asobi.library}
              </h1>
            </div>
            <BacklogManager
              backlogs={p.backlogs}
              activeBacklogId={p.activeBacklog.id}
              onSelect={p.selectBacklog}
              onCreate={p.addBacklog}
              onDelete={p.deleteBacklog}
            />
            <PlannerGamesStep
              backlogName={p.activeBacklog.name}
              games={p.games}
              groupImports={p.activeBacklog.group_imports}
              onAddGame={p.addGame}
              onAddGameGroup={p.addGameGroup}
              onSelectGameTime={p.selectGameTime}
              onRemoveGame={p.removeGame}
              onRetryGame={p.retryGame}
              onMoveGame={p.moveGame}
              onReorderGames={p.reorderGames}
              onRenameBacklog={p.renameBacklog}
              onRemoveGroupImport={p.removeGroupImport}
              onRemoveGroup={p.removeGroup}
            />
          </section>
          availability={
            <>
              <h1 class="asobi-step-heading">{t.workflow.settingsTitle}</h1>
              <PlannerControls
                availability={p.availability}
                startDate={p.startDate}
                planningMode={p.planningMode}
                finishByDate={p.finishByDate}
                maxSessionHours={p.maxSessionHours}
                algorithm={p.algorithm}
                onAvailability={p.handleSetAvailability}
                onStartDate={p.handleStartDateChange}
                onPlanningMode={p.handlePlanningModeChange}
                onFinishByDate={p.handleFinishByDateChange}
                onMaxSessionHours={p.handleMaxSessionHoursChange}
                onAlgorithm={p.handleAlgorithmChange}
              />
            </>
          }
          schedule={
            <>
              <h1 class="asobi-step-heading">{t.workflow.resultTitle}</h1>
              <div class="asobi-result">
                <GameRoute
                  games={p.games}
                  schedule={p.schedule}
                  algorithm={p.algorithm}
                  isGenerating={p.isGenerating}
                  error={p.actionError}
                  onReorder={p.reorderGames}
                />
                {p.excludedGames.length > 0 && (
                  <p class="planner-inline-notice">
                    {t.schedule.excludedGames(
                      p.excludedGames.map((game) => game.name).join(", "),
                      p.excludedGames.length,
                    )}
                  </p>
                )}
                {p.schedule && (
                  <div class="asobi-agenda" id="agenda">
                    <ScheduleView
                      schedule={p.schedule}
                      games={p.games}
                      finishByDate={p.finishByDate}
                      onScheduleChange={p.handleScheduleChange}
                      onDownloadIcal={p.handleDownloadIcal}
                      onCopyCalendarUrl={p.handleCopyCalendarUrl}
                    />
                  </div>
                )}
              </div>
            </>
          }
        />
      </main>
      <footer class="asobi-footer">
        <span>
          Made with love by 🧡💜{" "}
          <a href="https://fofinhos.studio/">fofinhos.studio</a>
        </span>
        <span>
          {t.asobi.source.data}: <a href="https://www.igdb.com/">IGDB</a>
          {" · "}
          {t.asobi.source.playtime}:{" "}
          <a href="https://howlongtobeat.com/">HowLongToBeat</a>
          {" · "}
          {t.asobi.source.artwork}:{" "}
          <a href="https://www.steamgriddb.com/">SteamGridDB</a>
        </span>
      </footer>
    </div>
  );
}
