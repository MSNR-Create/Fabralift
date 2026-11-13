/* Fabralift - ロケットを、最速で組み上げろ。
 * (c) MSNR_Create https://msnr-create.jp/  MIT License
 */
'use strict';
(() => {
const VERSION = '1.1.0';
let W = 10, H = 14; const T = 16;       // grid (per difficulty) & tile px
const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const LS = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k) { try { localStorage.removeItem(k); } catch (e) {} }
};
const K_RUN = 'fabralift_run', K_RANK = 'fabralift_rank', K_SET = 'fabralift_set', K_LEGEND = 'fabralift_legend';
const RANK_API = 'rank.php'; // server ranking (falls back to on-device ranking when unavailable)

/* ---------------- i18n ---------------- */
const STR = {
  ja: {

    resInfo: { iron: '精錬炉で鉄板に → 歯車・回路の材料', copper: '精錬炉で銅板に → 回路の材料', stone: '精錬炉でレンガに → 発射台へ', coal: '加工不要。そのまま発射台へ（燃料）', crystal: '加工不要。そのまま発射台へ' },
    bInfo: { drill: '資源を掘って▲の方向へ出す', belt: 'アイテムを矢印の向きへ運ぶ', furnace: '鉱石・石材を板やレンガに変える', gear: '鉄板2 → 歯車1', circuit: '鉄板1＋銅板1 → 回路1', pad: '部品を受け取りロケットを組み立てる（余りは廃棄）', bridge: '後ろから来たアイテムを1マス飛び越えて送る（交差用）' },
    st: { work: '▶ 稼働中', idle: '… 材料待ち', stuck: '⚠ 出口が詰まっています（▲の先が空き・満杯）', dead: '✖ 資源が枯渇。別の鉱脈へ' },
    left: n => `残り ${n}`, inf: '無限', inside: '中身：', empty: '空き地',
    recipeTitle: '作り方', legendTitle: '資源の見分け方', legendNote: 'マスを長押し（PCはマウスを重ねる）と名前と状態が出ます。上の部品アイコンをタップすると作り方が出ます。', ok: 'はじめる',
    online: '🌐 オンラインランキング', offline: '📱 端末内の記録（サーバーに接続できません）', sendFail: 'サーバーに送れなかったため端末内に保存しました',
    subtitle: 'ロケットを、最速で組み上げろ。', resume: '▶ 中断したプレイを再開', todayMap: '今日のマップ',
    easy: 'やさしい', normal: 'ふつう', hard: 'むずかしい',
    easyDesc: 'ガイドあり／資源無限', normalDesc: 'ガイド任意／資源に限り', hardDesc: '建物数制限／資源が偏る',
    practice: '練習（ランダム）', ranking: 'ランキング', howto: 'あそびかた', privacy: 'プライバシー', terms: '利用規約',
    del: '削除', rot: '向き', guideBtn: 'ガイド', pause: '停止',
    paused: '一時停止', pauseNote: '画面を閉じても、次に開いたとき続きから再開できます。', continue: '再開する',
    retry: '最初からやり直す', quit: 'タイトルへ（記録は消えます）', soundOn: '🔊 サウンド：ON', soundOff: '🔇 サウンド：OFF',
    launched: '打ち上げ成功！', register: '登録', share: 'Xで共有', copyUrl: 'URLコピー', toTitle: 'タイトルへ',
    today: '今日のマップ', allTime: '全期間', close: '閉じる', namePh: 'ニックネーム',
    rankNote: 'ランキングはこの端末内に保存されます。URL共有で友だちと競えます。',
    noRecord: 'まだ記録がありません', registered: '登録しました！', copied: 'URLをコピーしました',
    practiceTag: '練習', bestNew: '★ 自己ベスト更新！', bestWas: '自己ベスト：',
    detail: (b, d) => `建物 ${b}個 ／ ${d}`,
    challenge: (t, b, d) => `🏁 挑戦状：同じマップ（${d}）で <b>${t}</b>（建物${b}個）の記録が届いています。上回れるか？`,
    resumeInfo: (d, t, p) => `${d}・${t}・進捗${p}%`,
    shareText: (t, d, b) => `Fabralift 今日のマップ【${d}】を ${t}（建物${b}個）で打ち上げ！この記録を超えられる？ #Fabralift`,
    noDrill: '採掘機は資源の上にだけ置けます', blocked: 'ここには置けません', limit: n => `建物は${n}個までです`,
    padNoDel: '発射台は削除できません', depleted: '資源が枯渇しました',
    items: { ironOre: '鉄鉱石', copperOre: '銅鉱石', coal: '石炭', stone: '石材', crystal: '結晶', ironPlate: '鉄板', copperPlate: '銅板', brick: 'レンガ', gear: '歯車', circuit: '回路' },
    blds: { drill: '採掘機', belt: 'ベルト', furnace: '精錬炉', gear: '歯車機', circuit: '回路機', pad: '発射台', bridge: 'ブリッジ' },
    guide: [
      ['灰色の岩＝鉄鉱石。⛏採掘機を置こう', '鉄鉱石は精錬すると鉄板になり、歯車と回路の材料。光るマスをタップ'],
      ['採掘機の▲の先へベルトを引き、精錬炉につなごう', '精錬炉は鉱石を板に変える。採掘機からドラッグするとベルトが引けます'],
      ['鉄板を歯車機に運び、歯車を作ろう', '歯車はロケットの部品。歯車機は鉄板2枚で歯車1個'],
      ['オレンジの岩＝銅鉱石。精錬して鉄板と一緒に回路機へ', '回路はロケットの部品。鉄板1＋銅板1で回路1個'],
      ['白い岩＝石材。精錬するとレンガになる', 'レンガはロケットの部品。白い岩に採掘機を置こう'],
      ['黒い塊＝石炭。加工せず発射台へ直接運ぼう', '石炭はロケットの燃料。黒い塊→ベルト→🚀'],
      ['歯車・回路・レンガも発射台へ運ぼう', '線が交差するときはブリッジで飛び越せます'],
      ['生産ラインを増やして完成を急げ！', '採掘機を並べると速くなる。上の部品アイコンで作り方を確認']
    ],
    help: `
<h3>目的</h3><p>資源を掘り、加工し、ベルトで<b>発射台🚀</b>へ運んで、ロケットをできるだけ速く完成させます。上の欄に必要な部品が出ます。</p>
<h3>加工のつながり</h3>%CHAIN%
<h3>操作（スマホ）</h3><ul>
<li>下の建物を選んでマスをタップ → 設置</li>
<li><b>ベルト</b>はドラッグで線を引く。採掘機などからドラッグすると、その出口の向きも合わせます</li>
<li>置いた建物をタップ → 向きを回転</li>
<li>🗑️削除を選んでタップ（ドラッグで連続削除）</li>
<li>建物は三角▲の向きへ出力します。ベルトは前後左右どこからでも受け取ります</li>
<li><b>ブリッジ</b>：後ろから来たアイテムを1マス飛び越えて送ります。線の交差に</li>
<li>マスを<b>長押し</b>で名前と状態、上の部品アイコンを<b>タップ</b>で作り方を表示</li></ul>
<h3>操作（PC）</h3><ul>
<li>マウス：左クリック／ドラッグで設置、<b>右クリック</b>で削除</li>
<li>マウスを重ねると名前と状態を表示</li><li><kbd>1</kbd>〜<kbd>6</kbd> 建物選択　<kbd>R</kbd> 向き回転　<kbd>X</kbd> 削除モード</li>
<li><kbd>Space</kbd>/<kbd>Esc</kbd> 一時停止　<kbd>G</kbd> ガイド</li></ul>
<h3>難易度</h3><ul>
<li><b>やさしい</b>：10×14マス。ガイド付き・資源は無限</li>
<li><b>ふつう</b>：11×15マス。資源マスごとに量が有限。枯渇前に新しい鉱脈へ切り替え</li>
<li><b>むずかしい</b>：12×17マス。結晶も必要、岩が多く、建物数に上限あり</li></ul>
<h3>記録と再開</h3><p>タイムは工場が動いている時間だけ数えます。セーブはありませんが、途中で画面を閉じても次に開くと続きから再開できます。完成したらニックネームで登録、URLで友だちに挑戦状を送れます。</p>
<p class="note">Fabralift v${VERSION} © MSNR_Create ／ MIT License</p>`
  },
  en: {

    resInfo: { iron: 'Furnace → iron plate → for gears & circuits', copper: 'Furnace → copper plate → for circuits', stone: 'Furnace → brick → to the pad', coal: 'No processing. Straight to the pad (fuel)', crystal: 'No processing. Straight to the pad' },
    bInfo: { drill: 'Mines ore and outputs toward ▲', belt: 'Carries items along the arrow', furnace: 'Turns ore/stone into plates or bricks', gear: '2 iron plates → 1 gear', circuit: '1 iron + 1 copper plate → 1 circuit', pad: 'Receives parts and builds the rocket (surplus is scrapped)', bridge: 'Jumps items from behind over one tile (for crossings)' },
    st: { work: '▶ Working', idle: '… Waiting for input', stuck: '⚠ Output blocked (nothing ahead of ▲, or full)', dead: '✖ Depleted — move to another vein' },
    left: n => `${n} left`, inf: 'endless', inside: 'Holds: ', empty: 'Empty ground',
    recipeTitle: 'Recipe', legendTitle: 'Know your resources', legendNote: 'Long-press a tile (hover on PC) to see what it is. Tap a part icon at the top to see its recipe.', ok: 'Start',
    online: '🌐 Online ranking', offline: '📱 On-device records (server unreachable)', sendFail: 'Could not reach the server; saved on this device',
    subtitle: 'Build the rocket. Fastest wins.', resume: '▶ Resume interrupted run', todayMap: "Today's map",
    easy: 'Easy', normal: 'Normal', hard: 'Hard',
    easyDesc: 'Guided / endless ore', normalDesc: 'Optional guide / finite ore', hardDesc: 'Building cap / sparse ore',
    practice: 'Practice (random)', ranking: 'Ranking', howto: 'How to play', privacy: 'Privacy', terms: 'Terms',
    del: 'Delete', rot: 'Rotate', guideBtn: 'Guide', pause: 'Pause',
    paused: 'Paused', pauseNote: 'Close anytime — the run resumes next time you open the game.', continue: 'Continue',
    retry: 'Restart', quit: 'Quit to title (run is lost)', soundOn: '🔊 Sound: ON', soundOff: '🔇 Sound: OFF',
    launched: 'Liftoff!', register: 'Submit', share: 'Share on X', copyUrl: 'Copy URL', toTitle: 'Title',
    today: "Today's map", allTime: 'All time', close: 'Close', namePh: 'Nickname',
    rankNote: 'Rankings are stored on this device. Share the URL to compete with friends.',
    noRecord: 'No records yet', registered: 'Submitted!', copied: 'URL copied',
    practiceTag: 'Practice', bestNew: '★ New personal best!', bestWas: 'Personal best: ',
    detail: (b, d) => `${b} buildings / ${d}`,
    challenge: (t, b, d) => `🏁 Challenge: someone launched today's map (${d}) in <b>${t}</b> with ${b} buildings. Can you beat it?`,
    resumeInfo: (d, t, p) => `${d} · ${t} · ${p}% built`,
    shareText: (t, d, b) => `I launched today's Fabralift map [${d}] in ${t} with ${b} buildings. Beat that! #Fabralift`,
    noDrill: 'Drills go on ore tiles only', blocked: "Can't build here", limit: n => `Building limit: ${n}`,
    padNoDel: "The launch pad can't be removed", depleted: 'Ore depleted',
    items: { ironOre: 'Iron ore', copperOre: 'Copper ore', coal: 'Coal', stone: 'Stone', crystal: 'Crystal', ironPlate: 'Iron plate', copperPlate: 'Copper plate', brick: 'Brick', gear: 'Gear', circuit: 'Circuit' },
    blds: { drill: 'Drill', belt: 'Belt', furnace: 'Furnace', gear: 'Gear fab', circuit: 'Circuit fab', pad: 'Launch pad', bridge: 'Bridge' },
    guide: [
      ['Grey rocks = iron ore. Place a ⛏ drill', 'Smelted iron becomes plates for gears and circuits. Tap a glowing tile'],
      ["Drag a belt from the drill's ▲ to a furnace", 'Furnaces turn ore into plates. Drag from the drill to draw a belt'],
      ['Send iron plates to a gear fab', 'Gears are rocket parts. 2 iron plates → 1 gear'],
      ['Orange rocks = copper. Smelt it and send it with iron plates to a circuit fab', 'Circuits are rocket parts. 1 iron + 1 copper → 1 circuit'],
      ['White rocks = stone. Smelting makes bricks', 'Bricks are rocket parts. Put a drill on white rocks'],
      ['Black lumps = coal. Belt it straight to the pad', 'Coal is rocket fuel. Coal → belt → 🚀'],
      ['Deliver gears, circuits and bricks to the pad', 'Lines crossing? A bridge jumps over one tile'],
      ['Scale up your lines and launch!', 'More drills = faster. Tap part icons at the top for recipes']
    ],
    help: `
<h3>Goal</h3><p>Mine ore, process it, and belt the parts to the <b>launch pad 🚀</b>. Finish the rocket as fast as you can. Required parts are shown at the top.</p>
<h3>Production chain</h3>%CHAIN%
<h3>Touch controls</h3><ul>
<li>Pick a building below, tap a tile to place it</li>
<li><b>Belts</b>: drag to draw. Dragging from a drill/machine also turns its output toward the belt</li>
<li>Tap a placed building to rotate it</li>
<li>🗑️ Delete: tap (or drag) to remove</li>
<li>Machines output toward their ▲. Belts accept items from any side</li>
<li><b>Bridge</b>: jumps items from behind over one tile — for crossings</li>
<li><b>Long-press</b> a tile for info; <b>tap</b> a part icon at the top for its recipe</li></ul>
<h3>PC controls</h3><ul>
<li>Mouse: left click/drag to build, <b>right click</b> to delete</li>
<li>Hover a tile for info</li><li><kbd>1</kbd>–<kbd>6</kbd> select building, <kbd>R</kbd> rotate, <kbd>X</kbd> delete mode</li>
<li><kbd>Space</kbd>/<kbd>Esc</kbd> pause, <kbd>G</kbd> guide</li></ul>
<h3>Difficulty</h3><ul>
<li><b>Easy</b>: 10×14. Guided, ore never runs out</li>
<li><b>Normal</b>: 11×15. Each ore tile is finite — switch veins before they run dry</li>
<li><b>Hard</b>: 12×17. Crystals required, more rocks, building cap</li></ul>
<h3>Records & resume</h3><p>The timer only runs while your factory runs. There is no save, but if you close the page mid-run it resumes next time. Submit your time with a nickname and send friends a challenge URL.</p>
<p class="note">Fabralift v${VERSION} © MSNR_Create / MIT License</p>`
  }
};
let settings = LS.get(K_SET, null) || { lang: (navigator.language || 'ja').startsWith('ja') ? 'ja' : 'en', sound: true, name: '' };
const L = () => STR[settings.lang];
function applyLang() {
  document.documentElement.lang = settings.lang;
  $$('[data-i]').forEach(el => { const v = L()[el.dataset.i]; if (typeof v === 'string') el.textContent = v; });
  $$('.lang button').forEach(b => b.classList.toggle('on', b.dataset.lang === settings.lang));
  $('#r-name').placeholder = L().namePh;
  $('#help-body').innerHTML = L().help.replace('%CHAIN%', chainHTML());
  $$('#help-body canvas[data-it]').forEach(c => drawItemIcon(c, c.dataset.it));
  $('#p-sound').textContent = settings.sound ? L().soundOn : L().soundOff;
  buildLegend();
  buildTools();
  updateTitle();
}

