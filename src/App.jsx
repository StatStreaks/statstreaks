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
// Returns YYYY-Www string for the current ISO week (Monday start)
function getWeekKey(){const d=new Date();const day=d.getDay()||7;d.setDate(d.getDate()-day+1);return`${d.getFullYear()}-W${String(Math.ceil(d.getDate()/7)).padStart(2,"0")}-${d.getMonth()}`;}
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
  { id:"pl_goals", label:"Premier League Goals", icon:"⚽", color:"#3b82f6", globalAvg:5.1, cards:[
    {player:"Alan Shearer",stat:260,statType:"Goals",club:"PL All-Time"},
    {player:"Harry Kane",stat:213,statType:"Goals",club:"PL All-Time"},
    {player:"Wayne Rooney",stat:208,statType:"Goals",club:"PL All-Time"},
    {player:"Mohamed Salah",stat:191,statType:"Goals",club:"PL All-Time"},
    {player:"Andrew Cole",stat:187,statType:"Goals",club:"PL All-Time"},
    {player:"Sergio Agüero",stat:184,statType:"Goals",club:"PL All-Time"},
    {player:"Frank Lampard",stat:177,statType:"Goals",club:"PL All-Time"},
    {player:"Thierry Henry",stat:175,statType:"Goals",club:"PL All-Time"},
    {player:"Robbie Fowler",stat:163,statType:"Goals",club:"PL All-Time"},
    {player:"Jermain Defoe",stat:162,statType:"Goals",club:"PL All-Time"},
    {player:"Michael Owen",stat:150,statType:"Goals",club:"PL All-Time"},
    {player:"Les Ferdinand",stat:149,statType:"Goals",club:"PL All-Time"},
    {player:"Teddy Sheringham",stat:146,statType:"Goals",club:"PL All-Time"},
    {player:"Jamie Vardy",stat:145,statType:"Goals",club:"PL All-Time"},
    {player:"Robin van Persie",stat:144,statType:"Goals",club:"PL All-Time"},
    {player:"Son Heung-Min",stat:127,statType:"Goals",club:"PL All-Time"},
    {player:"Jimmy Floyd Hasselbaink",stat:127,statType:"Goals",club:"PL All-Time"},
    {player:"Robbie Keane",stat:126,statType:"Goals",club:"PL All-Time"},
    {player:"Nicolas Anelka",stat:125,statType:"Goals",club:"PL All-Time"},
    {player:"Dwight Yorke",stat:123,statType:"Goals",club:"PL All-Time"},
    {player:"Raheem Sterling",stat:123,statType:"Goals",club:"PL All-Time"},
    {player:"Romelu Lukaku",stat:121,statType:"Goals",club:"PL All-Time"},
    {player:"Steven Gerrard",stat:120,statType:"Goals",club:"PL All-Time"},
    {player:"Ian Wright",stat:113,statType:"Goals",club:"PL All-Time"},
    {player:"Dion Dublin",stat:111,statType:"Goals",club:"PL All-Time"},
    {player:"Sadio Mané",stat:111,statType:"Goals",club:"PL All-Time"},
    {player:"Emile Heskey",stat:110,statType:"Goals",club:"PL All-Time"},
    {player:"Ryan Giggs",stat:109,statType:"Goals",club:"PL All-Time"},
    {player:"Peter Crouch",stat:108,statType:"Goals",club:"PL All-Time"},
    {player:"Paul Scholes",stat:107,statType:"Goals",club:"PL All-Time"},
    {player:"Erling Haaland",stat:107,statType:"Goals",club:"PL All-Time"},
    {player:"Darren Bent",stat:106,statType:"Goals",club:"PL All-Time"},
    {player:"Didier Drogba",stat:104,statType:"Goals",club:"PL All-Time"},
    {player:"Cristiano Ronaldo",stat:103,statType:"Goals",club:"PL All-Time"},
    {player:"Matthew Le Tissier",stat:100,statType:"Goals",club:"PL All-Time"},
    {player:"Emmanuel Adebayor",stat:97,statType:"Goals",club:"PL All-Time"},
    {player:"Ruud van Nistelrooy",stat:95,statType:"Goals",club:"PL All-Time"},
    {player:"Yakubu",stat:95,statType:"Goals",club:"PL All-Time"},
    {player:"Dimitar Berbatov",stat:94,statType:"Goals",club:"PL All-Time"},
    {player:"Callum Wilson",stat:93,statType:"Goals",club:"PL All-Time"},
    {player:"Mark Viduka",stat:92,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin Phillips",stat:92,statType:"Goals",club:"PL All-Time"},
    {player:"Chris Wood",stat:91,statType:"Goals",club:"PL All-Time"},
    {player:"James Beattie",stat:91,statType:"Goals",club:"PL All-Time"},
    {player:"Ole Gunnar Solskjaer",stat:91,statType:"Goals",club:"PL All-Time"},
    {player:"Olivier Giroud",stat:90,statType:"Goals",club:"PL All-Time"},
    {player:"Danny Welbeck",stat:89,statType:"Goals",club:"PL All-Time"},
    {player:"Marcus Rashford",stat:89,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin Davies",stat:88,statType:"Goals",club:"PL All-Time"},
    {player:"Dennis Bergkamp",stat:87,statType:"Goals",club:"PL All-Time"},
    {player:"Christian Benteke",stat:86,statType:"Goals",club:"PL All-Time"},
    {player:"Louis Saha",stat:85,statType:"Goals",club:"PL All-Time"},
    {player:"Eden Hazard",stat:85,statType:"Goals",club:"PL All-Time"},
    {player:"Fernando Torres",stat:85,statType:"Goals",club:"PL All-Time"},
    {player:"Carlos Tévez",stat:84,statType:"Goals",club:"PL All-Time"},
    {player:"Ollie Watkins",stat:84,statType:"Goals",club:"PL All-Time"},
    {player:"Chris Sutton",stat:83,statType:"Goals",club:"PL All-Time"},
    {player:"Roberto Firmino",stat:82,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin Campbell",stat:82,statType:"Goals",club:"PL All-Time"},
    {player:"Riyad Mahrez",stat:82,statType:"Goals",club:"PL All-Time"},
    {player:"Craig Bellamy",stat:81,statType:"Goals",club:"PL All-Time"},
    {player:"Theo Walcott",stat:80,statType:"Goals",club:"PL All-Time"},
    {player:"Gary Speed",stat:80,statType:"Goals",club:"PL All-Time"},
    {player:"Gabriel Jesus",stat:78,statType:"Goals",club:"PL All-Time"},
    {player:"Tony Cottee",stat:78,statType:"Goals",club:"PL All-Time"},
    {player:"Daniel Sturridge",stat:76,statType:"Goals",club:"PL All-Time"},
    {player:"Gabriel Agbonlahor",stat:74,statType:"Goals",club:"PL All-Time"},
    {player:"Richarlison",stat:73,statType:"Goals",club:"PL All-Time"},
    {player:"Danny Ings",stat:72,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin De Bruyne",stat:72,statType:"Goals",club:"PL All-Time"},
    {player:"Chris Armstrong",stat:71,statType:"Goals",club:"PL All-Time"},
    {player:"Brian Deane",stat:71,statType:"Goals",club:"PL All-Time"},
    {player:"Eric Cantona",stat:70,statType:"Goals",club:"PL All-Time"},
    {player:"Bruno Fernandes",stat:70,statType:"Goals",club:"PL All-Time"},
    {player:"Pierre-Emerick Aubameyang",stat:69,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin Nolan",stat:69,statType:"Goals",club:"PL All-Time"},
    {player:"Luis Suárez",stat:69,statType:"Goals",club:"PL All-Time"},
    {player:"Wilfried Zaha",stat:68,statType:"Goals",club:"PL All-Time"},
    {player:"Michail Antonio",stat:68,statType:"Goals",club:"PL All-Time"},
    {player:"Phil Foden",stat:68,statType:"Goals",club:"PL All-Time"},
    {player:"Duncan Ferguson",stat:68,statType:"Goals",club:"PL All-Time"},
    {player:"Raúl Jiménez",stat:68,statType:"Goals",club:"PL All-Time"},
    {player:"Gylfi Sigurdsson",stat:67,statType:"Goals",club:"PL All-Time"},
    {player:"Dominic Calvert-Lewin",stat:67,statType:"Goals",club:"PL All-Time"},
    {player:"Paolo Di Canio",stat:66,statType:"Goals",club:"PL All-Time"},
    {player:"Mark Hughes",stat:64,statType:"Goals",club:"PL All-Time"},
    {player:"Jarrod Bowen",stat:64,statType:"Goals",club:"PL All-Time"},
    {player:"Alexis Sánchez",stat:63,statType:"Goals",club:"PL All-Time"},
    {player:"Diogo Jota",stat:63,statType:"Goals",club:"PL All-Time"},
    {player:"Anthony Martial",stat:63,statType:"Goals",club:"PL All-Time"},
    {player:"Dean Holdsworth",stat:63,statType:"Goals",club:"PL All-Time"},
    {player:"Robert Pirès",stat:62,statType:"Goals",club:"PL All-Time"},
    {player:"Stan Collymore",stat:62,statType:"Goals",club:"PL All-Time"},
    {player:"David Beckham",stat:62,statType:"Goals",club:"PL All-Time"},
    {player:"Yaya Touré",stat:62,statType:"Goals",club:"PL All-Time"},
    {player:"David Silva",stat:60,statType:"Goals",club:"PL All-Time"},
    {player:"Bukayo Saka",stat:59,statType:"Goals",club:"PL All-Time"},
    {player:"Niall Quinn",stat:59,statType:"Goals",club:"PL All-Time"},
    {player:"Gianfranco Zola",stat:59,statType:"Goals",club:"PL All-Time"},
    {player:"Peter Beardsley",stat:58,statType:"Goals",club:"PL All-Time"},
    {player:"Clint Dempsey",stat:57,statType:"Goals",club:"PL All-Time"},
    {player:"Harry Kewell",stat:57,statType:"Goals",club:"PL All-Time"},
    {player:"Lee Bowyer",stat:57,statType:"Goals",club:"PL All-Time"},
    {player:"James Ward-Prowse",stat:57,statType:"Goals",club:"PL All-Time"},
    {player:"Tim Cahill",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"Kevin Gallacher",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"Alexander Isak",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"Jason Euell",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"Shane Long",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"James Maddison",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"James Milner",stat:56,statType:"Goals",club:"PL All-Time"},
    {player:"Christian Eriksen",stat:55,statType:"Goals",club:"PL All-Time"},
    {player:"John Hartson",stat:55,statType:"Goals",club:"PL All-Time"},
    {player:"Eidur Gudjohnsen",stat:55,statType:"Goals",club:"PL All-Time"},
    {player:"Alexandre Lacazette",stat:54,statType:"Goals",club:"PL All-Time"},
    {player:"Andy Carroll",stat:54,statType:"Goals",club:"PL All-Time"},
    {player:"Harvey Barnes",stat:54,statType:"Goals",club:"PL All-Time"},
    {player:"Gustavo Poyet",stat:54,statType:"Goals",club:"PL All-Time"},
    {player:"Kanu",stat:54,statType:"Goals",club:"PL All-Time"},
    {player:"Damien Duff",stat:54,statType:"Goals",club:"PL All-Time"},
    {player:"Joshua King",stat:53,statType:"Goals",club:"PL All-Time"},
    {player:"Chicharito",stat:53,statType:"Goals",club:"PL All-Time"},
    {player:"Gareth Bale",stat:53,statType:"Goals",club:"PL All-Time"},
    {player:"Steven Fletcher",stat:53,statType:"Goals",club:"PL All-Time"},
    {player:"Diego Costa",stat:53,statType:"Goals",club:"PL All-Time"},
    {player:"Nick Barmby",stat:53,statType:"Goals",club:"PL All-Time"},
    {player:"Gareth Barry",stat:53,statType:"Goals",club:"PL All-Time"},
    {player:"Efan Ekoku",stat:52,statType:"Goals",club:"PL All-Time"},
    {player:"Juan Mata",stat:52,statType:"Goals",club:"PL All-Time"},
    {player:"Trevor Sinclair",stat:52,statType:"Goals",club:"PL All-Time"},
    {player:"Darius Vassell",stat:52,statType:"Goals",club:"PL All-Time"},
    {player:"Carlton Cole",stat:52,statType:"Goals",club:"PL All-Time"},
    {player:"Dirk Kuijt",stat:51,statType:"Goals",club:"PL All-Time"},
    {player:"Bryan Mbeumo",stat:51,statType:"Goals",club:"PL All-Time"},
    {player:"Andrew Johnson",stat:51,statType:"Goals",club:"PL All-Time"},
    {player:"Leandro Trossard",stat:51,statType:"Goals",club:"PL All-Time"},
    {player:"Dele Alli",stat:51,statType:"Goals",club:"PL All-Time"},
    {player:"Demba Ba",stat:50,statType:"Goals",club:"PL All-Time"},
    {player:"Edin Dzeko",stat:50,statType:"Goals",club:"PL All-Time"},
    {player:"Paulo Wanchope",stat:50,statType:"Goals",club:"PL All-Time"},
    {player:"Ashley Young",stat:50,statType:"Goals",club:"PL All-Time"},
    {player:"Danny Murphy",stat:50,statType:"Goals",club:"PL All-Time"},
    {player:"Cesc Fàbregas",stat:50,statType:"Goals",club:"PL All-Time"},
    {player:"Mark Bright",stat:50,statType:"Goals",club:"PL All-Time"},
    {player:"Nolberto Solano",stat:49,statType:"Goals",club:"PL All-Time"},
    {player:"Gary McAllister",stat:49,statType:"Goals",club:"PL All-Time"},
    {player:"Ian Rush",stat:48,statType:"Goals",club:"PL All-Time"},
    {player:"Freddie Ljungberg",stat:48,statType:"Goals",club:"PL All-Time"},
    {player:"Philippe Coutinho",stat:47,statType:"Goals",club:"PL All-Time"},
    {player:"Willian",stat:47,statType:"Goals",club:"PL All-Time"},
    {player:"Bobby Zamora",stat:47,statType:"Goals",club:"PL All-Time"},
    {player:"Troy Deeney",stat:47,statType:"Goals",club:"PL All-Time"},
    {player:"Mark Noble",stat:47,statType:"Goals",club:"PL All-Time"},
    {player:"Jay Rodriguez",stat:46,statType:"Goals",club:"PL All-Time"},
    {player:"Cole Palmer",stat:46,statType:"Goals",club:"PL All-Time"},
    {player:"Jean-Philippe Mateta",stat:46,statType:"Goals",club:"PL All-Time"},
    {player:"Yoane Wissa",stat:46,statType:"Goals",club:"PL All-Time"},
    {player:"Joe Cole",stat:46,statType:"Goals",club:"PL All-Time"},
    {player:"Paul Merson",stat:46,statType:"Goals",club:"PL All-Time"},
    {player:"Alan Smith",stat:45,statType:"Goals",club:"PL All-Time"},
    {player:"César Azpilicueta",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Luís Boa Morte",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Benito Carbone",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Santiago Cazorla",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Mark Noble",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Gary Neville",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Ollie Watkins",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Shaun Wright-Phillips",stat:35,statType:"Goals",club:"PL All-Time"},
    {player:"Bobby Zamora",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Adam Lallana",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Gabriel Agbonlahor",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Steve Guppy",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Steve Stone",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Patrick Vieira",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Joey Barton",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Graham Stuart",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Jack Grealish",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Dele Alli",stat:34,statType:"Goals",club:"PL All-Time"},
    {player:"Ross Barkley",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Peter Beardsley",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Jermain Defoe",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Steven Pienaar",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Michail Antonio",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Dwight McNeil",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Marko Arnautovic",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Roy Keane",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Mark Hughes",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"James Morrison",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Dan Petrescu",stat:33,statType:"Goals",club:"PL All-Time"},
    {player:"Lucas Digne",stat:33,statType:"Goals",club:"PL All-Time"},
  ]},

  // ── 2. PL ASSISTS ──────────────────────────────────────────────────────────
  { id:"pl_assists", label:"Premier League Assists", icon:"🎯", color:"#06b6d4", globalAvg:4.9, cards:[
    {player:"Ryan Giggs",stat:162,statType:"Assists",club:"PL All-Time"},
    {player:"Kevin De Bruyne",stat:119,statType:"Assists",club:"PL All-Time"},
    {player:"Cesc Fàbregas",stat:111,statType:"Assists",club:"PL All-Time"},
    {player:"Wayne Rooney",stat:103,statType:"Assists",club:"PL All-Time"},
    {player:"Frank Lampard",stat:102,statType:"Assists",club:"PL All-Time"},
    {player:"Dennis Bergkamp",stat:94,statType:"Assists",club:"PL All-Time"},
    {player:"David Silva",stat:93,statType:"Assists",club:"PL All-Time"},
    {player:"Mohamed Salah",stat:93,statType:"Assists",club:"PL All-Time"},
    {player:"Steven Gerrard",stat:92,statType:"Assists",club:"PL All-Time"},
    {player:"James Milner",stat:90,statType:"Assists",club:"PL All-Time"},
    {player:"David Beckham",stat:80,statType:"Assists",club:"PL All-Time"},
    {player:"Christian Eriksen",stat:78,statType:"Assists",club:"PL All-Time"},
    {player:"Teddy Sheringham",stat:75,statType:"Assists",club:"PL All-Time"},
    {player:"Ashley Young",stat:74,statType:"Assists",club:"PL All-Time"},
    {player:"Thierry Henry",stat:74,statType:"Assists",club:"PL All-Time"},
    {player:"Andrew Cole",stat:73,statType:"Assists",club:"PL All-Time"},
    {player:"Son Heung-Min",stat:71,statType:"Assists",club:"PL All-Time"},
    {player:"Darren Anderton",stat:69,statType:"Assists",club:"PL All-Time"},
    {player:"Bruno Fernandes",stat:67,statType:"Assists",club:"PL All-Time"},
    {player:"Raheem Sterling",stat:65,statType:"Assists",club:"PL All-Time"},
    {player:"Trent Alexander-Arnold",stat:64,statType:"Assists",club:"PL All-Time"},
    {player:"Gareth Barry",stat:64,statType:"Assists",club:"PL All-Time"},
    {player:"Alan Shearer",stat:64,statType:"Assists",club:"PL All-Time"},
    {player:"Matthew Le Tissier",stat:63,statType:"Assists",club:"PL All-Time"},
    {player:"Nolberto Solano",stat:62,statType:"Assists",club:"PL All-Time"},
    {player:"Riyad Mahrez",stat:61,statType:"Assists",club:"PL All-Time"},
    {player:"Andy Robertson",stat:60,statType:"Assists",club:"PL All-Time"},
    {player:"Steve McManaman",stat:59,statType:"Assists",club:"PL All-Time"},
    {player:"Stewart Downing",stat:59,statType:"Assists",club:"PL All-Time"},
    {player:"Jimmy Floyd Hasselbaink",stat:58,statType:"Assists",club:"PL All-Time"},
    {player:"Jordan Henderson",stat:57,statType:"Assists",club:"PL All-Time"},
    {player:"Peter Crouch",stat:57,statType:"Assists",club:"PL All-Time"},
    {player:"Theo Walcott",stat:56,statType:"Assists",club:"PL All-Time"},
    {player:"Eric Cantona",stat:56,statType:"Assists",club:"PL All-Time"},
    {player:"Steed Malbranque",stat:55,statType:"Assists",club:"PL All-Time"},
    {player:"Kevin Davies",stat:55,statType:"Assists",club:"PL All-Time"},
    {player:"Paul Scholes",stat:55,statType:"Assists",club:"PL All-Time"},
    {player:"Danny Murphy",stat:55,statType:"Assists",club:"PL All-Time"},
    {player:"Damien Duff",stat:55,statType:"Assists",club:"PL All-Time"},
    {player:"Didier Drogba",stat:55,statType:"Assists",club:"PL All-Time"},
    {player:"Juan Mata",stat:54,statType:"Assists",club:"PL All-Time"},
    {player:"Eden Hazard",stat:54,statType:"Assists",club:"PL All-Time"},
    {player:"Mesut Özil",stat:54,statType:"Assists",club:"PL All-Time"},
    {player:"Emile Heskey",stat:53,statType:"Assists",club:"PL All-Time"},
    {player:"Leighton Baines",stat:53,statType:"Assists",club:"PL All-Time"},
    {player:"Robin van Persie",stat:53,statType:"Assists",club:"PL All-Time"},
    {player:"Roberto Firmino",stat:50,statType:"Assists",club:"PL All-Time"},
    {player:"Gylfi Sigurdsson",stat:50,statType:"Assists",club:"PL All-Time"},
    {player:"Nick Barmby",stat:50,statType:"Assists",club:"PL All-Time"},
    {player:"Aaron Lennon",stat:50,statType:"Assists",club:"PL All-Time"},
    {player:"Bernardo Silva",stat:50,statType:"Assists",club:"PL All-Time"},
    {player:"Paolo Di Canio",stat:49,statType:"Assists",club:"PL All-Time"},
    {player:"Chris Brunt",stat:49,statType:"Assists",club:"PL All-Time"},
    {player:"Les Ferdinand",stat:49,statType:"Assists",club:"PL All-Time"},
    {player:"Dwight Yorke",stat:49,statType:"Assists",club:"PL All-Time"},
    {player:"Nicolas Anelka",stat:48,statType:"Assists",club:"PL All-Time"},
    {player:"Bukayo Saka",stat:48,statType:"Assists",club:"PL All-Time"},
    {player:"James Maddison",stat:48,statType:"Assists",club:"PL All-Time"},
    {player:"Jamie Vardy",stat:48,statType:"Assists",club:"PL All-Time"},
    {player:"James Ward-Prowse",stat:48,statType:"Assists",club:"PL All-Time"},
    {player:"Sergio Agüero",stat:47,statType:"Assists",club:"PL All-Time"},
    {player:"Gary McAllister",stat:47,statType:"Assists",club:"PL All-Time"},
    {player:"Harry Kane",stat:46,statType:"Assists",club:"PL All-Time"},
    {player:"Pascal Groß",stat:46,statType:"Assists",club:"PL All-Time"},
    {player:"Aaron Ramsey",stat:46,statType:"Assists",club:"PL All-Time"},
    {player:"Antonio Valencia",stat:46,statType:"Assists",club:"PL All-Time"},
    {player:"Willian",stat:45,statType:"Assists",club:"PL All-Time"},
    {player:"Trevor Sinclair",stat:45,statType:"Assists",club:"PL All-Time"},
    {player:"Stuart Ripley",stat:45,statType:"Assists",club:"PL All-Time"},
    {player:"Jason Wilcox",stat:45,statType:"Assists",club:"PL All-Time"},
    {player:"Marc Albrighton",stat:44,statType:"Assists",club:"PL All-Time"},
    {player:"Ruel Fox",stat:44,statType:"Assists",club:"PL All-Time"},
    {player:"Gary Speed",stat:44,statType:"Assists",club:"PL All-Time"},
    {player:"Jarrod Bowen",stat:44,statType:"Assists",club:"PL All-Time"},
    {player:"Graeme Le Saux",stat:44,statType:"Assists",club:"PL All-Time"},
    {player:"Nani",stat:43,statType:"Assists",club:"PL All-Time"},
    {player:"Paul Merson",stat:43,statType:"Assists",club:"PL All-Time"},
    {player:"Mikel Arteta",stat:42,statType:"Assists",club:"PL All-Time"},
    {player:"Marcus Rashford",stat:42,statType:"Assists",club:"PL All-Time"},
    {player:"Robert Pirès",stat:41,statType:"Assists",club:"PL All-Time"},
    {player:"Eyal Berkovic",stat:41,statType:"Assists",club:"PL All-Time"},
    {player:"David Ginola",stat:41,statType:"Assists",club:"PL All-Time"},
    {player:"Brian Deane",stat:41,statType:"Assists",club:"PL All-Time"},
    {player:"Gianfranco Zola",stat:41,statType:"Assists",club:"PL All-Time"},
    {player:"Chris Sutton",stat:41,statType:"Assists",club:"PL All-Time"},
    {player:"Dimitar Berbatov",stat:40,statType:"Assists",club:"PL All-Time"},
    {player:"Jermaine Pennant",stat:40,statType:"Assists",club:"PL All-Time"},
    {player:"Samir Nasri",stat:40,statType:"Assists",club:"PL All-Time"},
    {player:"Michael Carrick",stat:40,statType:"Assists",club:"PL All-Time"},
    {player:"Gabriel Jesus",stat:40,statType:"Assists",club:"PL All-Time"},
    {player:"Morten Pedersen",stat:40,statType:"Assists",club:"PL All-Time"},
    {player:"Kieran Trippier",stat:39,statType:"Assists",club:"PL All-Time"},
    {player:"Robbie Fowler",stat:39,statType:"Assists",club:"PL All-Time"},
    {player:"Robbie Keane",stat:39,statType:"Assists",club:"PL All-Time"},
    {player:"Dennis Wise",stat:39,statType:"Assists",club:"PL All-Time"},
    {player:"Dion Dublin",stat:39,statType:"Assists",club:"PL All-Time"},
    {player:"Philippe Coutinho",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Paul Pogba",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Kyle Walker",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Alex Iwobi",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Lee Bowyer",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Sadio Mané",stat:38,statType:"Assists",club:"PL All-Time"},
    {player:"Niall Quinn",stat:37,statType:"Assists",club:"PL All-Time"},
    {player:"James Beattie",stat:37,statType:"Assists",club:"PL All-Time"},
    {player:"Ole Gunnar Solskjaer",stat:37,statType:"Assists",club:"PL All-Time"},
    {player:"Kevin Campbell",stat:37,statType:"Assists",club:"PL All-Time"},
    {player:"Youri Tielemans",stat:37,statType:"Assists",club:"PL All-Time"},
    {player:"Harry Kewell",stat:37,statType:"Assists",club:"PL All-Time"},
    {player:"Cristiano Ronaldo",stat:37,statType:"Assists",club:"PL All-Time"},
    {player:"Matthew Etherington",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Simon Davies",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Joe Cole",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Carlos Tévez",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Andy Hinchcliffe",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Charles N'Zogbia",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Martin Ødegaard",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Emmanuel Adebayor",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Ian Harte",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Leandro Trossard",stat:36,statType:"Assists",club:"PL All-Time"},
    {player:"Romelu Lukaku",stat:35,statType:"Assists",club:"PL All-Time"},
  ]},


  // ── 4. PL APPEARANCES ──────────────────────────────────────────────────────
  { id:"pl_appearances", label:"Premier League Appearances", icon:"👟", color:"#14b8a6", globalAvg:4.3, cards:[
    {player:"Gareth Barry",stat:653,statType:"Appearances",club:"PL All-Time"},
    {player:"Ryan Giggs",stat:632,statType:"Appearances",club:"PL All-Time"},
    {player:"Frank Lampard",stat:609,statType:"Appearances",club:"PL All-Time"},
    {player:"David James",stat:572,statType:"Appearances",club:"PL All-Time"},
    {player:"Gary Speed",stat:535,statType:"Appearances",club:"PL All-Time"},
    {player:"Emile Heskey",stat:516,statType:"Appearances",club:"PL All-Time"},
    {player:"Mark Schwarzer",stat:514,statType:"Appearances",club:"PL All-Time"},
    {player:"Jamie Carragher",stat:508,statType:"Appearances",club:"PL All-Time"},
    {player:"Phil Neville",stat:505,statType:"Appearances",club:"PL All-Time"},
    {player:"Rio Ferdinand",stat:504,statType:"Appearances",club:"PL All-Time"},
    {player:"Steven Gerrard",stat:504,statType:"Appearances",club:"PL All-Time"},
    {player:"Sol Campbell",stat:503,statType:"Appearances",club:"PL All-Time"},
    {player:"Paul Scholes",stat:499,statType:"Appearances",club:"PL All-Time"},
    {player:"Jermain Defoe",stat:496,statType:"Appearances",club:"PL All-Time"},
    {player:"John Terry",stat:492,statType:"Appearances",club:"PL All-Time"},
    {player:"Wayne Rooney",stat:491,statType:"Appearances",club:"PL All-Time"},
    {player:"Ashley Young",stat:485,statType:"Appearances",club:"PL All-Time"},
    {player:"Michael Carrick",stat:481,statType:"Appearances",club:"PL All-Time"},
    {player:"Sylvain Distin",stat:469,statType:"Appearances",club:"PL All-Time"},
    {player:"Peter Crouch",stat:468,statType:"Appearances",club:"PL All-Time"},
    {player:"Aaron Hughes",stat:455,statType:"Appearances",club:"PL All-Time"},
    {player:"Shay Given",stat:451,statType:"Appearances",club:"PL All-Time"},
    {player:"Brad Friedel",stat:450,statType:"Appearances",club:"PL All-Time"},
    {player:"John O'Shea",stat:445,statType:"Appearances",club:"PL All-Time"},
    {player:"Kevin Davies",stat:444,statType:"Appearances",club:"PL All-Time"},
    {player:"Petr Cech",stat:443,statType:"Appearances",club:"PL All-Time"},
    {player:"Alan Shearer",stat:441,statType:"Appearances",club:"PL All-Time"},
    {player:"Jussi Jääskeläinen",stat:436,statType:"Appearances",club:"PL All-Time"},
    {player:"Richard Dunne",stat:431,statType:"Appearances",club:"PL All-Time"},
    {player:"Gareth Southgate",stat:426,statType:"Appearances",club:"PL All-Time"},
    {player:"Leighton Baines",stat:420,statType:"Appearances",club:"PL All-Time"},
    {player:"Teddy Sheringham",stat:418,statType:"Appearances",club:"PL All-Time"},
    {player:"Danny Murphy",stat:417,statType:"Appearances",club:"PL All-Time"},
    {player:"Aaron Lennon",stat:416,statType:"Appearances",club:"PL All-Time"},
    {player:"David de Gea",stat:415,statType:"Appearances",club:"PL All-Time"},
    {player:"Andy Cole",stat:414,statType:"Appearances",club:"PL All-Time"},
    {player:"Mark Noble",stat:414,statType:"Appearances",club:"PL All-Time"},
    {player:"Nicky Butt",stat:411,statType:"Appearances",club:"PL All-Time"},
    {player:"Stewart Downing",stat:408,statType:"Appearances",club:"PL All-Time"},
    {player:"Kevin Nolan",stat:401,statType:"Appearances",club:"PL All-Time"},
    {player:"Gary Neville",stat:400,statType:"Appearances",club:"PL All-Time"},
    {player:"Tim Howard",stat:399,statType:"Appearances",club:"PL All-Time"},
    {player:"Theo Walcott",stat:397,statType:"Appearances",club:"PL All-Time"},
    {player:"Lee Bowyer",stat:397,statType:"Appearances",club:"PL All-Time"},
    {player:"Raheem Sterling",stat:396,statType:"Appearances",club:"PL All-Time"},
    {player:"Damien Duff",stat:392,statType:"Appearances",club:"PL All-Time"},
    {player:"Ben Foster",stat:390,statType:"Appearances",club:"PL All-Time"},
    {player:"Gary Cahill",stat:390,statType:"Appearances",club:"PL All-Time"},
    {player:"Jonny Evans",stat:386,statType:"Appearances",club:"PL All-Time"},
    {player:"Ashley Cole",stat:385,statType:"Appearances",club:"PL All-Time"},
    {player:"George Boateng",stat:384,statType:"Appearances",club:"PL All-Time"},
    {player:"Ray Parlour",stat:379,statType:"Appearances",club:"PL All-Time"},
    {player:"Robbie Fowler",stat:379,statType:"Appearances",club:"PL All-Time"},
    {player:"Luke Young",stat:378,statType:"Appearances",club:"PL All-Time"},
    {player:"Joe Cole",stat:378,statType:"Appearances",club:"PL All-Time"},
    {player:"Stephen Carr",stat:377,statType:"Appearances",club:"PL All-Time"},
    {player:"Paul Robinson",stat:375,statType:"Appearances",club:"PL All-Time"},
    {player:"Dwight Yorke",stat:375,statType:"Appearances",club:"PL All-Time"},
    {player:"Phil Jagielka",stat:375,statType:"Appearances",club:"PL All-Time"},
    {player:"Séamus Coleman",stat:372,statType:"Appearances",club:"PL All-Time"},
    {player:"Nigel Martyn",stat:372,statType:"Appearances",club:"PL All-Time"},
    {player:"Scott Parker",stat:368,statType:"Appearances",club:"PL All-Time"},
    {player:"Roy Keane",stat:366,statType:"Appearances",club:"PL All-Time"},
    {player:"David Unsworth",stat:364,statType:"Appearances",club:"PL All-Time"},
    {player:"Nicolas Anelka",stat:364,statType:"Appearances",club:"PL All-Time"},
    {player:"Thomas Sørensen",stat:364,statType:"Appearances",club:"PL All-Time"},
    {player:"Chris Perry",stat:363,statType:"Appearances",club:"PL All-Time"},
    {player:"Hugo Lloris",stat:361,statType:"Appearances",club:"PL All-Time"},
    {player:"Trevor Sinclair",stat:361,statType:"Appearances",club:"PL All-Time"},
    {player:"Rory Delap",stat:359,statType:"Appearances",club:"PL All-Time"},
    {player:"Glen Johnson",stat:358,statType:"Appearances",club:"PL All-Time"},
    {player:"Ugo Ehiogu",stat:355,statType:"Appearances",club:"PL All-Time"},
    {player:"Kolo Touré",stat:353,statType:"Appearances",club:"PL All-Time"},
    {player:"Nigel Winterburn",stat:352,statType:"Appearances",club:"PL All-Time"},
    {player:"Leon Osman",stat:352,statType:"Appearances",club:"PL All-Time"},
    {player:"Les Ferdinand",stat:351,statType:"Appearances",club:"PL All-Time"},
    {player:"Steve Watson",stat:351,statType:"Appearances",club:"PL All-Time"},
    {player:"Cesc Fàbregas",stat:350,statType:"Appearances",club:"PL All-Time"},
    {player:"César Azpilicueta",stat:349,statType:"Appearances",club:"PL All-Time"},
    {player:"Robbie Keane",stat:349,statType:"Appearances",club:"PL All-Time"},
    {player:"Paul Konchesky",stat:347,statType:"Appearances",club:"PL All-Time"},
    {player:"Robbie Savage",stat:346,statType:"Appearances",club:"PL All-Time"},
    {player:"Shane Long",stat:344,statType:"Appearances",club:"PL All-Time"},
    {player:"David Seaman",stat:344,statType:"Appearances",club:"PL All-Time"},
    {player:"Nick Barmby",stat:343,statType:"Appearances",club:"PL All-Time"},
    {player:"Jamie Vardy",stat:342,statType:"Appearances",club:"PL All-Time"},
    {player:"Tim Sherwood",stat:341,statType:"Appearances",club:"PL All-Time"},
    {player:"Darren Fletcher",stat:341,statType:"Appearances",club:"PL All-Time"},
    {player:"Joe Hart",stat:340,statType:"Appearances",club:"PL All-Time"},
    {player:"Steed Malbranque",stat:336,statType:"Appearances",club:"PL All-Time"},
    {player:"Kenny Cunningham",stat:335,statType:"Appearances",club:"PL All-Time"},
    {player:"Son Heung-min",stat:333,statType:"Appearances",club:"PL All-Time"},
    {player:"Hermann Hreiðarsson",stat:332,statType:"Appearances",club:"PL All-Time"},
    {player:"James Beattie",stat:331,statType:"Appearances",club:"PL All-Time"},
    {player:"Jason Dodd",stat:329,statType:"Appearances",club:"PL All-Time"},
    {player:"Denis Irwin",stat:328,statType:"Appearances",club:"PL All-Time"},
    {player:"Graeme Le Saux",stat:327,statType:"Appearances",club:"PL All-Time"},
    {player:"Michael Owen",stat:326,statType:"Appearances",club:"PL All-Time"},
    {player:"Kevin Campbell",stat:325,statType:"Appearances",club:"PL All-Time"},
    {player:"Gary McAllister",stat:325,statType:"Appearances",club:"PL All-Time"},
    {player:"Gary Kelly",stat:325,statType:"Appearances",club:"PL All-Time"},
    {player:"Kevin Kilbane",stat:325,statType:"Appearances",club:"PL All-Time"},
    {player:"Gaël Clichy",stat:325,statType:"Appearances",club:"PL All-Time"},
    {player:"Matthew Taylor",stat:325,statType:"Appearances",club:"PL All-Time"},
    {player:"Antonio Valencia",stat:325,statType:"Appearances",club:"PL All-Time"},
    {player:"Martin Keown",stat:323,statType:"Appearances",club:"PL All-Time"},
    {player:"James McArthur",stat:323,statType:"Appearances",club:"PL All-Time"},
    {player:"Robert Huth",stat:322,statType:"Appearances",club:"PL All-Time"},
    {player:"Gabriel Agbonlahor",stat:322,statType:"Appearances",club:"PL All-Time"},
    {player:"William Gallas",stat:321,statType:"Appearances",club:"PL All-Time"},
    {player:"John Arne Riise",stat:321,statType:"Appearances",club:"PL All-Time"},
    {player:"Harry Kane",stat:320,statType:"Appearances",club:"PL All-Time"},
    {player:"Darren Anderton",stat:319,statType:"Appearances",club:"PL All-Time"},
    {player:"Paul Telfer",stat:319,statType:"Appearances",club:"PL All-Time"},
    {player:"Gylfi Sigurdsson",stat:318,statType:"Appearances",club:"PL All-Time"},
    {player:"Peter Atherton",stat:318,statType:"Appearances",club:"PL All-Time"},
    {player:"Sami Hyypiä",stat:318,statType:"Appearances",club:"PL All-Time"},
    {player:"Ryan Shawcross",stat:317,statType:"Appearances",club:"PL All-Time"},
    {player:"Wayne Bridge",stat:316,statType:"Appearances",club:"PL All-Time"},
    {player:"Shaun Wright-Phillips",stat:316,statType:"Appearances",club:"PL All-Time"},
    {player:"Dennis Bergkamp",stat:315,statType:"Appearances",club:"PL All-Time"},
    {player:"Edwin van der Sar",stat:313,statType:"Appearances",club:"PL All-Time"},
    {player:"Dion Dublin",stat:312,statType:"Appearances",club:"PL All-Time"},
    {player:"Ian Walker",stat:312,statType:"Appearances",club:"PL All-Time"},
    {player:"Aaron Cresswell",stat:312,statType:"Appearances",club:"PL All-Time"},
    {player:"James Morrison",stat:311,statType:"Appearances",club:"PL All-Time"},
    {player:"Christian Eriksen",stat:310,statType:"Appearances",club:"PL All-Time"},
    {player:"Peter Schmeichel",stat:310,statType:"Appearances",club:"PL All-Time"},
    {player:"Marc Albrighton",stat:310,statType:"Appearances",club:"PL All-Time"},
    {player:"Joel Ward",stat:309,statType:"Appearances",club:"PL All-Time"},
    {player:"David Silva",stat:309,statType:"Appearances",club:"PL All-Time"},
    {player:"Wes Brown",stat:308,statType:"Appearances",club:"PL All-Time"},
    {player:"Patrick Vieira",stat:307,statType:"Appearances",club:"PL All-Time"},
    {player:"Paul Ince",stat:306,statType:"Appearances",club:"PL All-Time"},
    {player:"Steven Davis",stat:306,statType:"Appearances",club:"PL All-Time"},
    {player:"Adam Lallana",stat:305,statType:"Appearances",club:"PL All-Time"},
    {player:"Jordan Ayew",stat:305,statType:"Appearances",club:"PL All-Time"},
    {player:"Wilfried Zaha",stat:305,statType:"Appearances",club:"PL All-Time"},
    {player:"Lee Dixon",stat:305,statType:"Appearances",club:"PL All-Time"},
    {player:"Alan Wright",stat:305,statType:"Appearances",club:"PL All-Time"},
    {player:"Jack Cork",stat:304,statType:"Appearances",club:"PL All-Time"},
    {player:"Craig Dawson",stat:303,statType:"Appearances",club:"PL All-Time"},
    {player:"Simon Davies",stat:303,statType:"Appearances",club:"PL All-Time"},
    {player:"Pablo Zabaleta",stat:303,statType:"Appearances",club:"PL All-Time"},
    {player:"Phil Bardsley",stat:303,statType:"Appearances",club:"PL All-Time"},
    {player:"Gavin McCann",stat:301,statType:"Appearances",club:"PL All-Time"},
    {player:"Garry Flitcroft",stat:301,statType:"Appearances",club:"PL All-Time"},
  ]},

  // ── 3. INTL CAPS ────────────────────────────────────────────────────────
  { id:"intl_caps", label:"International Caps", icon:"🧢", color:"#ec4899", globalAvg:3.8, cards:[
    {player:"Cristiano Ronaldo",stat:226,statType:"Caps",nationality:"Portugal"},
    {player:"Lionel Messi",stat:198,statType:"Caps",nationality:"Argentina"},
    {player:"Sergio Ramos",stat:180,statType:"Caps",nationality:"Spain"},
    {player:"Gianluigi Buffon",stat:176,statType:"Caps",nationality:"Italy"},
    {player:"Luka Modrić",stat:176,statType:"Caps",nationality:"Croatia"},
    {player:"Iker Casillas",stat:167,statType:"Caps",nationality:"Spain"},
    {player:"Robert Lewandowski",stat:153,statType:"Caps",nationality:"Poland"},
    {player:"Lothar Matthäus",stat:150,statType:"Caps",nationality:"Germany"},
    {player:"Anders Svensson",stat:148,statType:"Caps",nationality:"Sweden"},
    {player:"Javier Mascherano",stat:147,statType:"Caps",nationality:"Argentina"},
    {player:"João Moutinho",stat:146,statType:"Caps",nationality:"Portugal"},
    {player:"Robbie Keane",stat:146,statType:"Caps",nationality:"Rep. Ireland"},
    {player:"Jan Vertonghen",stat:145,statType:"Caps",nationality:"Belgium"},
    {player:"Ángel Di María",stat:145,statType:"Caps",nationality:"Argentina"},
    {player:"Hugo Lloris",stat:145,statType:"Caps",nationality:"France"},
    {player:"Javier Zanetti",stat:143,statType:"Caps",nationality:"Argentina"},
    {player:"Thomas Ravelli",stat:143,statType:"Caps",nationality:"Sweden"},
    {player:"Sergio Busquets",stat:143,statType:"Caps",nationality:"Spain"},
    {player:"Simon Kjær",stat:142,statType:"Caps",nationality:"Denmark"},
    {player:"Lilian Thuram",stat:142,statType:"Caps",nationality:"France"},
    {player:"Cafu",stat:142,statType:"Caps",nationality:"Brazil"},
    {player:"Pepe",stat:141,statType:"Caps",nationality:"Portugal"},
    {player:"Fernando Muslera",stat:139,statType:"Caps",nationality:"Uruguay"},
    {player:"Granit Xhaka",stat:138,statType:"Caps",nationality:"Switzerland"},
    {player:"Olivier Giroud",stat:137,statType:"Caps",nationality:"France"},
    {player:"Miroslav Klose",stat:137,statType:"Caps",nationality:"Germany"},
    {player:"Antoine Griezmann",stat:137,statType:"Caps",nationality:"France"},
    {player:"Fabio Cannavaro",stat:136,statType:"Caps",nationality:"Italy"},
    {player:"Edinson Cavani",stat:136,statType:"Caps",nationality:"Uruguay"},
    {player:"Ivan Perišić",stat:135,statType:"Caps",nationality:"Croatia"},
    {player:"Wesley Sneijder",stat:134,statType:"Caps",nationality:"Netherlands"},
    {player:"Shay Given",stat:134,statType:"Caps",nationality:"Rep. Ireland"},
    {player:"Darijo Srna",stat:134,statType:"Caps",nationality:"Croatia"},
    {player:"Xavi",stat:133,statType:"Caps",nationality:"Spain"},
    {player:"Luis Suárez",stat:132,statType:"Caps",nationality:"Uruguay"},
    {player:"Kim Källström",stat:131,statType:"Caps",nationality:"Sweden"},
    {player:"Andrés Iniesta",stat:131,statType:"Caps",nationality:"Spain"},
    {player:"Thomas Müller",stat:131,statType:"Caps",nationality:"Germany"},
    {player:"Axel Witsel",stat:130,statType:"Caps",nationality:"Belgium"},
    {player:"Lukas Podolski",stat:130,statType:"Caps",nationality:"Germany"},
    {player:"Edwin van der Sar",stat:130,statType:"Caps",nationality:"Netherlands"},
    {player:"Nicolás Otamendi",stat:130,statType:"Caps",nationality:"Argentina"},
    {player:"Peter Schmeichel",stat:129,statType:"Caps",nationality:"Denmark"},
    {player:"Neymar",stat:128,statType:"Caps",nationality:"Brazil"},
    {player:"Luís Figo",stat:127,statType:"Caps",nationality:"Portugal"},
    {player:"Toby Alderweireld",stat:127,statType:"Caps",nationality:"Belgium"},
    {player:"Eden Hazard",stat:126,statType:"Caps",nationality:"Belgium"},
    {player:"Dani Alves",stat:126,statType:"Caps",nationality:"Brazil"},
    {player:"Andoni Zubizarreta",stat:126,statType:"Caps",nationality:"Spain"},
    {player:"Paolo Maldini",stat:126,statType:"Caps",nationality:"Italy"},
    {player:"Xherdan Shaqiri",stat:125,statType:"Caps",nationality:"Switzerland"},
    {player:"David Silva",stat:125,statType:"Caps",nationality:"Spain"},
    {player:"Peter Shilton",stat:125,statType:"Caps",nationality:"England"},
    {player:"Roberto Carlos",stat:125,statType:"Caps",nationality:"Brazil"},
    {player:"Petr Čech",stat:124,statType:"Caps",nationality:"Czech Republic"},
    {player:"Manuel Neuer",stat:124,statType:"Caps",nationality:"Germany"},
    {player:"Thierry Henry",stat:123,statType:"Caps",nationality:"France"},
    {player:"Zlatan Ibrahimović",stat:122,statType:"Caps",nationality:"Sweden"},
    {player:"Leonardo Bonucci",stat:121,statType:"Caps",nationality:"Italy"},
    {player:"Bastian Schweinsteiger",stat:121,statType:"Caps",nationality:"Germany"},
    {player:"Rüştü Reçber",stat:120,statType:"Caps",nationality:"Turkey"},
    {player:"Wayne Rooney",stat:120,statType:"Caps",nationality:"England"},
    {player:"Pat Jennings",stat:119,statType:"Caps",nationality:"N. Ireland"},
    {player:"John O'Shea",stat:118,statType:"Caps",nationality:"Rep. Ireland"},
    {player:"Karel Poborský",stat:118,statType:"Caps",nationality:"Czech Republic"},
    {player:"Giorgio Chiellini",stat:117,statType:"Caps",nationality:"Italy"},
    {player:"Daniele De Rossi",stat:117,statType:"Caps",nationality:"Italy"},
    {player:"Olof Mellberg",stat:117,statType:"Caps",nationality:"Sweden"},
    {player:"Marcel Desailly",stat:116,statType:"Caps",nationality:"France"},
    {player:"Andrea Pirlo",stat:116,statType:"Caps",nationality:"Italy"},
    {player:"Roberto Ayala",stat:115,statType:"Caps",nationality:"Argentina"},
    {player:"David Beckham",stat:115,statType:"Caps",nationality:"England"},
    {player:"Stipe Pletikosa",stat:114,statType:"Caps",nationality:"Croatia"},
    {player:"Steven Gerrard",stat:114,statType:"Caps",nationality:"England"},
    {player:"Xabi Alonso",stat:114,statType:"Caps",nationality:"Spain"},
    {player:"Toni Kroos",stat:114,statType:"Caps",nationality:"Germany"},
    {player:"Thiago Silva",stat:113,statType:"Caps",nationality:"Brazil"},
    {player:"Philipp Lahm",stat:113,statType:"Caps",nationality:"Germany"},
    {player:"Diego Forlán",stat:112,statType:"Caps",nationality:"Uruguay"},
    {player:"Hakan Şükür",stat:112,statType:"Caps",nationality:"Turkey"},
    {player:"Dino Zoff",stat:112,statType:"Caps",nationality:"Italy"},
    {player:"Frank de Boer",stat:112,statType:"Caps",nationality:"Netherlands"},
    {player:"Aaron Hughes",stat:112,statType:"Caps",nationality:"N. Ireland"},
    {player:"Nani",stat:112,statType:"Caps",nationality:"Portugal"},
    {player:"Harry Kane",stat:112,statType:"Caps",nationality:"England"},
    {player:"Jon Dahl Tomasson",stat:112,statType:"Caps",nationality:"Denmark"},
    {player:"Oleg Blokhin",stat:112,statType:"Caps",nationality:"Soviet Union"},
    {player:"Andrei Shevchenko",stat:111,statType:"Caps",nationality:"Ukraine"},
    {player:"Gareth Bale",stat:111,statType:"Caps",nationality:"Wales"},
    {player:"Igor Akinfeev",stat:111,statType:"Caps",nationality:"Russia"},
    {player:"Fernando Couto",stat:110,statType:"Caps",nationality:"Portugal"},
    {player:"Romelu Lukaku",stat:110,statType:"Caps",nationality:"Belgium"},
    {player:"Kevin Kilbane",stat:110,statType:"Caps",nationality:"Rep. Ireland"},
    {player:"Fernando Torres",stat:110,statType:"Caps",nationality:"Spain"},
    {player:"Cesc Fàbregas",stat:110,statType:"Caps",nationality:"Spain"},
    {player:"Chris Gunter",stat:109,statType:"Caps",nationality:"Wales"},
    {player:"Rafael van der Vaart",stat:109,statType:"Caps",nationality:"Netherlands"},
    {player:"Jakub Błaszczykowski",stat:109,statType:"Caps",nationality:"Poland"},
    {player:"Dries Mertens",stat:109,statType:"Caps",nationality:"Belgium"},
    {player:"Viktor Onopko",stat:109,statType:"Caps",nationality:"Russia"},
    {player:"Daley Blind",stat:108,statType:"Caps",nationality:"Netherlands"},
    {player:"Stephan Lichtsteiner",stat:108,statType:"Caps",nationality:"Switzerland"},
    {player:"Memphis Depay",stat:108,statType:"Caps",nationality:"Netherlands"},
    {player:"Zinedine Zidane",stat:108,statType:"Caps",nationality:"France"},
    {player:"Thomas Helveg",stat:108,statType:"Caps",nationality:"Denmark"},
    {player:"Bobby Moore",stat:108,statType:"Caps",nationality:"England"},
    {player:"Joshua Kimmich",stat:108,statType:"Caps",nationality:"Germany"},
    {player:"Jürgen Klinsmann",stat:108,statType:"Caps",nationality:"Germany"},
    {player:"Rui Patrício",stat:108,statType:"Caps",nationality:"Portugal"},
    {player:"Ashley Cole",stat:107,statType:"Caps",nationality:"England"},
    {player:"Patrick Vieira",stat:107,statType:"Caps",nationality:"France"},
    {player:"Bernardo Silva",stat:107,statType:"Caps",nationality:"Portugal"},
    {player:"Diego Simeone",stat:106,statType:"Caps",nationality:"Argentina"},
    {player:"Henrik Larsson",stat:106,statType:"Caps",nationality:"Sweden"},
    {player:"Giovanni van Bronckhorst",stat:106,statType:"Caps",nationality:"Netherlands"},
    {player:"Bobby Charlton",stat:106,statType:"Caps",nationality:"England"},
    {player:"Ivan Rakitić",stat:106,statType:"Caps",nationality:"Croatia"},
    {player:"Marko Arnautović",stat:106,statType:"Caps",nationality:"Austria"},
    {player:"Frank Lampard",stat:106,statType:"Caps",nationality:"England"},
    {player:"Lúcio",stat:105,statType:"Caps",nationality:"Brazil"},
    {player:"Tomáš Rosický",stat:105,statType:"Caps",nationality:"Czech Republic"},
    {player:"Billy Wright",stat:105,statType:"Caps",nationality:"England"},
    {player:"Wayne Hennessey",stat:105,statType:"Caps",nationality:"Wales"},
    {player:"Michael Laudrup",stat:104,statType:"Caps",nationality:"Denmark"},
    {player:"David Alaba",stat:104,statType:"Caps",nationality:"Austria"},
    {player:"Kevin De Bruyne",stat:104,statType:"Caps",nationality:"Belgium"},
    {player:"Dirk Kuijt",stat:104,statType:"Caps",nationality:"Netherlands"},
    {player:"Ivica Olić",stat:104,statType:"Caps",nationality:"Croatia"},
    {player:"Per Mertesacker",stat:104,statType:"Caps",nationality:"Germany"},
    {player:"Franz Beckenbauer",stat:103,statType:"Caps",nationality:"Germany"},
    {player:"Kasper Schmeichel",stat:103,statType:"Caps",nationality:"Denmark"},
    {player:"Didier Deschamps",stat:103,statType:"Caps",nationality:"France"},
    {player:"Andreas Herzog",stat:103,statType:"Caps",nationality:"Austria"},
    {player:"Raúl",stat:102,statType:"Caps",nationality:"Spain"},
    {player:"Kenny Dalglish",stat:102,statType:"Caps",nationality:"Scotland"},
    {player:"Gerard Piqué",stat:102,statType:"Caps",nationality:"Spain"},
    {player:"Robin van Persie",stat:102,statType:"Caps",nationality:"Netherlands"},
    {player:"Sergio Agüero",stat:101,statType:"Caps",nationality:"Argentina"},
    {player:"Phillip Cocu",stat:101,statType:"Caps",nationality:"Netherlands"},
    {player:"Cláudio Taffarel",stat:101,statType:"Caps",nationality:"Brazil"},
    {player:"Robinho",stat:100,statType:"Caps",nationality:"Brazil"},
    {player:"Diego Lugano",stat:100,statType:"Caps",nationality:"Uruguay"},
    {player:"Tuncay Şanlı",stat:100,statType:"Caps",nationality:"Turkey"},
    {player:"Damien Duff",stat:100,statType:"Caps",nationality:"Rep. Ireland"},
    {player:"Grzegorz Lato",stat:100,statType:"Caps",nationality:"Poland"},
    {player:"Dario Šimić",stat:100,statType:"Caps",nationality:"Croatia"},
    {player:"Djalma Santos",stat:98,statType:"Caps",nationality:"Brazil"},
    {player:"Ronaldo",stat:98,statType:"Caps",nationality:"Brazil"},
    {player:"Gianluca Zambrotta",stat:98,statType:"Caps",nationality:"Italy"},
    {player:"Ronaldinho",stat:97,statType:"Caps",nationality:"Brazil"},
    {player:"Bixente Lizarazu",stat:97,statType:"Caps",nationality:"France"},
    {player:"Kazimierz Deyna",stat:97,statType:"Caps",nationality:"Poland"},
    {player:"Laurent Blanc",stat:97,statType:"Caps",nationality:"France"},
    {player:"Oscar Ruggeri",stat:97,statType:"Caps",nationality:"Argentina"},
    {player:"Karim Benzema",stat:97,statType:"Caps",nationality:"France"},
    {player:"Bruno Alves",stat:96,statType:"Caps",nationality:"Portugal"},
    {player:"Sergio Romero",stat:96,statType:"Caps",nationality:"Argentina"},
    {player:"Kyle Walker",stat:96,statType:"Caps",nationality:"England"},
    {player:"Thomas Vermaelen",stat:96,statType:"Caps",nationality:"Belgium"},
    {player:"Giacinto Facchetti",stat:94,statType:"Caps",nationality:"Italy"},
    {player:"Rui Costa",stat:94,statType:"Caps",nationality:"Portugal"},
    {player:"Gilmar",stat:94,statType:"Caps",nationality:"Brazil"},
    {player:"Milan Baroš",stat:93,statType:"Caps",nationality:"Czech Republic"},
    {player:"Pavel Nedvěd",stat:91,statType:"Caps",nationality:"Czech Republic"},
    {player:"Diego Maradona",stat:91,statType:"Caps",nationality:"Argentina"},
    {player:"Niall Quinn",stat:91,statType:"Caps",nationality:"Rep. Ireland"},
    {player:"Jim Leighton",stat:91,statType:"Caps",nationality:"Scotland"},
    {player:"Alessandro Del Piero",stat:91,statType:"Caps",nationality:"Italy"},
    {player:"Bryan Robson",stat:90,statType:"Caps",nationality:"England"},
    {player:"Jordan Henderson",stat:89,statType:"Caps",nationality:"England"},
    {player:"Gökhan Inler",stat:89,statType:"Caps",nationality:"Switzerland"},
    {player:"Ariel Ortega",stat:87,statType:"Caps",nationality:"Argentina"},
    {player:"Ashley Williams",stat:86,statType:"Caps",nationality:"Wales"},
    {player:"Ferenc Puskás",stat:85,statType:"Caps",nationality:"Hungary"},
    {player:"Dragan Džajić",stat:85,statType:"Caps",nationality:"Yugoslavia"},
    {player:"Dragan Stojković",stat:84,statType:"Caps",nationality:"Yugoslavia"},
    {player:"Paul McGrath",stat:83,statType:"Caps",nationality:"Rep. Ireland"},
    {player:"Brian Laudrup",stat:82,statType:"Caps",nationality:"Denmark"},
    {player:"Giuseppe Bergomi",stat:81,statType:"Caps",nationality:"Italy"},
    {player:"Zbigniew Boniek",stat:80,statType:"Caps",nationality:"Poland"},
    {player:"Darren Fletcher",stat:80,statType:"Caps",nationality:"Scotland"},
    {player:"Lajos Détári",stat:79,statType:"Caps",nationality:"Hungary"},
    {player:"Lev Yashin",stat:78,statType:"Caps",nationality:"Soviet Union"},
    {player:"Alexander Mostovoi",stat:75,statType:"Caps",nationality:"Russia"},
    {player:"Freddie Ljungberg",stat:75,statType:"Caps",nationality:"Sweden"},
    {player:"Andrei Arshavin",stat:75,statType:"Caps",nationality:"Russia"},
    {player:"Andriy Voronin",stat:74,statType:"Caps",nationality:"Ukraine"},
    {player:"Ian Rush",stat:73,statType:"Caps",nationality:"Wales"},
    {player:"Mark Hughes",stat:72,statType:"Caps",nationality:"Wales"},
    {player:"Sándor Kocsis",stat:68,statType:"Caps",nationality:"Hungary"},
    {player:"Łukasz Piszczek",stat:66,statType:"Caps",nationality:"Poland"},
    {player:"Siniša Mihajlović",stat:63,statType:"Caps",nationality:"Serbia"},
    {player:"Ally McCoist",stat:61,statType:"Caps",nationality:"Scotland"},
    {player:"İlhan Mansız",stat:58,statType:"Caps",nationality:"Turkey"},
    {player:"Scott Brown",stat:55,statType:"Caps",nationality:"Scotland"},
    {player:"Denis Law",stat:55,statType:"Caps",nationality:"Scotland"},
    {player:"Joe Jordan",stat:52,statType:"Caps",nationality:"Scotland"},
    {player:"George Best",stat:37,statType:"Caps",nationality:"N. Ireland"},
  ]},

  // ── 4. INTL GOALS ───────────────────────────────────────────────────────
  { id:"intl_goals", label:"International Goals", icon:"🏆", color:"#3b82f6", globalAvg:4.2, cards:[
    {player:"Cristiano Ronaldo",stat:143,statType:"Goals",nationality:"Portugal"},
    {player:"Lionel Messi",stat:116,statType:"Goals",nationality:"Argentina"},
    {player:"Romelu Lukaku",stat:85,statType:"Goals",nationality:"Belgium"},
    {player:"Ferenc Puskás",stat:84,statType:"Goals",nationality:"Hungary"},
    {player:"Robert Lewandowski",stat:82,statType:"Goals",nationality:"Poland"},
    {player:"Neymar",stat:79,statType:"Goals",nationality:"Brazil"},
    {player:"Harry Kane",stat:78,statType:"Goals",nationality:"England"},
    {player:"Pelé",stat:77,statType:"Goals",nationality:"Brazil"},
    {player:"Sándor Kocsis",stat:75,statType:"Goals",nationality:"Hungary"},
    {player:"Miroslav Klose",stat:71,statType:"Goals",nationality:"Germany"},
    {player:"Gerd Müller",stat:68,statType:"Goals",nationality:"Germany"},
    {player:"Robbie Keane",stat:68,statType:"Goals",nationality:"Rep. Ireland"},
    {player:"Luis Suárez",stat:68,statType:"Goals",nationality:"Uruguay"},
    {player:"Zlatan Ibrahimović",stat:62,statType:"Goals",nationality:"Sweden"},
    {player:"Ronaldo",stat:62,statType:"Goals",nationality:"Brazil"},
    {player:"David Villa",stat:59,statType:"Goals",nationality:"Spain"},
    {player:"Edinson Cavani",stat:58,statType:"Goals",nationality:"Uruguay"},
    {player:"Olivier Giroud",stat:57,statType:"Goals",nationality:"France"},
    {player:"Gabriel Batistuta",stat:56,statType:"Goals",nationality:"Argentina"},
    {player:"Kylian Mbappé",stat:56,statType:"Goals",nationality:"France"},
    {player:"Memphis Depay",stat:55,statType:"Goals",nationality:"Netherlands"},
    {player:"Jan Koller",stat:55,statType:"Goals",nationality:"Czech Republic"},
    {player:"Romário",stat:55,statType:"Goals",nationality:"Brazil"},
    {player:"Wayne Rooney",stat:53,statType:"Goals",nationality:"England"},
    {player:"Jon Dahl Tomasson",stat:52,statType:"Goals",nationality:"Denmark"},
    {player:"Hakan Şükür",stat:51,statType:"Goals",nationality:"Turkey"},
    {player:"Thierry Henry",stat:51,statType:"Goals",nationality:"France"},
    {player:"Robin van Persie",stat:50,statType:"Goals",nationality:"Netherlands"},
    {player:"Lukas Podolski",stat:49,statType:"Goals",nationality:"Germany"},
    {player:"Sven Rydell",stat:49,statType:"Goals",nationality:"Sweden"},
    {player:"Bobby Charlton",stat:49,statType:"Goals",nationality:"England"},
    {player:"Zico",stat:48,statType:"Goals",nationality:"Brazil"},
    {player:"Andrei Shevchenko",stat:48,statType:"Goals",nationality:"Ukraine"},
    {player:"Gary Lineker",stat:48,statType:"Goals",nationality:"England"},
    {player:"Rudi Völler",stat:47,statType:"Goals",nationality:"Germany"},
    {player:"Jürgen Klinsmann",stat:47,statType:"Goals",nationality:"Germany"},
    {player:"Pauleta",stat:47,statType:"Goals",nationality:"Portugal"},
    {player:"Davor Šuker",stat:45,statType:"Goals",nationality:"Croatia"},
    {player:"Thomas Müller",stat:45,statType:"Goals",nationality:"Germany"},
    {player:"Grzegorz Lato",stat:45,statType:"Goals",nationality:"Poland"},
    {player:"Karl-Heinz Rummenigge",stat:45,statType:"Goals",nationality:"Germany"},
    {player:"Jimmy Greaves",stat:44,statType:"Goals",nationality:"England"},
    {player:"Raúl",stat:44,statType:"Goals",nationality:"Spain"},
    {player:"Antoine Griezmann",stat:44,statType:"Goals",nationality:"France"},
    {player:"Gunnar Nordahl",stat:43,statType:"Goals",nationality:"Sweden"},
    {player:"Uwe Seeler",stat:43,statType:"Goals",nationality:"Germany"},
    {player:"Michael Ballack",stat:42,statType:"Goals",nationality:"Germany"},
    {player:"Klaas-Jan Huntelaar",stat:42,statType:"Goals",nationality:"Netherlands"},
    {player:"Oleg Blokhin",stat:42,statType:"Goals",nationality:"Soviet Union"},
    {player:"Eusébio",stat:41,statType:"Goals",nationality:"Portugal"},
    {player:"Kazimierz Deyna",stat:41,statType:"Goals",nationality:"Poland"},
    {player:"Michel Platini",stat:41,statType:"Goals",nationality:"France"},
    {player:"Sergio Agüero",stat:41,statType:"Goals",nationality:"Argentina"},
    {player:"Milan Baroš",stat:41,statType:"Goals",nationality:"Czech Republic"},
    {player:"Gareth Bale",stat:41,statType:"Goals",nationality:"Wales"},
    {player:"Patrick Kluivert",stat:40,statType:"Goals",nationality:"Netherlands"},
    {player:"Michael Owen",stat:40,statType:"Goals",nationality:"England"},
    {player:"Bebeto",stat:39,statType:"Goals",nationality:"Brazil"},
    {player:"Fernando Torres",stat:38,statType:"Goals",nationality:"Spain"},
    {player:"Henrik Larsson",stat:37,statType:"Goals",nationality:"Sweden"},
    {player:"Oliver Bierhoff",stat:37,statType:"Goals",nationality:"Germany"},
    {player:"Michael Laudrup",stat:37,statType:"Goals",nationality:"Denmark"},
    {player:"Karim Benzema",stat:37,statType:"Goals",nationality:"France"},
    {player:"Dennis Bergkamp",stat:37,statType:"Goals",nationality:"Netherlands"},
    {player:"Álvaro Morata",stat:37,statType:"Goals",nationality:"Spain"},
    {player:"Arjen Robben",stat:37,statType:"Goals",nationality:"Netherlands"},
    {player:"Marko Arnautović",stat:36,statType:"Goals",nationality:"Austria"},
    {player:"Lautaro Martínez",stat:36,statType:"Goals",nationality:"Argentina"},
    {player:"Diego Forlán",stat:36,statType:"Goals",nationality:"Uruguay"},
    {player:"Gigi Riva",stat:35,statType:"Goals",nationality:"Italy"},
    {player:"Ruud van Nistelrooij",stat:35,statType:"Goals",nationality:"Netherlands"},
    {player:"Hernán Crespo",stat:35,statType:"Goals",nationality:"Argentina"},
    {player:"Rivaldo",stat:35,statType:"Goals",nationality:"Brazil"},
    {player:"Faas Wilkes",stat:35,statType:"Goals",nationality:"Netherlands"},
    {player:"David Silva",stat:35,statType:"Goals",nationality:"Spain"},
    {player:"David Trezeguet",stat:34,statType:"Goals",nationality:"France"},
    {player:"Diego Maradona",stat:34,statType:"Goals",nationality:"Argentina"},
    {player:"Eden Hazard",stat:33,statType:"Goals",nationality:"Belgium"},
    {player:"Jairzinho",stat:33,statType:"Goals",nationality:"Brazil"},
    {player:"Johan Cruijff",stat:33,statType:"Goals",nationality:"Netherlands"},
    {player:"Giuseppe Meazza",stat:33,statType:"Goals",nationality:"Italy"},
    {player:"Ivan Perišić",stat:33,statType:"Goals",nationality:"Croatia"},
    {player:"Mario Mandžukić",stat:33,statType:"Goals",nationality:"Croatia"},
    {player:"Ronaldinho",stat:33,statType:"Goals",nationality:"Brazil"},
    {player:"Xherdan Shaqiri",stat:32,statType:"Goals",nationality:"Switzerland"},
    {player:"Luís Figo",stat:32,statType:"Goals",nationality:"Portugal"},
    {player:"Ademir",stat:32,statType:"Goals",nationality:"Brazil"},
    {player:"Tostão",stat:32,statType:"Goals",nationality:"Brazil"},
    {player:"Ángel Di María",stat:31,statType:"Goals",nationality:"Argentina"},
    {player:"Mario Gómez",stat:31,statType:"Goals",nationality:"Germany"},
    {player:"Zinedine Zidane",stat:31,statType:"Goals",nationality:"France"},
    {player:"Gonzalo Higuaín",stat:31,statType:"Goals",nationality:"Argentina"},
    {player:"Jean-Pierre Papin",stat:30,statType:"Goals",nationality:"France"},
    {player:"Paul Van Himst",stat:30,statType:"Goals",nationality:"Belgium"},
    {player:"Zizinho",stat:30,statType:"Goals",nationality:"Brazil"},
    {player:"Just Fontaine",stat:30,statType:"Goals",nationality:"France"},
    {player:"Silvio Piola",stat:30,statType:"Goals",nationality:"Italy"},
    {player:"Kenny Dalglish",stat:30,statType:"Goals",nationality:"Scotland"},
    {player:"Denis Law",stat:30,statType:"Goals",nationality:"Scotland"},
    {player:"Alan Shearer",stat:30,statType:"Goals",nationality:"England"},
    {player:"Tom Finney",stat:30,statType:"Goals",nationality:"England"},
    {player:"Nat Lofthouse",stat:30,statType:"Goals",nationality:"England"},
    {player:"Frank Lampard",stat:29,statType:"Goals",nationality:"England"},
    {player:"Vivian Woodward",stat:29,statType:"Goals",nationality:"England"},
    {player:"Nuno Gomes",stat:29,statType:"Goals",nationality:"Portugal"},
    {player:"Andreas Möller",stat:29,statType:"Goals",nationality:"Germany"},
    {player:"Fernando Hierro",stat:29,statType:"Goals",nationality:"Spain"},
    {player:"Bruno Fernandes",stat:28,statType:"Goals",nationality:"Portugal"},
    {player:"Marc Wilmots",stat:28,statType:"Goals",nationality:"Belgium"},
    {player:"Youri Djorkaeff",stat:28,statType:"Goals",nationality:"France"},
    {player:"Steve Bloomer",stat:28,statType:"Goals",nationality:"England"},
    {player:"Ian Rush",stat:28,statType:"Goals",nationality:"Wales"},
    {player:"Predrag Mijatović",stat:28,statType:"Goals",nationality:"Yugoslavia"},
    {player:"Vladimír Šmicer",stat:27,statType:"Goals",nationality:"Czech Republic"},
    {player:"David Platt",stat:27,statType:"Goals",nationality:"England"},
    {player:"Alessandro Del Piero",stat:27,statType:"Goals",nationality:"Italy"},
    {player:"Fernando Morientes",stat:27,statType:"Goals",nationality:"Spain"},
    {player:"Hélder Postiga",stat:27,statType:"Goals",nationality:"Portugal"},
    {player:"Roberto Baggio",stat:27,statType:"Goals",nationality:"Italy"},
    {player:"Andreas Herzog",stat:26,statType:"Goals",nationality:"Austria"},
    {player:"Sylvain Wiltord",stat:26,statType:"Goals",nationality:"France"},
    {player:"Emilio Butragueño",stat:26,statType:"Goals",nationality:"Spain"},
    {player:"Kevin De Bruyne",stat:26,statType:"Goals",nationality:"Belgium"},
    {player:"Rui Costa",stat:26,statType:"Goals",nationality:"Portugal"},
    {player:"Filippo Inzaghi",stat:25,statType:"Goals",nationality:"Italy"},
    {player:"Alessandro Altobelli",stat:25,statType:"Goals",nationality:"Italy"},
    {player:"Luka Modrić",stat:24,statType:"Goals",nationality:"Croatia"},
    {player:"Mikel Oyarzabal",stat:24,statType:"Goals",nationality:"Spain"},
    {player:"Nani",stat:24,statType:"Goals",nationality:"Portugal"},
    {player:"Luis Artime",stat:24,statType:"Goals",nationality:"Argentina"},
    {player:"Zbigniew Boniek",stat:24,statType:"Goals",nationality:"Poland"},
    {player:"Marco van Basten",stat:24,statType:"Goals",nationality:"Netherlands"},
    {player:"Tomáš Rosický",stat:23,statType:"Goals",nationality:"Czech Republic"},
    {player:"Francesco Graziani",stat:23,statType:"Goals",nationality:"Italy"},
    {player:"Sergio Ramos",stat:23,statType:"Goals",nationality:"Spain"},
    {player:"Christian Vieri",stat:23,statType:"Goals",nationality:"Italy"},
    {player:"Jan Ceulemans",stat:23,statType:"Goals",nationality:"Belgium"},
    {player:"Dragan Džajić",stat:23,statType:"Goals",nationality:"Yugoslavia"},
    {player:"Alfredo Di Stéfano",stat:23,statType:"Goals",nationality:"Spain"},
    {player:"Ferran Torres",stat:23,statType:"Goals",nationality:"Spain"},
    {player:"Anders Svensson",stat:22,statType:"Goals",nationality:"Sweden"},
    {player:"Tuncay Şanlı",stat:22,statType:"Goals",nationality:"Turkey"},
    {player:"Darijo Srna",stat:22,statType:"Goals",nationality:"Croatia"},
    {player:"Daniel Passarella",stat:22,statType:"Goals",nationality:"Argentina"},
    {player:"Sandro Mazzola",stat:22,statType:"Goals",nationality:"Italy"},
    {player:"Dries Mertens",stat:21,statType:"Goals",nationality:"Belgium"},
    {player:"José Sanfilippo",stat:21,statType:"Goals",nationality:"Argentina"},
    {player:"Brian Laudrup",stat:21,statType:"Goals",nationality:"Denmark"},
    {player:"Niall Quinn",stat:21,statType:"Goals",nationality:"Rep. Ireland"},
    {player:"Daniele De Rossi",stat:21,statType:"Goals",nationality:"Italy"},
    {player:"Lajos Détári",stat:21,statType:"Goals",nationality:"Hungary"},
    {player:"Jakub Błaszczykowski",stat:21,statType:"Goals",nationality:"Poland"},
    {player:"Roman Pavlyuchenko",stat:21,statType:"Goals",nationality:"Russia"},
    {player:"Leopoldo Luque",stat:21,statType:"Goals",nationality:"Argentina"},
    {player:"Allan Simonsen",stat:20,statType:"Goals",nationality:"Denmark"},
    {player:"Ivica Olić",stat:20,statType:"Goals",nationality:"Croatia"},
    {player:"Paolo Rossi",stat:20,statType:"Goals",nationality:"Italy"},
    {player:"Frank Stapleton",stat:20,statType:"Goals",nationality:"Rep. Ireland"},
    {player:"Ally McCoist",stat:19,statType:"Goals",nationality:"Scotland"},
    {player:"İlhan Mansız",stat:18,statType:"Goals",nationality:"Turkey"},
    {player:"Andrei Arshavin",stat:17,statType:"Goals",nationality:"Russia"},
    {player:"Granit Xhaka",stat:17,statType:"Goals",nationality:"Switzerland"},
    {player:"Ruud Gullit",stat:17,statType:"Goals",nationality:"Netherlands"},
    {player:"Mark Hughes",stat:16,statType:"Goals",nationality:"Wales"},
    {player:"David Alaba",stat:15,statType:"Goals",nationality:"Austria"},
    {player:"Franz Beckenbauer",stat:14,statType:"Goals",nationality:"Germany"},
    {player:"Andrés Iniesta",stat:14,statType:"Goals",nationality:"Spain"},
    {player:"Xavi",stat:12,statType:"Goals",nationality:"Spain"},
    {player:"Paolo Maldini",stat:7,statType:"Goals",nationality:"Italy"},
    {player:"Lev Yashin",stat:0,statType:"Goals",nationality:"Soviet Union"},
  ]},


  // ── COMING SOON CATEGORIES ──────────────────────────────────────────────────
  { id:"transfer_fees", label:"Transfer Fees", icon:"💰", color:"#f59e0b", comingSoon:true, globalAvg:0, cards:[] },
  { id:"la_liga_goals", label:"La Liga Goals", icon:"🏟️", color:"#ef4444", comingSoon:true, globalAvg:0, cards:[] },
  { id:"ucl_goals",     label:"UCL Goals", icon:"⭐", color:"#8b5cf6", comingSoon:true, globalAvg:0, cards:[] },
  { id:"mufc_goals",    label:"Man Utd Goals", icon:"👹", color:"#dc2626", comingSoon:true, globalAvg:0, cards:[] },
  { id:"lfc_goals",     label:"Liverpool Goals", icon:"🔴", color:"#cc0000", comingSoon:true, globalAvg:0, cards:[] },
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

// Seeded pseudo-random from a string — gives stable but varied numbers
function seededVal(name, salt, min, max) {
  let h=salt;for(const c of name)h=(h*31+c.charCodeAt(0))&0xffff;
  return min+Math.floor((h%(max-min+1)));
}

function buildCapsBoard(streak, username) {
  const name = username||"You";
  const sim = SIM_NAMES.map(n=>({name:n, score:seededVal(n,7,1,180), isYou:false}));
  const you = streak>0?[{name,score:streak,isYou:true}]:[];
  return [...sim,...you].sort((a,b)=>b.score-a.score).slice(0,20).map((e,i)=>({...e,rank:i+1}));
}

function buildRushAllTimeBoard(rushScores, username) {
  const name = username||"You";
  const sim = SIM_NAMES.map(n=>({name:n, score:seededVal(n,13,4,28), isYou:false}));
  const best = rushScores.length?Math.max(...rushScores):null;
  const you = best!==null?[{name,score:best,isYou:true}]:[];
  return [...sim,...you].sort((a,b)=>b.score-a.score).slice(0,20).map((e,i)=>({...e,rank:i+1}));
}

function buildRushWeeklyBoard(rushScores, username) {
  const name = username||"You";
  // Weekly sim scores are lower — fresh slate each Monday
  const sim = SIM_NAMES.map(n=>({name:n, score:seededVal(n,97,1,16), isYou:false}));
  const best = rushScores.length?Math.max(...rushScores):null;
  const you = best!==null?[{name,score:best,isYou:true}]:[];
  return [...sim,...you].sort((a,b)=>b.score-a.score).slice(0,20).map((e,i)=>({...e,rank:i+1}));
}

// Keep old function so nothing else breaks
function buildLeaderboard(scores,username){return buildRushAllTimeBoard(scores,username);}

function LeaderboardScreen({onBack, rushScores, username, streak, defaultTab="weekly"}){
  const [tab, setTab] = useState(defaultTab);

  const capsBoard    = buildCapsBoard(streak, username);
  const allTimeBoard = buildRushAllTimeBoard(rushScores, username);
  const weeklyBoard  = buildRushWeeklyBoard(rushScores, username);

  const board = tab==="caps" ? capsBoard : tab==="alltime" ? allTimeBoard : weeklyBoard;
  const youEntry = board.find(e=>e.isYou);

  const TABS = [
    {id:"weekly",  label:"Top Scorer",  sub:"this week",  icon:"⚽", accent:"#06b6d4", desc:"Best Training Pitch score · this week"},
    {id:"alltime", label:"Golden Boot", sub:"all time",    icon:"🥾", accent:"#ec4899", desc:"Best single Training Pitch score · all-time"},
    {id:"caps",    label:"Caps",        sub:"all time",    icon:"🧢", accent:"#d97706", desc:"Longest active streak · all-time"},
  ];
  const activeTab = TABS.find(t=>t.id===tab);

  // Your stat for the active tab
  const yourStat = tab==="caps" ? (streak||0) :
                   tab==="alltime" ? (rushScores.length?Math.max(...rushScores):null) :
                   (rushScores.length?Math.max(...rushScores):null);

  const yourStatus = getCareerStatus(streak||0);

  // Football pyramid position message based on rank out of board size
  function getPyramidMessage(rank, total) {
    const pct = rank / total;
    if(rank === 1)   return {msg:"Top of the league. No one touches you.",  badge:"🏆 Champions"};
    if(rank <= 3)    return {msg:"Title challenger. Trophy's in sight.",      badge:"🥇 Title Race"};
    if(pct <= 0.15)  return {msg:"European places — you're in the hunt.",    badge:"🔵 Top 4 Push"};
    if(pct <= 0.30)  return {msg:"Solid mid-table. Respectable showing.",    badge:"🟢 Mid Table"};
    if(pct <= 0.50)  return {msg:"Just outside the top half. Push on.",     badge:"🟡 Upper Mid"};
    if(pct <= 0.65)  return {msg:"Championship push. You can go up.",        badge:"🟠 Championship"};
    if(pct <= 0.80)  return {msg:"League One territory. Need a reaction.",   badge:"🔴 League One"};
    if(pct <= 0.90)  return {msg:"League Two. Relegation is getting close.", badge:"⚠️ League Two"};
    return             {msg:"Non-league. Time to get serious.",              badge:"💀 Non League"};
  }

  return(
    <PageWrap>
      <div style={{width:"100%"}}>

        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.7)",fontSize:11,cursor:"pointer",padding:"8px 12px",fontFamily:"'Inter',sans-serif",fontWeight:600,flexShrink:0}}>← Back</button>
          <div style={{flex:1,minWidth:0}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>StatStreaks</div>
            <div style={{fontSize:26,fontWeight:900,color:"#ffffff",fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,letterSpacing:1}}>Leaderboards</div>
          </div>
          {/* Your identity — truncates long names */}
          <div style={{textAlign:"right",flexShrink:0,maxWidth:"36%",minWidth:0}}>
            <div style={{fontSize:12,fontWeight:800,color:yourStatus.col,fontFamily:"'Inter',sans-serif",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{username||"—"}</div>
            <div style={{fontSize:9,color:yourStatus.col,opacity:0.75,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginTop:2,whiteSpace:"nowrap"}}>{yourStatus.icon} {yourStatus.label}</div>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{display:"flex",gap:6,marginBottom:14}}>
          {TABS.map(t=>(
            <button key={t.id} onClick={()=>setTab(t.id)} style={{
              flex:1,padding:"9px 4px",borderRadius:10,border:"none",cursor:"pointer",
              fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:700,letterSpacing:0.5,
              textTransform:"uppercase",transition:"all 0.15s",
              background: tab===t.id ? "linear-gradient(135deg,#ffffff,#f1f5f9)" : "rgba(255,255,255,0.07)",
              color: tab===t.id ? t.accent : "rgba(255,255,255,0.4)",
              boxShadow: tab===t.id ? `0 4px 12px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.8)` : "none",
              borderBottom: tab===t.id ? `2px solid ${t.accent}` : "2px solid transparent",
            }}><div style={{lineHeight:1.2}}>{t.icon} {t.label}</div><div style={{fontSize:8,opacity:0.7,marginTop:2,textTransform:"lowercase",letterSpacing:0.3,fontWeight:500}}>{t.sub}</div></button>
          ))}
        </div>

        {/* Your stat card */}
        {yourStat!==null&&(
          <div style={{
            background:`linear-gradient(135deg,${activeTab.accent}22,${activeTab.accent}08)`,
            border:`1px solid ${activeTab.accent}40`,
            borderRadius:14,padding:"14px 16px",marginBottom:12,
            boxShadow:`0 4px 20px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.05)`,
            position:"relative",overflow:"hidden",
          }}>
            <div style={{position:"absolute",inset:0,backgroundImage:`repeating-linear-gradient(135deg,transparent,transparent 14px,${activeTab.accent}08 14px,${activeTab.accent}08 15px)`,pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${activeTab.accent}60,transparent)`}}/>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
              <div>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:2,fontWeight:600,marginBottom:4,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Your {tab==="caps"?"Caps":"Score"}</div>
                <div style={{fontSize:44,fontWeight:900,color:activeTab.accent,fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,textShadow:`0 0 20px ${activeTab.accent}55`}}>{yourStat}</div>
                <div style={{fontSize:10,color:"rgba(255,255,255,0.35)",fontFamily:"'Inter',sans-serif",marginTop:2}}>{activeTab.desc}</div>
              </div>
              {youEntry&&(()=>{
                const pyramid = getPyramidMessage(youEntry.rank, board.length);
                return(
                  <div style={{textAlign:"right"}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:2,fontWeight:600,marginBottom:4,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Your Rank</div>
                    <div style={{fontSize:44,fontWeight:900,color:activeTab.accent,fontFamily:"'Bebas Neue',sans-serif",lineHeight:1}}>#{youEntry.rank}</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.4)",fontFamily:"'Inter',sans-serif",marginTop:2}}>of {board.length} players</div>
                  </div>
                );
              })()}
            </div>
            {youEntry&&tab!=="caps"&&(()=>{
              const pyramid = getPyramidMessage(youEntry.rank, board.length);
              return(
                <div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${activeTab.accent}25`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative"}}>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontFamily:"'Inter',sans-serif",fontStyle:"italic"}}>{pyramid.msg}</div>
                  <div style={{fontSize:9,fontWeight:700,color:activeTab.accent,fontFamily:"'Inter',sans-serif",background:`${activeTab.accent}18`,padding:"3px 8px",borderRadius:6,flexShrink:0,marginLeft:10}}>{pyramid.badge}</div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Board table */}
        <div style={{
          background:`linear-gradient(145deg,#1a2535 0%,#0f1923 100%)`,
          borderRadius:14,overflow:"hidden",
          boxShadow:`0 4px 20px rgba(0,0,0,0.3), 0 0 40px ${activeTab.accent}08`,
          border:`1px solid ${activeTab.accent}25`,
          position:"relative",
        }}>
          <div style={{position:"absolute",inset:0,backgroundImage:`repeating-linear-gradient(135deg,transparent,transparent 16px,${activeTab.accent}05 16px,${activeTab.accent}05 17px)`,pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:`linear-gradient(90deg,transparent,${activeTab.accent}50,transparent)`,pointerEvents:"none"}}/>
          {/* Column headers */}
          <div style={{display:"flex",alignItems:"center",padding:"9px 16px",borderBottom:`1px solid ${activeTab.accent}15`,background:"rgba(255,255,255,0.03)",position:"relative"}}>
            <div style={{width:34,color:"rgba(255,255,255,0.35)",fontSize:8,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>#</div>
            <div style={{flex:1,color:"rgba(255,255,255,0.35)",fontSize:8,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Player</div>
            <div style={{width:50,textAlign:"right",color:"rgba(255,255,255,0.35)",fontSize:8,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>{tab==="caps"?"Caps":"Score"}</div>
          </div>

          {board.map((e,i)=>{
            const medal = i===0?"🥇":i===1?"🥈":i===2?"🥉":null;
            const entryStatus = getCareerStatus(tab==="caps"?e.score:0);
            return(
              <div key={i} style={{
                display:"flex",alignItems:"center",padding:"10px 16px",
                borderBottom:i<board.length-1?`1px solid rgba(255,255,255,0.04)`:"none",
                background:e.isYou?`${activeTab.accent}15`:"transparent",
                position:"relative",
              }}>
                {e.isYou&&<div style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:activeTab.accent,borderRadius:"0 2px 2px 0"}}/>}
                <div style={{width:34,fontFamily:"'Bebas Neue',sans-serif",fontWeight:700,fontSize:medal?16:13,
                  color:i===0?"#d97706":i===1?"#94a3b8":i===2?"#b45309":"rgba(255,255,255,0.2)"}}>
                  {medal||e.rank}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    <span style={{fontFamily:"'Inter',sans-serif",fontWeight:e.isYou?800:500,fontSize:13,
                      color:e.isYou?activeTab.accent:"rgba(255,255,255,0.75)",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>
                      {e.name}
                    </span>
                    {e.isYou&&<span style={{fontSize:8,color:activeTab.accent,background:`${activeTab.accent}25`,padding:"2px 5px",borderRadius:4,fontWeight:800,fontFamily:"'Inter',sans-serif",flexShrink:0}}>YOU</span>}
                  </div>
                  {tab==="caps"&&(
                    <div style={{fontSize:9,color:entryStatus.col,fontWeight:600,fontFamily:"'Inter',sans-serif",marginTop:1,opacity:0.8}}>
                      {entryStatus.icon} {entryStatus.label}
                    </div>
                  )}
                </div>
                <div style={{width:50,textAlign:"right",fontFamily:"'Bebas Neue',sans-serif",fontWeight:700,fontSize:20,
                  color:e.isYou?activeTab.accent:i<3?"#ffffff":"rgba(255,255,255,0.3)"}}>
                  {e.score}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{textAlign:"center",marginTop:12,color:"rgba(255,255,255,0.25)",fontSize:9,letterSpacing:1,fontFamily:"'Inter',sans-serif"}}>Global scores are simulated · live data comes with Supabase</div>
      </div>
    </PageWrap>
  );
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
               : "linear-gradient(90deg,#0891b2,#06b6d4)";
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
    pitch:   { bg:"#16a34a",      border:"#15803d", shadow:"0 4px 20px rgba(6,182,212,0.4)" },
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

// Derive context labels from card data + optional category id or theme hint
function getCardContext(card, catId) {
  catId = catId || "";
  const club = card.club || "";
  const statType = card.statType || "";

  const PL_CLUBS = ["Man City","Man United","Liverpool","Arsenal","Chelsea","Tottenham",
    "Blackburn","Sunderland","Newcastle","Everton","Leicester","Aston Villa",
    "West Ham","Leeds","Wolves","Southampton","Burnley","Fulham","Crystal Palace",
    "Brentford","Nottm Forest","Brighton","Ipswich","Coventry","Middlesbrough","Bolton"];

  let teamLine = "";
  let compLine = "";

  // Derive competition from daily theme strings
  const isEnglandTheme = catId.toLowerCase().includes("england");
  const isWorldCupTheme = catId.toLowerCase().includes("world cup");
  const isCLTheme = catId.toLowerCase().includes("champions league");
  const isPLTheme = catId.toLowerCase().includes("premier league");

  if (club === "PL All-Time") {
    teamLine = "All-Time";
    compLine = "Premier League";
  } else if (club) {
    teamLine = club;
    if (PL_CLUBS.includes(club)) {
      compLine = "Premier League";
    } else {
      compLine = "Club Career";
    }
  } else if (catId === "intl_caps") {
    teamLine = card.nationality || "International";
    compLine = "International Caps";
  } else if (catId === "intl_goals") {
    teamLine = card.nationality || "International";
    compLine = "International Goals";
  } else if (statType === "Caps" || isEnglandTheme) {
    teamLine = "England";
    compLine = "International";
  } else if (catId === "pl_goals" || catId === "pl_assists" || catId === "pl_appearances" || isPLTheme) {
    teamLine = "All-Time";
    compLine = "Premier League";
  } else if (isWorldCupTheme) {
    teamLine = "All-Time";
    compLine = "World Cup";
  } else if (isCLTheme) {
    teamLine = "All-Time";
    compLine = "Champions League";
  } else {
    teamLine = "All-Time";
    compLine = "Career";
  }

  return { teamLine, compLine, season: card.season || "" };
}

// Stat display panel — always shows: player · stat · statType · team/all-time · league/competition
function StatPanel({card, revealed, flashResult=null, catId=""}) {
  const isCorrect=flashResult==="correct", isWrong=flashResult==="wrong", isYellow=flashResult==="yellow";

  let bg = "#ffffff";
  let borderCol = "#e2e8f0";
  let numCol = "#0f172a";
  let shadow = "0 2px 8px rgba(0,0,0,0.08)";
  let topAccent = "#e2e8f0";
  let pillBg = "rgba(0,0,0,0.04)";
  let pillBorder = "rgba(0,0,0,0.08)";
  let pillText = "#475569";
  let compText = "#94a3b8";
  let divCol = "#e2e8f0";

  if(revealed && !flashResult) {
    borderCol="#93c5fd"; topAccent="#3b82f6"; numCol="#1d4ed8";
    shadow="0 0 0 2px #3b82f618, 0 4px 16px rgba(59,130,246,0.15)";
    pillBg="#dbeafe"; pillBorder="#93c5fd"; pillText="#1d4ed8"; compText="#60a5fa"; divCol="#bfdbfe";
  }
  if(isCorrect) {
    bg="#ecfeff"; borderCol="#67e8f9"; topAccent="#0891b2"; numCol="#0e7490";
    shadow="0 0 0 2px #06b6d422, 0 6px 24px rgba(6,182,212,0.25)";
    pillBg="#cffafe"; pillBorder="#67e8f9"; pillText="#0e7490"; compText="#0891b2"; divCol="#a5f3fc";
  }
  if(isWrong) {
    bg="#fef2f2"; borderCol="#fca5a5"; topAccent="#dc2626"; numCol="#dc2626";
    shadow="0 0 0 2px #dc262622, 0 6px 24px rgba(220,38,38,0.25)";
    pillBg="#fee2e2"; pillBorder="#fca5a5"; pillText="#dc2626"; compText="#f87171"; divCol="#fecaca";
  }
  if(isYellow) {
    bg="#fffbeb"; borderCol="#fde68a"; topAccent="#d97706"; numCol="#b45309";
    shadow="0 0 0 2px #d9770622, 0 6px 24px rgba(217,119,6,0.25)";
    pillBg="#fef3c7"; pillBorder="#fde68a"; pillText="#b45309"; compText="#d97706"; divCol="#fde68a";
  }

  const { teamLine, compLine, season } = getCardContext(card, catId);

  // Auto-scale player name font based on length
  const nameLen = card.player.length;
  const nameFontSize = nameLen > 18 ? 10 : nameLen > 14 ? 11 : nameLen > 10 ? 12 : 13;

  return (
    <div style={{width:158,background:bg,border:`1.5px solid ${borderCol}`,borderRadius:14,boxShadow:shadow,display:"flex",flexDirection:"column",alignItems:"center",padding:"0 0 10px",position:"relative",overflow:"hidden",transition:"border-color 0.25s,box-shadow 0.25s,background 0.25s"}}>
      {/* Texture */}
      <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 12px,rgba(0,0,0,0.012) 12px,rgba(0,0,0,0.012) 13px)",pointerEvents:"none"}}/>
      {/* Bloom */}
      <div style={{position:"absolute",top:0,left:0,right:0,height:"45%",background:`radial-gradient(ellipse at 50% 0%, ${topAccent}20 0%, transparent 80%)`,pointerEvents:"none",transition:"background 0.25s"}}/>
      {/* Accent bar */}
      <div style={{width:"100%",height:4,background:`linear-gradient(90deg,${topAccent},${topAccent}55)`,transition:"background 0.25s",marginBottom:8,flexShrink:0,position:"relative"}}/>

      {/* ── PLAYER NAME — auto-shrinks for long names, max 2 lines ── */}
      <div style={{fontSize:nameFontSize,fontWeight:800,color:"#0f172a",letterSpacing:0.2,lineHeight:1.2,textAlign:"center",width:"100%",padding:"0 7px",marginBottom:5,fontFamily:"'Oswald',sans-serif",textTransform:"uppercase",position:"relative",minHeight:nameFontSize*2.4,display:"flex",alignItems:"center",justifyContent:"center"}}>{card.player}</div>

      {/* ── TEAM / ALL-TIME pill ── */}
      <div style={{background:pillBg,border:`1px solid ${pillBorder}`,borderRadius:20,padding:"2px 8px",marginBottom:2,maxWidth:"92%",position:"relative"}}>
        <span style={{fontSize:8,fontWeight:800,color:pillText,letterSpacing:0.5,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",whiteSpace:"nowrap",display:"block",overflow:"hidden",textOverflow:"ellipsis",textAlign:"center"}}>{teamLine}</span>
      </div>

      {/* ── LEAGUE / COMPETITION + SEASON ── */}
      <div style={{fontSize:7.5,color:compText,letterSpacing:1.2,textTransform:"uppercase",fontWeight:700,fontFamily:"'Inter',sans-serif",marginBottom:5,position:"relative",textAlign:"center"}}>
        {compLine}{season ? ` · ${season}` : ""}
      </div>

      {/* ── STAT NUMBER / UNREVEALED ── */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",width:"100%",padding:"0 10px",position:"relative",minHeight:62}}>
        {revealed
          ? <div style={{fontSize:card.stat>=1000?46:58,fontWeight:900,color:numCol,lineHeight:1,fontFamily:"'Oswald',sans-serif",transition:"color 0.25s",letterSpacing:-1}}>{card.stat}</div>
          : (
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6}}>
              <div style={{display:"flex",gap:5,alignItems:"center"}}>
                {[0,1,2].map(i=>(
                  <div key={i} style={{width:8,height:8,borderRadius:"50%",background:"#cbd5e1",opacity:0.5+i*0.15}}/>
                ))}
              </div>
              <div style={{fontSize:9,color:"#94a3b8",letterSpacing:2,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>hidden</div>
            </div>
          )}
      </div>

      {/* ── DIVIDER ── */}
      <div style={{width:"38%",height:1,background:divCol,margin:"7px 0 5px",transition:"background 0.25s",position:"relative"}}/>

      {/* ── STAT TYPE ── */}
      <div style={{fontSize:8.5,fontWeight:700,color:"#475569",letterSpacing:1.8,textTransform:"uppercase",textAlign:"center",position:"relative",fontFamily:"'Inter',sans-serif"}}>
        {STAT_ICONS[card.statType]||"📊"} {card.statType}
      </div>
    </div>
  );
}

// Progress dots — daily only
function ProgressDots({current, result, yellowCardIdx, declinedYellow}) {
  return (
    <div style={{display:"flex",gap:5,alignItems:"center",justifyContent:"center",marginBottom:14}}>
      {Array.from({length:10}).map((_,i)=>{
        let bg="#e2e8f0", borderC="#cbd5e1", cnt=i+1, col="#94a3b8", fs=9;
        if(i<current)                       {bg="#dcfce7";borderC="#86efac";cnt="✓";col="#16a34a";fs=10;}
        if(i===yellowCardIdx&&i<current)    {bg="#fef9c3";borderC="#fde047";cnt="🟨";col="#ca8a04";fs=10;}
        if(i===current&&result===null)      {bg="#dbeafe";borderC="#93c5fd";col="#2563eb";}
        if(i===current&&result==="correct") {bg="#dcfce7";borderC="#86efac";cnt="✓";col="#16a34a";fs=10;}
        if(i===current&&result==="wrong")   {bg="#fee2e2";borderC="#fca5a5";cnt="🟥";col="#dc2626";fs=10;}
        if(i===current&&result==="yellow")  {bg="#fef9c3";borderC="#fde047";cnt="🟨";col="#ca8a04";fs=10;}
        // Straight red: declined yellow on this dot — override yellow
        if(i===current&&declinedYellow)     {bg="#fee2e2";borderC="#dc2626";cnt="🟥";col="#dc2626";fs=10;}
        return <div key={i} style={{width:26,height:26,borderRadius:"50%",background:bg,border:`1.5px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs,color:col,fontWeight:800,transition:"all 0.2s",fontFamily:"'Inter',sans-serif"}}>{cnt}</div>;
      })}
    </div>
  );
}

function DailyResultDots({resultData}) {
  return (
    <div style={{display:"flex",gap:4,alignItems:"center",justifyContent:"center",flexWrap:"nowrap",width:"100%"}}>
      {Array.from({length:10}).map((_,i)=>{
        const r=resultData[i]||null;
        let bg="rgba(255,255,255,0.06)", borderC="rgba(255,255,255,0.12)", cnt=i+1, col="rgba(255,255,255,0.25)", fs=8;
        if(r==="correct"){bg="#cffafe";borderC="#67e8f9";cnt="✓";col="#0891b2";fs=9;}
        if(r==="yellow") {bg="#fef9c3";borderC="#fde047";cnt="🟨";col="#ca8a04";fs=9;}
        if(r==="wrong")  {bg="#fee2e2";borderC="#fca5a5";cnt="🟥";col="#dc2626";fs=9;}
        if(r==="red")    {bg="#fee2e2";borderC="#dc2626";cnt="🟥";col="#dc2626";fs=9;}
        return <div key={i} style={{width:24,height:24,flexShrink:0,borderRadius:"50%",background:bg,border:`1.5px solid ${borderC}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:fs,color:col,fontWeight:800,fontFamily:"'Inter',sans-serif"}}>{cnt}</div>;
      })}
    </div>
  );
}

// ── STATIC AD BANNER ──────────────────────────────────────────────────────────
// In production: replace the inner div content with your AdSense ins tag.
// The `slotId` prop ensures each placement gets a unique key so React remounts
// the slot on navigation, registering a fresh impression with AdSense.
function AdBanner({slotId}) {
  return(
    <div key={slotId} style={{width:"100%",marginBottom:12,borderRadius:10,overflow:"hidden",border:"1px dashed rgba(255,255,255,0.08)",position:"relative"}}>
      {/* DEMO label — remove in production */}
      <div style={{position:"absolute",top:4,right:6,fontSize:8,color:"rgba(255,255,255,0.2)",fontFamily:"'Inter',sans-serif",letterSpacing:1,fontWeight:600,textTransform:"uppercase",zIndex:1}}>Ad</div>
      {/* Replace this div with your AdSense <ins> tag */}
      <div style={{height:60,background:"linear-gradient(135deg,#0f1923,#1a2535)",display:"flex",alignItems:"center",justifyContent:"center"}}>
        <span style={{fontSize:10,color:"rgba(255,255,255,0.15)",fontFamily:"'Inter',sans-serif",letterSpacing:2,fontWeight:600,textTransform:"uppercase"}}>Advertisement</span>
      </div>
    </div>
  );
}

// ── STREAK RESTORE OVERLAY ────────────────────────────────────────────────────
function StreakRestoreOverlay({mode, streak, peakStreak, onWatch, onDecline}) {
  const [watching,setWatching] = useState(false);
  const [cd,setCd]             = useState(5);
  const ref = useRef();
  const isRestore = mode==="restore";
  const accentCol = isRestore ? "#0d9488" : "#f59e0b";
  const accentGlow = isRestore ? "rgba(13,148,136,0.35)" : "rgba(245,158,11,0.35)";

  function startAd(){
    setWatching(true);setCd(5);
    ref.current=setInterval(()=>setCd(c=>{
      if(c<=1){clearInterval(ref.current);onWatch();return 0;}
      return c-1;
    }),1000);
  }
  useEffect(()=>()=>clearInterval(ref.current),[]);

  return(
    <div style={{position:"fixed",inset:0,background:"rgba(4,12,12,0.96)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:150,padding:"0 20px",backdropFilter:"blur(8px)"}}>
      <div style={{background:"linear-gradient(160deg,#1a2535,#0f1923)",border:`1px solid ${accentCol}30`,borderRadius:20,padding:"28px 24px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:`0 20px 60px rgba(0,0,0,0.7), 0 0 80px ${accentGlow}`}}>
        <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:`linear-gradient(90deg,transparent,${accentCol},transparent)`,borderRadius:"20px 20px 0 0"}}/>

        {watching?(
          <div style={{padding:"12px 0"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",letterSpacing:3,marginBottom:12,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Manager's Call</div>
            <div style={{color:accentCol,fontWeight:900,fontSize:64,fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,textShadow:`0 0 40px ${accentGlow}`,letterSpacing:-1}}>{cd}</div>
            <div style={{color:"rgba(255,255,255,0.35)",fontSize:12,marginTop:10,fontFamily:"'Inter',sans-serif"}}>{isRestore?"Welcome back to the squad...":"+3 caps on the way..."}</div>
          </div>
        ):(
          <>
            {/* Icon */}
            <div style={{fontSize:36,marginBottom:12}}>{isRestore?"🤝":"💪"}</div>

            {/* Title + body */}
            <div style={{color:"#ffffff",fontWeight:900,fontSize:20,fontFamily:"'Oswald',sans-serif",letterSpacing:1,marginBottom:8,textTransform:"uppercase"}}>
              {isRestore?"Manager Still Believes In You":"Fight Back Into the Squad"}
            </div>
            <div style={{color:"rgba(255,255,255,0.65)",fontSize:13,fontFamily:"'Inter',sans-serif",lineHeight:1.6,marginBottom:16}}>
              {isRestore
                ? "You've been missed. One call from the gaffer and your career picks up exactly where it left off."
                : "Your career has started to fade. But the door isn't closed."}
            </div>

            {/* Caps display */}
            <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"12px 16px",marginBottom:16,display:"flex",alignItems:"center",justifyContent:"center",gap:16}}>
              <div style={{textAlign:"center"}}>
                <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:2,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:2}}>Current Caps</div>
                <div style={{fontSize:36,fontWeight:900,color:accentCol,fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,textShadow:`0 0 20px ${accentGlow}`}}>{streak}</div>
              </div>
              {!isRestore&&(
                <>
                  <div style={{color:"rgba(255,255,255,0.2)",fontSize:18,fontFamily:"'Oswald',sans-serif"}}>→</div>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:2,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:2}}>After Boost</div>
                    <div style={{fontSize:36,fontWeight:900,color:"#06b6d4",fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,textShadow:"0 0 20px rgba(6,182,212,0.4)"}}>{Math.min(streak+3,peakStreak)}</div>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.25)",fontFamily:"'Inter',sans-serif",marginTop:2}}>peak: {peakStreak}</div>
                  </div>
                </>
              )}
            </div>

            {/* Buttons */}
            <button onClick={startAd} style={{width:"100%",padding:"14px",background:`linear-gradient(135deg,${isRestore?"#0e7490,#0891b2,#06b6d4":"#92400e,#b45309,#d97706"})`,border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:900,letterSpacing:0.5,cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:`0 4px 20px ${accentGlow}, inset 0 1px 0 rgba(255,255,255,0.2)`,marginBottom:8}}>
              {isRestore?"Return to Squad":"Fight Back (+3 Caps)"}
            </button>
            <button onClick={onDecline} style={{width:"100%",padding:"11px",background:"transparent",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"rgba(255,255,255,0.3)",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>
              {isRestore?"Start Fresh":"Not Today"}
            </button>
            {!isRestore&&<div style={{fontSize:10,color:"rgba(255,255,255,0.2)",marginTop:8,fontFamily:"'Inter',sans-serif"}}>One boost per day · capped at your peak of {peakStreak}</div>}
          </>
        )}
      </div>
    </div>
  );
}

// ── INTERSTITIAL AD DEMO OVERLAY ──────────────────────────────────────────────
function InterstitialOverlay({onDismiss}) {
  const [cd,setCd]=useState(4);
  const ref=useRef();
  useEffect(()=>{
    ref.current=setInterval(()=>setCd(c=>{
      if(c<=1){clearInterval(ref.current);onDismiss();return 0;}
      return c-1;
    }),1000);
    return()=>clearInterval(ref.current);
  },[]);
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:200,padding:"0 20px",backdropFilter:"blur(6px)"}}>
      <div style={{width:"100%",maxWidth:320,textAlign:"center"}}>
        {/* Demo label */}
        <div style={{display:"inline-flex",alignItems:"center",gap:6,background:"rgba(255,255,255,0.06)",border:"1px dashed rgba(255,255,255,0.2)",borderRadius:6,padding:"4px 10px",marginBottom:20}}>
          <span style={{fontSize:9,color:"rgba(255,255,255,0.4)",fontWeight:700,letterSpacing:2,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>⚠ Demo — Interstitial Ad</span>
        </div>
        {/* Mock ad block */}
        <div style={{background:"linear-gradient(160deg,#1a1a2e,#16213e)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,padding:"32px 24px",marginBottom:16,position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 18px,rgba(255,255,255,0.01) 18px,rgba(255,255,255,0.01) 19px)",pointerEvents:"none"}}/>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.2)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:16}}>Advertisement</div>
          <div style={{width:80,height:80,borderRadius:18,background:"linear-gradient(135deg,#374151,#1f2937)",border:"1px solid rgba(255,255,255,0.08)",margin:"0 auto 14px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:32}}>📱</div>
          <div style={{fontSize:15,fontWeight:700,color:"rgba(255,255,255,0.6)",fontFamily:"'Inter',sans-serif",marginBottom:6}}>Your Ad Here</div>
          <div style={{fontSize:11,color:"rgba(255,255,255,0.25)",fontFamily:"'Inter',sans-serif"}}>In production this would be a full AdMob / AdSense interstitial</div>
        </div>
        {/* Countdown */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
          <div style={{width:32,height:32,borderRadius:"50%",border:"2px solid rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <span style={{fontSize:14,fontWeight:900,color:"rgba(255,255,255,0.5)",fontFamily:"'Oswald',sans-serif"}}>{cd}</span>
          </div>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.3)",fontFamily:"'Inter',sans-serif"}}>Skipping in {cd}s...</span>
        </div>
      </div>
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
    <div style={{position:"fixed",inset:0,background:"rgba(10,18,28,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"0 20px",backdropFilter:"blur(8px)"}}>
      <div style={{background:"linear-gradient(160deg,#1a2535,#0f1923)",border:"1px solid rgba(251,191,36,0.2)",borderRadius:20,padding:"28px 24px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(217,119,6,0.08)"}}>
        {/* Yellow card graphic — more dramatic */}
        <div style={{position:"relative",width:56,height:72,margin:"0 auto 18px"}}>
          <div style={{width:56,height:72,background:"linear-gradient(150deg,#fde68a,#fbbf24,#d97706)",borderRadius:9,boxShadow:"0 8px 32px rgba(217,119,6,0.6), 0 2px 0 rgba(255,255,255,0.3) inset",position:"relative"}}>
            <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(135deg,transparent,transparent 8px,rgba(255,255,255,0.06) 8px,rgba(255,255,255,0.06) 9px)",borderRadius:9}}/>
            <div style={{position:"absolute",top:6,left:6,right:6,bottom:6,border:"1.5px solid rgba(255,255,255,0.25)",borderRadius:5}}/>
          </div>
          {/* Glow */}
          <div style={{position:"absolute",inset:"-8px",background:"radial-gradient(ellipse at 50% 60%,rgba(217,119,6,0.35) 0%,transparent 70%)",borderRadius:20,pointerEvents:"none"}}/>
        </div>

        <div style={{color:"#fbbf24",fontWeight:900,fontSize:22,letterSpacing:2,marginBottom:6,fontFamily:"'Oswald',sans-serif",textTransform:"uppercase",textShadow:"0 0 20px rgba(251,191,36,0.4)"}}>🟨 Yellow Card</div>
        <div style={{color:"rgba(255,255,255,0.85)",fontSize:14,marginBottom:4,lineHeight:1.5,fontWeight:600,fontFamily:"'Inter',sans-serif"}}>Show your manager you deserve to stay on the pitch.</div>
        <div style={{color:"rgba(255,255,255,0.45)",fontSize:12,marginBottom:20,lineHeight:1.5,fontFamily:"'Inter',sans-serif"}}>One mistake forgiven. Keep your cap alive.</div>

        {watching?(
          <div style={{background:"rgba(255,255,255,0.04)",borderRadius:12,padding:"20px",border:"1px solid rgba(255,255,255,0.08)"}}>
            <div style={{color:"rgba(255,255,255,0.35)",fontSize:9,letterSpacing:3,marginBottom:8,fontWeight:700,fontFamily:"'Inter',sans-serif"}}>MANAGER CALL</div>
            <div style={{color:"#fbbf24",fontWeight:900,fontSize:52,fontFamily:"'Oswald',sans-serif",lineHeight:1,textShadow:"0 0 30px rgba(251,191,36,0.5)"}}>{cd}</div>
            <div style={{color:"rgba(255,255,255,0.4)",fontSize:11,marginTop:6,fontFamily:"'Inter',sans-serif"}}>Back on the pitch...</div>
          </div>
        ):(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={startAd} style={{padding:"14px",background:"linear-gradient(135deg,#0e7490,#0891b2,#06b6d4)",border:"none",borderRadius:12,color:"#fff",fontSize:15,fontWeight:900,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 20px rgba(6,182,212,0.45), inset 0 1px 0 rgba(255,255,255,0.2)"}}>Stay On Pitch</button>
            <button onClick={onDecline} style={{padding:"11px",background:"rgba(220,38,38,0.08)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:10,color:"rgba(248,113,113,0.8)",fontSize:12,fontWeight:700,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",fontFamily:"'Inter',sans-serif"}}>Head Off</button>
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
// ── CAREER STATUS ─────────────────────────────────────────────────────────────
function getCareerStatus(caps){
  if(caps===0)    return {label:"Uncapped",             icon:"👤",col:"#94a3b8",glow:"#94a3b8",next:1,   nextLabel:"Academy Prospect"};
  if(caps<4)      return {label:"Academy Prospect",     icon:"🟡",col:"#fde68a",glow:"#f59e0b",next:4,   nextLabel:"Youth Team"};
  if(caps<8)      return {label:"Youth Team",           icon:"🟢",col:"#4ade80",glow:"#22c55e",next:8,   nextLabel:"Squad Player"};
  if(caps<15)     return {label:"Squad Player",         icon:"🔵",col:"#60a5fa",glow:"#3b82f6",next:15,  nextLabel:"Rotation Option"};
  if(caps<25)     return {label:"Rotation Option",      icon:"🟣",col:"#c084fc",glow:"#a855f7",next:25,  nextLabel:"First Team Regular"};
  if(caps<40)     return {label:"First Team Regular",   icon:"🩵",col:"#38bdf8",glow:"#0ea5e9",next:40,  nextLabel:"Key Player"};
  if(caps<60)     return {label:"Key Player",           icon:"⭐",col:"#fbbf24",glow:"#f59e0b",next:60,  nextLabel:"Star Player"};
  if(caps<85)     return {label:"Star Player",          icon:"⭐⭐",col:"#fb923c",glow:"#f97316",next:85, nextLabel:"International"};
  if(caps<115)    return {label:"International",        icon:"⭐⭐⭐",col:"#f87171",glow:"#ef4444",next:115,nextLabel:"World Class"};
  if(caps<150)    return {label:"World Class",          icon:"🔥",col:"#e879f9",glow:"#d946ef",next:150, nextLabel:"All-Time Great"};
  if(caps<200)    return {label:"All-Time Great",       icon:"👑",col:"#fde047",glow:"#facc15",next:200, nextLabel:"Hall of Fame"};
  return           {label:"Hall of Fame",               icon:"🏆",col:"#ffffff",glow:"#ffffff",next:null, nextLabel:null};
}

function RushPage({onBack, onPlay, onLeaderboard, username, streak}) {
  const status = getCareerStatus(streak||0);
  return (
    <PageWrap glow="gold">
      <div style={{width:"100%"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.7)",fontSize:11,cursor:"pointer",padding:"8px 12px",fontFamily:"'Inter',sans-serif",fontWeight:600,flexShrink:0}}>← Back</button>
          <div style={{flex:1}}>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>StatStreaks</div>
            <div style={{fontSize:26,fontWeight:900,color:"#ffffff",fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,letterSpacing:1}}>Training Pitch</div>
          </div>
          {/* Player name + status — top right */}
          <div style={{textAlign:"right",flexShrink:0}}>
            <div style={{fontSize:12,fontWeight:800,color:status.col,fontFamily:"'Inter',sans-serif",lineHeight:1.2}}>{username||"—"}</div>
            <div style={{fontSize:9,color:status.col,opacity:0.75,fontWeight:600,letterSpacing:0.5,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginTop:2}}>{status.icon} {status.label}</div>
          </div>
        </div>

        {/* Leaderboard link */}
        <button onClick={onLeaderboard} style={{
          width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
          background:"linear-gradient(135deg,#92400e 0%,#b45309 50%,#d97706 100%)",
          border:"1px solid rgba(217,119,6,0.4)",
          borderRadius:10,padding:"10px 14px",cursor:"pointer",marginBottom:14,
          fontFamily:"'Inter',sans-serif",textAlign:"left",
          boxShadow:"0 4px 16px rgba(217,119,6,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
          position:"relative",overflow:"hidden",
          transition:"transform 0.12s,box-shadow 0.12s",
        }}
        onMouseOver={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(217,119,6,0.5)";}}
        onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(217,119,6,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(255,255,255,0.03) 16px,rgba(255,255,255,0.03) 17px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:8,position:"relative"}}>
            <span style={{fontSize:16}}>🏆</span>
            <div>
              <div style={{fontSize:13,fontWeight:700,color:"#ffffff",lineHeight:1.2}}>Leaderboards</div>
              <div style={{fontSize:10,color:"rgba(255,255,255,0.65)",marginTop:2}}>Top Scorer · Golden Boot · Caps</div>
            </div>
          </div>
          <span style={{fontSize:11,color:"rgba(255,255,255,0.5)",position:"relative",flexShrink:0}}>→</span>
        </button>

        {/* Mode explainer — magenta gradient */}
        <div style={{background:"linear-gradient(135deg,#7c0d3e 0%,#be185d 50%,#db2777 100%)",borderRadius:14,padding:"16px",marginBottom:16,boxShadow:"0 4px 20px rgba(219,39,119,0.45), inset 0 1px 0 rgba(255,255,255,0.15)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 20px,rgba(255,255,255,0.025) 20px,rgba(255,255,255,0.025) 21px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:"-50%",right:"-10%",width:"50%",height:"200%",background:"radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.1) 0%, transparent 65%)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",pointerEvents:"none"}}/>
          <div style={{position:"relative"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.65)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",marginBottom:4,fontFamily:"'Inter',sans-serif"}}>How it works</div>
            <div style={{color:"#ffffff",fontWeight:800,fontSize:15,marginBottom:4,fontFamily:"'Inter',sans-serif"}}>30 seconds — go for perfect ⚡</div>
            <div style={{color:"rgba(255,255,255,0.75)",fontSize:12,lineHeight:1.5,fontFamily:"'Inter',sans-serif"}}>Score as many as you can. Zero mistakes = <strong style={{color:"#fde047"}}>2× score</strong>. Pick a category below.</div>
          </div>
        </div>

        {/* Category grid */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[...RUSH_CATEGORIES].sort((a,b)=>{
            // Coming soon always last
            if(a.comingSoon && !b.comingSoon) return 1;
            if(!a.comingSoon && b.comingSoon) return -1;
            const ba=lsGet(`rush_best_${a.id}`,0);
            const bb=lsGet(`rush_best_${b.id}`,0);
            if(bb!==ba) return bb-ba;
            return 0;
          }).map(cat=>{
            const catBest=lsGet(`rush_best_${cat.id}`,0);
            const wk=getWeekKey();
            const catWeekly=lsGet(`rush_weekly_${cat.id}_${wk}`,0);
            const hasPlayed=catBest>0;
            if(cat.comingSoon){
              return(
                <div key={cat.id} style={{
                  padding:"0",
                  background:`linear-gradient(160deg,#0e1520 0%,#090f18 100%)`,
                  border:`1px solid rgba(255,255,255,0.05)`,
                  borderRadius:14,textAlign:"left",overflow:"hidden",
                  position:"relative",opacity:0.7,
                }}>
                  {/* Top accent bar — muted */}
                  <div style={{height:3,background:`linear-gradient(90deg,${cat.color}50,transparent)`,width:"100%"}}/>
                  {/* Frosted overlay */}
                  <div style={{position:"absolute",inset:0,background:"rgba(5,10,18,0.55)",backdropFilter:"blur(1px)",zIndex:2,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:4}}>
                    <span style={{fontSize:16}}>🔒</span>
                    <span style={{fontSize:9,fontWeight:800,color:"rgba(255,255,255,0.55)",letterSpacing:2,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Coming Soon</span>
                  </div>
                  <div style={{padding:"11px 12px 12px",position:"relative",zIndex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:8}}>
                      <div style={{width:30,height:30,borderRadius:8,background:`${cat.color}10`,border:`1px solid ${cat.color}20`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>
                        {cat.icon}
                      </div>
                      <span style={{fontSize:11,fontWeight:800,color:"rgba(255,255,255,0.25)",fontFamily:"'Inter',sans-serif",lineHeight:1.2}}>{cat.label}</span>
                    </div>
                    <div style={{height:44}}/>
                  </div>
                </div>
              );
            }
            return(
              <button key={cat.id} onClick={()=>onPlay(cat.id)} style={{
                  padding:"0",
                  background:hasPlayed
                    ? `linear-gradient(160deg,#1a2535 0%,#0f1923 100%)`
                    : `linear-gradient(160deg,#141e2e 0%,#0c1520 100%)`,
                  border:`1px solid ${hasPlayed?cat.color+"40":"rgba(255,255,255,0.07)"}`,
                  borderRadius:14,cursor:"pointer",textAlign:"left",
                  transition:"transform 0.1s,box-shadow 0.1s",overflow:"hidden",
                  boxShadow:hasPlayed
                    ? `0 4px 20px rgba(0,0,0,0.3)`
                    : `0 2px 10px rgba(0,0,0,0.25)`,
                  position:"relative",
                }}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow=`0 8px 28px rgba(0,0,0,0.4), 0 0 0 1px ${cat.color}50`;}}
                onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow=hasPlayed?`0 4px 20px rgba(0,0,0,0.3)`:`0 2px 10px rgba(0,0,0,0.25)`;}}>

                {/* Top accent bar */}
                <div style={{height:3,background:hasPlayed?`linear-gradient(90deg,${cat.color},${cat.color}44)`:`linear-gradient(90deg,rgba(255,255,255,0.1),transparent)`,width:"100%"}}/>
                {/* Colour bloom */}
                <div style={{position:"absolute",top:0,left:0,right:0,height:"70%",background:`radial-gradient(ellipse at 20% 0%, ${cat.color}${hasPlayed?"18":"0a"} 0%, transparent 75%)`,pointerEvents:"none"}}/>
                {/* Diagonal texture */}
                <div style={{position:"absolute",inset:0,backgroundImage:`repeating-linear-gradient(135deg,transparent,transparent 12px,${cat.color}06 12px,${cat.color}06 13px)`,pointerEvents:"none"}}/>

                <div style={{padding:"11px 12px 12px",position:"relative"}}>
                  {/* Icon + label row */}
                  <div style={{display:"flex",alignItems:"center",gap:7,marginBottom:hasPlayed?9:8}}>
                    <div style={{width:30,height:30,borderRadius:8,background:`${cat.color}18`,border:`1px solid ${cat.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:15,flexShrink:0}}>
                      {cat.icon}
                    </div>
                    <span style={{fontSize:11,fontWeight:800,color:hasPlayed?"#ffffff":"rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif",lineHeight:1.2,letterSpacing:0.1}}>{cat.label}</span>
                  </div>

                  {hasPlayed?(
                    /* Played — show Golden Boot (all-time) and Top Scorer (weekly) */
                    <div style={{display:"flex",gap:6}}>
                      {/* All-time — Golden Boot */}
                      <div style={{flex:1,background:"rgba(236,72,153,0.08)",border:"1px solid rgba(236,72,153,0.18)",borderRadius:8,padding:"6px 8px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:2}}>
                          <span style={{fontSize:8}}>🥾</span>
                          <span style={{fontSize:7,color:"rgba(236,72,153,0.7)",fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>All-Time</span>
                        </div>
                        <div style={{fontSize:26,fontWeight:900,color:"#ec4899",fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,letterSpacing:-0.5,textShadow:"0 0 16px rgba(236,72,153,0.45)"}}>{catBest}</div>
                      </div>
                      {/* Weekly — Top Scorer */}
                      <div style={{flex:1,background:catWeekly>0?"rgba(6,182,212,0.08)":"rgba(255,255,255,0.03)",border:`1px solid ${catWeekly>0?"rgba(6,182,212,0.2)":"rgba(255,255,255,0.06)"}`,borderRadius:8,padding:"6px 8px"}}>
                        <div style={{display:"flex",alignItems:"center",gap:3,marginBottom:2}}>
                          <span style={{fontSize:8}}>⚽</span>
                          <span style={{fontSize:7,color:catWeekly>0?"rgba(6,182,212,0.7)":"rgba(255,255,255,0.2)",fontWeight:700,letterSpacing:1,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>This Week</span>
                        </div>
                        <div style={{fontSize:26,fontWeight:900,color:catWeekly>0?"#06b6d4":"rgba(255,255,255,0.15)",fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,letterSpacing:-0.5,textShadow:catWeekly>0?"0 0 16px rgba(6,182,212,0.4)":"none"}}>{catWeekly||"—"}</div>
                      </div>
                    </div>
                  ):(
                    /* Unplayed */
                    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingTop:2}}>
                      <span style={{fontSize:10,color:"rgba(255,255,255,0.18)",fontWeight:600,fontFamily:"'Inter',sans-serif",fontStyle:"italic"}}>Not played yet</span>
                      <span style={{fontSize:9,color:"rgba(255,255,255,0.18)",fontWeight:600,fontFamily:"'Inter',sans-serif"}}>avg {cat.globalAvg}</span>
                    </div>
                  )}
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
// ── TERMS & CONTACT SCREEN ────────────────────────────────────────────────────
function TermsScreen({onBack}){
  return(
    <PageWrap>
      <div style={{width:"100%"}}>
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:20}}>
          <button onClick={onBack} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.7)",fontSize:11,cursor:"pointer",padding:"8px 12px",fontFamily:"'Inter',sans-serif",fontWeight:600,flexShrink:0}}>← Back</button>
          <div>
            <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>StatStreaks</div>
            <div style={{fontSize:26,fontWeight:900,color:"#ffffff",fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,letterSpacing:1}}>Terms & Contact</div>
          </div>
        </div>

        {/* Terms card */}
        <div style={{background:"linear-gradient(160deg,#ffffff,#f8fafc)",borderRadius:16,padding:"18px 18px",marginBottom:12,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",border:"1px solid rgba(0,0,0,0.06)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(0,0,0,0.01) 16px,rgba(0,0,0,0.01) 17px)",pointerEvents:"none"}}/>
          <div style={{position:"relative"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#0f172a",letterSpacing:1,textTransform:"uppercase",marginBottom:12,fontFamily:"'Inter',sans-serif"}}>Terms of Use</div>
            {[
              "StatStreaks is a free-to-play football trivia game. By using the app you agree to these terms.",
              "Statistical data is sourced from publicly available records and is provided for entertainment purposes only. While we make every effort to ensure accuracy, we cannot guarantee that all statistics are fully correct. Please report any errors to us.",
              "The app displays advertisements. These are provided by third-party ad networks and StatStreaks is not responsible for their content.",
              "We collect your chosen display name and game streak in order to power the leaderboards. This data is stored securely and is not sold to third parties.",
              "StatStreaks is not affiliated with or endorsed by any football club, governing body, or player.",
              "We reserve the right to update these terms at any time. Continued use of the app constitutes acceptance of any changes.",
            ].map((text,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                <div style={{width:18,height:18,borderRadius:4,background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#ffffff",fontWeight:800,flexShrink:0,marginTop:1,fontFamily:"'Inter',sans-serif"}}>{i+1}</div>
                <p style={{margin:0,fontSize:12,color:"#475569",lineHeight:1.6,fontFamily:"'Inter',sans-serif"}}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy card */}
        <div style={{background:"linear-gradient(160deg,#ffffff,#f8fafc)",borderRadius:16,padding:"18px 18px",marginBottom:12,boxShadow:"0 4px 20px rgba(0,0,0,0.12)",border:"1px solid rgba(0,0,0,0.06)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(0,0,0,0.01) 16px,rgba(0,0,0,0.01) 17px)",pointerEvents:"none"}}/>
          <div style={{position:"relative"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#0f172a",letterSpacing:1,textTransform:"uppercase",marginBottom:12,fontFamily:"'Inter',sans-serif"}}>Privacy</div>
            {[
              "Your display name and streak are stored locally on your device and, when leaderboards are live, on our secure servers.",
              "A unique anonymous ID is generated for your device to identify your leaderboard entry. This is not linked to any personal account.",
              "We do not collect email addresses, phone numbers, or any other personal information.",
              "Third-party advertisers may use cookies or similar technologies. You can opt out through your device settings.",
            ].map((text,i)=>(
              <div key={i} style={{display:"flex",gap:10,marginBottom:10,alignItems:"flex-start"}}>
                <div style={{width:18,height:18,borderRadius:4,background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#ffffff",fontWeight:800,flexShrink:0,marginTop:1,fontFamily:"'Inter',sans-serif"}}>{i+1}</div>
                <p style={{margin:0,fontSize:12,color:"#475569",lineHeight:1.6,fontFamily:"'Inter',sans-serif"}}>{text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Contact card */}
        <div style={{background:"linear-gradient(135deg,#0e7490,#0891b2,#06b6d4)",borderRadius:16,padding:"18px 18px",marginBottom:12,boxShadow:"0 4px 20px rgba(6,182,212,0.35)",border:"1px solid rgba(6,182,212,0.4)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(255,255,255,0.03) 16px,rgba(255,255,255,0.03) 17px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",pointerEvents:"none"}}/>
          <div style={{position:"relative"}}>
            <div style={{fontSize:11,fontWeight:800,color:"#ffffff",letterSpacing:1,textTransform:"uppercase",marginBottom:10,fontFamily:"'Inter',sans-serif"}}>Get in Touch</div>
            <p style={{margin:"0 0 14px",fontSize:12,color:"rgba(255,255,255,0.8)",lineHeight:1.6,fontFamily:"'Inter',sans-serif"}}>
              Found a stats error? Want to request a new category? Got a bug to report? We want to hear from you.
            </p>
            <a href="mailto:statstreaks@gmail.com" style={{
              display:"inline-flex",alignItems:"center",gap:8,
              background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",
              borderRadius:10,padding:"10px 16px",textDecoration:"none",
              color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,
            }}>
              ✉️ statstreaks@gmail.com
            </a>
            <div style={{marginTop:14,display:"flex",flexDirection:"column",gap:6}}>
              {["🐛 Bug reports","📊 Stats corrections","📂 Category requests"].map((item,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"rgba(255,255,255,0.7)",fontFamily:"'Inter',sans-serif"}}>
                  <div style={{width:4,height:4,borderRadius:"50%",background:"rgba(255,255,255,0.5)"}}/>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{textAlign:"center",color:"rgba(255,255,255,0.2)",fontSize:10,fontFamily:"'Inter',sans-serif",marginTop:4}}>
          StatStreaks v0.1 beta · Last updated April 2026
        </div>
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
              fontFamily:"'Inter',sans-serif",
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
              color:"#fff", fontFamily:"'Inter',sans-serif",
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
  const [prevScreen,setPrevScreen]       = useState("home");
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
  const [declinedYellow,setDeclinedYellow] = useState(false);
  const [rushScores,setRushScores]       = useState(()=>lsGet("rush_scores",[]));
  const [dailyDone,setDailyDone]         = useState(()=>lsGet("daily_done",""));
  const [dailyResult,setDailyResult]     = useState(()=>lsGet("daily_result",null));
  const [streak,setStreak]               = useState(()=>lsGet("streak",0));
  const [peakStreak,setPeakStreak]       = useState(()=>lsGet("peak_streak",0));
  const [restoreOffered,setRestoreOffered] = useState(()=>lsGet("restore_offered",false));
  const [decayStart,setDecayStart]       = useState(()=>lsGet("decay_start",""));
  const [careerMode,setCareerMode]       = useState("normal"); // "normal"|"restore"|"decay"
  const [lastDecayApplied,setLastDecayApplied] = useState(()=>lsGet("last_decay_applied",""));
  const [username,setUsernameState]      = useState(()=>lsGet("username",""));
  const [userId]                         = useState(()=>{
    const existing=lsGet("user_id","");
    if(existing) return existing;
    const id="xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{const r=Math.random()*16|0;return(c==="x"?r:(r&0x3|0x8)).toString(16);});
    lsSet("user_id",id); return id;
  });
  const [nameEditing,setNameEditing]     = useState(false);
  const [nameDraft,setNameDraft]         = useState("");
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
  const [showInterstitial,setShowInterstitial] = useState(false); // interstitial before results
  const timeoutRef = useRef();
  // Refs to hold live values for use inside timer/interval callbacks (avoids stale closures)
  const scoreRef   = useRef(0);
  const rushCatRef = useRef(null);
  const continueCountRef = useRef(0);

  function setUsername(n){lsSet("username",n);setUsernameState(n);}

  // ── CAREER RESTORE / DECAY — runs once on mount ───────────────────────────
  useEffect(()=>{
    const lastPlayed = lsGet("last_played","");
    if(!lastPlayed){ setCareerMode("normal"); return; }
    const today = getTodayKey();
    if(lastPlayed === today){ setCareerMode("normal"); return; }
    // Days missed (yesterday = 1, two days ago = 2, etc.)
    const msPerDay = 86400000;
    const lastDate = new Date(lastPlayed);
    const todayDate = new Date(today);
    const daysMissed = Math.round((todayDate - lastDate) / msPerDay);
    // Only trigger if at least 2 days missed — daysMissed=1 means they played yesterday
    // and simply haven't played today yet, which is normal. Give them the day first.
    if(daysMissed <= 1){ setCareerMode("normal"); return; }
    const alreadyOffered = lsGet("restore_offered", false);
    if(!alreadyOffered){
      // First open after absence — offer full restore
      setCareerMode("restore");
      lsSet("restore_offered", true);
      setRestoreOffered(true);
    } else {
      // Already declined restore — apply decay
      const dStart = lsGet("decay_start","") || today;
      if(!lsGet("decay_start","")){ lsSet("decay_start", today); setDecayStart(today); }
      const lastApplied = lsGet("last_decay_applied","");
      if(lastApplied !== today){
        // Apply one cap decay for today
        const current = lsGet("streak", 0);
        const decayed = Math.max(0, current - 1);
        lsSet("streak", decayed);
        setStreak(decayed);
        lsSet("last_decay_applied", today);
        setLastDecayApplied(today);
      }
      setCareerMode(lsGet("streak",0) <= 0 ? "normal" : "decay");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[]);
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
    setYellowUsed(false);setShowYellow(false);setYellowCardIdx(null);setDeclinedYellow(false);setAnswerLog([]);
    setCleanScore(0);setContinueCount(0);setShowRushModal(false);setFrozenTimeLeft(0);setShowInterstitial(false);
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
      // Interstitial only if no continue (rewarded) was used this run
      if(liveIsPerfect){
        setShowInterstitial(true);
      } else {
        setScreen("result");
      }
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
    // Interstitial only if no continue (rewarded) was used this run
    if(continueCount===0){
      setShowInterstitial(true);
    } else {
      setScreen("result");
    }
  }

  function finishGame(outcome,finalScore,log){
    setTimerActive(false);
    if(mode==="daily")markDailyPlayed(log||answerLog);
    if(mode==="rush")saveRushScore(finalScore, true);
    setLatestScore(finalScore);
    const delay = outcome==="win" ? 900 : 3000;
    timeoutRef.current=setTimeout(()=>{
      setGameOutcome(outcome);
      // Show interstitial before results only if no rewarded ad was used this attempt
      if(!yellowUsed){
        setShowInterstitial(true);
      } else {
        setScreen("result");
      }
    },delay);
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
          if(continueCount > 0){
            // Rewarded already used — loose touch only, session continues, no modal, no interstitial
            setTimeout(()=>{setCurrentIdx(i=>i+1);setRevealedNext(false);setResult(null);setFlashResult(null);},1600);
          } else if(timeLeft > 20){
            // Loose touch (early, no continue used yet) — flash and continue, no modal
            setTimeout(()=>{setCurrentIdx(i=>i+1);setRevealedNext(false);setResult(null);setFlashResult(null);},1600);
          } else {
            // Clutch moment — ≤20s, first wrong, show modal
            setCleanScore(score);
            setTimeout(()=>endRushRun("wrong"),900);
          }
        } else {
          SFX.wrong();setFlashResult("wrong");setResult("wrong");
          const newLog=[...answerLog,"wrong"];setAnswerLog(newLog);
          finishGame("lose",score,newLog);
        }
      }
    },350);
  }

  function onWatchAd(){setYellowUsed(true);setShowYellow(false);setCurrentIdx(i=>i+1);setRevealedNext(false);setResult(null);setFlashResult(null);}
  function onDeclineAd(){setShowYellow(false);setDeclinedYellow(true);setResult("wrong");setFlashResult("wrong");const nl=[...answerLog];if(nl[nl.length-1]==="yellow")nl[nl.length-1]="red";else nl.push("red");setAnswerLog(nl);finishGame("lose",score,nl);}
  function markDailyPlayed(log){
    lsSet("daily_done",todayKey);setDailyDone(todayKey);
    const ns=streak+1;lsSet("streak",ns);setStreak(ns);
    // Track peak and last played date, reset restore flags for next absence
    const peak = lsGet("peak_streak",0);
    if(ns>peak){lsSet("peak_streak",ns);setPeakStreak(ns);}
    lsSet("last_played",todayKey);
    lsSet("restore_offered",false);setRestoreOffered(false);
    lsSet("decay_start","");setDecayStart("");
    lsSet("last_decay_applied","");setLastDecayApplied("");
    setCareerMode("normal");
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
      const prev = lsGet(`rush_best_${cat}`,0);
      setPrevCatBest(prev);
      if(s>prev) lsSet(`rush_best_${cat}`,s);
      // Weekly best per category — keyed by ISO week so it auto-resets each Monday
      const wk = getWeekKey();
      const weeklyKey = `rush_weekly_${cat}_${wk}`;
      const prevWeekly = lsGet(weeklyKey,0);
      if(s>prevWeekly) lsSet(weeklyKey,s);
      lsSet(`rush_plays_${cat}`,lsGet(`rush_plays_${cat}`,0)+1);
    }
  }
  useEffect(()=>()=>clearTimeout(timeoutRef.current),[]);

  const currentCard=cards[currentIdx];
  const nextCard=cards[currentIdx+1];

  if(screen==="leaderboard")return <LeaderboardScreen onBack={()=>setScreen(prevScreen)} rushScores={rushScores} username={username} streak={streak} defaultTab={prevScreen==="home"?"caps":"weekly"}/>;
  if(screen==="terms")return <TermsScreen onBack={()=>setScreen("home")}/>;
  if(screen==="rush")return <RushPage onBack={()=>setScreen("home")} onPlay={launchRush} onLeaderboard={()=>{setPrevScreen("rush");setScreen("leaderboard");}} username={username} streak={streak}/>;

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
      <div style={{position:"fixed",inset:0,background:"rgba(10,18,28,0.92)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:"0 20px",backdropFilter:"blur(8px)"}}>
        <div style={{background:"linear-gradient(160deg,#1a2535,#0f1923)",border:"1px solid rgba(190,24,93,0.25)",borderRadius:20,padding:"24px 20px",maxWidth:340,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(190,24,93,0.08)",position:"relative",overflow:"hidden"}}>
          {/* Diagonal texture */}
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 14px,rgba(255,255,255,0.012) 14px,rgba(255,255,255,0.012) 15px)",pointerEvents:"none"}}/>
          {/* Top shimmer */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:3,background:"linear-gradient(90deg,#be185d,#ec4899,#06b6d4)",pointerEvents:"none"}}/>
          {/* Radial bloom */}
          <div style={{position:"absolute",top:"-30%",left:"50%",transform:"translateX(-50%)",width:"80%",height:"60%",background:"radial-gradient(ellipse,rgba(190,24,93,0.12) 0%,transparent 70%)",pointerEvents:"none"}}/>

          {watching?(
            <div style={{position:"relative",padding:"12px 0"}}>
              <div style={{color:"rgba(255,255,255,0.3)",fontSize:9,letterSpacing:3,marginBottom:12,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Back In Session</div>
              <div style={{color:"#fbbf24",fontWeight:900,fontSize:64,fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,textShadow:"0 0 40px rgba(251,191,36,0.5)",letterSpacing:-1}}>{cd}</div>
              <div style={{color:"rgba(255,255,255,0.35)",fontSize:12,marginTop:10,fontFamily:"'Inter',sans-serif"}}>{watching==="continue"?"Winning possession back...":"Starting fresh run..."}</div>
            </div>
          ):(
            <div style={{position:"relative"}}>

              {/* Icon + title */}
              <div style={{marginBottom:14}}>
                <div style={{width:52,height:52,background:"linear-gradient(135deg,rgba(236,72,153,0.2),rgba(190,24,93,0.1))",border:"1px solid rgba(236,72,153,0.3)",borderRadius:14,margin:"0 auto 10px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,boxShadow:"0 4px 16px rgba(190,24,93,0.2)"}}>🔥</div>
                <div style={{color:"#ffffff",fontWeight:900,fontSize:20,marginBottom:3,fontFamily:"'Oswald',sans-serif",letterSpacing:1}}>🔥 LOST POSSESSION</div>
                <div style={{color:"rgba(255,255,255,0.55)",fontSize:13,fontFamily:"'Inter',sans-serif",fontWeight:600}}>Win it back?</div>
                <div style={{color:"rgba(255,255,255,0.35)",fontSize:12,fontFamily:"'Inter',sans-serif",marginTop:3}}>Stay in the session and keep the run alive.</div>
              </div>

              {/* Score panel */}
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:12,padding:"14px",marginBottom:16,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 10px,rgba(255,255,255,0.008) 10px,rgba(255,255,255,0.008) 11px)",pointerEvents:"none"}}/>
                <div style={{color:"rgba(255,255,255,0.25)",fontSize:8,letterSpacing:2.5,marginBottom:4,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",position:"relative"}}>Training Score</div>
                <div style={{color:"#ffffff",fontWeight:900,fontSize:56,fontFamily:"'Bebas Neue',sans-serif",lineHeight:0.95,letterSpacing:-1,marginBottom:6,position:"relative",textShadow:"0 2px 0 rgba(0,0,0,0.3)"}}>{score}</div>
                {(()=>{
                  const catBest = lsGet(`rush_best_${rushCatRef.current||rushCat}`,0);
                  const toHigh = catBest>0 ? catBest-score : null;
                  if(catBest>0 && score>=catBest){
                    return <div style={{display:"inline-flex",alignItems:"center",gap:5,background:"rgba(6,182,212,0.12)",border:"1px solid rgba(6,182,212,0.25)",borderRadius:8,padding:"3px 10px",position:"relative"}}>
                      <span style={{color:"#06b6d4",fontWeight:700,fontSize:12,fontFamily:"'Inter',sans-serif"}}>✦ New personal best!</span>
                    </div>;
                  } else if(toHigh!==null && toHigh>0){
                    return <div style={{color:"#d97706",fontWeight:600,fontSize:11,fontFamily:"'Inter',sans-serif",position:"relative"}}>+{toHigh} to beat your best of {catBest}</div>;
                  } else {
                    return <div style={{color:"rgba(255,255,255,0.25)",fontSize:11,fontFamily:"'Inter',sans-serif",position:"relative"}}>No best yet — keep going!</div>;
                  }
                })()}
                {continueCount>0&&<div style={{color:"rgba(255,255,255,0.25)",fontSize:10,marginTop:8,borderTop:"1px solid rgba(255,255,255,0.05)",paddingTop:8,position:"relative",fontFamily:"'Inter',sans-serif"}}>Clean run: <strong style={{color:"#06b6d4"}}>{cleanScore}</strong> · no mistakes</div>}
              </div>

              {/* Buttons */}
              {canContinue&&(
                <button onClick={()=>startAd("continue")} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#0e7490,#0891b2,#06b6d4)",border:"none",borderRadius:12,color:"#fff",fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:8,boxShadow:"0 4px 16px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 12px,rgba(255,255,255,0.04) 12px,rgba(255,255,255,0.04) 13px)",pointerEvents:"none"}}/>
                  <span style={{position:"relative"}}>Win It Back</span>
                  <span style={{position:"relative",fontSize:11,opacity:0.75,fontWeight:600}}>({frozenTimeLeft}s left)</span>
                </button>
              )}
              <button onClick={()=>startAd("retry")} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#9d174d,#be185d,#db2777)",border:"none",borderRadius:12,color:"#fff",fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:800,cursor:"pointer",marginBottom:8,boxShadow:"0 4px 16px rgba(190,24,93,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",display:"flex",alignItems:"center",justifyContent:"center",gap:8,position:"relative",overflow:"hidden"}}>
                <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 12px,rgba(255,255,255,0.04) 12px,rgba(255,255,255,0.04) 13px)",pointerEvents:"none"}}/>
                <span style={{position:"relative"}}>⚡ Back to Training</span>
              </button>
              <button onClick={rushDismiss} style={{width:"100%",padding:"10px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:10,color:"rgba(255,255,255,0.35)",fontFamily:"'Inter',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer",letterSpacing:0.3}}>
                End Training Session
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };
  // ── SHARED: player caps lookup for subtext (used on home + result) ─────────
  const CAPS_PLAYERS = [
    {caps:10,name:"Ray Parlour",country:"England",msg:"The Romford Pelé. Not everyone rates him, but those who do, really do."},
    {caps:11,name:"Rickie Lambert",country:"England",msg:"Worked his way up from non-league to the national side. A proper journeyman story."},
    {caps:12,name:"Gerry Francis",country:"England",msg:"One of the most gifted midfielders of his generation. Never got the caps his talent deserved."},
    {caps:13,name:"Jackie Milburn",country:"England",msg:"Wor Jackie — a Newcastle legend and one of England's most natural goalscorers."},
    {caps:14,name:"David Rocastle",country:"England",msg:"Rocky. Stylish, skilful, and loved by everyone who watched him. Gone too soon."},
    {caps:15,name:"Andy Cole",country:"England",msg:"One of the deadliest strikers in Premier League history. Somehow only 15 caps."},
    {caps:16,name:"Dixie Dean",country:"England",msg:"60 league goals in a season. 16 caps was a criminal undercount."},
    {caps:17,name:"Les Ferdinand",country:"England",msg:"Sir Les. Power, pace, and an eye for goal. A proper No.9."},
    {caps:18,name:"Duncan Edwards",country:"England",msg:"The greatest player England never got to see flourish. A tragedy of football history."},
    {caps:19,name:"Tommy Taylor",country:"England",msg:"A Busby Babe. Lost at Munich. 19 caps and a goals record that would have grown much further."},
    {caps:20,name:"Bobby Robson",country:"England",msg:"Manager and player. A true servant of the game in every sense."},
    {caps:21,name:"Dennis Wise",country:"England",msg:"Mouthy, tenacious, effective. You didn't want to play against Dennis Wise."},
    {caps:22,name:"Gary Pallister",country:"England",msg:"Alongside Stam in the debate for Man United's greatest ever centre-back. Underrated England career."},
    {caps:23,name:"Tommy Lawton",country:"England",msg:"One of the finest headers of a ball England has ever produced. A true post-war great."},
    {caps:24,name:"Martin Chivers",country:"England",msg:"Twice Football League top scorer in the early 70s. A powerful and underrated Spurs legend."},
    {caps:25,name:"Stan Mortensen",country:"England",msg:"Hat-trick in the FA Cup final, 25 England caps. Overshadowed by Matthews but equally brilliant."},
    {caps:26,name:"Robbie Fowler",country:"England",msg:"God. One of the most natural finishers the country has ever seen."},
    {caps:27,name:"Francis Lee",country:"England",msg:"Tough, direct, and loved a penalty. A key part of the great Man City side of the 70s."},
    {caps:28,name:"Nobby Stiles",country:"England",msg:"No nonsense, all heart. A World Cup winner who'd run through a wall for you."},
    {caps:29,name:"Danny Rose",country:"England",msg:"One of the best left backs of his Premier League generation. Honest and dependable."},
    {caps:30,name:"Darren Anderton",country:"England",msg:"Sick as a parrot, but when fit — pure class. Deserved a longer career at this level."},
    {caps:31,name:"Kalvin Phillips",country:"England",msg:"The Yorkshire Pirlo. Rose from the Championship to become an England regular."},
    {caps:32,name:"Alf Ramsey",country:"England",msg:"Better known as the manager, but a fine player too. The man who brought it home."},
    {caps:33,name:"Nat Lofthouse",country:"England",msg:"The Lion of Vienna. One of England's most courageous centre-forwards."},
    {caps:34,name:"Michael Carrick",country:"England",msg:"The most underrated midfielder of his generation. Finally getting the recognition he deserves."},
    {caps:35,name:"Jack Charlton",country:"England",msg:"Big Jack — World Cup winner, manager of Ireland, and a proper football man."},
    {caps:36,name:"Graeme Le Saux",country:"England",msg:"One of the most cultured left backs England produced in the 90s. A Premier League title winner with Blackburn."},
    {caps:37,name:"George Cohen",country:"England",msg:"One of the unsung heroes of 1966. A reliable, tireless right back."},
    {caps:38,name:"Jamie Carragher",country:"England",msg:"Warrior. Would die for Liverpool. Did his best for England too."},
    {caps:39,name:"Nicky Butt",country:"England",msg:"The man who held it together when everyone else got the glory. Quietly brilliant."},
    {caps:40,name:"Phil Jagielka",country:"England",msg:"A rock at centre-back for Everton and England for over a decade. Reliable and underappreciated."},
    {caps:41,name:"Paul Robinson",country:"England",msg:"One of England's most reliable keepers of his era. Remember that goal against Croatia?"},
    {caps:42,name:"Peter Crouch",country:"England",msg:"A robot, allegedly. 42 caps and a goal record for a target man that's hard to argue with."},
    {caps:43,name:"Jimmy Armfield",country:"England",msg:"Often called the best right-back England has ever had. A true gentleman of the game."},
    {caps:44,name:"César Azpilicueta",country:"Spain",msg:"Mr Chelsea. A decade of top-level consistency and a Spain career to match."},
    {caps:45,name:"Mark Wright",country:"England",msg:"A commanding centre-back who captained England and shone at Italia 90."},
    {caps:46,name:"Mick Channon",country:"England",msg:"The windmill celebration, 46 caps, and a proper career on both sides of the white line."},
    {caps:47,name:"Trevor Brooking",country:"England",msg:"Elegant, intelligent football. One of England's finest playmakers."},
    {caps:48,name:"Colin Bell",country:"England",msg:"The King of the Kippax. Injury robbed England of so much more from him."},
    {caps:49,name:"Geoff Hurst",country:"England",msg:"The only man to score a hat-trick in a World Cup final. You're keeping legendary company."},
    {caps:50,name:"Garrincha",country:"Brazil",msg:"Joy of the People. Some say he was better than Pelé. 50 caps and two World Cup winners medals."},
    {caps:51,name:"Teddy Sheringham",country:"England",msg:"Still scoring at the top level in his late 30s. A footballer's footballer."},
    {caps:52,name:"Trevor Francis",country:"England",msg:"England's first £1m player. The fee was justified."},
    {caps:53,name:"Glenn Hoddle",country:"England",msg:"One of the most technically gifted players England has ever produced. 53 caps wasn't enough."},
    {caps:54,name:"Stanley Matthews",country:"England",msg:"The Wizard of the Dribble. Playing top-flight football at 50. A genuine one-off."},
    {caps:55,name:"Benjamin Pavard",country:"France",msg:"That goal against Argentina at the 2018 World Cup alone would justify his place in history."},
    {caps:56,name:"Roberto Baggio",country:"Italy",msg:"The Divine Ponytail. One of the most complete players Italy has ever produced. The penalty miss haunts him still."},
    {caps:57,name:"Paul Gascoigne",country:"England",msg:"Genius, chaos, and everything in between. One of the greatest to ever pull on an England shirt."},
    {caps:58,name:"Marco van Basten",country:"Netherlands",msg:"Three Ballon d'Or awards. That volley in the Euro 88 final. A career ended too soon by injury."},
    {caps:59,name:"Peter Beardsley",country:"England",msg:"The most creative English forward of his generation. Lineker got the goals, Beardsley made them."},
    {caps:60,name:"Sócrates",country:"Brazil",msg:"Doctor, philosopher, captain. Sócrates played football like he thought about life — with total freedom."},
    {caps:61,name:"Ray Clemence",country:"England",msg:"Unlucky to share an era with Shilton. Either of them would walk into most England XIs of all time."},
    {caps:62,name:"Gerd Müller",country:"Germany",msg:"Der Bomber. 68 international goals for West Germany. Pure, ruthless efficiency in front of goal."},
    {caps:63,name:"Alan Shearer",country:"England",msg:"The Premier League's all-time top scorer. Turned down Real Madrid to stay at Newcastle. True icon."},
    {caps:64,name:"Eusébio",country:"Portugal",msg:"The Black Panther. Portugal's greatest player before a certain someone came along. 64 caps, timeless legend."},
    {caps:65,name:"Pedro",country:"Spain",msg:"Part of the greatest club and country side ever assembled. Three consecutive La Liga titles, Champions League, and World Cup winner."},
    {caps:66,name:"Ruud Gullit",country:"Netherlands",msg:"The total footballer. Dreads, elegance, and a ballon d'Or. Euro 88 was his masterpiece."},
    {caps:67,name:"N'Golo Kanté",country:"France",msg:"Somehow everywhere at once. Two league titles, a Champions League, and a World Cup winner."},
    {caps:68,name:"Francesco Totti",country:"Italy",msg:"One club, one city, one legend. Roma's captain, Italy's most beloved player."},
    {caps:70,name:"Ruud van Nistelrooy",country:"Netherlands",msg:"Cold-blooded in the box. One of the most clinical finishers European football has ever seen."},
    {caps:71,name:"Zico",country:"Brazil",msg:"The White Pelé. The 1982 Brazil team he led may be the greatest side never to win a World Cup."},
    {caps:72,name:"Uwe Seeler",country:"Germany",msg:"A one-club man in an era before that was rare. Hamburg's greatest ever player."},
    {caps:73,name:"Gordon Banks",country:"England",msg:"The greatest save in history, the best goalkeeper England has ever had. A different level."},
    {caps:74,name:"Rivaldo",country:"Brazil",msg:"Left foot, right foot, chest, bicycle kick — it didn't matter. One of the most gifted forwards of his generation."},
    {caps:75,name:"David Seaman",country:"England",msg:"Safe hands, great moustache. One of England's finest ever goalkeepers."},
    {caps:76,name:"Carlos Tevez",country:"Argentina",msg:"Relentless. Tore apart Premier League defences for years. Loved at every club. Almost."},
    {caps:77,name:"Bebeto",country:"Brazil",msg:"Baby, baby, baby. The rock-a-baby celebration and a World Cup winner with Romário. Pure class."},
    {caps:78,name:"Gabriel Batistuta",country:"Argentina",msg:"Batigol. One of the most feared strikers of the 90s. Argentina never had a better finisher."},
    {caps:79,name:"Dennis Bergkamp",country:"Netherlands",msg:"The Non-Flying Dutchman. Goals of breathtaking beauty. That touch against Newcastle. Immortal."},
    {caps:80,name:"Gary Lineker",country:"England",msg:"Never booked, never sent off, never stopped scoring. A clean record — just like your streak."},
    {caps:81,name:"Franco Baresi",country:"Italy",msg:"The best sweeper who ever lived, some say. Italy and AC Milan were built around him for a decade."},
    {caps:82,name:"Youri Djorkaeff",country:"France",msg:"The Snake. Glided through the 98 World Cup and Euro 2000 like it was effortless."},
    {caps:83,name:"Ruud Krol",country:"Netherlands",msg:"The heartbeat of Total Football's greatest era. Two World Cup finals with the Netherlands."},
    {caps:84,name:"Blaise Matuidi",country:"France",msg:"The engine room of the 2018 World Cup winning France side. Unglamorous, essential, brilliant."},
    {caps:85,name:"Gary Neville",country:"England",msg:"Fergie's trusted sergeant. The best right back of his generation and now the most opinionated man in football."},
    {caps:86,name:"Oliver Kahn",country:"Germany",msg:"The Titan. Possibly the most intense goalkeeper in football history. That 2002 World Cup was incredible."},
    {caps:87,name:"Fabien Barthez",country:"France",msg:"The bald head, the mind games, the World Cup and Euros medals. A great keeper who wore his eccentricity with pride."},
    {caps:88,name:"Pauleta",country:"Portugal",msg:"Portugal's record scorer before Ronaldo arrived. 47 international goals and a brilliant career at PSG."},
    {caps:89,name:"Michael Owen",country:"England",msg:"That goal against Argentina. 18 years old, best player on the planet. England's most precocious talent."},
    {caps:90,name:"Rudi Völler",country:"Germany",msg:"Goals in three World Cups, a manager who famously lost it at half time. One of Germany's great characters."},
    {caps:91,name:"Diego Maradona",country:"Argentina",msg:"The Hand of God, the Goal of the Century — and now your streak. You're in Maradona territory. Keep going 🔥"},
    {caps:92,name:"Pelé",country:"Brazil",msg:"Arguably the greatest of all time. Three World Cups. Your streak is now in the same conversation. Remarkable 🏆"},
    {caps:93,name:"Raphaël Varane",country:"France",msg:"Champions League four times, World Cup once. The most decorated defender of his generation."},
    {caps:94,name:"Rui Costa",country:"Portugal",msg:"The magician who preceded Ronaldo. A sublime playmaker who lit up European football for a decade."},
    {caps:95,name:"Karl-Heinz Rummenigge",country:"Germany",msg:"Two Ballon d'Or awards and two World Cup finals. One of the deadliest forwards of the 80s."},
    {caps:96,name:"Arjen Robben",country:"Netherlands",msg:"The left foot was a myth. The right foot was unstoppable. He cut inside every single time and no one could stop him."},
    {caps:97,name:"Ronaldinho",country:"Brazil",msg:"The biggest smile in football, the most creative player of his era. Pure joy to watch at his peak."},
    {caps:98,name:"Ronaldo",country:"Brazil",msg:"R9. The original Ronaldo. Two World Cups, three World Cup Golden Boots. An alien in football boots."},
    {caps:99,name:"Antonio Valencia",country:"Ecuador",msg:"Ecuador's greatest ever player and a Premier League title winner with Manchester United. Unstoppable at his peak."},
    {caps:100,name:"Carles Puyol",country:"Spain",msg:"The heart and soul of the golden generation. That header against Germany. A warrior in the truest sense."},
    {caps:101,name:"Sergio Agüero",country:"Argentina",msg:"AGUEROOOOO. The most dramatic goal in Premier League history and one of the greatest strikers of his era."},
    {caps:102,name:"Robin van Persie",country:"Netherlands",msg:"That header against Spain in 2014. That volley against Aston Villa. Simply one of the best ever to do it."},
    {caps:103,name:"Franz Beckenbauer",country:"Germany",msg:"Der Kaiser. Won the World Cup as captain and manager. Redefined what a sweeper could be."},
    {caps:105,name:"Billy Wright",country:"England",msg:"England's first 100-cap man. A true pioneer — and now you've matched him. Legendary 🏆"},
    {caps:106,name:"Bobby Charlton",country:"England",msg:"Survived Munich, won the World Cup, won the European Cup. One of England's greatest ever players."},
    {caps:107,name:"Patrick Vieira",country:"France",msg:"Dominant, powerful, and the engine of Arsenal's Invincibles. A colossus of the Premier League era."},
    {caps:108,name:"Zinedine Zidane",country:"France",msg:"The greatest player of his generation. That World Cup final headbutt aside. A genius with a football."},
    {caps:109,name:"Dries Mertens",country:"Belgium",msg:"Belgium's all-time top scorer. A cult hero at Napoli. Small in stature, enormous in quality."},
    {caps:110,name:"Fernando Torres",country:"Spain",msg:"El Niño at his peak was unplayable. That Euro 2008 final goal defined a golden generation."},
    {caps:111,name:"Gareth Bale",country:"Wales",msg:"Five Champions League medals. Wales' greatest ever player. The Golf, Wales, Madrid memes aside — an absolute superstar."},
    {caps:112,name:"Dino Zoff",country:"Italy",msg:"Won the World Cup at 40. Possibly the greatest goalkeeper Italy has ever produced."},
    {caps:113,name:"Philipp Lahm",country:"Germany",msg:"The perfect footballer. Could play anywhere, never had a bad game. World Cup winner in his final year."},
    {caps:114,name:"Xabi Alonso",country:"Spain",msg:"The passing was metronomic. That goal from his own half against Newcastle. A true great of his era."},
    {caps:115,name:"David Beckham",country:"England",msg:"Free kicks, fame, and an era-defining career. That goal from the halfway line against Wimbledon was special."},
    {caps:116,name:"Andrea Pirlo",country:"Italy",msg:"The Architect. Made the game look slow when he was on the ball. A maestro."},
    {caps:117,name:"Giorgio Chiellini",country:"Italy",msg:"Possibly the most aggressive defender of his era — in the best way. You did not want to play against him."},
    {caps:118,name:"James Rodríguez",country:"Colombia",msg:"That volley against Uruguay at the 2014 World Cup. The goal of the tournament, possibly the decade."},
    {caps:119,name:"Pat Jennings",country:"N. Ireland",msg:"Scored in the 1967 Charity Shield with a kick from his own area. One of the all-time great keepers."},
    {caps:120,name:"Wayne Rooney",country:"England",msg:"England's all-time top scorer. A force of nature at his peak. Your streak matches his cap count — respect."},
    {caps:121,name:"Bastian Schweinsteiger",country:"Germany",msg:"The heart of the 2014 World Cup winning Germany side. Limping through that final on one leg was pure character."},
    {caps:122,name:"Zlatan Ibrahimović",country:"Sweden",msg:"No one like Zlatan. That bicycle kick against England. Played top-level football into his 40s. Ridiculous career."},
    {caps:123,name:"Thierry Henry",country:"France",msg:"The greatest Premier League player? Many would say yes. That run and finish was on repeat for a decade."},
    {caps:124,name:"Manuel Neuer",country:"Germany",msg:"Reinvented goalkeeping. The sweeper-keeper. His 2014 World Cup was one of the best individual tournament performances ever."},
    {caps:125,name:"Roberto Carlos",country:"Brazil",msg:"That free kick against France in 1997 defied physics. One of the greatest left backs in football history."},
    {caps:126,name:"Paolo Maldini",country:"Italy",msg:"The greatest defender who ever lived, many say. Your streak is built like his defending — immovable."},
    {caps:127,name:"Luís Figo",country:"Portugal",msg:"Ballon d'Or, World Player of the Year, and the transfer that broke Barcelona's heart. A true great."},
    {caps:128,name:"Neymar",country:"Brazil",msg:"The most skilful player of his generation. The weight of carrying Brazil is heavy — your streak carries its own."},
    {caps:129,name:"Peter Schmeichel",country:"Denmark",msg:"The Great Dane. Won everything at United, then led Denmark to Euro 92. A genuine colossus."},
    {caps:130,name:"Edwin van der Sar",country:"Netherlands",msg:"Kept a Premier League record 1,311 minutes without conceding. Unflappable. Like your streak."},
    {caps:131,name:"Andrés Iniesta",country:"Spain",msg:"The quietest genius in football history. That goal in the 2010 World Cup final. Perfection."},
    {caps:132,name:"Simon Kjær",country:"Denmark",msg:"A fine defender, but remembered forever for saving Christian Eriksen's life at Euro 2020. A true hero."},
    {caps:133,name:"Xavi",country:"Spain",msg:"The metronome. 767 passes in the 2010 World Cup, 0 lost. Football as chess. Your streak has the same discipline."},
    {caps:134,name:"Wesley Sneijder",country:"Netherlands",msg:"Should have won the Ballon d'Or in 2010. Led the Netherlands to a World Cup final. Criminally underrated."},
    {caps:136,name:"Fabio Cannavaro",country:"Italy",msg:"Won the World Cup and the Ballon d'Or as a defender. The captain who lifted the trophy in Berlin."},
    {caps:137,name:"Miroslav Klose",country:"Germany",msg:"The World Cup's all-time top scorer with 16 goals. Clinical, reliable, extraordinary. Just like your streak."},
    {caps:141,name:"Pepe",country:"Portugal",msg:"Fierce, physical, and utterly relentless. One of the most intimidating defenders of the Champions League era."},
    {caps:142,name:"Cafu",country:"Brazil",msg:"The train. Never stopped running. Won two World Cups and is arguably the greatest right back ever."},
    {caps:143,name:"Javier Zanetti",country:"Argentina",msg:"Over 850 games for Inter Milan, 143 caps for Argentina. One of football's greatest servants."},
    {caps:144,name:"Yuto Nagatomo",country:"Japan",msg:"Japan's most capped outfield player of his era. Won three J-League titles and carved out a career across Europe."},
    {caps:145,name:"Ángel Di María",country:"Argentina",msg:"The man of the match in the 2014 World Cup final before injury cut him short. A World Cup winner in 2022."},
    {caps:146,name:"Robbie Keane",country:"Ireland",msg:"Ireland's greatest ever player and joint record goalscorer in European qualifying. 146 caps — an icon."},
    {caps:147,name:"Javier Mascherano",country:"Argentina",msg:"El Jefecito. Played at centre back despite being a midfielder and somehow made it look easy. Titan."},
    {caps:148,name:"Ali Daei",country:"Iran",msg:"109 international goals, 148 caps. Iran's greatest ever player — held the record for most international goals until Ronaldo."},
    {caps:150,name:"Lothar Matthäus",country:"Germany",msg:"The most capped outfield player in World Cup history. You're at the summit now. Outstanding."},
    {caps:152,name:"Yasuhito Endō",country:"Japan",msg:"Japan's most capped player ever. A one-club legend at Gamba Osaka for over 20 years."},
    {caps:156,name:"Sami Al-Jaber",country:"Saudi Arabia",msg:"Four World Cups for Saudi Arabia. The most prolific striker in their history."},
    {caps:157,name:"Jan Vertonghen",country:"Belgium",msg:"Belgium's most capped player and one of the finest left-sided centre-backs of his era. A quiet colossus."},
    {caps:159,name:"Essam El-Hadary",country:"Egypt",msg:"Played international football into his 40s. A legendary goalkeeper in African football history."},
    {caps:167,name:"Iker Casillas",country:"Spain",msg:"Saint Iker. Won everything there is to win — two Euros, a World Cup, three Champions Leagues. A legend."},
    {caps:168,name:"Iván Hurtado",country:"Ecuador",msg:"Ecuador's most capped player. Played in two World Cups and was the foundation of their defence for 15 years."},
    {caps:176,name:"Gianluigi Buffon",country:"Italy",msg:"Twenty years of international football. The most dedicated goalkeeper of the modern era. Exceptional commitment."},
    {caps:177,name:"Hossam Hassan",country:"Egypt",msg:"Africa's all-time record scorer and one of the most prolific international forwards the continent has seen."},
    {caps:180,name:"Sergio Ramos",country:"Spain",msg:"The most decorated defender in football history. 180 caps, every honour the game offers. You've reached the very top."},
    {caps:182,name:"Andrés Guardado",country:"Mexico",msg:"Mexico's most decorated captain. Five World Cups and a career spanning two decades at the highest level."},
    {caps:184,name:"Ahmed Hassan",country:"Egypt",msg:"Africa's record cap holder. Four Africa Cup of Nations titles. A true giant of the continent's football history."},
  ];
  const EARLY_MESSAGES = [
    "Play today's match to get on the board 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    "Day 1 down. The journey starts here. Come back tomorrow 🔥",
    "2 caps in. Every legend started somewhere. Keep going 🔥",
    "3 days straight. You're forming a habit. Don't break it 🔥",
    "4 caps. Early doors but you're showing up. Keep going 🔥",
    "5 caps in. One week nearly done. Stay consistent 🔥",
    "6 caps. You're proving you mean business. Don't stop now 🔥",
    "7 days — a full week. Plenty more where that came from 🔥",
    "8 caps. You're past the casual phase now. Keep pushing 🔥",
    "9 caps in. One more and you're into proper company 🔥",
  ];
  function getStreakPlayer(days){
    // Always find the highest player whose caps <= days (never reveal ahead)
    const cap=Math.min(days,180);
    let best=null;
    for(const p of CAPS_PLAYERS){
      if(p.caps<=cap){
        if(!best||p.caps>best.caps) best=p;
      }
    }
    return best;
  }
  function getGapMessage(streak) {
    if(streak<20)  return "Double figures. You're earning your place in the squad 🔥";
    if(streak<30)  return "Over 20 days. You're not a one-week wonder — this is becoming a habit 🔥";
    if(streak<40)  return "30+ caps in. You'd be a regular international at most nations. Keep going 🔥";
    if(streak<50)  return "Pushing 40. You're in the conversation for the greatest at your position 🔥";
    if(streak<60)  return "Past 50. Half a century of caps — very few players ever get here. Remarkable 🔥";
    if(streak<70)  return "60 caps deep. You're writing your own chapter now. Don't stop 🔥";
    if(streak<80)  return "70+ days. A legend of the game would be proud of this run 🔥";
    if(streak<90)  return "Closing in on 80. The dedication required to get here is elite 🔥";
    if(streak<100) return "Nearly a century of caps. You're in the all-time conversation now 🔥";
    if(streak<110) return "Past 100. An exclusive club. Fewer players have done this than you think 🔥";
    if(streak<120) return "110 days in. This is generational commitment. Keep going 🔥";
    if(streak<130) return "Closing in on 120. You are the definition of a serial winner 🔥";
    if(streak<140) return "130 caps. At this point you're a national institution 🔥";
    if(streak<150) return "140 days in. The stats don't lie — you are elite 🔥";
    if(streak<160) return "150 caps. The rarest of the rare. Keep going 🔥";
    if(streak<170) return "Past 160. Almost no one reaches these heights. Extraordinary 🔥";
    if(streak<180) return "170 days in. You are one of the most dedicated players this game has ever seen 🔥";
    if(streak<190) return "Past 180. You've surpassed Sergio Ramos — the most decorated defender of all time. Breathtaking 🏆";
    if(streak<200) return "190 caps. You are in completely uncharted territory now. The stuff of legend 🏆";
    if(streak<215) return "200 days. Two hundred. There are no comparisons left. You are StatStreaks 🏆";
    if(streak<225) return "Past 200. If football had a Hall of Fame for dedication, you'd be first in 🏆";
    if(streak<240) return "225 caps. Every day you come back is another chapter of something extraordinary 🏆";
    if(streak<250) return "Pushing 250. The greatest run in StatStreaks history. Don't stop now 🏆";
    if(streak<265) return "250 days. A quarter of a thousand. Utterly, completely unstoppable 🏆";
    if(streak<275) return "Past 250. At this point we need to build a statue 🏆";
    if(streak<290) return "275 caps. This streak has taken on a life of its own. Phenomenal 🏆";
    if(streak<300) return "Almost 300. If you reach it, the game is yours — forever 🏆";
    return `${streak} caps. You've reached 300. StatStreaks has never seen anything like this. You are immortal 🐐`;
  }
  function getStreakSubtext(){
    if(streak<=0) return EARLY_MESSAGES[0];
    if(streak<10) return EARLY_MESSAGES[streak];
    const p=getStreakPlayer(streak);
    if(!p) return getGapMessage(streak);
    const diff=streak-p.caps; // always >= 0
    if(diff===0) return `${p.name} — ${p.caps} caps for ${p.country}. ${p.msg} Come back tomorrow 🔥`;
    if(diff<=3)  return `Beyond ${p.name}'s ${p.caps} caps for ${p.country}. ${p.msg.split('.')[0]}. Keep going 🔥`;
    // In a gap between two players — motivational, no player reveal
    return getGapMessage(streak);
  }

  // Career status — shared between home + result screens
  if(screen==="home") {

    function resetDemo(){
      lsSet("daily_done","");setDailyDone("");
      lsSet("daily_result",null);setDailyResult(null);
      lsSet("streak",0);setStreak(0);
      lsSet("peak_streak",0);setPeakStreak(0);
      lsSet("last_played","");
      lsSet("restore_offered",false);setRestoreOffered(false);
      lsSet("decay_start","");setDecayStart("");
      lsSet("last_decay_applied","");setLastDecayApplied("");
      setCareerMode("normal");
      lsSet("rush_scores",[]);setRushScores([]);
      RUSH_CATEGORIES.forEach(c=>{lsSet(`rush_best_${c.id}`,0);lsSet(`rush_plays_${c.id}`,0);});
      setTestDayOffset(0);
    }

    const status = getCareerStatus(streak);
    const prevMilestone = streak===0?0:status.next===1?0:[0,1,4,8,15,25,40,60,85,115,150,200].reverse().find(m=>m<=streak)||0;
    const milestoneRange = status.next ? status.next - prevMilestone : 100;
    const milestoneProgress = status.next ? Math.min(streak - prevMilestone, milestoneRange) : milestoneRange;
    const progressPct = status.next ? Math.round((milestoneProgress / milestoneRange) * 100) : 100;

    return(
    <PageWrap>
      {/* ── CAREER RESTORE / DECAY OVERLAY ── */}
      {(careerMode==="restore"||careerMode==="decay")&&(
        <StreakRestoreOverlay
          mode={careerMode}
          streak={streak}
          peakStreak={peakStreak||streak}
          onWatch={()=>{
            if(careerMode==="restore"){
              // Full restore — streak unchanged, just reset flags
              lsSet("restore_offered",false);setRestoreOffered(false);
              lsSet("last_played",todayKey);
            } else {
              // Decay boost — +3 capped at peak
              const peak = Math.max(lsGet("peak_streak",0), streak+3);
              const boosted = Math.min(streak+3, peak);
              lsSet("streak",boosted);setStreak(boosted);
              lsSet("last_decay_applied",todayKey);setLastDecayApplied(todayKey);
            }
            setCareerMode("normal");
          }}
          onDecline={()=>{
            if(careerMode==="restore"){
              // Declined restore — start decay, transition straight to decay card
              lsSet("decay_start",todayKey);setDecayStart(todayKey);
              lsSet("last_decay_applied",todayKey);setLastDecayApplied(todayKey);
              // Only show decay card if they still have caps to lose
              setCareerMode(streak > 0 ? "decay" : "normal");
            } else {
              setCareerMode("normal");
            }
          }}
        />
      )}
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

          <div style={{position:"relative"}}>
            {/* Top row: Career Caps label left, name right — same line */}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:4}}>
              <div style={{fontSize:9,color:"rgba(255,255,255,0.55)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Career Caps</div>
              {nameEditing?(
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                  <input
                    value={nameDraft}
                    onChange={e=>setNameDraft(e.target.value.slice(0,20))}
                    onKeyDown={e=>{
                      if(e.key==="Enter"){const t=nameDraft.trim();if(t)setUsername(t);setNameEditing(false);}
                      if(e.key==="Escape"){setNameEditing(false);}
                    }}
                    maxLength={20} placeholder="Your player name…" autoFocus
                    style={{width:130,background:"rgba(255,255,255,0.1)",border:`1px solid ${status.col}60`,borderRadius:7,padding:"4px 8px",color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:11,fontWeight:700,outline:"none",caretColor:status.col}}
                  />
                  <button onClick={()=>{const t=nameDraft.trim();if(t)setUsername(t);setNameEditing(false);}}
                    style={{padding:"4px 9px",background:status.col,border:"none",borderRadius:7,color:"#000",fontFamily:"'Inter',sans-serif",fontSize:10,fontWeight:800,letterSpacing:1,cursor:"pointer",textTransform:"uppercase",flexShrink:0}}>Save</button>
                  <button onClick={()=>setNameEditing(false)}
                    style={{padding:"4px 7px",background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:7,color:"rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif",fontSize:10,cursor:"pointer",flexShrink:0}}>✕</button>
                </div>
              ):(
                <button onClick={()=>{setNameDraft(username||"");setNameEditing(true);SFX.click();}}
                  style={{display:"flex",alignItems:"center",gap:5,background:"transparent",border:"none",cursor:"pointer",padding:0}}>
                  <span style={{fontSize:12,fontWeight:700,color:status.col,fontFamily:"'Inter',sans-serif",letterSpacing:0.3}}>
                    {username||"Add name…"}
                  </span>
                  <span style={{fontSize:9,color:status.col,opacity:0.7}}>✏️</span>
                </button>
              )}
            </div>

            {/* Big number row — badge inline on the right */}
            <div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between"}}>
              <div style={{lineHeight:1}}>
                <span style={{fontSize:80,fontWeight:900,color:status.col,lineHeight:0.9,fontFamily:"'Bebas Neue',sans-serif",textShadow:`0 0 40px ${status.col}55, 0 2px 0 rgba(0,0,0,0.3)`,letterSpacing:1,display:"block"}}>{streak}</span>
                <span style={{fontSize:11,color:"rgba(255,255,255,0.6)",fontWeight:600,letterSpacing:3,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>CAPS</span>
              </div>
              <div style={{textAlign:"right",paddingBottom:6,flexShrink:0,paddingLeft:12}}>
                <div style={{fontSize:22,marginBottom:6}}>{status.icon}</div>
                <div style={{background:`${status.col}20`,border:`1px solid ${status.col}40`,borderRadius:20,padding:"5px 12px",display:"inline-block"}}>
                  <span style={{fontSize:10,color:status.col,fontWeight:700,letterSpacing:0.5,textTransform:"uppercase",whiteSpace:"nowrap",fontFamily:"'Inter',sans-serif"}}>{status.label}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Subtext — above progress bar */}
          <div style={{marginTop:12,fontSize:11,color:"rgba(255,255,255,0.65)",lineHeight:1.5,fontStyle:"italic",fontFamily:"'Inter',sans-serif",textAlign:"center"}}>
            {getStreakSubtext()}
          </div>

          {/* Progress bar to next milestone */}
          {status.next&&(
            <div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
                <span style={{fontSize:9,color:"rgba(255,255,255,0.6)",letterSpacing:1,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>{streak} / {status.next} caps</span>
                <span style={{fontSize:9,color:status.col,fontWeight:600,fontFamily:"'Inter',sans-serif"}}>Next: {status.nextLabel}</span>
              </div>
              <div style={{height:5,background:"rgba(255,255,255,0.08)",borderRadius:99,overflow:"hidden"}}>
                <div style={{height:"100%",width:`${progressPct}%`,background:`linear-gradient(90deg,${status.col}99,${status.col})`,borderRadius:99,transition:"width 0.6s ease",boxShadow:`0 0 8px ${status.col}66`}}/>
              </div>
            </div>
          )}
        </div>

        {/* ══ TODAY'S MATCH ══ */}
        <div style={{
          background: todayPlayed
            ? "linear-gradient(160deg,#0d1f2d 0%,#0a1a25 100%)"
            : "linear-gradient(160deg,#ffffff 0%,#ecfeff 100%)",
          borderRadius:18,
          overflow:"hidden",
          marginBottom:12,
          boxShadow: todayPlayed
            ? "0 4px 16px rgba(0,0,0,0.3)"
            : "0 6px 28px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.9)",
          border: todayPlayed
            ? "1px solid rgba(6,182,212,0.12)"
            : "1px solid rgba(6,182,212,0.2)",
          position:"relative",
          opacity: todayPlayed ? 0.85 : 1,
        }}>
          {/* subtle diagonal stripe */}
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 20px,rgba(6,182,212,0.02) 20px,rgba(6,182,212,0.02) 21px)",pointerEvents:"none"}}/>
          {/* Matchday header */}
          <div style={{
            background:"linear-gradient(135deg,#0e7490 0%,#0891b2 60%,#06b6d4 100%)",
            padding:"12px 18px",
            position:"relative",
          }}>
            <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 14px,rgba(255,255,255,0.05) 14px,rgba(255,255,255,0.05) 15px)",pointerEvents:"none"}}/>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.7)",letterSpacing:3,fontWeight:600,textTransform:"uppercase",marginBottom:2,fontFamily:"'Inter',sans-serif",position:"relative"}}>Today's Match</div>
            <div style={{fontSize:15,color:"#ffffff",fontWeight:800,fontFamily:"'Inter',sans-serif",lineHeight:1.2,position:"relative"}}>{todayChallenge.theme}</div>
          </div>

          <div style={{padding:"16px 18px",position:"relative"}}>
            {!todayPlayed&&(
              <div>
                <button onClick={launchDaily}
                  style={{
                    width:"100%",
                    padding:"16px",
                    background:"linear-gradient(135deg,#0e7490 0%,#0891b2 50%,#06b6d4 100%)",
                    border:"none",borderRadius:12,
                    color:"#ffffff",
                    fontSize:17,fontWeight:800,letterSpacing:0.5,
                    cursor:"pointer",
                    fontFamily:"'Inter',sans-serif",
                    boxShadow:"0 6px 20px rgba(6,182,212,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
                    transition:"transform 0.12s,box-shadow 0.12s",
                    display:"block",
                  }}
                  onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 28px rgba(6,182,212,0.55), inset 0 1px 0 rgba(255,255,255,0.2)";}}
                  onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 6px 20px rgba(6,182,212,0.45), inset 0 1px 0 rgba(255,255,255,0.2)";}}>
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
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",borderRadius:10,overflow:"hidden",border:"1px solid rgba(255,255,255,0.08)",marginBottom:10,background:"rgba(255,255,255,0.05)"}}>
                  {[
                    {label:"Your Score",val:`${todayResult.filter(r=>r==="correct").length}/10`,col:"#06b6d4"},
                    {label:"Global Avg",val:"4.2",col:"rgba(255,255,255,0.4)"},
                  ].map((item,i)=>(
                    <div key={i} style={{textAlign:"center",padding:"12px 6px",borderLeft:i>0?"1px solid rgba(255,255,255,0.08)":"none"}}>
                      <div style={{fontSize:8,color:"rgba(255,255,255,0.4)",letterSpacing:1.5,fontWeight:600,marginBottom:4,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>{item.label}</div>
                      <div style={{fontSize:20,fontWeight:800,color:item.col,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>{item.val}</div>
                    </div>
                  ))}
                </div>
                {/* Share button — blue */}
                <button onClick={()=>{
                  const s=todayResult.filter(r=>r==="correct").length;
                  const emojiGrid=todayResult.map(r=>r==="correct"?"🟩":r==="yellow"?"🟨":"🟥").join("");
                  const t=`StatStreaks #${effectiveDayIdx+1} ⚽\n${emojiGrid}\n${s}/10 🧢 ${streak}`;
                  try{navigator.clipboard.writeText(t);}catch{}alert("Copied!");
                }} style={{width:"100%",padding:"11px",background:"linear-gradient(135deg,#2563eb,#3b82f6)",border:"none",borderRadius:10,color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,marginBottom:10,boxShadow:"0 4px 12px rgba(37,99,235,0.35)"}}>
                  ↗ Share your score
                </button>
                {/* Tomorrow's fixture — light cyan */}
                <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"rgba(6,182,212,0.08)",borderRadius:10,border:"1px solid rgba(6,182,212,0.2)"}}>
                  <span style={{fontSize:14}}>🔭</span>
                  <div>
                    <div style={{fontSize:8,color:"rgba(6,182,212,0.6)",letterSpacing:2,fontWeight:600,marginBottom:1,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Tomorrow's Fixture</div>
                    <div style={{fontSize:12,color:"#67e8f9",fontWeight:600,fontFamily:"'Inter',sans-serif"}}>{tomorrowChallenge.theme}</div>
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
            background:"linear-gradient(135deg,#7c0d3e 0%,#be185d 40%,#db2777 70%,#ec4899 100%)",
            border:"1px solid rgba(236,72,153,0.3)",
            borderRadius:18,cursor:"pointer",overflow:"hidden",marginBottom:16,
            boxShadow:"0 6px 24px rgba(219,39,119,0.55), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 60px rgba(219,39,119,0.12)",
            transition:"transform 0.12s,box-shadow 0.12s",display:"block",textAlign:"left",padding:"0",
            position:"relative",
          }}
          onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 32px rgba(219,39,119,0.7), inset 0 1px 0 rgba(255,255,255,0.25)";}}
          onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 6px 24px rgba(219,39,119,0.55), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.2), 0 0 60px rgba(219,39,119,0.12)";}}>
          {/* noise texture overlay */}
          <div style={{position:"absolute",inset:0,background:"url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",pointerEvents:"none",borderRadius:18}}/>
          {/* diagonal stripes */}
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 24px,rgba(255,255,255,0.018) 24px,rgba(255,255,255,0.018) 25px)",pointerEvents:"none",borderRadius:18}}/>
          {/* radial spotlight top-right */}
          <div style={{position:"absolute",top:"-40%",right:"-10%",width:"60%",height:"200%",background:"radial-gradient(ellipse at 80% 30%, rgba(255,255,255,0.08) 0%, transparent 65%)",pointerEvents:"none"}}/>
          {/* shimmer line */}
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.35),transparent)",pointerEvents:"none"}}/>
          <div style={{padding:"12px 18px",position:"relative"}}>
            <div style={{fontSize:9,color:"rgba(255,255,255,0.6)",letterSpacing:3,fontWeight:700,textTransform:"uppercase",marginBottom:2,fontFamily:"'Inter',sans-serif"}}>Training Pitch</div>
            <div style={{fontSize:15,fontWeight:800,color:"#ffffff",fontFamily:"'Inter',sans-serif",lineHeight:1.2}}>30s High Score Mode ⚡</div>
            <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",fontFamily:"'Inter',sans-serif",marginTop:2}}>Go for a perfect run · 2× multiplier</div>
          </div>
        </button>

        {/* ── LEADERBOARD LINK ── */}
        <button onClick={()=>{SFX.click();setPrevScreen("home");setScreen("leaderboard");}}
          style={{
            width:"100%",display:"flex",alignItems:"center",justifyContent:"space-between",
            background:"linear-gradient(135deg,#92400e 0%,#b45309 50%,#d97706 100%)",
            border:"1px solid rgba(217,119,6,0.4)",
            borderRadius:12,padding:"11px 16px",cursor:"pointer",marginBottom:12,
            fontFamily:"'Inter',sans-serif",transition:"transform 0.12s,box-shadow 0.12s",
            boxShadow:"0 4px 16px rgba(217,119,6,0.35), inset 0 1px 0 rgba(255,255,255,0.15)",
            position:"relative",overflow:"hidden",
          }}
          onMouseOver={e=>{e.currentTarget.style.transform="translateY(-1px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(217,119,6,0.5), inset 0 1px 0 rgba(255,255,255,0.15)";}}
          onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(217,119,6,0.35), inset 0 1px 0 rgba(255,255,255,0.15)";}}>
          <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(255,255,255,0.03) 16px,rgba(255,255,255,0.03) 17px)",pointerEvents:"none"}}/>
          <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(255,255,255,0.3),transparent)",pointerEvents:"none"}}/>
          <div style={{display:"flex",alignItems:"center",gap:10,position:"relative"}}>
            <span style={{fontSize:16}}>🏆</span>
            <div style={{textAlign:"left"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#ffffff",fontFamily:"'Inter',sans-serif"}}>Leaderboards</div>
              <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",fontFamily:"'Inter',sans-serif",marginTop:1}}>Top Scorer · Golden Boot · Caps</div>
            </div>
          </div>
          <span style={{fontSize:13,color:"rgba(255,255,255,0.5)",position:"relative"}}>→</span>
        </button>

        {/* ── DEMO CONTROLS ── */}
        <div style={{display:"flex",gap:6}}>
          {[
            {label:`🔄 Day ${effectiveDayIdx+1}/${DAILY_CHALLENGES.length}`,fn:()=>{SFX.click();setTestDayOffset(o=>(o+1)%DAILY_CHALLENGES.length);}},
            {label:"🧢 +1 Cap",fn:()=>{const ns=streak+1;lsSet("streak",ns);setStreak(ns);if(ns>peakStreak){lsSet("peak_streak",ns);setPeakStreak(ns);}}},
            {label:"💤 Miss Day",fn:()=>{
              const yesterday=new Date();yesterday.setDate(yesterday.getDate()-1);
              const yk=`${yesterday.getFullYear()}-${yesterday.getMonth()+1}-${yesterday.getDate()}`;
              lsSet("last_played",yk);
              lsSet("restore_offered",false);setRestoreOffered(false);
              lsSet("decay_start","");setDecayStart("");
              setCareerMode("restore");
            }},
            {label:"📉 Decay",fn:()=>{
              const decayed = Math.max(0, streak-1);
              lsSet("streak",decayed);setStreak(decayed);
              lsSet("restore_offered",true);setRestoreOffered(true);
              lsSet("decay_start",todayKey);setDecayStart(todayKey);
              lsSet("last_decay_applied","");setLastDecayApplied("");
              setCareerMode(decayed > 0 ? "decay" : "normal");
            }},
            {label:"🗑 Reset",fn:resetDemo,danger:true},
          ].map((b,i)=>(
            <button key={i} onClick={b.fn} style={{flex:1,padding:"6px",background:"transparent",border:`1px dashed ${b.danger?"rgba(220,38,38,0.25)":"rgba(255,255,255,0.08)"}`,borderRadius:7,color:b.danger?"rgba(220,38,38,0.4)":"rgba(255,255,255,0.2)",fontSize:9,letterSpacing:1,cursor:"pointer",fontFamily:"'Inter',sans-serif",textTransform:"uppercase"}}>{b.label}</button>
          ))}
        </div>

        {/* ── FOOTER ── */}
        <AdBanner slotId="home"/>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:16,marginTop:4,paddingTop:12,borderTop:"1px solid rgba(255,255,255,0.06)"}}>
          <button onClick={()=>setScreen("terms")} style={{background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.25)",fontSize:10,fontFamily:"'Inter',sans-serif",letterSpacing:0.5}}>Terms & Privacy</button>
          <span style={{color:"rgba(255,255,255,0.1)",fontSize:10}}>·</span>
          <a href="mailto:statstreaks@gmail.com" style={{color:"rgba(255,255,255,0.25)",fontSize:10,fontFamily:"'Inter',sans-serif",textDecoration:"none",letterSpacing:0.5}}>Contact Us</a>
          <span style={{color:"rgba(255,255,255,0.1)",fontSize:10}}>·</span>
          <span style={{color:"rgba(255,255,255,0.15)",fontSize:10,fontFamily:"'Inter',sans-serif"}}>v0.1 beta</span>
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
            {/* FULL TIME header */}
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12,padding:"10px 14px",background:"rgba(255,255,255,0.04)",borderRadius:10,border:"1px solid rgba(255,255,255,0.08)"}}>
              <div style={{fontSize:18,lineHeight:1}}>⚽</div>
              <div>
                <div style={{fontSize:11,fontWeight:900,color:"rgba(255,255,255,0.9)",fontFamily:"'Oswald',sans-serif",letterSpacing:2,textTransform:"uppercase",lineHeight:1}}>{win?"Full Time — Cap Secured":"Full Time"}</div>
                <div style={{fontSize:11,color:"rgba(255,255,255,0.4)",fontFamily:"'Inter',sans-serif",marginTop:2}}>{win?"Your international career rolls on.":"Back tomorrow for the next fixture."}</div>
              </div>
            </div>

            {/* 1. SCORE CARD */}
            <div style={{background:"linear-gradient(160deg,#1a2535 0%,#0f1923 100%)",borderRadius:18,overflow:"hidden",marginBottom:12,boxShadow:"0 6px 28px rgba(0,0,0,0.35)",border:`1px solid ${accentCol}25`,position:"relative"}}>
              <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(255,255,255,0.012) 16px,rgba(255,255,255,0.012) 17px)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"50%",background:`radial-gradient(ellipse at 50% 0%, ${accentCol}15 0%, transparent 80%)`,pointerEvents:"none"}}/>
              <div style={{height:3,background:`linear-gradient(90deg,${accentCol},${accentCol}44)`,position:"relative"}}/>
              <div style={{padding:"18px 18px 16px",position:"relative"}}>

                {/* Score row — big number left, roast message right */}
                <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:14,gap:12}}>
                  <div style={{flexShrink:0}}>
                    <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:2,fontWeight:600,marginBottom:2,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>Match Score</div>
                    <div style={{display:"flex",alignItems:"baseline",gap:3}}>
                      <span style={{fontSize:64,fontWeight:900,color:accentCol,lineHeight:0.9,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,textShadow:`0 0 30px ${accentCol}44`}}>{latestScore}</span>
                      <span style={{fontSize:18,color:"rgba(255,255,255,0.2)",fontWeight:600,fontFamily:"'Inter',sans-serif",marginBottom:4}}>/10</span>
                    </div>
                    <div style={{fontSize:11,color:(latestScore||0)>4.2?"#06b6d4":"rgba(255,255,255,0.3)",fontWeight:600,marginTop:3,fontFamily:"'Inter',sans-serif"}}>{(latestScore||0)>4.2?"↑ Above avg":"↓ Below avg"} · avg 4.2</div>
                  </div>
                  {latestScore>0&&(()=>{
                    const msg=getScoreMessage(latestScore);
                    return msg?<div style={{flex:1,paddingTop:4,textAlign:"right"}}>
                      <div style={{color:accentCol,fontWeight:700,fontSize:12,lineHeight:1.45,fontFamily:"'Inter',sans-serif",fontStyle:"italic",opacity:0.85}}>{msg}</div>
                    </div>:null;
                  })()}
                </div>

                {/* Answer dots */}
                {answerLog.length>0&&(
                  <div style={{marginBottom:14}}>
                    <DailyResultDots resultData={answerLog}/>
                  </div>
                )}

                {/* Share button — cyan, full width */}
                <button onClick={()=>{
                  const s=latestScore||0;
                  const emojiGrid=answerLog.map(r=>r==="correct"?"🟩":r==="yellow"?"🟨":"🟥").join("");
                  const t=`StatStreaks #${effectiveDayIdx+1} ⚽\n${emojiGrid}\n${s}/10 🧢 ${streak}`;
                  try{navigator.clipboard.writeText(t);}catch{}alert("Copied!");
                }} style={{width:"100%",padding:"13px",background:"linear-gradient(135deg,#0e7490,#0891b2,#06b6d4)",border:"none",borderRadius:12,color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:8,marginBottom:8,boxShadow:"0 4px 16px rgba(6,182,212,0.35), inset 0 1px 0 rgba(255,255,255,0.15)"}}>
                  ↗ Share Your Score
                </button>

                {/* Training Pitch CTA — full width, same border-radius */}
                <button onClick={()=>{SFX.click();setScreen("rush");}} style={{
                  width:"100%",padding:"13px 16px",
                  background:"linear-gradient(135deg,#9d174d,#be185d,#db2777,#ec4899)",
                  border:"none",borderRadius:12,cursor:"pointer",
                  fontFamily:"'Inter',sans-serif",
                  boxShadow:"0 4px 16px rgba(190,24,93,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",
                  textAlign:"left",display:"block",
                  transition:"transform 0.15s, box-shadow 0.15s",
                }}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 10px 28px rgba(190,24,93,0.65), inset 0 1px 0 rgba(255,255,255,0.3)";}}
                onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(190,24,93,0.45), inset 0 1px 0 rgba(255,255,255,0.2)";}}>
                  <div style={{fontSize:14,fontWeight:800,color:"#ffffff",marginBottom:2}}>⚡ Hit the Training Pitch</div>
                  <div style={{fontSize:11,color:"rgba(255,255,255,0.65)",fontWeight:500}}>Next fixture: {tomorrowTheme}</div>
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
            <AdBanner slotId="daily-result"/>
            <button onClick={()=>{SFX.click();setScreen("home");}} style={{width:"100%",padding:"12px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:12,color:"rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",marginTop:4}}>← Home</button>
          </>
        )}

        {/* ── TRAINING PITCH RESULT ── */}
        {!isDaily&&(()=>{
          const isPerfect = timeout && continueCount===0;
          const displayScore = latestScore||score;
          const leaderboardScore = continueCount>0 ? cleanScore : displayScore;
          const isNewBest = displayScore > prevCatBest;
          const shownBest = isNewBest ? displayScore : prevCatBest;
          const toughSession = displayScore < 4;
          const msg = toughSession
            ? "Tough session. Shake it off and go again."
            : getRushMessage(displayScore, prevCatBest);
          // Session complete subtext — driven by whether rewarded was used
          const sessionSubtext = continueCount > 0
            ? "Good recovery to finish strong."
            : "Solid work on the training pitch.";
          return(
          <>
            {/* ── SCORE CARD ── */}
            <div style={{background:"linear-gradient(160deg,#1a2535,#0f1923)",borderRadius:18,overflow:"hidden",marginBottom:10,boxShadow:"0 6px 28px rgba(0,0,0,0.4)",border:`1px solid ${isPerfect?"rgba(245,158,11,0.35)":"rgba(217,119,6,0.18)"}`,position:"relative"}}>
              <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 16px,rgba(255,255,255,0.01) 16px,rgba(255,255,255,0.01) 17px)",pointerEvents:"none"}}/>
              <div style={{position:"absolute",top:0,left:0,right:0,height:"55%",background:`radial-gradient(ellipse at 50% 0%, ${isPerfect?"rgba(245,158,11,0.18)":"rgba(217,119,6,0.1)"} 0%, transparent 75%)`,pointerEvents:"none"}}/>
              <div style={{height:3,background:isPerfect?"linear-gradient(90deg,#d97706,#f59e0b,#fbbf24)":"linear-gradient(90deg,#d97706,#d9770633)",position:"relative"}}/>

              {/* Session complete header */}
              <div style={{padding:"14px 18px 0",position:"relative"}}>
                <div style={{fontSize:9,color:"rgba(255,255,255,0.35)",letterSpacing:3,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:2}}>🏟️ Session Complete</div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)",fontFamily:"'Inter',sans-serif",fontWeight:500}}>{sessionSubtext}</div>
              </div>

              {/* ── SCORES ROW ── */}
              <div style={{display:"flex",padding:"20px 18px 0",gap:0,position:"relative"}}>
                {/* Score — cyan if beat avg, amber if not, gold if perfect */}
                {(()=>{
                  const scoreCol = isPerfect ? "#fbbf24" : displayScore>=(activeCatData?.globalAvg||0) ? "#06b6d4" : "#f97316";
                  const scoreGlow = isPerfect ? "rgba(251,191,36,0.5)" : displayScore>=(activeCatData?.globalAvg||0) ? "rgba(6,182,212,0.4)" : "rgba(249,115,22,0.35)";
                  return(
                    <div style={{flex:1,textAlign:"center",paddingRight:12}}>
                      <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:2.5,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:4}}>{isPerfect?"Score ×2":"Score"}</div>
                      <div style={{fontSize:72,fontWeight:900,color:scoreCol,lineHeight:0.9,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:-1,textShadow:`0 0 40px ${scoreGlow}`}}>{displayScore}</div>
                      {isPerfect&&<div style={{fontSize:10,color:"rgba(255,255,255,0.35)",marginTop:4,fontFamily:"'Inter',sans-serif"}}>({rawCorrect} × 2)</div>}
                    </div>
                  );
                })()}
                {/* Divider */}
                <div style={{width:1,background:"rgba(255,255,255,0.07)",margin:"4px 0 0",alignSelf:"stretch"}}/>
                {/* Personal Best */}
                <div style={{flex:1,textAlign:"center",paddingLeft:12}}>
                  <div style={{fontSize:8,color:"rgba(255,255,255,0.3)",letterSpacing:2.5,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:4}}>Personal Best</div>
                  <div style={{fontSize:72,fontWeight:900,
                    color:isNewBest?"#06b6d4":prevCatBest>0?"#d97706":"rgba(255,255,255,0.2)",
                    lineHeight:0.9,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:-1,
                    textShadow:isNewBest?"0 0 40px rgba(6,182,212,0.45)":prevCatBest>0?"0 0 30px rgba(217,119,6,0.35)":"none"
                  }}>{shownBest||displayScore}</div>
                  {isNewBest
                    ? <div style={{fontSize:10,color:"#06b6d4",marginTop:4,fontWeight:800,fontFamily:"'Inter',sans-serif",letterSpacing:0.3}}>✦ New best!</div>
                    : prevCatBest>0&&displayScore===prevCatBest
                      ? <div style={{fontSize:10,color:"#d97706",marginTop:4,fontWeight:700,fontFamily:"'Inter',sans-serif"}}>Matched ✓</div>
                      : prevCatBest>0
                        ? <div style={{fontSize:10,color:"rgba(255,255,255,0.3)",marginTop:4,fontFamily:"'Inter',sans-serif"}}>{prevCatBest-displayScore} off best</div>
                        : <div style={{fontSize:10,color:"rgba(255,255,255,0.25)",marginTop:4,fontFamily:"'Inter',sans-serif"}}>First run!</div>
                  }
                </div>
              </div>

              {/* ── MESSAGE + AVG BAND ── */}
              {(()=>{
                const beatAvg = activeCatData && displayScore > activeCatData.globalAvg;
                const avgCol = beatAvg ? "#06b6d4" : "#f97316";
                const avgGlow = beatAvg ? "rgba(6,182,212,0.3)" : "rgba(249,115,22,0.25)";
                const bandBg = beatAvg ? "rgba(6,182,212,0.06)" : "rgba(249,115,22,0.06)";
                const bandBorder = beatAvg ? "rgba(6,182,212,0.15)" : "rgba(249,115,22,0.15)";
                return(
                  <div style={{margin:"14px 18px 18px",background:bandBg,border:`1px solid ${bandBorder}`,borderRadius:10,padding:"11px 14px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
                    <div style={{color:"rgba(255,255,255,0.75)",fontSize:12,fontStyle:"italic",fontFamily:"'Inter',sans-serif",lineHeight:1.4,flex:1,fontWeight:500}}>{msg}</div>
                    {activeCatData&&(
                      <div style={{flexShrink:0,textAlign:"center",borderLeft:`1px solid ${bandBorder}`,paddingLeft:12}}>
                        <div style={{fontSize:7.5,color:avgCol,opacity:0.7,letterSpacing:1.5,fontWeight:700,textTransform:"uppercase",fontFamily:"'Inter',sans-serif",marginBottom:1}}>Cat. avg</div>
                        <div style={{fontSize:24,fontWeight:900,color:avgCol,fontFamily:"'Bebas Neue',sans-serif",lineHeight:1,textShadow:`0 0 16px ${avgGlow}`}}>{activeCatData.globalAvg}</div>
                        <div style={{fontSize:8,color:avgCol,fontWeight:700,fontFamily:"'Inter',sans-serif",marginTop:1,opacity:0.8}}>{beatAvg?"↑ above":"↓ below"}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* ── BUTTONS — outside card ── */}
            <AdBanner slotId="rush-result"/>
            <button onClick={()=>{SFX.click();launchRush(rushCat);}} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#9d174d,#be185d,#db2777)",border:"none",borderRadius:12,color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:15,fontWeight:900,cursor:"pointer",boxShadow:"0 4px 16px rgba(190,24,93,0.45), inset 0 1px 0 rgba(255,255,255,0.2)",marginBottom:8,display:"flex",alignItems:"center",justifyContent:"center",gap:8,letterSpacing:0.3}}>⚡ Back on the Training Pitch</button>
            <div style={{display:"flex",gap:8,marginBottom:0}}>
              <button onClick={()=>{
                const perfTag=isPerfect?" 🔥 PERFECT RUN (2×)":"";
                const t=`StatStreaks Training Pitch\n${theme}\nScore: ${displayScore}${perfTag} — can you beat me?`;
                try{navigator.clipboard.writeText(t);}catch{}alert("Copied!");
              }} style={{flex:1,padding:"12px",background:"linear-gradient(135deg,#2563eb,#3b82f6)",border:"none",borderRadius:12,color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6,boxShadow:"0 4px 12px rgba(37,99,235,0.35)"}}>
                ↗ Share
              </button>
              <button onClick={()=>{SFX.click();setPrevScreen("rush");setScreen("leaderboard");}} style={{
                flex:1,padding:"12px",borderRadius:12,border:"none",cursor:"pointer",
                background:"linear-gradient(135deg,#92400e,#b45309,#d97706)",
                color:"#ffffff",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:700,
                boxShadow:"0 4px 14px rgba(217,119,6,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
                display:"flex",alignItems:"center",justifyContent:"center",gap:6,
              }}>🏆 Leaderboards</button>
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
      {showInterstitial&&<InterstitialOverlay onDismiss={()=>{setShowInterstitial(false);setScreen("result");}}/>}
      {/* 3-2-1 countdown overlay */}
      {countdown!==null&&(
        <div style={{position:"fixed",inset:0,background:"rgba(15,25,35,0.92)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",zIndex:200,backdropFilter:"blur(4px)"}}>
          {isRush&&<div style={{fontSize:9,color:"rgba(255,255,255,0.5)",letterSpacing:4,fontWeight:600,textTransform:"uppercase",marginBottom:16,fontFamily:"'Inter',sans-serif"}}>Training Pitch</div>}
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
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <button onClick={()=>{SFX.click();setTimerActive(false);setCountdown(null);setScreen(isRush?"rush":"home");}}
            style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.12)",borderRadius:8,color:"rgba(255,255,255,0.6)",fontSize:11,cursor:"pointer",padding:"7px 11px",fontFamily:"'Inter',sans-serif",fontWeight:600}}>
            ← {isRush?"Pitch":"Home"}
          </button>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:12,fontWeight:700,color:"rgba(255,255,255,0.9)",fontFamily:"'Inter',sans-serif"}}>{isRush?(activeCat?activeCat.label:"Training Pitch"):theme}</div>
            <div style={{fontSize:9,color:isRush?"#fbbf24":"rgba(255,255,255,0)",letterSpacing:2,fontWeight:600,textTransform:"uppercase",fontFamily:"'Inter',sans-serif"}}>{isRush?"Training Pitch":""}</div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
            {/* Score badge */}
            <div style={{background:"rgba(255,255,255,0.95)",borderRadius:8,padding:"4px 11px",display:"flex",alignItems:"center",gap:5,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>
              <span style={{color:"#0891b2",fontWeight:900,fontSize:14,fontFamily:"'Oswald',sans-serif",letterSpacing:1,lineHeight:1}}>{score}</span>
              <span style={{color:"#06b6d4",fontSize:11,lineHeight:1}}>✓</span>
            </div>
            {/* Timer or save indicator */}
            {isRush
              ? <div style={{color:timeLeft<=8?"#ef4444":timeLeft<=15?"#f59e0b":"rgba(255,255,255,0.7)",fontWeight:900,fontSize:20,fontFamily:"'Oswald',sans-serif",animation:timeLeft<=8?"timerPulse 0.6s infinite":"none",lineHeight:1}}>{timeLeft}s</div>
              : <div style={{fontSize:9,color:yellowUsed?"rgba(220,38,38,0.6)":"rgba(255,255,255,0.3)",letterSpacing:0.5,fontFamily:"'Inter',sans-serif"}}>{yellowUsed?"🟥 no reprieve left":"🟨 one chance saved"}</div>
            }
            {isRush&&(()=>{
              const catBest=lsGet(`rush_best_${rushCat}`,0);
              if(catBest>0) return <div style={{fontSize:9,color:"rgba(255,255,255,0.3)",fontFamily:"'Inter',sans-serif",letterSpacing:0.5}}>Best: {catBest}</div>;
              return null;
            })()}
          </div>
        </div>

        {/* ── TIMER BAR (rush) / PROGRESS DOTS (daily) ── */}
        {isRush
          ? <div style={{width:"100%",height:5,background:"rgba(255,255,255,0.1)",borderRadius:99,overflow:"hidden",marginBottom:14}}>
              <div style={{height:"100%",width:`${(timeLeft/TOTAL_TIME)*100}%`,background:timeLeft<=8?"#ef4444":timeLeft<=15?"#f59e0b":"#06b6d4",borderRadius:99,transition:"width 0.9s linear,background 0.5s"}}/>
            </div>
          : <ProgressDots current={currentIdx} result={result} yellowCardIdx={yellowCardIdx} declinedYellow={declinedYellow}/>
        }

        {/* ── QUESTION CARD ── */}
        {currentCard&&nextCard&&(
          <div style={{background:"linear-gradient(160deg,rgba(255,255,255,0.09),rgba(255,255,255,0.05))",borderRadius:12,padding:"10px 14px",marginBottom:12,textAlign:"center",border:"1px solid rgba(255,255,255,0.1)",position:"relative",overflow:"hidden",backdropFilter:"blur(4px)"}}>
            <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 14px,rgba(255,255,255,0.015) 14px,rgba(255,255,255,0.015) 15px)",pointerEvents:"none"}}/>
            <div style={{fontSize:8,color:"rgba(255,255,255,0.35)",letterSpacing:3,fontWeight:700,marginBottom:5,textTransform:"uppercase",position:"relative"}}>Compare the {nextCard.statType}</div>
            <div style={{fontSize:13,lineHeight:1.7,color:"rgba(255,255,255,0.75)",position:"relative"}}>
              Will <strong style={{color:"#ffffff",fontFamily:"'Oswald',sans-serif",fontSize:15,fontWeight:700}}>{nextCard.player}</strong> be <strong style={{color:"#06b6d4"}}>HIGHER</strong> or <strong style={{color:"#ec4899"}}>LOWER</strong> than <strong style={{color:"#fbbf24",fontFamily:"'Oswald',sans-serif",fontSize:17}}>{currentCard.stat}</strong>?
            </div>
          </div>
        )}

        {/* ── STAT PANELS ── */}
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12,justifyContent:"center"}}>
          {currentCard&&<StatPanel card={currentCard} revealed={true} flashResult={null} catId={isRush?rushCat:theme}/>}
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,flexShrink:0}}>
            <div style={{width:1,height:20,background:"rgba(255,255,255,0.1)"}}/>
            <div style={{width:34,height:34,borderRadius:10,background:"linear-gradient(135deg,rgba(255,255,255,0.12),rgba(255,255,255,0.06))",border:"1px solid rgba(255,255,255,0.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"rgba(255,255,255,0.7)",fontWeight:900,fontFamily:"'Oswald',sans-serif",letterSpacing:1,boxShadow:"0 2px 8px rgba(0,0,0,0.2)"}}>VS</div>
            <div style={{width:1,height:20,background:"rgba(255,255,255,0.1)"}}/>
          </div>
          {nextCard&&<StatPanel card={nextCard} revealed={revealedNext} flashResult={revealedNext?flashResult:null} catId={isRush?rushCat:theme}/>}
        </div>

        {/* ── BUTTONS / FEEDBACK ── */}
        {result===null||result==="yellow"?(
          result==="yellow"?(
            <div style={{background:"linear-gradient(135deg,#fffbeb,#fef3c7)",border:"1px solid #fde68a",borderRadius:12,padding:"14px",textAlign:"center",boxShadow:"0 4px 16px rgba(217,119,6,0.2), inset 0 1px 0 rgba(255,255,255,0.8)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 12px,rgba(217,119,6,0.04) 12px,rgba(217,119,6,0.04) 13px)",pointerEvents:"none"}}/>
              <div style={{fontSize:20,fontWeight:900,color:"#92400e",fontFamily:"'Oswald',sans-serif",letterSpacing:1,position:"relative"}}>🟨 Yellow Card</div>
              <div style={{color:"#92400e",fontSize:12,marginTop:4,opacity:0.7,position:"relative"}}>Manager's watching...</div>
            </div>
          ):(
            <div style={{display:"flex",gap:10,width:"100%"}}>
              <button onClick={()=>handleGuess("higher")}
                style={{flex:1,padding:"16px 8px",background:"linear-gradient(135deg,#0e7490,#0891b2,#06b6d4)",border:"none",borderRadius:12,color:"#ffffff",fontSize:18,fontWeight:900,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",transition:"transform 0.12s,box-shadow 0.12s",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 16px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",position:"relative",overflow:"hidden"}}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(6,182,212,0.55)";}}
                onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(6,182,212,0.4), inset 0 1px 0 rgba(255,255,255,0.2)";}}>
                <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 12px,rgba(255,255,255,0.05) 12px,rgba(255,255,255,0.05) 13px)",pointerEvents:"none"}}/>
                <span style={{position:"relative"}}>⬆ Higher</span>
              </button>
              <button onClick={()=>handleGuess("lower")}
                style={{flex:1,padding:"16px 8px",background:"linear-gradient(135deg,#9d174d,#be185d,#ec4899)",border:"none",borderRadius:12,color:"#ffffff",fontSize:18,fontWeight:900,letterSpacing:1,textTransform:"uppercase",cursor:"pointer",transition:"transform 0.12s,box-shadow 0.12s",fontFamily:"'Inter',sans-serif",boxShadow:"0 4px 16px rgba(236,72,153,0.4), inset 0 1px 0 rgba(255,255,255,0.2)",position:"relative",overflow:"hidden"}}
                onMouseOver={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(236,72,153,0.55)";}}
                onMouseOut={e=>{e.currentTarget.style.transform="";e.currentTarget.style.boxShadow="0 4px 16px rgba(236,72,153,0.4), inset 0 1px 0 rgba(255,255,255,0.2)";}}>
                <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 12px,rgba(255,255,255,0.05) 12px,rgba(255,255,255,0.05) 13px)",pointerEvents:"none"}}/>
                <span style={{position:"relative"}}>⬇ Lower</span>
              </button>
            </div>
          )
        ):(
          result==="correct"?(
            <div style={{background:"linear-gradient(135deg,#ecfeff,#cffafe)",border:"1px solid #67e8f9",borderRadius:12,padding:"14px",textAlign:"center",boxShadow:"0 4px 16px rgba(6,182,212,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",position:"relative",overflow:"hidden"}}>
              <div style={{position:"absolute",inset:0,backgroundImage:"repeating-linear-gradient(135deg,transparent,transparent 12px,rgba(6,182,212,0.04) 12px,rgba(6,182,212,0.04) 13px)",pointerEvents:"none"}}/>
              <div style={{fontFamily:"'Oswald',sans-serif",fontSize:22,fontWeight:700,color:"#0891b2",letterSpacing:1,position:"relative"}}>✓ Correct!</div>
              <div style={{color:"#64748b",fontSize:12,marginTop:3,position:"relative"}}>{isRush?"Keep the run alive.":"Keep going!"}</div>
            </div>
          ):(
            isRush?(
              <div style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:12,padding:"12px",textAlign:"center"}}>
                <div style={{color:"rgba(255,255,255,0.5)",fontSize:13,fontFamily:"'Inter',sans-serif",fontWeight:600,fontStyle:"italic"}}>Loose touch — go again</div>
              </div>
            ):(!isRush?(
            <div style={{position:"fixed",inset:0,background:"rgba(10,18,28,0.94)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:50,padding:"0 20px",backdropFilter:"blur(8px)"}}>
              <div style={{background:"linear-gradient(160deg,#1a2535,#0f1923)",border:"1px solid rgba(220,38,38,0.2)",borderRadius:20,padding:"28px 24px",maxWidth:300,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(220,38,38,0.06)"}}>
                {/* Red card graphic */}
                <div style={{position:"relative",width:56,height:72,margin:"0 auto 18px"}}>
                  <div style={{width:56,height:72,background:"linear-gradient(150deg,#fca5a5,#ef4444,#dc2626)",borderRadius:9,boxShadow:"0 8px 32px rgba(220,38,38,0.55), 0 2px 0 rgba(255,255,255,0.2) inset",position:"relative"}}>
                    <div style={{position:"absolute",inset:0,background:"repeating-linear-gradient(135deg,transparent,transparent 8px,rgba(255,255,255,0.05) 8px,rgba(255,255,255,0.05) 9px)",borderRadius:9}}/>
                    <div style={{position:"absolute",top:6,left:6,right:6,bottom:6,border:"1.5px solid rgba(255,255,255,0.2)",borderRadius:5}}/>
                  </div>
                  <div style={{position:"absolute",inset:"-8px",background:"radial-gradient(ellipse at 50% 60%,rgba(220,38,38,0.3) 0%,transparent 70%)",borderRadius:20,pointerEvents:"none"}}/>
                </div>
                <div style={{color:"#f87171",fontWeight:900,fontSize:22,letterSpacing:2,marginBottom:6,fontFamily:"'Oswald',sans-serif",textTransform:"uppercase",textShadow:"0 0 20px rgba(248,113,113,0.4)"}}>🟥 Red Card</div>
                <div style={{color:"rgba(255,255,255,0.85)",fontSize:14,marginBottom:4,lineHeight:1.5,fontWeight:700,fontFamily:"'Inter',sans-serif"}}>Early bath.</div>
                <div style={{color:"rgba(255,255,255,0.45)",fontSize:12,marginBottom:6,lineHeight:1.6,fontFamily:"'Inter',sans-serif"}}>Back tomorrow for the next fixture. Or hit the training pitch to sharpen up.</div>
                <div style={{color:"rgba(255,255,255,0.2)",fontSize:11,fontFamily:"'Inter',sans-serif"}}>Taking you to results...</div>
              </div>
            </div>
            ):null)
          )
        )}
      </div>
    </PageWrap>
  );
}