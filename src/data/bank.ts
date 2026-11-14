import raw from "./questions.json";

export type Q = {
  id: string;
  n: number;
  s: string;
  q: string;
  h: string;
  o: string[];
  a: number;
};

export const QUESTIONS = raw as Q[];

export const SUBJECTS: { id: string; name: string; blurb: string }[] = [
  { id: "syn", name: "সমার্থক শব্দ", blurb: "একই অর্থের শব্দ চেনা।" },
  { id: "ant", name: "বিপরীতার্থক শব্দ", blurb: "উল্টো অর্থের জোড়া।" },
  { id: "term", name: "পারিভাষিক শব্দ", blurb: "ইংরেজির বাংলা পরিভাষা।" },
  { id: "word", name: "গুরুত্বপূর্ণ শব্দ", blurb: "দুর্লভ শব্দের আভিধানিক অর্থ।" },
  { id: "idiom", name: "বাগধারা", blurb: "বাগধারার মানে ও ব্যবহার।" },
  { id: "prov", name: "প্রবাদ-প্রবচন", blurb: "প্রবাদ চেনা ও তার অর্থ।" },
  { id: "brief", name: "বাক্য সংকোচন", blurb: "এককথায় প্রকাশ।" },
  { id: "homo", name: "সমোচ্চারিত শব্দ", blurb: "প্রায় এক উচ্চারণ, ভিন্ন অর্থ।" },
  { id: "trans", name: "অনুবাদ", blurb: "বাক্য ও প্রবাদের অনুবাদ।" },
  { id: "letter", name: "পত্র ও ভাব", blurb: "পত্র, ভাবসম্প্রসারণ, সারাংশ।" },
  { id: "lang", name: "ভাষা ও লিপি", blurb: "বাংলা ভাষার উৎপত্তি ও বিকাশ।" },
];

export const SUBJ = Object.fromEntries(SUBJECTS.map((s) => [s.id, s]));

export const BY: Record<string, Q[]> = {};
for (const q of QUESTIONS) (BY[q.s] ??= []).push(q);

export const LETTERS = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"] as const;