/* ---------------- data ---------------- */
const ITEMS = {
  ironOre: ['#8d939b', '#5a5f66'], copperOre: ['#e07a2c', '#8a3f12'], coal: ['#2a2a2e', '#000000'],
  stone: ['#e9e3d0', '#9d957c'], crystal: ['#5cd0ff', '#1a6aa0'],
  ironPlate: ['#d7dee6', '#6f7a86'], copperPlate: ['#ffa255', '#a24d10'], brick: ['#c0533a', '#5e1f12'],
  gear: ['#b8c2cc', '#4a525b'], circuit: ['#42c45e', '#14552a']
};
const ORE_ITEM = { iron: 'ironOre', copper: 'copperOre', coal: 'coal', stone: 'stone', crystal: 'crystal' };
const SMELT = { ironOre: 'ironPlate', copperOre: 'copperPlate', stone: 'brick' };
const TOOLS = ['drill', 'belt', 'furnace', 'gear', 'circuit', 'bridge'];
const DIFF = {
  easy:   { w: 10, h: 14, need: { gear: 12, circuit: 12, brick: 10, coal: 10 }, ore: 0, limit: 0, rocks: 4, guide: true, crystal: 0 },
  normal: { w: 11, h: 15, need: { gear: 25, circuit: 25, brick: 20, coal: 20 }, ore: 70, limit: 0, rocks: 8, guide: false, crystal: 0 },
  hard:   { w: 12, h: 17, need: { gear: 35, circuit: 35, brick: 25, coal: 25, crystal: 10 }, ore: 45, limit: 55, rocks: 13, guide: false, crystal: 1 }
};
const RATE = { drill: 1.4, furnace: 1.1, gear: 1.0, circuit: 1.2, belt: 1.9 /* tiles/s */, bridge: 0.45 };
function setSize(w, h) { W = w; H = h; cv.width = W * T; cv.height = H * T; cx.imageSmoothingEnabled = false; }

/* ---------------- rng & seed ---------------- */
function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function todaySeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
function seedLabel(s) { s = String(s); return s.length === 8 ? `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6)}` : '#' + s; }
const DCODE = { easy: 1, normal: 2, hard: 3 };

