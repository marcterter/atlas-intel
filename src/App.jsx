import { useState, useEffect, useCallback, useRef } from "react";

// ─── PORTFOLIO DATA (from screenshots March 16, 16:40) ────────────────────────
const PORTFOLIO_DATA = {
  vnl: 37405,
  pnlJour: 765,
  pnlJourPct: 2.09,
  pnlNonRealise: -593,
  pnlRealise: -50,
  valMarche: 34315.82,
  cashEUR: 3093.81,
  cashUSD: 0,
  positions: [
    { ticker:"NBIS", qty:10, prix:127.73, pru:90.10, valeur:1279, pnlJour:146.90, pnlJourPct:13.09, pnlNnRlsePct:41.9, pnlNnRlse:377.95 },
    { ticker:"TSEM", qty:7, prix:139.46, pru:138.11, valeur:976, pnlJour:9.39, pnlJourPct:11.83, pnlNnRlsePct:0.97, pnlNnRlse:9.35 },
    { ticker:"MU", qty:9, prix:447.20, pru:421.90, valeur:4026, pnlJour:118.62, pnlJourPct:4.94, pnlNnRlsePct:6.03, pnlNnRlse:228.81 },
    { ticker:"LITE", qty:6, prix:652.00, pru:656.39, valeur:3909, pnlJour:119.74, pnlJourPct:4.74, pnlNnRlsePct:-0.76, pnlNnRlse:-29.79 },
    { ticker:"ENR", qty:7, prix:149.15, pru:159.63, valeur:1046, pnlJour:32.30, pnlJourPct:3.61, pnlNnRlsePct:-6.41, pnlNnRlse:-71.60 },
    { ticker:"RKLB", qty:43, prix:70.81, pru:73.79, valeur:3044, pnlJour:103.20, pnlJourPct:3.51, pnlNnRlsePct:-4.06, pnlNnRlse:-128.69 },
    { ticker:"ATI", qty:5, prix:146.88, pru:121.28, valeur:735, pnlJour:25.05, pnlJourPct:3.46, pnlNnRlsePct:21.2, pnlNnRlse:128.50 },
    { ticker:"FN", qty:2, prix:518.01, pru:518.04, valeur:1038, pnlJour:0.36, pnlJourPct:3.16, pnlNnRlsePct:0.15, pnlNnRlse:1.54 },
    { ticker:"META", qty:3.5, prix:629.06, pru:628.52, valeur:2201, pnlJour:55.70, pnlJourPct:2.59, pnlNnRlsePct:0.57, pnlNnRlse:12.54 },
    { ticker:"NVDA", qty:15, prix:184.73, pru:186.01, valeur:2771, pnlJour:67.20, pnlJourPct:2.49, pnlNnRlsePct:-0.68, pnlNnRlse:-18.96 },
    { ticker:"GEV", qty:1, prix:820.90, pru:822.36, valeur:821, pnlJour:15.78, pnlJourPct:1.97, pnlNnRlsePct:-0.21, pnlNnRlse:-1.71 },
    { ticker:"CCJ", qty:16.5, prix:109.81, pru:118.50, valeur:1812, pnlJour:20.46, pnlJourPct:1.75, pnlNnRlsePct:-7.32, pnlNnRlse:-143.03 },
    { ticker:"FCX", qty:35, prix:57.34, pru:63.48, valeur:2007, pnlJour:33.94, pnlJourPct:1.70, pnlNnRlsePct:-9.73, pnlNnRlse:-216.17 },
    { ticker:"TSM", qty:7, prix:342.66, pru:327.10, valeur:2399, pnlJour:30.31, pnlJourPct:1.29, pnlNnRlsePct:4.75, pnlNnRlse:109.09 },
    { ticker:"USAR", qty:36, prix:19.69, pru:22.31, valeur:710, pnlJour:8.28, pnlJourPct:1.18, pnlNnRlsePct:-11.6, pnlNnRlse:-93.41 },
    { ticker:"PLTR", qty:7.5, prix:152.28, pru:175.06, valeur:1143, pnlJour:10.04, pnlJourPct:0.88, pnlNnRlsePct:-13.0, pnlNnRlse:-170.86 },
    { ticker:"CEG", qty:5, prix:304.42, pru:302.27, valeur:1521, pnlJour:6.54, pnlJourPct:0.88, pnlNnRlsePct:0.61, pnlNnRlse:9.24 },
    { ticker:"AMZN", qty:19, prix:209.53, pru:227.37, valeur:3981, pnlJour:45.22, pnlJourPct:0.89, pnlNnRlsePct:-7.86, pnlNnRlse:-339.38 },
    { ticker:"MSFT", qty:4, prix:398.29, pru:430.94, valeur:1593, pnlJour:8.36, pnlJourPct:0.69, pnlNnRlsePct:-7.58, pnlNnRlse:-130.59 },
    { ticker:"GOOG", qty:7, prix:302.99, pru:319.01, valeur:2121, pnlJour:23.52, pnlJourPct:0.51, pnlNnRlsePct:-5.03, pnlNnRlse:-112.43 },
    { ticker:"SMR", qty:15, prix:11.78, pru:16.90, valeur:177, pnlJour:-0.38, pnlJourPct:-0.34, pnlNnRlsePct:-30.4, pnlNnRlse:-76.96 },
  ]
};

