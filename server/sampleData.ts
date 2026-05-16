import type { RadarSeries } from "./types";

export const sampleSeries: RadarSeries[] = [
  {
    id: 501,
    name: "IMSA SportsCar Championship",
    license: "B",
    category: "Sports Car",
    cars: ["GTP", "LMP2", "GT3"],
    fixed: false,
    currentWeek: 8,
    schedule: [
      { week: 1, startsOn: "2026-03-17", track: "Sebring International Raceway", config: "International", raceLength: "45 min" },
      { week: 2, startsOn: "2026-03-24", track: "Watkins Glen International", config: "Boot", raceLength: "45 min" },
      { week: 3, startsOn: "2026-03-31", track: "Autodromo Internazionale Enzo e Dino Ferrari", config: "Grand Prix", raceLength: "45 min" },
      { week: 4, startsOn: "2026-04-07", track: "Daytona International Speedway", config: "Road Course", raceLength: "45 min" },
      { week: 5, startsOn: "2026-04-14", track: "Road America", config: "Full Course", raceLength: "45 min" },
      { week: 6, startsOn: "2026-04-21", track: "Circuit de Spa-Francorchamps", config: "Grand Prix Pits", raceLength: "45 min" },
      { week: 7, startsOn: "2026-04-28", track: "Canadian Tire Motorsports Park", config: "Grand Prix", raceLength: "45 min" },
      { week: 8, startsOn: "2026-05-05", track: "Long Beach Street Circuit", config: "Full Course", raceLength: "45 min" },
      { week: 9, startsOn: "2026-05-12", track: "Road Atlanta", config: "Full Course", raceLength: "45 min" },
      { week: 10, startsOn: "2026-05-19", track: "Suzuka International Racing Course", config: "Grand Prix", raceLength: "45 min" },
      { week: 11, startsOn: "2026-05-26", track: "Virginia International Raceway", config: "Full Course", raceLength: "45 min" },
      { week: 12, startsOn: "2026-06-02", track: "Le Mans", config: "24 Heures du Mans", raceLength: "45 min" }
    ]
  },
  {
    id: 502,
    name: "GT3 Fanatec Challenge - Fixed",
    license: "B",
    category: "Sports Car",
    cars: ["GT3"],
    fixed: true,
    currentWeek: 8,
    schedule: [
      { week: 1, startsOn: "2026-03-17", track: "Mount Panorama Circuit", config: "Bathurst", raceLength: "20 min" },
      { week: 2, startsOn: "2026-03-24", track: "Nurburgring Grand-Prix-Strecke", config: "Grand Prix", raceLength: "20 min" },
      { week: 3, startsOn: "2026-03-31", track: "Road Atlanta", config: "Full Course", raceLength: "20 min" },
      { week: 4, startsOn: "2026-04-07", track: "Autodromo Nazionale Monza", config: "Grand Prix", raceLength: "20 min" },
      { week: 5, startsOn: "2026-04-14", track: "Circuit Zandvoort", config: "Grand Prix", raceLength: "20 min" },
      { week: 6, startsOn: "2026-04-21", track: "Brands Hatch Circuit", config: "Grand Prix", raceLength: "20 min" },
      { week: 7, startsOn: "2026-04-28", track: "Sebring International Raceway", config: "International", raceLength: "20 min" },
      { week: 8, startsOn: "2026-05-05", track: "Watkins Glen International", config: "Boot", raceLength: "20 min" },
      { week: 9, startsOn: "2026-05-12", track: "Circuit de Barcelona Catalunya", config: "Historic", raceLength: "20 min" },
      { week: 10, startsOn: "2026-05-19", track: "Silverstone Circuit", config: "Grand Prix", raceLength: "20 min" },
      { week: 11, startsOn: "2026-05-26", track: "Fuji International Speedway", config: "Grand Prix", raceLength: "20 min" },
      { week: 12, startsOn: "2026-06-02", track: "Daytona International Speedway", config: "Road Course", raceLength: "20 min" }
    ]
  },
  {
    id: 503,
    name: "Prototype Challenge",
    license: "C",
    category: "Sports Car",
    cars: ["LMP3"],
    fixed: false,
    currentWeek: 8,
    schedule: [
      { week: 1, startsOn: "2026-03-17", track: "Oulton Park Circuit", config: "International", raceLength: "25 min" },
      { week: 2, startsOn: "2026-03-24", track: "Road America", config: "Full Course", raceLength: "25 min" },
      { week: 3, startsOn: "2026-03-31", track: "Circuit de Nevers Magny-Cours", config: "Grand Prix", raceLength: "25 min" },
      { week: 4, startsOn: "2026-04-07", track: "Sebring International Raceway", config: "International", raceLength: "25 min" },
      { week: 5, startsOn: "2026-04-14", track: "Watkins Glen International", config: "Boot", raceLength: "25 min" },
      { week: 6, startsOn: "2026-04-21", track: "Hockenheimring Baden-Wurttemberg", config: "Grand Prix", raceLength: "25 min" },
      { week: 7, startsOn: "2026-04-28", track: "Virginia International Raceway", config: "Full Course", raceLength: "25 min" },
      { week: 8, startsOn: "2026-05-05", track: "Autodromo Internazionale Enzo e Dino Ferrari", config: "Grand Prix", raceLength: "25 min" },
      { week: 9, startsOn: "2026-05-12", track: "Canadian Tire Motorsports Park", config: "Grand Prix", raceLength: "25 min" },
      { week: 10, startsOn: "2026-05-19", track: "Circuit de Spa-Francorchamps", config: "Grand Prix Pits", raceLength: "25 min" },
      { week: 11, startsOn: "2026-05-26", track: "Red Bull Ring", config: "Grand Prix", raceLength: "25 min" },
      { week: 12, startsOn: "2026-06-02", track: "Le Mans", config: "24 Heures du Mans", raceLength: "25 min" }
    ]
  },
  {
    id: 504,
    name: "Production Car Sim-Lab Challenge",
    license: "D",
    category: "Sports Car",
    cars: ["MX-5", "GR86", "Clio", "Mustang"],
    fixed: true,
    currentWeek: 8,
    schedule: [
      { week: 1, startsOn: "2026-03-17", track: "Okayama International Circuit", config: "Full Course", raceLength: "25 min" },
      { week: 2, startsOn: "2026-03-24", track: "Lime Rock Park", config: "Grand Prix", raceLength: "25 min" },
      { week: 3, startsOn: "2026-03-31", track: "Summit Point Motorsports Park", config: "Summit Point Raceway", raceLength: "25 min" },
      { week: 4, startsOn: "2026-04-07", track: "Virginia International Raceway", config: "North Course", raceLength: "25 min" },
      { week: 5, startsOn: "2026-04-14", track: "Rudskogen Motorsenter", config: "Full Course", raceLength: "25 min" },
      { week: 6, startsOn: "2026-04-21", track: "Tsukuba Circuit", config: "2000 Full", raceLength: "25 min" },
      { week: 7, startsOn: "2026-04-28", track: "Oulton Park Circuit", config: "Fosters", raceLength: "25 min" },
      { week: 8, startsOn: "2026-05-05", track: "Snetterton Circuit", config: "300", raceLength: "25 min" },
      { week: 9, startsOn: "2026-05-12", track: "Brands Hatch Circuit", config: "Indy", raceLength: "25 min" },
      { week: 10, startsOn: "2026-05-19", track: "Okayama International Circuit", config: "Short", raceLength: "25 min" },
      { week: 11, startsOn: "2026-05-26", track: "Charlotte Motor Speedway", config: "Roval", raceLength: "25 min" },
      { week: 12, startsOn: "2026-06-02", track: "Oran Park Raceway", config: "Grand Prix", raceLength: "25 min" }
    ]
  }
];
