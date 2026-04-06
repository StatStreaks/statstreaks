import { useState, useEffect, useRef } from "react";

// ── ANALYTICS ─────────────────────────────────────────────────────────────────
function trackEvent(name, params = {}) {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}
const GA = {
  dailyStarted: (theme) => trackEvent('daily_started', { theme }),
  dailyCompleted: (score, theme, yellowUsed, streak) => trackEvent('daily_completed', { score, theme, yellow_card_used: yellowUsed, streak }),
  dailyFailed: (score, theme, cause) => trackEvent('daily_failed', { score, theme, cause }),
  yellowCardShown: (questionIndex, theme) => trackEvent('yellow_card_shown', { question_index: questionIndex, theme }),
  yellowCardWatched: (theme) => trackEvent('yellow_card_ad_watched', { theme }),
  yellowCardDeclined: (theme) => trackEvent('yellow_card_declined', { theme }),
  scoreShared: (score, mode, theme) => trackEvent('score_shared', { score, mode, theme }),
  streakMilestone: (streak) => trackEvent('streak_milestone', { streak }),
  rushStarted: (category) => trackEvent('rush_started', { category }),
  rushCompleted: (score, cleanScore, category) => trackEvent('rush_completed', { score, clean_score: cleanScore, category }),
  rushAdWatched: (category) => trackEvent('rush_ad_watched', { category }),
};
// ── SOUND ENGINE ──────────────────────────────────────────────────────────────
function createSoundEngine() {
  let ctx = null;
  function getCtx() { if(!ctx) ctx=new(window.AudioContext||window.webkitAudioContext)(); return ctx; }
  function tone(freq,type,dur,vol,delay=0){
    try{const ac=getCtx(),o=ac.createOscillator(),g=ac.createGain();o.connect(g);g.connect(ac.destination);o.type=type;o.frequency.setValueAtTime(freq,ac.currentTime+delay);g.gain.setValueAtTime(vol,ac.currentTime+delay);g.gain.exponentialRampToValueAtTime(0.001,ac.currentTime+delay+dur);o.start(ac.currentTime+delay);o.stop(ac.currentTime+delay+dur);}catch(e){}
  }
  return {
    correct(){ tone(440,"sine",0.12,0.3); tone(554,"sine",0.12,0.3,0.1); tone(659,"sine",0.2,0.3,0.2); },
    wrong()  { tone(300,"sawtooth",0.15,0.3); tone(220,"sawtooth",0.25,0.3,0.12); },
    yellow() { tone(440,"sawtooth",0.1,0.3); tone(380,"sawtooth",0.2,0.2,0.1); },
    timeout(){ tone(220,"sawtooth",0.12,0.3); tone(180,"sawtooth",0.2,0.3,0.1); tone(150,"sawtooth",0.3,0.3,0.22); },
    tick()   { tone(880,"sine",0.04,0.08); },
    win()    { [523,659,784,1047,784,1047].forEach((n,i)=>tone(n,"sine",0.18,0.25,i*0.1)); },
    click()  { tone(600,"sine",0.06,0.15); },
    card()   { tone(880,"sine",0.08,0.12); tone(1100,"sine",0.06,0.1,0.05); },
  };
}
const SFX = createSoundEngine();
const TOTAL_TIME = 30;