/* ---------------- map gen ---------------- */
function genMap(seed, diff) {
  const cfg = DIFF[diff]; setSize(cfg.w, cfg.h);
  const rnd = mulberry(seed * 7 + DCODE[diff] * 1013);
  const ri = n => Math.floor(rnd() * n);
  const res = Array.from({ length: H }, () => Array(W).fill(null));
  const rock = Array.from({ length: H }, () => Array(W).fill(false));
  const pad = { x: (W >> 1) - 2 + ri(4), y: H - 5 + ri(3) };
  const used = (x, y) => res[y][x] || rock[y][x] || (Math.abs(x - pad.x) <= 0 && Math.abs(y - pad.y) <= 0);
  function patch(type, size, minD, maxD) {
    for (let tries = 0; tries < 200; tries++) {
      const cx = ri(W), cy = ri(H);
      const d = Math.abs(cx - pad.x) + Math.abs(cy - pad.y);
      if (d < minD || d > maxD || used(cx, cy)) continue;
      const cells = [[cx, cy]]; res[cy][cx] = { t: type, a: cfg.ore };
      let guard = 0;
      while (cells.length < size && guard++ < 100) {
        const [px, py] = cells[ri(cells.length)]; const k = ri(4);
        const nx = px + DX[k], ny = py + DY[k];
        if (nx < 0 || ny < 0 || nx >= W || ny >= H || used(nx, ny)) continue;
        res[ny][nx] = { t: type, a: cfg.ore }; cells.push([nx, ny]);
      }
      return;
    }
  }
  const far = diff === 'easy' ? 6 : diff === 'normal' ? 9 : 12;
  patch('iron', diff === 'hard' ? 4 : 5, 2, far);
  patch('iron', diff === 'hard' ? 3 : 4, 3, far + 2);
  patch('copper', 4, 2, far);
  if (diff !== 'easy') patch('copper', 3, 4, far + 3);
  patch('stone', 4, 2, far + 1);
  patch('coal', 4, 2, far + 1);
  if (cfg.crystal) patch('crystal', 3, 7, 20);
  if (diff === 'normal') patch('iron', 3, 5, 20);
  for (let i = 0; i < cfg.rocks; i++) {
    const x = ri(W), y = ri(H);
    if (!used(x, y) && Math.abs(x - pad.x) + Math.abs(y - pad.y) > 1) rock[y][x] = true;
  }
  return { res, rock, pad };
}

/* ---------------- game state ---------------- */
let G = null;          // current run
let tool = 'drill', rot = 1, delMode = false;
function newRun(seed, diff, practice) {
  const m = genMap(seed, diff);
  G = {
    v: VERSION, seed, diff, practice: !!practice, w: W, h: H,
    res: m.res, rock: m.rock, pad: m.pad,
    b: {}, // key "x,y" -> building
    time: 0, delivered: {}, made: {}, placed: 0, peak: 0,
    guide: DIFF[diff].guide, done: false, nextId: 1
  };
  const need = DIFF[diff].need; for (const k in need) G.delivered[k] = 0;
  G.b[key(m.pad.x, m.pad.y)] = { t: 'pad', x: m.pad.x, y: m.pad.y, d: 0 };
}
const key = (x, y) => x + ',' + y;
const bAt = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? null : G.b[key(x, y)];
const need = () => DIFF[G.diff].need;
function bCount() { return Object.keys(G.b).length - 1; }
function progress() {
  const n = need(); let a = 0, b = 0;
  for (const k in n) { a += Math.min(n[k], G.delivered[k] || 0); b += n[k]; }
  return a / b;
}

function canPlace(t, x, y) {
  if (x < 0 || y < 0 || x >= W || y >= H) return L().blocked;
  if (G.rock[y][x] || bAt(x, y)) return L().blocked;
  if (t === 'drill' && !G.res[y][x]) return L().noDrill;
  const lim = DIFF[G.diff].limit; if (lim && bCount() >= lim) return L().limit(lim);
  return null;
}
function place(t, x, y, d, quiet) {
  const err = canPlace(t, x, y);
  if (err) { if (!quiet) toast(err); return false; }
  const b = { t, x, y, d, tm: 0 };
  if (t === 'belt') b.it = [];
  if (t === 'drill') b.out = null;
  if (t === 'furnace') { b.q = []; b.cur = null; b.out = []; }
  if (t === 'gear') { b.n = 0; b.out = []; b.busy = 0; }
  if (t === 'circuit') { b.fe = 0; b.cu = 0; b.out = []; b.busy = 0; }
  if (t === 'bridge') b.q = [];
  G.b[key(x, y)] = b; G.placed++; G.peak = Math.max(G.peak, bCount());
  sfx('place'); dirty();
  return true;
}
function remove(x, y) {
  const b = bAt(x, y); if (!b) return;
  if (b.t === 'pad') { toast(L().padNoDel); return; }
  delete G.b[key(x, y)]; sfx('del'); dirty();
}

/* ---------------- simulation ---------------- */
function accept(b, item, fromDir) {
  if (!b) return false;
  switch (b.t) {
    case 'belt':
      if (b.d === (fromDir + 2) % 4) return false;
      if (b.it.length >= 2) return false;
      if (b.it.length && b.it[b.it.length - 1].p < 0.5) return false;
      b.it.push({ i: item, p: fromDir === b.d ? 0 : 0.25 }); return true;
    case 'bridge':
      if (fromDir !== b.d || b.q.length >= 2) return false; b.q.push({ i: item, t: 0 }); return true;
    case 'furnace':
      if (!SMELT[item] || b.q.length >= 4) return false; b.q.push(item); return true;
    case 'gear':
      if (item !== 'ironPlate' || b.n >= 6) return false; b.n++; return true;
    case 'circuit':
      if (item === 'ironPlate' && b.fe < 4) { b.fe++; return true; }
      if (item === 'copperPlate' && b.cu < 4) { b.cu++; return true; }
      return false;
    case 'pad': {
      // pad accepts everything (surplus/unneeded items are scrapped) so shared lines never jam
      const n = need(); if (!n[item] || (G.delivered[item] || 0) >= n[item]) { G.scrap = (G.scrap || 0) + 1; return true; }
      G.delivered[item]++; sfx('deliver');
      if (progress() >= 1) launch();
      return true;
    }
  }
  return false;
}
function push(b, item) { return accept(bAt(b.x + DX[b.d], b.y + DY[b.d]), item, b.d); }
function made(it) { G.made[it] = (G.made[it] || 0) + 1; }

function step(dt) {
  G.time += dt;
  for (const k in G.b) {
    const b = G.b[k];
    switch (b.t) {
      case 'drill': {
        const r = G.res[b.y][b.x];
        b.stuck = false;
        if (b.out) { if (push(b, b.out)) b.out = null; else b.stuck = true; }
        if (!b.out && r && (r.a === 0 && DIFF[G.diff].ore ? false : true)) {
          b.tm += dt;
          if (b.tm >= RATE.drill) {
            b.tm = 0; b.out = ORE_ITEM[r.t]; made(b.out);
            if (DIFF[G.diff].ore) { r.a--; if (r.a <= 0) { r.a = 0; } }
          }
        }
        b.dead = r && DIFF[G.diff].ore && r.a <= 0 && !b.out;
        break;
      }
      case 'furnace': {
        if (b.out.length && push(b, b.out[0])) b.out.shift();
        b.stuck = b.out.length >= 2;
        if (!b.cur && b.q.length) { b.cur = b.q.shift(); b.tm = 0; }
        if (b.cur && b.out.length < 2) { b.tm += dt; if (b.tm >= RATE.furnace) { const o = SMELT[b.cur]; b.out.push(o); made(o); b.cur = null; } }
        break;
      }
      case 'gear': {
        if (b.out.length && push(b, b.out[0])) b.out.shift();
        b.stuck = b.out.length >= 2;
        if (!b.busy && b.n >= 2 && b.out.length < 2) { b.n -= 2; b.busy = 1; b.tm = 0; }
        if (b.busy) { b.tm += dt; if (b.tm >= RATE.gear) { b.busy = 0; b.out.push('gear'); made('gear'); } }
        break;
      }
      case 'circuit': {
        if (b.out.length && push(b, b.out[0])) b.out.shift();
        b.stuck = b.out.length >= 2;
        if (!b.busy && b.fe >= 1 && b.cu >= 1 && b.out.length < 2) { b.fe--; b.cu--; b.busy = 1; b.tm = 0; }
        if (b.busy) { b.tm += dt; if (b.tm >= RATE.circuit) { b.busy = 0; b.out.push('circuit'); made('circuit'); } }
        break;
      }
      case 'bridge': {
        b.stuck = false;
        for (const q of b.q) q.t = Math.min(RATE.bridge, q.t + dt);
        if (b.q.length && b.q[0].t >= RATE.bridge) { if (accept(bAt(b.x + DX[b.d] * 2, b.y + DY[b.d] * 2), b.q[0].i, b.d)) b.q.shift(); else b.stuck = true; }
        break;
      }
      case 'belt': {
        const it = b.it; if (!it.length) break;
        const sp = RATE.belt * dt;
        it[0].p = Math.min(1, it[0].p + sp);
        for (let i = 1; i < it.length; i++) it[i].p = Math.min(it[i - 1].p - 0.5, it[i].p + sp);
        if (it[0].p >= 1 && push(b, it[0].i)) it.shift();
        break;
      }
    }
    if (G.done) return;
  }
}

/* ---------------- rendering ---------------- */
const cv = $('#cv'), cx = cv.getContext('2d');
cx.imageSmoothingEnabled = false;
let anim = 0;
const P = (c, x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); };