const STOCKS_DB = [
  { id:"FN", ticker:"FN", name:"Fabrinet", sector:"IA Optique", currency:"$", verdict:"FORT ACHAT", stars:5, price:518, target12m:635, target3y:900, entryT1:"530–545", entryT2:"480–495", entryT3:"430–450", upside:"+22%", pe:52, peg:1.6, ps:4.6, revGrowth:"+35%", ebitda:"10.9%", nextEarnings:"11 mai 2026", mktCap:"19.5Mds$", beta:1.03, moat:"Sole-source 100% transceivers 1.6T Nvidia Blackwell", risk:"Concentration Nvidia 28%", note:"EMS optique pur. Zéro dette, ~1Mds$ cash, ROE 18%. Building 10 double la capacité 2026. Sandbagging pattern.", consensus:"Northland 600$, Susquehanna 570$, Barclays 548$, JPM 530$", catalysts:"OFC 17 mars · Earnings 11 mai · Building 10 2026", inPerso:true, inHolding:true, lastUpdated:"16 mars 2026", urgency:false },
  { id:"TSEM", ticker:"TSEM", name:"Tower Semiconductor", sector:"IA Optique", currency:"$", verdict:"FORT ACHAT", stars:5, price:139, target12m:180, target3y:270, entryT1:"115–130", entryT2:"98–110", entryT3:"82–92", upside:"+30%", pe:43, peg:1.4, ps:6.2, revGrowth:"+115% SiPho", ebitda:"28%", nextEarnings:"Avril 2026", mktCap:"5.8Mds$", beta:1.8, moat:"Foundry SiPho spécialisée, deal Nvidia 1.6T + LWLG", risk:"Exécution CapEx x5", note:"Foundry Silicon Photonique pure-play. Capacité x5 fin 2026. OFC booth #2221.", consensus:"Buy — cibles 160–200$", catalysts:"OFC 16-19 mars · Nvidia deal · LWLG tapeouts mi-2026", inPerso:true, inHolding:true, lastUpdated:"16 mars 2026", urgency:false },
  { id:"NBIS", ticker:"NBIS", name:"Nebius Group", sector:"Cloud IA", currency:"$", verdict:"TOP CONVICTION", stars:5, price:127, target12m:210, target3y:340, entryT1:"105–125", entryT2:"90–100", entryT3:"75–85", upside:"+65%", pe:null, peg:null, ps:14, revGrowth:"+479% YoY", ebitda:"N/A", nextEarnings:"29 avril 2026", mktCap:"31Mds$", beta:2.1, moat:"Infrastructure GPU full-stack, validation Nvidia 2Mds$", risk:"Scale-up execution risk", note:"Neocloud IA. Q4 +547% YoY. Nvidia investit 2Mds$. Campus Missouri 1.2GW approuvé. ARR 1.25Mds$.", consensus:"Strong Buy — Northland 232$, consensus 151$", catalysts:"Nvidia 2Mds$ deal · Campus Missouri · Earnings 29 avril", inPerso:true, inHolding:true, lastUpdated:"16 mars 2026", urgency:false },
  { id:"MELI", ticker:"MELI", name:"MercadoLibre", sector:"E-commerce/Fintech", currency:"$", verdict:"ACHAT", stars:4, price:1680, target12m:2600, target3y:3500, entryT1:"1600–1720", entryT2:"1400–1500", entryT3:"1200–1300", upside:"+55%", pe:42.5, peg:0.8, ps:3.0, revGrowth:"+39%", ebitda:"18%", nextEarnings:"7 mai 2026", mktCap:"85Mds$", beta:1.53, moat:"5 couches : réseau, logistique, fintech data, marque, flywheel", risk:"Compression marges + risque devise", note:"Amazon+PayPal LatAm. 700M personnes. ROE 40%. 3x PS. Pénétration e-com 15%.", consensus:"Strong Buy — 23/0, cible 2805$", catalysts:"Earnings 7 mai · Mercado Pago expansion · Nearshoring", inPerso:false, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"ZETA", ticker:"ZETA", name:"Zeta Global", sector:"MarTech IA", currency:"$", verdict:"ACHAT", stars:4, price:17, target12m:29, target3y:44, entryT1:"16–18", entryT2:"13–15", entryT3:"10–12", upside:"+71%", pe:27, peg:0.75, ps:3.3, revGrowth:"+35%", ebitda:"22%", nextEarnings:"12 mai 2026", mktCap:"5.7Mds$", beta:2.2, moat:"SuperGraph 245M profils, NRR 120%, OpenAI Athena", risk:"Usage-based revenue volatil", note:"18 trimestres beat & raise. Guidance 2026 relevée 1.755Mds$. Adyen remplacé dans holding.", consensus:"Strong Buy — consensus 29.40$", catalysts:"Athena GA Q1 · Earnings 12 mai · ZetaLive 100M$", inPerso:false, inHolding:true, lastUpdated:"16 mars 2026", urgency:false },
  { id:"LITE", ticker:"LITE", name:"Lumentum", sector:"IA Optique", currency:"$", verdict:"ACHAT", stars:4, price:652, target12m:800, target3y:1050, entryT1:"580–650", entryT2:"520–565", entryT3:"460–510", upside:"+23%", pe:45, peg:1.8, ps:4.2, revGrowth:"+22%", ebitda:"15%", nextEarnings:"Mai 2026", mktCap:"8.2Mds$", beta:1.65, moat:"IP propriétaire lasers + composants optiques haute perf", risk:"PRU 656$ — légèrement sous l'eau", note:"Leader composants photoniques. OFC catalyseur. PRU 656.39$, légèrement en négatif (-0.76%).", consensus:"Buy — cibles 720–850$", catalysts:"OFC 16-19 mars · 800G/1.6T ramp · Earnings mai", inPerso:true, inHolding:true, lastUpdated:"16 mars 2026", urgency:false },
  { id:"MU", ticker:"MU", name:"Micron Technology", sector:"Semi / Mémoire", currency:"$", verdict:"ACHAT", stars:4, price:447, target12m:550, target3y:700, entryT1:"420–455", entryT2:"370–410", entryT3:"320–360", upside:"+23%", pe:12, peg:0.6, ps:2.8, revGrowth:"+38%", ebitda:"35%", nextEarnings:"⚡ 18 mars 2026", mktCap:"495Mds$", beta:1.42, moat:"Duopole HBM avec Samsung/SK Hynix — seul acteur US", risk:"Cyclicité mémoire post-2027", note:"EARNINGS MERCREDI 18 MARS. HBM déficit structural 2027. Position en vert +6.03%.", consensus:"Strong Buy — cibles 520–600$", catalysts:"⚡ EARNINGS 18 MARS · HBM4 ramp · AI server demand", inPerso:true, inHolding:true, lastUpdated:"16 mars 2026", urgency:true },
  { id:"ENR", ticker:"ENR", name:"Siemens Energy", sector:"Énergie IA", currency:"€", verdict:"RENFORCER", stars:4, price:149, target12m:175, target3y:250, entryT1:"148–155", entryT2:"135–140", entryT3:"120–128", upside:"+17%", pe:34, peg:0.74, ps:2.9, revGrowth:"+12.8%", ebitda:"12%", nextEarnings:"12 mai 2026", mktCap:"130Mds€", beta:1.83, moat:"Backlog 146Mds€ record, turbines H-Class", risk:"PRU 159.63€ — en rouge -6.41%", note:"PEG 0.74x. Backlog 146Mds€ = 3.5ans revenue. PRU 159.63€ — zone T1 atteinte. Renforcer.", consensus:"Buy — Susquehanna 220€, consensus 165€", catalysts:"Gamesa breakeven · Grid AI demand · Earnings 12 mai", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"AMBA", ticker:"AMBA", name:"Ambarella", sector:"Edge AI Semi", currency:"$", verdict:"ACHAT SPÉCULATIF", stars:3, price:54, target12m:90, target3y:130, entryT1:"52–58", entryT2:"45–50", entryT3:"38–42", upside:"+67%", pe:null, peg:null, ps:6.2, revGrowth:"+37% FY2026", ebitda:"5%", nextEarnings:"28 mai 2026", mktCap:"2.4Mds$", beta:2.2, moat:"CVflow stack logiciel Edge AI", risk:"Guidance FY2027 ralentit à +10-15%", note:"Edge AI SoCs. Premier pur-play coté vision AI. ASIC 2nm pipeline. Physical AI = décennie.", consensus:"Buy 9/0/5 — cible 97.45$", catalysts:"ASIC 2nm 2027 · Physical AI · Earnings 28 mai", inPerso:false, inHolding:true, lastUpdated:"16 mars 2026", urgency:false },
  { id:"APP", ticker:"APP", name:"AppLovin", sector:"Ad Tech IA", currency:"$", verdict:"ACHAT SPÉCULATIF", stars:3, price:460, target12m:620, target3y:900, entryT1:"440–470", entryT2:"380–410", entryT3:"320–350", upside:"+35%", pe:45, peg:0.5, ps:28, revGrowth:"+66%", ebitda:"84%", nextEarnings:"13 mai 2026", mktCap:"155Mds$", beta:2.5, moat:"AXON 2 moteur IA, milliards transactions entraînement", risk:"⚠️ SEC investigation active et en cours", note:"84% EBITDA. Fondamentaux extraordinaires. Risque binaire SEC. MAX 3-4% ptf.", consensus:"Buy 22/2 — médiane 735$", catalysts:"Résolution SEC · Earnings 13 mai · Social platform", inPerso:false, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"RDW", ticker:"RDW", name:"Redwire", sector:"Défense / Space", currency:"$", verdict:"ACHAT SPÉCULATIF", stars:3, price:9.46, target12m:14, target3y:30, entryT1:"9–10", entryT2:"7–8", entryT3:"5.5–6", upside:"+48%", pe:null, peg:null, ps:3.05, revGrowth:"+42% guidé 2026", ebitda:"N/A", nextEarnings:"11-13 mai 2026", mktCap:"1.6Mds$", beta:2.54, moat:"Panneaux ROSA monopole spatial, Edge Autonomy drones", risk:"FCF -200M$ sur 130M$ cash — dilution probable", note:"Backlog 411M$, BTB 1.52x. Golden Dome IDIQ 151Mds$. Morningstar FV 44$. MAX 3%.", consensus:"HC Wainwright 22$, Canaccord 12$, médiane 13$", catalysts:"Golden Dome · Earnings mai · ELSA solar", inPerso:false, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"POET", ticker:"POET", name:"POET Technologies", sector:"IA Optique", currency:"$", verdict:"SPÉCULATIF", stars:2, price:6.2, target12m:15, target3y:40, entryT1:"5–7", entryT2:"4–5", entryT3:"3–3.5", upside:"+142%", pe:null, peg:null, ps:null, revGrowth:"Pré-revenus", ebitda:"N/A", nextEarnings:"26 mars 2026", mktCap:"420M$", beta:3.2, moat:"Optical Interposer IP propriétaire", risk:"Pré-revenus — aucune garantie commercialisation", note:"Lottery ticket contrôlé. x5-x100 si réussi. MAX 2-3%. OFC + Earnings 26 mars.", consensus:"Cibles 10–20$", catalysts:"OFC 16-19 mars · Earnings 26 mars · Design wins", inPerso:false, inHolding:true, lastUpdated:"16 mars 2026", urgency:false },
  { id:"AAOI", ticker:"AAOI", name:"Applied Optoelectronics", sector:"IA Optique", currency:"$", verdict:"SPÉCULATIF", stars:2, price:96, target12m:160, target3y:280, entryT1:"85–100", entryT2:"70–82", entryT3:"55–65", upside:"+67%", pe:null, peg:null, ps:3.8, revGrowth:"+45%", ebitda:"8%", nextEarnings:"Mai 2026", mktCap:"640M$", beta:3.1, moat:"Intégration verticale supply chain optique", risk:"Small cap haute volatilité", note:"OFC catalyseur. MAX 3-4%. En holding. Renforcer si repli <85$.", consensus:"Buy — cibles 130–200$", catalysts:"OFC · Design wins data center · Earnings mai", inPerso:false, inHolding:true, lastUpdated:"16 mars 2026", urgency:false },
  { id:"LWLG", ticker:"LWLG", name:"Lightwave Logic", sector:"IA Optique", currency:"$", verdict:"ATTENDRE", stars:2, price:6.2, target12m:10, target3y:25, entryT1:"4.5–5.2", entryT2:"3.5–4.2", entryT3:"2.8–3.2", upside:"+61%", pe:null, peg:null, ps:null, revGrowth:"Pré-revenus (100K$ TTM)", ebitda:"N/A", nextEarnings:"7 mai 2026", mktCap:"730M$", beta:3.5, moat:"EO polymère supérieur silicium sur modulation", risk:"⚠️ +57% en 2 jours — ATTENDRE REPLI 5$", note:"Deal TSEM PH18. Tapeouts mi-2026. Pré-revenus. NE PAS ACHETER. Attendre 4.5–5$.", consensus:"Bullish — cibles 10–20$", catalysts:"Tapeouts mi-2026 · Deal TSEM · Fortune 500 Stage 3", inPerso:false, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"FCX", ticker:"FCX", name:"Freeport-McMoRan", sector:"Métaux / Cuivre", currency:"$", verdict:"RENFORCER", stars:3, price:57.34, target12m:75, target3y:100, entryT1:"53–57", entryT2:"46–50", entryT3:"38–42", upside:"+31%", pe:18, peg:0.9, ps:2.1, revGrowth:"+8%", ebitda:"38%", nextEarnings:"Juillet 2026", mktCap:"82Mds$", beta:1.85, moat:"Actifs miniers Tier-1 Grasberg irremplaçables", risk:"Cyclicité matières premières — PRU 63.48$ en rouge", note:"Renforcé à 56.54$. PRU 63.48$, -9.73%. Correction macro pas fondamentale.", consensus:"Buy — cibles 70–95$", catalysts:"Cuivre IA/EVs · Chine stimulus · Résolution Ormuz", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"CCJ", ticker:"CCJ", name:"Cameco", sector:"Uranium", currency:"$", verdict:"RENFORCER", stars:3, price:109.81, target12m:140, target3y:180, entryT1:"105–120", entryT2:"90–100", entryT3:"75–85", upside:"+27%", pe:35, peg:1.2, ps:4.8, revGrowth:"+20%", ebitda:"32%", nextEarnings:"Mai 2026", mktCap:"20Mds$", beta:1.55, moat:"Actifs uranium Tier-1 Cigar Lake + McArthur River", risk:"PRU 118.50$ — en rouge -7.32%", note:"Uranium nucléaire data centers IA. PRU 118.50$. Consolidation U3O8 → CCJ.", consensus:"Buy — cibles 130–180$", catalysts:"Nuclear PPA deals · AI power demand · Uranium recovery", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"GEV", ticker:"GEV", name:"GE Vernova", sector:"Énergie IA", currency:"$", verdict:"CONSERVER", stars:3, price:820.90, target12m:960, target3y:1200, entryT1:"780–840", entryT2:"700–760", entryT3:"620–680", upside:"+17%", pe:38, peg:1.1, ps:3.5, revGrowth:"+12%", ebitda:"14%", nextEarnings:"Avril 2026", mktCap:"105Mds$", beta:1.4, moat:"Leader US turbines gaz + grid, switching costs 25 ans", risk:"Valorisation élevée post-rally, doublon ENR", note:"En portefeuille -0.21%. Conserver. Grid bottleneck IA data centers.", consensus:"Buy — cibles 900–1100$", catalysts:"Grid AI demand · Earnings avril · Data center contracts", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"NVDA", ticker:"NVDA", name:"Nvidia", sector:"GPU IA", currency:"$", verdict:"CONSERVER", stars:4, price:184.73, target12m:220, target3y:300, entryT1:"170–190", entryT2:"150–165", entryT3:"130–145", upside:"+19%", pe:35, peg:0.85, ps:22, revGrowth:"+78% FY2025", ebitda:"62%", nextEarnings:"Mai 2026", mktCap:"4500Mds$", beta:1.65, moat:"CUDA ecosystem — impossible à répliquer 5-10 ans", risk:"Valorisation + concurrence AMD/ASICs LT", note:"En portefeuille -0.68%. Conserver. Blackwell supercycle. Chaque data center = client.", consensus:"Strong Buy — consensus 230$", catalysts:"Blackwell ramp · GTC · Data center supercycle", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"META", ticker:"META", name:"Meta Platforms", sector:"Social IA", currency:"$", verdict:"CONSERVER", stars:3, price:629.06, target12m:780, target3y:1000, entryT1:"580–640", entryT2:"520–565", entryT3:"460–510", upside:"+24%", pe:23, peg:0.9, ps:8.5, revGrowth:"+21%", ebitda:"45%", nextEarnings:"Avril 2026", mktCap:"1600Mds$", beta:1.35, moat:"3.5Mds DAU captifs, ad IA dominant", risk:"Capex 115-135Mds$ 2026. Retard modèle Avocado.", note:"En portefeuille +0.57%. Conserver. Baisse du jour sur retard Avocado — correction macro.", consensus:"Buy — consensus 860$", catalysts:"Avocado AI · Ray-Ban AR · Ad revenue acceleration", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"TSM", ticker:"TSM", name:"TSMC", sector:"Foundry", currency:"$", verdict:"CONSERVER", stars:4, price:342.66, target12m:400, target3y:520, entryT1:"310–345", entryT2:"270–300", entryT3:"230–260", upside:"+17%", pe:22, peg:1.52, ps:9, revGrowth:"+30%", ebitda:"42%", nextEarnings:"Avril 2026", mktCap:"1800Mds$", beta:1.25, moat:"Avance technologique 2nm inatteignable Intel/Samsung", risk:"Risque géopolitique Taiwan", note:"En portefeuille +4.75%. Conserver. Tous les clients IA passent par TSMC.", consensus:"Strong Buy — consensus 400$", catalysts:"2nm ramp · AI chip demand · CoWoS packaging", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"CEG", ticker:"CEG", name:"Constellation Energy", sector:"Nucléaire IA", currency:"$", verdict:"RENFORCER", stars:3, price:304.42, target12m:380, target3y:500, entryT1:"280–310", entryT2:"250–270", entryT3:"210–235", upside:"+25%", pe:28, peg:1.1, ps:3.2, revGrowth:"+15%", ebitda:"35%", nextEarnings:"Mai 2026", mktCap:"95Mds$", beta:1.2, moat:"Seul opérateur nucléaire pur-play US", risk:"Régulation nucléaire lente", note:"En portefeuille +0.61%. Nucléaire base load data centers IA. PPAs signés Microsoft/Google.", consensus:"Buy — cibles 350–450$", catalysts:"Nuclear PPA · Crane restart · AI power demand", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"ATI", ticker:"ATI", name:"ATI Inc.", sector:"Matériaux Avancés", currency:"$", verdict:"CONSERVER", stars:3, price:146.88, target12m:180, target3y:230, entryT1:"130–150", entryT2:"110–125", entryT3:"92–105", upside:"+23%", pe:18, peg:0.9, ps:1.8, revGrowth:"+12%", ebitda:"22%", nextEarnings:"Avril 2026", mktCap:"5.8Mds$", beta:1.55, moat:"Seul producteur US titane grade aerospace certifié", risk:"Cyclicité aerospace dépendance Boeing/Airbus", note:"En portefeuille +21.2%. Laisser courir. Position gagnante.", consensus:"Buy — cibles 165–200$", catalysts:"Aerospace recovery · Defense · Titanium constraints", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"RKLB", ticker:"RKLB", name:"Rocket Lab", sector:"Défense / Space", currency:"$", verdict:"CONSERVER", stars:3, price:70.81, target12m:95, target3y:150, entryT1:"65–75", entryT2:"55–63", entryT3:"45–52", upside:"+34%", pe:null, peg:null, ps:15, revGrowth:"+25%", ebitda:"N/A", nextEarnings:"Mai 2026", mktCap:"14Mds$", beta:2.1, moat:"Lanceur petit satellite + composants spatiaux", risk:"Non profitable, concurrence SpaceX immense", note:"En portefeuille -4.06%. Conviction personnelle forte. Conserver à ta discrétion.", consensus:"Buy — cibles 85–120$", catalysts:"Neutron rocket · Space Systems · Defense contracts", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"PLTR", ticker:"PLTR", name:"Palantir", sector:"Défense IA", currency:"$", verdict:"CONSERVER", stars:3, price:152.28, target12m:185, target3y:250, entryT1:"140–160", entryT2:"120–135", entryT3:"100–115", upside:"+21%", pe:120, peg:2.1, ps:35, revGrowth:"+30%", ebitda:"38%", nextEarnings:"Mai 2026", mktCap:"330Mds$", beta:2.3, moat:"AIP déployé armée US — switching costs gouvernementaux", risk:"Valorisation très élevée P/E 120x. En rouge -13%.", note:"En portefeuille -13%. Conserver — AIP gouvernements en accélération. Thesis intact.", consensus:"Buy — consensus 185$", catalysts:"AIP commercial expansion · Defense budget · USAF contracts", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"AMZN", ticker:"AMZN", name:"Amazon", sector:"Cloud IA", currency:"$", verdict:"CONSERVER", stars:3, price:209.53, target12m:255, target3y:340, entryT1:"195–215", entryT2:"175–190", entryT3:"155–172", upside:"+22%", pe:38, peg:1.4, ps:3.3, revGrowth:"+11%", ebitda:"18%", nextEarnings:"Avril 2026", mktCap:"2200Mds$", beta:1.4, moat:"AWS dominant + Prime ecosystem + logistics", risk:"PRU 227.37$ — en rouge -7.86%", note:"En portefeuille -7.86%. Conserver. AWS IA croît massivement. Meilleur moat cloud.", consensus:"Strong Buy — consensus 260$", catalysts:"AWS AI demand · Project Kuiper · Advertising IA", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"MSFT", ticker:"MSFT", name:"Microsoft", sector:"Cloud IA", currency:"$", verdict:"CONSERVER", stars:3, price:398.29, target12m:470, target3y:600, entryT1:"375–405", entryT2:"340–370", entryT3:"300–335", upside:"+18%", pe:32, peg:1.5, ps:11, revGrowth:"+16%", ebitda:"52%", nextEarnings:"Avril 2026", mktCap:"2980Mds$", beta:0.85, moat:"Azure + Office 365 + Copilot — ecosystem captif enterprise", risk:"PRU 430.94$ — en rouge -7.58%", note:"En portefeuille -7.58%. Conserver. Copilot IA + Azure en forte croissance.", consensus:"Strong Buy — consensus 490$", catalysts:"Copilot adoption · Azure AI growth · OpenAI partnership", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"GOOG", ticker:"GOOG", name:"Alphabet", sector:"Search IA", currency:"$", verdict:"CONSERVER", stars:3, price:302.99, target12m:360, target3y:460, entryT1:"285–310", entryT2:"255–278", entryT3:"225–250", upside:"+19%", pe:21, peg:1.0, ps:5.8, revGrowth:"+15%", ebitda:"35%", nextEarnings:"Avril 2026", mktCap:"1870Mds$", beta:1.05, moat:"Search monopole + YouTube + GCP + DeepMind", risk:"PRU 319.01$ — en rouge -5.03%", note:"En portefeuille -5.03%. Conserver. Gemini IA + Search IA + GCP.", consensus:"Strong Buy — consensus 220$", catalysts:"Gemini AI · Search AI · GCP growth · Waymo", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:false },
  { id:"USAR", ticker:"USAR", name:"USA Rare Earth", sector:"Matières Premières", currency:"$", verdict:"VENDRE", stars:1, price:19.69, target12m:18, target3y:25, entryT1:"15–18", entryT2:"12–14", entryT3:"9–11", upside:"-9%", pe:null, peg:null, ps:null, revGrowth:"Pré-revenus", ebitda:"N/A", nextEarnings:"Inconnu", mktCap:"680M$", beta:2.8, moat:"Gisement Round Top Texas terres rares", risk:"⚠️ Pré-revenus, dépendance politique gouvernementale Trump", note:"⚠️ RECOMMANDATION : VENDRE. Pré-revenus, 29 employés, Trump peut revoir les garanties prix. Capital mieux utilisé ailleurs.", consensus:"Hold — peu de couverture", catalysts:"Trump minerals policy · Round Top permitting", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:true },
  { id:"SMR", ticker:"SMR", name:"NuScale Power", sector:"Nucléaire IA", currency:"$", verdict:"VENDRE", stars:1, price:11.78, target12m:12, target3y:20, entryT1:"9–12", entryT2:"7–9", entryT3:"5–7", upside:"+2%", pe:null, peg:null, ps:null, revGrowth:"Pré-revenus", ebitda:"N/A", nextEarnings:"Inconnu", mktCap:"750M$", beta:3.5, moat:"SMR technology Tier-1 — mais concurrence intense", risk:"⚠️ -30.4% non réalisé. Très long terme, capital mort.", note:"⚠️ RECOMMANDATION : VENDRE. -30.4% non réalisé. Capital mort. Libérer pour NBIS ou FN.", consensus:"Mixed — incertitude exécution", catalysts:"SMR regulatory approval — très LT", inPerso:true, inHolding:false, lastUpdated:"16 mars 2026", urgency:true },
];