// ── HELPERS ───────────────────────────────────────────────────────────────────
const LS = k=>"ss_"+k;
// Brand colours
const T = { primary:"#0d9488", primaryDark:"#0f766e", primaryLight:"#14b8a6", primaryGlow:"#0d948844", bg:"#030d0d", bgCard:"#061212", bgDeep:"#040f0f", border:"#0d3030", borderLight:"#0f4040" };
function lsGet(k,fb=null){try{const v=localStorage.getItem(LS(k));return v!==null?JSON.parse(v):fb;}catch{return fb;}}
function lsSet(k,v){try{localStorage.setItem(LS(k),JSON.stringify(v));}catch{}}
function getTodayKey(){const d=new Date();return`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;}
function getDayIndex(){const s=new Date("2025-01-01");return Math.floor((new Date()-s)/86400000)%10;}
const STAT_ICONS={Goals:"⚽",Assists:"🎯","Clean Sheets":"🧤",Appearances:"👟",Trophies:"🏆",Caps:"🌐","Red Cards":"🟥"};

// ── RUSH CATEGORIES (8 categories, 100 cards each) ────────────────────────────
// ── RUSH CATEGORIES — 10 categories, consistent colours by stat type ──────────
// Blue = Goals, Red = Clean Sheets, Purple = Assists, Amber = Caps/Appearances
// Ordered by likely popularity / most played first
// ── RUSH CATEGORIES — 8 categories, ~150 verified cards each ─────────────────
// PL Fundamentals (4): Goals, Assists, Clean Sheets, Appearances
// England Pride (2): Caps, Goals
// Club Rivalries (2): Man Utd vs Liverpool, Real Madrid vs Barcelona
// Colours: Blue=Goals, Cyan=Assists, Red=Clean Sheets, Teal=Appearances, Pink=Caps
const RUSH_CATEGORIES = [
  // ── 1. PL GOALS ────────────────────────────────────────────────────────────
  { id:"pl_goals", label:"PL Goals", icon:"⚽", color:"#3b82f6", globalAvg:5.1, cards:[
    {player:"Alan Shearer",stat:260,statType:"Goals",club:"PL All-Time"},
    {player:"Harry Kane",stat:213,statType:"Goals",club:"PL All-Time"},
    {player:"Wayne Rooney",stat:208,statType:"Goals",club:"PL All-Time"},
    {player:"Andrew Cole",stat:187,statType:"Goals",club:"PL All-Time"},
    {player:"Sergio Agüero",stat:184,statType:"Goals",club:"PL All-Time"},
    {player:"Frank Lampard",stat:177,statType:"Goals",club:"PL All-Time"},
    {player:"Thierry Henry",stat:175,statType:"Goals",club:"PL All-Time"},
    {player:"Robbie Fowler",stat:163,statType:"Goals",club:"PL All-Time"},
    {player:"Son Heung-min",stat:163,statType:"Goals",club:"PL All-Time"},
    {player:"Jermain Defoe",stat:162,statType:"Goals",club:"PL All-Time"},
    {player:"Jamie Vardy",stat:168,statType:"Goals",club:"PL All-Time"},
    {player:"Raheem Sterling",stat:131,statType:"Goals",club:"PL All-Time"},
    {player:"Marcus Rashford",stat:138,statType:"Goals",club:"PL All-Time"},
    {player:"Sadio Mané",stat:120,statType:"Goals",club:"PL All-Time"},
    {player:"Nicolas Anelka",stat:125,statType:"Goals",club:"PL All-Time"},
    {player:"Jimmy Floyd Hasselbaink",stat:127,statType:"Goals",club:"PL All-Time"},
    {player:"Michael Owen",stat:150,statType:"Goals",club:"PL All-Time"},
    {player:"Les Ferdinand",stat:149,statType:"Goals",club:"PL All-Time"},
    {player:"Teddy Sheringham",stat:146,statType:"Goals",club:"PL All-Time"},
    {player:"Romelu Lukaku",stat:113,statType:"Goals",club:"PL All-Time"},
    {player:"Roberto Firmino",stat:111,statType:"Goals",club:"PL All-Time"},
    {player:"Emile Heskey",stat:110,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin Phillips",stat:113,statType:"Goals",club:"PL All-Time"},
    {player:"Erling Haaland",stat:102,statType:"Goals",club:"PL All-Time"},
    {player:"Didier Drogba",stat:104,statType:"Goals",club:"PL All-Time"},
    {player:"Paul Scholes",stat:107,statType:"Goals",club:"PL All-Time"},
    {player:"Peter Crouch",stat:108,statType:"Goals",club:"PL All-Time"},
    {player:"Dion Dublin",stat:111,statType:"Goals",club:"PL All-Time"},
    {player:"Ian Wright",stat:113,statType:"Goals",club:"PL All-Time"},
    {player:"Matt Le Tissier",stat:100,statType:"Goals",club:"PL All-Time"},
    {player:"Darren Bent",stat:106,statType:"Goals",club:"PL All-Time"},
    {player:"Robin van Persie",stat:96,statType:"Goals",club:"PL All-Time"},
    {player:"Dimitar Berbatov",stat:94,statType:"Goals",club:"PL All-Time"},
    {player:"Ruud van Nistelrooy",stat:95,statType:"Goals",club:"PL All-Time"},
    {player:"Craig Bellamy",stat:97,statType:"Goals",club:"PL All-Time"},
    {player:"Emmanuel Adebayor",stat:97,statType:"Goals",club:"PL All-Time"},
    {player:"Dwight Yorke",stat:123,statType:"Goals",club:"PL All-Time"},
    {player:"Mo Salah",stat:213,statType:"Goals",club:"PL All-Time"},
    {player:"Cristiano Ronaldo",stat:84,statType:"Goals",club:"PL All-Time"},
    {player:"Carlos Tevez",stat:83,statType:"Goals",club:"PL All-Time"},
    {player:"Dennis Bergkamp",stat:87,statType:"Goals",club:"PL All-Time"},
    {player:"Ole Gunnar Solskjaer",stat:91,statType:"Goals",club:"PL All-Time"},
    {player:"Bruno Fernandes",stat:91,statType:"Goals",club:"PL All-Time"},
    {player:"John Hartson",stat:83,statType:"Goals",club:"PL All-Time"},
    {player:"Chris Sutton",stat:84,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin Davies",stat:85,statType:"Goals",club:"PL All-Time"},
    {player:"Mark Viduka",stat:81,statType:"Goals",club:"PL All-Time"},
    {player:"Louis Saha",stat:75,statType:"Goals",club:"PL All-Time"},
    {player:"Phil Foden",stat:74,statType:"Goals",club:"PL All-Time"},
    {player:"Gabriel Agbonlahor",stat:74,statType:"Goals",club:"PL All-Time"},
    {player:"Frederic Kanoute",stat:74,statType:"Goals",club:"PL All-Time"},
    {player:"Bukayo Saka",stat:63,statType:"Goals",club:"PL All-Time"},
    {player:"Gabriel Jesus",stat:58,statType:"Goals",club:"PL All-Time"},
    {player:"Eric Cantona",stat:70,statType:"Goals",club:"PL All-Time"},
    {player:"Mark Hughes",stat:61,statType:"Goals",club:"PL All-Time"},
    {player:"Tony Cottee",stat:77,statType:"Goals",club:"PL All-Time"},
    {player:"Gianfranco Zola",stat:59,statType:"Goals",club:"PL All-Time"},
    {player:"Niall Quinn",stat:59,statType:"Goals",club:"PL All-Time"},
    {player:"Stan Collymore",stat:50,statType:"Goals",club:"PL All-Time"},
    {player:"Dean Holdsworth",stat:57,statType:"Goals",club:"PL All-Time"},
    {player:"Riyad Mahrez",stat:71,statType:"Goals",club:"PL All-Time"},
    {player:"Jack Grealish",stat:40,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin De Bruyne",stat:78,statType:"Goals",club:"PL All-Time"},
    {player:"David Silva",stat:77,statType:"Goals",club:"PL All-Time"},
    {player:"Eden Hazard",stat:110,statType:"Goals",club:"PL All-Time"},
    {player:"Robbie Keane",stat:90,statType:"Goals",club:"PL All-Time"},
    {player:"Yakubu Aiyegbeni",stat:95,statType:"Goals",club:"PL All-Time"},
    {player:"Olivier Giroud",stat:48,statType:"Goals",club:"PL All-Time"},
    {player:"Danny Ings",stat:107,statType:"Goals",club:"PL All-Time"},
    {player:"Tammy Abraham",stat:47,statType:"Goals",club:"PL All-Time"},
    {player:"Dominic Calvert-Lewin",stat:68,statType:"Goals",club:"PL All-Time"},
    {player:"Troy Deeney",stat:83,statType:"Goals",club:"PL All-Time"},
    {player:"Glenn Murray",stat:68,statType:"Goals",club:"PL All-Time"},
    {player:"Charlie Austin",stat:68,statType:"Goals",club:"PL All-Time"},
    {player:"Ivan Toney",stat:45,statType:"Goals",club:"PL All-Time"},
    {player:"Chris Wood",stat:53,statType:"Goals",club:"PL All-Time"},
    {player:"Callum Wilson",stat:70,statType:"Goals",club:"PL All-Time"},
    {player:"Ollie Watkins",stat:65,statType:"Goals",club:"PL All-Time"},
    {player:"Jarrod Bowen",stat:42,statType:"Goals",club:"PL All-Time"},
    {player:"Michail Antonio",stat:55,statType:"Goals",club:"PL All-Time"},
    {player:"Ashley Young",stat:68,statType:"Goals",club:"PL All-Time"},
    {player:"James Milner",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"Gareth Bale",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"Aaron Lennon",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Dele Alli",stat:67,statType:"Goals",club:"PL All-Time"},
    {player:"Christian Eriksen",stat:69,statType:"Goals",club:"PL All-Time"},
    {player:"Robert Pires",stat:84,statType:"Goals",club:"PL All-Time"},
    {player:"Sylvain Wiltord",stat:42,statType:"Goals",club:"PL All-Time"},
    {player:"Marc Overmars",stat:41,statType:"Goals",club:"PL All-Time"},
    {player:"Eidur Gudjohnsen",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"Nick Barmby",stat:38,statType:"Goals",club:"PL All-Time"},
    {player:"Bobby Zamora",stat:49,statType:"Goals",club:"PL All-Time"},
    {player:"Carlton Cole",stat:50,statType:"Goals",club:"PL All-Time"},
    {player:"Shola Ameobi",stat:48,statType:"Goals",club:"PL All-Time"},
    {player:"Nolberto Solano",stat:37,statType:"Goals",club:"PL All-Time"},
    {player:"Rob Lee",stat:44,statType:"Goals",club:"PL All-Time"},
    {player:"Freddie Ljungberg",stat:72,statType:"Goals",club:"PL All-Time"},
    {player:"Lee Bowyer",stat:32,statType:"Goals",club:"PL All-Time"},
    {player:"Shaun Wright-Phillips",stat:59,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin Campbell",stat:59,statType:"Goals",club:"PL All-Time"},
    {player:"Don Hutchison",stat:36,statType:"Goals",club:"PL All-Time"},
    {player:"Paul Dickov",stat:32,statType:"Goals",club:"PL All-Time"},
    {player:"Georgi Kinkladze",stat:14,statType:"Goals",club:"PL All-Time"},
    {player:"Duncan Ferguson",stat:72,statType:"Goals",club:"PL All-Time"},
    {player:"Michael Bridges",stat:14,statType:"Goals",club:"PL All-Time"},
    {player:"Stewart Downing",stat:27,statType:"Goals",club:"PL All-Time"},
    {player:"Adam Johnson",stat:30,statType:"Goals",club:"PL All-Time"},
    {player:"Andros Townsend",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Theo Walcott",stat:69,statType:"Goals",club:"PL All-Time"},
    {player:"Alex Oxlade-Chamberlain",stat:27,statType:"Goals",club:"PL All-Time"},
    {player:"Ross Barkley",stat:38,statType:"Goals",club:"PL All-Time"},
    {player:"Daniel Sturridge",stat:67,statType:"Goals",club:"PL All-Time"},
    {player:"Rickie Lambert",stat:55,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin Nolan",stat:49,statType:"Goals",club:"PL All-Time"},
    {player:"Martin Keown",stat:8,statType:"Goals",club:"PL All-Time"},
    {player:"John Terry",stat:41,statType:"Goals",club:"PL All-Time"},
    {player:"Virgil van Dijk",stat:28,statType:"Goals",club:"PL All-Time"},
    {player:"Rio Ferdinand",stat:11,statType:"Goals",club:"PL All-Time"},
    {player:"Sol Campbell",stat:11,statType:"Goals",club:"PL All-Time"},
    {player:"Tony Adams",stat:12,statType:"Goals",club:"PL All-Time"},
    {player:"Stuart Pearce",stat:11,statType:"Goals",club:"PL All-Time"},
    {player:"Steve Bruce",stat:19,statType:"Goals",club:"PL All-Time"},
    {player:"Gary Pallister",stat:13,statType:"Goals",club:"PL All-Time"},
    {player:"Leighton Baines",stat:22,statType:"Goals",club:"PL All-Time"},
    {player:"Phil Jagielka",stat:11,statType:"Goals",club:"PL All-Time"},
    {player:"Richard Dunne",stat:9,statType:"Goals",club:"PL All-Time"},
    {player:"Leon Osman",stat:45,statType:"Goals",club:"PL All-Time"},
    {player:"Mikel Arteta",stat:24,statType:"Goals",club:"PL All-Time"},
    {player:"Marouane Fellaini",stat:40,statType:"Goals",club:"PL All-Time"},
    {player:"Sejamus Coleman",stat:25,statType:"Goals",club:"PL All-Time"},
    {player:"Steven Pienaar",stat:18,statType:"Goals",club:"PL All-Time"},
    {player:"Jordan Henderson",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Diogo Jota",stat:48,statType:"Goals",club:"PL All-Time"},
    {player:"Gabriel Martinelli",stat:41,statType:"Goals",club:"PL All-Time"},
    {player:"Emile Smith Rowe",stat:22,statType:"Goals",club:"PL All-Time"},
    {player:"Kai Havertz",stat:31,statType:"Goals",club:"PL All-Time"},
    {player:"Mason Mount",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Anthony Martial",stat:79,statType:"Goals",club:"PL All-Time"},
    {player:"Paul Pogba",stat:39,statType:"Goals",club:"PL All-Time"},
    {player:"Jesse Lingard",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Juan Mata",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Zlatan Ibrahimovic",stat:29,statType:"Goals",club:"PL All-Time"},
    {player:"Ryan Giggs",stat:109,statType:"Goals",club:"PL All-Time"},
    {player:"Denis Irwin",stat:23,statType:"Goals",club:"PL All-Time"},
    {player:"Lee Dixon",stat:21,statType:"Goals",club:"PL All-Time"},
    {player:"Nigel Winterburn",stat:11,statType:"Goals",club:"PL All-Time"},
    {player:"Paulo Wanchope",stat:28,statType:"Goals",club:"PL All-Time"},
    {player:"Shaun Goater",stat:103,statType:"Goals",club:"PL All-Time"},
    {player:"Ilkay Gundogan",stat:47,statType:"Goals",club:"PL All-Time"},
    {player:"Bernardo Silva",stat:41,statType:"Goals",club:"PL All-Time"},
    {player:"Rodri",stat:22,statType:"Goals",club:"PL All-Time"},
    {player:"Trent Alexander-Arnold",stat:18,statType:"Goals",club:"PL All-Time"},
    {player:"Joe Cole",stat:44,statType:"Goals",club:"PL All-Time"},
  ]},

  // ── 2. PL ASSISTS ──────────────────────────────────────────────────────────
  { id:"pl_assists", label:"PL Assists", icon:"🎯", color:"#06b6d4", globalAvg:4.9, cards:[
    {player:"Ryan Giggs",stat:162,statType:"Assists",club:"PL All-Time"},
    {player:"Cesc Fabregas",stat:111,statType:"Assists",club:"PL All-Time"},
    {player:"Kevin De Bruyne",stat:105,statType:"Assists",club:"PL All-Time"},
    {player:"Wayne Rooney",stat:103,statType:"Assists",club:"PL All-Time"},
    {player:"Frank Lampard",stat:102,statType:"Assists",club:"PL All-Time"},
    {player:"Steven Gerrard",stat:95,statType:"Assists",club:"PL All-Time"},
    {player:"Dennis Bergkamp",stat:94,statType:"Assists",club:"PL All-Time"},
    {player:"David Silva",stat:93,statType:"Assists",club:"PL All-Time"},
    {player:"Trent Alexander-Arnold",stat:92,statType:"Assists",club:"PL All-Time"},
    {player:"Mo Salah",stat:99,statType:"Assists",club:"PL All-Time"},
    {player:"Eden Hazard",stat:85,statType:"Assists",club:"PL All-Time"},
    {player:"Raheem Sterling",stat:84,statType:"Assists",club:"PL All-Time"},
    {player:"David Beckham",stat:80,statType:"Assists",club:"PL All-Time"},
    {player:"Roberto Firmino",stat:77,statType:"Assists",club:"PL All-Time"},
    {player:"Mesut Ozil",stat:77,statType:"Assists",club:"PL All-Time"},
    {player:"Robert Pires",stat:75,statType:"Assists",club:"PL All-Time"},
    {player:"Teddy Sheringham",stat:76,statType:"Assists",club:"PL All-Time"},
    {player:"Alan Shearer",stat:69,statType:"Assists",club:"PL All-Time"},
    {player:"Christian Eriksen",stat:69,statType:"Assists",club:"PL All-Time"},
    {player:"Bruno Fernandes",stat:67,statType:"Assists",club:"PL All-Time"},
    {player:"James Milner",stat:66,statType:"Assists",club:"PL All-Time"},
    {player:"Son Heung-min",stat:66,statType:"Assists",club:"PL All-Time"},
    {player:"Harry Kane",stat:66,statType:"Assists",club:"PL All-Time"},
    {player:"Marcus Rashford",stat:62,statType:"Assists",club:"PL All-Time"},
    {player:"Andrew Robertson",stat:62,statType:"Assists",club:"PL All-Time"},
    {player:"Sadio Mane",stat:60,statType:"Assists",club:"PL All-Time"},
    {player:"Robbie Fowler",stat:60,statType:"Assists",club:"PL All-Time"},
    {player:"Riyad Mahrez",stat:58,statType:"Assists",club:"PL All-Time"},
    {player:"Dela Alli",stat:51,statType:"Assists",club:"PL All-Time"},
    {player:"Matt Le Tissier",stat:51,statType:"Assists",club:"PL All-Time"},
    {player:"Bukayo Saka",stat:53,statType:"Assists",club:"PL All-Time"},
    {player:"Willian",stat:52,statType:"Assists",club:"PL All-Time"},
    {player:"Robbie Keane",stat:45,statType:"Assists",club:"PL All-Time"},
    {player:"Dimitar Berbatov",stat:45,statType:"Assists",club:"PL All-Time"},
    {player:"Sergio Aguero",stat:45,statType:"Assists",club:"PL All-Time"},
    {player:"Paul Scholes",stat:55,statType:"Assists",club:"PL All-Time"},
    {player:"Ashley Young",stat:57,statType:"Assists",club:"PL All-Time"},
    {player:"Gareth Bale",stat:39,statType:"Assists",club:"PL All-Time"},
    {player:"Joe Cole",stat:49,statType:"Assists",club:"PL All-Time"},
    {player:"Nicolas Anelka",stat:49,statType:"Assists",club:"PL All-Time"},
    {player:"Darren Anderton",stat:47,statType:"Assists",club:"PL All-Time"},
    {player:"Bernardo Silva",stat:47,statType:"Assists",club:"PL All-Time"},
    {player:"Phil Foden",stat:44,statType:"Assists",club:"PL All-Time"},
    {player:"Dwight Yorke",stat:44,statType:"Assists",club:"PL All-Time"},
    {player:"Craig Bellamy",stat:44,statType:"Assists",club:"PL All-Time"},
    {player:"Jordan Henderson",stat:42,statType:"Assists",club:"PL All-Time"},
    {player:"Michael Carrick",stat:42,statType:"Assists",club:"PL All-Time"},
    {player:"Ilkay Gundogan",stat:41,statType:"Assists",club:"PL All-Time"},
    {player:"Jack Grealish",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Santi Cazorla",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Erik Lamela",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Paul Pogba",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Alexis Sanchez",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Oscar",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Stewart Downing",stat:31,statType:"Assists",club:"PL All-Time"},
    {player:"Freddie Ljungberg",stat:32,statType:"Assists",club:"PL All-Time"},
    {player:"Ian Wright",stat:32,statType:"Assists",club:"PL All-Time"},
    {player:"Georginio Wijnaldum",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Kyle Walker",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Joao Cancelo",stat:28,statType:"Assists",club:"PL All-Time"},
    {player:"Denis Irwin",stat:28,statType:"Assists",club:"PL All-Time"},
    {player:"Rob Lee",stat:28,statType:"Assists",club:"PL All-Time"},
    {player:"Gabriel Martinelli",stat:27,statType:"Assists",club:"PL All-Time"},
    {player:"Alex Oxlade-Chamberlain",stat:24,statType:"Assists",club:"PL All-Time"},
    {player:"Nwankwo Kanu",stat:23,statType:"Assists",club:"PL All-Time"},
    {player:"Andy Cole",stat:71,statType:"Assists",club:"PL All-Time"},
    {player:"Pedro",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Rodri",stat:18,statType:"Assists",club:"PL All-Time"},
    {player:"Erling Haaland",stat:12,statType:"Assists",club:"PL All-Time"},
    {player:"Virgil van Dijk",stat:14,statType:"Assists",club:"PL All-Time"},
    {player:"Emile Smith Rowe",stat:14,statType:"Assists",club:"PL All-Time"},
    {player:"Xherdan Shaqiri",stat:18,statType:"Assists",club:"PL All-Time"},
    {player:"Danny Murphy",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Kieron Dyer",stat:18,statType:"Assists",club:"PL All-Time"},
    {player:"Scott Parker",stat:12,statType:"Assists",club:"PL All-Time"},
    {player:"Claude Makelele",stat:9,statType:"Assists",club:"PL All-Time"},
    {player:"William Gallas",stat:10,statType:"Assists",club:"PL All-Time"},
    {player:"Eidur Gudjohnsen",stat:40,statType:"Assists",club:"PL All-Time"},
    {player:"John Terry",stat:15,statType:"Assists",club:"PL All-Time"},
    {player:"Phil Neville",stat:13,statType:"Assists",club:"PL All-Time"},
    {player:"Gary Neville",stat:20,statType:"Assists",club:"PL All-Time"},
    {player:"Roy Keane",stat:20,statType:"Assists",club:"PL All-Time"},
    {player:"Patrick Vieira",stat:21,statType:"Assists",club:"PL All-Time"},
    {player:"Lee Dixon",stat:18,statType:"Assists",club:"PL All-Time"},
    {player:"Stuart Ripley",stat:26,statType:"Assists",club:"PL All-Time"},
    {player:"Nick Barmby",stat:19,statType:"Assists",club:"PL All-Time"},
    {player:"Stan Collymore",stat:24,statType:"Assists",club:"PL All-Time"},
    {player:"Darren Huckerby",stat:21,statType:"Assists",club:"PL All-Time"},
    {player:"Emile Heskey",stat:32,statType:"Assists",club:"PL All-Time"},
    {player:"Les Ferdinand",stat:39,statType:"Assists",club:"PL All-Time"},
    {player:"Kevin Phillips",stat:30,statType:"Assists",club:"PL All-Time"},
    {player:"Dion Dublin",stat:28,statType:"Assists",club:"PL All-Time"},
    {player:"Jimmy Floyd Hasselbaink",stat:35,statType:"Assists",club:"PL All-Time"},
    {player:"Mark Viduka",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Aaron Lennon",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Tom Huddlestone",stat:21,statType:"Assists",club:"PL All-Time"},
    {player:"Luka Modric",stat:30,statType:"Assists",club:"PL All-Time"},
    {player:"Nani",stat:35,statType:"Assists",club:"PL All-Time"},
    {player:"Antonio Valencia",stat:28,statType:"Assists",club:"PL All-Time"},
    {player:"Patrice Evra",stat:17,statType:"Assists",club:"PL All-Time"},
    {player:"Moussa Sissoko",stat:20,statType:"Assists",club:"PL All-Time"},
    {player:"Ayoze Perez",stat:25,statType:"Assists",club:"PL All-Time"},
    {player:"Andros Townsend",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Pablo Fornals",stat:25,statType:"Assists",club:"PL All-Time"},
    {player:"Manuel Lanzini",stat:27,statType:"Assists",club:"PL All-Time"},
    {player:"Declan Rice",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Mark Noble",stat:42,statType:"Assists",club:"PL All-Time"},
    {player:"Ross Barkley",stat:31,statType:"Assists",club:"PL All-Time"},
    {player:"Andros Townsend x2",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Steven Pienaar",stat:20,statType:"Assists",club:"PL All-Time"},
    {player:"Leighton Baines",stat:27,statType:"Assists",club:"PL All-Time"},
    {player:"Seamus Coleman",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Leon Osman",stat:29,statType:"Assists",club:"PL All-Time"},
    {player:"Tim Cahill",stat:13,statType:"Assists",club:"PL All-Time"},
    {player:"Marouane Fellaini",stat:21,statType:"Assists",club:"PL All-Time"},
    {player:"Phil Jagielka",stat:6,statType:"Assists",club:"PL All-Time"},
    {player:"David Weir",stat:5,statType:"Assists",club:"PL All-Time"},
    {player:"Kevin Kilbane",stat:16,statType:"Assists",club:"PL All-Time"},
    {player:"Thomas Gravesen",stat:11,statType:"Assists",club:"PL All-Time"},
    {player:"Peter Beardsley",stat:32,statType:"Assists",club:"PL All-Time"},
    {player:"Lee Hendrie",stat:8,statType:"Assists",club:"PL All-Time"},
    {player:"Matt Jarvis",stat:21,statType:"Assists",club:"PL All-Time"},
    {player:"Victor Moses",stat:10,statType:"Assists",club:"PL All-Time"},
    {player:"Carlton Cole",stat:8,statType:"Assists",club:"PL All-Time"},
    {player:"Freddie Sears",stat:2,statType:"Assists",club:"PL All-Time"},
    {player:"Luis Boa Morte",stat:10,statType:"Assists",club:"PL All-Time"},
    {player:"Jarrod Bowen",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Ivan Toney",stat:19,statType:"Assists",club:"PL All-Time"},
    {player:"Said Benrahma",stat:24,statType:"Assists",club:"PL All-Time"},
    {player:"Michail Antonio",stat:32,statType:"Assists",club:"PL All-Time"},
    {player:"Naby Keita",stat:12,statType:"Assists",club:"PL All-Time"},
    {player:"Diogo Jota",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Theo Walcott",stat:42,statType:"Assists",club:"PL All-Time"},
    {player:"Adam Lallana",stat:28,statType:"Assists",club:"PL All-Time"},
    {player:"Daniel Sturridge",stat:35,statType:"Assists",club:"PL All-Time"},
    {player:"Jonjo Shelvey",stat:22,statType:"Assists",club:"PL All-Time"},
    {player:"Charlie Adam",stat:15,statType:"Assists",club:"PL All-Time"},
    {player:"Joe Allen",stat:10,statType:"Assists",club:"PL All-Time"},
    {player:"Stewart Downing",stat:31,statType:"Assists",club:"PL All-Time"},
    {player:"Andy Carroll",stat:8,statType:"Assists",club:"PL All-Time"},
    {player:"Conor Coady",stat:5,statType:"Assists",club:"PL All-Time"},
    {player:"Ruben Neves",stat:14,statType:"Assists",club:"PL All-Time"},
    {player:"Adama Traore",stat:18,statType:"Assists",club:"PL All-Time"},
    {player:"Raul Jimenez",stat:25,statType:"Assists",club:"PL All-Time"},
    {player:"Joao Moutinho",stat:20,statType:"Assists",club:"PL All-Time"},
    {player:"Leander Dendoncker",stat:5,statType:"Assists",club:"PL All-Time"},
    {player:"Willy Boly",stat:3,statType:"Assists",club:"PL All-Time"},
    {player:"Romain Saiss",stat:7,statType:"Assists",club:"PL All-Time"},
  ]},

  // ── 3. PL CLEAN SHEETS ─────────────────────────────────────────────────────
  { id:"pl_cleansheets", label:"PL Clean Sheets", icon:"🧤", color:"#ef4444", globalAvg:4.7, cards:[
    {player:"Petr Cech",stat:202,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"David James",stat:169,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Brad Friedel",stat:132,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Edwin van der Sar",stat:141,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"David de Gea",stat:140,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Shay Given",stat:134,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Hugo Lloris",stat:130,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Peter Schmeichel",stat:128,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Joe Hart",stat:125,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Thibaut Courtois",stat:113,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Alisson Becker",stat:107,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Mark Schwarzer",stat:107,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Paul Robinson",stat:108,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Kasper Schmeichel",stat:104,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Tim Howard",stat:98,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jordan Pickford",stat:92,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Nigel Martyn",stat:90,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jose Reina",stat:82,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Nick Pope",stat:78,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Rob Green",stat:78,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Edouard Mendy",stat:73,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Neville Southall",stat:70,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Lukasz Fabianski",stat:75,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Emiliano Martinez",stat:56,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Fraser Forster",stat:56,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Ben Foster",stat:60,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Tim Krul",stat:52,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Ian Walker",stat:52,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Scott Carson",stat:66,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jussi Jaaskelainen",stat:66,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Bernd Leno",stat:49,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Tom Heaton",stat:49,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Chris Kirkland",stat:40,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Vicente Guaita",stat:40,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Thomas Sorensen",stat:40,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Asmir Begovic",stat:44,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Aaron Ramsdale",stat:38,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Shaka Hislop",stat:38,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Alex McCarthy",stat:39,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Sam Johnstone",stat:33,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Carlo Cudicini",stat:33,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Wayne Hennessey",stat:28,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Martin Dubravka",stat:29,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jose Sa",stat:28,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jerzy Dudek",stat:28,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Mathew Ryan",stat:31,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Fabien Barthez",stat:31,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Mark Bosnich",stat:28,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Julian Speroni",stat:45,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Neil Sullivan",stat:25,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Richard Wright",stat:23,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Roy Carroll",stat:22,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Tony Coton",stat:22,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Kevin Pressman",stat:22,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Hans Segers",stat:22,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Michel Vorm",stat:27,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Mike Pollitt",stat:14,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"John Lukic",stat:22,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Andy Goram",stat:12,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Karl Darlow",stat:17,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Sander Westerveld",stat:22,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Maik Taylor",stat:21,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Dean Kiely",stat:31,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Stuart Taylor",stat:7,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Raimond van der Gouw",stat:10,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Nicky Weaver",stat:19,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Kelvin Davis",stat:12,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Mark Crossley",stat:10,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Artur Boruc",stat:26,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Adam Federici",stat:17,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Paulo Gazzaniga",stat:14,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Lee Grant",stat:14,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Boaz Myhill",stat:19,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Ben Foster WBA",stat:29,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Marcus Hahnemann",stat:22,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Claudio Bravo",stat:7,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Willy Caballero",stat:8,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Adrian",stat:13,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Orjan Nyland",stat:3,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jonas Lossl",stat:11,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Danny Ward",stat:9,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Joel Robles",stat:10,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Magnus Hedman",stat:15,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Dmitri Kharine",stat:15,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Tim Flowers",stat:26,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Alan Kelly",stat:20,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Marcus Bettinelli",stat:10,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Mart Poom",stat:11,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Simon Tracey",stat:6,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Gavin Ward",stat:4,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Matt Murray",stat:11,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Scott Loach",stat:8,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Erik Thorstvedt",stat:12,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Nico Vaesen",stat:8,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jan Stejskal",stat:5,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Eldin Jakupovic",stat:11,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Andy Lonergan",stat:8,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Ben Hamer",stat:9,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Angus Gunn",stat:7,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Ralf Fahrmann",stat:3,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Lovre Kalinic",stat:2,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Dave Beasant",stat:18,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Chris Woods",stat:18,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Phil Parkes",stat:3,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Craig Forrest",stat:16,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Ludek Miklosko",stat:14,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Kevin Hitchcock",stat:4,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Andy Dibble",stat:5,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Ian Feuer",stat:3,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Joe Corrigan",stat:4,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jonathan Gould",stat:6,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Steve Ogrizovic",stat:6,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Tony Warner",stat:6,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Mike Hooper",stat:3,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"John Filan",stat:12,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Neil Sullivan",stat:25,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Dimi Konstantopoulos",stat:5,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Robert Green",stat:78,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Stefan Wessels",stat:0,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Thomas Myhre",stat:6,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Espen Baardsen",stat:4,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jurgen Sommer",stat:3,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jim Leighton",stat:2,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jed Steer",stat:1,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jak Alnwick",stat:1,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Rab Douglas",stat:3,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Stefan Freyr Danielsson",stat:0,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Jimmy Glass",stat:1,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Frank Talia",stat:5,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Paul Jones",stat:20,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Andy Petterson",stat:3,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Chris Day",stat:2,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Neil Cutler",stat:1,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Bradford Walsh",stat:1,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Richard Hartis",stat:1,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Ryan Allsop",stat:2,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"Scott Flinders",stat:1,statType:"Clean Sheets",club:"PL All-Time"},
    {player:"David Button",stat:8,statType:"Clean Sheets",club:"PL All-Time"},
  ]},

  // ── 4. PL APPEARANCES ──────────────────────────────────────────────────────
  { id:"pl_appearances", label:"PL Appearances", icon:"👟", color:"#14b8a6", globalAvg:4.3, cards:[
    {player:"Gareth Barry",stat:653,statType:"Appearances",club:"PL All-Time"},
    {player:"Ryan Giggs",stat:632,statType:"Appearances",club:"PL All-Time"},
    {player:"James Milner",stat:657,statType:"Appearances",club:"PL All-Time"},
    {player:"Frank Lampard",stat:609,statType:"Appearances",club:"PL All-Time"},
    {player:"David James",stat:572,statType:"Appearances",club:"PL All-Time"},
    {player:"Gary Speed",stat:535,statType:"Appearances",club:"PL All-Time"},
    {player:"Emile Heskey",stat:516,statType:"Appearances",club:"PL All-Time"},
    {player:"Mark Schwarzer",stat:514,statType:"Appearances",club:"PL All-Time"},
    {player:"Wayne Rooney",stat:491,statType:"Appearances",club:"PL All-Time"},
    {player:"Phil Neville",stat:505,statType:"Appearances",club:"PL All-Time"},
    {player:"Steven Gerrard",stat:504,statType:"Appearances",club:"PL All-Time"},
    {player:"John Terry",stat:492,statType:"Appearances",club:"PL All-Time"},
    {player:"Shay Given",stat:477,statType:"Appearances",club:"PL All-Time"},
    {player:"Alan Shearer",stat:441,statType:"Appearances",club:"PL All-Time"},
    {player:"Kevin Davies",stat:445,statType:"Appearances",club:"PL All-Time"},
    {player:"Andrew Cole",stat:414,statType:"Appearances",club:"PL All-Time"},
    {player:"Tim Howard",stat:398,statType:"Appearances",club:"PL All-Time"},
    {player:"Jermain Defoe",stat:496,statType:"Appearances",club:"PL All-Time"},
    {player:"Brad Friedel",stat:450,statType:"Appearances",club:"PL All-Time"},
    {player:"Sol Campbell",stat:405,statType:"Appearances",club:"PL All-Time"},
    {player:"Rio Ferdinand",stat:401,statType:"Appearances",club:"PL All-Time"},
    {player:"Teddy Sheringham",stat:418,statType:"Appearances",club:"PL All-Time"},
    {player:"Michael Owen",stat:326,statType:"Appearances",club:"PL All-Time"},
    {player:"Robbie Fowler",stat:379,statType:"Appearances",club:"PL All-Time"},
    {player:"Paul Scholes",stat:499,statType:"Appearances",club:"PL All-Time"},
    {player:"Gary Neville",stat:400,statType:"Appearances",club:"PL All-Time"},
    {player:"Ashley Cole",stat:385,statType:"Appearances",club:"PL All-Time"},
    {player:"Michael Carrick",stat:464,statType:"Appearances",club:"PL All-Time"},
    {player:"Petr Cech",stat:443,statType:"Appearances",club:"PL All-Time"},
    {player:"Les Ferdinand",stat:384,statType:"Appearances",club:"PL All-Time"},
    {player:"Peter Schmeichel",stat:310,statType:"Appearances",club:"PL All-Time"},
    {player:"Nigel Martyn",stat:372,statType:"Appearances",club:"PL All-Time"},
    {player:"Tony Adams",stat:255,statType:"Appearances",club:"PL All-Time"},
    {player:"Lee Dixon",stat:264,statType:"Appearances",club:"PL All-Time"},
    {player:"Steve McManaman",stat:272,statType:"Appearances",club:"PL All-Time"},
    {player:"Dennis Bergkamp",stat:315,statType:"Appearances",club:"PL All-Time"},
    {player:"Thierry Henry",stat:258,statType:"Appearances",club:"PL All-Time"},
    {player:"Patrick Vieira",stat:307,statType:"Appearances",club:"PL All-Time"},
    {player:"Robert Pires",stat:234,statType:"Appearances",club:"PL All-Time"},
    {player:"Freddie Ljungberg",stat:266,statType:"Appearances",club:"PL All-Time"},
    {player:"Darren Anderton",stat:299,statType:"Appearances",club:"PL All-Time"},
    {player:"Steve Bould",stat:155,statType:"Appearances",club:"PL All-Time"},
    {player:"Nigel Winterburn",stat:333,statType:"Appearances",club:"PL All-Time"},
    {player:"Ian Wright",stat:288,statType:"Appearances",club:"PL All-Time"},
    {player:"Martin Keown",stat:302,statType:"Appearances",club:"PL All-Time"},
    {player:"Dwight Yorke",stat:375,statType:"Appearances",club:"PL All-Time"},
    {player:"Denis Irwin",stat:368,statType:"Appearances",club:"PL All-Time"},
    {player:"Eric Cantona",stat:156,statType:"Appearances",club:"PL All-Time"},
    {player:"Roy Keane",stat:366,statType:"Appearances",club:"PL All-Time"},
    {player:"Nicky Butt",stat:387,statType:"Appearances",club:"PL All-Time"},
    {player:"Ryan Giggs",stat:632,statType:"Appearances",club:"PL All-Time"},
    {player:"Robbie Keane",stat:461,statType:"Appearances",club:"PL All-Time"},
    {player:"Peter Crouch",stat:468,statType:"Appearances",club:"PL All-Time"},
    {player:"Craig Bellamy",stat:399,statType:"Appearances",club:"PL All-Time"},
    {player:"Kevin Nolan",stat:390,statType:"Appearances",club:"PL All-Time"},
    {player:"Jay-Jay Okocha",stat:114,statType:"Appearances",club:"PL All-Time"},
    {player:"David Beckham",stat:265,statType:"Appearances",club:"PL All-Time"},
    {player:"Jaap Stam",stat:127,statType:"Appearances",club:"PL All-Time"},
    {player:"Mark Hughes",stat:243,statType:"Appearances",club:"PL All-Time"},
    {player:"Bryan Robson",stat:36,statType:"Appearances",club:"PL All-Time"},
    {player:"Paul Ince",stat:278,statType:"Appearances",club:"PL All-Time"},
    {player:"Lee Sharpe",stat:193,statType:"Appearances",club:"PL All-Time"},
    {player:"Ruud van Nistelrooy",stat:219,statType:"Appearances",club:"PL All-Time"},
    {player:"Ole Gunnar Solskjaer",stat:235,statType:"Appearances",club:"PL All-Time"},
    {player:"Dion Dublin",stat:311,statType:"Appearances",club:"PL All-Time"},
    {player:"Kevin Campbell",stat:260,statType:"Appearances",club:"PL All-Time"},
    {player:"Paul Merson",stat:296,statType:"Appearances",club:"PL All-Time"},
    {player:"Tony Cottee",stat:259,statType:"Appearances",club:"PL All-Time"},
    {player:"Matt Le Tissier",stat:270,statType:"Appearances",club:"PL All-Time"},
    {player:"Chris Sutton",stat:294,statType:"Appearances",club:"PL All-Time"},
    {player:"Dean Holdsworth",stat:278,statType:"Appearances",club:"PL All-Time"},
    {player:"Stan Collymore",stat:128,statType:"Appearances",club:"PL All-Time"},
    {player:"Peter Beardsley",stat:159,statType:"Appearances",club:"PL All-Time"},
    {player:"David Batty",stat:311,statType:"Appearances",club:"PL All-Time"},
    {player:"Stuart Pearce",stat:266,statType:"Appearances",club:"PL All-Time"},
    {player:"John Scales",stat:117,statType:"Appearances",club:"PL All-Time"},
    {player:"Nolberto Solano",stat:281,statType:"Appearances",club:"PL All-Time"},
    {player:"Rob Lee",stat:302,statType:"Appearances",club:"PL All-Time"},
    {player:"Gary Pallister",stat:317,statType:"Appearances",club:"PL All-Time"},
    {player:"Steve Bruce",stat:285,statType:"Appearances",club:"PL All-Time"},
    {player:"Eidur Gudjohnsen",stat:263,statType:"Appearances",club:"PL All-Time"},
    {player:"Gianfranco Zola",stat:229,statType:"Appearances",club:"PL All-Time"},
    {player:"Jimmy Floyd Hasselbaink",stat:200,statType:"Appearances",club:"PL All-Time"},
    {player:"Joe Cole",stat:280,statType:"Appearances",club:"PL All-Time"},
    {player:"Wayne Bridge",stat:244,statType:"Appearances",club:"PL All-Time"},
    {player:"Glen Johnson",stat:289,statType:"Appearances",club:"PL All-Time"},
    {player:"John Arne Riise",stat:171,statType:"Appearances",club:"PL All-Time"},
    {player:"Vladimir Smicer",stat:71,statType:"Appearances",club:"PL All-Time"},
    {player:"Xabi Alonso",stat:143,statType:"Appearances",club:"PL All-Time"},
    {player:"Sami Hyypia",stat:318,statType:"Appearances",club:"PL All-Time"},
    {player:"Jamie Carragher",stat:508,statType:"Appearances",club:"PL All-Time"},
    {player:"Scott Parker",stat:361,statType:"Appearances",club:"PL All-Time"},
    {player:"Kieron Dyer",stat:256,statType:"Appearances",club:"PL All-Time"},
    {player:"Lee Bowyer",stat:315,statType:"Appearances",club:"PL All-Time"},
    {player:"Thomas Gravesen",stat:176,statType:"Appearances",club:"PL All-Time"},
    {player:"Tim Cahill",stat:278,statType:"Appearances",club:"PL All-Time"},
    {player:"Phil Jagielka",stat:386,statType:"Appearances",club:"PL All-Time"},
    {player:"Leon Osman",stat:374,statType:"Appearances",club:"PL All-Time"},
    {player:"Leighton Baines",stat:418,statType:"Appearances",club:"PL All-Time"},
    {player:"Seamus Coleman",stat:315,statType:"Appearances",club:"PL All-Time"},
    {player:"Richard Dunne",stat:377,statType:"Appearances",club:"PL All-Time"},
    {player:"Kevin Kilbane",stat:362,statType:"Appearances",club:"PL All-Time"},
    {player:"Tony Hibbert",stat:268,statType:"Appearances",club:"PL All-Time"},
    {player:"Ross Barkley",stat:246,statType:"Appearances",club:"PL All-Time"},
    {player:"Steven Pienaar",stat:205,statType:"Appearances",club:"PL All-Time"},
    {player:"Duncan Ferguson",stat:199,statType:"Appearances",club:"PL All-Time"},
    {player:"Mark Noble",stat:549,statType:"Appearances",club:"PL All-Time"},
    {player:"Kevin Nolan",stat:390,statType:"Appearances",club:"PL All-Time"},
    {player:"Matthew Upson",stat:219,statType:"Appearances",club:"PL All-Time"},
    {player:"Robert Green",stat:244,statType:"Appearances",club:"PL All-Time"},
    {player:"Paul Konchesky",stat:226,statType:"Appearances",club:"PL All-Time"},
    {player:"Christian Dailly",stat:181,statType:"Appearances",club:"PL All-Time"},
    {player:"Anton Ferdinand",stat:157,statType:"Appearances",club:"PL All-Time"},
    {player:"James Collins",stat:261,statType:"Appearances",club:"PL All-Time"},
    {player:"Winston Reid",stat:193,statType:"Appearances",club:"PL All-Time"},
    {player:"Aaron Cresswell",stat:288,statType:"Appearances",club:"PL All-Time"},
    {player:"Declan Rice",stat:195,statType:"Appearances",club:"PL All-Time"},
    {player:"Sebastien Haller",stat:52,statType:"Appearances",club:"PL All-Time"},
    {player:"Michail Antonio",stat:192,statType:"Appearances",club:"PL All-Time"},
    {player:"Said Benrahma",stat:110,statType:"Appearances",club:"PL All-Time"},
    {player:"Jarrod Bowen",stat:130,statType:"Appearances",club:"PL All-Time"},
    {player:"Virgil van Dijk",stat:190,statType:"Appearances",club:"PL All-Time"},
    {player:"Jordan Henderson",stat:395,statType:"Appearances",club:"PL All-Time"},
    {player:"Georginio Wijnaldum",stat:243,statType:"Appearances",club:"PL All-Time"},
    {player:"Trent Alexander-Arnold",stat:226,statType:"Appearances",club:"PL All-Time"},
    {player:"Andrew Robertson",stat:212,statType:"Appearances",club:"PL All-Time"},
    {player:"Diogo Jota",stat:112,statType:"Appearances",club:"PL All-Time"},
    {player:"Mo Salah",stat:273,statType:"Appearances",club:"PL All-Time"},
    {player:"Sadio Mane",stat:269,statType:"Appearances",club:"PL All-Time"},
    {player:"Roberto Firmino",stat:268,statType:"Appearances",club:"PL All-Time"},
    {player:"Alisson Becker",stat:183,statType:"Appearances",club:"PL All-Time"},
    {player:"Martin Skrtel",stat:233,statType:"Appearances",club:"PL All-Time"},
    {player:"Daniel Agger",stat:156,statType:"Appearances",club:"PL All-Time"},
    {player:"Emre Can",stat:100,statType:"Appearances",club:"PL All-Time"},
    {player:"Adam Lallana",stat:178,statType:"Appearances",club:"PL All-Time"},
    {player:"Philippe Coutinho",stat:152,statType:"Appearances",club:"PL All-Time"},
    {player:"Daniel Sturridge",stat:153,statType:"Appearances",club:"PL All-Time"},
    {player:"Simon Mignolet",stat:204,statType:"Appearances",club:"PL All-Time"},
    {player:"Luis Suarez",stat:133,statType:"Appearances",club:"PL All-Time"},
    {player:"Andy Carroll",stat:44,statType:"Appearances",club:"PL All-Time"},
    {player:"Stewart Downing",stat:169,statType:"Appearances",club:"PL All-Time"},
    {player:"Charlie Adam",stat:100,statType:"Appearances",club:"PL All-Time"},
    {player:"Martin Demichelis",stat:93,statType:"Appearances",club:"PL All-Time"},
    {player:"Yaya Toure",stat:230,statType:"Appearances",club:"PL All-Time"},
    {player:"Pablo Zabaleta",stat:333,statType:"Appearances",club:"PL All-Time"},
    {player:"Micah Richards",stat:245,statType:"Appearances",club:"PL All-Time"},
    {player:"Kolo Toure",stat:193,statType:"Appearances",club:"PL All-Time"},
    {player:"Joleon Lescott",stat:228,statType:"Appearances",club:"PL All-Time"},
    {player:"Samir Nasri",stat:147,statType:"Appearances",club:"PL All-Time"},
    {player:"David Silva",stat:436,statType:"Appearances",club:"PL All-Time"},
  ]},

  // ── 5. ENGLAND CAPS ────────────────────────────────────────────────────────
  { id:"england_caps", label:"England Caps", icon:"🏴󠁧󠁢󠁥󠁮󠁧󠁿", color:"#ec4899", globalAvg:3.8, cards:[
    {player:"Peter Shilton",stat:125,statType:"Caps"},
    {player:"Wayne Rooney",stat:120,statType:"Caps"},
    {player:"David Beckham",stat:115,statType:"Caps"},
    {player:"Steven Gerrard",stat:114,statType:"Caps"},
    {player:"Frank Lampard",stat:106,statType:"Caps"},
    {player:"Ashley Cole",stat:107,statType:"Caps"},
    {player:"Bobby Moore",stat:108,statType:"Caps"},
    {player:"Bobby Charlton",stat:106,statType:"Caps"},
    {player:"Billy Wright",stat:105,statType:"Caps"},
    {player:"Bryan Robson",stat:90,statType:"Caps"},
    {player:"Michael Owen",stat:89,statType:"Caps"},
    {player:"Gary Neville",stat:85,statType:"Caps"},
    {player:"Rio Ferdinand",stat:81,statType:"Caps"},
    {player:"Gary Lineker",stat:80,statType:"Caps"},
    {player:"John Terry",stat:78,statType:"Caps"},
    {player:"Alan Shearer",stat:63,statType:"Caps"},
    {player:"Sol Campbell",stat:73,statType:"Caps"},
    {player:"Paul Scholes",stat:66,statType:"Caps"},
    {player:"Paul Gascoigne",stat:57,statType:"Caps"},
    {player:"Gareth Southgate",stat:57,statType:"Caps"},
    {player:"Tony Adams",stat:66,statType:"Caps"},
    {player:"Stuart Pearce",stat:78,statType:"Caps"},
    {player:"Terry Butcher",stat:77,statType:"Caps"},
    {player:"Ray Clemence",stat:61,statType:"Caps"},
    {player:"Peter Bonetti",stat:7,statType:"Caps"},
    {player:"Gordon Banks",stat:73,statType:"Caps"},
    {player:"Emlyn Hughes",stat:62,statType:"Caps"},
    {player:"Kevin Keegan",stat:63,statType:"Caps"},
    {player:"Mick Mills",stat:42,statType:"Caps"},
    {player:"Ray Wilkins",stat:84,statType:"Caps"},
    {player:"Glen Hoddle",stat:53,statType:"Caps"},
    {player:"Trevor Brooking",stat:47,statType:"Caps"},
    {player:"Tony Woodcock",stat:42,statType:"Caps"},
    {player:"Peter Beardsley",stat:59,statType:"Caps"},
    {player:"John Barnes",stat:79,statType:"Caps"},
    {player:"Chris Waddle",stat:62,statType:"Caps"},
    {player:"Des Walker",stat:59,statType:"Caps"},
    {player:"Mark Wright",stat:45,statType:"Caps"},
    {player:"Steve McMahon",stat:17,statType:"Caps"},
    {player:"David Platt",stat:62,statType:"Caps"},
    {player:"Lee Dixon",stat:22,statType:"Caps"},
    {player:"Steve Coppell",stat:42,statType:"Caps"},
    {player:"Trevor Francis",stat:52,statType:"Caps"},
    {player:"Mick Channon",stat:46,statType:"Caps"},
    {player:"Martin Peters",stat:67,statType:"Caps"},
    {player:"Geoff Hurst",stat:49,statType:"Caps"},
    {player:"Roger Hunt",stat:34,statType:"Caps"},
    {player:"Alan Ball",stat:72,statType:"Caps"},
    {player:"Nobby Stiles",stat:28,statType:"Caps"},
    {player:"Jack Charlton",stat:35,statType:"Caps"},
    {player:"Ray Wilson",stat:63,statType:"Caps"},
    {player:"George Cohen",stat:37,statType:"Caps"},
    {player:"Roger Byrne",stat:33,statType:"Caps"},
    {player:"Tom Finney",stat:76,statType:"Caps"},
    {player:"Nat Lofthouse",stat:33,statType:"Caps"},
    {player:"Tommy Taylor",stat:19,statType:"Caps"},
    {player:"Johnny Haynes",stat:56,statType:"Caps"},
    {player:"Billy Wright",stat:105,statType:"Caps"},
    {player:"Alf Ramsey",stat:32,statType:"Caps"},
    {player:"Phil Thompson",stat:42,statType:"Caps"},
    {player:"Phil Neal",stat:50,statType:"Caps"},
    {player:"Dave Watson",stat:65,statType:"Caps"},
    {player:"Phil Neville",stat:59,statType:"Caps"},
    {player:"Wes Brown",stat:23,statType:"Caps"},
    {player:"Jonathan Woodgate",stat:8,statType:"Caps"},
    {player:"Ledley King",stat:21,statType:"Caps"},
    {player:"Glen Johnson",stat:54,statType:"Caps"},
    {player:"Joleon Lescott",stat:26,statType:"Caps"},
    {player:"Phil Jagielka",stat:40,statType:"Caps"},
    {player:"Leighton Baines",stat:30,statType:"Caps"},
    {player:"Ashley Young",stat:39,statType:"Caps"},
    {player:"Stewart Downing",stat:35,statType:"Caps"},
    {player:"Adam Johnson",stat:12,statType:"Caps"},
    {player:"Andros Townsend",stat:13,statType:"Caps"},
    {player:"Tom Cleverley",stat:13,statType:"Caps"},
    {player:"Jack Wilshere",stat:34,statType:"Caps"},
    {player:"Ross Barkley",stat:33,statType:"Caps"},
    {player:"Alex Oxlade-Chamberlain",stat:35,statType:"Caps"},
    {player:"Daniel Sturridge",stat:26,statType:"Caps"},
    {player:"Andy Carroll",stat:9,statType:"Caps"},
    {player:"Rickie Lambert",stat:11,statType:"Caps"},
    {player:"Nathaniel Clyne",stat:14,statType:"Caps"},
    {player:"Jordan Henderson",stat:81,statType:"Caps"},
    {player:"Eric Dier",stat:49,statType:"Caps"},
    {player:"Dele Alli",stat:37,statType:"Caps"},
    {player:"Jesse Lingard",stat:32,statType:"Caps"},
    {player:"Jamie Vardy",stat:26,statType:"Caps"},
    {player:"Kyle Walker",stat:75,statType:"Caps"},
    {player:"Kieran Trippier",stat:53,statType:"Caps"},
    {player:"John Stones",stat:63,statType:"Caps"},
    {player:"Gary Cahill",stat:61,statType:"Caps"},
    {player:"Chris Smalling",stat:31,statType:"Caps"},
    {player:"Jordan Pickford",stat:56,statType:"Caps"},
    {player:"Nick Pope",stat:11,statType:"Caps"},
    {player:"Kalvin Phillips",stat:31,statType:"Caps"},
    {player:"Ben Chilwell",stat:22,statType:"Caps"},
    {player:"Trent Alexander-Arnold",stat:28,statType:"Caps"},
    {player:"Luke Shaw",stat:32,statType:"Caps"},
    {player:"Declan Rice",stat:55,statType:"Caps"},
    {player:"Mason Mount",stat:36,statType:"Caps"},
    {player:"Conor Gallagher",stat:18,statType:"Caps"},
    {player:"Phil Foden",stat:35,statType:"Caps"},
    {player:"Jude Bellingham",stat:32,statType:"Caps"},
    {player:"Bukayo Saka",stat:40,statType:"Caps"},
    {player:"Harry Kane",stat:97,statType:"Caps"},
    {player:"Marcus Rashford",stat:60,statType:"Caps"},
    {player:"Raheem Sterling",stat:82,statType:"Caps"},
    {player:"Danny Welbeck",stat:42,statType:"Caps"},
    {player:"Jermain Defoe",stat:57,statType:"Caps"},
    {player:"Peter Crouch",stat:42,statType:"Caps"},
    {player:"Emile Heskey",stat:62,statType:"Caps"},
    {player:"Ian Wright",stat:33,statType:"Caps"},
    {player:"Teddy Sheringham",stat:51,statType:"Caps"},
    {player:"Robbie Fowler",stat:26,statType:"Caps"},
    {player:"Les Ferdinand",stat:17,statType:"Caps"},
    {player:"Nick Barmby",stat:23,statType:"Caps"},
    {player:"Dion Dublin",stat:4,statType:"Caps"},
    {player:"Michael Bridges",stat:1,statType:"Caps"},
    {player:"James Milner",stat:61,statType:"Caps"},
    {player:"Adam Lallana",stat:34,statType:"Caps"},
    {player:"Theo Walcott",stat:47,statType:"Caps"},
    {player:"Kieron Dyer",stat:33,statType:"Caps"},
    {player:"Joe Cole",stat:56,statType:"Caps"},
    {player:"Scott Parker",stat:18,statType:"Caps"},
    {player:"Paul Ince",stat:53,statType:"Caps"},
    {player:"Darren Anderton",stat:30,statType:"Caps"},
    {player:"Steve McManaman",stat:37,statType:"Caps"},
    {player:"Darren Anderton",stat:30,statType:"Caps"},
    {player:"Ugo Ehiogu",stat:4,statType:"Caps"},
    {player:"Michael Dawson",stat:4,statType:"Caps"},
    {player:"Danny Murphy",stat:9,statType:"Caps"},
    {player:"Joe Hart",stat:75,statType:"Caps"},
    {player:"Scott Carson",stat:4,statType:"Caps"},
    {player:"Paul Robinson",stat:41,statType:"Caps"},
    {player:"Tim Flowers",stat:11,statType:"Caps"},
    {player:"Nigel Martyn",stat:23,statType:"Caps"},
    {player:"David James",stat:53,statType:"Caps"},
    {player:"Chris Woods",stat:43,statType:"Caps"},
    {player:"Dave Beasant",stat:2,statType:"Caps"},
    {player:"Neil Webb",stat:26,statType:"Caps"},
    {player:"David Rocastle",stat:14,statType:"Caps"},
    {player:"Kerry Dixon",stat:8,statType:"Caps"},
    {player:"Tony Cottee",stat:7,statType:"Caps"},
    {player:"Mark Hateley",stat:32,statType:"Caps"},
    {player:"Luther Blissett",stat:14,statType:"Caps"},
    {player:"Cyrille Regis",stat:5,statType:"Caps"},
    {player:"Viv Anderson",stat:30,statType:"Caps"},
    {player:"Bob Latchford",stat:12,statType:"Caps"},
    {player:"Joe Royle",stat:6,statType:"Caps"},
    {player:"Peter Barnes",stat:22,statType:"Caps"},
    {player:"David Johnson",stat:8,statType:"Caps"},
    {player:"Dennis Tueart",stat:6,statType:"Caps"},
  ]},

  // ── 6. ENGLAND GOALS ───────────────────────────────────────────────────────
  { id:"england_goals", label:"England Goals", icon:"🦁", color:"#3b82f6", globalAvg:4.2, cards:[
    {player:"Harry Kane",stat:69,statType:"Goals"},
    {player:"Wayne Rooney",stat:53,statType:"Goals"},
    {player:"Bobby Charlton",stat:49,statType:"Goals"},
    {player:"Gary Lineker",stat:48,statType:"Goals"},
    {player:"Jimmy Greaves",stat:44,statType:"Goals"},
    {player:"Michael Owen",stat:40,statType:"Goals"},
    {player:"Tom Finney",stat:30,statType:"Goals"},
    {player:"Nat Lofthouse",stat:30,statType:"Goals"},
    {player:"Alan Shearer",stat:30,statType:"Goals"},
    {player:"Frank Lampard",stat:29,statType:"Goals"},
    {player:"Vivian Woodward",stat:29,statType:"Goals"},
    {player:"Steve Bloomer",stat:28,statType:"Goals"},
    {player:"David Platt",stat:27,statType:"Goals"},
    {player:"Bryan Robson",stat:26,statType:"Goals"},
    {player:"Geoff Hurst",stat:24,statType:"Goals"},
    {player:"Stan Mortensen",stat:23,statType:"Goals"},
    {player:"Peter Crouch",stat:22,statType:"Goals"},
    {player:"Steven Gerrard",stat:21,statType:"Goals"},
    {player:"Mick Channon",stat:21,statType:"Goals"},
    {player:"Kevin Keegan",stat:21,statType:"Goals"},
    {player:"Martin Peters",stat:20,statType:"Goals"},
    {player:"Raheem Sterling",stat:20,statType:"Goals"},
    {player:"Jermain Defoe",stat:19,statType:"Goals"},
    {player:"Tommy Lawton",stat:22,statType:"Goals"},
    {player:"Marcus Rashford",stat:17,statType:"Goals"},
    {player:"David Beckham",stat:17,statType:"Goals"},
    {player:"Tommy Taylor",stat:16,statType:"Goals"},
    {player:"Danny Welbeck",stat:16,statType:"Goals"},
    {player:"Tony Woodcock",stat:16,statType:"Goals"},
    {player:"Martin Chivers",stat:13,statType:"Goals"},
    {player:"Paul Mariner",stat:13,statType:"Goals"},
    {player:"John Barnes",stat:11,statType:"Goals"},
    {player:"Teddy Sheringham",stat:11,statType:"Goals"},
    {player:"Paul Gascoigne",stat:10,statType:"Goals"},
    {player:"Jackie Milburn",stat:10,statType:"Goals"},
    {player:"Dennis Wilshaw",stat:10,statType:"Goals"},
    {player:"Allan Clarke",stat:10,statType:"Goals"},
    {player:"Trevor Francis",stat:12,statType:"Goals"},
    {player:"Mark Hateley",stat:9,statType:"Goals"},
    {player:"Roy Bentley",stat:9,statType:"Goals"},
    {player:"Peter Beardsley",stat:9,statType:"Goals"},
    {player:"Glen Hoddle",stat:8,statType:"Goals"},
    {player:"Ivor Broadis",stat:8,statType:"Goals"},
    {player:"Alan Ball",stat:8,statType:"Goals"},
    {player:"Johnny Byrne",stat:8,statType:"Goals"},
    {player:"Theo Walcott",stat:8,statType:"Goals"},
    {player:"Alex Oxlade-Chamberlain",stat:8,statType:"Goals"},
    {player:"Daniel Sturridge",stat:8,statType:"Goals"},
    {player:"Ian Wright",stat:9,statType:"Goals"},
    {player:"Jamie Vardy",stat:7,statType:"Goals"},
    {player:"Steve Coppell",stat:7,statType:"Goals"},
    {player:"Ashley Young",stat:7,statType:"Goals"},
    {player:"Robbie Fowler",stat:7,statType:"Goals"},
    {player:"Emile Heskey",stat:7,statType:"Goals"},
    {player:"Cyrille Regis",stat:5,statType:"Goals"},
    {player:"John Terry",stat:6,statType:"Goals"},
    {player:"Jesse Lingard",stat:6,statType:"Goals"},
    {player:"Chris Waddle",stat:6,statType:"Goals"},
    {player:"David Johnson",stat:6,statType:"Goals"},
    {player:"Mason Mount",stat:6,statType:"Goals"},
    {player:"Tony Adams",stat:5,statType:"Goals"},
    {player:"Stuart Pearce",stat:5,statType:"Goals"},
    {player:"Bob Latchford",stat:5,statType:"Goals"},
    {player:"Trevor Brooking",stat:5,statType:"Goals"},
    {player:"Gary Cahill",stat:5,statType:"Goals"},
    {player:"Bukayo Saka",stat:14,statType:"Goals"},
    {player:"Jude Bellingham",stat:14,statType:"Goals"},
    {player:"Andros Townsend",stat:3,statType:"Goals"},
    {player:"Ross Barkley",stat:5,statType:"Goals"},
    {player:"Jack Grealish",stat:3,statType:"Goals"},
    {player:"Phil Foden",stat:4,statType:"Goals"},
    {player:"Declan Rice",stat:4,statType:"Goals"},
    {player:"Kieran Trippier",stat:4,statType:"Goals"},
    {player:"Luke Shaw",stat:4,statType:"Goals"},
    {player:"Trent Alexander-Arnold",stat:4,statType:"Goals"},
    {player:"Paul Scholes",stat:14,statType:"Goals"},
    {player:"Johnny Haynes",stat:18,statType:"Goals"},
    {player:"Rio Ferdinand",stat:3,statType:"Goals"},
    {player:"Terry Butcher",stat:3,statType:"Goals"},
    {player:"Billy Wright",stat:3,statType:"Goals"},
    {player:"Alf Ramsey",stat:3,statType:"Goals"},
    {player:"Roger Hunt",stat:3,statType:"Goals"},
    {player:"Ben Chilwell",stat:3,statType:"Goals"},
    {player:"Roger Byrne",stat:0,statType:"Goals"},
    {player:"Jimmy Armfield",stat:0,statType:"Goals"},
    {player:"George Cohen",stat:0,statType:"Goals"},
    {player:"Emlyn Hughes",stat:1,statType:"Goals"},
    {player:"Phil Thompson",stat:1,statType:"Goals"},
    {player:"Sol Campbell",stat:1,statType:"Goals"},
    {player:"Andy Cole",stat:1,statType:"Goals"},
    {player:"Kyle Walker",stat:1,statType:"Goals"},
    {player:"Chris Smalling",stat:1,statType:"Goals"},
    {player:"Peter Barnes",stat:4,statType:"Goals"},
    {player:"Luther Blissett",stat:3,statType:"Goals"},
    {player:"Joe Royle",stat:2,statType:"Goals"},
    {player:"Frank Worthington",stat:2,statType:"Goals"},
    {player:"Rob Lee",stat:2,statType:"Goals"},
    {player:"Kevin Hector",stat:2,statType:"Goals"},
    {player:"Ledley King",stat:2,statType:"Goals"},
    {player:"Jonathan Woodgate",stat:1,statType:"Goals"},
    {player:"Paul Ince",stat:2,statType:"Goals"},
    {player:"Nick Barmby",stat:4,statType:"Goals"},
    {player:"Michael Dawson",stat:0,statType:"Goals"},
    {player:"Scott Parker",stat:0,statType:"Goals"},
    {player:"Gareth Southgate",stat:2,statType:"Goals"},
    {player:"Kieron Dyer",stat:0,statType:"Goals"},
    {player:"Glen Johnson",stat:4,statType:"Goals"},
    {player:"Joleon Lescott",stat:7,statType:"Goals"},
    {player:"Stewart Downing",stat:0,statType:"Goals"},
    {player:"Adam Johnson",stat:2,statType:"Goals"},
    {player:"Tom Cleverley",stat:1,statType:"Goals"},
    {player:"Jack Wilshere",stat:2,statType:"Goals"},
    {player:"Danny Drinkwater",stat:0,statType:"Goals"},
    {player:"Rickie Lambert",stat:3,statType:"Goals"},
    {player:"Jay Rodriguez",stat:1,statType:"Goals"},
    {player:"Nathaniel Clyne",stat:0,statType:"Goals"},
    {player:"Jordan Henderson",stat:3,statType:"Goals"},
    {player:"Eric Dier",stat:3,statType:"Goals"},
    {player:"John Stones",stat:3,statType:"Goals"},
    {player:"Dele Alli",stat:3,statType:"Goals"},
    {player:"Adam Lallana",stat:5,statType:"Goals"},
    {player:"Conor Gallagher",stat:0,statType:"Goals"},
    {player:"Kalvin Phillips",stat:0,statType:"Goals"},
    {player:"Jordan Pickford",stat:0,statType:"Goals"},
    {player:"Nick Pope",stat:0,statType:"Goals"},
    {player:"Gary Neville",stat:0,statType:"Goals"},
    {player:"Phil Neville",stat:1,statType:"Goals"},
    {player:"Wes Brown",stat:1,statType:"Goals"},
    {player:"Martin Keown",stat:2,statType:"Goals"},
    {player:"Lee Dixon",stat:1,statType:"Goals"},
    {player:"Ray Clemence",stat:0,statType:"Goals"},
    {player:"Peter Shilton",stat:0,statType:"Goals"},
    {player:"Gordon Banks",stat:0,statType:"Goals"},
    {player:"David James",stat:0,statType:"Goals"},
    {player:"Joe Hart",stat:0,statType:"Goals"},
    {player:"Nigel Martyn",stat:0,statType:"Goals"},
    {player:"Paul Robinson",stat:0,statType:"Goals"},
    {player:"Des Walker",stat:0,statType:"Goals"},
    {player:"Mark Wright",stat:1,statType:"Goals"},
    {player:"Tony Hibbert",stat:0,statType:"Goals"},
    {player:"Danny Murphy",stat:1,statType:"Goals"},
    {player:"Peter Thompson",stat:1,statType:"Goals"},
    {player:"Gordon Harris",stat:2,statType:"Goals"},
    {player:"Don Revie",stat:4,statType:"Goals"},
    {player:"Ray Kennedy",stat:3,statType:"Goals"},
    {player:"Steve Heighway",stat:1,statType:"Goals"},
  ]},

  // ── 7. MAN UTD VS LIVERPOOL GOALS ─────────────────────────────────────────
  { id:"mufc_lfc", label:"Man Utd vs Liverpool", icon:"🔴", color:"#dc2626", globalAvg:4.0, cards:[
    // Manchester United legends
    {player:"Bobby Charlton",stat:249,statType:"Goals",club:"Man United"},
    {player:"Denis Law",stat:237,statType:"Goals",club:"Man United"},
    {player:"Wayne Rooney",stat:253,statType:"Goals",club:"Man United"},
    {player:"George Best",stat:179,statType:"Goals",club:"Man United"},
    {player:"Andy Cole",stat:121,statType:"Goals",club:"Man United"},
    {player:"Ruud van Nistelrooy",stat:150,statType:"Goals",club:"Man United"},
    {player:"Mark Hughes",stat:163,statType:"Goals",club:"Man United"},
    {player:"Paul Scholes",stat:155,statType:"Goals",club:"Man United"},
    {player:"Ryan Giggs",stat:168,statType:"Goals",club:"Man United"},
    {player:"Eric Cantona",stat:82,statType:"Goals",club:"Man United"},
    {player:"Ole Gunnar Solskjaer",stat:126,statType:"Goals",club:"Man United"},
    {player:"Dwight Yorke",stat:66,statType:"Goals",club:"Man United"},
    {player:"Brian McClair",stat:127,statType:"Goals",club:"Man United"},
    {player:"Cristiano Ronaldo",stat:118,statType:"Goals",club:"Man United"},
    {player:"Anthony Martial",stat:90,statType:"Goals",club:"Man United"},
    {player:"Marcus Rashford",stat:138,statType:"Goals",club:"Man United"},
    {player:"Bruno Fernandes",stat:91,statType:"Goals",club:"Man United"},
    {player:"Dimitar Berbatov",stat:56,statType:"Goals",club:"Man United"},
    {player:"Carlos Tevez",stat:34,statType:"Goals",club:"Man United"},
    {player:"Robin van Persie",stat:58,statType:"Goals",club:"Man United"},
    {player:"Louis Saha",stat:42,statType:"Goals",club:"Man United"},
    {player:"Teddy Sheringham",stat:46,statType:"Goals",club:"Man United"},
    {player:"Peter Schmeichel",stat:1,statType:"Goals",club:"Man United"},
    {player:"Roy Keane",stat:33,statType:"Goals",club:"Man United"},
    {player:"Nicky Butt",stat:26,statType:"Goals",club:"Man United"},
    {player:"Gary Neville",stat:5,statType:"Goals",club:"Man United"},
    {player:"Denis Irwin",stat:33,statType:"Goals",club:"Man United"},
    {player:"Steve Bruce",stat:51,statType:"Goals",club:"Man United"},
    {player:"Gary Pallister",stat:15,statType:"Goals",club:"Man United"},
    {player:"Jaap Stam",stat:1,statType:"Goals",club:"Man United"},
    {player:"Rio Ferdinand",stat:8,statType:"Goals",club:"Man United"},
    {player:"Patrice Evra",stat:6,statType:"Goals",club:"Man United"},
    {player:"Rafael da Silva",stat:5,statType:"Goals",club:"Man United"},
    {player:"Jonny Evans",stat:7,statType:"Goals",club:"Man United"},
    {player:"Michael Carrick",stat:25,statType:"Goals",club:"Man United"},
    {player:"Paul Ince",stat:31,statType:"Goals",club:"Man United"},
    {player:"Ji-sung Park",stat:19,statType:"Goals",club:"Man United"},
    {player:"Antonio Valencia",stat:14,statType:"Goals",club:"Man United"},
    {player:"Nani",stat:40,statType:"Goals",club:"Man United"},
    {player:"Juan Mata",stat:34,statType:"Goals",club:"Man United"},
    {player:"Jesse Lingard",stat:35,statType:"Goals",club:"Man United"},
    {player:"Paul Pogba",stat:39,statType:"Goals",club:"Man United"},
    {player:"Ander Herrera",stat:20,statType:"Goals",club:"Man United"},
    {player:"Romelu Lukaku",stat:42,statType:"Goals",club:"Man United"},
    {player:"Zlatan Ibrahimovic",stat:29,statType:"Goals",club:"Man United"},
    {player:"Memphis Depay",stat:7,statType:"Goals",club:"Man United"},
    {player:"Juan Sebastian Veron",stat:11,statType:"Goals",club:"Man United"},
    {player:"Quinton Fortune",stat:7,statType:"Goals",club:"Man United"},
    {player:"Kleberson",stat:2,statType:"Goals",club:"Man United"},
    {player:"Eric Djemba-Djemba",stat:3,statType:"Goals",club:"Man United"},
    // Liverpool legends
    {player:"Ian Rush",stat:346,statType:"Goals",club:"Liverpool"},
    {player:"Roger Hunt",stat:285,statType:"Goals",club:"Liverpool"},
    {player:"Gordon Hodgson",stat:241,statType:"Goals",club:"Liverpool"},
    {player:"Billy Liddell",stat:228,statType:"Goals",club:"Liverpool"},
    {player:"Kenny Dalglish",stat:172,statType:"Goals",club:"Liverpool"},
    {player:"Robbie Fowler",stat:183,statType:"Goals",club:"Liverpool"},
    {player:"Steven Gerrard",stat:185,statType:"Goals",club:"Liverpool"},
    {player:"Mohamed Salah",stat:200,statType:"Goals",club:"Liverpool"},
    {player:"Michael Owen",stat:158,statType:"Goals",club:"Liverpool"},
    {player:"Harry Chambers",stat:151,statType:"Goals",club:"Liverpool"},
    {player:"Sam Raybould",stat:130,statType:"Goals",club:"Liverpool"},
    {player:"Jack Parkinson",stat:128,statType:"Goals",club:"Liverpool"},
    {player:"Kevin Keegan",stat:100,statType:"Goals",club:"Liverpool"},
    {player:"John Toshack",stat:96,statType:"Goals",club:"Liverpool"},
    {player:"John Barnes",stat:108,statType:"Goals",club:"Liverpool"},
    {player:"Fernando Torres",stat:81,statType:"Goals",club:"Liverpool"},
    {player:"Dirk Kuyt",stat:71,statType:"Goals",club:"Liverpool"},
    {player:"Peter Crouch",stat:42,statType:"Goals",club:"Liverpool"},
    {player:"Nicolas Anelka",stat:19,statType:"Goals",club:"Liverpool"},
    {player:"Emile Heskey",stat:60,statType:"Goals",club:"Liverpool"},
    {player:"Vladimir Smicer",stat:14,statType:"Goals",club:"Liverpool"},
    {player:"Milan Baros",stat:27,statType:"Goals",club:"Liverpool"},
    {player:"Djibril Cisse",stat:24,statType:"Goals",club:"Liverpool"},
    {player:"Xabi Alonso",stat:16,statType:"Goals",club:"Liverpool"},
    {player:"Jamie Carragher",stat:5,statType:"Goals",club:"Liverpool"},
    {player:"Sami Hyypia",stat:35,statType:"Goals",club:"Liverpool"},
    {player:"Stephane Henchoz",stat:0,statType:"Goals",club:"Liverpool"},
    {player:"John Arne Riise",stat:31,statType:"Goals",club:"Liverpool"},
    {player:"Emlyn Hughes",stat:72,statType:"Goals",club:"Liverpool"},
    {player:"Phil Thompson",stat:13,statType:"Goals",club:"Liverpool"},
    {player:"Phil Neal",stat:60,statType:"Goals",club:"Liverpool"},
    {player:"Alan Kennedy",stat:15,statType:"Goals",club:"Liverpool"},
    {player:"Sadio Mane",stat:120,statType:"Goals",club:"Liverpool"},
    {player:"Roberto Firmino",stat:111,statType:"Goals",club:"Liverpool"},
    {player:"Diogo Jota",stat:65,statType:"Goals",club:"Liverpool"},
    {player:"Jordan Henderson",stat:44,statType:"Goals",club:"Liverpool"},
    {player:"Georginio Wijnaldum",stat:22,statType:"Goals",club:"Liverpool"},
    {player:"Adam Lallana",stat:22,statType:"Goals",club:"Liverpool"},
    {player:"Philippe Coutinho",stat:54,statType:"Goals",club:"Liverpool"},
    {player:"Luis Suarez",stat:82,statType:"Goals",club:"Liverpool"},
    {player:"Daniel Sturridge",stat:67,statType:"Goals",club:"Liverpool"},
    {player:"Andy Carroll",stat:6,statType:"Goals",club:"Liverpool"},
    {player:"Stewart Downing",stat:8,statType:"Goals",club:"Liverpool"},
    {player:"Charlie Adam",stat:2,statType:"Goals",club:"Liverpool"},
    {player:"Joe Allen",stat:4,statType:"Goals",club:"Liverpool"},
    {player:"Trent Alexander-Arnold",stat:18,statType:"Goals",club:"Liverpool"},
    {player:"Andrew Robertson",stat:12,statType:"Goals",club:"Liverpool"},
    {player:"Virgil van Dijk",stat:21,statType:"Goals",club:"Liverpool"},
    {player:"Alisson Becker",stat:1,statType:"Goals",club:"Liverpool"},
    {player:"Naby Keita",stat:9,statType:"Goals",club:"Liverpool"},
  ]},

  // ── 8. REAL MADRID VS BARCELONA GOALS ─────────────────────────────────────
  { id:"rmcf_fcb", label:"Real vs Barcelona", icon:"👑", color:"#8b5cf6", globalAvg:4.2, cards:[
    // Real Madrid legends
    {player:"Cristiano Ronaldo",stat:450,statType:"Goals",club:"Real Madrid"},
    {player:"Raul",stat:323,statType:"Goals",club:"Real Madrid"},
    {player:"Karim Benzema",stat:354,statType:"Goals",club:"Real Madrid"},
    {player:"Alfredo Di Stefano",stat:308,statType:"Goals",club:"Real Madrid"},
    {player:"Hugo Sanchez",stat:208,statType:"Goals",club:"Real Madrid"},
    {player:"Ferenc Puskas",stat:242,statType:"Goals",club:"Real Madrid"},
    {player:"Ivan Zamorano",stat:101,statType:"Goals",club:"Real Madrid"},
    {player:"Fernando Morientes",stat:93,statType:"Goals",club:"Real Madrid"},
    {player:"Santiago Solari",stat:34,statType:"Goals",club:"Real Madrid"},
    {player:"Emilio Butragueno",stat:171,statType:"Goals",club:"Real Madrid"},
    {player:"Roberto Carlos",stat:71,statType:"Goals",club:"Real Madrid"},
    {player:"Sergio Ramos",stat:101,statType:"Goals",club:"Real Madrid"},
    {player:"Gareth Bale",stat:106,statType:"Goals",club:"Real Madrid"},
    {player:"Angel di Maria",stat:36,statType:"Goals",club:"Real Madrid"},
    {player:"Benzema partner",stat:354,statType:"Goals",club:"Real Madrid"},
    {player:"Gonzalo Higuain",stat:121,statType:"Goals",club:"Real Madrid"},
    {player:"Arjen Robben",stat:42,statType:"Goals",club:"Real Madrid"},
    {player:"Robinho",stat:55,statType:"Goals",club:"Real Madrid"},
    {player:"Ruud van Nistelrooy",stat:107,statType:"Goals",club:"Real Madrid"},
    {player:"Michael Owen",stat:16,statType:"Goals",club:"Real Madrid"},
    {player:"Nicolas Anelka",stat:8,statType:"Goals",club:"Real Madrid"},
    {player:"Predrag Mijatovic",stat:48,statType:"Goals",club:"Real Madrid"},
    {player:"Davor Suker",stat:60,statType:"Goals",club:"Real Madrid"},
    {player:"Martin Vazquez",stat:79,statType:"Goals",club:"Real Madrid"},
    {player:"Butragüeno",stat:171,statType:"Goals",club:"Real Madrid"},
    {player:"Jose Maria Gutierrez",stat:34,statType:"Goals",club:"Real Madrid"},
    {player:"Clarence Seedorf",stat:19,statType:"Goals",club:"Real Madrid"},
    {player:"Luis Figo",stat:78,statType:"Goals",club:"Real Madrid"},
    {player:"Zinedine Zidane",stat:49,statType:"Goals",club:"Real Madrid"},
    {player:"David Beckham",stat:13,statType:"Goals",club:"Real Madrid"},
    {player:"Ronaldo Nazario",stat:83,statType:"Goals",club:"Real Madrid"},
    {player:"Toni Kroos",stat:28,statType:"Goals",club:"Real Madrid"},
    {player:"Luka Modric",stat:30,statType:"Goals",club:"Real Madrid"},
    {player:"Casemiro",stat:30,statType:"Goals",club:"Real Madrid"},
    {player:"Isco",stat:53,statType:"Goals",club:"Real Madrid"},
    {player:"James Rodriguez",stat:37,statType:"Goals",club:"Real Madrid"},
    {player:"Marcelo",stat:38,statType:"Goals",club:"Real Madrid"},
    {player:"Dani Carvajal",stat:18,statType:"Goals",club:"Real Madrid"},
    {player:"Pepe",stat:18,statType:"Goals",club:"Real Madrid"},
    {player:"Nacho Fernandez",stat:16,statType:"Goals",club:"Real Madrid"},
    {player:"Vinicius Jr",stat:76,statType:"Goals",club:"Real Madrid"},
    {player:"Rodrygo",stat:50,statType:"Goals",club:"Real Madrid"},
    {player:"Federico Valverde",stat:18,statType:"Goals",club:"Real Madrid"},
    {player:"Eduardo Camavinga",stat:6,statType:"Goals",club:"Real Madrid"},
    {player:"Aurelien Tchouameni",stat:8,statType:"Goals",club:"Real Madrid"},
    {player:"Alvaro Morata",stat:21,statType:"Goals",club:"Real Madrid"},
    {player:"Jese",stat:18,statType:"Goals",club:"Real Madrid"},
    {player:"Chicharito",stat:37,statType:"Goals",club:"Real Madrid"},
    {player:"Benzema Rodrygo combo",stat:20,statType:"Goals",club:"Real Madrid"},
    {player:"Julio Cesar Rodriguez",stat:5,statType:"Goals",club:"Real Madrid"},
    // Barcelona legends
    {player:"Lionel Messi",stat:672,statType:"Goals",club:"Barcelona"},
    {player:"Cesar Rodriguez",stat:232,statType:"Goals",club:"Barcelona"},
    {player:"Laszlo Kubala",stat:194,statType:"Goals",club:"Barcelona"},
    {player:"Johan Cruyff",stat:211,statType:"Goals",club:"Barcelona"},
    {player:"Samuel Eto'o",stat:108,statType:"Goals",club:"Barcelona"},
    {player:"Ronaldinho",stat:94,statType:"Goals",club:"Barcelona"},
    {player:"Hristo Stoichkov",stat:118,statType:"Goals",club:"Barcelona"},
    {player:"Luis Suarez",stat:198,statType:"Goals",club:"Barcelona"},
    {player:"Neymar",stat:105,statType:"Goals",club:"Barcelona"},
    {player:"Thierry Henry",stat:49,statType:"Goals",club:"Barcelona"},
    {player:"David Villa",stat:58,statType:"Goals",club:"Barcelona"},
    {player:"Zlatan Ibrahimovic",stat:22,statType:"Goals",club:"Barcelona"},
    {player:"Henrik Larsson",stat:37,statType:"Goals",club:"Barcelona"},
    {player:"Patrick Kluivert",stat:90,statType:"Goals",club:"Barcelona"},
    {player:"Ivan de la Pena",stat:10,statType:"Goals",club:"Barcelona"},
    {player:"Rivaldo",stat:136,statType:"Goals",club:"Barcelona"},
    {player:"Xavi Hernandez",stat:85,statType:"Goals",club:"Barcelona"},
    {player:"Andres Iniesta",stat:57,statType:"Goals",club:"Barcelona"},
    {player:"Cesc Fabregas",stat:42,statType:"Goals",club:"Barcelona"},
    {player:"Deco",stat:31,statType:"Goals",club:"Barcelona"},
    {player:"Sergi Roberto",stat:15,statType:"Goals",club:"Barcelona"},
    {player:"Sergio Busquets",stat:15,statType:"Goals",club:"Barcelona"},
    {player:"Dani Alves",stat:21,statType:"Goals",club:"Barcelona"},
    {player:"Jordi Alba",stat:35,statType:"Goals",club:"Barcelona"},
    {player:"Gerard Pique",stat:52,statType:"Goals",club:"Barcelona"},
    {player:"Carles Puyol",stat:17,statType:"Goals",club:"Barcelona"},
    {player:"Eric Abidal",stat:3,statType:"Goals",club:"Barcelona"},
    {player:"Maxwell",stat:2,statType:"Goals",club:"Barcelona"},
    {player:"Javier Mascherano",stat:4,statType:"Goals",club:"Barcelona"},
    {player:"Marc Bartra",stat:5,statType:"Goals",club:"Barcelona"},
    {player:"Jeremy Mathieu",stat:9,statType:"Goals",club:"Barcelona"},
    {player:"Umtiti",stat:8,statType:"Goals",club:"Barcelona"},
    {player:"Clement Lenglet",stat:5,statType:"Goals",club:"Barcelona"},
    {player:"Nelson Semedo",stat:3,statType:"Goals",club:"Barcelona"},
    {player:"Antoine Griezmann",stat:35,statType:"Goals",club:"Barcelona"},
    {player:"Ousmane Dembele",stat:32,statType:"Goals",club:"Barcelona"},
    {player:"Pedri",stat:16,statType:"Goals",club:"Barcelona"},
    {player:"Gavi",stat:12,statType:"Goals",club:"Barcelona"},
    {player:"Ansu Fati",stat:23,statType:"Goals",club:"Barcelona"},
    {player:"Ferran Torres",stat:18,statType:"Goals",club:"Barcelona"},
    {player:"Robert Lewandowski",stat:60,statType:"Goals",club:"Barcelona"},
    {player:"Martin Braithwaite",stat:11,statType:"Goals",club:"Barcelona"},
    {player:"Arturo Vidal",stat:11,statType:"Goals",club:"Barcelona"},
    {player:"Ivan Rakitic",stat:35,statType:"Goals",club:"Barcelona"},
    {player:"Aleix Vidal",stat:4,statType:"Goals",club:"Barcelona"},
    {player:"Arda Turan",stat:19,statType:"Goals",club:"Barcelona"},
    {player:"Victor Valdes",stat:0,statType:"Goals",club:"Barcelona"},
    {player:"Jose Manuel Pinto",stat:0,statType:"Goals",club:"Barcelona"},
    {player:"Claudio Bravo",stat:0,statType:"Goals",club:"Barcelona"},
    {player:"Marc-Andre ter Stegen",stat:2,statType:"Goals",club:"Barcelona"},
    {player:"Marc Casado",stat:1,statType:"Goals",club:"Barcelona"},
  ]},
];
const DAILY_CHALLENGES = [
  { day:1, theme:"Premier League All-Time Top Scorers", cards:[
    {player:"Alan Shearer",stat:260,statType:"Goals"},{player:"Teddy Sheringham",stat:146,statType:"Goals"},{player:"Robbie Fowler",stat:163,statType:"Goals"},{player:"Frank Lampard",stat:177,statType:"Goals"},{player:"Andrew Cole",stat:187,statType:"Goals"},{player:"Sergio Agüero",stat:184,statType:"Goals"},{player:"Harry Kane",stat:213,statType:"Goals"},{player:"Wayne Rooney",stat:208,statType:"Goals"},{player:"Michael Owen",stat:150,statType:"Goals"},{player:"Jermain Defoe",stat:162,statType:"Goals"},{player:"Les Ferdinand",stat:149,statType:"Goals"},
  ]},
  { day:2, theme:"Premier League All-Time Goalkeepers", cards:[
    {player:"Petr Čech",stat:202,statType:"Clean Sheets"},{player:"Nigel Martyn",stat:90,statType:"Clean Sheets"},{player:"Mark Schwarzer",stat:107,statType:"Clean Sheets"},{player:"Joe Hart",stat:125,statType:"Clean Sheets"},{player:"Hugo Lloris",stat:130,statType:"Clean Sheets"},{player:"Thibaut Courtois",stat:113,statType:"Clean Sheets"},{player:"David de Gea",stat:140,statType:"Clean Sheets"},{player:"Edwin van der Sar",stat:141,statType:"Clean Sheets"},{player:"Brad Friedel",stat:132,statType:"Clean Sheets"},{player:"Kasper Schmeichel",stat:104,statType:"Clean Sheets"},{player:"Shay Given",stat:134,statType:"Clean Sheets"},
  ]},
  { day:3, theme:"World Cup All-Time Top Scorers", cards:[
    {player:"Miroslav Klose",stat:16,statType:"Goals"},{player:"Diego Maradona",stat:8,statType:"Goals"},{player:"Just Fontaine",stat:13,statType:"Goals"},{player:"Gerd Müller",stat:14,statType:"Goals"},{player:"Sandor Kocsis",stat:11,statType:"Goals"},{player:"Thomas Müller",stat:10,statType:"Goals"},{player:"Gabriel Batistuta",stat:10,statType:"Goals"},{player:"Pelé",stat:12,statType:"Goals"},{player:"Kylian Mbappé",stat:12,statType:"Goals"},{player:"Ronaldo Nazário",stat:15,statType:"Goals"},{player:"Gary Lineker",stat:10,statType:"Goals"},
  ]},
  { day:4, theme:"Champions League All-Time Top Scorers", cards:[
    {player:"Cristiano Ronaldo",stat:140,statType:"Goals"},{player:"Thierry Henry",stat:50,statType:"Goals"},{player:"Raúl",stat:71,statType:"Goals"},{player:"Ruud van Nistelrooy",stat:56,statType:"Goals"},{player:"Robert Lewandowski",stat:91,statType:"Goals"},{player:"Karim Benzema",stat:90,statType:"Goals"},{player:"Andriy Shevchenko",stat:59,statType:"Goals"},{player:"Lionel Messi",stat:129,statType:"Goals"},{player:"Zlatan Ibrahimović",stat:48,statType:"Goals"},{player:"Alessandro Del Piero",stat:48,statType:"Goals"},{player:"Didier Drogba",stat:44,statType:"Goals"},
  ]},
  { day:5, theme:"Premier League Single-Season Top Scorers", cards:[
    {player:"Alan Shearer",stat:34,statType:"Goals",club:"Blackburn",season:"1994/95"},{player:"Sergio Agüero",stat:26,statType:"Goals",club:"Man City",season:"2014/15"},{player:"Thierry Henry",stat:30,statType:"Goals",club:"Arsenal",season:"2003/04"},{player:"Cristiano Ronaldo",stat:31,statType:"Goals",club:"Man United",season:"2007/08"},{player:"Kevin Phillips",stat:30,statType:"Goals",club:"Sunderland",season:"1999/00"},{player:"Harry Kane",stat:30,statType:"Goals",club:"Tottenham",season:"2017/18"},{player:"Luis Suárez",stat:31,statType:"Goals",club:"Liverpool",season:"2013/14"},{player:"Mohamed Salah",stat:32,statType:"Goals",club:"Liverpool",season:"2017/18"},{player:"Robin van Persie",stat:30,statType:"Goals",club:"Arsenal",season:"2011/12"},{player:"Andy Cole",stat:34,statType:"Goals",club:"Newcastle",season:"1993/94"},{player:"Erling Haaland",stat:36,statType:"Goals",club:"Man City",season:"2022/23"},
  ]},
  { day:6, theme:"Premier League All-Time Top Assists", cards:[
    {player:"Ryan Giggs",stat:162,statType:"Assists"},{player:"Robbie Fowler",stat:60,statType:"Assists"},{player:"Dennis Bergkamp",stat:94,statType:"Assists"},{player:"David Silva",stat:93,statType:"Assists"},{player:"Cesc Fàbregas",stat:111,statType:"Assists"},{player:"Frank Lampard",stat:102,statType:"Assists"},{player:"Wayne Rooney",stat:103,statType:"Assists"},{player:"Kevin De Bruyne",stat:105,statType:"Assists"},{player:"James Milner",stat:66,statType:"Assists"},{player:"Christian Eriksen",stat:69,statType:"Assists"},{player:"Mesut Özil",stat:77,statType:"Assists"},
  ]},
  { day:7, theme:"Liverpool Club Legends – Goals", cards:[
    {player:"Ian Rush",stat:346,statType:"Goals",club:"Liverpool"},{player:"Emlyn Hughes",stat:72,statType:"Goals",club:"Liverpool"},{player:"Billy Liddell",stat:228,statType:"Goals",club:"Liverpool"},{player:"Kenny Dalglish",stat:172,statType:"Goals",club:"Liverpool"},{player:"Michael Owen",stat:158,statType:"Goals",club:"Liverpool"},{player:"Robbie Fowler",stat:183,statType:"Goals",club:"Liverpool"},{player:"Steven Gerrard",stat:185,statType:"Goals",club:"Liverpool"},{player:"Harry Chambers",stat:151,statType:"Goals",club:"Liverpool"},{player:"Mohamed Salah",stat:200,statType:"Goals",club:"Liverpool"},{player:"Roger Hunt",stat:285,statType:"Goals",club:"Liverpool"},{player:"Gordon Hodgson",stat:241,statType:"Goals",club:"Liverpool"},
  ]},
  { day:8, theme:"World Cup Clean Sheets – All Time", cards:[
    {player:"Peter Shilton",stat:10,statType:"Clean Sheets"},{player:"José Luis Chilavert",stat:5,statType:"Clean Sheets"},{player:"Gordon Banks",stat:7,statType:"Clean Sheets"},{player:"Claudio Taffarel",stat:6,statType:"Clean Sheets"},{player:"Sepp Maier",stat:9,statType:"Clean Sheets"},{player:"Oliver Kahn",stat:6,statType:"Clean Sheets"},{player:"Iker Casillas",stat:6,statType:"Clean Sheets"},{player:"Manuel Neuer",stat:6,statType:"Clean Sheets"},{player:"Dino Zoff",stat:9,statType:"Clean Sheets"},{player:"Fabien Barthez",stat:10,statType:"Clean Sheets"},{player:"Gianluigi Buffon",stat:8,statType:"Clean Sheets"},
  ]},
  { day:9, theme:"Champions League Single-Season Scorers", cards:[
    {player:"Cristiano Ronaldo",stat:17,statType:"Goals",club:"Real Madrid",season:"2013/14"},{player:"Zlatan Ibrahimović",stat:10,statType:"Goals",club:"Barcelona",season:"2009/10"},{player:"Andriy Shevchenko",stat:15,statType:"Goals",club:"AC Milan",season:"1998/99"},{player:"David Villa",stat:12,statType:"Goals",club:"Barcelona",season:"2010/11"},{player:"Robert Lewandowski",stat:15,statType:"Goals",club:"Bayern Munich",season:"2019/20"},{player:"Karim Benzema",stat:15,statType:"Goals",club:"Real Madrid",season:"2021/22"},{player:"Lionel Messi",stat:14,statType:"Goals",club:"Barcelona",season:"2011/12"},{player:"Raúl",stat:14,statType:"Goals",club:"Real Madrid",season:"2000/01"},{player:"Luís Figo",stat:12,statType:"Goals",club:"Real Madrid",season:"2000/01"},{player:"Thierry Henry",stat:10,statType:"Goals",club:"Arsenal",season:"2005/06"},{player:"Erling Haaland",stat:12,statType:"Goals",club:"Man City",season:"2022/23"},
  ]},
  { day:10, theme:"Mixed Seasons – Goals & Clean Sheets", cards:[
    {player:"Petr Čech",stat:24,statType:"Clean Sheets",club:"Chelsea",season:"2004/05"},{player:"Joe Hart",stat:20,statType:"Clean Sheets",club:"Man City",season:"2011/12"},{player:"Alan Shearer",stat:34,statType:"Goals",club:"Blackburn",season:"1994/95"},{player:"Didier Drogba",stat:29,statType:"Goals",club:"Chelsea",season:"2009/10"},{player:"Edwin van der Sar",stat:21,statType:"Clean Sheets",club:"Man United",season:"2008/09"},{player:"Thierry Henry",stat:30,statType:"Goals",club:"Arsenal",season:"2003/04"},{player:"Cristiano Ronaldo",stat:31,statType:"Goals",club:"Man United",season:"2007/08"},{player:"David de Gea",stat:18,statType:"Clean Sheets",club:"Man United",season:"2012/13"},{player:"Sergio Agüero",stat:23,statType:"Goals",club:"Man City",season:"2014/15"},{player:"Mohamed Salah",stat:32,statType:"Goals",club:"Liverpool",season:"2017/18"},{player:"Nick Pope",stat:14,statType:"Clean Sheets",club:"Newcastle",season:"2022/23"},
  ]},
];

// ── ORDERING ──────────────────────────────────────────────────────────────────
function smartOrder(rawCards) {
  const cards = rawCards.slice(0, 11); // always 11 → 10 guesses
  const sorted = [...cards].sort((a,b)=>a.stat-b.stat);
  const n = sorted.length;
  const low  = sorted.slice(0, Math.floor(n*0.4)).sort(()=>Math.random()-0.5);
  const high = sorted.slice(Math.floor(n*0.7)).sort(()=>Math.random()-0.5);
  const mid  = sorted.slice(Math.floor(n*0.4), Math.floor(n*0.7)).sort(()=>Math.random()-0.5);
  const close = [...sorted].slice(Math.floor(n*0.3), Math.floor(n*0.7)).sort(()=>Math.random()-0.5).slice(0,3);
  const midRem = [...mid,...low.slice(1),...high.slice(1)].filter(c=>!close.includes(c)).sort(()=>Math.random()-0.5);
  const seq = [low[0]||sorted[0]];
  const hp=high[0]||sorted[n-1]; if(!seq.includes(hp)) seq.push(hp);
  const l2=low[1]||sorted[1];   if(!seq.includes(l2)) seq.push(l2);
  for(const c of midRem){if(seq.length>=7)break;if(!seq.includes(c))seq.push(c);}
  for(const c of close){if(!seq.includes(c))seq.push(c);}
  const used=new Set(seq);
  for(const c of cards){if(seq.length>=cards.length)break;if(!used.has(c)){seq.push(c);used.add(c);}}
  for(let i=1;i<seq.length;i++){
    if(seq[i].stat===seq[i-1].stat){
      for(let j=i+1;j<seq.length;j++){if(seq[j].stat!==seq[i-1].stat){[seq[i],seq[j]]=[seq[j],seq[i]];break;}}
    }
  }
  return seq;
}

// Moderate difficulty shuffle: interleave high/mid/low stat cards so consecutive
// pairs have a mix of obvious and close gaps — avoids all-easy or all-hard runs.
// Difficulty note: CLOSE stats = HARD (8 vs 7 goals), FAR apart = EASY (260 vs 8).
// We enforce a MAX_GAP to prevent trivially obvious pairs where the answer is
// a foregone conclusion (e.g. 260 goals vs 0 goals). Tight pairs are allowed —
// they are the hard, interesting questions.
function rushShuffle(cards){
  if(!cards||cards.length<2) return cards;
  const sorted=[...cards].sort((a,b)=>a.stat-b.stat);
  const n=sorted.length;
  // Difficulty is enforced per-card via ratio (see Pass 2 below) — no global range needed
  const lo=sorted.slice(0,Math.floor(n*0.33));
  const mid=sorted.slice(Math.floor(n*0.33),Math.floor(n*0.66));
  const hi=sorted.slice(Math.floor(n*0.66));
  [lo,mid,hi].forEach(arr=>{for(let i=arr.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[arr[i],arr[j]]=[arr[j],arr[i]];}});
  const out=[];
  const maxLen=Math.max(lo.length,mid.length,hi.length);
  for(let i=0;i<maxLen;i++){
    if(lo[i])out.push(lo[i]);
    if(hi[i])out.push(hi[i]);
    if(mid[i])out.push(mid[i]);
  }
  // Pass 1: fix identical stats (equal stats = unguessable, always remove)
  for(let i=1;i<out.length;i++){
    if(out[i].stat===out[i-1].stat){
      let swapped=false;
      for(let j=i+1;j<out.length;j++){
        if(out[j].stat!==out[i-1].stat){[out[i],out[j]]=[out[j],out[i]];swapped=true;break;}
      }
      if(!swapped){out.splice(i,1);i--;}
    }
  }
  // Pass 2: enforce per-card relative difficulty.
  // Gap is measured as a ratio of the LARGER of the two stats — this is card-by-card,
  // not against the overall range. e.g. 260 vs 160 = 62% of 260 = easy (swap it out).
  // 80 vs 60 = 25% of 80 = reasonable. 8 vs 7 = 12% of 8 = hard (keep it, that's good).
  // MAX_RATIO = 0.50 means the smaller stat must be at least 50% of the larger.
  const MAX_RATIO = 0.50; // second card must be within 50% of the first card's value
  for(let i=1;i<out.length;i++){
    const larger = Math.max(out[i].stat, out[i-1].stat);
    const smaller = Math.min(out[i].stat, out[i-1].stat);
    // ratio = smaller/larger; low ratio = easy (far apart); high ratio = hard (close)
    const ratio = larger>0 ? smaller/larger : 1;
    if(ratio < MAX_RATIO){ // too easy — gap is too wide for this card's value
      for(let j=i+1;j<out.length;j++){
        const lg2 = Math.max(out[j].stat, out[i-1].stat);
        const sm2 = Math.min(out[j].stat, out[i-1].stat);
        const r2  = lg2>0 ? sm2/lg2 : 1;
        if(r2 >= MAX_RATIO && out[j].stat!==out[i-1].stat){
          [out[i],out[j]]=[out[j],out[i]];
          break;
        }
      }
      // If no suitable swap found, leave in place
    }
  }
  return out;
}

// ── LEADERBOARD ───────────────────────────────────────────────────────────────
const SIM_NAMES=["FootballFanatic88","GoalMachine","ThreeLions","TikiTaka","AnfieldRoad","BernabéuDreams","CampNouKing","OldTraffordOG","WembleyWizard","ChampionsLeagueChris","WorldCupWatcher","PremierLeaguePro","SetPieceSam","OffsideTrap","PenaltySpotPete","FreeKickFred","HeaderKing","GoldenGloveGary","TopBinTerry","HatTrickHero"];
function buildLeaderboard(scores,username){
  const name=username||"You";
  const sim=SIM_NAMES.map(n=>{let h=0;for(const c of n)h=(h*31+c.charCodeAt(0))&0xffff;return{name:n,score:2+(h%12),isYou:false};});
  const best=scores.length?Math.max(...scores):null;
  const loc=best!==null?[{name,score:best,isYou:true}]:[];
  return[...sim,...loc].sort((a,b)=>b.score-a.score).slice(0,20).map((e,i)=>({...e,rank:i+1}));
}


// ── DESIGN SYSTEM ─────────────────────────────────────────────────────────────
const S = {
  // Backgrounds — mid-slate, not pure black
  bg:        "#0f1923",   // deep navy-slate
  bgCard:    "#ffffff",   // white cards
  bgCardAlt: "#f8fafc",   // off-white for nested areas
  bgSurface: "#1a2535",   // elevated surface
  bgInput:   "#f1f5f9",

  // Borders
  border:    "#e2e8f0",
  borderDark:"#2a3a50",

  // Brand colours
  green:     "#16a34a",   // football pitch green — primary
  greenLight:"#22c55e",
  greenBg:   "#f0fdf4",
  greenBorder:"#bbf7d0",

  amber:     "#d97706",   // caps / career gold
  amberLight:"#f59e0b",
  amberBg:   "#fffbeb",
  amberBorder:"#fde68a",

  blue:      "#2563eb",   // Training Pitch accent
  blueLight: "#3b82f6",
  blueBg:    "#eff6ff",
  blueBorder:"#bfdbfe",

  red:       "#dc2626",
  redBg:     "#fef2f2",
  redBorder: "#fecaca",

  // Text
  textBright:"#0f172a",   // near-black on white
  textMid:   "#475569",
  textDim:   "#94a3b8",
  textOnDark:"#f1f5f9",
  textDimDark:"#64748b",

  // Legacy aliases (keep game logic working)
  gold:      "#d97706",
  goldDim:   "#b45309",
  teal:      "#2563eb",
  tealLight: "#3b82f6",
  accent:    "#16a34a",
  accentDim: "#15803d",
};

function PageWrap({children, glow="default"}) {
  // Subtle top gradient per mode
  const topBar = glow==="gold"  ? "linear-gradient(90deg,#be185d,#ec4899)"
               : glow==="red"   ? "linear-gradient(90deg,#dc2626,#ef4444)"
               : glow==="cyan"  ? "linear-gradient(90deg,#2563eb,#3b82f6)"
               :                  "linear-gradient(90deg,#16a34a,#22c55e)";
  return (
    <div style={{minHeight:"100vh",background:S.bg,fontFamily:"'Inter',sans-serif",position:"relative"}}>
      {/* Top colour bar */}
      <div style={{position:"fixed",top:0,left:0,right:0,height:3,background:topBar,zIndex:10}}/>
      {/* Subtle pitch texture — faint diagonal lines */}
      <div style={{position:"fixed",inset:0,backgroundImage:"repeating-linear-gradient(160deg,transparent,transparent 60px,rgba(255,255,255,0.018) 60px,rgba(255,255,255,0.018) 61px)",pointerEvents:"none",zIndex:0}}/>
      <div style={{position:"relative",zIndex:1,display:"flex",flexDirection:"column",alignItems:"center",padding:"24px 16px 48px",maxWidth:460,margin:"0 auto"}}>
        {children}
      </div>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Bebas+Neue&family=Barlow+Condensed:wght@600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; }
        @keyframes timerPulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.8;transform:scale(1.08)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes popIn{0%{transform:scale(0.94);opacity:0}60%{transform:scale(1.03)}100%{transform:scale(1);opacity:1}}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.55}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
      `}</style>
    </div>
  );
}

