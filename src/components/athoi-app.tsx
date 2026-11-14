import { useEffect, useMemo, useRef, useState } from "react";
import { BY, LETTERS, QUESTIONS, SUBJECTS, SUBJ, type Q } from "@/data/bank";

type Theme = "" | "light" | "dark";
type Pool = "all" | "unk" | "fav" | "mist";
type Hist = { d: number; sub: string; title: string; s: number; t: number; sec: number };
type Store = {
  known: string[];
  fav: string[];
  mist: string[];
  hist: Hist[];
  done: Record<string, number>;
  theme: Theme;
  last: string;
};
type View =
  | { t: "home" }
  | { t: "hub"; s: string }
  | { t: "learn"; s: string }
  | { t: "sets"; s: string }
  | { t: "rand"; s: string }
  | { t: "prog"; s: string }
  | { t: "quiz" }
  | { t: "done" };
type Quiz = {
  list: Q[];
  title: string;
  sub: string;
  ck?: string;
  i: number;
  a: (number | null)[];
  t0: number;
  fin: boolean;
  sec: number;
  score: number;
};
type Learn = { q: string; let: string; v: Pool; i: number; rec: boolean; shown: boolean };

const KEY = "athoi";
const EMPTY: Store = { known: [], fav: [], mist: [], hist: [], done: {}, theme: "", last: "" };
const ALPHA = "অআইঈউঊঋএঐওঔকখগঘঙচছজঝঞটঠডঢণতথদধনপফবভমযরলশষসহড়ঢ়য়ংঃঁ";

function load(): Store {
  try {
    const r = JSON.parse(localStorage.getItem(KEY) || "");
    return { ...EMPTY, ...r, known: r.known || [], fav: r.fav || [], mist: r.mist || [], hist: r.hist || [], done: r.done || {} };
  } catch {
    return { ...EMPTY };
  }
}
function has(list: string[], id: string) {
  return list.includes(id);
}
function shuf<T>(a: T[]) {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j]!, b[i]!];
  }
  return b;
}
function fmt(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}
function letterOf(h: string) {
  const c = h.trim()[0] || "";
  if (/[A-Za-z]/.test(c)) return c.toUpperCase();
  return c;
}
function Moon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}
function Star({ on }: { on: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.8 6.6 19.8l1-6.1L3.2 9.4l6.1-.9L12 3z" />
    </svg>
  );
}
function Tick() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5L20 7" />
    </svg>
  );
}