function drawGround(c) {
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const X = x * T, Y = y * T;
    P(c, X, Y, T, T, (x + y) % 2 ? '#23202c' : '#26232f');
    // speckles
    const h = (x * 73 + y * 151) % 17;
    P(c, X + (h % 13) + 1, Y + ((h * 7) % 13) + 1, 1, 1, '#302c3b');
    if (G.rock[y][x]) drawRock(c, X, Y);
    const r = G.res[y][x];
    if (r) drawOre(c, X, Y, r, x, y);
  }
}
function drawRock(c, X, Y) {
  P(c, X + 2, Y + 5, 12, 9, '#3b3646'); P(c, X + 4, Y + 3, 8, 3, '#3b3646');
  P(c, X + 4, Y + 4, 6, 2, '#4d475a'); P(c, X + 3, Y + 6, 3, 3, '#4d475a');
  P(c, X + 2, Y + 13, 12, 1, '#17151d');
}
function drawOre(c, X, Y, r, x, y) {
  const it = ORE_ITEM[r.t]; const [a, b] = ITEMS[it];
  const ore = DIFF[G.diff].ore;
  const frac = ore ? r.a / ore : 1;
  if (ore && r.a <= 0) { P(c, X + 5, Y + 7, 6, 3, '#1a1820'); return; }
  const lumps = [[2, 3], [9, 2], [5, 8], [11, 9], [2, 11], [8, 12]];
  const n = Math.max(1, Math.ceil(lumps.length * frac));
  for (let i = 0; i < n; i++) {
    const [lx, ly] = lumps[(i + x + y) % lumps.length];
    P(c, X + lx, Y + ly + 1, 4, 3, b); P(c, X + lx, Y + ly, 4, 3, a);
    P(c, X + lx + 1, Y + ly, 1, 1, '#ffffff55');
    if (r.t === 'crystal' && (anim * 2 + i) % 6 < 1) P(c, X + lx + 2, Y + ly - 1, 1, 1, '#fff');
  }
}
function drawItem(c, it, x, y, s = 6) {
  const [a, b] = ITEMS[it];
  const h = s >> 1;
  x = Math.round(x - h); y = Math.round(y - h);
  if (it === 'gear') {
    P(c, x + 1, y, s - 2, s, b); P(c, x, y + 1, s, s - 2, b);
    P(c, x + 1, y + 1, s - 2, s - 2, a); P(c, x + h - 1, y + h - 1, 2, 2, b);
  } else if (it === 'circuit') {
    P(c, x, y, s, s, b); P(c, x + 1, y + 1, s - 2, s - 2, a); P(c, x + 2, y + 2, s - 4, s - 4, '#e8d050');
  } else if (it.endsWith('Plate') || it === 'brick') {
    P(c, x, y + 1, s, s - 2, b); P(c, x, y + 1, s, s - 3, a); P(c, x + 1, y + 1, s - 2, 1, '#ffffff66');
  } else {
    P(c, x + 1, y, s - 2, s, b); P(c, x, y + 1, s, s - 2, b); P(c, x + 1, y + 1, s - 2, s - 2, a);
    P(c, x + 1, y + 1, 1, 1, '#ffffff77');
  }
}
// draw building in local up-facing 16x16 coordinates
function drawBld(c, b, ghost) {
  const X = b.x * T, Y = b.y * T;
  c.save();
  c.translate(X + 8, Y + 8);
  if (b.t !== 'pad') c.rotate(b.d * Math.PI / 2);
  c.translate(-8, -8);
  if (ghost) c.globalAlpha = 0.45;
  const t = anim;
  switch (b.t) {
    case 'belt': {
      P(c, 1, 0, 14, 16, '#1b1922'); P(c, 2, 0, 12, 16, '#4a4558');
      const off = Math.floor(t * 8) % 4;
      for (let i = -1; i < 5; i++) {
        const yy = i * 4 - off + 2;
        if (yy < 0 || yy > 14) continue;
        P(c, 6, yy, 4, 1, '#6d6682'); P(c, 5, yy + 1, 1, 1, '#6d6682'); P(c, 10, yy + 1, 1, 1, '#6d6682');
      }
      P(c, 1, 0, 1, 16, '#2b2836'); P(c, 14, 0, 1, 16, '#2b2836');
      break;
    }
    case 'bridge': {
      P(c, 1, 9, 14, 7, '#1b1922'); P(c, 2, 9, 12, 7, '#4a4558');
      P(c, 2, 0, 12, 4, '#1b1922'); P(c, 3, 0, 10, 3, '#4a4558');
      P(c, 3, 3, 10, 6, '#2b2836'); P(c, 4, 4, 8, 4, '#0e0d14');
      P(c, 7, 5, 2, 1, '#ffd040'); P(c, 6, 6, 4, 1, '#ffd040');
      if (b.q && b.q.length && Math.floor(anim * 6) % 2) P(c, 7, 7, 2, 1, '#ffb340');
      break;
    }
    case 'drill': {
      const bob = (b.tm > 0 && !b.stuck) ? (Math.floor(t * 10) % 2) : 0;
      P(c, 2, 4, 12, 11, '#3d3a48'); P(c, 3, 5, 10, 9, '#e0b030'); P(c, 3, 5, 10, 2, '#f6d258');
      P(c, 4, 9, 8, 1, '#8a6a10'); P(c, 5, 11, 2, 2, '#333'); P(c, 9, 11, 2, 2, '#333');
      P(c, 6, 1 - bob, 4, 5, '#b8c2cc'); P(c, 7, 0 - bob, 2, 2, '#e6edf3');
      P(c, 7, 7, 2, 2, b.dead ? '#ff4040' : (b.tm > 0 ? '#60ff70' : '#2a5a2a'));
      break;
    }
    case 'furnace': {
      const on = !!b.cur;
      P(c, 1, 3, 14, 12, '#5c2a1c'); P(c, 2, 4, 12, 10, '#a8442c');
      for (let r = 0; r < 3; r++) P(c, 2, 6 + r * 3, 12, 1, '#7a3020');
      P(c, 5, 9, 6, 4, '#1a0e0a');
      if (on) { const f = Math.floor(t * 12) % 3; P(c, 6, 10 - f % 2, 4, 3, '#ff8a20'); P(c, 7, 11, 2, 2, '#ffe060'); if (f === 0) P(c, 6, 9, 1, 1, '#ffd040'); }
      P(c, 6, 1, 4, 3, '#3d3a48'); // chimney
      if (on && Math.floor(t * 3) % 2) P(c, 7, 0, 2, 1, '#9a93ad');
      break;
    }
    case 'gear': {
      P(c, 1, 3, 14, 12, '#2c3a4c'); P(c, 2, 4, 12, 10, '#4d6a8a');
      const f = (b.busy && Math.floor(t * 8) % 2) ? 1 : 0;
      P(c, 5, 6, 6, 6, '#b8c2cc'); P(c, 4 + f, 7 - f, 1, 1, '#b8c2cc'); P(c, 11 - f, 7 + f * 3, 1, 1, '#b8c2cc');
      P(c, 7, 5, 2, 1, '#b8c2cc'); P(c, 7, 12, 2, 1, '#b8c2cc'); P(c, 4, 8, 1, 2, '#b8c2cc'); P(c, 11, 8, 1, 2, '#b8c2cc');
      P(c, 7, 8, 2, 2, '#2c3a4c');
      P(c, 6, 1, 4, 3, '#3d3a48');
      break;
    }
    case 'circuit': {
      P(c, 1, 3, 14, 12, '#143a22'); P(c, 2, 4, 12, 10, '#2a8a4a');
      P(c, 5, 7, 6, 5, '#111'); P(c, 6, 8, 4, 3, '#2d2d2d');
      for (let i = 0; i < 3; i++) { P(c, 4, 8 + i * 1.5 | 0, 1, 1, '#e8d050'); P(c, 11, 8 + i * 1.5 | 0, 1, 1, '#e8d050'); }
      const blink = b.busy && Math.floor(t * 6) % 2;
      P(c, 3, 5, 1, 1, blink ? '#ff4040' : '#601010'); P(c, 12, 5, 1, 1, b.busy ? '#60ff70' : '#104010');
      P(c, 6, 1, 4, 3, '#3d3a48');
      break;
    }
    case 'pad': {
      P(c, 0, 0, 16, 16, '#3a3646'); P(c, 1, 1, 14, 14, '#55506a');
      for (let i = 0; i < 4; i++) { P(c, 1 + i * 4, 1, 2, 1, '#e8c020'); P(c, 1 + i * 4, 14, 2, 1, '#e8c020'); }
      if (!G.launching) drawRocket(c, 8, 13, progress(), 0);
      break;
    }
  }
  // output marker for machines
  if (b.t !== 'belt' && b.t !== 'pad') {
    P(c, 7, 0, 2, 1, '#ffd040'); P(c, 6, 1, 4, 1, '#ffd040');
  }
  c.restore();
  if (!ghost && b.stuck && Math.floor(anim * 3) % 2) P(c, X + 13, Y + 1, 2, 2, '#ff4040');
  if (!ghost && b.dead) { P(c, X + 3, Y + 3, 10, 1, '#ff404099'); }
}
// rocket: base at (x,y) local, progress 0..1
function drawRocket(c, x, y, p, flame) {
  const hgt = 12; const vis = Math.max(1, Math.round(hgt * p));
  // scaffold outline
  if (p < 1) { for (let i = 0; i < hgt; i += 2) P(c, x - 3, y - i, 1, 1, '#9a93ad'), P(c, x + 2, y - i, 1, 1, '#9a93ad'); }
  for (let i = 0; i < vis; i++) {
    const yy = y - i;
    let w = 4, col = '#e8e2d0';
    if (i >= hgt - 3) w = (hgt - i) <= 1 ? 1 : 2, col = '#ff5a40';
    else if (i < 2) w = 4, col = '#c8c2b0';
    if (i === 6 || i === 7) col = '#5cd0ff';
    P(c, x - (w >> 1), yy, w, 1, col);
    if (i < 3) { P(c, x - 3, yy, 1, 1, '#ff5a40'); P(c, x + 2, yy, 1, 1, '#ff5a40'); }
  }
  if (flame) {
    const f = Math.floor(anim * 20) % 3;
    P(c, x - 2, y + 1, 4, 2 + f, '#ffd040'); P(c, x - 1, y + 1, 2, 4 + f, '#fff6c0'); P(c, x - 2, y + 3 + f, 4, 2, '#ff8a20');
  }
}
function drawItems(c) {
  for (const k in G.b) {
    const b = G.b[k]; const X = b.x * T + 8, Y = b.y * T + 8;
    if (b.t === 'belt') for (const it of b.it) {
      const o = (it.p - 0.5) * T; drawItem(c, it.i, X + DX[b.d] * o, Y + DY[b.d] * o);
    } else if (b.t === 'bridge') { if (b.q.length) drawItem(c, b.q[0].i, X - DX[b.d] * 4, Y - DY[b.d] * 4, 4); }
    else if (b.t === 'drill' && b.out) drawItem(c, b.out, X + DX[b.d] * 6, Y + DY[b.d] * 6, 4);
    else if (b.out && b.out.length) drawItem(c, b.out[0], X + DX[b.d] * 6, Y + DY[b.d] * 6, 4);
  }
}
let hover = null;
let particles = [];
let hiOre = null, hiUntil = 0;
function guideTargets() {
  if (hiOre && anim < hiUntil) { const out = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const r = G.res[y][x]; if (r && hiOre.includes(r.t)) out.push([x, y]); } return out; }
  if (!G.guide) return [];
  const s = guideStep(); const out = [];
  const oreOf = { 0: 'iron', 3: 'copper', 4: 'stone', 5: 'coal' }[s];
  if (oreOf) {
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const r = G.res[y][x]; if (r && r.t === oreOf && !bAt(x, y)) out.push([x, y]); }
  }
  if (s === 1) { for (const k in G.b) { const b = G.b[k]; if (b.t === 'drill' && G.res[b.y][b.x].t === 'iron') { const nx = b.x + DX[b.d], ny = b.y + DY[b.d]; if (!bAt(nx, ny)) out.push([nx, ny]); } } }
  if (s >= 5) out.push([G.pad.x, G.pad.y]);
  return out;
}
function render() {
  const c = cx;
  c.clearRect(0, 0, cv.width, cv.height);
  drawGround(c);
  // guide highlights
  const gt = guideTargets();
  if (gt.length) { const a = 0.25 + 0.25 * Math.sin(anim * 6); c.strokeStyle = `rgba(255,208,64,${a + 0.3})`; c.lineWidth = 1; for (const [x, y] of gt) { c.strokeRect(x * T + 0.5, y * T + 0.5, T - 1, T - 1); P(c, x * T, y * T, T, T, `rgba(255,208,64,${a * 0.5})`); } }
  for (const k in G.b) drawBld(c, G.b[k]);
  drawItems(c);
  // hover ghost (pc)
  if (hover && !G.launching && !drag) {
    const { x, y } = hover;
    if (delMode) { c.strokeStyle = '#ff5a5a'; c.strokeRect(x * T + 0.5, y * T + 0.5, T - 1, T - 1); }
    else if (!bAt(x, y)) {
      const ok = !canPlace(tool, x, y);
      if (ok) drawBld(c, { t: tool, x, y, d: rot, tm: 0, it: [], q: [], out: [] }, true);
      else { c.strokeStyle = '#ff5a5a88'; c.strokeRect(x * T + 0.5, y * T + 0.5, T - 1, T - 1); }
    } else { c.strokeStyle = '#ffffff66'; c.strokeRect(x * T + 0.5, y * T + 0.5, T - 1, T - 1); }
  }
  // launch
  if (G.launching) {
    const L_ = G.launching; const px = G.pad.x * T + 8, py = G.pad.y * T + 13;
    const k = L_.t; const lift = k < 0.8 ? 0 : Math.pow(k - 0.8, 2) * 60;
    const ry = py - lift;
    if (k > 0.3) for (let i = 0; i < 3; i++) particles.push({ x: px + (Math.random() - 0.5) * 4, y: ry + 3, vx: (Math.random() - 0.5) * 30, vy: 10 + Math.random() * 20, l: 1 });
    drawRocket(c, px, ry, 1, k > 0.3);
    if (k < 0.5 && Math.floor(anim * 8) % 2) { c.fillStyle = '#fff'; c.font = '8px monospace'; }
  }
  for (const p of particles) { const s = p.l > 0.6 ? 3 : 2; P(c, p.x | 0, p.y | 0, s, s, p.l > 0.7 ? '#ffb340' : p.l > 0.4 ? '#9a93ad' : '#55506a'); }
}

