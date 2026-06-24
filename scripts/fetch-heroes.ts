/**
 * One-time script: fetches hero data from OpenDota API, downloads portrait images,
 * and writes src/data/heroes.json + public/heroes/{slug}.png
 *
 * Run: bun scripts/fetch-heroes.ts
 */

const OPENDOTA = "https://api.opendota.com/api";
const CDN_HORIZONTAL = (slug: string) =>
  `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${slug}.png`;
const CDN_ICON = (slug: string) =>
  `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/${slug}.png`;

interface ItemData {
  id?: number;
  dname?: string;
  qual?: string;
  cost?: number;
}

function isExcludedItem(key: string, val: ItemData): boolean {
  if (key.startsWith("recipe_")) return true;
  if (key.startsWith("river_painter")) return true;
  if (val.qual?.includes("consumable")) return true;
  if (val.qual === "component") return true;
  if (val.qual === "secret_shop") return true;
  if (val.cost === 0) return true;
  return false;
}

const ATTR_RU: Record<string, string> = {
  str: "Сила",
  agi: "Ловкость",
  int: "Интеллект",
  all: "Универсальный атрибут",
};

const ATTACK_RU: Record<string, string> = {
  Melee: "ближнем бою",
  Ranged: "дальней дистанции",
};

const LANE_BY_ROLE: Record<string, string> = {
  Carry: "Carry",
  Nuker: "Nuker",
  Disabler: "Disabler",
  Jungle: "Jungle",
  Durable: "Durable",
  Escape: "Escape",
  Pusher: "Pusher",
  Initiator: "Initiator",
  Support: "Support",
};

function deriveHint(type: string, value: string): string {
  switch (type) {
    case "attr":
      return `Основная характеристика этого героя — ${ATTR_RU[value] ?? value}`;
    case "attack":
      return `Этот герой сражается в ${ATTACK_RU[value] ?? value}`;
    case "role":
      return `Этот герой чаще всего играет роль ${value}`;
    case "lane":
      return `Этот герой обычно играет на ${value}`;
    case "item":
      return `Этот герой часто собирает ${value}`;
    case "best_vs":
      return `Этот герой эффективен против ${value}`;
    case "worst_vs":
      return `Этот герой слабее против ${value}`;
    default:
      return value;
  }
}

function sleep(ms: number): Promise<void> {
  return Bun.sleep(ms);
}

async function fetchJson<T>(url: string, retries = 3): Promise<T> {
  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, {
      headers: { "User-Agent": "dotaspy-game/1.0" },
    });
    if (res.status === 429 || res.status >= 500) {
      await sleep(2000 * (attempt + 1));
      continue;
    }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json() as Promise<T>;
  }
  throw new Error(`Failed after ${retries} retries: ${url}`);
}

async function downloadImage(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) return;
  await Bun.write(dest, res);
}

async function fileExists(path: string): Promise<boolean> {
  return Bun.file(path).exists();
}

interface OdHero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
}

interface OdItemPop {
  start_game_items: Record<string, number>;
  early_game_items: Record<string, number>;
  mid_game_items: Record<string, number>;
  late_game_items: Record<string, number>;
}

interface OdMatchup {
  hero_id: number;
  games_played: number;
  wins: number;
}

interface Hero {
  id: number;
  slug: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  hints: string[];
}

function isComplete(h: Hero): boolean {
  const hasItems = h.hints.some((s) => s.includes("собирает"));
  const hasMatchups = h.hints.some(
    (s) => s.includes("эффективен") || s.includes("слабее"),
  );
  return hasItems && hasMatchups;
}