export function AthoiApp() {
  const [store, setStore] = useState<Store>(EMPTY);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>({ t: "home" });
  const [learn, setLearn] = useState<Learn>({ q: "", let: "", v: "all", i: 0, rec: false, shown: false });
  const [size, setSize] = useState(20);
  const [want, setWant] = useState(20);
  const [pool, setPool] = useState<Pool>("all");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [now, setNow] = useState(Date.now());
  const [rf, setRf] = useState<"all" | "w">("all");
  const [toast, setToast] = useState("");
  const dlg = useRef<HTMLDialogElement>(null);
  const bag = useRef({ view, learn, quiz, store });
  bag.current = { view, learn, quiz, store };

  useEffect(() => {
    const s = load();
    setStore(s);
    if (s.theme) document.documentElement.dataset.theme = s.theme;
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(KEY, JSON.stringify(store));
    if (store.theme) {
      document.documentElement.dataset.theme = store.theme;
      localStorage.setItem("athoi-theme", store.theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.removeItem("athoi-theme");
    }
  }, [store, ready]);
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view]);
  useEffect(() => {
    if (view.t !== "quiz" || !quiz || quiz.fin) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [view.t, quiz?.fin, quiz?.t0]);
  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(() => setToast(""), 1400);
    return () => window.clearTimeout(id);
  }, [toast]);

  function toggleTheme() {
    setStore((s) => {
      const dark = s.theme ? s.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
      return { ...s, theme: dark ? "light" : "dark" };
    });
  }
  function tog(field: "known" | "fav", id: string) {
    setStore((s) => {
      const list = s[field];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      return { ...s, [field]: next, last: id };
    });
  }

  const knownN = store.known.length;
  const sub = view.t === "home" || view.t === "quiz" || view.t === "done" ? "" : view.s;

  function poolOf(s: string, p: Pool) {
    let l = s === "all" ? QUESTIONS : BY[s] || [];
    if (p === "unk") l = l.filter((q) => !has(store.known, q.id));
    if (p === "fav") l = l.filter((q) => has(store.fav, q.id));
    if (p === "mist") l = l.filter((q) => has(store.mist, q.id));
    return l;
  }

  const learnList = useMemo(() => {
    if (view.t !== "learn") return [] as Q[];
    let l = BY[view.s] || [];
    const qq = learn.q.trim();
    if (qq) l = l.filter((q) => q.q.includes(qq) || q.h.includes(qq) || q.o.some((o) => o.includes(qq)));
    if (learn.let) l = l.filter((q) => letterOf(q.h) === learn.let);
    if (learn.v === "unk") l = l.filter((q) => !has(store.known, q.id));
    if (learn.v === "fav") l = l.filter((q) => has(store.fav, q.id));
    return l;
  }, [view, learn.q, learn.let, learn.v, store.known, store.fav]);

  function start(list: Q[], title: string, subject: string, ck?: string) {
    if (!list.length) return;
    setRf("all");
    setQuiz({ list, title, sub: subject, ck, i: 0, a: list.map(() => null), t0: Date.now(), fin: false, sec: 0, score: 0 });
    setNow(Date.now());
    setView({ t: "quiz" });
  }
  function pick(i: number) {
    setQuiz((q) => {
      if (!q || q.fin || q.a[q.i] != null) return q;
      const a = q.a.slice();
      a[q.i] = i;
      return { ...q, a };
    });
  }
  function tgo(d: number) {
    setQuiz((q) => (q ? { ...q, i: Math.max(0, Math.min(q.list.length - 1, q.i + d)) } : q));
  }
  function finish() {
    const qz = bag.current.quiz;
    if (!qz) return;
    const un = qz.list.length - qz.a.filter((x) => x != null).length;
    if (un && !confirm(`${un}টি প্রশ্ন খালি। তবু শেষ করবে?`)) return;
    const sec = ((Date.now() - qz.t0) / 1000) | 0;
    const score = qz.list.filter((q, i) => qz.a[i] === q.a).length;
    const pc = Math.round((score / qz.list.length) * 100);
    setStore((s) => {
      const mist = s.mist.slice();
      qz.list.forEach((q, i) => {
        if (qz.a[i] == null) return;
        const m = mist.indexOf(q.id);
        if (qz.a[i] === q.a) {
          if (m >= 0) mist.splice(m, 1);
        } else if (m < 0) mist.push(q.id);
      });
      const done = { ...s.done };
      if (qz.ck) done[qz.ck] = Math.max(done[qz.ck] || 0, pc);
      const hist = [{ d: Date.now(), sub: qz.sub, title: qz.title, s: score, t: qz.list.length, sec }, ...s.hist].slice(0, 40);
      return { ...s, mist, done, hist };
    });
    setQuiz({ ...qz, fin: true, sec, score });
    setView({ t: "done" });
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const el = e.target as HTMLElement;
      if (/INPUT|SELECT|TEXTAREA/.test(el.tagName) || e.metaKey || e.ctrlKey || dlg.current?.open) return;
      const k = e.key;
      const { view: v, learn: L, quiz: Qz } = bag.current;
      if (v.t === "quiz" && Qz && !Qz.fin) {
        if (/^[1-6]$/.test(k) && +k <= Qz.list[Qz.i]!.o.length) pick(+k - 1);
        else if (k === "ArrowRight") tgo(1);
        else if (k === "ArrowLeft") tgo(-1);
        return;
      }
      if (v.t === "learn") {
        const n = learnList.length;
        if (!n) return;
        if (k === "ArrowRight") setLearn((x) => ({ ...x, i: (x.i + 1) % n, shown: false }));
        else if (k === "ArrowLeft") setLearn((x) => ({ ...x, i: (x.i - 1 + n) % n, shown: false }));
        else if (k === " ") {
          e.preventDefault();
          setLearn((x) => ({ ...x, shown: true }));
        } else if (k === "s" || k === "k") {
          const c = learnList[L.i];
          if (c) tog(k === "s" ? "fav" : "known", c.id);
        }
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [learnList]);

  function head() {
    const inSub = sub && sub !== "all";
    return (
      <header className="top">
        <div>
          <button className="logo" onClick={() => setView(inSub ? { t: "hub", s: sub } : { t: "home" })}>
            <i>অ</i>অথৈ
          </button>
          {inSub ? (
            <button className="btn" onClick={() => setView({ t: "home" })}>
              সব বিষয়
            </button>
          ) : null}
          <button className="ib" onClick={toggleTheme} aria-label="থিম বদলাও" title="থিম">
            <Moon />
          </button>
        </div>
      </header>
    );
  }

  function nav() {
    if (!sub || sub === "all" || view.t === "quiz" || view.t === "done") return null;
    const items: { id: View["t"]; label: string }[] = [
      { id: "learn", label: "পড়া" },
      { id: "sets", label: "সেট" },
      { id: "rand", label: "এলোমেলো" },
      { id: "prog", label: "অগ্রগতি" },
    ];
    return (
      <nav className="m" aria-label="বিষয়ের মেনু">
        {items.map((it) => (
          <button key={it.id} className={view.t === it.id ? "on" : ""} onClick={() => setView({ t: it.id, s: sub } as View)}>
            {it.label}
          </button>
        ))}
      </nav>
    );
  }

  function home() {
    return (
      <>
        <section className="hero">
          <p className="eyebrow">ভর্তি বাংলা</p>
          <h1>বিষয় বেছে নাও।</h1>
          <p>ফ্ল্যাশকার্ডে পড়ো, ছোট সেটে যাচাই করো — সমার্থক থেকে অনুবাদ, এক জায়গায়।</p>
        </section>
        <div className="stats">
          <div className="stat">
            <b>{QUESTIONS.length.toLocaleString("bn")}</b>
            <span>প্রশ্ন</span>
          </div>
          <div className="stat">
            <b>{knownN.toLocaleString("bn")}</b>
            <span>জানা</span>
          </div>
          <div className="stat">
            <b>{SUBJECTS.length.toLocaleString("bn")}</b>
            <span>বিষয়</span>
          </div>
        </div>
        <div className="grid">
          <button className="tile pri" onClick={() => start(shuf(QUESTIONS).slice(0, 20), "মিশ্র · ২০টি", "all")}>
            <span className="num">দ্রুত</span>
            <h3>মিশ্র পরীক্ষা</h3>
            <p>সব বিষয় থেকে ২০টি এলোমেলো প্রশ্ন।</p>
            <span className="go">শুরু ›</span>
          </button>
          <button
            className="tile"
            disabled={!store.mist.length}
            onClick={() => start(shuf(QUESTIONS.filter((q) => has(store.mist, q.id))).slice(0, 20), "আগের ভুল", "all")}
          >
            <span className="num">আবার</span>
            <h3>ভুলগুলো</h3>
            <p>{store.mist.length ? `${store.mist.length}টি ভুল আবার দেখো।` : "এখনো কোনো ভুল জমা হয়নি।"}</p>
            <span className="go">দেখো ›</span>
          </button>
        </div>
        <div className="grid">
          {SUBJECTS.map((s, i) => {
            const list = BY[s.id] || [];
            const kn = list.filter((q) => has(store.known, q.id)).length;
            const started = kn > 0 || store.hist.some((h) => h.sub === s.id);
            return (
              <button key={s.id} className="tile" onClick={() => setView({ t: "hub", s: s.id })}>
                <span className="num">{String(i + 1).padStart(2, "0")}</span>
                <h3>{s.name}</h3>
                <p>{s.blurb}</p>
                <div className="meta">
                  <span>{list.length} প্রশ্ন</span>
                  <span>
                    {kn}/{list.length} জানা
                  </span>
                </div>
                <div className="bar">
                  <i style={{ width: `${list.length ? Math.round((kn / list.length) * 100) : 0}%` }} />
                </div>
                <span className="go">{started ? "চালিয়ে যাও" : "শুরু"} ›</span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  function hub(id: string) {
    const meta = SUBJ[id];
    const list = BY[id] || [];
    const kn = list.filter((q) => has(store.known, q.id)).length;
    if (!meta) return <></>;
    return (
      <>
        <section className="hero">
          <p className="eyebrow">অথৈ</p>
          <h1>{meta.name}</h1>
          <p>{meta.blurb}</p>
        </section>
        <div className="stats">
          <div className="stat">
            <b>
              {kn}/{list.length}
            </b>
            <span>জানা</span>
          </div>
          <div className="stat">
            <b>{list.filter((q) => has(store.fav, q.id)).length}</b>
            <span>সেভ</span>
          </div>
          <div className="stat">
            <b>{list.filter((q) => has(store.mist, q.id)).length}</b>
            <span>ভুল</span>
          </div>
        </div>
        <div className="grid">
          <button className="tile pri" onClick={() => setView({ t: "learn", s: id })}>
            <h3>পড়ো</h3>
            <p>কার্ডে প্রশ্ন, উত্তর লুকিয়ে মনে করার অভ্যাস।</p>
            <span className="go">কার্ড খোলো ›</span>
          </button>
          <button className="tile" onClick={() => setView({ t: "sets", s: id })}>
            <h3>সেট পরীক্ষা</h3>
            <p>ধারাবাহিক ছোট সেট, যেমনটা খাতায় হয়।</p>
            <span className="go">সেট দেখো ›</span>
          </button>
          <button className="tile" onClick={() => setView({ t: "rand", s: id })}>
            <h3>এলোমেলো</h3>
            <p>যতগুলো চাও, নতুন ড্র।</p>
            <span className="go">সংখ্যা ঠিক করো ›</span>
          </button>
          <button className="tile" onClick={() => setView({ t: "prog", s: id })}>
            <h3>অগ্রগতি</h3>
            <p>জানা, সেভ, আর সাম্প্রতিক স্কোর।</p>
            <span className="go">দেখো ›</span>
          </button>
        </div>
      </>
    );
  }

  function learnView(id: string) {
    const total = learnList.length;
    const i = total ? Math.min(learn.i, total - 1) : 0;
    const c = learnList[i];
    const letters = [...new Set((BY[id] || []).map((q) => letterOf(q.h)).filter(Boolean))].sort(
      (a, b) => ALPHA.indexOf(a) - ALPHA.indexOf(b) || a.localeCompare(b),
    );
    return (
      <>
        <h2 className="s">{SUBJ[id]?.name}</h2>
        <div className="row">
          <input
            type="search"
            placeholder="খুঁজো…"
            value={learn.q}
            aria-label="খোঁজ"
            onChange={(e) => setLearn((x) => ({ ...x, q: e.target.value, i: 0, shown: false }))}
          />
        </div>
        <div className="row" style={{ marginTop: 10 }}>
          {(
            [
              ["all", "সব"],
              ["unk", "জানা নয়"],
              ["fav", "সেভ"],
            ] as const
          ).map(([k, t]) => (
            <button key={k} className={`chip ${learn.v === k ? "on" : ""}`} onClick={() => setLearn((x) => ({ ...x, v: k, i: 0, shown: false }))}>
              {t}
            </button>
          ))}
        </div>
        <div className="az">
          {letters.map((x) => (
            <button key={x} className={learn.let === x ? "on" : ""} onClick={() => setLearn((s) => ({ ...s, let: s.let === x ? "" : x, i: 0, shown: false }))}>
              {x}
            </button>
          ))}
        </div>
        {c ? (
          <article className="card">
            <div className="row">
              <span className="badge">{SUBJ[id]?.name}</span>
              <span className="mut" style={{ fontSize: 13 }}>
                প্রশ্ন {c.n}
              </span>
              <span className="sp" />
              <button className={`ico ${has(store.fav, c.id) ? "on" : ""}`} aria-label="সেভ" onClick={() => tog("fav", c.id)}>
                <Star on={has(store.fav, c.id)} />
              </button>
              <button className={`ico ok ${has(store.known, c.id) ? "on" : ""}`} aria-label="জানা" onClick={() => tog("known", c.id)}>
                <Tick />
              </button>
            </div>
            <h2 className="hw">{c.h}</h2>
            {c.q !== c.h ? <p className="stem">{c.q}</p> : <div style={{ height: 8 }} />}
            {learn.rec && !learn.shown ? (
              <button className="ans hid" onClick={() => setLearn((x) => ({ ...x, shown: true }))}>
                উত্তর দেখাও
              </button>
            ) : (
              <>
                <div className="ans">
                  <small>উত্তর · {LETTERS[c.a]}</small>
                  <b>{c.o[c.a]}</b>
                </div>
                <div className="oth">
                  {c.o.map((o, idx) =>
                    idx === c.a ? null : (
                      <span key={idx}>
                        {LETTERS[idx]}. {o}
                      </span>
                    ),
                  )}
                </div>
              </>
            )}
          </article>
        ) : (
          <div className="card">
            <h3>কিছু মেলেনি</h3>
            <p className="mut">অন্য ফিল্টার বা খোঁজ চেষ্টা করো।</p>
          </div>
        )}
        {total ? (
          <>
            <div className="pg">
              <button className="btn" onClick={() => setLearn((x) => ({ ...x, i: (i - 1 + total) % total, shown: false }))}>
                ‹ আগে
              </button>
              <div className="bar">
                <i style={{ width: `${((i + 1) / total) * 100}%` }} />
              </div>
              <button className="btn p" onClick={() => setLearn((x) => ({ ...x, i: (i + 1) % total, shown: false }))}>
                পরে ›
              </button>
            </div>
            <div className="row" style={{ marginTop: 12 }}>
              <span className="mut">
                {i + 1} / {total}
              </span>
              <span className="sp" />
              <button className={`chip ${learn.rec ? "on" : ""}`} onClick={() => setLearn((x) => ({ ...x, rec: !x.rec, shown: false }))}>
                মনে করো
              </button>
              <button
                className="chip"
                onClick={() => {
                  if (dlg.current && !dlg.current.open) dlg.current.showModal();
                }}
              >
                তালিকা
              </button>
            </div>
          </>
        ) : null}
        <dialog ref={dlg}>
          <div className="h">
            <b>{total}টি</b>
            <span className="sp" />
            <button className="ib" aria-label="বন্ধ" onClick={() => dlg.current?.close()}>
              ✕
            </button>
          </div>
          <div className="b">
            {learnList.slice(0, 400).map((x, idx) => (
              <button
                key={x.id}
                className={`li ${idx === i ? "on" : ""}`}
                onClick={() => {
                  setLearn((s) => ({ ...s, i: idx, shown: false }));
                  dlg.current?.close();
                }}
              >
                <b>{x.h}</b>
                <span>{x.o[x.a]}</span>
              </button>
            ))}
            {learnList.length > 400 ? <p className="mut" style={{ padding: 10 }}>প্রথম ৪০০টি। খোঁজ দিয়ে ছোট করো।</p> : null}
          </div>
        </dialog>
      </>
    );
  }

  function setsView(id: string) {
    const list = BY[id] || [];
    const chunks: Q[][] = [];
    for (let i = 0; i < list.length; i += size) chunks.push(list.slice(i, i + size));
    return (
      <>
        <h2 className="s">সেট পরীক্ষা</h2>
        <p className="mut" style={{ marginTop: 0 }}>
          মূল ক্রমে সাজানো। একটা সেট শেষ করলে পরেরটা।
        </p>
        <div className="seg" role="group" aria-label="সেটের আকার">
          {[10, 20, 25].map((n) => (
            <button key={n} className={size === n ? "on" : ""} onClick={() => setSize(n)}>
              {n}
            </button>
          ))}
        </div>
        <p className="mut">
          {list.length} প্রশ্ন · {chunks.length} সেট
        </p>
        <div className="sets">
          {chunks.map((c, i) => {
            const ck = `${id}:${size}:${i}`;
            const best = store.done[ck];
            return (
              <button key={ck} className="set" onClick={() => start(c, `${SUBJ[id]?.name} · সেট ${i + 1}`, id, ck)}>
                <b>সেট {i + 1}</b>
                <span>
                  {c[0]?.h} → {c[c.length - 1]?.h}
                </span>
                <br />
                <span>{c.length} প্রশ্ন</span> {best != null ? <em>সেরা {best}%</em> : null}
              </button>
            );
          })}
        </div>
      </>
    );
  }

  function randView(id: string) {
    const avail = poolOf(id, pool);
    const n = Math.max(1, Math.min(want, avail.length || 1));
    const presets = [10, 20, 30, 50];
    return (
      <>
        <h2 className="s">এলোমেলো পরীক্ষা</h2>
        <p className="mut" style={{ marginTop: 0 }}>
          প্রতিবার নতুন ড্র। {id === "all" ? "সব বিষয় মিলিয়ে।" : SUBJ[id]?.name}
        </p>
        <div className="card" style={{ marginTop: 0 }}>
          <b>কতগুলো প্রশ্ন</b>
          <div className="row" style={{ margin: "10px 0" }}>
            <div className="cnt">
              <button className="ico" aria-label="কমাও" onClick={() => setWant((w) => Math.max(1, w - 1))}>
                −
              </button>
              <input
                type="number"
                min={1}
                max={avail.length || 1}
                value={n}
                onChange={(e) => setWant(Math.max(1, Math.floor(+e.target.value) || 1))}
              />
              <button className="ico" aria-label="বাড়াও" onClick={() => setWant((w) => w + 1)}>
                +
              </button>
            </div>
            {presets.map((p) => (
              <button key={p} className={`chip ${n === p ? "on" : ""}`} disabled={p > avail.length} onClick={() => setWant(p)}>
                {p}
              </button>
            ))}
            <button className={`chip ${n === avail.length ? "on" : ""}`} disabled={!avail.length} onClick={() => setWant(avail.length)}>
              সব {avail.length}
            </button>
          </div>
          <b>কোথা থেকে</b>
          <div className="row" style={{ margin: "10px 0" }}>
            {(
              [
                ["all", "সব"],
                ["unk", "জানা নয়"],
                ["fav", "সেভ"],
                ["mist", "ভুল"],
              ] as const
            ).map(([k, t]) => (
              <button key={k} className={`chip ${pool === k ? "on" : ""}`} onClick={() => setPool(k)}>
                {t}
              </button>
            ))}
          </div>
          <div className="row">
            <span className="mut">{avail.length ? `${avail.length}টি আছে` : "এই বাছাইয়ে প্রশ্ন নেই।"}</span>
            <span className="sp" />
            <button
              className="btn p"
              disabled={!avail.length}
              onClick={() => {
                const c = Math.min(n, avail.length);
                start(shuf(avail).slice(0, c), `${id === "all" ? "মিশ্র" : SUBJ[id]?.name} · ${c}টি`, id);
              }}
            >
              শুরু
            </button>
          </div>
        </div>
      </>
    );
  }

  function progView(id: string) {
    const ids = id === "all" ? null : new Set((BY[id] || []).map((q) => q.id));
    const known = ids ? store.known.filter((x) => ids.has(x)).length : store.known.length;
    const total = ids ? (BY[id] || []).length : QUESTIONS.length;
    const fav = ids ? store.fav.filter((x) => ids.has(x)).length : store.fav.length;
    const mist = ids ? store.mist.filter((x) => ids.has(x)).length : store.mist.length;
    const hist = store.hist.filter((h) => (id === "all" ? true : h.sub === id));
    return (
      <>
        <h2 className="s">{id === "all" ? "সব অগ্রগতি" : "অগ্রগতি"}</h2>
        <div className="stats">
          <div className="stat">
            <b>
              {known}/{total}
            </b>
            <span>জানা</span>
          </div>
          <div className="stat">
            <b>{fav}</b>
            <span>সেভ</span>
          </div>
          <div className="stat">
            <b>{mist}</b>
            <span>দেখতে হবে</span>
          </div>
          <div className="stat">
            <b>{hist.length}</b>
            <span>পরীক্ষা</span>
          </div>
        </div>
        {id === "all" ? (
          <div className="card">
            <b>বিষয় অনুযায়ী</b>
            {SUBJECTS.map((s) => {
              const t = BY[s.id] || [];
              const kn = t.filter((q) => has(store.known, q.id)).length;
              return (
                <div key={s.id} style={{ marginTop: 12 }}>
                  <div className="row">
                    <span>{s.name}</span>
                    <span className="sp" />
                    <span className="mut">
                      {kn}/{t.length}
                    </span>
                  </div>
                  <div className="bar">
                    <i style={{ width: `${t.length ? (kn / t.length) * 100 : 0}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
        <h3 style={{ fontSize: 22, margin: "22px 0 6px" }}>সাম্প্রতিক পরীক্ষা</h3>
        {hist.length ? (
          <div className="card scr" style={{ marginTop: 0 }}>
            <table>
              <thead>
                <tr>
                  <th>তারিখ</th>
                  <th>পরীক্ষা</th>
                  <th>স্কোর</th>
                  <th>সময়</th>
                </tr>
              </thead>
              <tbody>
                {hist.map((h) => (
                  <tr key={h.d + h.title}>
                    <td>{new Date(h.d).toLocaleDateString("bn-BD")}</td>
                    <td>{h.title}</td>
                    <td>
                      <b>
                        {h.s}/{h.t}
                      </b>{" "}
                      ({Math.round((h.s / h.t) * 100)}%)
                    </td>
                    <td>{fmt(h.sec)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mut">এখনো কোনো পরীক্ষা হয়নি।</p>
        )}
        <p style={{ marginTop: 22 }}>
          <button
            className="btn"
            onClick={() => {
              if (!confirm(id === "all" ? "এই ডিভাইসের সব অগ্রগতি মুছে ফেলবে?" : "এই বিষয়ের অগ্রগতি মুছে ফেলবে?")) return;
              if (id === "all") {
                setStore((s) => ({ ...EMPTY, theme: s.theme }));
                return;
              }
              const drop = new Set((BY[id] || []).map((q) => q.id));
              setStore((s) => ({
                ...s,
                known: s.known.filter((x) => !drop.has(x)),
                fav: s.fav.filter((x) => !drop.has(x)),
                mist: s.mist.filter((x) => !drop.has(x)),
                hist: s.hist.filter((h) => h.sub !== id),
                done: Object.fromEntries(Object.entries(s.done).filter(([k]) => !k.startsWith(id + ":"))),
              }));
            }}
          >
            অগ্রগতি মুছো
          </button>
        </p>
      </>
    );
  }

  function quizView() {
    if (!quiz) return <></>;
    const q = quiz.list[quiz.i]!;
    const a = quiz.a[quiz.i];
    const done = a != null;
    const n = quiz.list.length;
    const answered = quiz.a.filter((x) => x != null).length;
    return (
      <>
        <div className="row">
          <button
            className="btn"
            onClick={() => {
              if (!quiz.a.some((x) => x != null) || confirm("পরীক্ষা ছেড়ে যাবে? উত্তর থাকবে না।")) {
                setQuiz(null);
                setView(quiz.sub !== "all" && SUBJ[quiz.sub] ? { t: "hub", s: quiz.sub } : { t: "home" });
              }
            }}
          >
            ✕ বের হও
          </button>
          <b style={{ fontFamily: '"Tiro Bangla", serif', fontSize: 19 }}>{quiz.title}</b>
          <span className="sp" />
          <span className="chip">{fmt(((now - quiz.t0) / 1000) | 0)}</span>
        </div>
        <div className="pg">
          <span className="mut">
            {quiz.i + 1}/{n}
          </span>
          <div className="bar">
            <i style={{ width: `${(answered / n) * 100}%` }} />
          </div>
        </div>
        <div className="card">
          <span className="badge">{SUBJ[q.s]?.name || "মিশ্র"}</span>
          <div className="tq">{q.q}</div>
          {q.o.map((o, i) => (
            <button
              key={i}
              className={`opt ${done ? (i === q.a ? "ok" : i === a ? "no" : "") : ""}`}
              disabled={done}
              onClick={() => pick(i)}
            >
              <span className="k">{LETTERS[i]}</span>
              <span>{o}</span>
            </button>
          ))}
          {done ? (
            <div className={`fb ${a === q.a ? "ok" : "no"}`}>
              {a === q.a ? "ঠিক।" : "হয়নি।"}
              <small>
                উত্তর: {LETTERS[q.a]}. {q.o[q.a]}
              </small>
            </div>
          ) : null}
          <div className="row">
            <button className="btn" disabled={!quiz.i} onClick={() => tgo(-1)}>
              ‹ আগে
            </button>
            <span className="sp" />
            {quiz.i < n - 1 ? (
              <button className={`btn ${done ? "p" : ""}`} onClick={() => tgo(1)}>
                {done ? "পরে" : "এড়িয়ে"} ›
              </button>
            ) : null}
            <button className={`btn ${quiz.i === n - 1 && done ? "p" : ""}`} onClick={finish}>
              শেষ
            </button>
          </div>
        </div>
        {n <= 40 ? (
          <div className="nv">
            {quiz.list.map((x, i) => (
              <button
                key={x.id + i}
                className={`${quiz.a[i] != null ? (quiz.a[i] === x.a ? "c" : "w") : ""} ${i === quiz.i ? "cur" : ""}`}
                onClick={() => setQuiz({ ...quiz, i })}
              >
                {i + 1}
              </button>
            ))}
          </div>
        ) : null}
      </>
    );
  }

  function doneView() {
    if (!quiz) return <></>;
    const n = quiz.list.length;
    const pc = Math.round((quiz.score / n) * 100);
    const rows = quiz.list.map((q, i) => ({ q, i })).filter(({ q, i }) => rf === "all" || quiz.a[i] !== q.a);
    const missed = quiz.list.filter((q, i) => quiz.a[i] !== q.a);
    return (
      <>
        <div className="card" style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: 30 }}>{pc >= 80 ? "দারুণ।" : pc >= 50 ? "মন্দ হয়নি।" : "আরো একটু।"}</h2>
          <div className="row" style={{ justifyContent: "center", margin: "18px 0" }}>
            <div className="ring" style={{ ["--p" as string]: pc }}>
              <div>{pc}%</div>
            </div>
          </div>
          <p className="mut">
            {quiz.score} ঠিক · {n}টির মধ্যে · {missed.length} ভুল বা ফাঁকা · {fmt(quiz.sec)}
          </p>
          <div className="row" style={{ justifyContent: "center", marginTop: 12 }}>
            <button className="btn p" disabled={!missed.length} onClick={() => start(missed, "ভুলগুলো আবার", quiz.sub)}>
              {missed.length}টি আবার
            </button>
            <button
              className="btn"
              onClick={() => {
                const back = quiz.sub;
                setQuiz(null);
                setView(back !== "all" && SUBJ[back] ? { t: "hub", s: back } : { t: "home" });
              }}
            >
              শেষ
            </button>
          </div>
        </div>
        <div className="row" style={{ marginTop: 18 }}>
          <h3 style={{ fontSize: 22 }}>খতিয়ে দেখো</h3>
          <span className="sp" />
          <button className={`chip ${rf === "all" ? "on" : ""}`} onClick={() => setRf("all")}>
            সব
          </button>
          <button className={`chip ${rf === "w" ? "on" : ""}`} onClick={() => setRf("w")}>
            শুধু ভুল
          </button>
        </div>
        {rows.map(({ q, i }) => (
          <div key={q.id + i} className={`rv ${quiz.a[i] === q.a ? "" : "w"}`}>
            <b>
              {i + 1}. {q.q}
            </b>
            <div className="mut">
              ঠিক: <b style={{ color: "var(--ok)" }}>{q.o[q.a]}</b>
              {quiz.a[i] !== q.a ? ` · তুমি: ${quiz.a[i] == null ? "ফাঁকা" : q.o[quiz.a[i] as number]}` : ""}
            </div>
          </div>
        ))}
      </>
    );
  }

  let body = home();
  if (view.t === "hub") body = hub(view.s);
  else if (view.t === "learn") body = learnView(view.s);
  else if (view.t === "sets") body = setsView(view.s);
  else if (view.t === "rand") body = randView(view.s);
  else if (view.t === "prog") body = progView(view.s);
  else if (view.t === "quiz") body = quizView();
  else if (view.t === "done") body = doneView();

  return (
    <>
      {head()}
      <main className="wrap">{body}</main>
      {nav()}
      {toast ? <div className="toast">{toast}</div> : null}
    </>
  );
}