const ACTIONS = {
  "FORT ACHAT": { color:"#10b981", bg:"rgba(16,185,129,0.12)", icon:"⬆⬆", rank:1 },
  "TOP CONVICTION": { color:"#f59e0b", bg:"rgba(245,158,11,0.12)", icon:"🔥", rank:1 },
  "ACHAT": { color:"#06b6d4", bg:"rgba(6,182,212,0.12)", icon:"⬆", rank:2 },
  "RENFORCER": { color:"#3b82f6", bg:"rgba(59,130,246,0.12)", icon:"+", rank:2 },
  "CONSERVER": { color:"#8b5cf6", bg:"rgba(139,92,246,0.12)", icon:"=", rank:3 },
  "ACHAT SPÉCULATIF": { color:"#f97316", bg:"rgba(249,115,22,0.12)", icon:"⚡", rank:3 },
  "SPÉCULATIF": { color:"#ef4444", bg:"rgba(239,68,68,0.12)", icon:"🎲", rank:4 },
  "ATTENDRE": { color:"#6b7280", bg:"rgba(107,114,128,0.12)", icon:"⏳", rank:5 },
  "SURVEILLER": { color:"#64748b", bg:"rgba(100,116,139,0.12)", icon:"👁", rank:5 },
  "VENDRE": { color:"#dc2626", bg:"rgba(220,38,38,0.15)", icon:"⬇⬇", rank:6 },
};