/* ---------------- sprites for UI ---------------- */
function drawItemIcon(canvas, it) { canvas.width = 8; canvas.height = 8; const c = canvas.getContext('2d'); drawItem(c, it, 4, 4, 6); }
function drawToolIcon(canvas, t) {
  canvas.width = 16; canvas.height = 16; const c = canvas.getContext('2d');
  const saveG = G; if (!G) G = { b: {}, res: [], diff: 'easy', delivered: {}, rock: [] };
  drawBld(c, { t, x: 0, y: 0, d: t === 'belt' ? 0 : 0, tm: t === 'drill' ? 0.1 : 0, it: [], q: [], out: [], cur: t === 'furnace' ? 'ironOre' : null, busy: 1 });
  G = saveG;
}
function chainHTML() {
  const i = it => `<canvas data-it="${it}"></canvas>${L().items[it]}`;
  const n = L().blds;
  return `<div class="chain">${i('ironOre')} → ${n.furnace} → ${i('ironPlate')} → ${n.gear}(×2) → ${i('gear')}</div>
<div class="chain">${i('copperOre')} → ${n.furnace} → ${i('copperPlate')} ＋ ${i('ironPlate')} → ${n.circuit} → ${i('circuit')}</div>
<div class="chain">${i('stone')} → ${n.furnace} → ${i('brick')}</div>
<div class="chain">${i('coal')} ／ ${i('crystal')} → 🚀</div>`;
}

/* ---------------- info: tooltip / recipe / legend ---------------- */
function icon(it) { const c = document.createElement('canvas'); drawItemIcon(c, it); return c.outerHTML.replace('<canvas', `<canvas data-it="${it}"`); }
function paintIcons(root) { root.querySelectorAll('canvas[data-it]').forEach(c => drawItemIcon(c, c.dataset.it)); }
function drawOreIcon(canvas, t) {
  canvas.width = 16; canvas.height = 16; const c = canvas.getContext('2d');
  const sg = G; G = { diff: 'easy' }; P(c, 0, 0, 16, 16, '#26232f'); drawOre(c, 0, 0, { t, a: 1 }, 0, 0); G = sg;
}
function infoAt(x, y) {
  const l = L(); const b = bAt(x, y); const r = G.res[y] && G.res[y][x];
  let h = '';
  if (r) {
    const it = ORE_ITEM[r.t]; const ore = DIFF[G.diff].ore;
    h += `${icon(it)} <b>${l.items[it]}</b>　<span class="s">${ore ? l.left(r.a) : l.inf}</span><br><span class="s">${l.resInfo[r.t]}</span>`;
  }
  if (b) {
    if (h) h += '<br>';
    h += `<b>${l.blds[b.t]}</b>　<span class="s">${l.bInfo[b.t]}</span>`;
    let st = '';
    if (b.dead) st = l.st.dead; else if (b.stuck) st = l.st.stuck;
    else if (b.t === 'drill') st = b.tm > 0 || b.out ? l.st.work : '';
    else if (b.t === 'furnace') st = b.cur ? l.st.work : l.st.idle;
    else if (b.t === 'gear' || b.t === 'circuit') st = b.busy ? l.st.work : l.st.idle;
    if (st) h += `<br><span class="s">${st}</span>`;
    let inside = [];
    if (b.t === 'furnace') inside = b.q.concat(b.cur ? [b.cur] : [], b.out);
    if (b.t === 'gear') inside = Array(b.n).fill('ironPlate').concat(b.out);
    if (b.t === 'circuit') inside = Array(b.fe).fill('ironPlate').concat(Array(b.cu).fill('copperPlate'), b.out);
    if (b.t === 'belt') inside = b.it.map(i => i.i);
    if (b.t === 'bridge') inside = b.q.map(i => i.i);
    if (inside.length) h += `<br><span class="s">${l.inside}${inside.map(icon).join('')}</span>`;
    if (b.t === 'pad') h += `<br><span class="s">🚀 ${Math.floor(progress() * 100)}%</span>`;
  }
  if (!h) h = G.rock[y][x] ? '🪨' : `<span class="s">${l.empty}</span>`;
  return h;
}
let tipFor = null;
function showTip(x, y) { const t = $('#tip'); t.innerHTML = infoAt(x, y); paintIcons(t); t.classList.remove('hidden'); tipFor = { x, y }; }
function hideTip() { $('#tip').classList.add('hidden'); tipFor = null; }
const RECIPE = {
  gear: [['ironOre'], 'furnace', ['ironPlate', '×2'], 'gear', ['gear']],
  circuit: [['ironOre', 'copperOre'], 'furnace', ['ironPlate', '＋', 'copperPlate'], 'circuit', ['circuit']],
  brick: [['stone'], 'furnace', ['brick']],
  coal: [['coal'], 'pad'], crystal: [['crystal'], 'pad']
};
const RECIPE_ORE = { gear: ['iron'], circuit: ['iron', 'copper'], brick: ['stone'], coal: ['coal'], crystal: ['crystal'] };
let recipeT = 0;
function showRecipe(k) {
  const l = L(); const parts = RECIPE[k].map(p => Array.isArray(p) ? p.map(x => ITEMS[x] ? icon(x) + l.items[x] : x).join(' ') : `[${l.blds[p]}]`);
  const el = $('#recipe');
  el.innerHTML = `<b>${l.recipeTitle}：${l.items[k]}</b><br>${parts.join(' → ')}` + (k === 'coal' || k === 'crystal' ? '' : ' → 🚀');
  paintIcons(el); el.classList.remove('hidden');
  hiOre = RECIPE_ORE[k]; hiUntil = anim + 4;
  clearTimeout(recipeT); recipeT = setTimeout(() => el.classList.add('hidden'), 4500);
  sfx('click');
}
$('#recipe').onclick = () => { $('#recipe').classList.add('hidden'); hiOre = null; };
function buildLegend() {
  const l = L(); const box = $('#legend-body'); box.innerHTML = '';
  for (const t of ['iron', 'copper', 'stone', 'coal', 'crystal']) {
    const d = document.createElement('div'); d.className = 'lg';
    const c = document.createElement('canvas'); drawOreIcon(c, t);
    d.append(c); const tx = document.createElement('div');
    tx.innerHTML = `<b>${l.items[ORE_ITEM[t]]}</b><small>${l.resInfo[t]}</small>`; d.append(tx); box.append(d);
  }
}
$('#legend-ok').onclick = () => { LS.set(K_LEGEND, 1); $('#ov-legend').classList.add('hidden'); paused = false; };

