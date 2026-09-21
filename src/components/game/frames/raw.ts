/**
 * Raw frame catalogue: the 64 renderers of the `F` array of
 * tools/rewards-proposal/frames-preview.html, kept in their original compact
 * form (short keys, markup strings) so they stay diffable against the
 * validated reference. Use the typed `FRAMES` export of `./catalog` instead.
 */
import {
  P, n2, R, pt, rep, circ, bevel, glint, polyRing, spike, shard, blade, leaf, flame, star4, star5, gem, orb,
  rivets, crown, wings, laurel, plate, RUNES, runes, dots, arc, fx, box, rr, sqBevel, sqGlint, corners, mir,
  edges, fxSq, kite, hud, cup,
  type FxSpec, type Pt,
} from './geometry';

export interface RawFrame {
  id: string;
  fr: string;
  en: string;
  t: string;
  lvl?: number;
  sq?: 1;
  tmp?: string;
  u: string;
  a: 'aucune' | 'subtile' | 'forte';
  fx?: () => FxSpec;
  under?: (variant?: string) => string;
  over?: (variant?: string) => string;
}

/** Plate text of the per-season variants (`S<n>` -> `SAISON <n>`). */
export function seasonPlate(variant: string | undefined, fallback: string): string {
  const m = /^S(\d{1,3})$/.exec(variant || '');
  return m ? `SAISON ${Number(m[1])}` : fallback;
}
/** Plate width grows with the text (reference: 38 for 8 characters). */
const plateW = (txt: string, min: number): number => Math.max(min, 38 + Math.max(0, txt.length - 8) * 5);