const SECTOR_C = {
  "IA Optique":"#06b6d4","Cloud IA":"#8b5cf6","MarTech IA":"#ec4899",
  "E-commerce/Fintech":"#10b981","Semi / Mémoire":"#f59e0b","Edge AI Semi":"#f97316",
  "Ad Tech IA":"#ef4444","Énergie IA":"#22c55e","Défense / Space":"#64748b",
  "Métaux / Cuivre":"#b45309","Uranium":"#7c3aed","GPU IA":"#84cc16",
  "Foundry":"#0ea5e9","Social IA":"#3b82f6","Nucléaire IA":"#a78bfa",
  "Matériaux Avancés":"#d97706","Search IA":"#06b6d4","Défense IA":"#6366f1",
  "Matières Premières":"#78716c"
};

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const loadLS = (key, def) => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : def; } catch { return def; } };
  const saveLS = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} };

  const [stocksRaw, setStocksRaw] = useState(() => loadLS('atlas_stocks', STOCKS_DB));
  const [portfolioRaw, setPortfolioRaw] = useState(() => loadLS('atlas_portfolio', PORTFOLIO_DATA));

  const stocks = stocksRaw;
  const setStocks = (val) => { const n = typeof val==="function"?val(stocksRaw):val; setStocksRaw(n); saveLS('atlas_stocks',n); };
  const portfolio = portfolioRaw;
  const setPortfolio = (val) => { const n = typeof val==="function"?val(portfolioRaw):val; setPortfolioRaw(n); saveLS('atlas_portfolio',n); };
  const [tab, setTab] = useState("watchlist");
  const [selected, setSelected] = useState(null);
  const [filterSector, setFilterSector] = useState("Tous");
  const [filterVerdict, setFilterVerdict] = useState("Tous");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("verdict");
  const [loading, setLoading] = useState({});
  const [loadingAll, setLoadingAll] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSugg, setLoadingSugg] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [newTicker, setNewTicker] = useState("");
  const [loadingAdd, setLoadingAdd] = useState(false);
  const [notif, setNotif] = useState(null);
  const [portfolioTab, setPortfolioTab] = useState("positions");
  const [macro, setMacro] = useState({ brent: 88, ormuz: "Fermé", date: "16 mars 2026" });

  const notify = (msg, type="ok") => { setNotif({msg,type}); setTimeout(()=>setNotif(null),3500); };

  const sectors = ["Tous",...new Set(stocks.map(s=>s.sector))];
  const verdicts = ["Tous",...Object.keys(ACTIONS)];

  const filtered = stocks.filter(s=>{
    const ms = filterSector==="Tous"||s.sector===filterSector;
    const mv = filterVerdict==="Tous"||s.verdict===filterVerdict;
    const mq = !search||s.ticker.toLowerCase().includes(search.toLowerCase())||s.name.toLowerCase().includes(search.toLowerCase());
    return ms&&mv&&mq;
  }).sort((a,b)=>{
    if(sortBy==="verdict") return (ACTIONS[a.verdict]?.rank||9)-(ACTIONS[b.verdict]?.rank||9);
    if(sortBy==="upside") return parseFloat(b.upside||0)-parseFloat(a.upside||0);
    if(sortBy==="ticker") return a.ticker.localeCompare(b.ticker);
    return 0;
  });

  // FULL analysis update
  const updateFull = async (ticker) => {
    setLoading(p=>({...p,[ticker]:true}));
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:`Do a complete up-to-date financial analysis of ${ticker} stock. Search for latest price, news, earnings, guidance, analyst targets. Return ONLY valid JSON no markdown:
{"price":0,"change":"+0.0%","verdict":"FORT ACHAT|TOP CONVICTION|ACHAT|RENFORCER|CONSERVER|ACHAT SPÉCULATIF|SPÉCULATIF|ATTENDRE|SURVEILLER|VENDRE","target12m":0,"target3y":0,"upside":"+0%","pe":null,"peg":null,"ps":null,"revGrowth":"+0%","ebitda":"0%","nextEarnings":"date","mktCap":"0Mds$","moat":"updated moat","risk":"updated main risk","note":"2-3 sentences latest news and analysis","consensus":"latest analyst consensus","catalysts":"latest catalysts","lastUpdated":"today"}`}]
        })
      });
      const data = await resp.json();
      const txt = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
      const m = txt.match(/\{[\s\S]*\}/);
      if(m){ const p=JSON.parse(m[0]); setStocks(prev=>prev.map(s=>s.ticker===ticker?{...s,...p}:s)); notify(`${ticker} — analyse complète mise à jour ✓`); }
    } catch(e){ notify(`Erreur ${ticker}`,"err"); }
    setLoading(p=>({...p,[ticker]:false}));
  };

  const updateAll = async () => {
    setLoadingAll(true);
    const top = filtered.slice(0,4);
    for(const s of top) await updateFull(s.ticker);
    setLoadingAll(false);
  };

  const getSuggestions = async () => {
    setLoadingSugg(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1200,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:`I'm Marc, 30yo French wealth manager investor. My current holdings: NBIS,TSEM,MU,LITE,ENR,RKLB,ATI,FN,META,NVDA,GEV,CCJ,FCX,TSM,CEG,AMZN,MSFT,GOOG,PLTR. My watchlist: MELI,ZETA,AMBA,APP,RDW,POET,AAOI,LWLG.

Search for 3 compelling high-growth stock ideas I don't have yet. Focus on: AI infrastructure, photonics, cloud AI, defense tech, commodities for AI transition. Each should have clear x2-x3 potential in 3 years with strong moat. Avoid stocks I already own or watch.

Return ONLY valid JSON array no markdown:
[{"ticker":"XX","name":"Full Name","sector":"sector","why":"2 sentences specific reason","verdict":"ACHAT or FORT ACHAT","price":"$XX","target12m":"$XX","upside":"+XX%","catalyst":"main catalyst now","risk":"main risk","moat":"competitive advantage"}]`}]
        })
      });
      const data = await resp.json();
      const txt = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
      const m = txt.match(/\[[\s\S]*\]/);
      if(m) setSuggestions(JSON.parse(m[0]));
    } catch(e){ console.error(e); }
    setLoadingSugg(false);
  };

  const addAndAnalyze = async () => {
    if(!newTicker.trim()) return;
    setLoadingAdd(true);
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:1000,
          tools:[{type:"web_search_20250305",name:"web_search"}],
          messages:[{role:"user",content:`Complete analysis of ${newTicker.toUpperCase()} for a growth-focused French investor. Search latest data. Return ONLY valid JSON no markdown:
{"ticker":"${newTicker.toUpperCase()}","name":"full name","sector":"sector","exchange":"exchange","currency":"$ or €","verdict":"FORT ACHAT|ACHAT|RENFORCER|CONSERVER|ACHAT SPÉCULATIF|SPÉCULATIF|ATTENDRE|SURVEILLER","stars":3,"price":0,"target12m":0,"target3y":0,"entryT1":"","entryT2":"","entryT3":"","upside":"","pe":null,"peg":null,"ps":null,"revGrowth":"","ebitda":"","nextEarnings":"","mktCap":"","beta":0,"moat":"","risk":"","note":"","consensus":"","catalysts":"","inPerso":false,"inHolding":false,"lastUpdated":"today","urgency":false}`}]
        })
      });
      const data = await resp.json();
      const txt = data.content?.filter(b=>b.type==="text").map(b=>b.text).join("")||"";
      const m = txt.match(/\{[\s\S]*\}/);
      if(m){ const p=JSON.parse(m[0]); p.id=p.ticker; setStocks(prev=>[...prev.filter(s=>s.ticker!==p.ticker),p]); setNewTicker(""); setShowAdd(false); notify(`${p.ticker} analysé et ajouté ✓`); }
    } catch(e){ notify("Erreur analyse","err"); }
    setLoadingAdd(false);
  };

  // Portfolio metrics
  const totalVal = portfolio.positions.reduce((s,p)=>s+p.valeur,0);
  const totalPnlNr = portfolio.positions.reduce((s,p)=>s+p.pnlNnRlse,0);
  const winners = portfolio.positions.filter(p=>p.pnlNnRlse>0).length;
  const losers = portfolio.positions.filter(p=>p.pnlNnRlse<0).length;
  const sellPositions = portfolio.positions.filter(p=>{ const s=stocks.find(x=>x.ticker===p.ticker); return s?.verdict==="VENDRE"; });

  // Section colors
  const C = { bg:"#080a0f", card:"rgba(255,255,255,0.025)", border:"rgba(255,255,255,0.06)", amber:"#f59e0b", amberBg:"rgba(245,158,11,0.1)", amberBorder:"rgba(245,158,11,0.25)", text:"#e2e8f0", muted:"#64748b", sub:"#94a3b8" };

  return (
    <div style={{minHeight:"100vh",background:C.bg,fontFamily:"'DM Mono','Courier New',monospace",color:C.text,overflowX:"hidden"}}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@300;400;500&family=Playfair+Display:ital,wght@0,700;1,500&display=swap" rel="stylesheet"/>

      {/* NOTIFICATION */}
      {notif&&<div style={{position:"fixed",top:20,right:20,zIndex:9999,background:notif.type==="err"?"#dc2626":"#059669",color:"#fff",padding:"10px 18px",borderRadius:8,fontSize:12,fontFamily:"inherit",boxShadow:"0 8px 30px rgba(0,0,0,0.5)",animation:"fadeIn 0.2s"}}>{notif.msg}</div>}

      {/* HEADER */}
      <div style={{background:"rgba(0,0,0,0.7)",backdropFilter:"blur(24px)",borderBottom:`1px solid ${C.amberBorder}`,padding:"14px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={{width:3,height:36,background:"linear-gradient(180deg,#f59e0b,#d97706)",borderRadius:2}}/>
          <div>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:19,color:C.amber,letterSpacing:3}}>ATLAS INTEL</div>
            <div style={{fontSize:9,color:C.muted,letterSpacing:3}}>STOCK RESEARCH PLATFORM · {macro.date}</div>
          </div>
          {/* Macro ticker */}
          <div style={{marginLeft:24,display:"flex",gap:12}}>
            <span style={{fontSize:10,background:"rgba(239,68,68,0.1)",color:"#ef4444",padding:"3px 8px",borderRadius:4,border:"1px solid rgba(239,68,68,0.2)"}}>⚠️ ORMUZ {macro.ormuz}</span>
            <span style={{fontSize:10,background:"rgba(245,158,11,0.1)",color:C.amber,padding:"3px 8px",borderRadius:4,border:`1px solid ${C.amberBorder}`}}>BRENT {macro.brent}$</span>
            <span style={{fontSize:10,background:"rgba(16,185,129,0.1)",color:"#10b981",padding:"3px 8px",borderRadius:4,border:"1px solid rgba(16,185,129,0.2)"}}>OFC LA ✅ EN COURS</span>
          </div>
        </div>
        <div style={{display:"flex",gap:5}}>
          {["watchlist","portfolio","suggestions","earnings"].map(t=>(
            <button key={t} onClick={()=>setTab(t)} style={{background:tab===t?C.amberBg:"transparent",border:`1px solid ${tab===t?C.amberBorder:C.border}`,color:tab===t?C.amber:C.muted,padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:10,fontFamily:"inherit",letterSpacing:1,textTransform:"uppercase"}}>{t}</button>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowAdd(true)} style={{background:"rgba(16,185,129,0.08)",border:"1px solid rgba(16,185,129,0.25)",color:"#10b981",padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>+ AJOUTER</button>
          <button onClick={updateAll} disabled={loadingAll} style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,color:C.amber,padding:"6px 14px",borderRadius:6,cursor:"pointer",fontSize:10,fontFamily:"inherit",opacity:loadingAll ? 0.6 : 1}}>{loadingAll?"⟳ MAJ...":"⟳ TOP 4 LIVE"}</button>
        </div>
      </div>

      {/* ══ WATCHLIST ══ */}
      {tab==="watchlist"&&(
        <div style={{padding:"18px 24px"}}>
          {/* KPI bar */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:8,marginBottom:16}}>
            {[
              {l:"TITRES",v:stocks.length,c:C.amber},
              {l:"FORT ACHAT",v:stocks.filter(s=>["FORT ACHAT","TOP CONVICTION"].includes(s.verdict)).length,c:"#10b981"},
              {l:"ACHAT / RENFORCER",v:stocks.filter(s=>["ACHAT","RENFORCER"].includes(s.verdict)).length,c:"#06b6d4"},
              {l:"SPÉCULATIF",v:stocks.filter(s=>s.verdict.includes("SPÉCULATIF")||s.verdict==="SPÉCULATIF").length,c:"#f97316"},
              {l:"⚠️ VENDRE",v:stocks.filter(s=>s.verdict==="VENDRE").length,c:"#dc2626"},
              {l:"EN HOLDING",v:stocks.filter(s=>s.inHolding).length,c:"#8b5cf6"},
            ].map(k=>(
              <div key={k.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"10px 14px"}}>
                <div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:4}}>{k.l}</div>
                <div style={{fontSize:22,fontFamily:"'Playfair Display',serif",color:k.c}}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Sell alerts */}
          {sellPositions.length>0&&(
            <div style={{background:"rgba(220,38,38,0.08)",border:"1px solid rgba(220,38,38,0.3)",borderRadius:8,padding:"10px 16px",marginBottom:14,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:14}}>🚨</span>
              <span style={{fontSize:11,color:"#ef4444"}}>RECOMMANDATION VENDRE : </span>
              {sellPositions.map(p=>(
                <span key={p.ticker} style={{background:"rgba(220,38,38,0.15)",color:"#dc2626",padding:"2px 10px",borderRadius:4,fontSize:11,cursor:"pointer"}} onClick={()=>{const s=stocks.find(x=>x.ticker===p.ticker);if(s)setSelected(s);}}>{p.ticker} ({p.pnlNnRlsePct}%)</span>
              ))}
            </div>
          )}

          {/* Urgency alerts */}
          {stocks.filter(s=>s.urgency&&!["VENDRE"].includes(s.verdict)).length>0&&(
            <div style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:8,padding:"10px 16px",marginBottom:14,display:"flex",gap:12,alignItems:"center"}}>
              <span style={{fontSize:11,color:C.amber}}>⚡ CATALYSEURS IMMINENTS : </span>
              {stocks.filter(s=>s.urgency&&!["VENDRE"].includes(s.verdict)).map(s=>(
                <span key={s.ticker} style={{background:"rgba(245,158,11,0.15)",color:C.amber,padding:"2px 10px",borderRadius:4,fontSize:11,cursor:"pointer"}} onClick={()=>setSelected(s)}>{s.ticker} — {s.nextEarnings}</span>
              ))}
            </div>
          )}

          {/* Filters */}
          <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap",alignItems:"center"}}>
            <input placeholder="🔍 Rechercher..." value={search} onChange={e=>setSearch(e.target.value)} style={{background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,color:C.text,padding:"7px 12px",borderRadius:6,fontSize:11,fontFamily:"inherit",width:180,outline:"none"}}/>
            <select value={filterSector} onChange={e=>setFilterSector(e.target.value)} style={{background:"#0d0f16",border:`1px solid ${C.border}`,color:C.sub,padding:"7px 10px",borderRadius:6,fontSize:10,fontFamily:"inherit",cursor:"pointer"}}>
              {sectors.map(s=><option key={s}>{s}</option>)}
            </select>
            <select value={filterVerdict} onChange={e=>setFilterVerdict(e.target.value)} style={{background:"#0d0f16",border:`1px solid ${C.border}`,color:C.sub,padding:"7px 10px",borderRadius:6,fontSize:10,fontFamily:"inherit",cursor:"pointer"}}>
              {verdicts.map(v=><option key={v}>{v}</option>)}
            </select>
            <select value={sortBy} onChange={e=>setSortBy(e.target.value)} style={{background:"#0d0f16",border:`1px solid ${C.border}`,color:C.sub,padding:"7px 10px",borderRadius:6,fontSize:10,fontFamily:"inherit",cursor:"pointer"}}>
              <option value="verdict">Tri: Conviction</option>
              <option value="upside">Tri: Upside</option>
              <option value="ticker">Tri: Ticker</option>
            </select>
            <span style={{marginLeft:"auto",fontSize:10,color:C.muted}}>{filtered.length} titres</span>
          </div>

          {/* Cards grid */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(330px,1fr))",gap:10}}>
            {filtered.map(s=>{
              const vc=ACTIONS[s.verdict]||ACTIONS["SURVEILLER"];
              const sc=SECTOR_C[s.sector]||"#64748b";
              const pos=portfolio.positions.find(p=>p.ticker===s.ticker);
              const isLoad=loading[s.ticker];
              return (
                <div key={s.id} onClick={()=>setSelected(s)} style={{background:C.card,border:`1px solid ${s.verdict==="VENDRE"?"rgba(220,38,38,0.3)":s.urgency?"rgba(245,158,11,0.25)":C.border}`,borderRadius:10,padding:14,cursor:"pointer",transition:"border 0.15s",position:"relative",overflow:"hidden"}}
                  onMouseEnter={e=>e.currentTarget.style.border=`1px solid ${vc.color}50`}
                  onMouseLeave={e=>e.currentTarget.style.border=`1px solid ${s.verdict==="VENDRE"?"rgba(220,38,38,0.3)":s.urgency?"rgba(245,158,11,0.25)":C.border}`}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${sc},transparent)`}}/>
                  
                  {/* Header row */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8}}>
                    <div>
                      <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:2}}>
                        <span style={{fontFamily:"'Playfair Display',serif",fontSize:17,color:C.amber}}>{s.ticker}</span>
                        {s.inHolding&&<span style={{fontSize:8,background:"rgba(139,92,246,0.2)",color:"#a78bfa",padding:"1px 5px",borderRadius:3}}>H</span>}
                        {s.inPerso&&<span style={{fontSize:8,background:"rgba(16,185,129,0.2)",color:"#10b981",padding:"1px 5px",borderRadius:3}}>P</span>}
                        {s.urgency&&<span style={{fontSize:8,background:"rgba(245,158,11,0.2)",color:C.amber,padding:"1px 5px",borderRadius:3}}>⚡</span>}
                      </div>
                      <div style={{fontSize:10,color:C.muted}}>{s.name}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:15,color:C.text}}>{s.currency}{typeof s.price==="number"?s.price.toLocaleString():s.price}</div>
                      <div style={{fontSize:10,color:parseFloat(s.upside||0)>=0?"#10b981":"#ef4444"}}>{s.upside} upside</div>
                    </div>
                  </div>

                  {/* Verdict */}
                  <div style={{display:"inline-flex",alignItems:"center",gap:4,background:vc.bg,border:`1px solid ${vc.color}35`,borderRadius:5,padding:"3px 8px",marginBottom:8}}>
                    <span style={{fontSize:10}}>{vc.icon}</span>
                    <span style={{fontSize:9,color:vc.color,letterSpacing:0.8}}>{s.verdict}</span>
                  </div>

                  {/* Key metric */}
                  <div style={{fontSize:10,color:C.sub,marginBottom:8,lineHeight:1.5,height:32,overflow:"hidden"}}>{s.moat||s.note?.slice(0,80)}</div>

                  {/* Metrics mini */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:4,marginBottom:8}}>
                    {[
                      {l:"T1",v:s.entryT1?`${s.currency}${s.entryT1}`:"—"},
                      {l:"CIBLE 12M",v:s.target12m?`${s.currency}${s.target12m}`:"—"},
                      {l:"REV%",v:s.revGrowth||"—"},
                    ].map(m=>(
                      <div key={m.l} style={{background:"rgba(0,0,0,0.3)",borderRadius:4,padding:"5px 7px"}}>
                        <div style={{fontSize:7,color:"#475569",letterSpacing:1}}>{m.l}</div>
                        <div style={{fontSize:10,color:C.text,marginTop:1}}>{m.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Position en portefeuille */}
                  {pos&&(
                    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:5,padding:"5px 8px",marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontSize:9,color:C.muted}}>Position: {pos.qty} × {s.currency}{pos.prix} | PRU {s.currency}{pos.pru}</span>
                      <span style={{fontSize:10,color:pos.pnlNnRlse>=0?"#10b981":"#ef4444"}}>{pos.pnlNnRlsePct>=0?"+":""}{pos.pnlNnRlsePct}%</span>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                    <span style={{fontSize:8,background:`${sc}18`,color:sc,padding:"2px 7px",borderRadius:20}}>{s.sector}</span>
                    <button onClick={e=>{e.stopPropagation();updateFull(s.ticker);}} disabled={isLoad} style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,color:C.amber,padding:"3px 9px",borderRadius:4,cursor:"pointer",fontSize:9,fontFamily:"inherit",opacity:isLoad ? 0.5 : 1}}>
                      {isLoad?"...":"⟳ LIVE"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ PORTFOLIO ══ */}
      {tab==="portfolio"&&(
        <div style={{padding:"18px 24px"}}>
          {/* Header KPIs */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:10,marginBottom:16}}>
            {[
              {l:"VALEUR NETTE",v:`${portfolio.vnl.toLocaleString()}$`,c:C.amber},
              {l:"P&L JOUR",v:`+${portfolio.pnlJour}$ (+${portfolio.pnlJourPct}%)`,c:"#10b981"},
              {l:"P&L NN RÉALISÉ",v:`${totalPnlNr.toFixed(0)}$`,c:totalPnlNr>=0?"#10b981":"#ef4444"},
              {l:"CASH DISPONIBLE",v:`${portfolio.cashEUR.toLocaleString()}€`,c:C.sub},
              {l:"GAGNANTS / PERDANTS",v:`${winners} / ${losers}`,c:C.amber},
            ].map(k=>(
              <div key={k.l} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 16px"}}>
                <div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:4}}>{k.l}</div>
                <div style={{fontSize:16,fontFamily:"'Playfair Display',serif",color:k.c}}>{k.v}</div>
              </div>
            ))}
          </div>

          {/* Sub-tabs */}
          <div style={{display:"flex",gap:6,marginBottom:14}}>
            {["positions","analyse","allocation"].map(t=>(
              <button key={t} onClick={()=>setPortfolioTab(t)} style={{background:portfolioTab===t?C.amberBg:"transparent",border:`1px solid ${portfolioTab===t?C.amberBorder:C.border}`,color:portfolioTab===t?C.amber:C.muted,padding:"5px 14px",borderRadius:5,cursor:"pointer",fontSize:10,fontFamily:"inherit",textTransform:"uppercase"}}>{t}</button>
            ))}
          </div>

          {/* POSITIONS TABLE */}
          {portfolioTab==="positions"&&(
            <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
              <table style={{width:"100%",borderCollapse:"collapse"}}>
                <thead>
                  <tr style={{borderBottom:`1px solid ${C.border}`,background:"rgba(0,0,0,0.3)"}}>
                    {["TICKER","NOM","QTÉ","PRIX","PRU","VALEUR","P&L $","P&L %","JOUR %","VERDICT","ACTION"].map(h=>(
                      <th key={h} style={{padding:"9px 12px",textAlign:"left",fontSize:8,color:C.muted,letterSpacing:2,fontWeight:400}}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {portfolio.positions.map((pos,i)=>{
                    const sd=stocks.find(s=>s.ticker===pos.ticker);
                    const v=sd?.verdict||"SURVEILLER";
                    const vc=ACTIONS[v]||ACTIONS["SURVEILLER"];
                    const isAlert=v==="VENDRE";
                    return (
                      <tr key={pos.ticker} onClick={()=>sd&&setSelected(sd)} style={{borderBottom:`1px solid ${C.border}`,background:isAlert?"rgba(220,38,38,0.05)":i%2===0?"transparent":"rgba(255,255,255,0.01)",cursor:"pointer"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(245,158,11,0.05)"}
                        onMouseLeave={e=>e.currentTarget.style.background=isAlert?"rgba(220,38,38,0.05)":i%2===0?"transparent":"rgba(255,255,255,0.01)"}>
                        <td style={{padding:"9px 12px",fontSize:13,fontFamily:"'Playfair Display',serif",color:C.amber}}>{pos.ticker}</td>
                        <td style={{padding:"9px 12px",fontSize:10,color:C.muted}}>{sd?.name||pos.ticker}</td>
                        <td style={{padding:"9px 12px",fontSize:11,color:C.sub}}>{pos.qty}</td>
                        <td style={{padding:"9px 12px",fontSize:11,color:C.text}}>{pos.prix}</td>
                        <td style={{padding:"9px 12px",fontSize:11,color:C.muted}}>{pos.pru}</td>
                        <td style={{padding:"9px 12px",fontSize:12,color:C.text,fontWeight:500}}>{pos.valeur.toLocaleString()}$</td>
                        <td style={{padding:"9px 12px",fontSize:11,color:pos.pnlNnRlse>=0?"#10b981":"#ef4444"}}>{pos.pnlNnRlse>=0?"+":""}{pos.pnlNnRlse.toFixed(0)}$</td>
                        <td style={{padding:"9px 12px",fontSize:11,color:pos.pnlNnRlsePct>=0?"#10b981":"#ef4444"}}>{pos.pnlNnRlsePct>=0?"+":""}{pos.pnlNnRlsePct}%</td>
                        <td style={{padding:"9px 12px",fontSize:11,color:pos.pnlJourPct>=0?"#10b981":"#ef4444"}}>{pos.pnlJourPct>=0?"+":""}{pos.pnlJourPct}%</td>
                        <td style={{padding:"9px 12px"}}>
                          <span style={{fontSize:8,background:vc.bg,color:vc.color,padding:"2px 7px",borderRadius:3,letterSpacing:0.8}}>{v}</span>
                        </td>
                        <td style={{padding:"9px 12px"}}>
                          {v==="VENDRE"&&<span style={{fontSize:8,background:"rgba(220,38,38,0.15)",color:"#dc2626",padding:"2px 7px",borderRadius:3,border:"1px solid rgba(220,38,38,0.3)"}}>⬇ VENDRE</span>}
                          {v==="RENFORCER"&&<span style={{fontSize:8,background:"rgba(59,130,246,0.15)",color:"#3b82f6",padding:"2px 7px",borderRadius:3}}>+ RENFORCER</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ANALYSE */}
          {portfolioTab==="analyse"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              {/* Biggest winners */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
                <div style={{fontSize:10,color:"#10b981",letterSpacing:2,marginBottom:12}}>🏆 TOP PERFORMERS</div>
                {[...portfolio.positions].sort((a,b)=>b.pnlNnRlsePct-a.pnlNnRlsePct).slice(0,5).map(p=>(
                  <div key={p.ticker} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                    <span style={{fontSize:11,color:C.amber}}>{p.ticker}</span>
                    <span style={{fontSize:11,color:"#10b981"}}>+{p.pnlNnRlsePct}% (+{p.pnlNnRlse.toFixed(0)}$)</span>
                  </div>
                ))}
              </div>
              {/* Biggest losers */}
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
                <div style={{fontSize:10,color:"#ef4444",letterSpacing:2,marginBottom:12}}>📉 À SURVEILLER</div>
                {[...portfolio.positions].sort((a,b)=>a.pnlNnRlsePct-b.pnlNnRlsePct).slice(0,5).map(p=>(
                  <div key={p.ticker} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${C.border}`}}>
                    <span style={{fontSize:11,color:C.amber}}>{p.ticker}</span>
                    <span style={{fontSize:11,color:"#ef4444"}}>{p.pnlNnRlsePct}% ({p.pnlNnRlse.toFixed(0)}$)</span>
                  </div>
                ))}
              </div>
              {/* Recommendations */}
              <div style={{background:C.card,border:`1px solid rgba(245,158,11,0.2)`,borderRadius:10,padding:16,gridColumn:"1/-1"}}>
                <div style={{fontSize:10,color:C.amber,letterSpacing:2,marginBottom:12}}>🎯 ACTIONS RECOMMANDÉES</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
                  {[
                    {action:"VENDRE EN PRIORITÉ",items:["USAR (-11.6%)", "SMR (-30.4%)"],color:"#dc2626",bg:"rgba(220,38,38,0.08)"},
                    {action:"RENFORCER",items:["NBIS (conviction Nvidia)", "ENR (T1 atteinte)"],color:"#3b82f6",bg:"rgba(59,130,246,0.08)"},
                    {action:"SURVEILLER",items:["MU earnings 18/03 ⚡", "OFC → FN/TSEM"],color:C.amber,bg:C.amberBg},
                  ].map(r=>(
                    <div key={r.action} style={{background:r.bg,border:`1px solid ${r.color}25`,borderRadius:8,padding:12}}>
                      <div style={{fontSize:9,color:r.color,letterSpacing:2,marginBottom:8}}>{r.action}</div>
                      {r.items.map(i=><div key={i} style={{fontSize:11,color:C.sub,marginBottom:4}}>• {i}</div>)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ALLOCATION */}
          {portfolioTab==="allocation"&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:12}}>ALLOCATION PAR SECTEUR</div>
                {Object.entries(
                  portfolio.positions.reduce((acc,p)=>{
                    const s=stocks.find(x=>x.ticker===p.ticker);
                    const sec=s?.sector||"Autre";
                    acc[sec]=(acc[sec]||0)+p.valeur;
                    return acc;
                  },{})
                ).sort((a,b)=>b[1]-a[1]).map(([sec,val])=>{
                  const pct=((val/totalVal)*100).toFixed(1);
                  const col=SECTOR_C[sec]||"#64748b";
                  return (
                    <div key={sec} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:10,color:C.sub}}>{sec}</span>
                        <span style={{fontSize:10,color:col}}>{pct}% — {val.toFixed(0)}$</span>
                      </div>
                      <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                        <div style={{height:4,width:`${pct}%`,background:col,borderRadius:2}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,padding:16}}>
                <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:12}}>TOP POSITIONS PAR VALEUR</div>
                {[...portfolio.positions].sort((a,b)=>b.valeur-a.valeur).slice(0,10).map(p=>{
                  const pct=((p.valeur/totalVal)*100).toFixed(1);
                  return (
                    <div key={p.ticker} style={{marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:10,color:C.amber,fontFamily:"'Playfair Display',serif"}}>{p.ticker}</span>
                        <span style={{fontSize:10,color:C.sub}}>{pct}% — {p.valeur.toFixed(0)}$</span>
                      </div>
                      <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:2}}>
                        <div style={{height:4,width:`${pct}%`,background:C.amber,borderRadius:2,opacity:0.7}}/>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══ SUGGESTIONS ══ */}
      {tab==="suggestions"&&(
        <div style={{padding:"18px 24px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
            <div>
              <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:C.amber}}>Intelligence du jour</div>
              <div style={{fontSize:11,color:C.muted,marginTop:4}}>IA impartiale — 3 pépites identifiées pour ton profil · hors de tes positions actuelles</div>
            </div>
            <button onClick={getSuggestions} disabled={loadingSugg} style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,color:C.amber,padding:"10px 20px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",opacity:loadingSugg ? 0.6 : 1}}>
              {loadingSugg?"⟳ Recherche en cours...":"🔍 GÉNÉRER 3 IDÉES"}
            </button>
          </div>
          {suggestions.length===0&&!loadingSugg&&(
            <div style={{textAlign:"center",padding:"60px",color:C.muted}}>
              <div style={{fontSize:48,marginBottom:16,opacity:0.4}}>🔍</div>
              <div style={{fontSize:13,marginBottom:8}}>Aucune suggestion générée</div>
              <div style={{fontSize:11}}>L'IA va chercher des opportunités spécifiques à ton profil — en dehors de tout ce que tu possèdes ou surveilles déjà</div>
            </div>
          )}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(380px,1fr))",gap:14}}>
            {suggestions.map((s,i)=>{
              const vc=ACTIONS[s.verdict]||ACTIONS["ACHAT"];
              return (
                <div key={i} style={{background:C.card,border:`1px solid ${C.amberBorder}`,borderRadius:12,padding:20,position:"relative",overflow:"hidden"}}>
                  <div style={{position:"absolute",top:0,left:0,right:0,height:2,background:`linear-gradient(90deg,${C.amber},transparent)`}}/>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:12}}>
                    <div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:C.amber}}>{s.ticker}</div>
                      <div style={{fontSize:11,color:C.muted}}>{s.name}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:9,background:vc.bg,color:vc.color,padding:"3px 10px",borderRadius:5,marginBottom:4}}>{s.verdict}</div>
                      <div style={{fontSize:12,color:C.text}}>{s.price}</div>
                      <div style={{fontSize:10,color:"#10b981"}}>{s.upside}</div>
                    </div>
                  </div>
                  <div style={{fontSize:12,color:C.sub,marginBottom:12,lineHeight:1.7}}>{s.why}</div>
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 12px",marginBottom:12}}>
                    <div style={{fontSize:9,color:C.muted,letterSpacing:1,marginBottom:4}}>MOAT</div>
                    <div style={{fontSize:11,color:C.sub}}>{s.moat}</div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
                    <div style={{background:"rgba(16,185,129,0.06)",border:"1px solid rgba(16,185,129,0.15)",borderRadius:6,padding:"8px 10px"}}>
                      <div style={{fontSize:8,color:C.muted,letterSpacing:1}}>CATALYSEUR</div>
                      <div style={{fontSize:10,color:"#10b981",marginTop:3}}>{s.catalyst}</div>
                    </div>
                    <div style={{background:"rgba(239,68,68,0.06)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:6,padding:"8px 10px"}}>
                      <div style={{fontSize:8,color:C.muted,letterSpacing:1}}>RISQUE</div>
                      <div style={{fontSize:10,color:"#ef4444",marginTop:3}}>{s.risk}</div>
                    </div>
                  </div>
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>{setNewTicker(s.ticker);setShowAdd(true);}} style={{flex:1,background:C.amberBg,border:`1px solid ${C.amberBorder}`,color:C.amber,padding:"8px",borderRadius:6,cursor:"pointer",fontSize:10,fontFamily:"inherit"}}>+ ANALYSER COMPLET</button>
                    <div style={{background:"rgba(0,0,0,0.4)",border:`1px solid ${C.border}`,borderRadius:6,padding:"8px 12px",fontSize:11,color:C.sub}}>{s.target12m}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ EARNINGS CALENDAR ══ */}
      {tab==="earnings"&&(
        <div style={{padding:"18px 24px"}}>
          <div style={{fontFamily:"'Playfair Display',serif",fontSize:22,color:C.amber,marginBottom:4}}>Calendrier des Catalyseurs</div>
          <div style={{fontSize:11,color:C.muted,marginBottom:20}}>Earnings, conférences et événements clés — portefeuille + watchlist</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:10}}>
            {[
              {date:"18 mars 2026",event:"EARNINGS MU Q2 FY2026",ticker:"MU",impact:"HBM demand confirmation — catalyseur majeur",urgency:true,type:"earnings"},
              {date:"19 mars 2026",event:"OFC Los Angeles — fin",ticker:"FN/TSEM/LITE/POET/AAOI",impact:"Annonces partenariats et design wins photonique",urgency:true,type:"conference"},
              {date:"26 mars 2026",event:"EARNINGS POET",ticker:"POET",impact:"Premier test post-OFC pour POET Technologies",urgency:false,type:"earnings"},
              {date:"29 avril 2026",event:"EARNINGS NBIS",ticker:"NBIS",impact:"Confirmation ARR post-deal Nvidia 2Mds$",urgency:false,type:"earnings"},
              {date:"Avril 2026",event:"EARNINGS GEV/TSM/MSFT/META/AMZN/GOOG",ticker:"Multi",impact:"Saison résultats Q1 2026 — Big Tech IA",urgency:false,type:"earnings"},
              {date:"7 mai 2026",event:"EARNINGS MELI",ticker:"MELI",impact:"Confirmation guidance +35% revenue",urgency:false,type:"earnings"},
              {date:"7 mai 2026",event:"EARNINGS LWLG",ticker:"LWLG",impact:"Update tapeouts TSEM PH18",urgency:false,type:"earnings"},
              {date:"11-13 mai 2026",event:"EARNINGS RDW",ticker:"RDW",impact:"Golden Dome backlog update",urgency:false,type:"earnings"},
              {date:"11 mai 2026",event:"EARNINGS FN Q3 FY2026",ticker:"FN",impact:"Confirmation guidance 1.15-1.20Mds$ — Building 10",urgency:false,type:"earnings"},
              {date:"12 mai 2026",event:"EARNINGS ENR Q2 FY2026",ticker:"ENR",impact:"Gamesa breakeven confirmation = re-rating",urgency:false,type:"earnings"},
              {date:"12 mai 2026",event:"EARNINGS ZETA",ticker:"ZETA",impact:"19ème trimestre beat & raise?",urgency:false,type:"earnings"},
              {date:"28 mai 2026",event:"EARNINGS AMBA",ticker:"AMBA",impact:"Guidance FY2027 — confirmation ou déception",urgency:false,type:"earnings"},
            ].map((ev,i)=>(
              <div key={i} style={{background:C.card,border:`1px solid ${ev.urgency?"rgba(245,158,11,0.3)":C.border}`,borderRadius:8,padding:14}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                  <span style={{fontSize:10,color:ev.urgency?C.amber:C.muted,letterSpacing:1}}>{ev.date}</span>
                  <span style={{fontSize:8,background:ev.type==="earnings"?"rgba(59,130,246,0.15)":"rgba(16,185,129,0.15)",color:ev.type==="earnings"?"#3b82f6":"#10b981",padding:"2px 6px",borderRadius:3}}>{ev.type.toUpperCase()}</span>
                </div>
                <div style={{fontFamily:"'Playfair Display',serif",fontSize:13,color:ev.urgency?C.amber:C.text,marginBottom:4}}>{ev.ticker}</div>
                <div style={{fontSize:10,color:C.sub,marginBottom:4}}>{ev.event}</div>
                <div style={{fontSize:10,color:C.muted,lineHeight:1.5}}>{ev.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ STOCK DETAIL MODAL ══ */}
      {selected&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={()=>setSelected(null)}>
          <div style={{background:"#0d0f16",border:`1px solid ${C.amberBorder}`,borderRadius:14,padding:24,maxWidth:740,width:"100%",maxHeight:"88vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            {(()=>{
              const s=selected;
              const vc=ACTIONS[s.verdict]||ACTIONS["SURVEILLER"];
              const sc=SECTOR_C[s.sector]||"#64748b";
              const pos=portfolio.positions.find(p=>p.ticker===s.ticker);
              const isLoad=loading[s.ticker];
              return (
                <>
                  {/* Header */}
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
                    <div>
                      <div style={{fontFamily:"'Playfair Display',serif",fontSize:26,color:C.amber}}>{s.ticker}</div>
                      <div style={{fontSize:12,color:C.muted}}>{s.name} · {s.exchange||"—"} · Mis à jour: {s.lastUpdated}</div>
                    </div>
                    <div style={{textAlign:"right"}}>
                      <div style={{fontSize:22,color:C.text}}>{s.currency}{typeof s.price==="number"?s.price.toLocaleString():s.price}</div>
                      <div style={{fontSize:11,color:vc.color}}>{vc.icon} {s.upside} upside</div>
                    </div>
                  </div>

                  {/* Badges */}
                  <div style={{display:"flex",gap:8,marginBottom:14,flexWrap:"wrap"}}>
                    <span style={{background:vc.bg,border:`1px solid ${vc.color}40`,color:vc.color,padding:"4px 12px",borderRadius:20,fontSize:10}}>{s.verdict}</span>
                    <span style={{background:`${sc}18`,color:sc,padding:"4px 12px",borderRadius:20,fontSize:10}}>{s.sector}</span>
                    {s.inHolding&&<span style={{background:"rgba(139,92,246,0.15)",color:"#a78bfa",padding:"4px 12px",borderRadius:20,fontSize:10}}>HOLDING</span>}
                    {s.inPerso&&<span style={{background:"rgba(16,185,129,0.15)",color:"#10b981",padding:"4px 12px",borderRadius:20,fontSize:10}}>PERSO</span>}
                    {s.urgency&&<span style={{background:C.amberBg,color:C.amber,padding:"4px 12px",borderRadius:20,fontSize:10}}>⚡ CATALYSEUR IMMINENT</span>}
                  </div>

                  {/* Position actuelle si en portefeuille */}
                  {pos&&(
                    <div style={{background:"rgba(0,0,0,0.4)",border:`1px solid ${pos.pnlNnRlse>=0?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,borderRadius:8,padding:"10px 16px",marginBottom:14,display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:8}}>
                      <div><div style={{fontSize:8,color:C.muted}}>QUANTITÉ</div><div style={{fontSize:13,color:C.text}}>{pos.qty}</div></div>
                      <div><div style={{fontSize:8,color:C.muted}}>PRIX ACTUEL</div><div style={{fontSize:13,color:C.text}}>{s.currency}{pos.prix}</div></div>
                      <div><div style={{fontSize:8,color:C.muted}}>PRU</div><div style={{fontSize:13,color:C.muted}}>{s.currency}{pos.pru}</div></div>
                      <div><div style={{fontSize:8,color:C.muted}}>VALEUR</div><div style={{fontSize:13,color:C.text}}>{pos.valeur.toLocaleString()}$</div></div>
                      <div><div style={{fontSize:8,color:C.muted}}>P&L</div><div style={{fontSize:13,color:pos.pnlNnRlse>=0?"#10b981":"#ef4444"}}>{pos.pnlNnRlsePct>=0?"+":""}{pos.pnlNnRlsePct}%</div></div>
                    </div>
                  )}

                  {/* Moat highlight */}
                  <div style={{background:C.amberBg,border:`1px solid ${C.amberBorder}`,borderRadius:8,padding:"10px 14px",marginBottom:14}}>
                    <div style={{fontSize:8,color:C.amber,letterSpacing:2,marginBottom:4}}>🏰 MOAT / AVANTAGE CONCURRENTIEL</div>
                    <div style={{fontSize:12,color:C.text}}>{s.moat}</div>
                  </div>

                  {/* Metrics grid */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:6,marginBottom:14}}>
                    {[{l:"P/E",v:s.pe||"N/A"},{l:"PEG",v:s.peg||"N/A"},{l:"P/S",v:s.ps||"N/A"},{l:"REV%",v:s.revGrowth},{l:"EBITDA%",v:s.ebitda},{l:"BETA",v:s.beta},{l:"MKT CAP",v:s.mktCap},{l:"NEXT EARN.",v:s.nextEarnings}].map(m=>(
                      <div key={m.l} style={{background:"rgba(0,0,0,0.4)",borderRadius:6,padding:"7px 9px"}}>
                        <div style={{fontSize:7,color:"#475569",letterSpacing:1}}>{m.l}</div>
                        <div style={{fontSize:11,color:C.text,marginTop:2}}>{m.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Entry zones */}
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:14}}>
                    {[{l:"ENTRÉE T1 (35%)",v:s.entryT1?`${s.currency}${s.entryT1}`:"—",c:"#10b981"},{l:"ENTRÉE T2 (40%)",v:s.entryT2?`${s.currency}${s.entryT2}`:"—",c:"#06b6d4"},{l:"ENTRÉE T3 (25%)",v:s.entryT3?`${s.currency}${s.entryT3}`:"—",c:"#8b5cf6"}].map(e=>(
                      <div key={e.l} style={{background:"rgba(0,0,0,0.4)",border:`1px solid ${e.c}25`,borderRadius:6,padding:"9px 11px"}}>
                        <div style={{fontSize:7,color:C.muted,letterSpacing:1}}>{e.l}</div>
                        <div style={{fontSize:13,color:e.c,marginTop:3}}>{e.v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Targets */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                    <div style={{background:"rgba(16,185,129,0.05)",border:"1px solid rgba(16,185,129,0.2)",borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:8,color:C.muted,letterSpacing:1}}>CIBLE 12 MOIS</div>
                      <div style={{fontSize:18,color:"#10b981",marginTop:4}}>{s.currency}{s.target12m} <span style={{fontSize:11}}>({s.upside})</span></div>
                    </div>
                    <div style={{background:"rgba(139,92,246,0.05)",border:"1px solid rgba(139,92,246,0.2)",borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:8,color:C.muted,letterSpacing:1}}>CIBLE 3 ANS</div>
                      <div style={{fontSize:18,color:"#8b5cf6",marginTop:4}}>{s.currency}{s.target3y}</div>
                    </div>
                  </div>

                  {/* Risk + Analysis */}
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
                    <div style={{background:"rgba(239,68,68,0.04)",border:"1px solid rgba(239,68,68,0.15)",borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:8,color:"#ef4444",letterSpacing:2,marginBottom:6}}>⚠️ RISQUE PRINCIPAL</div>
                      <div style={{fontSize:11,color:C.sub,lineHeight:1.6}}>{s.risk}</div>
                    </div>
                    <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"10px 14px"}}>
                      <div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:6}}>⚡ CATALYSEURS</div>
                      <div style={{fontSize:11,color:C.sub,lineHeight:1.6}}>{s.catalysts}</div>
                    </div>
                  </div>

                  {/* Note */}
                  <div style={{background:"rgba(0,0,0,0.3)",borderRadius:8,padding:"12px 14px",marginBottom:12}}>
                    <div style={{fontSize:8,color:C.muted,letterSpacing:2,marginBottom:6}}>ANALYSE</div>
                    <div style={{fontSize:11,color:C.sub,lineHeight:1.7}}>{s.note}</div>
                  </div>

                  {/* Consensus */}
                  <div style={{fontSize:10,color:C.muted,marginBottom:16}}>
                    <span style={{color:"#475569",fontSize:8,letterSpacing:1}}>CONSENSUS : </span>{s.consensus}
                  </div>

                  {/* CTA */}
                  <div style={{display:"flex",gap:8}}>
                    <button onClick={()=>updateFull(s.ticker)} disabled={isLoad} style={{flex:2,background:C.amberBg,border:`1px solid ${C.amberBorder}`,color:C.amber,padding:"11px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",opacity:isLoad ? 0.5 : 1}}>
                      {isLoad?"⟳ Analyse en cours...":"⟳ ACTUALISER ANALYSE COMPLÈTE"}
                    </button>
                    <button onClick={()=>setSelected(null)} style={{flex:1,background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"11px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>FERMER</button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* ══ ADD MODAL ══ */}
      {showAdd&&(
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.88)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowAdd(false)}>
          <div style={{background:"#0d0f16",border:"1px solid rgba(16,185,129,0.3)",borderRadius:14,padding:28,maxWidth:460,width:"100%"}} onClick={e=>e.stopPropagation()}>
            <div style={{fontFamily:"'Playfair Display',serif",fontSize:20,color:"#10b981",marginBottom:6}}>Analyser un titre</div>
            <div style={{fontSize:11,color:C.muted,marginBottom:18}}>L'IA fait une analyse complète en temps réel</div>
            <input placeholder="Ticker (ex: AXON, ARM, CRWV, IONQ...)" value={newTicker} onChange={e=>setNewTicker(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&addAndAnalyze()}
              style={{width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${C.border}`,color:C.text,padding:"12px 14px",borderRadius:8,fontSize:15,fontFamily:"inherit",outline:"none",marginBottom:14,boxSizing:"border-box"}}/>
            <div style={{display:"flex",gap:8}}>
              <button onClick={addAndAnalyze} disabled={loadingAdd||!newTicker} style={{flex:1,background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.35)",color:"#10b981",padding:"11px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit",opacity:(loadingAdd||!newTicker) ? 0.5 : 1}}>
                {loadingAdd?"⟳ Analyse...":"🔍 ANALYSER ET AJOUTER"}
              </button>
              <button onClick={()=>setShowAdd(false)} style={{background:"transparent",border:`1px solid ${C.border}`,color:C.muted,padding:"11px 18px",borderRadius:8,cursor:"pointer",fontSize:12,fontFamily:"inherit"}}>✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
