/**
 * Bible API integration using bible-api.com (free, no API key required).
 * Endpoint: https://bible-api.com/{reference}?translation=kjv
 *
 * Each day of the year maps to a curated verse from the DAILY_PLAN below.
 * The fetched result is cached in AsyncStorage for the full calendar day so
 * only one network request is made per day regardless of how many times the
 * hook is called.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import type { WordOfDayItem } from "./wordOfDayService";

const CACHE_KEY = "claudygod.word_of_day.bible_cache";
const BIBLE_API_BASE = "https://bible-api.com";
const TRANSLATION = "kjv";

// ─── Curated daily plan ──────────────────────────────────────────────────────
// 52 verses — cycled by day of year.

type DailyPlanEntry = {
  ref: string;
  theme: string;
  title: string;
  reflection: string;
};

const DAILY_PLAN: DailyPlanEntry[] = [
  { ref: "john 3:16",          theme: "God's Love",            title: "For God So Loved",          reflection: "Rest in the truth that God's love for you is unconditional and eternal. Nothing can separate you from it." },
  { ref: "psalm 23:1",         theme: "The Lord My Shepherd",  title: "The Lord Is My Shepherd",   reflection: "When life feels uncertain, remember you are guided, provided for, and never alone." },
  { ref: "proverbs 3:5-6",     theme: "Trust & Direction",     title: "Trust in the Lord",         reflection: "Lean not on your own understanding. Surrender your plans today and watch God's perfect path unfold." },
  { ref: "philippians 4:13",   theme: "Strength in Christ",    title: "All Things Through Christ", reflection: "Whatever challenge faces you today, you are not facing it alone. Christ strengthens you." },
  { ref: "romans 8:28",        theme: "God's Purpose",         title: "All Things Work Together",  reflection: "Even in difficulty, God is weaving something beautiful. Trust the process and trust the Maker." },
  { ref: "isaiah 40:31",       theme: "Renewal & Hope",        title: "Soaring on Wings",          reflection: "If you are weary, wait on the Lord. He renews strength for those who hope in Him." },
  { ref: "jeremiah 29:11",     theme: "God's Plans",           title: "Plans to Prosper You",      reflection: "God's plan for your life is good, filled with hope and a future. Trust it, even when the road is unclear." },
  { ref: "psalm 46:1",         theme: "Refuge & Strength",     title: "God Is Our Refuge",         reflection: "In every storm, God is your refuge. Run to Him before you run to anything else." },
  { ref: "matthew 6:33",       theme: "Kingdom First",         title: "Seek First the Kingdom",    reflection: "When God is your first priority, everything else falls into its proper place." },
  { ref: "hebrews 11:1",       theme: "Faith",                 title: "The Substance of Faith",    reflection: "Faith is not seeing and then believing. It is believing and then seeing. Walk in confident trust today." },
  { ref: "joshua 1:9",         theme: "Courage",               title: "Be Strong & Courageous",    reflection: "God commanded courage because He knew you would need it. Take that step you have been putting off." },
  { ref: "psalm 121:1-2",      theme: "Help from the Lord",    title: "I Lift My Eyes",            reflection: "Your help does not come from circumstances or people. It comes from the Lord, Maker of heaven and earth." },
  { ref: "john 14:6",          theme: "The Way, Truth & Life", title: "I Am the Way",              reflection: "In a world full of confusion, Jesus is the clear path, the ultimate truth, and the source of real life." },
  { ref: "romans 5:8",         theme: "Grace",                 title: "While We Were Sinners",     reflection: "God did not wait for you to be worthy to love you. That is grace. Receive it fully today." },
  { ref: "psalm 27:1",         theme: "No Fear",               title: "The Lord Is My Light",      reflection: "The same God who lights the universe is the one watching over you. What, then, shall you fear?" },
  { ref: "isaiah 41:10",       theme: "Do Not Fear",           title: "Fear Not, For I Am With You", reflection: "God holds you with His righteous right hand. You are not abandoned in your struggle." },
  { ref: "matthew 11:28-30",   theme: "Rest in Jesus",         title: "Come to Me and Rest",       reflection: "Are you carrying a heavy load? Jesus is personally inviting you to lay it down and find rest." },
  { ref: "james 1:5",          theme: "Wisdom",                title: "Ask God for Wisdom",        reflection: "You do not have to figure everything out alone. Ask God for wisdom. He gives it generously, without reproach." },
  { ref: "john 16:33",         theme: "Overcoming",            title: "Take Heart, I Have Overcome", reflection: "Trouble is guaranteed in this world. But so is the victory, because Jesus has already overcome." },
  { ref: "ephesians 2:8-9",    theme: "Saved by Grace",        title: "By Grace You Are Saved",    reflection: "Salvation is God's gift, not a reward you earn. Accept it, treasure it, live from it today." },
  { ref: "2 timothy 1:7",      theme: "Power & Sound Mind",    title: "Spirit of Power & Love",    reflection: "Fear, anxiety, and timidity are not from God. Lay them down and walk in power and a sound mind." },
  { ref: "revelation 21:4",    theme: "Heaven's Promise",      title: "No More Tears",             reflection: "Every pain is temporary. There is a day coming when God will wipe away every single tear forever." },
  { ref: "luke 1:37",          theme: "Nothing Impossible",    title: "Nothing Impossible with God", reflection: "That situation you have written off as impossible, bring it back to God. Nothing is beyond Him." },
  { ref: "mark 11:24",         theme: "Prayer & Belief",       title: "Whatever You Ask in Prayer", reflection: "Pray with faith. Believe while you pray. The breakthrough often starts the moment you ask." },
  { ref: "1 john 4:4",         theme: "Greater Is He",         title: "Greater Is He In You",      reflection: "The Spirit who lives in you is greater than every force working against you. You are not outmatched." },
  { ref: "psalm 34:18",        theme: "Near the Brokenhearted",title: "Close to the Broken",       reflection: "If your heart is in pieces today, know this: God is not distant. He is closest to those who are crushed." },
  { ref: "isaiah 26:3",        theme: "Perfect Peace",         title: "Perfect Peace",             reflection: "A mind stayed on God is a mind at peace. Anchor your thoughts in Him throughout this day." },
  { ref: "matthew 5:9",        theme: "Peacemakers",           title: "Blessed Are the Peacemakers", reflection: "Be a bridge today, not a wall. God calls His children to bring peace into every room they enter." },
  { ref: "colossians 3:23-24", theme: "Work as Worship",       title: "Work for the Lord",         reflection: "Whatever you do today, do it wholeheartedly, as unto the Lord. Your work is your worship." },
  { ref: "psalm 1:1-2",        theme: "Blessed Life",          title: "Blessed Is the One",        reflection: "The truly blessed life is one rooted in God's word. Meditate on it, and you will flourish." },
  { ref: "1 corinthians 10:13",theme: "No Temptation Alone",   title: "God Is Faithful",           reflection: "You will never face a temptation stronger than God's ability to help you through it. He provides a way out." },
  { ref: "psalm 91:1-2",       theme: "Shelter of the Most High", title: "Under His Wings",        reflection: "There is a secret place of shelter with God. Those who dwell there find protection no earthly resource can give." },
  { ref: "micah 6:8",          theme: "What God Requires",     title: "Act Justly, Love Mercy",    reflection: "God's requirements are simple and profound: justice, mercy, and a humble walk with Him." },
  { ref: "galatians 5:22-23",  theme: "Fruit of the Spirit",   title: "The Fruit of the Spirit",   reflection: "The evidence of God's Spirit in your life is the fruit it produces. Cultivate love, joy, and peace today." },
  { ref: "romans 12:2",        theme: "Transformation",        title: "Be Transformed",            reflection: "Renewal begins in the mind. Do not be shaped by the world. Let God's word reshape how you think." },
  { ref: "john 10:10",         theme: "Abundant Life",         title: "Life to the Full",          reflection: "Jesus did not come to give you a mediocre life. He came that you might have life in abundance." },
  { ref: "matthew 5:14-16",    theme: "Light of the World",    title: "You Are the Light",         reflection: "You are not just a light. You are the light of the world. Do not hide it; let it shine before everyone." },
  { ref: "psalm 139:14",       theme: "Fearfully Made",        title: "Wonderfully Made",          reflection: "You are not an accident. You were crafted with intentionality, precision, and love by God Himself." },
  { ref: "ephesians 6:10-11",  theme: "Armor of God",          title: "Put On the Full Armor",     reflection: "You are in a spiritual battle, but you are fully equipped. Put on God's armor and stand firm today." },
  { ref: "2 corinthians 5:17", theme: "New Creation",          title: "A New Creation",            reflection: "In Christ, you are not patched up. You are made entirely new. Walk in that newness today." },
  { ref: "john 15:5",          theme: "Abiding in Christ",     title: "I Am the Vine",             reflection: "Apart from Christ, you can produce nothing that lasts. Abide in Him and watch fruitfulness follow." },
  { ref: "1 peter 5:7",        theme: "Cast Your Anxiety",     title: "Cast All Your Anxiety",     reflection: "Every worry you carry today, cast it onto God. He genuinely cares about what concerns you." },
  { ref: "deuteronomy 31:6",   theme: "Never Abandoned",       title: "Be Strong & Courageous",    reflection: "God has never left a single person He promised to be with. He will not start with you." },
  { ref: "psalm 37:4",         theme: "Delight in the Lord",   title: "Desires of Your Heart",     reflection: "When God is your deepest delight, the desires of your heart begin to align with His perfect will." },
  { ref: "romans 8:1",         theme: "No Condemnation",       title: "No Condemnation in Christ", reflection: "There is zero condemnation for those who are in Christ. Walk free of guilt and shame today." },
  { ref: "1 corinthians 13:4", theme: "What Love Is",          title: "Love Is Patient",           reflection: "Before you speak, before you react, ask yourself if love is leading you. Love always goes first." },
  { ref: "nehemiah 8:10",      theme: "Joy as Strength",       title: "The Joy of the Lord",       reflection: "Your joy does not depend on your circumstances. It comes from the Lord and it is your strength." },
  { ref: "matthew 28:19-20",   theme: "The Great Commission",  title: "Go and Make Disciples",     reflection: "You are sent. Every believer has a mission field: your home, your workplace, your neighborhood." },
  { ref: "isaiah 55:8-9",      theme: "God's Ways Higher",     title: "My Ways Are Higher",        reflection: "When you do not understand what God is doing, trust that He sees things from a perspective you cannot yet reach." },
  { ref: "genesis 1:1",        theme: "In the Beginning",      title: "God the Creator",           reflection: "The God who spoke the universe into existence is the same God who speaks purpose into your life." },
  { ref: "john 1:1",           theme: "The Living Word",       title: "In the Beginning Was the Word", reflection: "Jesus is not just a teacher. He is the eternal Word of God, present before creation, active in your life today." },
  { ref: "revelation 3:20",    theme: "Open the Door",         title: "I Stand at the Door",       reflection: "Jesus is not forcing His way in. He is knocking. Will you open the door of your heart to Him today?" },
  { ref: "psalm 119:105",      theme: "God's Word as Light",   title: "A Lamp to My Feet",         reflection: "When the path ahead is dark, God's word illuminates the very next step. You do not need to see the whole road." },
];

// ─── Day index ───────────────────────────────────────────────────────────────

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86_400_000);
}

export function getTodaysPlan(date = new Date()): DailyPlanEntry {
  const index = getDayOfYear(date) % DAILY_PLAN.length;
  return DAILY_PLAN[index] ?? DAILY_PLAN[0]!;
}

// ─── Cache ───────────────────────────────────────────────────────────────────

interface CacheEntry {
  date: string; // YYYY-MM-DD
  word: WordOfDayItem;
}

function todayKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

async function readCache(): Promise<WordOfDayItem | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw) as CacheEntry;
    if (entry.date !== todayKey()) return null;
    return entry.word;
  } catch {
    return null;
  }
}

async function writeCache(word: WordOfDayItem): Promise<void> {
  try {
    const entry: CacheEntry = { date: todayKey(), word };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(entry));
  } catch {
    // cache write failure is non-fatal
  }
}

// ─── API fetch ───────────────────────────────────────────────────────────────

interface BibleApiResponse {
  reference: string;
  text: string;
  translation_name: string;
  verses: { book_name: string; chapter: number; verse: number; text: string }[];
}

async function fetchVerseFromApi(ref: string): Promise<string> {
  const encoded = encodeURIComponent(ref);
  const url = `${BIBLE_API_BASE}/${encoded}?translation=${TRANSLATION}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`bible-api.com returned ${res.status}`);
  const json = (await res.json()) as BibleApiResponse;
  return json.text.trim();
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Returns today's curated Bible verse.
 * Checks AsyncStorage cache first — only fetches from bible-api.com once per day.
 * Falls back to the plan's theme/title with an empty verse on network failure.
 */
export async function fetchBibleDailyVerse(): Promise<WordOfDayItem> {
  // 1. Cache hit
  const cached = await readCache();
  if (cached) return cached;

  // 2. Determine today's verse plan
  const plan = getTodaysPlan();
  const now = new Date().toISOString();

  // Capitalise the reference for display (e.g. "john 3:16" -> "John 3:16")
  const passage = plan.ref
    .split(" ")
    .map((w) => (w.length > 2 ? w.charAt(0).toUpperCase() + w.slice(1) : w))
    .join(" ");

  let verseText = "";

  // 3. Fetch from bible-api.com
  try {
    verseText = await fetchVerseFromApi(plan.ref);
  } catch {
    // Network failure — still show the theme/title with empty verse
  }

  const word: WordOfDayItem = {
    id: `bible-${todayKey()}`,
    title: plan.title,
    passage,
    verse: verseText,
    reflection: plan.reflection,
    messageDate: todayKey(),
    status: "published",
    notifyEmail: false,
    createdAt: now,
    updatedAt: now,
  };

  await writeCache(word);
  return word;
}

/** Clear the daily cache (useful for testing). */
export async function clearBibleDailyCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {
    // non-fatal
  }
}