export const RAW: RawFrame[] = [
/* ---- Level frames ---- */
{id:'recrue',fr:'Recrue',en:'Recruit',t:'bronze',lvl:1,u:'Niveau 1',a:'aucune',
 over:()=>bevel(48,6,'g-bronze')+rivets(8,48,'#ffe0c2',1.5,22.5)},
{id:'bronze_forge',fr:'Bronze forgé',en:'Forged Bronze',t:'bronze',lvl:10,u:'Niveau 10',a:'aucune',
 over:()=>polyRing(8,54,5.5,'g-bronze',22.5)+bevel(47,4,'g-bronze')+[0,90,180,270].map(d=>{const[x,y]=P(55,d);return `<rect x="${n2(x-4)}" y="${n2(y-4)}" width="8" height="8" transform="rotate(45 ${n2(x)} ${n2(y)})" fill="url(#g-bronze)" stroke="#2a1405" stroke-width=".9"/><circle cx="${n2(x)}" cy="${n2(y)}" r="1.4" fill="#ffe0c2"/>`;}).join('')},
{id:'argent_lames',fr:"Lames d'argent",en:'Silver Blades',t:'argent',lvl:20,u:'Niveau 20',a:'subtile',
 under:()=>[45,135,225,315].map(d=>blade(d,44,64,10,'url(#g-silver)')).join(''),
 over:()=>bevel(48,6,'g-silver')+glint(48,2.2)},
{id:'argent_aile',fr:"Aile d'argent",en:'Silver Wing',t:'argent',lvl:30,u:'Niveau 30',a:'subtile',
 under:()=>wings('g-silver',{n:3,A:[102,62],L0:30,L1:22,a0:-55,a1:15,w:6},false),
 over:()=>bevel(48,6,'g-silver')+gem(64,15,6.5,'g-sapph')+glint(48,2.2,5)},
{id:'or_couronne',fr:"Couronne d'or",en:'Golden Crown',t:'or',lvl:40,u:'Niveau 40',a:'subtile',
 over:()=>bevel(48,7,'g-gold')+glint(48,2.4)+crown(64,1,34,19,'g-gold','g-ruby')+orb(...P(48,90),3.4,'g-ruby')+orb(...P(48,270),3.4,'g-ruby')},
{id:'or_soleil',fr:"Soleil d'or",en:'Golden Sun',t:'or',lvl:50,u:'Niveau 50',a:'subtile',
 under:()=>`<g class="spin" style="--d:40s">${rep(16,(d,i)=>spike(d,44,i%2?57:64,6,'url(#g-gold)'))}</g>`,
 over:()=>bevel(48,7,'g-gold')+rivets(4,48,'#fff4c2',1.6,0)},
{id:'platine_cristal',fr:'Cristal de platine',en:'Platinum Crystal',t:'platine',lvl:60,u:'Niveau 60',a:'subtile',
 over:()=>polyRing(6,56,5,'g-plat',0)+bevel(47,4,'g-plat')+[0,120,240].map((d,i)=>{const[x,y]=P(57,d);return gem(n2(x),n2(y),8.5,'g-sapph',d)+star4(n2(x+6),n2(y-6),4,'#fff','tw',i*.8);}).join('')},
{id:'platine_runes',fr:'Runes de platine',en:'Platinum Runes',t:'platine',lvl:70,u:'Niveau 70',a:'subtile',
 under:()=>`<circle cx="64" cy="64" r="54.5" fill="none" stroke="#0c1a26" stroke-width="10" opacity=".85"/>`,
 over:()=>circ(59.5,'url(#g-plat)',1.8)+circ(49.6,'url(#g-plat)',1.8)+`<g class="spin" style="--d:48s" filter="url(#glow)">${runes(18,54.5,'#cdefff',.95)}</g>`+bevel(46.5,4,'g-plat')},
{id:'diamant_eclat',fr:'Éclat de diamant',en:'Diamond Shard',t:'diamant',lvl:80,u:'Niveau 80',a:'subtile',
 under:()=>rep(12,(d,i)=>shard(d,44,i%2?57:64,i%2?4:5,'url(#g-diamond)')),
 over:()=>bevel(48,6,'g-diamond')+star4(100,24,5,'#fff','tw',0)+star4(22,34,4,'#e0fbff','tw',.9)+star4(96,106,4,'#fff','tw',1.7)},
{id:'diamant_givre',fr:'Givre de diamant',en:'Diamond Frost',t:'diamant',lvl:90,u:'Niveau 90',a:'subtile',
 under:()=>`<circle class="pulse" cx="64" cy="64" r="64" fill="url(#g-halo)"/>`+`<g filter="url(#glow)" stroke="url(#g-ice)" stroke-linecap="round" fill="none">${rep(6,d=>`<polyline points="${pt(46,d)} ${pt(63,d)}" stroke-width="3"/><polyline points="${pt(53,d)} ${pt(58,d-7)}" stroke-width="2"/><polyline points="${pt(53,d)} ${pt(58,d+7)}" stroke-width="2"/><polyline points="${pt(58,d)} ${pt(61.5,d-5)}" stroke-width="1.6"/><polyline points="${pt(58,d)} ${pt(61.5,d+5)}" stroke-width="1.6"/>`,30)}</g>`,
 over:()=>bevel(48,6,'g-ice')+rep(6,d=>{const[x,y]=P(48,d);return `<circle cx="${n2(x)}" cy="${n2(y)}" r="1.7" fill="#fff"/>`;},30)},
{id:'epique_arcane',fr:'Arcane épique',en:'Epic Arcana',t:'epique',lvl:100,u:'Niveau 100',a:'forte',
 under:()=>`<g class="spin" style="--d:18s">${circ(56,'url(#g-mythic)',1.6,'stroke-dasharray="3 3.5"')}</g>`,
 over:()=>bevel(48,6,'g-violet')+`<g class="spin" style="--d:5s" filter="url(#glow)">${rep(3,d=>{const[x,y]=P(59,d);return `<circle cx="${n2(x)}" cy="${n2(y)}" r="2.6" fill="#7df3ff"/>`;})}</g><g class="spinr" style="--d:8s" filter="url(#glow)">${rep(4,d=>{const[x,y]=P(53,d);return `<circle cx="${n2(x)}" cy="${n2(y)}" r="2" fill="#e9d5ff"/>`;},45)}</g>`+[45,135,225,315].map((d,i)=>{const[x,y]=P(62,d);return star4(n2(x),n2(y),4.5,'#f5e9ff','tw',i*.6);}).join('')},
{id:'epique_tempete',fr:'Tempête épique',en:'Epic Storm',t:'epique',lvl:115,u:'Niveau 115',a:'forte',
 under:()=>`<g class="spin" style="--d:2.6s">${circ(54,'#5ee6ff',1.4,'stroke-dasharray="7 9 2 12" opacity=".75" filter="url(#glow)"')}</g>`,
 over:()=>bevel(48,6.5,'g-storm')+circ(48,'#a78bfa',1,'opacity=".6"')+rep(6,(d,i)=>`<polyline class="bolt" style="animation-delay:${n2(i*.37)}s" points="${pt(49,d)} ${pt(55,d+7)} ${pt(56,d-2)} ${pt(64,d+4)}" fill="none" stroke="#e0fbff" stroke-width="2" stroke-linejoin="round" filter="url(#glow2)"/>`,15)+rep(6,d=>{const[x,y]=P(48,d);return `<circle cx="${n2(x)}" cy="${n2(y)}" r="1.6" fill="#7df3ff"/>`;},15)},
{id:'legende_flamme',fr:'Flamme légendaire',en:'Legendary Flame',t:'legende',lvl:130,u:'Niveau 130',a:'forte',
 under:()=>[0,1,2].map(k=>`<g class="flick" style="animation-delay:${k*.23}s">${rep(6,(d,i)=>flame(d,45,14+((i+k)%3)*3,6,(i%2?5:-5),'url(#g-flame)'),k*20)}</g>`).join(''),
 over:()=>bevel(48,6,'g-ember')+`<g class="spin" style="--d:9s">${dots(7,52,60,['#ffd27a','#ff8a3d'],[1.1,.8])}</g>`},
{id:'legende_ailes',fr:'Ailes légendaires',en:'Legendary Wings',t:'legende',lvl:150,u:'Niveau 150',a:'forte',
 under:()=>wings('g-gold',{n:5,A:[100,62],L0:46,L1:26,a0:-72,a1:30,w:7.5}),
 over:()=>bevel(48,7,'g-gold')+gem(64,14,9,'g-ruby')+star4(64,3,3.5,'#fff','tw',0)},
{id:'mythe_nebuleuse',fr:'Nébuleuse mythique',en:'Mythic Nebula',t:'mythe',lvl:170,u:'Niveau 170',a:'forte',
 fx:()=>fx('#ff4655,#a855f7,#00d4ff,#ff4655',5),
 over:()=>bevel(48,5,'g-mythic')+[[104,22],[18,40],[110,78],[30,110],[80,120],[58,6]].map(([x,y],i)=>star4(x,y,i%2?3.2:4.6,i%3?'#fff':'#ffd1f0','tw',i*.45)).join('')},
{id:'mythe_gardien',fr:'Gardien céleste',en:'Celestial Warden',t:'mythe',lvl:185,u:'Niveau 185',a:'forte',
 under:()=>rep(8,(d,i)=>spike(d,44,i%2?56:62,7,'url(#g-violet)'),22.5)+`<g class="spin" style="--d:12s"><ellipse cx="64" cy="64" rx="62" ry="20" fill="none" stroke="url(#g-mythic)" stroke-width="2" opacity=".9" transform="rotate(-24 64 64)" filter="url(#glow)"/></g><g class="spinr" style="--d:16s"><ellipse cx="64" cy="64" rx="60" ry="15" fill="none" stroke="#7df3ff" stroke-width="1.2" opacity=".7" transform="rotate(30 64 64)"/></g>`,
 over:()=>bevel(48,6,'g-mythic')+crown(64,2,30,17,'g-violet','g-sapph')},
{id:'souverain_aube',fr:"Souverain de l'aube",en:'Dawn Sovereign',t:'mythe',lvl:200,u:'Niveau 200',a:'forte',
 fx:()=>fx('#f6c453,#ff4655,#a855f7,#00d4ff,#f6c453',4.5),
 under:()=>wings('g-mythic',{n:5,A:[100,64],L0:46,L1:26,a0:-70,a1:32,w:7.5}),
 over:()=>bevel(48,7,'g-gold')+circ(44.4,'url(#g-mythic)',1.4)+`<g class="spin" style="--d:6s" filter="url(#glow)">${rep(5,(d,i)=>{const[x,y]=P(57,d);return `<circle cx="${n2(x)}" cy="${n2(y)}" r="${i%2?1.4:2.2}" fill="${i%2?'#7df3ff':'#fff3c4'}"/>`;})}</g>`+crown(64,0,38,20,'g-gold','g-ruby')+gem(64,112,7.5,'g-sapph')},

/* ---- Achievement frames ---- */
{id:'etoile_arene',fr:"Étoile de l'arène",en:'Arena Star',t:'epique',u:'Succès « Étoile de l\'arène » (10 MVP)',a:'subtile',
 under:()=>`<g opacity=".9">${[-50,-30,-10,10,30,50].map(o=>spike(o,40,64,3.2,'url(#g-gold)','opacity=".85"')).join('')}</g>`,
 over:()=>bevel(48,6,'g-gold')+`<g filter="url(#glow)">${star5(64,13,13,5.5,'url(#g-gold)','class="beat"')}</g>`+star5(38,20,4.5,2,'url(#g-gold)')+star5(90,20,4.5,2,'url(#g-gold)')},
{id:'des_destin',fr:'Dés du destin',en:'Dice of Fate',t:'epique',u:'Succès « Champion du draft »',a:'subtile',
 over:()=>bevel(48,6,'g-diamond')+`<g class="spin" style="--d:28s">${rep(4,(d,i)=>{const[x,y]=P(57,d);const pips=[[0,0],[-2.2,-2.2,2.2,2.2],[-2.2,-2.2,0,0,2.2,2.2],[-2.2,-2.2,2.2,-2.2,-2.2,2.2,2.2,2.2]][i];let pp='';for(let k=0;k<pips.length;k+=2)pp+=`<circle cx="${pips[k]}" cy="${pips[k+1]}" r="1.05" fill="#0b0f1c"/>`;return `<g transform="translate(${n2(x)} ${n2(y)}) rotate(${d+18})" filter="url(#drop)"><rect x="-5.5" y="-5.5" width="11" height="11" rx="2.4" fill="url(#g-silver)" stroke="#04060c" stroke-width=".8"/>${pp}</g>`;},45)}</g>`},
{id:'porte_voix',fr:'Porte-voix',en:'Megaphone',t:'epique',u:'Succès « Voix de la communauté » (500 likes)',a:'subtile',
 under:()=>[0,1,2].map(k=>`<g class="wave" style="animation-delay:${k*.8}s">${arc(53,55,125,'#00d4ff',2.4,'stroke-linecap="round"')}${arc(53,235,305,'#a855f7',2.4,'stroke-linecap="round"')}</g>`).join('')+arc(57,60,120,'url(#g-sapph)',2,'stroke-linecap="round" opacity=".6"')+arc(57,240,300,'url(#g-amethyst)',2,'stroke-linecap="round" opacity=".6"'),
 over:()=>bevel(48,6,'g-party')+rivets(6,48,'#e0fbff',1.3,0)},
{id:'echiquier_stratege',fr:'Échiquier du stratège',en:"Strategist's Board",t:'epique',u:'Succès « Cerveau du draft » (100 drafts)',a:'subtile',
 over:()=>circ(48,'#04060c',8.6,'opacity=".75"')+arc(48,0.5,179.5,'#ff4655',6)+arc(48,180.5,359.5,'#2b8cff',6)+circ(45.6,'rgba(255,255,255,.45)',.8)+
   [0,1,2].map(k=>`<g class="chev" style="animation-delay:${k*.25}s"><polyline points="${n2(8+k*5)} 56 ${n2(13+k*5)} 64 ${n2(8+k*5)} 72" fill="none" stroke="#7fb8ff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><polyline points="${n2(120-k*5)} 56 ${n2(115-k*5)} 64 ${n2(120-k*5)} 72" fill="none" stroke="#ff8a95" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></g>`).join('')+
   [[64,8],[64,120]].map(([x,y])=>`<g filter="url(#drop)"><circle cx="${x}" cy="${y}" r="6" fill="#0b0f1c" stroke="url(#g-silver)" stroke-width="1.4"/><path d="M${x-2.6} ${y-2.6}L${x+2.6} ${y+2.6}M${x+2.6} ${y-2.6}L${x-2.6} ${y+2.6}" stroke="#eef2f8" stroke-width="1.6" stroke-linecap="round"/></g>`).join('')},
{id:'intouchable',fr:'Intouchable',en:'Untouchable',t:'legende',u:'Succès « Intouchable » (10 victoires d\'affilée)',a:'forte',
 under:()=>[0,1].map(k=>`<g class="flick" style="animation-delay:${k*.3}s">${rep(8,(d,i)=>flame(d,45,13+((i+k)%3)*3.5,7,(i%2?4:-4),'url(#g-bflame)'),k*22.5)}</g>`).join(''),
 over:()=>bevel(48,6,'g-steel')+glint(48,2.2,3.5)},
{id:'lauriers_tournoi',fr:'Lauriers du tournoi',en:'Tournament Laurels',t:'legende',u:'Succès « Vainqueur de tournoi »',a:'subtile',
 under:()=>laurel(-1,'g-gold')+laurel(1,'g-gold'),
 over:()=>bevel(47,5,'g-gold')+glint(47,2)+`<g filter="url(#drop)"><path d="M46 108h36l-4 6 4 6H46l4-6z" fill="url(#g-ruby)" stroke="#04060c" stroke-width=".9"/>${star5(64,114,4.5,1.9,'#fff3c4')}</g>`},
{id:'reliquaire',fr:'Reliquaire',en:'Reliquary',t:'legende',u:'Succès « Collectionneur » (50 succès)',a:'subtile',
 over:()=>bevel(48,7.5,'g-gold')+rep(10,(d,i)=>{const[x,y]=P(48,d);const g=['g-silver','g-sapph','g-amethyst','g-gold','g-ruby'][i%5];return orb(x,y,3.3,g,`class="lit" style="animation-delay:${n2(i*.3)}s"`);},18)},
{id:'sceau_fidelite',fr:'Sceau de fidélité',en:'Seal of Loyalty',t:'legende',u:'Succès « Inconditionnel » (365 connexions)',a:'subtile',
 under:()=>`<g class="spin" style="--d:60s">${circ(58,'#f2b544',1.8,'stroke-dasharray="1.2 3.4" stroke-linecap="round"')}</g>`,
 over:()=>bevel(48,6,'g-gold')+rep(12,(d,i)=>`<polyline points="${pt(52,d)} ${pt(i%3?55:57,d)}" stroke="#fff3c4" stroke-width="${i%3?1.2:2}" stroke-linecap="round"/>`)+`<g filter="url(#drop)"><path d="M64 100c5 0 7 2.5 9.5 3.4 2.6 1 4.8 3.4 4.3 6.3-.4 2.6 1.2 5.2-.8 7.6-2 2.3-5 1.9-7.4 3.6-2.3 1.6-3.6 3.4-5.6 3.4s-3.3-1.8-5.6-3.4c-2.4-1.7-5.4-1.3-7.4-3.6-2-2.4-.4-5-.8-7.6-.5-2.9 1.7-5.3 4.3-6.3C57 102.5 59 100 64 100z" fill="url(#g-ruby)" stroke="#3b0710" stroke-width=".8"/><text x="64" y="115" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="8" fill="#fff3c4">365</text></g>`},
{id:'chasseur_trophees',fr:'Chasseur de trophées',en:'Trophy Hunter',t:'mythe',u:'Succès « Chasseur de trophées » (3 tournois)',a:'forte',
 fx:()=>fx('#fff3c4,#f2b544,#9a5b12,#f2b544,#fff3c4',3.8),
 under:()=>laurel(-1,'g-gold',53)+laurel(1,'g-gold',53),
 over:()=>bevel(47,6,'g-gold')+[-22,0,22].map((d,i)=>{const[x,y]=P(58,d);return `<g filter="url(#glow)">${star5(n2(x),n2(y),i==1?8:6,i==1?3.3:2.5,'url(#g-gold)',`class="beat" style="animation-delay:${i*.35}s"`)}</g>`;}).join('')},
{id:'sommet_mythique',fr:'Sommet mythique',en:'Mythic Summit',t:'mythe',u:'Succès « Sommet mythique » (rang Mythique Immortel)',a:'forte',
 under:()=>`<g transform="translate(0 -8)"><g class="flick">${[[40,12],[64,2],[88,12]].map(([x,y])=>`<path d="M${x-6} ${y+6}Q${x-3} ${y-4} ${x} ${y-9}Q${x+3} ${y-4} ${x+6} ${y+6}Z" fill="url(#g-flame)"/>`).join('')}</g><path d="M22 36L40 14L50 26L64 6L78 26L88 14L106 36Z" fill="url(#g-ember)" stroke="#04060c" stroke-width="1" stroke-linejoin="round"/><path d="M36 19L40 14L44 19ZM59 12L64 6L69 12ZM84 19L88 14L92 19Z" fill="#fff1e6"/></g>`+`<g class="spin" style="--d:7s">${dots(8,52,62,['#ffb020','#ff4655','#ffd27a'],[1.2,.9,1.4])}</g>`,
 over:()=>bevel(48,6.5,'g-ember')+circ(44.6,'#ff4655',1.2,'opacity=".8"')+gem(64,114,7,'g-ruby')},

/* ---- Special frames ---- */
{id:'champion_saison',fr:'Champion de saison',en:'Season Champion',t:'champion',u:'Succès « Champion de saison » (variante par saison)',a:'forte',
 fx:()=>fx('#fff3c4,#f2b544,#b87a1c,#fff3c4,#f2b544,#fff3c4',4),
 under:()=>laurel(-1,'g-gold',55)+laurel(1,'g-gold',55),
 over:(v)=>{const txt=seasonPlate(v,'CHAMPION');return bevel(48,8,'g-gold')+glint(48,2.6,3.2)+crown(64,-2,44,23,'g-gold','g-ruby')+plate(txt,'g-gold','#fff3c4',plateW(txt,38));}},
{id:'dynastie',fr:'Dynastie',en:'Dynasty',t:'champion',u:'Succès « Dynastie » (2 saisons remportées)',a:'forte',
 fx:()=>fx('#f2b544,#a855f7,#f2b544,#a855f7,#f2b544',3.6),
 over:()=>bevel(48,8,'g-gold')+circ(44.6,'url(#g-violet)',1.4)+`<g transform="translate(0 -3)" opacity=".95">${crown(64,-2,50,22,'g-violet',null)}</g>`+crown(64,4,36,20,'g-gold','g-ruby')+orb(...P(48,120),3.2,'g-amethyst')+orb(...P(48,240),3.2,'g-amethyst')+plate('× 2','g-gold','#fff3c4',24)},
{id:'mvp_saison',fr:'MVP de saison',en:'Season MVP',t:'mvp',u:'Succès « MVP de la saison » (variante par saison)',a:'forte',
 under:()=>`<circle class="pulse" cx="64" cy="64" r="62" fill="url(#g-halo)"/>`+wings('g-mvp',{n:5,A:[100,62],L0:44,L1:26,a0:-70,a1:30,w:7}),
 over:(v)=>bevel(48,7,'g-mvp')+`<g filter="url(#glow)">${star5(64,12,12,5,'url(#g-gold)','class="beat"')}</g>`+(v=>{const txt=seasonPlate(v,'MVP');return plate(txt,'g-mvp','#fff3c4',txt==='MVP'?28:plateW(txt,38));})(v)},
{id:'voie_gold',fr:"Voie de l'or",en:'Gold Lane',t:'role',u:'Distinction « Meilleur Gold Lane »',a:'subtile',
 over:()=>bevel(48,6,'g-gold')+glint(48,2)+rep(8,d=>{const[x,y]=P(56,d);return `<g filter="url(#drop)"><circle cx="${n2(x)}" cy="${n2(y)}" r="5.2" fill="url(#g-gold)" stroke="#5a3508" stroke-width=".9"/><circle cx="${n2(x)}" cy="${n2(y)}" r="3.2" fill="none" stroke="#fff3c4" stroke-width=".7"/><path d="M${n2(x)} ${n2(y-2)}V${n2(y+2)}" stroke="#7a4a0c" stroke-width="1.1"/></g>`;},22.5)},
{id:'voie_mid',fr:'Voie du milieu',en:'Mid Lane',t:'role',u:'Distinction « Meilleur Mid Lane »',a:'subtile',
 under:()=>`<g class="spinr" style="--d:40s" opacity=".85">${runes(12,57,'#c4b5fd',.8)}</g>`,
 over:()=>bevel(48,6,'g-violet')+`<g class="spin" style="--d:9s" filter="url(#glow)">${rep(3,(d,i)=>orb(...P(55,d),4.2,i%2?'g-sapph':'g-amethyst'))}</g>`},
{id:'voie_jungle',fr:'Voie de la jungle',en:'Jungle',t:'role',u:'Distinction « Meilleur Jungler »',a:'subtile',
 under:()=>`<g class="sway">${rep(14,(d,i)=>leaf(P(45,d),P(i%2?59:63,d+(i%2?10:-8)),4.2,'url(#g-jungle)','stroke="#04260f" stroke-width=".7"'))}</g>`,
 over:()=>bevel(48,6,'g-jungle')+`<g stroke="#e9ffe0" stroke-width="2.6" stroke-linecap="round" fill="none" filter="url(#drop)"><path d="M92 86q8 6 13 17"/><path d="M87 92q7 6 11 16"/><path d="M82 97q6 6 9 15"/></g>`},
{id:'voie_roam',fr:'Voie du roam',en:'Roam',t:'role',u:'Distinction « Meilleur Roamer »',a:'subtile',
 under:()=>`<path d="M64 3L113 16L111 62Q107 100 64 124Q21 100 17 62L15 16Z" fill="url(#g-roam)" stroke="#04060c" stroke-width="1.4" stroke-linejoin="round"/><path d="M64 9L107 20L105 62Q101 95 64 117Q27 95 23 62L21 20Z" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="1"/>`+[[22,22],[106,22],[64,118],[30,90],[98,90]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="1.8" fill="#e0f0ff" stroke="#0b1a45" stroke-width=".6"/>`).join(''),
 over:()=>bevel(48,5,'g-silver')+glint(48,2,4)},
{id:'voie_exp',fr:"Voie de l'EXP",en:'EXP Lane',t:'role',u:'Distinction « Meilleur EXP Lane »',a:'subtile',
 under:()=>[45,-45].map(r=>`<g transform="rotate(${r} 64 64)"><polygon points="64,0 70,12 70,104 58,104 58,12" fill="url(#g-steel)" stroke="#04060c" stroke-width="1" stroke-linejoin="round"/><line x1="64" y1="4" x2="64" y2="102" stroke="rgba(255,255,255,.6)" stroke-width=".8"/><rect x="52" y="104" width="24" height="5" rx="1.5" fill="url(#g-exp)" stroke="#04060c" stroke-width=".8"/><rect x="61" y="109" width="6" height="14" rx="1.5" fill="#4a1a0a" stroke="#04060c" stroke-width=".8"/></g>`).join(''),
 over:()=>bevel(48,6.5,'g-exp')+glint(48,2.2,4.8)},
{id:'fondateur',fr:'Fondateur',en:'Founder',t:'fondateur',u:'Succès « Pionnier » ou attribution admin',a:'subtile',
 over:()=>bevel(48,6.5,'g-teal')+glint(48,2.2,5)+rivets(6,48,'#f2d27a',1.4,30)+`<g filter="url(#drop)"><polygon points="52,2 76,2 71,22 57,22" fill="url(#g-gold)" stroke="#04060c" stroke-width="1" stroke-linejoin="round"/><polyline points="57,22 64,16 71,22" fill="none" stroke="#5a3508" stroke-width=".9"/>${star5(64,10,4.6,2,'#0f766e')}</g>`},
{id:'independance',fr:'27 Avril',en:'Independence',t:'event',u:'Succès « 27 Avril » (connexion le jour de la fête de l\'Indépendance)',a:'subtile',
 over:()=>circ(48,'#04060c',9.6,'opacity=".75"')+circ(48,'url(#g-togo)',7)+circ(44.8,'rgba(255,255,255,.45)',.8)+`<g filter="url(#drop)"><rect x="52" y="1" width="24" height="22" rx="3" fill="#d21034" stroke="#04060c" stroke-width="1"/>${star5(64,12.5,7.5,3,'#ffffff','class="beat"')}</g>`},
{id:'harmattan',fr:'Harmattan',en:'Harmattan',t:'event',u:'Succès « Souffle de l\'harmattan » (décembre à janvier)',a:'subtile',
 under:()=>`<circle class="pulse" cx="64" cy="10" r="16" fill="url(#g-sun)"/>`+`<g class="spin" style="--d:14s">${dots(22,51,63,['#e8b86a','#c98a3c','#f6dcaa'],[1,1.5,.8,1.9])}</g><g class="spinr" style="--d:22s" opacity=".7">${arc(58,20,110,'#d69a4a',1.2,'stroke-linecap="round" stroke-dasharray="10 4"')}${arc(58,200,290,'#d69a4a',1.2,'stroke-linecap="round" stroke-dasharray="10 4"')}</g>`,
 over:()=>bevel(48,6,'g-ochre')},
{id:'anniversaire',fr:'Anniversaire',en:'Anniversary',t:'event',u:'Succès « Anniversaire » (semaine anniversaire du site)',a:'forte',
 under:()=>`<g class="spin" style="--d:10s">${Array.from({length:14},(_,i)=>{const d=i*25.7,[x,y]=P(55+(i%3)*3,d);const c=['#00d4ff','#a855f7','#f2b544','#ff4655','#22c55e'][i%5];return `<rect x="${n2(x-1.6)}" y="${n2(y-3)}" width="3.2" height="6" rx=".8" fill="${c}" transform="rotate(${n2(d*2.3)} ${n2(x)} ${n2(y)})"/>`;}).join('')}</g>`,
 over:()=>bevel(48,6.5,'g-party')+`<g filter="url(#drop)">${leaf([64,14],[48,4],5,'url(#g-ruby)','stroke="#3b0710" stroke-width=".8"')}${leaf([64,14],[80,4],5,'url(#g-ruby)','stroke="#3b0710" stroke-width=".8"')}${leaf([64,14],[54,26],2.8,'url(#g-ruby)','stroke="#3b0710" stroke-width=".7"')}${leaf([64,14],[74,26],2.8,'url(#g-ruby)','stroke="#3b0710" stroke-width=".7"')}<circle cx="64" cy="14" r="4" fill="url(#g-ruby)" stroke="#3b0710" stroke-width=".8"/></g>`+star4(22,28,4,'#fff','tw',.2)+star4(108,98,4,'#fff','tw',1.1)}
,

/* ---- Square level frames ---- */
{id:'ecu_bronze',fr:'Écu de bronze',en:'Bronze Plate',t:'bronze',lvl:5,sq:1,u:'Niveau 5',a:'aucune',
 over:()=>sqBevel(17,7,'g-bronze',9)+edges(`${[40,52,76,88].map(x=>`<circle cx="${x}" cy="17" r="1.5" fill="#ffe0c2" stroke="#2a1405" stroke-width=".6"/>`).join('')}<rect x="60" y="13" width="8" height="8" transform="rotate(45 64 17)" fill="url(#g-bronze)" stroke="#2a1405" stroke-width=".9"/>`)+corners(`<g filter="url(#drop)"><circle cx="16" cy="16" r="7.5" fill="url(#g-bronze)" stroke="#2a1405" stroke-width="1"/><circle cx="16" cy="16" r="4.4" fill="none" stroke="#ffe0c2" stroke-width=".8" opacity=".7"/><circle cx="16" cy="16" r="2" fill="#ffe0c2"/></g>`)},
{id:'argent_filigrane',fr:"Filigrane d'argent",en:'Silver Filigree',t:'argent',lvl:25,sq:1,u:'Niveau 25',a:'subtile',
 over:()=>{const c='M18 46C9 42 5 31 9 22C12 15 19 15 20 20C21 24 17 27 14.5 24.5M46 18C42 9 31 5 22 9C15 12 15 19 20 20C24 21 27 17 24.5 14.5';
  return sqBevel(17,6,'g-silver',12)+sqGlint(17,6,12,5)+corners(`<path d="${c}" fill="none" stroke="#04060c" stroke-width="4.6" stroke-linecap="round" opacity=".75"/><path d="${c}" fill="none" stroke="url(#g-silver)" stroke-width="2.5" stroke-linecap="round"/><path d="M1.5 1.5L12.5 6.5L9 9L6.5 12.5Z" fill="url(#g-silver)" stroke="#04060c" stroke-width=".8" stroke-linejoin="round"/>`)+[[12,12],[116,12],[12,116],[116,116]].map(([x,y])=>orb(x,y,2.6,'g-sapph')).join('')+edges(`<circle cx="64" cy="17" r="2.5" fill="url(#g-sapph)" stroke="#04060c" stroke-width=".7"/>`);}},
{id:'or_gemmes',fr:"Écrin d'or",en:'Golden Casket',t:'or',lvl:45,sq:1,u:'Niveau 45',a:'subtile',
 over:()=>sqBevel(17,7.5,'g-gold',9)+sqGlint(17,7.5,9,4.2)+edges(`<path d="M50 17H78" stroke="#fff4c2" stroke-width="1" opacity=".5"/><circle cx="64" cy="17" r="2.2" fill="#fff4c2" stroke="#5a3508" stroke-width=".6"/>`)+([[16,16,'g-ruby'],[112,16,'g-sapph'],[16,112,'g-emerald'],[112,112,'g-amethyst']] as [number,number,string][]).map(([x,y,g])=>`<g filter="url(#drop)"><rect x="${x-10}" y="${y-10}" width="20" height="20" rx="4" transform="rotate(45 ${x} ${y})" fill="url(#g-gold)" stroke="#04060c" stroke-width="1"/><rect x="${x-6.5}" y="${y-6.5}" width="13" height="13" rx="2" transform="rotate(45 ${x} ${y})" fill="#1a1206" stroke="#fff4c2" stroke-width=".7"/></g>${gem(x,y,7,g)}`).join('')+star4(24,6,3.6,'#fff','tw',0)+star4(122,100,3.6,'#fff','tw',1.3)},
{id:'platine_runique',fr:'Bastion runique',en:'Runic Bastion',t:'platine',lvl:65,sq:1,u:'Niveau 65',a:'subtile',
 over:()=>rr(15,9,'#04060c',14.6,'opacity=".7"')+rr(15,9,'#0c1a26',12)+rr(9.2,14,'url(#g-plat)',1.8)+rr(20.8,4,'url(#g-plat)',1.8)+edges(k=>`<g filter="url(#glow)">${[35,47,59,71,83,95].map((x,i)=>`<path class="lit" style="animation-delay:${n2((k*6+i)*.12)}s" d="${RUNES[(k*3+i)%RUNES.length]}" transform="translate(${x} 15)" fill="none" stroke="#cdefff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>`).join('')}</g>`)+corners(`<g filter="url(#drop)"><rect x="4" y="4" width="23" height="23" rx="3" fill="url(#g-plat)" stroke="#04060c" stroke-width="1"/><rect x="8.5" y="8.5" width="14" height="14" rx="2" fill="#0c1a26" stroke="rgba(255,255,255,.5)" stroke-width=".7"/></g>`)+[[15.5,15.5],[112.5,15.5],[15.5,112.5],[112.5,112.5]].map(([x,y])=>gem(x,y,5.5,'g-sapph')).join('')},
{id:'diamant_cristaux',fr:'Angles de cristal',en:'Crystal Corners',t:'diamant',lvl:85,sq:1,u:'Niveau 85',a:'subtile',
 over:()=>sqBevel(17,6,'g-diamond',11)+sqGlint(17,6,11,5.5)+edges(`<path d="M58 17L64 12L70 17L64 22Z" fill="url(#g-ice)" stroke="#04060c" stroke-width=".7"/>`)+corners(kite([21,32],[2,42],3.6,'url(#g-ice)')+kite([32,21],[42,2],3.6,'url(#g-ice)')+kite([26,26],[0,0],6.5,'url(#g-diamond)'))+star4(6,28,4,'#fff','tw',0)+star4(116,6,4.5,'#e0fbff','tw',.8)+star4(100,122,4,'#fff','tw',1.6)+star4(6,98,3.4,'#fff','tw',2.1)},
{id:'epique_circuit',fr:'Circuit arcanique',en:'Arcane Circuit',t:'epique',lvl:110,sq:1,u:'Niveau 110',a:'forte',
 under:()=>edges(`<path d="M30 14V9H50V4.5H78V9H98V14" fill="none" stroke="#7c3aed" stroke-width="1.8" stroke-linejoin="round"/>`),
 over:()=>sqBevel(17,6,'g-storm',9)+rr(17,9,'#c4b5fd',.9,'opacity=".7"')+edges(k=>`<g filter="url(#glow)"><circle cx="30" cy="14" r="1.5" fill="#e9d5ff"/><circle cx="98" cy="14" r="1.5" fill="#e9d5ff"/><circle class="run" style="--dx:28px;--d:1.8s;animation-delay:${n2(k*.45)}s" cx="50" cy="4.5" r="2" fill="#7df3ff"/></g>`)+hud('#a855f7',3.4)+corners(`<rect x="9" y="9" width="8" height="8" rx="1.4" fill="#0b0f1c" stroke="#7df3ff" stroke-width="1.2"/><circle class="pulse" cx="13" cy="13" r="1.8" fill="#7df3ff"/>`)},
{id:'legende_brasier',fr:'Brasier',en:'Blaze',t:'legende',lvl:140,sq:1,u:'Niveau 140',a:'forte',
 under:()=>edges(k=>[27,37,47,57,67,77,87,97].map((x,i)=>{const h=(i+k)%3?8:12,l=i%2?2:-2;return `<path class="flk" style="animation-delay:${n2(((i*3+k)%7)*.11)}s" d="M${x-5.5} 17Q${x-5} ${n2(15-h*.6)} ${x+l} ${15-h}Q${x+5} ${n2(15-h*.55)} ${x+5.5} 17Z" fill="url(#g-flame)"/>`;}).join(''))+corners(`<g transform="rotate(-45 17 17)"><path class="flk" d="M10 22Q9.5 10 17 -1Q24.5 10 24 22Z" fill="url(#g-flame)"/></g>`),
 over:()=>sqBevel(17,6.5,'g-ember',9)+rr(17,9,'#ff8a3d',.9,'opacity=".7"')+edges(k=>[40,64,88].map((x,i)=>`<circle class="rise" style="animation-delay:${n2(i*.7+k*.3)}s" cx="${x}" cy="10" r="1.2" fill="#ffd27a"/>`).join(''))+gem(64,113,6,'g-ruby')},
{id:'mythe_dragons',fr:'Dragons jumeaux',en:'Twin Dragons',t:'mythe',lvl:180,sq:1,u:'Niveau 180',a:'forte',
 fx:()=>fxSq('#ff4655,#a855f7,#00d4ff,#ff4655',5),
 over:()=>{const spines=[36,48,60,72,84,96].map(y=>`<path d="M14 ${y-4}L6 ${y}L14 ${y+4}Z" fill="url(#g-violet)" stroke="#04060c" stroke-width=".7" stroke-linejoin="round"/>`).join('');
  const tail=`<path d="M17 98Q5 104 7 115Q10 125 21 121Q14 119 13.5 113.5Q13.5 107 22 104Z" fill="url(#g-violet)" stroke="#04060c" stroke-width=".9" stroke-linejoin="round"/>`;
  const head=`<g class="bob" filter="url(#drop)"><path d="M17 28L19 14L9 2.5L25 9.5L33 7L41 9L50 11L55 14L48 15.8L42 15.4L48 18.8L41 21.2L31 22L24 27Z" fill="url(#g-ember)" stroke="#04060c" stroke-width="1" stroke-linejoin="round"/><path d="M19 14L25 9.5M27 16Q33 13.6 38.5 15.4" fill="none" stroke="#ffd27a" stroke-width=".8" opacity=".85"/><ellipse class="pulse" cx="36" cy="11.6" rx="2.4" ry="1.4" fill="#fff3a0" filter="url(#glow)"/><path d="M44 16.2L45.6 18.4L47 16.6M41 15.6L42.4 17.6L43.6 15.8" fill="#fff" stroke="#04060c" stroke-width=".35"/></g>`;
  return mir(spines+tail)+sqBevel(17,7,'g-mythic',9)+mir(head)+`<g filter="url(#glow)">${orb(64,9,5.5,'g-sapph','class="beat"')}</g>`+gem(64,113,6.5,'g-ruby');}},

/* ---- Square achievement frames ---- */
{id:'garde_lames',fr:'Garde des lames',en:'Crossguard',t:'epique',sq:1,u:'Succès « Inarrêtable » (50 victoires)',a:'subtile',
 over:()=>sqBevel(17,6,'g-steel',8)+sqGlint(17,6,8,4)+edges(`<path d="M58 17L64 13L70 17L64 21Z" fill="url(#g-gold)" stroke="#04060c" stroke-width=".7"/>`)+corners(`<g filter="url(#drop)"><polygon points="20,25.5 25.5,20 5.5,2.5 1,1 2.5,5.5" fill="url(#g-steel)" stroke="#04060c" stroke-width=".9" stroke-linejoin="round"/><path d="M22.5 22.5L4 4" stroke="rgba(255,255,255,.75)" stroke-width=".8"/><path d="M12 35Q19 27 23 23Q27 19 35 12" fill="none" stroke="#04060c" stroke-width="5.6" stroke-linecap="round"/><path d="M12 35Q19 27 23 23Q27 19 35 12" fill="none" stroke="url(#g-gold)" stroke-width="3.6" stroke-linecap="round"/><circle cx="12" cy="35" r="2.8" fill="url(#g-ruby)" stroke="#04060c" stroke-width=".7"/><circle cx="35" cy="12" r="2.8" fill="url(#g-ruby)" stroke="#04060c" stroke-width=".7"/><circle cx="23" cy="23" r="3.2" fill="url(#g-gold)" stroke="#04060c" stroke-width=".8"/></g>`)},
{id:'hud_scanner',fr:'Viseur tactique',en:'Tactical Scope',t:'epique',sq:1,u:'Succès « Précision chirurgicale » (KDA ≥ 5)',a:'subtile',
 over:()=>rr(17,6,'#04060c',9.4,'opacity=".7"')+rr(17,6,'#0a1a2e',6.8)+rr(14.2,8.5,'#5ee6ff',1.5)+rr(19.8,3.5,'#00d4ff',1.2,'opacity=".85"')+edges(`${[34,42,50,78,86,94].map(x=>`<path d="M${x} 9.5V12.5" stroke="#5ee6ff" stroke-width="1.1" opacity=".75"/>`).join('')}<path d="M58 9H70" stroke="#5ee6ff" stroke-width="1.4"/><path d="M64 13V25" stroke="#00d4ff" stroke-width="1.8" stroke-linecap="round" filter="url(#glow)"/>`)+`<g class="pulse">${hud('#00d4ff',3.6)}</g>`+corners(`<circle cx="11.5" cy="11.5" r="1.8" fill="#ff4655"/>`)+`<rect class="scan" x="21" y="21" width="86" height="1.6" fill="#7df3ff" opacity=".45"/>`},
{id:'projecteur',fr:'Sous les projecteurs',en:'In the Spotlight',t:'epique',sq:1,u:'Succès « Viral » (50 likes sur une publication)',a:'subtile',
 under:()=>corners(`<g class="pulse"><path d="M12 12L1 1M10 15L0 11M15 10L11 0" stroke="#fff3c4" stroke-width="2.2" stroke-linecap="round" opacity=".85"/></g>`),
 over:()=>sqBevel(17,6,'g-party',10)+sqGlint(17,6,10,4.6)+corners(`<g filter="url(#drop)"><circle cx="15" cy="15" r="6.4" fill="url(#g-gold)" stroke="#04060c" stroke-width="1"/><circle cx="15" cy="15" r="3.6" fill="#fff8d6" filter="url(#glow)"/></g>`)+star4(64,6,4.5,'#fff','tw',0)+star4(40,8,3,'#e0fbff','tw',.7)+star4(88,8,3,'#f5e9ff','tw',1.4)+`<g filter="url(#drop)"><rect x="47" y="106" width="34" height="15" rx="7.5" fill="#0b0f1c" stroke="url(#g-party)" stroke-width="1.6"/><path class="beat" d="M54.5 111.4c0-2 2.5-2.8 3.6-1 1.1-1.8 3.6-1 3.6 1 0 2.2-3.6 4.4-3.6 4.4s-3.6-2.2-3.6-4.4z" fill="#ff4d6d"/><text x="71" y="116.8" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="7.5" fill="#fff">50</text></g>`},
{id:'kente_royal',fr:'Kente royal',en:'Royal Kente',t:'epique',sq:1,u:'Succès « Tournée du Togo » (tournois dans 3 villes)',a:'subtile',
 over:()=>rr(16,8,'#04060c',13.6,'opacity=".75"')+rr(16,8,'url(#p-kente)',11)+rr(10.5,13,'url(#g-gold)',1.6)+rr(21.5,3,'url(#g-gold)',1.6)+sqGlint(16,11,8,5)+corners(`<g filter="url(#drop)"><rect x="5" y="5" width="21" height="21" rx="2" fill="#0b6b3a" stroke="url(#g-gold)" stroke-width="1.6"/><path d="M15.5 7.5L23.5 15.5L15.5 23.5L7.5 15.5Z" fill="#ffce00" stroke="#04060c" stroke-width=".7"/><rect x="12.5" y="12.5" width="6" height="6" fill="#d21034" transform="rotate(45 15.5 15.5)"/></g>`)+`<g filter="url(#drop)"><rect x="53" y="3" width="22" height="18" rx="2" fill="#d21034" stroke="url(#g-gold)" stroke-width="1.4"/>${star5(64,12.4,6.4,2.5,'#ffffff')}</g>`},
{id:'crocs_serpent',fr:'Crocs du serpent',en:'Serpent Fangs',t:'epique',sq:1,u:'Succès « Carnage » (12 éliminations en un match)',a:'subtile',
 over:()=>sqBevel(17,6.5,'g-jungle',10)+edges(`${[36,46,56,72,82,92].map(x=>`<path d="M${x-3} 18Q${x} 14.6 ${x+3} 18" fill="none" stroke="#04260f" stroke-width="1" opacity=".75"/>`).join('')}${orb(64,17,2.8,'g-emerald')}`)+corners(`<g filter="url(#drop)"><path class="tongue" d="M5 5L1.5 1.5M1.5 1.5L-1.2 2.4M1.5 1.5L2.4 -1.2" fill="none" stroke="#ff4655" stroke-width="1.3" stroke-linecap="round"/><path d="M30 23Q29 12 17.5 8Q8 5 4 4Q5 8 8 17.5Q12 29 23 30Q28 30 30 23Z" fill="url(#g-jungle)" stroke="#04260f" stroke-width="1" stroke-linejoin="round"/><path d="M8 12.5L9.4 16.4L10.8 13.2ZM12.5 8L16.4 9.4L13.2 10.8Z" fill="#f8fafc" stroke="#04260f" stroke-width=".4"/><g transform="rotate(45 12 18)"><ellipse cx="12" cy="18" rx="2.1" ry="2.7" fill="#ffe14d"/><path d="M12 16.2V19.8" stroke="#04060c" stroke-width=".9"/></g><g transform="rotate(45 18 12)"><ellipse cx="18" cy="12" rx="2.1" ry="2.7" fill="#ffe14d"/><path d="M18 10.2V13.8" stroke="#04060c" stroke-width=".9"/></g><path d="M20 26Q25 25 26 20" fill="none" stroke="#d9ff9e" stroke-width=".8" opacity=".6"/></g>`)},
{id:'arbre_bracket',fr:'Arbre du bracket',en:'Bracket Tree',t:'epique',sq:1,u:'Succès « Pilier du circuit » (15 tournois)',a:'subtile',
 over:()=>sqBevel(17,5.5,'g-roam',8)+rr(17,8,'#93c5fd',.8,'opacity=".6"')+mir(`<g fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#glow)"><path class="lit" d="M1 30H6V46H1M1 82H6V98H1" stroke="#5ee6ff" stroke-width="2.6"/><path class="lit" style="animation-delay:.6s" d="M6 38H10V90H6" stroke="#a78bfa" stroke-width="2.6"/><path class="lit" style="animation-delay:1.2s" d="M10 64H14" stroke="#f2b544" stroke-width="3.2"/></g>`)+corners(`<circle cx="13" cy="13" r="3.2" fill="url(#g-roam)" stroke="#04060c" stroke-width=".8"/>`)+cup(64,1)+`<g filter="url(#drop)"><rect x="52" y="108" width="24" height="10" rx="2" fill="#0b0f1c" stroke="url(#g-roam)" stroke-width="1.4"/><path d="M57 113H71" stroke="#f2b544" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 2.5"/></g>`},
{id:'cage_eclairs',fr:"Cage d'éclairs",en:'Lightning Cage',t:'epique',sq:1,u:'Succès « Mois sans faute » (30 jours d\'affilée)',a:'forte',
 under:()=>`<g class="pulse">${rr(7,16,'#5ee6ff',1.2,'opacity=".6" stroke-dasharray="6 5"')}</g>`,
 over:()=>sqBevel(17,6,'g-storm',9)+rr(17,9,'#a78bfa',1,'opacity=".6"')+edges(k=>`<polyline class="bolt" style="animation-delay:${n2(k*.55)}s" points="26,11 34,6 40,12 49,5 56,11 64,4 71,11 79,5 87,12 94,6 102,11" fill="none" stroke="#e0fbff" stroke-width="1.9" stroke-linejoin="round" filter="url(#glow2)"/><polyline class="bolt" style="animation-delay:${n2(k*.55+1.2)}s" points="30,9 40,6 50,10 60,6 70,10 80,6 90,10 98,7" fill="none" stroke="#7df3ff" stroke-width="1.2" stroke-linejoin="round"/>`)+corners(orb(14,14,5.2,'g-sapph','filter="url(#glow)"'))},
{id:'blason_clan',fr:'Blason de clan',en:'Clan Crest',t:'legende',sq:1,u:'Succès « Figure de la scène » (50 amis)',a:'subtile',
 over:()=>{const sh='M-7 -8H7V0Q7 7 0 10.5Q-7 7-7 0Z';
  return sqBevel(17,7,'g-gold',7)+sqGlint(17,7,7,4.8)+corners(`<g transform="translate(15 15) rotate(135)" filter="url(#drop)"><path d="${sh}" fill="url(#g-roam)" stroke="url(#g-gold)" stroke-width="1.6"/><path d="M0 -6V6" stroke="#fff3c4" stroke-width="1.2"/></g>`)+`<g filter="url(#drop)"><path d="M34 13Q49 20 64 15Q79 20 94 13L90 22Q77 26 64 22Q51 26 38 22Z" fill="url(#g-ruby)" stroke="#04060c" stroke-width=".9" stroke-linejoin="round"/><g transform="translate(64 11.5) scale(1.45)"><path d="${sh}" fill="url(#g-roam)" stroke="url(#g-gold)" stroke-width="1.3"/><path d="M-5 1L0 -3L5 1" fill="none" stroke="#fff3c4" stroke-width="1.3"/></g>${star5(64,19,4.2,1.8,'url(#g-gold)','class="beat"')}</g>`;}},
{id:'bannieres_guerre',fr:'Bannières de guerre',en:'War Banners',t:'legende',sq:1,u:'Succès « Monument » (5 saisons)',a:'subtile',
 over:()=>sqBevel(16,7,'g-gold',6)+sqGlint(16,7,6,5)+corners(`<g filter="url(#drop)"><circle cx="13" cy="13" r="6.2" fill="url(#g-gold)" stroke="#04060c" stroke-width="1"/><circle cx="13" cy="13" r="2.6" fill="url(#g-ruby)"/></g>`)+`<rect x="24" y="108.4" width="80" height="3.4" rx="1.7" fill="url(#g-gold)" stroke="#04060c" stroke-width=".8"/>`+[[34,12,15],[64,17,18],[94,12,15]].map(([x,w,h],i)=>`<g class="swing" style="animation-delay:${i*.5}s" filter="url(#drop)"><path d="M${x-w/2} 110H${x+w/2}V${110+h}L${x} ${110+h-4.5}L${x-w/2} ${110+h}Z" fill="url(#g-ruby)" stroke="#04060c" stroke-width=".9" stroke-linejoin="round"/><path d="M${x-w/2+2} 112.5H${x+w/2-2}" stroke="#fff3c4" stroke-width=".8" opacity=".7"/>${i==1?star5(x,119,5,2.1,'url(#g-gold)'):`<circle cx="${x}" cy="117.5" r="2.3" fill="url(#g-gold)"/>`}</g>`).join('')},
{id:'couronne_imperiale',fr:'Couronne impériale',en:'Imperial Crown',t:'legende',sq:1,u:'Succès « MVP de tournoi »',a:'subtile',
 over:()=>rr(17,8,'#04060c',12.6,'opacity=".75"')+rr(17,8,'url(#g-violet)',10)+rr(12.3,12,'url(#g-gold)',2)+rr(21.7,4,'url(#g-gold)',2)+sqGlint(17,10,8,5.2)+edges(`${[34,44,84,94].map(x=>`<circle cx="${x}" cy="17" r="1.4" fill="#fff" opacity=".9"/>`).join('')}`)+corners(`<g filter="url(#drop)"><rect x="8" y="8" width="15" height="15" rx="2" transform="rotate(45 15.5 15.5)" fill="url(#g-gold)" stroke="#04060c" stroke-width="1"/></g>${orb(15.5,15.5,3.3,'g-ruby')}`)+crown(64,-4,46,24,'g-gold','g-sapph')+star4(90,6,3.4,'#fff','tw',.4)},

{id:'forteresse',fr:'Forteresse invaincue',en:'Unbroken Fortress',t:'mythe',sq:1,u:'Succès secret « Invaincus » (saison sans défaite)',a:'forte',
 fx:()=>fxSq('#fff3c4,#f2b544,#ff4655,#a855f7,#f2b544,#fff3c4',4.5),
 over:()=>edges(`${[35,47,81,93].map(x=>`<rect x="${x-3.6}" y="7" width="7.2" height="8" fill="url(#g-steel)" stroke="#04060c" stroke-width=".8"/>`).join('')}`)+sqBevel(17,8,'g-steel',4)+rr(17,4,'#ff4655',1,'opacity=".75"')+corners(`<g filter="url(#drop)"><rect x="3" y="3" width="24" height="24" rx="2" fill="url(#g-steel)" stroke="#04060c" stroke-width="1"/><rect x="8" y="8" width="14" height="14" rx="1.2" fill="#0b1224" stroke="url(#g-gold)" stroke-width="1.3"/></g>`)+[[15,15],[113,15],[15,113],[113,113]].map(([x,y])=>gem(x,y,4.8,'g-ruby')).join('')+`<path d="M64 0V15" stroke="url(#g-gold)" stroke-width="1.8"/><path class="bob" d="M65 0.5H80L75.5 5L80 9.5H65Z" fill="url(#g-ruby)" stroke="#04060c" stroke-width=".7"/>`+gem(64,113,6,'g-sapph')},

/* ---- Square special frames ---- */
{id:'champion_en_titre',fr:'Champion en titre',en:'Reigning Champion',t:'champion',sq:1,tmp:'1 saison',u:'Équipe championne de la dernière saison clôturée ; rendu au sacre du champion suivant',a:'forte',
 fx:()=>fxSq('#fff3c4,#f2b544,#b87a1c,#fff3c4,#f2b544,#fff3c4',4),
 over:()=>sqBevel(17,8,'g-gold',9)+sqGlint(17,8,9,3.4)+rr(17,9,'#ff4655',.9,'opacity=".6"')+corners(`<g filter="url(#drop)">${star5(12,12,7,3,'url(#g-gold)')}</g>`)+crown(64,-5,48,25,'g-gold','g-ruby')+plate('EN TITRE','g-gold','#fff3c4',48)},
{id:'mvp_semaine',fr:'MVP de la semaine',en:'MVP of the Week',t:'mvp',sq:1,tmp:'7 j',u:'Joueur élu MVP le plus souvent pendant la semaine écoulée, ou désigné par un admin',a:'forte',
 under:()=>`<rect class="pulse" ${box(3,20)} fill="none" stroke="#c084fc" stroke-width="3" opacity=".55" filter="url(#glow2)"/>`,
 over:()=>sqBevel(17,6.5,'g-mvp',10)+hud('#f2b544',3.4)+edges(k=>`<circle class="run" style="--dx:56px;--d:2.2s;animation-delay:${n2(k*.55)}s" cx="36" cy="10" r="1.6" fill="#fff3c4" filter="url(#glow)"/>`)+`<g filter="url(#glow)">${star5(64,11,11,4.6,'url(#g-gold)','class="beat"')}</g>`+plate('MVP HEBDO','g-mvp','#fff3c4',54)},
{id:'numero_un',fr:'Numéro un du mois',en:'Monthly Number One',t:'classement',sq:1,tmp:'30 j',u:'1re place du classement d\'XP du mois écoulé',a:'forte',
 over:()=>{const hx=Array.from({length:6},(_,i)=>{const a=i*60*R;return n2(64+11*Math.cos(a))+','+n2(11+11*Math.sin(a));}).join(' ');
  return sqBevel(17,6,'g-sapph',10)+rr(17,10,'#e0fbff',.8,'opacity=".6"')+edges(k=>`<circle class="run" style="--dx:40px;--d:2s;animation-delay:${n2(k*.5)}s" cx="30" cy="9" r="1.5" fill="#7df3ff" filter="url(#glow)"/>`)+corners([0,1,2].map(j=>`<polyline class="chev" style="animation-delay:${j*.25}s" points="${3+j*4.5},${15+j*4.5} ${3+j*4.5},${3+j*4.5} ${15+j*4.5},${3+j*4.5}" fill="none" stroke="${j==2?'#f2b544':'#5ee6ff'}" stroke-width="2.4" stroke-linejoin="miter"/>`).join(''))+`<g filter="url(#drop)"><polygon points="${hx}" fill="#0b0f1c" stroke="url(#g-gold)" stroke-width="2"/><text x="64" y="14.6" text-anchor="middle" font-family="Chakra Petch, sans-serif" font-weight="700" font-size="10.5" fill="#f6c453">#1</text></g>`;}},
{id:'coupe_independance',fr:"Coupe de l'Indépendance",en:'Independence Cup',t:'event',sq:1,tmp:'30 j',u:'Événement « Coupe de l\'Indépendance » (fenêtre autour du 27 avril) : disputer au moins un match',a:'subtile',
 over:()=>rr(17,8,'#04060c',10.6,'opacity=".75"')+rr(17,8,'url(#g-togo)',8)+rr(12.6,12,'#fff',.8,'opacity=".5"')+rr(21.4,4,'#fff',.8,'opacity=".5"')+sqGlint(17,8,8,5)+[[113,15],[15,113],[113,113]].map(([x,y])=>`<circle cx="${x}" cy="${y}" r="4.6" fill="url(#g-gold)" stroke="#04060c" stroke-width=".9"/>`).join('')+`<g filter="url(#drop)"><rect x="2" y="2" width="28" height="26" rx="3" fill="#d21034" stroke="#04060c" stroke-width="1"/>${star5(16,15.5,9,3.6,'#ffffff','class="beat"')}</g>`+cup(64,-1)+plate('27 AVRIL','g-gold','#fff3c4',48)},
{id:'saison_pluies',fr:'Saison des pluies',en:'Rainy Season',t:'event',sq:1,u:'Événement « Saison des pluies » (fenêtre de juin à juillet) : 10 connexions',a:'subtile',
 under:()=>[6,122].map((x,s)=>[34,52,70,88].map((y,i)=>`<path class="rain" style="animation-delay:${n2((i*.37+s*.6)%1.5)}s" d="M${x} ${y}q1.8 2.9 0 4.6q-1.8-1.7 0-4.6z" fill="#7dd3fc"/>`).join('')).join(''),
 over:()=>sqBevel(17,6,'g-roam',12)+sqGlint(17,6,12,5.5)+mir(`<g filter="url(#drop)"><path d="M5 22Q0 22 0 17.5Q0 13 5.5 13Q6.5 6.5 13 6.5Q18.5 6.5 20.5 11Q26 10 28 14.5Q32 15.5 31 19.5Q30 22.5 26 22.5Z" fill="#e2e8f0" stroke="#04060c" stroke-width=".9"/><path d="M6 19Q14 21 26 19" fill="none" stroke="#94a3b8" stroke-width="1"/></g><polyline class="bolt" points="15,23 11.5,29 16,29 12.5,35" fill="none" stroke="#fde047" stroke-width="1.8" stroke-linejoin="round" filter="url(#glow)"/>`)+mir(leaf([16,112],[3,124],3.4,'url(#g-jungle)','stroke="#04260f" stroke-width=".6"')+leaf([16,112],[18,126],2.6,'url(#g-jungle)','stroke="#04260f" stroke-width=".6"'))+edges(`<circle cx="64" cy="17" r="2" fill="#e0f2fe"/>`)},
{id:'lanternes',fr:"Lanternes de fin d'année",en:'Year-End Lanterns',t:'event',sq:1,tmp:'14 j',u:'Événement « Fêtes de fin d\'année » : 5 connexions pendant la fenêtre',a:'forte',
 over:()=>{const lan=y=>`<g class="swing" style="animation-delay:${n2(y/40)}s"><path d="M7 ${y-8}V${y-5}" stroke="#f2b544" stroke-width=".9"/><rect x="4" y="${y-5}" width="6" height="2" rx=".6" fill="url(#g-gold)"/><ellipse cx="7" cy="${y+2}" rx="5" ry="6.2" fill="url(#g-ruby)" stroke="#04060c" stroke-width=".8"/><ellipse class="lit" cx="7" cy="${y+2}" rx="2.4" ry="4" fill="#ffd27a" filter="url(#glow)"/><rect x="4" y="${y+7.6}" width="6" height="2" rx=".6" fill="url(#g-gold)"/><path d="M7 ${y+9.6}V${y+14}" stroke="#f2b544" stroke-width="1.2"/></g>`;
  const bulbs=[[26,9.6],[36,11.2],[46,11.2],[56,9.6],[72,9.6],[82,11.2],[92,11.2],[102,9.6]].map(([x,y],i)=>`<circle class="lit" style="animation-delay:${n2(i*.35)}s" cx="${x}" cy="${y}" r="1.9" fill="${['#ffd27a','#7df3ff','#ff8a95','#b7f7c4'][i%4]}" filter="url(#glow)"/>`).join('');
  return sqBevel(17,6.5,'g-ruby',10)+rr(17,10,'#fff3c4',.8,'opacity=".5"')+`<path d="M20 8Q42 14 64 8Q86 14 108 8" fill="none" stroke="#f2b544" stroke-width=".9"/>`+bulbs+mir(`<circle cx="7" cy="26" r="1.5" fill="url(#g-gold)"/>`+lan(35)+lan(70))+star4(64,4,4,'#fff','tw',0)+star4(116,118,3.6,'#fff3c4','tw',1)+star4(12,118,3.6,'#fff3c4','tw',1.8);}}
];
