export type RadarWeek = {
  week: number;
  startsOn?: string;
  track: string;
  config?: string;
  raceLength?: string;
};

export type RadarSeries = {
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