/* ---------------- UI: tools ---------------- */
function buildTools() {
  const box = $('#tools'); box.innerHTML = '';
  TOOLS.forEach((t, i) => {
    const b = document.createElement('button'); b.dataset.t = t;
    const c = document.createElement('canvas'); drawToolIcon(c, t);
    b.append(c); const s = document.createElement('span'); s.textContent = L().blds[t]; b.append(s);
    const k = document.createElement('span'); k.className = 'key'; k.textContent = i + 1; b.append(k);
    const r = document.createElement('span'); r.className = 'rot'; b.append(r);
    b.onclick = () => selectTool(t);
    box.append(b);
  });
  refreshTools();
}
const ARROWS = ['↑', '→', '↓', '←'];
function refreshTools() {
  $$('#tools button').forEach(b => { b.classList.toggle('sel', !delMode && b.dataset.t === tool); b.querySelector('.rot').textContent = b.dataset.t === 'belt' ? '' : ARROWS[rot]; });
  $('#b-del').classList.toggle('sel', delMode);
}
function selectTool(t) { tool = t; delMode = false; refreshTools(); sfx('click'); }

/* ---------------- HUD ---------------- */
const needCanvases = {};
function fmt(t) { const m = Math.floor(t / 60), s = t - m * 60; return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`; }
function buildHUD() {
  const box = $('#h-needs'); box.innerHTML = '';
  for (const k in need()) {
    const sp = document.createElement('span'); const c = document.createElement('canvas'); drawItemIcon(c, k);
    sp.append(c); const tx = document.createElement('i'); tx.style.fontStyle = 'normal'; sp.append(tx); box.append(sp); needCanvases[k] = sp;
    sp.title = L().items[k]; sp.onclick = () => showRecipe(k);
  }
  const dn = L()[G.diff] + (G.practice ? '・' + L().practiceTag : '');
  $('#h-mode').textContent = dn;
}
let lastHUD = '';
function updateHUD() {
  $('#h-time').textContent = '⏱ ' + fmt(G.time);
  const p = Math.floor(progress() * 100);
  const lim = DIFF[G.diff].limit;
  const s = `${p}|${bCount()}|${JSON.stringify(G.delivered)}|${G.guide}|${guideStep()}`;
  if (s === lastHUD) return; lastHUD = s;
  $('#h-prog').textContent = '🚀 ' + p + '%';
  $('#h-prog-bar i').style.width = p + '%';
  $('#h-bld').textContent = '🏭 ' + bCount() + (lim ? '/' + lim : '');
  for (const k in need()) { const sp = needCanvases[k]; const d = G.delivered[k] || 0, n = need()[k]; sp.querySelector('i').textContent = `${d}/${n}`; sp.classList.toggle('done', d >= n); }
  const gb = $('#guide');
  if (G.guide) {
    gb.classList.remove('hidden'); const st = guideStep(); const g = L().guide[st];
    $('#guide-step').textContent = `${st + 1}/${L().guide.length}`;
    $('#guide-text').innerHTML = `${g[0]}<br><small style="color:#c9b98a">${g[1]}</small>`;
  } else gb.classList.add('hidden');
  $('#b-guide').classList.toggle('sel', false);
  requestAnimationFrame(fit);
}
function guideStep() {
  const m = G.made, d = G.delivered;
  const hasIronDrill = Object.values(G.b).some(b => b.t === 'drill' && G.res[b.y][b.x] && G.res[b.y][b.x].t === 'iron');
  if (!hasIronDrill && !m.ironPlate) return 0;
  if (!m.ironPlate) return 1;
  if (!m.gear) return 2;
  if (!m.circuit) return 3;
  if (!m.brick) return 4;
  if (!d.coal) return 5;
  if (!(d.gear && d.circuit && d.brick)) return 6;
  return 7;
}

/* ---------------- canvas fit ---------------- */
function fit() {
  const st = $('#stage'); const r = st.getBoundingClientRect();
  const sc = Math.min(r.width / cv.width, r.height / cv.height);
  const s = sc;
  cv.style.width = (cv.width * s) + 'px'; cv.style.height = (cv.height * s) + 'px';
}
window.addEventListener('resize', () => { if (G) fit(); });

/* ---------------- input ---------------- */
let drag = null, hoverT = 0;
function tileFromEvent(e) {
  const r = cv.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * W), y = Math.floor((e.clientY - r.top) / r.height * H);
  return { x, y, inside: x >= 0 && y >= 0 && x < W && y < H };
}
function dirTo(a, b) { if (b.x > a.x) return 1; if (b.x < a.x) return 3; if (b.y > a.y) return 2; return 0; }
cv.addEventListener('contextmenu', e => e.preventDefault());
cv.addEventListener('pointerdown', e => {
  if (!G || G.launching || paused) return;
  audioInit();
  cv.setPointerCapture(e.pointerId);
  const p = tileFromEvent(e); if (!p.inside) return;
  const del = delMode || e.button === 2;
  hideTip();
  drag = { last: p, del, moved: false, startB: bAt(p.x, p.y), long: false };
  if (del) { remove(p.x, p.y); return; }
  if (e.pointerType !== 'mouse') {
    const d = drag;
    d.lp = setTimeout(() => { if (drag === d && !d.moved) { d.long = true; showTip(p.x, p.y); if (navigator.vibrate) try { navigator.vibrate(15); } catch (_) {} } }, 420);
  }
});
cv.addEventListener('pointermove', e => {
  if (!G) return;
  const p = tileFromEvent(e);
  const nh = p.inside ? p : null;
  if (e.pointerType === 'mouse' && !drag) {
    if (!nh) hideTip();
    else if (!hover || nh.x !== hover.x || nh.y !== hover.y) { hideTip(); clearTimeout(hoverT); hoverT = setTimeout(() => { if (hover && !drag) showTip(hover.x, hover.y); }, 450); }
  }
  hover = nh;
  if (!drag || paused || G.launching) return;
  if (drag.long) return;
  if (!p.inside) return;
  // step tile by tile toward p
  let guard = 0;
  while ((p.x !== drag.last.x || p.y !== drag.last.y) && guard++ < 30) {
    const l = drag.last;
    const nx = l.x + Math.sign(p.x - l.x) * (p.x !== l.x ? 1 : 0);
    const ny = p.x !== l.x ? l.y : l.y + Math.sign(p.y - l.y);
    const nt = { x: nx, y: ny };
    drag.moved = true;
    if (drag.del) { remove(nx, ny); drag.last = nt; continue; }
    if (tool === 'belt') beltStep(l, nt);
    else if (!bAt(nx, ny)) place(tool, nx, ny, rot, true);
    drag.last = nt;
  }
});
function beltStep(a, b) {
  const d = dirTo(a, b);
  let ab = bAt(a.x, a.y);
  if (!ab) { place('belt', a.x, a.y, d, true); ab = null; }
  if (ab && ab.t !== 'pad') { if (ab.d !== d) { ab.d = d; dirty(); } }
  const bb = bAt(b.x, b.y);
  if (!bb) { place('belt', b.x, b.y, d, true); rot = d; refreshTools(); }
  else if (bb.t === 'belt' && bb.d === (d + 2) % 4) { /* don't flip opposing */ }
}
function endDrag(e) {
  if (!drag) return;
  clearTimeout(drag.lp);
  if (drag.long) { drag = null; setTimeout(hideTip, 1800); return; }
  const p = drag.last;
  if (!drag.moved && !drag.del) {
    const b = bAt(p.x, p.y);
    if (b && b === drag.startB) {
      if (b.t !== 'pad') { b.d = (b.d + 1) % 4; sfx('click'); dirty(); }
    } else if (!b) place(tool, p.x, p.y, rot);
  }
  drag = null;
}
cv.addEventListener('pointerup', endDrag);
cv.addEventListener('pointercancel', endDrag);
cv.addEventListener('pointerleave', () => { hover = null; clearTimeout(hoverT); hideTip(); });

$('#b-del').onclick = () => { delMode = !delMode; refreshTools(); sfx('click'); };
$('#b-rot').onclick = () => { rot = (rot + 1) % 4; refreshTools(); sfx('click'); };
$('#b-guide').onclick = () => { G.guide = !G.guide; lastHUD = ''; dirty(); sfx('click'); };
$('#b-pause').onclick = () => setPause(true);

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (!$('#scr-game').classList.contains('active')) return;
  if (!$('#ov-help').classList.contains('hidden') || !$('#ov-rank').classList.contains('hidden')) { if (e.key === 'Escape') closeOv(); return; }
  if (!$('#ov-result').classList.contains('hidden') || !$('#ov-legend').classList.contains('hidden')) return;
  const k = e.key.toLowerCase();
  if (k === ' ' || k === 'escape' || k === 'p') { e.preventDefault(); setPause(!paused); return; }
  if (paused || !G || G.launching) return;
  if (k >= '1' && k <= '6') selectTool(TOOLS[+k - 1]);
  else if (k === 'r') { rot = (rot + (e.shiftKey ? 3 : 1)) % 4; refreshTools(); }
  else if (k === 'x' || k === 'delete') { delMode = !delMode; refreshTools(); }
  else if (k === 'g') $('#b-guide').onclick();
});

/* ---------------- loop ---------------- */
let paused = false, last = 0, saveTimer = 0;
function loop(ts) {
  const dt = Math.min(0.1, (ts - last) / 1000 || 0); last = ts;
  anim += dt;
  if (G && $('#scr-game').classList.contains('active')) {
    if (!paused && !G.done) {
      let rem = dt; while (rem > 0 && !G.done) { const s = Math.min(rem, 1 / 60); step(s); rem -= s; }
      saveTimer += dt; if (saveTimer > 2) { saveTimer = 0; saveRun(); }
    }
    if (G.launching) {
      G.launching.t += dt / 3.2;
      if (G.launching.t >= 1 && !G.launching.shown) { G.launching.shown = true; showResult(); }
    }
    particles = particles.filter(p => (p.l -= dt * 0.9) > 0);
    for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.96; }
    render(); updateHUD();
    if (tipFor && Math.floor(anim * 4) !== Math.floor((anim - dt) * 4)) { const t = $('#tip'); t.innerHTML = infoAt(tipFor.x, tipFor.y); paintIcons(t); }
  }
  if ($('#scr-title').classList.contains('active')) drawTitle();
  requestAnimationFrame(loop);
}
function dirty() { lastHUD = ''; }

/* ---------------- resume (auto-snapshot) ---------------- */
function saveRun() { if (G && !G.done) LS.set(K_RUN, G); }
function clearRun() { LS.del(K_RUN); }
function loadRun() {
  const r = LS.get(K_RUN, null);
  if (!r || !r.b || !DIFF[r.diff]) return null;
  if (!r.w) { r.w = 10; r.h = 14; } // runs from v1.0.0
  if (!r.practice && r.seed !== todaySeed()) { /* yesterday's run: still resumable, but marked */ }
  return r;
}
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { if (G && !G.done && $('#scr-game').classList.contains('active')) { setPause(true); saveRun(); } stopBGM(); }
  else if (settings.sound && G && !paused) startBGM();
});
window.addEventListener('pagehide', saveRun);

/* ---------------- flow ---------------- */
function show(id) { $$('.scr').forEach(s => s.classList.toggle('active', s.id === id)); }
function closeOv() { $$('.ov').forEach(o => { if (o.id !== 'ov-pause' && o.id !== 'ov-result') o.classList.add('hidden'); }); }
function startGame(seed, diff, practice) {
  newRun(seed, diff, practice);
  enterGame();
}
function enterGame() {
  setSize(G.w || 10, G.h || 14);
  show('scr-game'); paused = false; drag = null; delMode = false; tool = 'drill'; particles = []; hideTip(); hiOre = null; $('#recipe').classList.add('hidden');
  $('#ov-pause').classList.add('hidden'); $('#ov-result').classList.add('hidden');
  buildTools(); buildHUD(); lastHUD = ''; fit(); setTimeout(fit, 50);
  saveRun(); startBGM();
  if (!LS.get(K_LEGEND, 0)) { paused = true; $('#ov-legend').classList.remove('hidden'); }
}
function setPause(v) {
  if (!G || G.done) return;
  paused = v; $('#ov-pause').classList.toggle('hidden', !v);
  if (v) { saveRun(); stopBGM(); } else startBGM();
}
$('#p-resume').onclick = () => setPause(false);
$('#p-help').onclick = () => $('#ov-help').classList.remove('hidden');
$('#p-sound').onclick = () => { settings.sound = !settings.sound; LS.set(K_SET, settings); applyLang(); };
$('#p-retry').onclick = () => { const { seed, diff, practice } = G; startGame(seed, diff, practice); };
$('#p-quit').onclick = () => { clearRun(); G = null; paused = false; stopBGM(); $('#ov-pause').classList.add('hidden'); show('scr-title'); updateTitle(); };

function launch() {
  G.done = true; G.launching = { t: 0 }; clearRun(); stopBGM(); sfx('launch');
}

/* ---------------- result & ranking ---------------- */
let lastEntry = null;
function shareURL() {
  const u = new URL(location.href.split('?')[0].split('#')[0]);
  u.searchParams.set('seed', G.seed); u.searchParams.set('d', G.diff);
  u.searchParams.set('time', G.time.toFixed(1)); u.searchParams.set('b', bCount());
  return u.toString();
}
function showResult() {
  const ov = $('#ov-result'); ov.classList.remove('hidden');
  $('#r-time').textContent = fmt(G.time);
  $('#r-detail').textContent = L().detail(bCount(), L()[G.diff] + ' ' + (G.practice ? L().practiceTag : seedLabel(G.seed)));
  const rk = LS.get(K_RANK, []);
  const mine = rk.filter(r => r.d === G.diff && r.seed === G.seed && !r.practice);
  const best = Math.min(...mine.map(r => r.time), Infinity);
  $('#r-best').textContent = G.practice ? '' : (G.time < best ? L().bestNew : L().bestWas + fmt(best));
  $('#r-name').value = settings.name || '';
  $('#r-entry').classList.toggle('hidden', G.practice);
  $('#r-share').classList.toggle('hidden', G.practice);
  $('#r-copy').classList.toggle('hidden', G.practice);
  $('#r-reg').disabled = false; lastEntry = null;
  sfx('fanfare');
}
$('#r-reg').onclick = () => {
  const name = ($('#r-name').value || '').trim().slice(0, 12) || 'NoName';
  settings.name = name; LS.set(K_SET, settings);
  const rk = LS.get(K_RANK, []);
  lastEntry = { name, time: +G.time.toFixed(1), b: bCount(), d: G.diff, seed: G.seed, at: Date.now() };
  rk.push(lastEntry); rk.sort((a, b) => a.time - b.time || a.b - b.b);
  LS.set(K_RANK, rk.slice(0, 300));
  $('#r-reg').disabled = true;
  api('POST', '', { name, time: lastEntry.time, b: lastEntry.b, d: G.diff, seed: G.seed, v: VERSION })
    .then(r => toast(r && r.ok ? L().registered : L().sendFail)).catch(() => toast(L().sendFail));
};
async function api(method, qs, body) {
  const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 5000);
  try {
    const r = await fetch(RANK_API + qs, { method, signal: ctl.signal, cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } finally { clearTimeout(tm); }
}
$('#r-share').onclick = () => {
  const text = L().shareText(fmt(G.time), L()[G.diff], bCount());
  window.open('https://twitter.com/intent/tweet?text=' + encodeURIComponent(text) + '&url=' + encodeURIComponent(shareURL()), '_blank', 'noopener');
};
$('#r-copy').onclick = async () => {
  const u = shareURL();
  try { if (navigator.share) await navigator.share({ title: 'Fabralift', text: L().shareText(fmt(G.time), L()[G.diff], bCount()), url: u }); else { await navigator.clipboard.writeText(u); toast(L().copied); } } catch (e) { try { await navigator.clipboard.writeText(u); toast(L().copied); } catch (_) {} }
};
$('#r-rank').onclick = () => openRank(G.diff, G.practice ? 'all' : 'today');
$('#r-retry').onclick = () => { const { seed, diff, practice } = G; startGame(seed, diff, practice); };
$('#r-title').onclick = () => { G = null; $('#ov-result').classList.add('hidden'); show('scr-title'); updateTitle(); };

let rkState = { s: 'today', d: 'easy' };
function openRank(d, s) { rkState = { s: s || rkState.s, d: d || rkState.d }; $('#ov-rank').classList.remove('hidden'); drawRank(); }
function drawRank() {
  $$('#rk-scope button').forEach(b => b.classList.toggle('on', b.dataset.s === rkState.s));
  $$('#rk-diff button').forEach(b => b.classList.toggle('on', b.dataset.d === rkState.d));
  const ts = todaySeed(); const want = { ...rkState };
  const local = () => LS.get(K_RANK, []).filter(r => r.d === want.d && (want.s === 'all' || r.seed === ts)).slice(0, 20);
  $('#rk-list').innerHTML = '<li class="empty">…</li>'; $('#rk-src').textContent = '';
  api('GET', `?d=${want.d}&scope=${want.s}&seed=${ts}`)
    .then(r => { if (!r || !Array.isArray(r.list)) throw 0; return [r.list, true]; })
    .catch(() => [local(), false])
    .then(([list, online]) => { if (want.s === rkState.s && want.d === rkState.d) renderRank(list, online); });
}
function renderRank(list, online) {
  $('#rk-src').textContent = online ? L().online : L().offline;
  const ol = $('#rk-list'); ol.innerHTML = '';
  if (!list.length) { ol.innerHTML = `<li class="empty">${L().noRecord}</li>`; return; }
  list.forEach((r, i) => {
    const li = document.createElement('li');
    if (lastEntry && r.name === lastEntry.name && Math.abs(r.time - lastEntry.time) < 0.05 && r.seed === lastEntry.seed) li.className = 'me';
    li.innerHTML = `<b>${i + 1}</b><span class="n"></span><span class="t">${fmt(r.time)}</span><span class="bb">🏭${r.b}</span>`;
    li.querySelector('.n').textContent = r.name + (rkState.s === 'all' ? ` (${seedLabel(r.seed).slice(5)})` : '');
    ol.append(li);
  });
}
$$('#rk-scope button').forEach(b => b.onclick = () => { rkState.s = b.dataset.s; drawRank(); });
$$('#rk-diff button').forEach(b => b.onclick = () => { rkState.d = b.dataset.d; drawRank(); });
$$('.ov .close').forEach(b => b.onclick = () => b.closest('.ov').classList.add('hidden'));

/* ---------------- title ---------------- */
const tcv = $('#title-cv'), tcx = tcv.getContext('2d');
function drawTitle() {
  const c = tcx; c.clearRect(0, 0, 96, 96);
  // stars
  for (let i = 0; i < 24; i++) { const x = (i * 41 + (i * i * 7)) % 96, y = (i * 29 + i * i * 3) % 58; if ((anim * 2 + i) % 5 > 0.6) P(c, x, y, 1, 1, '#ffffff88'); }
  P(c, 0, 76, 96, 20, '#26232f'); P(c, 0, 76, 96, 1, '#3a3550');
  // factory
  P(c, 6, 60, 22, 16, '#5c2a1c'); P(c, 8, 62, 18, 12, '#a8442c'); P(c, 12, 50, 4, 10, '#3d3a48');
  if (Math.floor(anim * 2) % 2) P(c, 13, 46, 3, 3, '#9a93ad'); P(c, 15, 42, 3, 3, '#6d6682');
  P(c, 12, 68, 8, 6, '#1a0e0a'); P(c, 13, 70, 6, 3, Math.floor(anim * 8) % 2 ? '#ff8a20' : '#ffd040');
  // belt with items
  P(c, 28, 72, 40, 4, '#4a4558');
  for (let i = 0; i < 4; i++) { const x = 28 + ((anim * 14 + i * 10) % 40); drawItem(c, ['ironPlate', 'gear', 'circuit', 'copperPlate'][i], x, 71, 4); }
  // pad & rocket
  P(c, 64, 74, 28, 4, '#55506a');
  const lift = (anim % 6) > 4 ? Math.pow((anim % 6) - 4, 2) * 18 : 0;
  c.save(); c.translate(78, 72 - lift); c.scale(2, 2); drawRocket(c, 0, 0, 1, lift > 0); c.restore();
}
function updateTitle() {
  const ts = todaySeed();
  $('#seed-label').textContent = seedLabel(ts);
  const run = loadRun();
  $('#resume-box').classList.toggle('hidden', !run);
  if (run) {
    const pg = (() => { const s = G; G = run; const p = Math.floor(progress() * 100); G = s; return p; })();
    $('#resume-info').textContent = L().resumeInfo(L()[run.diff] + (run.practice ? '・' + L().practiceTag : ''), fmt(run.time), pg);
  }
  // challenge from URL
  const q = new URLSearchParams(location.search);
  const ch = $('#challenge');
  if (q.get('seed') && q.get('time') && DIFF[q.get('d')] && +q.get('seed') === ts) {
    ch.classList.remove('hidden');
    ch.innerHTML = L().challenge(fmt(+q.get('time')), +q.get('b') || 0, L()[q.get('d')]);
  } else ch.classList.add('hidden');
}
$('#btn-resume').onclick = () => { const r = loadRun(); if (!r) return; audioInit(); G = r; G.launching = null; enterGame(); setPause(true); };
let practiceMode = false;
$$('.diff').forEach(b => b.onclick = () => {
  audioInit(); clearRun();
  if (practiceMode) startGame(1 + Math.floor(Math.random() * 999999), b.dataset.d, true);
  else startGame(todaySeed(), b.dataset.d, false);
});
$('#btn-practice').onclick = () => {
  practiceMode = !practiceMode;
  $('#btn-practice').classList.toggle('accent', practiceMode);
  $('#seed-label').textContent = practiceMode ? '🎲 ' + L().practiceTag : seedLabel(todaySeed());
};
$('#btn-rank').onclick = () => openRank('easy', 'today');
$('#btn-help').onclick = () => $('#ov-help').classList.remove('hidden');
$$('.lang button').forEach(b => b.onclick = () => { settings.lang = b.dataset.lang; LS.set(K_SET, settings); applyLang(); });

/* ---------------- toast ---------------- */
let toastT = 0;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1600); }

/* ---------------- audio (chiptune) ---------------- */
let AC = null, master = null, bgmTimer = 0, bgmStep = 0, lastSfx = {};
function audioInit() {
  if (AC) { if (AC.state === 'suspended') AC.resume(); return; }
  try { AC = new (window.AudioContext || window.webkitAudioContext)(); master = AC.createGain(); master.gain.value = 0.18; master.connect(AC.destination); } catch (e) {}
}
function tone(f, d, type = 'square', v = 0.5, when = 0, slide = 0) {
  if (!AC || !settings.sound) return;
  const t = AC.currentTime + when; const o = AC.createOscillator(), g = AC.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + d);
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.001, t + d);
  o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.02);
}
function noise(d, v = 0.4, when = 0) {
  if (!AC || !settings.sound) return;
  const len = AC.sampleRate * d, buf = AC.createBuffer(1, len, AC.sampleRate), ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const s = AC.createBufferSource(), g = AC.createGain(); s.buffer = buf; g.gain.value = v; s.connect(g); g.connect(master); s.start(AC.currentTime + when);
}
function sfx(n) {
  const now = performance.now(); if (lastSfx[n] && now - lastSfx[n] < 60) return; lastSfx[n] = now;
  switch (n) {
    case 'place': tone(520, 0.06, 'square', 0.4); tone(780, 0.06, 'square', 0.3, 0.04); break;
    case 'del': tone(300, 0.1, 'square', 0.4, 0, 0.5); break;
    case 'click': tone(900, 0.03, 'square', 0.25); break;
    case 'deliver': tone(1046, 0.05, 'triangle', 0.4); tone(1318, 0.06, 'triangle', 0.35, 0.04); break;
    case 'launch': noise(3.2, 0.5); tone(60, 3, 'sawtooth', 0.4, 0.8, 0.3); break;
    case 'fanfare': [523, 659, 784, 1046, 784, 1046].forEach((f, i) => tone(f, 0.18, 'square', 0.35, i * 0.12)); break;
  }
}
const MEL = [0, 7, 12, 7, 3, 7, 10, 7, 0, 7, 12, 14, 12, 10, 7, 3];
const BASS = [0, 0, -4, -4, -2, -2, -5, -5];
function startBGM() {
  stopBGM(); if (!AC || !settings.sound || !G || G.done) return;
  bgmTimer = setInterval(() => {
    if (paused || !G || G.done) return;
    const i = bgmStep++; const root = 220 * Math.pow(2, BASS[(i >> 3) % 8] / 12);
    if (i % 2 === 0) tone(root * Math.pow(2, MEL[i % 16] / 12), 0.12, 'square', 0.12);
    if (i % 4 === 0) tone(root / 2, 0.25, 'triangle', 0.35);
    if (i % 8 === 4) noise(0.04, 0.12);
  }, 140);
}
function stopBGM() { clearInterval(bgmTimer); bgmTimer = 0; }

/* ---------------- boot ---------------- */
applyLang();
requestAnimationFrame(loop);
if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
window.__fab = { get G() { return G; }, place, step, progress };
})();
