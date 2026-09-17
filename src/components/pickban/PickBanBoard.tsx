"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle2, RotateCcw, Undo2 } from "lucide-react";
import { api } from "@/lib/api";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/helpers";
import { Button } from "@/components/ui";
import HeroDetailModal from "@/components/game/HeroDetailModal";
import TeamColumn from "./TeamColumn";
import HeroGrid from "./HeroGrid";
import SuggestionsPanel from "./SuggestionsPanel";
import LanePickerModal from "./LanePickerModal";
import {
  isComplete,
  stepAt,
  totalSteps,
  usedHeroIds,
  type DraftState,
  type PickBanHero,
  type SuggestResponse,
} from "@/lib/pickban";

export interface BoardMove {
  action: "pick" | "ban";
  team: "blue" | "red";
  hero: PickBanHero;
  lane?: string;
}

// Presentational draft board. The parent owns the state (local or persisted)
// and receives the moves; the board only knows the current DraftState.
export default function PickBanBoard({
  state,
  heroes,
  readOnly = false,
  busy = false,
  onMove,
  onUndo,
  onReset,
  toolbar,
}: {
  state: DraftState;
  heroes: PickBanHero[];
  readOnly?: boolean;
  busy?: boolean;
  onMove?: (move: BoardMove) => void | Promise<void>;
  onUndo?: () => void | Promise<void>;
  onReset?: () => void | Promise<void>;
  toolbar?: React.ReactNode;
}) {
  const t = useT();
  const heroMap = useMemo(
    () => new Map(heroes.map((h) => [h.id, h])),
    [heroes],
  );
  const used = useMemo(() => usedHeroIds(state), [state]);
  const step = stepAt(state.mode, state.currentStep);
  const total = totalSteps(state.mode);
  const done = isComplete(state);
  const locked = readOnly || busy || done;

  const [pendingPick, setPendingPick] = useState<PickBanHero | null>(null);
  const [infoHero, setInfoHero] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestResponse | null>(null);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const requestId = useRef(0);

  // Lanes already covered by the team currently picking (for the lane picker).
  const takenLanes = useMemo(() => {
    if (!step) return new Set<string>();
    const team = step.team === "blue" ? state.blueTeam : state.redTeam;
    return new Set(
      team.picks.map((p) => p.lane).filter((l): l is string => !!l),
    );
  }, [state, step]);

  // Live suggestions for the next action.
  useEffect(() => {
    if (readOnly || done || !step) {
      setSuggestions(null);
      return;
    }
    const id = ++requestId.current;
    setLoadingSuggestions(true);
    api.pickban
      .suggest({
        mode: state.mode,
        currentStep: state.currentStep,
        blueTeam: state.blueTeam,
        redTeam: state.redTeam,
      })
      .then((res) => {
        if (id === requestId.current) setSuggestions(res);
      })
      .catch(() => {
        if (id === requestId.current) setSuggestions(null);
      })
      .finally(() => {
        if (id === requestId.current) setLoadingSuggestions(false);
      });
  }, [state, step, readOnly, done]);

  const handleSelect = useCallback(
    (hero: PickBanHero) => {
      if (locked || !step || used.has(hero.id)) return;
      if (step.action === "ban") {
        void onMove?.({ action: "ban", team: step.team, hero });
      } else {
        setPendingPick(hero);
      }
    },
    [locked, step, used, onMove],
  );

  const confirmPick = (lane: string) => {
    const hero = pendingPick;
    setPendingPick(null);
    if (!hero || !step) return;
    void onMove?.({ action: "pick", team: step.team, hero, lane });
  };

  const teamLabel = (team: "blue" | "red") =>
    t(team === "blue" ? "pickban.teamBlue" : "pickban.teamRed");

  return (
    <div className="space-y-4">
      {/* Step banner */}
      <div
        className={cn(
          "flex flex-col gap-3 rounded-sm border bg-white p-4 shadow-default dark:bg-boxdark sm:flex-row sm:items-center sm:justify-between",
          done
            ? "border-success/50"
            : step?.team === "blue"
              ? "border-primary/50"
              : "border-danger/50",
        )}
      >
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-body dark:text-bodydark">
            {t("pickban.currentStep", {
              step: Math.min(state.currentStep + 1, total),
              total,
            })}{" "}
            · {t(`pickban.${state.mode}`)}
          </p>
          {done ? (
            <p className="flex items-center gap-2 text-lg font-bold text-success">
              <CheckCircle2 size={20} />
              {t("pickban.complete")}
            </p>
          ) : step ? (
            <p
              className={cn(
                "text-lg font-bold",
                step.team === "blue" ? "text-primary" : "text-danger",
              )}
            >
              {t(
                step.action === "ban" ? "pickban.stepBan" : "pickban.stepPick",
                {
                  team: teamLabel(step.team),
                },
              )}
            </p>
          ) : null}
          <p className="text-xs text-body dark:text-bodydark">
            {readOnly
              ? t("pickban.readOnly")
              : done
                ? t("pickban.completeHint")
                : step &&
                  t("pickban.tipTap", {
                    action: t(`pickban.${step.action}`).toLowerCase(),
                  })}
          </p>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap items-center gap-2">
            {toolbar}
            <Button
              size="sm"
              variant="outline"
              disabled={busy || state.currentStep === 0}
              onClick={() => void onUndo?.()}
              className="gap-1.5"
            >
              <Undo2 size={15} />
              {t("pickban.undo")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={busy || state.currentStep === 0}
              onClick={() => void onReset?.()}
              className="gap-1.5"
            >
              <RotateCcw size={15} />
              {t("pickban.reset")}
            </Button>
          </div>
        )}
      </div>

      {/* Board: teams on the sides (desktop) or side by side above the grid (mobile).
          Read-only: only the two teams, side by side. */}
      <div
        className={cn("grid grid-cols-1 gap-4", !readOnly && "lg:grid-cols-12")}
      >
        <div
          className={cn(
            "grid grid-cols-2 gap-3",
            readOnly ? "sm:gap-6" : "lg:contents",
          )}
        >
          <div
            className={cn(
              !readOnly && "lg:col-span-3 lg:col-start-1 lg:row-start-1",
            )}
          >
            <TeamColumn
              team="blue"
              state={state.blueTeam}
              mode={state.mode}
              heroes={heroMap}
              activeStep={done ? null : step}
            />
          </div>
          <div
            className={cn(
              !readOnly && "lg:col-span-3 lg:col-start-10 lg:row-start-1",
            )}
          >
            <TeamColumn
              team="red"
              state={state.redTeam}
              mode={state.mode}
              heroes={heroMap}
              activeStep={done ? null : step}
            />
          </div>
        </div>

        {!readOnly && (
          <div className="space-y-4 lg:col-span-6 lg:col-start-4 lg:row-start-1">
            {!done && (
              <SuggestionsPanel
                data={suggestions}
                loading={loadingSuggestions}
                disabled={locked}
                heroes={heroMap}
                onSelect={handleSelect}
              />
            )}
            <HeroGrid
              heroes={heroes}
              used={used}
              disabled={locked}
              onSelect={handleSelect}
              onInfo={(h) => setInfoHero(h.heroId)}
            />
          </div>
        )}
      </div>

      <LanePickerModal
        hero={pendingPick}
        taken={takenLanes}
        onClose={() => setPendingPick(null)}
        onConfirm={confirmPick}
      />
      <HeroDetailModal heroId={infoHero} onClose={() => setInfoHero(null)} />
    </div>
  );
}
