import type { RadarSeries } from "./types";

const BASE = "https://ir-core-sites.iracing.com/members/member_images/series/seriesid_";

function url(id: number) {
  return `${BASE}${id}/logo.jpg`;
}

// name fragments → iRacing series ID
const rules: Array<{ patterns: string[]; url: string }> = [
  { patterns: ["imsa"], url: url(227) },
  { patterns: ["gt3 challenge fixed", "fanatec"], url: url(444) },
  { patterns: ["prototype challenge"], url: url(343) },
  { patterns: ["sim-lab", "simlab", "production car challenge"], url: url(112) },
  { patterns: ["global mazda mx-5", "mazda mx-5 cup", "mx-5 cup"], url: url(139) },
  { patterns: ["advanced mazda"], url: url(231) },
  { patterns: ["gr86", "gr 86"], url: url(315) },
  { patterns: ["porsche cup", "conspit"], url: url(299) },
  { patterns: ["global endurance"], url: url(331) },
  { patterns: ["ferrari 296", "ferrari challenge"], url: url(360) },
  { patterns: ["bmw m2 cup"], url: url(571) },
  { patterns: ["bmw m power"], url: url(5212) },
  { patterns: ["clio cup"], url: url(5205) },
  { patterns: ["mustang challenge", "skip barber"], url: url(5569) },
  { patterns: ["legends road cup"], url: url(5031) },
  { patterns: ["mission r"], url: url(5570) },
  { patterns: ["nurburgring endurance", "ring meister", "lvry"], url: url(4862) },
  { patterns: ["production endurance"], url: url(5565) },
  { patterns: ["rain master"], url: url(4871) },
  { patterns: ["spec racer ford"], url: url(4876) },
  { patterns: ["tcr virtual challenge"], url: url(4567) },
  { patterns: ["gt endurance series"], url: url(5758) },
  { patterns: ["gt4 falken"], url: url(5405) },
  { patterns: ["lmp3 trophy"], url: url(5578) },
  { patterns: ["radical esports"], url: url(5581) },
  { patterns: ["sports car challenge by falken", "falken tyre challenge"], url: url(4881) },
  { patterns: ["gt sprint series"], url: url(5759) },
  { patterns: ["gte sprint"], url: url(5060) },
  { patterns: ["gt3 regional tour"], url: url(5928) },
  { patterns: ["lmp2 challenge"], url: url(5932) },
  { patterns: ["proto-gt"], url: url(5229) },
  { patterns: ["global sports car challenge"], url: url(112) },
  { patterns: ["porsche esports supercup", "porsche supercup"], url: url(472) },
  { patterns: ["stock car brasil"], url: url(493) },
  { patterns: ["supercars series"], url: url(399) },
  { patterns: ["dtm series", "iracing dtm"], url: url(619) },
];

export function resolveLogoUrl(name: string): string | undefined {
  const lower = name.toLowerCase();
  return rules.find((rule) => rule.patterns.some((p) => lower.includes(p)))?.url;
}

export function enrichWithLogos(series: RadarSeries[]): RadarSeries[] {
  return series.map((s) => ({
    ...s,
    logoUrl: s.logoUrl ?? resolveLogoUrl(s.name),
  }));
}
