"use client";

import * as React from "react";
import Link from "next/link";
import { ZoomIn, ZoomOut, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn, formatDateBR } from "@/lib/utils";
import type { GanttGroup, GanttTask } from "@/lib/gantt";

interface GanttChartProps {
  groups: GanttGroup[];
  minDate: Date;
  maxDate: Date;
}

const STATUS_COLORS: Record<GanttTask["status"], string> = {
  disponivel: "bg-success",
  reservado: "bg-warning",
  vendido: "bg-primary",
};

const STATUS_BORDER: Record<GanttTask["status"], string> = {
  disponivel: "border-success",
  reservado: "border-warning",
  vendido: "border-primary",
};

const ROW_HEIGHT = 40;
const GROUP_HEADER_HEIGHT = 36;

export function GanttChart({ groups, minDate, maxDate }: GanttChartProps) {
  const [pxPerDay, setPxPerDay] = React.useState(4);
  const [hovered, setHovered] = React.useState<string | null>(null);

  const totalDays = Math.max(
    1,
    Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)),
  );
  const widthPx = totalDays * pxPerDay;

  // gera marcadores mensais
  const months: { label: string; offsetPx: number; isYearStart: boolean }[] =
    React.useMemo(() => {
      const result: typeof months = [];
      const cursor = new Date(minDate.getFullYear(), minDate.getMonth(), 1);
      while (cursor <= maxDate) {
        const days =
          (cursor.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24);
        result.push({
          label: cursor.toLocaleDateString("pt-BR", {
            month: "short",
            year: "2-digit",
          }),
          offsetPx: days * pxPerDay,
          isYearStart: cursor.getMonth() === 0,
        });
        cursor.setMonth(cursor.getMonth() + 1);
      }
      return result;
    }, [minDate, maxDate, pxPerDay]);

  function taskOffsetPx(t: GanttTask) {
    const days = Math.max(
      0,
      (t.start.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return days * pxPerDay;
  }

  function taskWidthPx(t: GanttTask) {
    const end = t.endReal ?? t.end;
    const days = Math.max(
      1,
      (end.getTime() - t.start.getTime()) / (1000 * 60 * 60 * 24),
    );
    return days * pxPerDay;
  }

  const today = new Date();
  const todayOffset =
    ((today.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)) * pxPerDay;
  const todayVisible = today >= minDate && today <= maxDate;

  if (groups.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed bg-muted/20 p-12 text-center">
        <Calendar className="mx-auto h-10 w-10 text-muted-foreground" />
        <p className="mt-3 text-sm text-muted-foreground">
          Nenhum lote com cronograma definido ainda. Cadastre lotes com data de
          início (no loteamento) e previsão de entrega para visualizá-los no Gantt.
        </p>
      </div>
    );
  }

  // calcula altura total
  const totalRows = groups.reduce((s, g) => s + g.tasks.length, 0);
  const totalGroupHeaders = groups.length;
  const chartHeight =
    totalGroupHeaders * GROUP_HEADER_HEIGHT + totalRows * ROW_HEIGHT;

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {formatDateBR(minDate)} → {formatDateBR(maxDate)}
          </span>
          <span className="text-muted-foreground">
            ({totalDays} dias, {totalRows} lote{totalRows !== 1 ? "s" : ""})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Zoom</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPxPerDay((p) => Math.max(1, p - 1))}
            aria-label="Reduzir zoom"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="w-10 text-center text-xs font-mono">{pxPerDay}px</span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => setPxPerDay((p) => Math.min(20, p + 1))}
            aria-label="Aumentar zoom"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-muted/30 p-2 text-xs">
        <span className="font-semibold text-muted-foreground">Legenda:</span>
        <Legend dot="bg-success" label="Disponível" />
        <Legend dot="bg-warning" label="Reservado" />
        <Legend dot="bg-primary" label="Vendido" />
        <Legend dot="bg-destructive" label="Atrasado" />
        <Legend
          dot="bg-foreground/30 border-2 border-foreground"
          label="Hoje"
        />
      </div>

      {/* Chart */}
      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex">
          {/* Sidebar com nomes */}
          <div className="w-48 shrink-0 border-r bg-muted/20 sm:w-64">
            {/* Header */}
            <div className="sticky top-0 z-10 flex h-10 items-center border-b bg-card px-3 text-xs font-semibold uppercase text-muted-foreground">
              Loteamento / Lote
            </div>
            {groups.map((g) => (
              <div key={g.loteamentoId}>
                <div
                  style={{ height: GROUP_HEADER_HEIGHT }}
                  className="flex items-center border-b bg-primary/5 px-3"
                >
                  <Link
                    href={`/loteamentos/${g.loteamentoId}`}
                    className="line-clamp-1 text-xs font-bold text-primary hover:underline"
                  >
                    {g.loteamentoNome}
                  </Link>
                </div>
                {g.tasks.map((t) => (
                  <Link
                    key={t.id}
                    href={`/lotes/${t.id}`}
                    style={{ height: ROW_HEIGHT }}
                    className={cn(
                      "flex items-center gap-2 border-b px-3 text-xs transition-colors hover:bg-muted/40",
                      hovered === t.id && "bg-muted/60",
                    )}
                    onMouseEnter={() => setHovered(t.id)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        STATUS_COLORS[t.status],
                      )}
                    />
                    <span className="line-clamp-1 font-medium">
                      Lote {t.numero}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      Q.{t.quadraIdentificador}
                    </span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      {t.duracaoDias}d
                    </span>
                  </Link>
                ))}
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 overflow-x-auto scrollbar-thin">
            <div style={{ width: widthPx, position: "relative" }}>
              {/* Header dos meses */}
              <div className="sticky top-0 z-10 flex h-10 border-b bg-card">
                {months.map((m, i) => {
                  const next = months[i + 1];
                  const w = next ? next.offsetPx - m.offsetPx : 60;
                  return (
                    <div
                      key={i}
                      style={{ width: w }}
                      className={cn(
                        "shrink-0 border-r border-border/60 px-2 py-1 text-[11px] font-medium text-muted-foreground",
                        m.isYearStart && "bg-primary/5 font-bold text-primary",
                      )}
                    >
                      {m.label}
                    </div>
                  );
                })}
              </div>

              {/* Body com grid e barras */}
              <div
                style={{ height: chartHeight, position: "relative" }}
                className="bg-gradient-to-b from-transparent to-muted/10"
              >
                {/* Grid vertical mensal */}
                {months.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "absolute top-0 bottom-0 border-l",
                      m.isYearStart ? "border-primary/30" : "border-border/40",
                    )}
                    style={{ left: m.offsetPx }}
                  />
                ))}

                {/* Linha do hoje */}
                {todayVisible && (
                  <div
                    className="absolute top-0 bottom-0 z-20 border-l-2 border-dashed border-foreground/60"
                    style={{ left: todayOffset }}
                  >
                    <div className="absolute -top-1 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-bold text-background shadow-md">
                      Hoje
                    </div>
                  </div>
                )}

                {/* Linhas */}
                {(() => {
                  let yCursor = 0;
                  return groups.map((g) => {
                    const groupY = yCursor;
                    yCursor += GROUP_HEADER_HEIGHT;
                    return (
                      <React.Fragment key={g.loteamentoId}>
                        <div
                          style={{
                            top: groupY,
                            height: GROUP_HEADER_HEIGHT,
                          }}
                          className="absolute inset-x-0 border-b bg-primary/5"
                        />
                        {g.tasks.map((t) => {
                          const y = yCursor;
                          yCursor += ROW_HEIGHT;
                          const left = taskOffsetPx(t);
                          const width = Math.max(20, taskWidthPx(t));
                          const isHovered = hovered === t.id;
                          return (
                            <div
                              key={t.id}
                              style={{
                                top: y,
                                height: ROW_HEIGHT,
                              }}
                              className={cn(
                                "absolute inset-x-0 border-b transition-colors",
                                isHovered && "bg-muted/40",
                              )}
                              onMouseEnter={() => setHovered(t.id)}
                              onMouseLeave={() => setHovered(null)}
                            >
                              <Link
                                href={`/lotes/${t.id}`}
                                title={`Lote ${t.numero} • ${formatDateBR(t.start)} → ${formatDateBR(t.end)} • ${t.etapaPercent}%`}
                                className={cn(
                                  "absolute top-1/2 flex h-6 -translate-y-1/2 items-center overflow-hidden rounded-md border-2 shadow-sm transition-all hover:h-7 hover:shadow-md",
                                  STATUS_BORDER[t.status],
                                  t.isAtrasada && "border-destructive ring-2 ring-destructive/30",
                                )}
                                style={{ left, width }}
                              >
                                <div
                                  className={cn(
                                    "h-full",
                                    STATUS_COLORS[t.status],
                                    t.isAtrasada && "bg-destructive",
                                  )}
                                  style={{ width: `${t.etapaPercent}%` }}
                                />
                                <div
                                  className={cn(
                                    "h-full flex-1 bg-card opacity-60",
                                  )}
                                />
                                <span className="absolute inset-0 flex items-center px-2 text-[10px] font-bold text-foreground/90 mix-blend-luminosity">
                                  {t.etapaPercent}%
                                </span>
                              </Link>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detalhes do hover */}
      {hovered && (() => {
        const task = groups
          .flatMap((g) => g.tasks)
          .find((t) => t.id === hovered);
        if (!task) return null;
        return (
          <div className="rounded-lg border bg-card p-3 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {task.loteamentoNome} — {task.label}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDateBR(task.start)} → {formatDateBR(task.end)}
                  {task.endReal && (
                    <> · Entregue em {formatDateBR(task.endReal)}</>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {task.isAtrasada && (
                  <Badge variant="destructive">Atrasada</Badge>
                )}
                <Badge
                  variant={
                    task.status === "disponivel"
                      ? "success"
                      : task.status === "reservado"
                        ? "warning"
                        : "default"
                  }
                >
                  {task.etapaPercent}%
                </Badge>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2 border-t pt-2 text-xs sm:grid-cols-3">
              <div>
                <span className="text-muted-foreground">Duração: </span>
                <span className="font-medium">{task.duracaoDias} dias</span>
              </div>
              {task.previsaoPaceFim && (
                <div>
                  <span className="text-muted-foreground">Previsão (ritmo): </span>
                  <span className="font-medium">
                    {formatDateBR(task.previsaoPaceFim)}
                  </span>
                </div>
              )}
              {task.paceDesvioDias != null && task.paceDesvioDias !== 0 && (
                <div>
                  <span className="text-muted-foreground">Ritmo: </span>
                  <span
                    className={
                      task.paceDesvioDias > 0
                        ? "font-medium text-destructive"
                        : "font-medium text-success"
                    }
                  >
                    {task.paceDesvioDias > 0
                      ? `${task.paceDesvioDias}d atrasado`
                      : `${Math.abs(task.paceDesvioDias)}d adiantado`}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function Legend({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-sm", dot)} />
      <span className="text-foreground">{label}</span>
    </span>
  );
}