// White surface card — the primary container unit
function Card({children, style={}, variant="default"}) {
  const variants = {
    default: { bg:"#ffffff",      border:"#e2e8f0", shadow:"0 1px 4px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)" },
    active:  { bg:"#ffffff",      border:"#86efac", shadow:"0 0 0 2px #16a34a22, 0 4px 20px rgba(22,163,74,0.12)" },
    gold:    { bg:"#fffbeb",      border:"#fde68a", shadow:"0 0 0 2px #d9770618, 0 4px 20px rgba(217,119,6,0.1)" },
    green:   { bg:"#f0fdf4",      border:"#bbf7d0", shadow:"0 0 0 2px #16a34a18, 0 4px 16px rgba(22,163,74,0.1)" },
    red:     { bg:"#fef2f2",      border:"#fecaca", shadow:"0 0 0 2px #dc262618, 0 4px 16px rgba(220,38,38,0.1)" },
    dark:    { bg:"#1a2535",      border:"#2a3a50", shadow:"0 4px 20px rgba(0,0,0,0.3)" },
    pitch:   { bg:"#16a34a",      border:"#15803d", shadow:"0 4px 20px rgba(22,163,74,0.4)" },
  };
  const v = variants[variant]||variants.default;
  return (
    <div style={{background:v.bg,border:`1px solid ${v.border}`,borderRadius:14,boxShadow:v.shadow,position:"relative",overflow:"hidden",...style}}>
      {children}
    </div>
  );
}
const GlowCard = ({children,style={},gold=false,active=false})=>(
  <Card style={style} variant={gold?"gold":active?"active":"default"}>{children}</Card>
);

