import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Eye,
  Gauge,
  RefreshCw,
  Settings,
  X,
  Trash2,
  Upload,
  Search,
  Star,
  StarOff
} from "lucide-react";
import "./styles.css";

type RadarWeek = {
  week: number;
  startsOn?: string;
  track: string;
  config?: string;
  raceLength?: string;
};

type RadarSeries = {
  id: number;
  name: string;
  license?: string;
  category: string;
  cars: string[];
  fixed: boolean;
  raceEveryMinutes?: number;
  raceMinuteOffsets?: number[];
  currentWeek: number;
  schedule: RadarWeek[];
  logoUrl?: string;
};

type RadarResponse = {
  source: "sample" | "pdf";
  series: RadarSeries[];
  message?: string;
};

type AppSettings = {
  selectedSeries: number[];
  ownedTracks: string[];
  exists?: boolean;
};

type DiscoveryItem = {
  series: RadarSeries;
  week: RadarWeek;
  isWatched: boolean;
};

type WatchGroup = {
  key: string;
  title: string;
  matcher: (series: RadarSeries) => boolean;
};

const selectedKey = "iracing-race-radar:selected-series";
const ownedTracksKey = "iracing-race-radar:owned-tracks";

const watchGroups: WatchGroup[] = [
  {
    key: "mazda-mx5",
    title: "Mazda MX-5",
    matcher: (series) => matchesSeries(series, ["mx-5", "mx5", "mazda"])
  },
  {
    key: "toyota-gr86",
    title: "Toyota GR86",
    matcher: (series) => matchesSeries(series, ["gr86", "gr 86", "toyota"])
  },
  {
    key: "porsche-gt3",
    title: "GT3",
    matcher: (series) =>
      matchesSeries(series, [
        "porsche 911 gt3 r",
        "porsche gt3",
        "992 r",
        "global endurance tour",
        "imsa endurance series",
        "imsa iracing series"
      ])
  },
  {
    key: "porsche-cup",
    title: "Porsche Cup",
    matcher: (series) => matchesSeries(series, ["porsche cup", "911 gt3 cup", "cup by conspit"])
  },
  {
    key: "ferrari-296-challenge",
    title: "Ferrari 296 Challenge",
    matcher: (series) => matchesSeries(series, ["ferrari 296 challenge"])
  }
];

function formatDate(value?: string) {
  if (!value) return "";
  return new Intl.DateTimeFormat("cs-CZ", { day: "numeric", month: "short" }).format(new Date(value));
}

function getWindow(series: RadarSeries, weeksAhead: number) {
  return series.schedule.filter((week) => week.week >= series.currentWeek && week.week <= series.currentWeek + weeksAhead);
}

function nextRaceStart(series: RadarSeries) {
  const interval = series.raceEveryMinutes;
  const offsets = series.raceMinuteOffsets?.length ? series.raceMinuteOffsets : undefined;
  if (!interval || !offsets) return undefined;

  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const candidates = new Map<number, Date>();

  for (let dayOffset = 0; dayOffset <= 1; dayOffset += 1) {
    const dayStart = new Date(today);
    dayStart.setDate(today.getDate() + dayOffset);

    for (const offset of offsets) {
      for (let minuteOfDay = offset; minuteOfDay < 24 * 60; minuteOfDay += interval) {
        const candidate = new Date(dayStart);
        candidate.setMinutes(minuteOfDay);
        if (candidate > now) {
          candidates.set(candidate.getTime(), candidate);
        }
      }
    }
  }

  return [...candidates.values()].sort((a, b) => a.getTime() - b.getTime())[0];
}

function formatTime(value?: Date) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("cs-CZ", { hour: "2-digit", minute: "2-digit" }).format(value);
}

function matchesSeries(series: RadarSeries, needles: string[]) {
  const haystack = [series.name, ...series.cars].join(" ").toLowerCase();
  return needles.some((needle) => haystack.includes(needle));
}