async function main() {
  await Bun.write("public/heroes/.keep", "");
  await Bun.write("public/icons/.keep", "");
  await Bun.write("src/data/.keep", "");

  console.log("Fetching hero list...");
  const heroes = await fetchJson<OdHero[]>(`${OPENDOTA}/heroes`);

  console.log("Fetching item constants...");
  const itemsConst = await fetchJson<Record<string, ItemData>>(
    `${OPENDOTA}/constants/items`,
  );

  const itemById = new Map<number, string>();
  const itemKeyById = new Map<number, string>();
  const itemDataById = new Map<number, ItemData>();
  for (const [key, val] of Object.entries(itemsConst)) {
    if (val.id !== undefined && val.dname) {
      itemById.set(val.id, val.dname);
      itemKeyById.set(val.id, key);
      itemDataById.set(val.id, val);
    }
  }

  const heroById = new Map<number, string>(
    heroes.map((h) => [h.id, h.localized_name]),
  );

  let existing: Hero[] = [];
  try {
    existing = await Bun.file("src/data/heroes.json").json();
  } catch {
    /* first run */
  }
  const existingById = new Map(existing.map((h) => [h.id, h]));

  const result: Hero[] = [];
  const total = heroes.length;

  for (let i = 0; i < heroes.length; i++) {
    const h = heroes[i]!;
    const slug = h.name.replace("npc_dota_hero_", "");
    const prev = existingById.get(h.id);

    process.stdout.write(
      `\r[${i + 1}/${total}] ${h.localized_name.padEnd(30)}`,
    );

    const imgPath = `public/heroes/${slug}.png`;
    if (!(await fileExists(imgPath))) {
      await downloadImage(CDN_HORIZONTAL(slug), imgPath);
    }

    const iconPath = `public/icons/${slug}.png`;
    if (!(await fileExists(iconPath))) {
      await downloadImage(CDN_ICON(slug), iconPath);
    }

    if (prev && isComplete(prev)) {
      result.push(prev);
      continue;
    }

    let topItems: string[] = [];
    try {
      const pop = await fetchJson<OdItemPop>(
        `${OPENDOTA}/heroes/${h.id}/itemPopularity`,
      );
      const combined: Record<string, number> = {
        ...pop.mid_game_items,
        ...pop.late_game_items,
      };
      topItems = Object.entries(combined)
        .sort(([, a], [, b]) => b - a)
        .flatMap(([idStr]) => {
          const id = parseInt(idStr);
          const name = itemById.get(id);
          if (!name) return [];
          const key = itemKeyById.get(id) ?? "";
          const data = itemDataById.get(id) ?? {};
          if (isExcludedItem(key, data)) return [];
          return [name];
        })
        .slice(0, 5);
      await sleep(600);
    } catch {
      /* skip */
    }

    let bestVs: string[] = [];
    let worstVs: string[] = [];
    try {
      const matchups = await fetchJson<OdMatchup[]>(
        `${OPENDOTA}/heroes/${h.id}/matchups`,
      );
      const ranked = matchups
        .filter((m) => m.games_played > 100)
        .map((m) => ({ id: m.hero_id, rate: m.wins / m.games_played }))
        .sort((a, b) => b.rate - a.rate);
      bestVs = ranked
        .slice(0, 3)
        .map((m) => heroById.get(m.id) ?? "")
        .filter(Boolean);
      worstVs = ranked
        .slice(-3)
        .reverse()
        .map((m) => heroById.get(m.id) ?? "")
        .filter(Boolean);
      await sleep(600);
    } catch {
      /* skip */
    }

    const hints: string[] = [];
    for (const role of h.roles.slice(0, 2))
      hints.push(deriveHint("role", role));
    const lane = LANE_BY_ROLE[h.roles[0] ?? ""];
    if (lane) hints.push(deriveHint("lane", lane));
    for (const item of topItems) hints.push(deriveHint("item", item));
    for (const name of bestVs) hints.push(deriveHint("best_vs", name));
    for (const name of worstVs) hints.push(deriveHint("worst_vs", name));
    hints.push(deriveHint("attr", h.primary_attr));
    hints.push(deriveHint("attack", h.attack_type));

    result.push({
      id: h.id,
      slug,
      localized_name: h.localized_name,
      primary_attr: h.primary_attr,
      attack_type: h.attack_type,
      roles: h.roles,
      hints,
    });
  }

  console.log("\nWriting src/data/heroes.json...");
  await Bun.write("src/data/heroes.json", JSON.stringify(result, null, 2));
  console.log(`Done. ${result.length} heroes saved.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