// Stat display panel — white card with strong contrast
function StatPanel({card, revealed, flashResult=null}) {
  const isCorrect=flashResult==="correct", isWrong=flashResult==="wrong", isYellow=flashResult==="yellow";

  let bg = "#ffffff";
  let borderCol = "#e2e8f0";
  let numCol = "#0f172a";
  let shadow = "0 2px 8px rgba(0,0,0,0.08)";
  let topAccent = "#e2e8f0";

  if(revealed && !flashResult) { borderCol="#93c5fd"; topAccent="#3b82f6"; numCol="#1d4ed8"; shadow="0 0 0 2px #3b82f618, 0 4px 16px rgba(59,130,246,0.15)"; }
  if(isCorrect) { bg="#f0fdf4"; borderCol="#86efac"; topAccent="#16a34a"; numCol="#15803d"; shadow="0 0 0 2px #16a34a22, 0 6px 24px rgba(22,163,74,0.25)"; }
  if(isWrong)   { bg="#fef2f2"; borderCol="#fca5a5"; topAccent="#dc2626"; numCol="#dc2626"; shadow="0 0 0 2px #dc262622, 0 6px 24px rgba(220,38,38,0.25)"; }
  if(isYellow)  { bg="#fffbeb"; borderCol="#fde68a"; topAccent="#d97706"; numCol="#b45309"; shadow="0 0 0 2px #d9770622, 0 6px 24px rgba(217,119,6,0.25)"; }

  return (
    <div style={{width:155,minHeight:200,background:bg,border:`1.5px solid ${borderCol}`,borderRadius:14,boxShadow:shadow,display:"flex",flexDirection:"column",alignItems:"center",padding:"0 0 14px",position:"relative",overflow:"hidden",transition:"border-color 0.25s,box-shadow 0.25s,background 0.25s"}}>
      {/* Top colour accent bar */}
      <div style={{width:"100%",height:4,background:topAccent,transition:"background 0.25s",marginBottom:14,flexShrink:0}}/>
      {/* Player name */}
      <div style={{fontSize:13,fontWeight:800,color:"#0f172a",letterSpacing:0.3,lineHeight:1.2,textAlign:"center",width:"100%",padding:"0 10px",marginBottom:2,fontFamily:"'Oswald',sans-serif",textTransform:"uppercase"}}>{card.player}</div>
      {card.club
        ? <div style={{fontSize:8,color:"#94a3b8",letterSpacing:1.5,textTransform:"uppercase",marginBottom:8,textAlign:"center",fontWeight:700,padding:"0 8px"}}>{card.club}{card.season?` · ${card.season}`:""}</div>
        : <div style={{marginBottom:10}}/>}
      {/* Stat number */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",width:"100%",padding:"0 10px"}}>
        {revealed
          ? <div style={{fontSize:56,fontWeight:900,color:numCol,lineHeight:1,fontFamily:"'Oswald',sans-serif",transition:"color 0.25s"}}>{card.stat}</div>
          : <div style={{fontSize:28,fontWeight:700,color:"#cbd5e1",lineHeight:1,letterSpacing:6,fontFamily:"'Oswald',sans-serif"}}>???</div>}
      </div>
      {/* Divider */}
      <div style={{width:"50%",height:1,background:"#e2e8f0",margin:"10px 0",transition:"background 0.25s"}}/>
      {/* Stat type */}
      <div style={{fontSize:9,fontWeight:700,color:"#64748b",letterSpacing:2,textTransform:"uppercase",textAlign:"center"}}>
        {STAT_ICONS[card.statType]||"📊"} {card.statType}
      </div>
    </div>
  );
}

// Progress dots — daily only
function ProgressDots({current, result, yellowCardIdx}) {
  return (
    <div style={{display:"flex",gap:5,alignItems:"center",justifyContent:"center",marginBottom:14}}>
      {Array.from({length:10}).map((_,i)=>{
        let bg="#e2e8f0", borderC="#cbd5e1", cnt=i+1, col="#94a3b8", fs=9;
        if(i<current)                       {bg="#dcfce7";borderC="#86efac";cnt="✓";col="#16a34a";fs=10;}
        if(i===yellowCardIdx&&i<current)    {bg="#fef9c3";borderC="#fde047";cnt="🟨";col="#ca8a04";fs=10;}
        if(i===current&&result===null)      {bg="#dbeafe";borderC="#93c5fd";col="#2563eb";}
        if(i===current&&result==="correct") {bg="#dcfce7";borderC="#86efac";cnt="✓";col="#16a34a";fs=10;}
        if(i===current&&result==="wrong")   {bg="#fee2e2";borderC="#fca5a5";cnt="✗";col="#dc2626";fs=10;}
        if(i===current&&result==="yellow")  {bg="#fef9c3";borderC="#fde047";cnt="🟨";col="#ca8a04";fs=10;}
        return <div key={i} style={{width:26,height:26,borderRadius:"50%",background:bg,border:`1.5px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs,color:col,fontWeight:800,transition:"all 0.2s",fontFamily:"'Barlow Condensed',sans-serif"}}>{cnt}</div>;
      })}
    </div>
  );
}

function DailyResultDots({resultData}) {
  return (
    <div style={{display:"flex",gap:4,alignItems:"center",justifyContent:"center",flexWrap:"nowrap",width:"100%"}}>
      {Array.from({length:10}).map((_,i)=>{
        const r=resultData[i]||null;
        let bg="#e2e8f0", borderC="#cbd5e1", cnt=i+1, col="#94a3b8", fs=8;
        if(r==="correct"){bg="#dcfce7";borderC="#86efac";cnt="✓";col="#16a34a";fs=9;}
        if(r==="yellow") {bg="#fef9c3";borderC="#fde047";cnt="🟨";col="#ca8a04";fs=9;}
        if(r==="wrong")  {bg="#fee2e2";borderC="#fca5a5";cnt="🟥";col="#dc2626";fs=9;}
        return <div key={i} style={{width:24,height:24,flexShrink:0,borderRadius:"50%",background:bg,border:`1.5px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs,color:col,fontWeight:800,fontFamily:"'Barlow Condensed',sans-serif"}}>{cnt}</div>;
      })}
    </div>
  );
}

function YellowCardOverlay({onWatchAd,onDecline}) {
  const [watching,setWatching]=useState(false);
  const [cd,setCd]=useState(5);
  const ref=useRef();
  function startAd(){setWatching(true);setCd(5);ref.current=setInterval(()=>setCd(c=>{if(c<=1){clearInterval(ref.current);onWatchAd();return 0;}return c-1;}),1000);}
  useEffect(()=>()=>clearInterval(ref.current),[]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.85)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"0 20px",backdropFilter:"blur(6px)"}}>
      <div style={{background:"#ffffff",borderRadius:20,padding:"28px 24px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
        {/* Yellow card graphic */}
        <div style={{width:52,height:68,background:"linear-gradient(160deg,#fbbf24,#d97706)",borderRadius:8,margin:"0 auto 16px",boxShadow:"0 4px 20px rgba(219,39,119,0.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <div style={{width:38,height:50,background:"linear-gradient(160deg,#fde68a,#fbbf24)",borderRadius:5}}/>
        </div>
        <div style={{color:"#92400e",fontWeight:900,fontSize:22,letterSpacing:1,marginBottom:6,fontFamily:"'Oswald',sans-serif",textTransform:"uppercase"}}>Yellow Card</div>
        <div style={{color:"#64748b",fontSize:13,marginBottom:20,lineHeight:1.6}}>Wrong answer — watch a short ad to stay on the pitch.<br/><span style={{color:"#dc2626",fontWeight:700,fontSize:12}}>Another wrong = 🟥 Red Card</span></div>
        {watching?(
          <div style={{background:"#f8fafc",borderRadius:12,padding:"20px",border:"1px solid #e2e8f0"}}>
            <div style={{color:"#94a3b8",fontSize:9,letterSpacing:3,marginBottom:8,fontWeight:700}}>AD PLAYING</div>
            <div style={{color:"#d97706",fontWeight:900,fontSize:52,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{cd}</div>
            <div style={{color:"#94a3b8",fontSize:11,marginTop:6}}>Resuming your match...</div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            <button onClick={startAd} style={{padding:"14px",background:"#16a34a",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:900,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif",boxShadow:"0 4px 16px rgba(22,163,74,0.4)"}}>📺 Watch Ad &amp; Continue</button>
            <button onClick={onDecline} style={{padding:"11px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,color:"#94a3b8",fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"'Barlow Condensed',sans-serif"}}>🟥 End Match</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Score messages for daily result
const SCORE_MESSAGES = {
  1:["1? That's not a streak… that's a guess 😭","Have you ever watched football?","Tough start. Tomorrow needs a response."],
  2:["2 correct. Early doors and already in trouble…","This might not be your sport…","At least you're on the board."],
  3:["3… we'll call that a warm-up.","We go again tomorrow 😭","Some signs of life."],
  4:["4. Respectable. Just not that respectable.","Mid. Painfully mid.","Close to decent… not quite there."],
  5:["5. Bang average. Right down the middle.","NPC performance.","Halfway there. Could go either way."],
  6:["6. You know your stuff… kind of.","Getting warmer 👀","Decent effort. Room to push on."],
  7:["7. Solid. Quietly impressive 👀","Now we're talking.","Good level. You know ball."],
  8:["8. Now we're talking. Proper knowledge.","Serious baller knowledge 👏","Top performance. Nearly elite."],
  9:["9… bottled the 10 😬","That's a choke. Unlucky.","So close to perfect… pain."],
  10:["10/10. Different level. Elite ball knowledge 🔥","Perfect. No notes.","You're built for this game."],
};
function getScoreMessage(score) {
  const msgs = SCORE_MESSAGES[Math.min(Math.max(score,1),10)];
  if(!msgs) return null;
  // Pick deterministically per day so everyone sees the same one
  const idx = (new Date().getDate()) % msgs.length;
  return msgs[idx];
}

// ── RUSH RESULT MESSAGES ──────────────────────────────────────────────────────
// Funny football messages relative to personal high score
function getRushMessage(score, catBest) {
  const isNewBest = score > catBest;
  const isEqualBest = score === catBest && catBest > 0;
  const gap = catBest - score;
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  // New best
  if(isNewBest && score === 0) return "You set a new best of zero. Impressive in the worst possible way.";
  if(isNewBest) return pick([
    "Get in. New personal best. Frame it.",
    "That's a new one. Write it down.",
    "New high score. Tell someone who'll appreciate it.",
    "Top of your own charts. For now.",
    "Different level today. New PB.",
    "New PB. The bar just moved.",
    "Personal best smashed. Who are you?",
    "That's the one. New high score.",
  ]);

  // Matched best
  if(isEqualBest) return pick([
    "Matched your best. So close to something special.",
    "Level with your best. Try harder.",
    "Equal PB. The bar remains exactly where you left it.",
    "Matched it. Now go one better.",
    "Same peak. Different day. Push harder.",
    "You've been here before. Time to go further.",
  ]);

  // Score = 0
  if(score === 0) return "Nil-nil. You've achieved absolutely nothing. Respect the process, I suppose.";

  // Below best — 3 rotating variants per bucket
  if(gap >= 10) return pick([
    "You've been much better than this. Have a word with yourself.",
    "This isn't you. Where did you go?",
    "A disaster by your standards. Regroup.",
  ]);
  if(gap >= 7) return pick([
    "A shadow of your former self today. Disappointing.",
    "Well below your best. Rough one.",
    "You've forgotten how good you are.",
  ]);
  if(gap >= 5) return pick([
    "Off the pace. Your best self would be embarrassed.",
    "Not your day. Try again.",
    "You've done better. Significantly.",
  ]);
  if(gap >= 3) return pick([
    `${gap} short of your best. You're better than this and you know it.`,
    "Close but no cigar. Again.",
    "Getting there. Just not today.",
  ]);
  if(gap === 2) return pick([
    "Two off your best. Tantalisingly close. Annoyingly so.",
    "Two away. You were right there.",
    "Nearly. Not quite. Painful.",
  ]);
  if(gap === 1) return pick([
    "One short of your best. One. Imagine how that feels.",
    "One away. Absolutely gutting.",
    "So close it hurts. Go again.",
  ]);

  // No best yet (catBest === 0)
  if(catBest === 0 && score === 0) return "Why are you here? Actually, why are you here?";
  if(catBest === 0 && score <= 2)  return "A few more hours on the training pitch and you might be dangerous.";
  if(catBest === 0 && score <= 5)  return "Decent start. Room to grow. A lot of room.";
  if(catBest === 0)                return "Solid first run. The data is in. Now beat it.";

  return "Go again.";
}

// ── TRAINING PITCH PAGE ───────────────────────────────────────────────────────
function RushPage({onBack, onPlay, onLeaderboard}) {
  return (
    <PageWrap glow="gold">
      <div style={{width:"100%"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.7)",fontSize:11,cursor:"pointer",padding:"8px 12px",fontFamily:"'Inter',sans-serif",fontWeight:600,flexShrink:0}}>← Back</button>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>StatStreaks</div>
            <div style={{fontSize:26,fontWeight:900,color:"#ffffff",fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,letterSpacing:1}}>Training Pitch</div>
          </div>
        </div>

        {/* Mode explainer — magenta gradient */}
        <div style={{background:"linear-gradient(135deg,#be185d,#db2777)",borderRadius:14,padding:"16px",marginBottom:16,boxShadow:"0 4px 20px rgba(219,39,119,0.45), inset 0 1px 0 rgba(255,255,255,0.15)"}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.65)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",marginBottom:4,fontFamily:"'Inter',sans-serif"}}>How it works</div>
          <div style={{color:"#ffffff",fontWeight:800,fontSize:15,marginBottom:4,fontFamily:"'Inter',sans-serif"}}>30 seconds — go for perfect ⚡</div>
          <div style={{color:"rgba(255,255,255,0.75)",fontSize:12,lineHeight:1.5,fontFamily:"'Inter',sans-serif"}}>Score as many as you can. Zero mistakes = <strong style={{color:"#fde047"}}>2× score</strong>. Pick a category below.</div>
        </div>

        {/* Category grid — sorted by personal best descending, unplayed categories last */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[...RUSH_CATEGORIES].sort((a,b)=>{
            const ba=lsGet(`rush_best_${a.id}`,0);
            const bb=lsGet(`rush_best_${b.id}`,0);
            if(bb!==ba) return bb-ba; // higher best first
            return 0; // preserve original order for ties/unplayed
          }).map(cat=>{
            const catBest=lsGet(`rush_best_${cat.id}`,0);
            return(
              <button key={cat.id} onClick={()=>onPlay(cat.id)} style={{padding:"0",background:"#ffffff",border:"1px solid #e2e8f0",borderRadius:14,cursor:"pointer",textAlign:"left",transition:"transform 0.1s,box-shadow 0.1s",overflow:"hidden",boxShadow:"0 2px 8px rgba(0,0,0,0.08)"}}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 24px rgba(0,0,0,0.15)`;}}
                onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,0.08)";}}>
                <div style={{height:4,background:cat.color,width:"100%"}}/>
                <div style={{padding:"12px 12px 10px"}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:8}}>
                    <span style={{fontSize:18}}>{cat.icon}</span>
                    <span style={{fontSize:12,fontWeight:800,color:"#0f172a",fontFamily:"'Inter',sans-serif"}}>{cat.label}</span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:10,color:catBest>0?cat.color:"#94a3b8",fontWeight:700,fontFamily:"'Inter',sans-serif"}}>{catBest>0?`Best: ${catBest}`:"No score yet"}</span>
                    <span style={{fontSize:9,color:"#94a3b8",fontWeight:600,fontFamily:"'Inter',sans-serif"}}>avg {cat.globalAvg}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </PageWrap>
  );
}

// ── LEADERBOARD PAGE ──────────────────────────────────────────────────────────
function LeaderboardScreen({onBack,rushScores,username,onSetUsername}){
  const [editing,setEditing]=useState(false);
  const [draft,setDraft]=useState(username||"");
  const board=buildLeaderboard(rushScores,username);
  const best=rushScores.length?Math.max(...rushScores):0;
  const youEntry=board.find(e=>e.isYou);
  function save(){const t=draft.trim().slice(0,20);if(t){onSetUsername(t);setEditing(false);}}
  return(
    <PageWrap>
      <div style={{width:"100%"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.7)",fontSize:11,cursor:"pointer",padding:"8px 12px",fontFamily:"'Barlow Condensed',sans-serif",fontWeight:700,letterSpacing:1.5,textTransform:"uppercase",flexShrink:0}}>← Back</button>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:3,fontWeight:700,textTransform:"uppercase"}}>Training Pitch</div>
            <div style={{fontSize:26,fontWeight:900,color:"#ffffff",fontFamily:"'Oswald',sans-serif",lineHeight:1}}>Leaderboard</div>
          </div>
        </div>

        {/* Name card */}
        <div style={{background:"#ffffff",borderRadius:14,padding:"14px 16px",marginBottom:10,boxShadow:"0 4px 16px rgba(0,0,0,0.15)"}}>
          <div style={{color:"#94a3b8",fontSize:9,letterSpacing:2,marginBottom:8,fontWeight:700,textTransform:"uppercase"}}>Your Name</div>
          {editing?(
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <input value={draft} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} maxLength={20} placeholder="Enter your name..." autoFocus
                style={{flex:1,background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:8,padding:"9px 12px",color:"#0f172a",fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,outline:"none"}}/>
              <button onClick={save} style={{padding:"9px 16px",background:"#16a34a",border:"none",borderRadius:8,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:800,letterSpacing:1,cursor:"pointer"}}>SAVE</button>
            </div>
          ):(
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div style={{color:username?"#0f172a":"#94a3b8",fontWeight:900,fontSize:18}}>{username||"— tap to set —"}</div>
              <button onClick={()=>{setDraft(username||"");setEditing(true);}} style={{padding:"6px 12px",background:"#f1f5f9",border:"1px solid #e2e8f0",borderRadius:7,color:"#475569",fontFamily:"'Barlow Condensed',sans-serif",fontSize:11,fontWeight:700,letterSpacing:1,cursor:"pointer"}}>{username?"EDIT":"SET"}</button>
            </div>
          )}
        </div>

        {youEntry&&(
          <div style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"1px solid #fde68a",borderRadius:14,padding:"12px 16px",marginBottom:10,boxShadow:"0 4px 16px rgba(217,119,6,0.15)"}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
              <div><div style={{color:"#92400e",fontSize:9,letterSpacing:2,fontWeight:700,marginBottom:2,textTransform:"uppercase"}}>Your Rank</div><div style={{color:"#d97706",fontWeight:900,fontSize:32,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>#{youEntry.rank}</div></div>
              <div style={{textAlign:"right"}}><div style={{color:"#92400e",fontSize:9,letterSpacing:2,marginBottom:2,fontWeight:700,textTransform:"uppercase"}}>Best Score</div><div style={{color:"#d97706",fontWeight:900,fontSize:32,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{best}</div></div>
            </div>
          </div>
        )}

        <div style={{background:"#ffffff",borderRadius:14,overflow:"hidden",boxShadow:"0 4px 16px rgba(0,0,0,0.1)"}}>
          <div style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid #f1f5f9",background:"#f8fafc"}}>
            <div style={{width:34,color:"#94a3b8",fontSize:9,letterSpacing:1,fontWeight:700,textTransform:"uppercase"}}>#</div>
            <div style={{flex:1,color:"#94a3b8",fontSize:9,letterSpacing:1,fontWeight:700,textTransform:"uppercase"}}>Player</div>
            <div style={{width:55,textAlign:"right",color:"#94a3b8",fontSize:9,letterSpacing:1,fontWeight:700,textTransform:"uppercase"}}>Score</div>
          </div>
          {board.map((e,i)=>{
            const medal=i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
            return(<div key={i} style={{display:"flex",alignItems:"center",padding:"11px 16px",borderBottom:i<board.length-1?"1px solid #f1f5f9":"none",background:e.isYou?"#f0fdf4":"#ffffff"}}>
              <div style={{width:34,fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:medal?15:12,color:i===0?"#d97706":i===1?"#64748b":i===2?"#b45309":"#cbd5e1"}}>{medal||e.rank}</div>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontWeight:e.isYou?800:600,fontSize:14,color:e.isYou?"#16a34a":"#334155"}}>{e.name}{e.isYou&&<span style={{fontSize:9,color:"#16a34a",marginLeft:6,background:"#dcfce7",padding:"2px 6px",borderRadius:4,fontWeight:800}}>YOU</span>}</div>
              </div>
              <div style={{width:55,textAlign:"right",fontFamily:"'Oswald',sans-serif",fontWeight:700,fontSize:20,color:e.isYou?"#16a34a":i<3?"#0f172a":"#94a3b8"}}>{e.score}</div>
            </div>);
          })}
        </div>
        <div style={{textAlign:"center",marginTop:12,color:"rgba(255,255,255,0.3)",fontSize:10,letterSpacing:1}}>Global scores are simulated for this demo</div>
      </div>
    </PageWrap>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
// ── PASSWORD GATE ─────────────────────────────────────────────────────────────
const PASSWORD = "bottlers";

function PasswordGate({ onUnlock }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);

  function attempt() {
    if (input.trim().toLowerCase() === PASSWORD) {
      lsSet("unlocked", true);
      onUnlock();
    } else {
      setError(true);
      setShake(true);
      setInput("");
      setTimeout(() => setShake(false), 600);
    }
  }

  return (
    <PageWrap>
      <style>{`
        @keyframes shake {
          0%,100%{transform:translateX(0)}
          20%{transform:translateX(-8px)}
          40%{transform:translateX(8px)}
          60%{transform:translateX(-6px)}
          80%{transform:translateX(6px)}
        }
        .shake { animation: shake 0.5s ease; }
      `}</style>
      <div style={{ width:"100%", maxWidth:360, marginTop:60, textAlign:"center" }}>
        <div style={{ marginBottom:8, fontSize:11, color:S.textDim, letterSpacing:4, fontWeight:700 }}>
          🔒 PRIVATE BETA
        </div>
        <h1 style={{
          fontSize:48, fontWeight:900, letterSpacing:2, margin:"0 0 6px",
          background:"linear-gradient(90deg,#0d9488,#14b8a6,#5eead4)",
          WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent"
        }}>
          StatStreaks
        </h1>
        <div style={{ color:S.textDim, fontSize:14, marginBottom:40 }}>
          The higher or lower football game
        </div>
        <GlowCard style={{ padding:28 }} active>
          <div style={{ color:S.textMid, fontSize:13, letterSpacing:2, fontWeight:700, marginBottom:20 }}>
            ENTER PASSWORD
          </div>
          <input
            value={input}
            onChange={e => { setInput(e.target.value); setError(false); }}
            onKeyDown={e => e.key === "Enter" && attempt()}
            type="password"
            placeholder="Password..."
            autoFocus
            className={shake ? "shake" : ""}
            style={{
              width:"100%", boxSizing:"border-box",
              background:"#040f0a", border:`1px solid ${error ? "#ef4444" : "#1a4a38"}`,
              borderRadius:10, padding:"12px 16px",
              color: error ? "#ef4444" : S.textBright,
              fontFamily:"'Barlow Condensed',sans-serif",
              fontSize:18, fontWeight:700, outline:"none",
              textAlign:"center", letterSpacing:3,
              transition:"border-color 0.2s", marginBottom:8,
            }}
          />
          <div style={{ height:18, marginBottom:14, color:"#ef4444", fontSize:12, fontWeight:700, letterSpacing:1 }}>
            {error ? "❌ WRONG PASSWORD — TRY AGAIN" : ""}
          </div>
          <button
            onClick={attempt}
            style={{
              width:"100%", padding:"13px 0",
              background:"linear-gradient(135deg,#0f766e,#0d9488)",
              border:"none", borderRadius:10,
              color:"#fff", fontFamily:"'Barlow Condensed',sans-serif",
              fontSize:16, fontWeight:800, letterSpacing:2,
              cursor:"pointer",
            }}
          >
            ENTER →
          </button>
        </GlowCard>
        <div style={{ color:S.textDim, fontSize:11, marginTop:20, letterSpacing:1 }}>
          Got the password from a friend? You're in the right place.
        </div>
      </div>
    </PageWrap>
  );
}

function AppWithAuth() {
  const [unlocked, setUnlocked] = useState(() => lsGet("unlocked", false));
  if (!unlocked) return <PasswordGate onUnlock={() => setUnlocked(true)} />;
  return <App />;
}

export default AppWithAuth;

function App(){
  const [screen,setScreen]               = useState("home");
  const [mode,setMode]                   = useState(null);
  const [rushCat,setRushCat]             = useState(null);
  const [cards,setCards]                 = useState([]);
  const [theme,setTheme]                 = useState("");
  const [currentIdx,setCurrentIdx]       = useState(0);
  const [revealedNext,setRevealedNext]   = useState(false);
  const [result,setResult]               = useState(null);
  const [flashResult,setFlashResult]     = useState(null);
  const [gameOutcome,setGameOutcome]     = useState(null);
  const [score,setScore]                 = useState(0);
  const [timeLeft,setTimeLeft]           = useState(TOTAL_TIME);
  const [timerActive,setTimerActive]     = useState(false);
  const [yellowUsed,setYellowUsed]       = useState(false);
  const [showYellow,setShowYellow]       = useState(false);
  const [yellowCardIdx,setYellowCardIdx] = useState(null);
  const [rushScores,setRushScores]       = useState(()=>lsGet("rush_scores",[]));
  const [dailyDone,setDailyDone]         = useState(()=>lsGet("daily_done",""));
  const [dailyResult,setDailyResult]     = useState(()=>lsGet("daily_result",null));
  const [streak,setStreak]               = useState(()=>lsGet("streak",0));
  const [username,setUsernameState]      = useState(()=>lsGet("username",""));
  const [testDayOffset,setTestDayOffset] = useState(0);
  const [latestScore,setLatestScore]     = useState(null);
  const [rawCorrect,setRawCorrect]       = useState(0);  // pre-multiplier correct count for display
  const [prevCatBest,setPrevCatBest]     = useState(0);  // best BEFORE this run saved — for new-best detection
  const [answerLog,setAnswerLog]         = useState([]);
  // Rush monetisation
  const [cleanScore,setCleanScore]       = useState(0);   // score before any continue
  const [continueCount,setContinueCount] = useState(0);   // how many continues used
  const [showRushModal,setShowRushModal] = useState(false); // continue/retry modal
  const [frozenTimeLeft,setFrozenTimeLeft] = useState(0); // time saved when run fails
  const [frozenCards,setFrozenCards]     = useState([]);  // card state saved for continue
  const [frozenIdx,setFrozenIdx]         = useState(0);
  const [countdown,setCountdown]         = useState(null); // 3,2,1 pre-game countdown
  const timeoutRef = useRef();
  // Refs to hold live values for use inside timer/interval callbacks (avoids stale closures)
  const scoreRef   = useRef(0);
  const rushCatRef = useRef(null);
  const continueCountRef = useRef(0);

  function setUsername(n){lsSet("username",n);setUsernameState(n);}
  // Keep refs in sync with state so interval callbacks always read current values
  scoreRef.current = score;
  rushCatRef.current = rushCat;
  continueCountRef.current = continueCount;
  const rushBest=rushScores.length?Math.max(...rushScores):0;
  const todayKey=getTodayKey();
  const todayPlayed=dailyDone===todayKey;
  const todayResult=dailyResult&&dailyResult.key===todayKey?dailyResult.dots:null;
  const effectiveDayIdx=(getDayIndex()+testDayOffset)%DAILY_CHALLENGES.length;
  const todayChallenge=DAILY_CHALLENGES[effectiveDayIdx];
  const tomorrowChallenge=DAILY_CHALLENGES[(effectiveDayIdx+1)%DAILY_CHALLENGES.length];

  // Percentile logic (mocked — wire to real data in prod)
  function getPercentile(s) {
    if(s>=14) return 10;
    if(s>=12) return 20;
    if(s>=10) return 30;
    if(s>=8)  return 50;
    return null; // below threshold — don't show percentile
  }
  function getNextTarget(s) {
    if(s<8)  return {need:8-s,  label:"Top 50%"};
    if(s<10) return {need:10-s, label:"Top 30%"};
    if(s<12) return {need:12-s, label:"Top 20%"};
    if(s<14) return {need:14-s, label:"Top 10%"};
    return null;
  }

  useEffect(()=>{
    if(!timerActive||screen!=="game")return;
    const id=setInterval(()=>{
      setTimeLeft(t=>{
        const next=t-1;
        if(next<=8&&next>0)SFX.tick();
        if(next<=0){clearInterval(id);setTimerActive(false);SFX.timeout();endRushRun("timeout");}
        return next;
      });
    },1000);
    return()=>clearInterval(id);
  },[timerActive,screen]);

  function resetState(){
    setCurrentIdx(0);setRevealedNext(false);setResult(null);setFlashResult(null);
    setGameOutcome(null);setScore(0);setTimeLeft(TOTAL_TIME);setTimerActive(false);
    setYellowUsed(false);setShowYellow(false);setYellowCardIdx(null);setAnswerLog([]);
    setCleanScore(0);setContinueCount(0);setShowRushModal(false);setFrozenTimeLeft(0);
  }

  function launchDaily(){
    GA.dailyStarted(theme);
    SFX.click();
    setCards(smartOrder([...todayChallenge.cards]));
    setTheme(todayChallenge.theme);setMode("daily");resetState();setScreen("game");
    // 3-2-1 countdown
    setCountdown(3);
    setTimeout(()=>setCountdown(2),1000);
    setTimeout(()=>setCountdown(1),2000);
    setTimeout(()=>setCountdown(null),3000);
  }

  function launchRush(cat){
    SFX.click();
    const category=RUSH_CATEGORIES.find(c=>c.id===cat);
    if(!category)return;
    GA.rushStarted(cat);
    setCards(rushShuffle([...category.cards]));
    setTheme(category.label);setMode("rush");setRushCat(cat);
    resetState();setTimerActive(true);setScreen("game");
    setCountdown(3);
    setTimeout(()=>setCountdown(2),1000);
    setTimeout(()=>setCountdown(1),2000);
    setTimeout(()=>setCountdown(null),3000);
  }

  function endRushRun(reason){
    setTimerActive(false);
    if(reason==="timeout"){
      // Use refs to read live values — avoids stale closure from setInterval callback
      const liveScore = scoreRef.current;
      const liveIsPerfect = continueCountRef.current===0;
      const finalScore = liveIsPerfect ? liveScore * 2 : liveScore;
      const finalClean = liveIsPerfect ? finalScore : cleanScore;
      // Capture best BEFORE saving so result screen can detect a new PB correctly
      const preBest = lsGet(`rush_best_${rushCatRef.current||rushCat}`, 0);
      setPrevCatBest(preBest);
      saveRushScore(finalScore, liveIsPerfect);
      setLatestScore(finalScore);
      setRawCorrect(liveScore);  // store pre-multiplier count for result display
      setCleanScore(finalClean);
      setGameOutcome("timeout");
      setScreen("result");
      return;
    }
    // Wrong answer — lock in clean score if first wrong
    if(continueCount===0) setCleanScore(score);
    setFrozenTimeLeft(timeLeft);
    setShowRushModal(true);
  }

  // User watches ad to CONTINUE — resume same run
  function rushContinue(){
    setShowRushModal(false);
    setContinueCount(c=>c+1);
    // Reshuffle remaining cards from current position, keeping score + time
    const remaining=rushShuffle([...cards].slice(currentIdx+1));
    const newCards=[...cards.slice(0,currentIdx+1),...remaining];
    setCards(newCards);
    setResult(null);setFlashResult(null);setRevealedNext(false);
    setTimerActive(true);
  }

  function rushRetry(){
    setShowRushModal(false);
    const category=RUSH_CATEGORIES.find(c=>c.id===rushCat);
    if(!category)return;
    setCards(rushShuffle([...category.cards]));
    setTheme(category.label);
    resetState();setTimerActive(true);setScreen("game");
  }

  // User dismisses modal — go to result (always a non-clean run since they got a wrong answer)
  function rushDismiss(){
    setShowRushModal(false);
    // Capture best BEFORE saving for new-PB detection on result screen
    const preBest = lsGet(`rush_best_${rushCatRef.current||rushCat}`, 0);
    setPrevCatBest(preBest);
    saveRushScore(score, false);
    setLatestScore(score);
    setGameOutcome("lose");
    setScreen("result");
  }

  function finishGame(outcome,finalScore,log){
    setTimerActive(false);
    if(mode==="daily")markDailyPlayed(log||answerLog);
    if(mode==="rush")saveRushScore(finalScore, true);
    setLatestScore(finalScore);
    timeoutRef.current=setTimeout(()=>{setGameOutcome(outcome);setScreen("result");},outcome==="win"?900:1300);
  }

  function handleGuess(guess){
    if(result!==null||(mode==="rush"&&!timerActive))return;
    const cur=cards[currentIdx],next=cards[currentIdx+1];
    if(!next)return;
    const correct=guess==="higher"?next.stat>cur.stat:next.stat<cur.stat;
    SFX.card();setRevealedNext(true);
    setTimeout(()=>{
      if(correct){
        SFX.correct();setFlashResult("correct");setResult("correct");
        const ns=score+1;setScore(ns);
        if(continueCount===0)setCleanScore(ns); // track clean until first continue
        const newLog=[...answerLog,"correct"];setAnswerLog(newLog);
        if(mode==="rush"){
          // Rush: keep going until time runs out — no end on correct
          timeoutRef.current=setTimeout(()=>{setCurrentIdx(i=>i+1);setRevealedNext(false);setResult(null);setFlashResult(null);},900);
        } else {
          if(currentIdx+1>=cards.length-1){SFX.win();finishGame("win",ns,newLog);}
          else{timeoutRef.current=setTimeout(()=>{setCurrentIdx(i=>i+1);setRevealedNext(false);setResult(null);setFlashResult(null);},1200);}
        }
      } else {
        if(mode==="daily"&&!yellowUsed){
          SFX.yellow();setFlashResult("yellow");setResult("yellow");
          setYellowCardIdx(currentIdx);
          const newLog=[...answerLog,"yellow"];setAnswerLog(newLog);
          setTimeout(()=>setShowYellow(true),600);
        } else if(mode==="rush"){
          SFX.wrong();setFlashResult("wrong");setResult("wrong");
          if(continueCount===0)setCleanScore(score); // lock in clean score at first wrong
          // Brief flash then show modal
          setTimeout(()=>endRushRun("wrong"),900);
        } else {
          SFX.wrong();setFlashResult("wrong");setResult("wrong");
          const newLog=[...answerLog,"wrong"];setAnswerLog(newLog);
          finishGame("lose",score,newLog);
        }
      }
    },350);
  }

  function onWatchAd(){setYellowUsed(true);setShowYellow(false);setCurrentIdx(i=>i+1);setRevealedNext(false);setResult(null);setFlashResult(null);}
  function onDeclineAd(){setShowYellow(false);setResult("wrong");setFlashResult("wrong");const nl=[...answerLog,"wrong"];setAnswerLog(nl);finishGame("lose",score,nl);}
  function markDailyPlayed(log){
    lsSet("daily_done",todayKey);setDailyDone(todayKey);
    const ns=streak+1;lsSet("streak",ns);setStreak(ns);
    const r={key:todayKey,dots:log||answerLog};lsSet("daily_result",r);setDailyResult(r);
  }
  function saveRushScore(s, isClean){
    // Read fresh from localStorage to avoid stale closure
    const existing = lsGet("rush_scores", []);
    const u=[s,...existing].slice(0,50);
    lsSet("rush_scores",u);
    setRushScores(u);
    // Use ref for rushCat — this may be called from inside a timer callback (stale closure)
    const cat = rushCatRef.current || rushCat;
    if(cat){
      // Capture previous best BEFORE overwriting so the result screen can compare correctly
      const prev = lsGet(`rush_best_${cat}`,0);
      setPrevCatBest(prev);
      if(s>prev) lsSet(`rush_best_${cat}`,s);
      lsSet(`rush_plays_${cat}`,lsGet(`rush_plays_${cat}`,0)+1);
    }
  }
  useEffect(()=>()=>clearTimeout(timeoutRef.current),[]);

  const currentCard=cards[currentIdx];
  const nextCard=cards[currentIdx+1];

  if(screen==="leaderboard")return <LeaderboardScreen onBack={()=>setScreen("rush")} rushScores={rushScores} username={username} onSetUsername={setUsername}/>;
  if(screen==="rush")return <RushPage onBack={()=>setScreen("home")} onPlay={launchRush} onLeaderboard={()=>setScreen("leaderboard")}/>;

  // ── RUSH CONTINUE MODAL (inline component) ────────────────────────────────
  const RushModal = ()=>{
    const [watching,setWatching] = useState(null); // null | "continue" | "retry"
    const [cd,setCd]             = useState(5);
    const ref = useRef();
    const pct  = getPercentile(score);
    const next = getNextTarget(score);
    const isOnFire = score >= 12;
    const canContinue = frozenTimeLeft > 2; // need at least 2s to be worth continuing

    function startAd(type){
      setWatching(type);setCd(5);
      ref.current=setInterval(()=>setCd(c=>{
        if(c<=1){clearInterval(ref.current);if(type==="continue")rushContinue();else rushRetry();return 0;}
        return c-1;
      }),1000);
    }
    useEffect(()=>()=>clearInterval(ref.current),[]);

    return(
      <div style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.88)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"0 20px",backdropFilter:"blur(6px)"}}>
        <div style={{background:"#ffffff",borderRadius:20,padding:"24px 20px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
          {watching?(
            <div>
              <div style={{color:"#94a3b8",fontSize:9,letterSpacing:3,marginBottom:8,fontWeight:700,textTransform:"uppercase"}}>Ad Playing</div>
              <div style={{color:"#d97706",fontWeight:900,fontSize:52,fontFamily:"'Oswald',sans-serif",lineHeight:1}}>{cd}</div>
              <div style={{color:"#94a3b8",fontSize:11,marginTop:8}}>{watching==="continue"?"Back on the training pitch...":"Setting up again..."}</div>
            </div>
          ):(
            <>
              <div style={{marginBottom:16}}>
                <div style={{width:48,height:48,background:"#fee2e2",borderRadius:12,margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:24}}>😤</div>
                <div style={{color:"#0f172a",fontWeight:900,fontSize:20,marginBottom:4,fontFamily:"'Oswald',sans-serif"}}>Lost Possession</div>
                <div style={{color:"#64748b",fontSize:12,marginBottom:14}}>Watch an ad to recover and keep training</div>
                <div style={{background:"#f8fafc",border:"1px solid #f1f5f9",borderRadius:10,padding:"12px 14px"}}>
                  <div style={{color:"#94a3b8",fontSize:9,letterSpacing:2,marginBottom:6,fontWeight:700,textTransform:"uppercase"}}>Training Score</div>
                  <div style={{color:"#0f172a",fontWeight:900,fontSize:32,fontFamily:"'Oswald',sans-serif",lineHeight:1,marginBottom:6}}>{score}</div>
                  {(()=>{
                    const catBest = lsGet(`rush_best_${rushCatRef.current||rushCat}`,0);
                    const toHigh = catBest>0 ? catBest-score : null;
                    if(catBest>0 && score>=catBest){
                      return <div style={{color:"#16a34a",fontWeight:700,fontSize:12,marginBottom:2}}>🏆 New personal best!</div>;
                    } else if(toHigh!==null && toHigh>0){
                      return <div style={{color:"#d97706",fontWeight:700,fontSize:12,marginBottom:2}}>+{toHigh} to beat your best ({catBest})</div>;
                    } else {
                      return <div style={{color:"#94a3b8",fontSize:11,marginBottom:2}}>No best yet — keep going!</div>;
                    }
                  })()}
                  {continueCount>0&&<div style={{color:"#94a3b8",fontSize:10,marginTop:8,borderTop:"1px solid #f1f5f9",paddingTop:8}}>Clean run: <strong style={{color:"#16a34a"}}>{cleanScore}</strong> · no mistakes</div>}
                </div>
              </div>
              {canContinue&&(
                <button onClick={()=>startAd("continue")} style={{width:"100%",padding:"13px",background:"#16a34a",border:"none",borderRadius:12,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:900,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",marginBottom:8,boxShadow:"0 4px 16px rgba(22,163,74,0.4)"}}>
                  ▶ Recover Possession <span style={{fontSize:11,opacity:0.8}}>({frozenTimeLeft}s left)</span>
                </button>
              )}
              <button onClick={()=>startAd("retry")} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#be185d,#db2777)",border:"none",borderRadius:12,color:"#fff",fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:900,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",marginBottom:8,boxShadow:"0 4px 12px rgba(219,39,119,0.4)"}}>
                ▶ Train Again ⚡
              </button>
              <button onClick={rushDismiss} style={{width:"100%",padding:"10px",background:"#f8fafc",border:"1px solid #e2e8f0",borderRadius:10,color:"#94a3b8",fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:700,cursor:"pointer"}}>
                See result
              </button>
            </>
          )}
        </div>
      </div>
    );
  };
  // ── SHARED: player caps lookup for subtext (used on home + result) ─────────
  const CAPS_PLAYERS = [
    {caps:1,name:"Steve Morrow",country:"N. Ireland"},{caps:2,name:"Robbie Savage",country:"Wales"},
    {caps:3,name:"Roque Santa Cruz",country:"Paraguay"},{caps:4,name:"Celestine Babayaro",country:"Nigeria"},
    {caps:5,name:"Cyrille Regis",country:"England"},{caps:6,name:"Kevin Hector",country:"England"},
    {caps:7,name:"Tommy Taylor",country:"England"},{caps:8,name:"Darius Vassell",country:"England"},
    {caps:9,name:"Paul Dickov",country:"Scotland"},{caps:10,name:"Robbie Brady",country:"Ireland"},
    {caps:11,name:"Joe Royle",country:"England"},{caps:12,name:"Alan Ball Jr",country:"England"},
    {caps:13,name:"Tony Cascarino",country:"Ireland"},{caps:14,name:"Luther Blissett",country:"England"},
    {caps:15,name:"Steve Finnan",country:"Ireland"},{caps:16,name:"Pat Bonner",country:"Ireland"},
    {caps:17,name:"Les Ferdinand",country:"England"},{caps:18,name:"Mark Lawrenson",country:"Ireland"},
    {caps:19,name:"Tommy Lawton",country:"England"},{caps:20,name:"Peter Barnes",country:"England"},
    {caps:21,name:"Ledley King",country:"England"},{caps:22,name:"Viv Anderson",country:"England"},
    {caps:23,name:"Ian Wright",country:"England"},{caps:24,name:"Niall Quinn",country:"Ireland"},
    {caps:25,name:"Ugo Ehiogu",country:"England"},{caps:26,name:"Robbie Fowler",country:"England"},
    {caps:27,name:"Trevor Brooking",country:"England"},{caps:28,name:"Adam Johnson",country:"England"},
    {caps:29,name:"David Rocastle",country:"England"},{caps:30,name:"Darren Anderton",country:"England"},
    {caps:31,name:"Damien Duff",country:"Ireland"},{caps:32,name:"Kieron Dyer",country:"England"},
    {caps:33,name:"Harry Redknapp",country:"England"},{caps:34,name:"David Platt",country:"England"},
    {caps:35,name:"Jack Charlton",country:"England"},{caps:36,name:"Tom Finney",country:"England"},
    {caps:37,name:"Steve McManaman",country:"England"},{caps:38,name:"Kevin Kilbane",country:"Ireland"},
    {caps:39,name:"Ashley Young",country:"England"},{caps:40,name:"Tony Adams",country:"England"},
    {caps:41,name:"Paul Robinson",country:"England"},{caps:42,name:"Trevor Francis",country:"England"},
    {caps:43,name:"Chris Woods",country:"England"},{caps:44,name:"Martin Keown",country:"England"},
    {caps:45,name:"George Cohen",country:"England"},{caps:46,name:"Mick Channon",country:"England"},
    {caps:47,name:"Theo Walcott",country:"England"},{caps:48,name:"Denis Irwin",country:"Ireland"},
    {caps:49,name:"Geoff Hurst",country:"England"},{caps:50,name:"Phil Neal",country:"England"},
    {caps:51,name:"Teddy Sheringham",country:"England"},{caps:52,name:"Glen Hoddle",country:"England"},
    {caps:53,name:"David James",country:"England"},{caps:54,name:"Glen Johnson",country:"England"},
    {caps:55,name:"Edgar Davids",country:"Netherlands"},{caps:56,name:"Joe Cole",country:"England"},
    {caps:57,name:"Gareth Southgate",country:"England"},{caps:58,name:"Emile Heskey",country:"England"},
    {caps:59,name:"Des Walker",country:"England"},{caps:60,name:"Marcus Rashford",country:"England"},
    {caps:61,name:"Ray Clemence",country:"England"},{caps:62,name:"Emlyn Hughes",country:"England"},
    {caps:63,name:"Alan Shearer",country:"England"},{caps:64,name:"Bryan Robson",country:"England"},
    {caps:65,name:"Dave Watson",country:"England"},{caps:66,name:"Tony Adams",country:"England"},
    {caps:67,name:"Martin Peters",country:"England"},{caps:68,name:"Kevin Keegan",country:"England"},
    {caps:69,name:"Harry Kane",country:"England"},{caps:70,name:"Ray Wilkins",country:"England"},
    {caps:71,name:"Jimmy Greaves",country:"England"},{caps:72,name:"Alan Ball",country:"England"},
    {caps:73,name:"Gordon Banks",country:"England"},{caps:74,name:"Stuart Pearce",country:"England"},
    {caps:75,name:"Joe Hart",country:"England"},{caps:76,name:"Tom Finney",country:"England"},
    {caps:77,name:"Terry Butcher",country:"England"},{caps:78,name:"Stuart Pearce",country:"England"},
    {caps:79,name:"John Barnes",country:"England"},{caps:80,name:"Gary Lineker",country:"England"},
    {caps:81,name:"Jordan Henderson",country:"England"},{caps:82,name:"Raheem Sterling",country:"England"},
    {caps:83,name:"Rio Ferdinand",country:"England"},{caps:84,name:"Ray Wilkins",country:"England"},
    {caps:85,name:"Gary Neville",country:"England"},{caps:86,name:"Michael Owen",country:"England"},
    {caps:87,name:"Bryan Robson",country:"England"},{caps:88,name:"Phil Thompson",country:"England"},
    {caps:89,name:"Bobby Charlton",country:"England"},{caps:90,name:"Sol Campbell",country:"England"},
    {caps:91,name:"Wayne Rooney",country:"England"},{caps:92,name:"Steven Gerrard",country:"England"},
    {caps:93,name:"Rio Ferdinand",country:"England"},{caps:94,name:"Harry Kane",country:"England"},
    {caps:95,name:"Bobby Moore",country:"England"},{caps:96,name:"Peter Shilton",country:"England"},
    {caps:97,name:"Frank Lampard",country:"England"},{caps:98,name:"Ashley Cole",country:"England"},
  ];
  function getStreakPlayer(days){
    const cap=Math.min(days,98);
    let best=CAPS_PLAYERS[0];
    for(const p of CAPS_PLAYERS){if(Math.abs(p.caps-cap)<=Math.abs(best.caps-cap))best=p;}
    return best;
  }
  function getStreakSubtext(){
    if(streak===0) return "Play today's match to get on the board 🏴󠁧󠁢󠁥󠁮󠁧󠁿";
    const p=getStreakPlayer(streak);
    const closeness=Math.abs(p.caps-streak);
    if(streak===p.caps) return `You're a prime ${p.name} — ${p.caps} caps for ${p.country}. Come back tomorrow to keep going 🔥`;
    if(closeness<=2) return `Almost ${p.name} levels (${p.caps} caps for ${p.country}). One more day to match a legend 🔥`;
    return `${streak} caps in. ${p.name} had ${p.caps} caps for ${p.country} — you're in that territory. Keep going 🔥`;
  }

  // Career status — shared between home + result screens
  function getCareerStatus(caps){
    if(caps===0) return {label:"Uncapped",        icon:"👤",col:"#94a3b8",glow:"#94a3b8",next:1,  nextLabel:"Squad Player"};
    if(caps<5)   return {label:"Squad Player",    icon:"🔵",col:"#60a5fa",glow:"#3b82f6",next:5,  nextLabel:"Fringe International"};
    if(caps<15)  return {label:"Fringe International",icon:"🟢",col:"#34d399",glow:"#10b981",next:15, nextLabel:"Impact Sub"};
    if(caps<30)  return {label:"Impact Sub",      icon:"🟣",col:"#a78bfa",glow:"#8b5cf6",next:30, nextLabel:"Regular Starter"};
    if(caps<50)  return {label:"Regular Starter", icon:"🩵",col:"#38bdf8",glow:"#0ea5e9",next:50, nextLabel:"Starting XI"};
    if(caps<75)  return {label:"Starting XI ⭐",  icon:"⭐",col:"#fbbf24",glow:"#f59e0b",next:75, nextLabel:"International Legend"};
    if(caps<100) return {label:"International Legend",icon:"🔥",col:"#fb923c",glow:"#f97316",next:100,nextLabel:"All-Time Great"};
    if(caps<150) return {label:"All-Time Great",  icon:"👑",col:"#e879f9",glow:"#d946ef",next:150,nextLabel:"Hall of Fame"};
    return        {label:"Hall of Fame",           icon:"🏆",col:"#fde047",glow:"#facc15",next:null,nextLabel:null};
  }

  if(screen==="home") {

    function resetDemo(){
      lsSet("daily_done","");setDailyDone("");
      lsSet("daily_result",null);setDailyResult(null);
      lsSet("streak",0);setStreak(0);
      lsSet("rush_scores",[]);setRushScores([]);
      RUSH_CATEGORIES.forEach(c=>{lsSet(`rush_best_${c.id}`,0);lsSet(`rush_plays_${c.id}`,0);});
      setTestDayOffset(0);
    }

    const status = getCareerStatus(streak);
    const prevMilestone = streak===0?0:status.next===1?0:[0,1,5,15,30,50,75,100,150].reverse().find(m=>m<=streak)||0;
    const milestoneRange = status.next ? status.next - prevMilestone : 100;
    const milestoneProgress = status.next ? Math.min(streak - prevMilestone, milestoneRange) : milestoneRange;
    const progressPct = status.next ? Math.round((milestoneProgress / milestoneRange) * 100) : 100;

    return(
    <PageWrap>
      <div style={{width:"100%"}}>

        {/* ── HEADER — centred ── */}
        <div style={{textAlign:"center",marginBottom:20}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",marginBottom:4,fontFamily:"'Inter',sans-serif"}}>Higher · Lower · Football</div>
          <h1 style={{fontSize:32,fontWeight:900,letterSpacing:2,margin:0,color:"#ffffff",fontFamily:"'Bebas Neue',sans-serif",lineHeight:1}}>StatStreaks</h1>
        </div>

        {/* ══ CAREER CAPS HERO ══ */}
        <div style={{
          background:"linear-gradient(145deg,#1a2535 0%,#0f1923 60%,#1a1f10 100%)",
          border:`1px solid ${status.col}30`,
          borderRadius:20,
          padding:"22px 20px 18px",
          marginBottom:16,
          position:"relative",
          overflow:"hidden",
          boxShadow:`0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05), 0 0 60px ${status.glow}18`,
        }}>
          {/* Radial glow behind number */}
          <div style={{position:"absolute",top:"-20%",left:"0%",width:"60%",height:"160%",background:`radial-gradient(ellipse at 30% 50%, ${status.col}18 0%, transparent 70%)`,pointerEvents:"none"}}/>
          {/* Top shimmer line */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${status.col}50,transparent)`}}/>

          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",position:"relative"}}>
            {/* Left: mega number + avatar */}
            <div>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.55)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",marginBottom:6,fontFamily:"'Inter',sans-serif"}}>Career Caps</div>
              <div style={{display:"flex",alignItems:"flex-end",gap:10,lineHeight:1}}>
                {/* Footballer avatar */}
                <div style={{
                  width:52,height:52,
                  background:`${status.col}22`,
                  border:`1px solid ${status.col}44`,
                  borderRadius:14,
                  display:"flex",alignItems:"center",justifyContent:"center",
                  flexShrink:0,
                  marginBottom:4,
                }}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    {/* Head */}
                    <circle cx="14" cy="7" r="4.5" fill={status.col} opacity="0.9"/>
                    {/* Body */}
                    <path d="M8 13.5C8 11.5 10.5 10.5 14 10.5C17.5 10.5 20 11.5 20 13.5L19 20H9L8 13.5Z" fill={status.col} opacity="0.85"/>
                    {/* Left leg */}
                    <path d="M9.5 20L8 27H11L12.5 20" fill={status.col} opacity="0.75"/>
                    {/* Right leg - kicking */}
                    <path d="M18.5 20L17 25H20L21.5 20" fill={status.col} opacity="0.75"/>
                    {/* Arm left */}
                    <path d="M9 14L5.5 17.5" stroke={status.col} strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
                    {/* Arm right - raised */}
                    <path d="M19 14L22.5 11" stroke={status.col} strokeWidth="2.5" strokeLinecap="round" opacity="0.7"/>
                  </svg>
                </div>
                <div>
                  <span style={{
                    fontSize:80,fontWeight:900,color:status.col,lineHeight:0.9,
                    fontFamily:"'Bebas Neue',sans-serif",
                    textShadow:`0 0 40px ${status.col}55, 0 2px 0 rgba(0,0,0,0.3)`,
                    letterSpacing:1,display:"block",
                  }}>{streak}</span>
                  <span style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontWeight:600,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>CAPS</span>
                </div>
              </div>
            </div>
            {/* Right: status badge */}
            <div style={{textAlign:"right",paddingTop:4}}>
              <div style={{fontSize:22,marginBottom:6}}>{status.icon}</div>
              <div style={{
                background:`${status.col}20`,
                border:`1px solid ${status.col}40`,
                borderRadius:20,padding:"5px 12px",
                display:"inline-block",
              }}>
                <span style={{fontSize:10,color:status.col,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:"'Inter',sans-serif"}}>{status.label}</span>
              </div>
            </div>
          </div>

          {/* Progress bar to next milestone */}
          {status.next&&(
            <div style={{marginTop:16}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.6)",letterSpacing:1,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>{streak} / {status.next} caps</span>
                <span style={{fontSize:9,color:status.col,fontWeight:600,fontFamily:"'Inter',sans-serif"}}>Next: {status.nextLabel}</span>
              </div>
              <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progressPct}%`,background:`linear-gradient(90deg,${status.col}99,${status.col})`,borderRadius:99,transition:"width 0.6s ease",boxShadow:`0 0 8px ${status.col}66`}}/>
              </div>
            </div>
          )}

          {/* Subtext */}
          <div style={{marginTop:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.08)",fontSize:11,color:"rgba(255,255,255,0.65)",lineHeight:1.5,fontStyle:"italic",fontFamily:"'Inter',sans-serif",textAlign:"center"}}>
            {getStreakSubtext()}
          </div>
        </div>

        {/* ══ TODAY'S MATCH ══ */}
        <div style={{
          background:"#ffffff",
          borderRadius:18,
          overflow:"hidden",
          marginBottom:12,
          boxShadow:"0 6px 28px rgba(0,0,0,0.25)",
        }}>
          {/* Matchday header — no reward pill */}
          <div style={{
            background:"linear-gradient(135deg,#15803d 0%,#16a34a 60%,#22c55e 100%)",
            padding:"12px 18px",
          }}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.7)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",marginBottom:2,fontFamily:"'Inter',sans-serif"}}>Today's Match</div>
            <div style={{fontSize:15,color:"#ffffff",fontWeight:800,fontFamily:"'Inter',sans-serif",lineHeight:1.2}}>{todayChallenge.theme}</div>
          </div>

          <div style={{padding:"16px 18px"}}>
            {!todayPlayed&&(
              <div>
                <button onClick={launchDaily}
                  style={{
                    width:"100%",
                    padding:"16px",
                    background:"linear-gradient(135deg,#15803d 0%,#16a34a 50%,#22c55e 100%)",
                    border:"none",borderRadius:12,
                    color:"#ffffff",
                    fontSize:17,fontWeight:800,letterSpacing:0.5,
                    cursor:"pointer",
                    fontFamily:"'Inter',sans-serif",
                    boxShadow:"0 6px 20px rgba(22,163,74,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
                    transition:"transform 0.12s,box-shadow 0.12s",
                    display:"block",
                  }}
                  onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 28px rgba(22,163,74,0.55), inset 0 1px 0 rgba(255,255,255,0.2)";}}
                  onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 6px 20px rgba(22,163,74,0.45), inset 0 1px 0 rgba(255,255,255,0.2)";}}>
                  Kick Off ⚽
                </button>
                <div style={{textAlign:"center",marginTop:7,fontSize:11,color:"#94a3b8",fontWeight:500,fontFamily:"'Inter',sans-serif"}}>Complete today's match to earn +1 Cap</div>
              </div>
            )}

            {todayPlayed&&todayResult&&(
              <>
                <div style={{textAlign:"center",marginBottom:12}}>
                  <DailyResultDots resultData={todayResult}/>
                </div>
                {/* 2-col: score + global avg */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderRadius:10,overflow:"hidden",border:"1px solid #f1f5f9",marginBottom:10}}>
                  {[
                    {label:"Your Score",val:`${todayResult.filter(r=>r==="correct").length}/10`,col:"#16a34a"},
                    {label:"Global Avg",val:"4.2",col:"#64748b"},
                  ].map((item,i)=>(
                    <div key={i} style={{textAlign:"center",padding:"12px 6px",borderLeft:i>0?"1px solid #f1f5f9":"none"}}>
                      <div style={{fontSize:8,color:"#94a3b8",letterSpacing:1.5,fontWeight:600,marginBottom:4,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>{item.label}</div>
                      <div style={{fontSize:20,fontWeight:800,color:item.col,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>{item.val}</div>
                    </div>
                  ))}
                </div>
                {/* Blue share button */}
                <button onClick={()=>{
                  const s=todayResult.filter(r=>r==="correct").length;
                  const emojiGrid=todayResult.map(r=>r==="correct"?"🟩":r==="yellow"?"🟨":"🟥").join("");
                  const t=`StatStreaks #${effectiveDayIdx+1} ⚽\n${emojiGrid}\n${s}/10 🧢 ${streak}`;
                  try{navigator.clipboard.writeText(t);}catch{}alert("Copied!");
                }} style={{width:"100%",padding:"11px",background:"linear-gradient(135deg,#2563eb,#3b82f6)",border:"none",borderRadius:10,color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10,boxShadow:"0 4px 12px rgba(37,99,235,0.35)"}}>
                  ↗ Share your score
                </button>
                {/* Tomorrow's fixture */}
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#f8fafc",borderRadius:10,border:"1px solid #f1f5f9"}}>
                  <span style={{fontSize:14}}>🔭</span>
                  <div>
                    <div style={{fontSize:8,color:"#94a3b8",letterSpacing:2,fontWeight:600,marginBottom:1,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Tomorrow's Fixture</div>
                    <div style={{fontSize:12,color:"#475569",fontWeight:600,fontFamily:"'Inter',sans-serif"}}>{tomorrowChallenge.theme}</div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* ══ TRAINING PITCH ══ */}
        <button onClick={()=>{SFX.click();setScreen("rush");}}
          style={{
            width:"100%",
            background:"linear-gradient(135deg,#be185d 0%,#db2777 50%,#ec4899 100%)",
            border:"none",borderRadius:18,cursor:"pointer",overflow:"hidden",marginBottom:16,
            boxShadow:"0 6px 24px rgba(219,39,119,0.55), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)",
            transition:"transform 0.12s,box-shadow 0.12s",display:"block",textAlign:"left",padding:"0",
          }}
          onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 32px rgba(219,39,119,0.7), inset 0 1px 0 rgba(255,255,255,0.25)";}}
          onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 6px 24px rgba(219,39,119,0.55), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.25)";}}>
          <div style={{padding:"12px 18px"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",letterSpacing:3,fontWeight:700,textTransform:"uppercase",marginBottom:2,fontFamily:"'Inter',sans-serif"}}>Training Pitch</div>
            <div style={{fontSize:15,fontWeight:800,color:"#ffffff",fontFamily:"'Inter',sans-serif",lineHeight:1.2}}>30s High Score Mode ⚡</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",fontFamily:"'Inter',sans-serif",marginTop:2}}>Go for a perfect run · 2× multiplier</div>
          </div>
        </button>

        {/* ── DEMO CONTROLS ── */}
        <div style={{display:"flex",gap:6}}>
          {[
            {label:`🔄 Day ${effectiveDayIdx+1}/${DAILY_CHALLENGES.length}`,fn:()=>{SFX.click();setTestDayOffset(o=>(o+1)%DAILY_CHALLENGES.length);}},
            {label:"🧢 +1 Cap",fn:()=>{const ns=streak+1;lsSet("streak",ns);setStreak(ns);}},
            {label:"🗑 Reset",fn:resetDemo,danger:true},
          ].map((b,i)=>(
            <button key={i} onClick={b.fn} style={{flex:1,padding:"6px",background:"transparent",border:`1px dashed ${b.danger?"rgba(220,38,38,0.25)":"rgba(255,255,255,0.08)"}`,borderRadius:7,color:b.danger?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.2)",fontSize:9,letterSpacing:1,cursor:"pointer",fontFamily:"'Inter',sans-serif",textTransform:"uppercase"}}>{b.label}</button>
          ))}
        </div>

      </div>
    </PageWrap>
  );}

  // ── RESULT ────────────────────────────────────────────────────────────────
  if(screen==="result"){
    const win=gameOutcome==="win",timeout=gameOutcome==="timeout";
    const isDaily=mode==="daily";
    const activeCatData=!isDaily?RUSH_CATEGORIES.find(c=>c.id===rushCat):null;
    const accentCol=win?"#16a34a":timeout?"#d97706":"#dc2626";
    const accentBg=win?"#f0fdf4":timeout?"#fffbeb":"#fef2f2";
    const accentBorder=win?"#86efac":timeout?"#fde68a":"#fecaca";

    // Tomorrow's fixture for daily result CTA
    const tomorrowTheme = isDaily ? DAILY_CHALLENGES[(effectiveDayIdx+1)%DAILY_CHALLENGES.length].theme : null;

    return(
    <PageWrap glow={win?"default":timeout?"gold":"red"}>
      <div style={{width:"100%"}}>

        {/* Back nav */}
        <button onClick={()=>{SFX.click();setScreen(isDaily?"home":"rush");}}
          style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.6)",fontSize:11,cursor:"pointer",padding:"7px 12px",fontFamily:"'Inter',sans-serif",fontWeight:600,letterSpacing:0.5,marginBottom:16}}>
          ← {isDaily?"Home":"Training Pitch"}
        </button>

        {/* ── DAILY RESULT ── */}
        {isDaily&&(
          <>
            {/* 1. SCORE CARD — top priority */}
            <div style={{background:"#ffffff",borderRadius:18,overflow:"hidden",marginBottom:12,boxShadow:"0 6px 28px rgba(0,0,0,0.25)"}}>
              <div style={{height:4,background:accentCol}}/>
              <div style={{padding:"18px 18px 16px"}}>

                {/* Score message */}
                {latestScore>0&&(()=>{
                  const msg=getScoreMessage(latestScore);
                  return msg?<div style={{background:accentBg,border:`1px solid ${accentBorder}`,borderRadius:10,padding:"10px 14px",marginBottom:14,textAlign:"center"}}>
                    <div style={{color:accentCol,fontWeight:800,fontSize:15,lineHeight:1.4,fontFamily:"'Inter',sans-serif"}}>{msg}</div>
                  </div>:null;
                })()}

                {/* Big score */}
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
                  <div>
                    <div style={{fontSize:9,color:"#94a3b8",letterSpacing:2,fontWeight:600,marginBottom:3,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Match Score</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:4}}>
                      <span style={{fontSize:56,fontWeight:900,color:accentCol,lineHeight:1,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>{latestScore}</span>
                      <span style={{fontSize:20,color:"#94a3b8",fontWeight:600,fontFamily:"'Inter',sans-serif"}}>/10</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:12,color:(latestScore||0)>4.2?"#16a34a":"#dc2626",fontWeight:700,marginBottom:2,fontFamily:"'Inter',sans-serif"}}>{(latestScore||0)>4.2?"↑ Above avg":"↓ Below avg"}</div>
                    <div style={{fontSize:10,color:"#94a3b8",fontFamily:"'Inter',sans-serif"}}>Global avg: 4.2</div>
                  </div>
                </div>

                {/* Answer dots */}
                {answerLog.length>0&&(
                  <div style={{marginBottom:14}}>
                    <DailyResultDots resultData={answerLog}/>
                  </div>
                )}

                {/* Share button */}
                <button onClick={()=>{
                  const s=latestScore||0;
                  const emojiGrid=answerLog.map(r=>r==="correct"?"🟩":r==="yellow"?"🟨":"🟥").join("");
                  const t=`StatStreaks #${effectiveDayIdx+1} ⚽\n${emojiGrid}\n${s}/10 🧢 ${streak}`;
                  try{navigator.clipboard.writeText(t);}catch{}alert("Copied!");
                }} style={{width:"100%",padding:"12px",background:"linear-gradient(135deg,#2563eb,#3b82f6)",border:"none",borderRadius:10,color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10,boxShadow:"0 4px 12px rgba(37,99,235,0.35)"}}>
                  ↗ Share your score
                </button>

                {/* Training Pitch CTA with tomorrow's fixture — dynamic */}
                <button onClick={()=>{SFX.click();setScreen("rush");}} style={{
                  width:"100%",padding:"14px 16px",
                  background:"linear-gradient(135deg,#be185d,#db2777,#ec4899)",
                  border:"none",borderRadius:12,cursor:"pointer",
                  fontFamily:"'Inter',sans-serif",
                  boxShadow:"0 4px 16px rgba(219,39,119,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",
                  textAlign:"left",
                  transition:"transform 0.15s, box-shadow 0.15s",
                  display:"block",
                }}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 28px rgba(219,39,119,0.65), inset 0 1px 0 rgba(255,255,255,0.3)";}}
                onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(219,39,119,0.4), inset 0 1px 0 rgba(255,255,255,0.2)";}}>
                  <div style={{fontSize:15,fontWeight:800,color:"#ffffff",marginBottom:3}}>Get some training in ⚡</div>
                  <div style={{fontSize:10,color:"rgba(255,255,255,0.7)",fontWeight:500}}>Tomorrow's fixture: {tomorrowTheme}</div>
                </button>
              </div>
            </div>

            {/* 2. CAPS CARD — matches home screen style */}
            {(()=>{
              const rStatus = getCareerStatus(streak);
              return(
              <div style={{
                background:"linear-gradient(145deg,#1a2535 0%,#0f1923 60%,#1a1f10 100%)",
                border:`1px solid ${rStatus.col}30`,
                borderRadius:16,padding:"16px 18px",marginBottom:12,
                position:"relative",overflow:"hidden",
                boxShadow:`0 4px 20px rgba(0,0,0,0.3), 0 0 40px ${rStatus.glow}12`,
              }}>
                <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${rStatus.col}50,transparent)`}}/>
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:10}}>
                  <div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:2,fontWeight:600,marginBottom:4,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Career Caps</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:6}}>
                      <span style={{fontSize:64,fontWeight:900,color:rStatus.col,lineHeight:0.9,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,textShadow:`0 0 30px ${rStatus.col}55`}}>{streak}</span>
                      <span style={{fontSize:14,color:"rgba(255,255,255,0.5)",fontWeight:600,letterSpacing:2,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:4}}>CAPS</span>
                    </div>
                  </div>
                  <div style={{textAlign:"right",paddingTop:2}}>
                    <div style={{fontSize:20,marginBottom:6}}>{rStatus.icon}</div>
                    <div style={{background:`${rStatus.col}20`,border:`1px solid ${rStatus.col}40`,borderRadius:20,padding:"4px 10px",display:"inline-block"}}>
                      <span style={{fontSize:9,color:rStatus.col,fontWeight:700,fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap"}}>Cap Earned ✓</span>
                    </div>
                  </div>
                </div>
                {/* Centralised player comparison */}
                <div style={{paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.06)",fontSize:11,color:"rgba(255,255,255,0.6)",lineHeight:1.5,fontStyle:"italic",fontFamily:"'Inter',sans-serif",textAlign:"center"}}>
                  {getStreakSubtext()}
                </div>
              </div>
              );
            })()}

            {/* Home button only — daily is one attempt per day */}
            <button onClick={()=>{SFX.click();setScreen("home");}} style={{width:"100%",padding:"12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",marginTop:4}}>← Home</button>
          </>
        )}

        {/* ── TRAINING PITCH RESULT ── */}
        {!isDaily&&(()=>{
          const isPerfect = timeout && continueCount===0;
          const displayScore = latestScore||score;
          const leaderboardScore = continueCount>0 ? cleanScore : displayScore;
          return(
          <>
            {isPerfect&&(
              <div style={{background:"linear-gradient(135deg,#d97706,#f59e0b)",borderRadius:14,padding:"14px 18px",marginBottom:12,boxShadow:"0 4px 20px rgba(217,119,6,0.5)",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:4}}>🔥</div>
                <div style={{color:"#ffffff",fontWeight:900,fontSize:18,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:2,lineHeight:1}}>PERFECT RUN — 2× APPLIED!</div>
                <div style={{color:"rgba(255,255,255,0.85)",fontSize:12,marginTop:4,fontFamily:"'Inter',sans-serif"}}>Zero mistakes · all 30 seconds · score doubled</div>
              </div>
            )}
            <div style={{background:"#ffffff",borderRadius:18,overflow:"hidden",marginBottom:12,boxShadow:"0 6px 28px rgba(0,0,0,0.25)"}}>
              <div style={{height:4,background:isPerfect?"linear-gradient(90deg,#d97706,#f59e0b)":"#d97706"}}/>
              <div style={{padding:"18px"}}>
                {/* Score + personal best side by side */}
                <div style={{display:"flex",gap:12,marginBottom:10}}>
                  <div style={{flex:1,textAlign:"center"}}>
                    <div style={{fontSize:8,color:"#94a3b8",letterSpacing:2,marginBottom:3,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>{isPerfect?"Final Score ×2":"Score"}</div>
                    <div style={{fontSize:52,fontWeight:900,color:isPerfect?"#d97706":"#0f172a",lineHeight:1,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>{displayScore}</div>
                    {isPerfect&&(
                      <div style={{fontSize:10,color:"#94a3b8",marginTop:2,fontFamily:"'Inter',sans-serif"}}>({rawCorrect} correct × 2)</div>
                    )}
                  </div>
                  {(()=>{
                    // prevCatBest is stored in state before this run's score was saved
                    // so comparison is always against the OLD best — correct for new-PB detection
                    const isNewBest = displayScore > prevCatBest;
                    const shownBest = isNewBest ? displayScore : prevCatBest;
                    return(
                      <div style={{flex:1,textAlign:"center",borderLeft:"1px solid #f1f5f9",paddingLeft:12}}>
                        <div style={{fontSize:8,color:"#94a3b8",letterSpacing:2,marginBottom:3,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Personal Best</div>
                        <div style={{fontSize:52,fontWeight:900,color:isNewBest?"#16a34a":"#0f172a",lineHeight:1,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>{shownBest||displayScore}</div>
                        {isNewBest&&<div style={{fontSize:9,color:"#16a34a",marginTop:2,fontWeight:700,fontFamily:"'Inter',sans-serif"}}>New best! 🏆</div>}
                        {!isNewBest&&prevCatBest>0&&displayScore===prevCatBest&&<div style={{fontSize:9,color:"#d97706",marginTop:2,fontWeight:700,fontFamily:"'Inter',sans-serif"}}>Matched your best</div>}
                      </div>
                    );
                  })()}
                </div>
                {/* Funny football message — compare against pre-run best so new PB is detected correctly */}
                {(()=>{
                  const msg = getRushMessage(displayScore, prevCatBest);
                  return(
                    <div style={{borderTop:"1px solid #f1f5f9",paddingTop:10,marginBottom:12}}>
                      <div style={{color:"#475569",fontSize:12,fontStyle:"italic",fontFamily:"'Inter',sans-serif",lineHeight:1.5}}>{msg}</div>
                      {activeCatData&&<div style={{color:"#94a3b8",fontSize:10,marginTop:6,fontFamily:"'Inter',sans-serif"}}>Category avg: {activeCatData.globalAvg}</div>}
                    </div>
                  );
                })()}
                <button onClick={()=>{
                  const perfTag=isPerfect?" 🔥 PERFECT RUN (2×)":"";
                  const t=`StatStreaks Training Pitch\n${theme}\nScore: ${displayScore}${perfTag} — can you beat me?`;
                  try{navigator.clipboard.writeText(t);}catch{}alert("Copied!");
                }} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#2563eb,#3b82f6)",border:"none",borderRadius:9,color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10,boxShadow:"0 4px 12px rgba(37,99,235,0.35)"}}>
                  ↗ Share score
                </button>
                <button onClick={()=>{SFX.click();launchRush(rushCat);}} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#be185d,#db2777)",border:"none",borderRadius:12,color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:800,cursor:"pointer",boxShadow:"0 4px 12px rgba(219,39,119,0.4)"}}>Train Again ⚡</button>
              </div>
            </div>
          </>
          );
        })()}

      </div>
    </PageWrap>
  );}

  // ── GAME ──────────────────────────────────────────────────────────────────
  const isRush=mode==="rush";
  const activeCat=isRush?RUSH_CATEGORIES.find(c=>c.id===rushCat):null;

  return(
    <PageWrap glow={isRush?"gold":"default"}>
      {showYellow&&<YellowCardOverlay onWatchAd={onWatchAd} onDecline={onDeclineAd}/>}
      {showRushModal&&<RushModal/>}
      {/* 3-2-1 countdown overlay */}
      {countdown!==null&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"}}>
          <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:4,fontWeight:600,textTransform:"uppercase",marginBottom:16,fontFamily:"'Inter',sans-serif"}}>{isRush?"Training Pitch":"International Match"}</div>
          <div style={{
            fontSize:120,fontWeight:900,color:countdown===3?"#60a5fa":countdown===2?"#fbbf24":"#4ade80",
            fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,
            textShadow:`0 0 60px ${countdown===3?"#60a5fa":countdown===2?"#fbbf24":"#4ade80"}88`,
            animation:"popIn 0.3s ease",
          }}>{countdown}</div>
          <div style={{fontSize:14,color:"rgba(255,255,255,0.4)",marginTop:16,fontFamily:"'Inter',sans-serif",fontWeight:500}}>
            {countdown===3?"Get ready…":countdown===2?"Higher or lower…":"Go!"}
          </div>
        </div>
      )}
      <div style={{width:"100%"}}>

        {/* ── GAME HEADER ── */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
          <button onClick={()=>{SFX.click();setTimerActive(false);setCountdown(null);setScreen(isRush?"rush":"home");}}
            style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.6)",fontSize:11,cursor:"pointer",padding:"7px 11px",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
            ← {isRush?"Pitch":"Home"}
          </button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.9)",fontFamily:"'Inter',sans-serif"}}>{isRush?(activeCat?activeCat.label:"Training Pitch"):theme}</div>
            <div style={{fontSize:9,color:isRush?"#fbbf24":"#4ade80",letterSpacing:2,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>{isRush?"Training Pitch":"International Match"}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
            <div style={{background:"#ffffff",borderRadius:7,padding:"4px 10px",color:"#16a34a",fontWeight:900,fontSize:13,fontFamily:"'Oswald',sans-serif",letterSpacing:1,boxShadow:"0 2px 6px rgba(0,0,0,0.15)"}}>{score} ✓</div>
            {isRush
              ? <div style={{color:timeLeft<=8?"#ef4444":timeLeft<=15?"#f59e0b":"rgba(255,255,255,0.7)",fontWeight:900,fontSize:20,fontFamily:"'Oswald',sans-serif",animation:timeLeft<=8?"timerPulse 0.6s infinite":"none"}}>{timeLeft}s</div>
              : <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",letterSpacing:0.5}}>{yellowUsed?"🟥 last save gone":"🟨 save ready"}</div>
            }
            {isRush&&(()=>{
              const catBest=lsGet(`rush_best_${rushCat}`,0);
              if(catBest>0) return <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",fontFamily:"'Inter',sans-serif",letterSpacing:0.5}}>Best: {catBest}</div>;
              return null;
            })()}
          </div>
        </div>

        {/* ── TIMER BAR (rush) / PROGRESS DOTS (daily) ── */}
        {isRush
          ? <div style={{width:"100%",height:5,background:"rgba(255,255,255,0.1)",borderRadius:99,overflow:"hidden",marginBottom:14}}>
              <div style={{height:"100%",width:`${(timeLeft/TOTAL_TIME)*100}%`,background:timeLeft<=8?"#ef4444":timeLeft<=15?"#f59e0b":"#16a34a",borderRadius:99,transition:"width 0.9s linear,background 0.5s"}}/>
            </div>
          : <ProgressDots current={currentIdx} result={result} yellowCardIdx={yellowCardIdx}/>
        }

        {/* ── QUESTION CARD ── */}
        {currentCard&&nextCard&&(
          <div style={{background:"#ffffff",borderRadius:14,padding:"12px 16px",marginBottom:14,textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.15)"}}>
            <div style={{fontSize:8,color:"#94a3b8",letterSpacing:3,fontWeight:700,marginBottom:6,textTransform:"uppercase"}}>Compare the {nextCard.statType}</div>
            <div style={{fontSize:14,lineHeight:1.8,color:"#475569"}}>
              Will <strong style={{color:"#0f172a",fontFamily:"'Oswald',sans-serif",fontSize:16,fontWeight:700}}>{nextCard.player}</strong> be <strong style={{color:"#16a34a"}}>HIGHER</strong> or <strong style={{color:"#dc2626"}}>LOWER</strong> than <strong style={{color:"#d97706",fontFamily:"'Oswald',sans-serif",fontSize:18}}>{currentCard.stat}</strong>?
            </div>
          </div>
        )}

        {/* ── STAT PANELS ── */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14,justifyContent:"center"}}>
          {currentCard&&<StatPanel card={currentCard} revealed={true} flashResult={null}/>}
          <div style={{width:30,height:30,borderRadius:8,background:"rgba(255,255,255,0.1)",border:"1px solid rgba(255,255,255,0.15)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:8,color:"rgba(255,255,255,0.5)",fontWeight:800,flexShrink:0,fontFamily:"'Barlow Condensed',sans-serif",letterSpacing:1}}>VS</div>
          {nextCard&&<StatPanel card={nextCard} revealed={revealedNext} flashResult={revealedNext?flashResult:null}/>}
        </div>

        {/* ── BUTTONS / FEEDBACK ── */}
        {result===null||result==="yellow"?(
          result==="yellow"?(
            <div style={{background:"#fffbeb",border:"1px solid #fde68a",borderRadius:12,padding:"14px",textAlign:"center",boxShadow:"0 2px 12px rgba(0,0,0,0.1)"}}>
              <div style={{fontSize:20,fontWeight:900,color:"#92400e",fontFamily:"'Oswald',sans-serif",letterSpacing:1}}>🟨 Yellow Card</div>
              <div style={{color:"#92400e",fontSize:12,marginTop:4,opacity:0.7}}>Incoming...</div>
            </div>
          ):(
            <div style={{display:"flex",gap:10,width:"100%"}}>
              <button onClick={()=>handleGuess("higher")}
                style={{flex:1,padding:"16px 8px",background:"#16a34a",border:"none",borderRadius:12,color:"#ffffff",fontSize:18,fontWeight:900,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",transition:"transform 0.12s,box-shadow 0.12s",fontFamily:"'Barlow Condensed',sans-serif",boxShadow:"0 4px 16px rgba(22,163,74,0.4)"}}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(22,163,74,0.55)";}}
                onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(22,163,74,0.4)";}}>⬆ Higher</button>
              <button onClick={()=>handleGuess("lower")}
                style={{flex:1,padding:"16px 8px",background:"#dc2626",border:"none",borderRadius:12,color:"#ffffff",fontSize:18,fontWeight:900,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",transition:"transform 0.12s,box-shadow 0.12s",fontFamily:"'Barlow Condensed',sans-serif",boxShadow:"0 4px 16px rgba(220,38,38,0.4)"}}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(220,38,38,0.55)";}}
                onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(220,38,38,0.4)";}}>⬇ Lower</button>
            </div>
          )
        ):(
          result==="correct"?(
            <div style={{background:"#f0fdf4",border:"1px solid #86efac",borderRadius:12,padding:"14px",textAlign:"center",boxShadow:"0 2px 12px rgba(22,163,74,0.15)"}}>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:"#16a34a",letterSpacing:1}}>✓ Correct!</div>
              <div style={{color:"#64748b",fontSize:12,marginTop:3}}>Keep going!</div>
            </div>
          ):(
            !isRush?(
            <div style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:"0 20px",backdropFilter:"blur(6px)"}}>
              <div style={{background:"#ffffff",borderRadius:20,padding:"28px 24px",maxWidth:300,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.4)"}}>
                {/* Red card graphic */}
                <div style={{width:52,height:68,background:"linear-gradient(160deg,#ef4444,#dc2626)",borderRadius:8,margin:"0 auto 16px",boxShadow:"0 4px 20px rgba(220,38,38,0.5)",display:"flex",alignItems:"center",justifyContent:"center"}}>
                  <div style={{width:38,height:50,background:"linear-gradient(160deg,#fca5a5,#ef4444)",borderRadius:5}}/>
                </div>
                <div style={{color:"#7f1d1d",fontWeight:900,fontSize:22,letterSpacing:1,marginBottom:6,fontFamily:"'Oswald',sans-serif",textTransform:"uppercase"}}>Red Card</div>
                <div style={{color:"#64748b",fontSize:13,marginBottom:6,lineHeight:1.5}}>{yellowUsed?"Two wrong answers — match over.":"Wrong answer — match over."}</div>
                <div style={{color:"#94a3b8",fontSize:11}}>Taking you to results...</div>
              </div>
            </div>
            ):null
          )
        )}
      </div>
    </PageWrap>
  );
}