function groupWatchlist(series: RadarSeries[]) {
  const grouped = watchGroups.map((group) => ({
    ...group,
    series: [] as RadarSeries[]
  }));
  const other = {
    key: "other",
    title: "Ostatní",
    matcher: () => false,
    series: [] as RadarSeries[]
  };

  for (const item of series) {
    const group = grouped.find((candidate) => candidate.matcher(item));
    (group ?? other).series.push(item);
  }

  return [...grouped, other].filter((group) => group.series.length > 0);
}

function loadSelectedSeries() {
  return loadStringArray(selectedKey).filter((item): item is number => typeof item === "number");
}

function loadOwnedTracks() {
  return loadStringArray(ownedTracksKey).filter((item): item is string => typeof item === "string");
}

function loadStringArray(key: string) {
  const stored = localStorage.getItem(key);
  if (!stored) return [];

  try {
    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function trackKey(track: string) {
  return track.trim().toLowerCase();
}

function App() {
  const [data, setData] = useState<RadarResponse | null>(null);
  const [selected, setSelected] = useState<number[]>(loadSelectedSeries);
  const [ownedTracks, setOwnedTracks] = useState<string[]>(loadOwnedTracks);
  const [query, setQuery] = useState("");
  const [trackQuery, setTrackQuery] = useState("");
  const [ownedTrackQuery, setOwnedTrackQuery] = useState("");
  const [weeksAhead] = useState(4);
  const [view, setView] = useState<"watchlist" | "discover">("watchlist");
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const lastLoadAt = useRef(0);

  async function saveSettings(nextSelected: number[], nextOwnedTracks: string[]) {
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ selectedSeries: nextSelected, ownedTracks: nextOwnedTracks })
    });
  }

  function validSelectedSeries(radar: RadarResponse, selectedSeries: number[]) {
    const availableIds = new Set(radar.series.map((item) => item.id));
    const stillAvailable = selectedSeries.filter((id) => availableIds.has(id));
    return stillAvailable.length ? stillAvailable : radar.series.slice(0, 3).map((item) => item.id);
  }

  async function loadRadar() {
    setLoading(true);
    lastLoadAt.current = Date.now();
    const [radarResponse, settingsResponse] = await Promise.all([fetch("/api/radar"), fetch("/api/settings")]);
    const radar = (await radarResponse.json()) as RadarResponse;
    const backendSettings = (await settingsResponse.json()) as AppSettings;
    const localSelected = loadSelectedSeries();
    const localOwnedTracks = loadOwnedTracks();
    const shouldMigrate =
      (!backendSettings.exists && (localSelected.length > 0 || localOwnedTracks.length > 0)) ||
      (backendSettings.selectedSeries.length === 0 && localSelected.length > 0);
    const sourceSettings = shouldMigrate
      ? {
          selectedSeries: localSelected,
          ownedTracks: backendSettings.ownedTracks.length ? backendSettings.ownedTracks : localOwnedTracks
        }
      : backendSettings;
    const nextSelected = validSelectedSeries(radar, sourceSettings.selectedSeries);
    const nextOwnedTracks = sourceSettings.ownedTracks;

    setData(radar);
    setSelected(nextSelected);
    setOwnedTracks(nextOwnedTracks);

    if (shouldMigrate || nextSelected.length !== sourceSettings.selectedSeries.length) {
      await saveSettings(nextSelected, nextOwnedTracks);
    }

    setLoading(false);
  }

  async function importPdf(file?: File) {
    if (!file) return;

    setImporting(true);
    setImportMessage("");

    const formData = new FormData();
    formData.append("schedule", file);

    const response = await fetch("/api/import/pdf", { method: "POST", body: formData });
    const payload = (await response.json()) as { seriesCount?: number; message?: string };

    if (!response.ok) {
      setImportMessage(payload.message ?? "PDF se nepodařilo naimportovat.");
    } else {
      setImportMessage(`Naimportováno ${payload.seriesCount ?? 0} Sports Car sérií.`);
      await loadRadar();
    }

    setImporting(false);
  }

  async function clearPdfImport() {
    await fetch("/api/import/pdf", { method: "DELETE" });
    setImportMessage("Import byl odebrán.");
    await loadRadar();
  }

  useEffect(() => {
    void loadRadar();
  }, []);

  useEffect(() => {
    function handleVisibility() {
      if (document.hidden) return;
      if (Date.now() - lastLoadAt.current < 15 * 60_000) return;
      void loadRadar();
    }
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  const allTracks = useMemo(() => {
    const tracks = new Map<string, string>();
    for (const series of data?.series ?? []) {
      for (const week of series.schedule) {
        tracks.set(trackKey(week.track), week.track);
      }
    }
    return [...tracks.entries()].map(([key, label]) => ({ key, label })).sort((a, b) => a.label.localeCompare(b.label));
  }, [data]);

  const ownedTrackSet = useMemo(() => new Set(ownedTracks), [ownedTracks]);

  const filteredTracks = useMemo(() => {
    const normalizedQuery = ownedTrackQuery.trim().toLowerCase();
    return allTracks.filter((track) => !normalizedQuery || track.label.toLowerCase().includes(normalizedQuery));
  }, [allTracks, ownedTrackQuery]);

  const filteredSeries = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (data?.series ?? []).filter((series) => {
      if (!normalizedQuery) return true;
      return [series.name, series.license, ...series.cars].join(" ").toLowerCase().includes(normalizedQuery);
    });
  }, [data, query]);

  const watchedSeries = useMemo(() => {
    return (data?.series ?? []).filter((series) => selected.includes(series.id));
  }, [data, selected]);

  const discovery = useMemo<DiscoveryItem[]>(() => {
    const normalizedTrackQuery = trackQuery.trim().toLowerCase();

    return (data?.series ?? [])
      .flatMap((series) =>
        getWindow(series, weeksAhead).map((week) => ({
          series,
          week,
          isWatched: selected.includes(series.id)
        }))
      )
      .filter(({ series, week }) => {
        if (!normalizedTrackQuery) return true;
        return [week.track, week.config, series.name, ...series.cars].join(" ").toLowerCase().includes(normalizedTrackQuery);
      })
      .sort((a, b) => {
        if (a.week.week !== b.week.week) return a.week.week - b.week.week;
        if (a.isWatched !== b.isWatched) return Number(b.isWatched) - Number(a.isWatched);
        return a.series.name.localeCompare(b.series.name);
      });
  }, [data, selected, trackQuery, weeksAhead]);

  const currentDiscoveries = discovery.filter((item) => item.week.week === item.series.currentWeek);
  const upcomingDiscoveries = discovery.filter((item) => item.week.week !== item.series.currentWeek);

  function toggleSeries(id: number) {
    setSelected((current) => {
      const nextSelected = current.includes(id) ? current.filter((item) => item !== id) : [...current, id];
      void saveSettings(nextSelected, ownedTracks);
      return nextSelected;
    });
  }

  function toggleOwnedTrack(key: string) {
    setOwnedTracks((current) => {
      const nextOwnedTracks = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
      void saveSettings(selected, nextOwnedTracks);
      return nextOwnedTracks;
    });
  }

  function setFilteredTrackOwnership(owned: boolean) {
    setOwnedTracks((current) => {
      const next = new Set(current);
      for (const track of filteredTracks) {
        if (owned) {
          next.add(track.key);
        } else {
          next.delete(track.key);
        }
      }
      const nextOwnedTracks = [...next];
      void saveSettings(selected, nextOwnedTracks);
      return nextOwnedTracks;
    });
  }

  if (!data && loading) {
    return (
      <main>
        <header className="topbar">
          <div>
            <p className="eyebrow">Sports Car only</p>
            <h1>iRacing Race Radar</h1>
          </div>
        </header>
        <div className="loadingState">
          <RefreshCw size={32} className="spin" />
          <p>Načítám data…</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <header className="topbar">
        <div>
          <p className="eyebrow">Sports Car only</p>
          <h1>iRacing Race Radar</h1>
        </div>
        <div className="topbarActions">
          <button
            className="iconButton"
            type="button"
            onClick={() => setSettingsOpen((open) => !open)}
            title={settingsOpen ? "Zavřít nastavení" : "Nastavení"}
            aria-label={settingsOpen ? "Zavřít nastavení" : "Nastavení"}
          >
            {settingsOpen ? <X size={18} /> : <Settings size={18} />}
          </button>
          <button className="iconButton" type="button" onClick={loadRadar} title="Obnovit data" aria-label="Obnovit data">
            <RefreshCw size={18} className={loading ? "spin" : ""} />
          </button>
        </div>
      </header>

      {settingsOpen ? (
        <section className="settingsPage">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">Nastavení</p>
              <h2>Data a vlastněné tratě</h2>
            </div>
          </div>

          <div className="settingsGrid">
            <section className="settingsPanel">
              <div className="settingsSubhead">
                <div>
                  <h3>Data kalendáře</h3>
                  <p>{data?.source === "pdf" ? "PDF import je aktivní" : "Používají se ukázková data"}</p>
                </div>
              </div>

              <div className="settingsSource">
                <span className={`source ${data?.source ?? "sample"}`}>{data?.source === "pdf" ? "Imported PDF" : "Sample data"}</span>
                <p>{data?.message ?? "Zobrazuji lokální Sports Car kalendář."}</p>
              </div>

              <div className="importBox">
                <input
                  id="pdf-import"
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(event) => void importPdf(event.currentTarget.files?.[0])}
                />
                <label className="importButton" htmlFor="pdf-import">
                  <Upload size={17} />
                  {importing ? "Importuji…" : "Import PDF"}
                </label>
                {data?.source === "pdf" ? (
                  <button className="dangerButton" type="button" onClick={clearPdfImport}>
                    <Trash2 size={16} />
                    Zrušit import
                  </button>
                ) : null}
                {importMessage ? <p>{importMessage}</p> : null}
              </div>
            </section>

            <section className="settingsPanel watchedSeriesPanel">
              <div className="settingsSubhead">
                <div>
                  <h3>Sledované série</h3>
                  <p>{selected.length} z {data?.series.length ?? 0}</p>
                </div>
              </div>

              <div className="settingsSearch">
                <Search size={17} />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Najít sérii nebo auto" />
              </div>

              <div className="settingsSeriesList">
                {filteredSeries.map((series) => {
                  const isSelected = selected.includes(series.id);
                  return (
                    <button type="button" className="seriesPicker" key={series.id} onClick={() => toggleSeries(series.id)}>
                      <span className="pickIcon">{isSelected ? <Star size={17} fill="currentColor" /> : <StarOff size={17} />}</span>
                      {series.logoUrl ? (
                        <img
                          src={series.logoUrl}
                          alt=""
                          className="seriesPickerLogo"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      ) : (
                        <span />
                      )}
                      <span>
                        <strong>{series.name}</strong>
                        <small>
                          {series.license ? `Licence ${series.license}` : "Sports Car"} · {series.fixed ? "Fixed" : "Open"}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="settingsPanel ownedTracksPanel">
              <div className="settingsSubhead">
                <div>
                  <h3>Vlastněné tratě</h3>
                  <p>{ownedTracks.length} z {allTracks.length}</p>
                </div>
                <div className="bulkActions">
                  <button type="button" onClick={() => setFilteredTrackOwnership(true)}>Mám vše</button>
                  <button type="button" onClick={() => setFilteredTrackOwnership(false)}>Nemám nic</button>
                </div>
              </div>

              <div className="settingsSearch">
                <Search size={17} />
                <input
                  value={ownedTrackQuery}
                  onChange={(event) => setOwnedTrackQuery(event.target.value)}
                  placeholder="Najít trať"
                />
              </div>

              <div className="trackChecklist">
                {filteredTracks.map((track) => (
                  <label className="trackCheck" key={track.key}>
                    <input
                      type="checkbox"
                      checked={ownedTrackSet.has(track.key)}
                      onChange={() => toggleOwnedTrack(track.key)}
                    />
                    <span>{track.label}</span>
                  </label>
                ))}
              </div>
            </section>
          </div>
        </section>
      ) : (
        <section className="radar">
          <div className="sectionHead">
            <div>
              <p className="eyebrow">{view === "watchlist" ? "Sledované série" : "Discovery radar"}</p>
              <h2>
                {view === "watchlist"
                  ? `${watchedSeries.length} sledovaných`
                  : `${discovery.length} kombinací`}
              </h2>
            </div>
            <div className="viewTools">
              <div className="viewSwitch" aria-label="Přepnout pohled">
                <button type="button" className={view === "watchlist" ? "active" : ""} onClick={() => setView("watchlist")}>
                  <Eye size={16} />
                  Watchlist
                </button>
                <button type="button" className={view === "discover" ? "active" : ""} onClick={() => setView("discover")}>
                  <Compass size={16} />
                  Objevit
                </button>
              </div>
              <div className="summaryPill">
                <Gauge size={16} />
                aktuální týden + {weeksAhead}
              </div>
            </div>
          </div>

          {view === "watchlist" ? (
            watchedSeries.length === 0 ? (
              <div className="emptyState">
                <StarOff size={40} strokeWidth={1.5} />
                <h3>Žádné sledované série</h3>
                <p>Přidej série v nastavení a uvidíš tady jejich aktuální tratě.</p>
                <button className="importButton" type="button" onClick={() => setSettingsOpen(true)}>
                  <Settings size={16} />
                  Otevřít nastavení
                </button>
              </div>
            ) : (
              <WatchlistTable series={watchedSeries} weeksAhead={weeksAhead} ownedTracks={ownedTrackSet} onToggle={toggleSeries} />
            )
          ) : (
            <div className="discoverPanel">
              <div className="discoverSearch">
                <Search size={17} />
                <input
                  value={trackQuery}
                  onChange={(event) => setTrackQuery(event.target.value)}
                  placeholder="Filtrovat podle tratě, auta nebo série"
                />
              </div>

              {discovery.length === 0 ? (
                <div className="emptyState">
                  <Search size={40} strokeWidth={1.5} />
                  <h3>Nic nenalezeno</h3>
                  <p>Zkus jiný výraz nebo rozšiř okno týdnů.</p>
                </div>
              ) : (
                <>
                  <DiscoverySection title="Jede se teď" items={currentDiscoveries} onToggle={toggleSeries} />
                  <DiscoverySection title="Následující týdny" items={upcomingDiscoveries} onToggle={toggleSeries} />
                </>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

function weekLabel(week?: RadarWeek) {
  if (!week) return "Není v kalendáři";
  return week.config ? `${week.track} - ${week.config}` : week.track;
}

function WatchlistTable({
  series,
  weeksAhead,
  ownedTracks,
  onToggle
}: {
  series: RadarSeries[];
  weeksAhead: number;
  ownedTracks: Set<string>;
  onToggle: (id: number) => void;
}) {
  const groups = groupWatchlist(series);

  return (
    <div className="watchGroups">
      {groups.map((group) => (
        <section className="watchGroup" key={group.key}>
          <div className="watchGroupHead">
            <h3>{group.title}</h3>
            <span>{group.series.length}</span>
          </div>

          <div className="watchTable">
            <div className="watchHeader">
              <span>Série</span>
              <span>Délka</span>
              <span>Aktuální trať</span>
              <span>Příští týden</span>
            </div>

            {group.series.map((item) => {
              const currentWeek = item.schedule.find((week) => week.week === item.currentWeek);
              const nextWeek = item.schedule.find((week) => week.week === item.currentWeek + 1);
              const futureWeeks = getWindow(item, weeksAhead);
              const nextStart = nextRaceStart(item);

              return (
                <details className="watchRow" key={item.id}>
                  <summary>
                    <div className="seriesCell">
                      {item.logoUrl && (
                        <img
                          src={item.logoUrl}
                          alt=""
                          className="seriesLogo"
                          onError={(e) => { e.currentTarget.style.display = "none"; }}
                        />
                      )}
                      <div className="seriesCellText">
                        <strong>{item.name}</strong>
                        <div className="seriesMeta">
                          <span className="seriesType">{item.fixed ? "Fixed" : "Open"}</span>
                          {item.license && <span className="licenseBadge">{item.license}</span>}
                        </div>
                      </div>
                    </div>
                    <DurationCell week={currentWeek ?? nextWeek} nextStart={nextStart} />
                    <TrackCell week={currentWeek} ownedTracks={ownedTracks} />
                    <TrackCell week={nextWeek} ownedTracks={ownedTracks} />
                  </summary>

                  <div className="watchDetails">
                    <div className="detailHead">
                      <div className="carsLine">
                        <span>Auta</span>
                        <strong>{item.cars.length ? item.cars.join(" / ") : "Sports Car"}</strong>
                      </div>
                      <button className="removeButton" type="button" onClick={() => onToggle(item.id)}>
                        <Check size={16} />
                        Ze sledování
                      </button>
                    </div>

                    <div className="compactWeeks">
                      {futureWeeks.map((week) => (
                        <div
                          className={`compactWeek ${week.week === item.currentWeek ? "current" : ""} ${
                            ownedTracks.has(trackKey(week.track)) ? "owned" : "missing"
                          }`}
                          key={`${item.id}-${week.week}`}
                        >
                          <div className="compactWeekBadge">
                            <CalendarDays size={15} />
                            W{week.week}
                          </div>
                          <div>
                            <strong>{weekLabel(week)}</strong>
                            <span>
                              {week.startsOn ? formatDate(week.startsOn) : "bez data"}
                              {week.raceLength ? ` · ${week.raceLength}` : ""}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </details>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function TrackCell({ week, ownedTracks }: { week?: RadarWeek; ownedTracks: Set<string> }) {
  const owned = week ? ownedTracks.has(trackKey(week.track)) : false;

  return (
    <div className={`trackCell ${week ? (owned ? "owned" : "missing") : ""}`}>
      <strong>{week?.track ?? "Není v kalendáři"}</strong>
      <span>
        {week?.config ?? " "}
        {week?.startsOn ? ` · ${formatDate(week.startsOn)}` : ""}
      </span>
    </div>
  );
}

function DurationCell({ week, nextStart }: { week?: RadarWeek; nextStart?: Date }) {
  return (
    <div className="durationCell">
      <strong>{formatTime(nextStart)}</strong>
      <span>
        <Clock3 size={14} />
        {week?.raceLength ?? "-"}
      </span>
    </div>
  );
}

function DiscoverySection({
  title,
  items,
  onToggle
}: {
  title: string;
  items: DiscoveryItem[];
  onToggle: (id: number) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="discoverySection">
      <div className="discoveryHead">
        <h3>{title}</h3>
        <span>{items.length}</span>
      </div>
      <div className="discoveryList">
        {items.map(({ series, week, isWatched }) => (
          <article className={`discoveryRow ${isWatched ? "watched" : ""}`} key={`${series.id}-${week.week}`}>
            <button
              type="button"
              className="watchToggle"
              onClick={() => onToggle(series.id)}
              title={isWatched ? "Odebrat ze sledování" : "Přidat do sledování"}
              aria-label={isWatched ? "Odebrat ze sledování" : "Přidat do sledování"}
            >
              {isWatched ? <Star size={17} fill="currentColor" /> : <StarOff size={17} />}
            </button>
            <div className="discoveryMain">
              <div>
                <strong>{week.track}</strong>
                <span>{week.config || "Full course"}</span>
              </div>
              <div className="discoverySeriesLine">
                {series.logoUrl && (
                  <img
                    src={series.logoUrl}
                    alt=""
                    className="discoveryLogo"
                    onError={(e) => { e.currentTarget.style.display = "none"; }}
                  />
                )}
                <p>{series.name}</p>
              </div>
            </div>
            <div className="discoveryMeta">
              <span>W{week.week}</span>
              {week.startsOn ? <span>{formatDate(week.startsOn)}</span> : null}
              <small>{series.cars.length ? series.cars.join(" / ") : "Sports Car"}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
