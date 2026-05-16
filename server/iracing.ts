import { sampleSeries } from "./sampleData";
import { getImportedSchedule } from "./pdfImport";
import { enrichWithLogos } from "./seriesLogos";
import type { RadarSeries, RadarWeek } from "./types";

function weekStartDate(week: RadarWeek) {
  return week.startsOn ? new Date(`${week.startsOn}T00:00:00`) : null;
}

function currentWeekFor(schedule: RadarWeek[]) {
  const now = new Date();
  const startedWeeks = schedule.filter((week) => {
    const start = weekStartDate(week);
    return start ? start <= now : false;
  });

  return startedWeeks.at(-1)?.week ?? schedule[0]?.week ?? 1;
}

function withDynamicCurrentWeek(series: RadarSeries[]) {
  return series.map((item) => ({
    ...item,
    currentWeek: currentWeekFor(item.schedule)
  }));
}

export async function getSportsCarRadar(): Promise<{ source: "sample" | "pdf"; series: RadarSeries[]; message?: string }> {
  const imported = await getImportedSchedule();
  if (imported?.series.length) {
    return {
      source: "pdf",
      series: enrichWithLogos(withDynamicCurrentWeek(imported.series)),
      message: `Imported from ${imported.fileName} on ${new Date(imported.importedAt).toLocaleString("cs-CZ")}.`
    };
  }

  return {
    source: "sample",
    series: enrichWithLogos(withDynamicCurrentWeek(sampleSeries)),
    message: "Import an iRacing Season Schedule PDF to use real Sports Car data."
  };
}
