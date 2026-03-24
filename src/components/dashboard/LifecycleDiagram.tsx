'use client';

import { useRouter } from 'next/navigation';

interface LcProps {
  total: number; magasin: number; affectes: number; retard: number;
  horsService: number; perdus: number; finVie: number;
  maint: number; rebut: number; ctrl: number; dotEpi: number; campEnCours: number;
}

export default function LifecycleDiagram(p: LcProps) {
  const router = useRouter();
  const go = (path: string) => router.push(path);

  const G='#10b981',T='#0d9488',B='#3b82f6',P='#8b5cf6',K='#d4537e',O='#f59e0b',R='#ef4444',Y='#6b7280',C='#d85a30';
  const gG='rgba(16,185,129,0.15)',gT='rgba(13,148,136,0.15)',gB='rgba(59,130,246,0.15)',gP='rgba(139,92,246,0.15)',gK='rgba(212,83,126,0.15)',gO='rgba(245,158,11,0.15)',gR='rgba(239,68,68,0.15)',gY='rgba(107,114,128,0.15)',gC='rgba(216,90,48,0.15)';

  function Node({ x, y, w, h, label, sub, count, col, bg, href }: {
    x:number;y:number;w:number;h:number;label:string;sub?:string;count:number;col:string;bg:string;href:string;
  }) {
    return (
      <g className="cursor-pointer hover:opacity-80 transition-opacity" onClick={() => go(href)}>
        <rect x={x} y={y} width={w} height={h} rx={8} fill={bg} stroke={col} strokeWidth={1} />
        <rect x={x+w-20} y={y-8} width={38} height={20} rx={10} fill={col} />
        <text x={x+w-1} y={y+2} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={13} fontWeight={700} fontFamily="JetBrains Mono">{count}</text>
        <text x={x+w/2} y={y+h/2-(sub?6:0)} textAnchor="middle" dominantBaseline="central" fill={col} fontSize={11} fontWeight={600}>{label}</text>
        {sub && <text x={x+w/2} y={y+h/2+9} textAnchor="middle" dominantBaseline="central" fill="#8b8fa8" fontSize={9.5}>{sub}</text>}
      </g>
    );
  }

  return (
    <div className="bg-gm-card border border-gm-border rounded-gm p-6 overflow-hidden">
      <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">⇄ Cycle de vie des équipements — Compteurs temps réel</h3>
      <svg className="w-full max-w-[720px] mx-auto block" viewBox="0 0 700 510">
        <defs>
          <marker id="lcA" viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M2 1L8 5L2 9" fill="none" stroke="context-stroke" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
          </marker>
        </defs>

        {/* ROW 1 */}
        <Node x={20} y={22} w={140} h={44} label="Entrée stock" sub="Achat / Réception" count={p.total} col={G} bg={gG} href="/inventory" />
        <line x1={160} y1={44} x2={210} y2={44} stroke={G} strokeWidth={1.5} markerEnd="url(#lcA)" />
        <Node x={210} y={14} w={180} h={60} label="Magasin central" sub="Disponible • Stocké" count={p.magasin} col={T} bg={gT} href="/inventory" />
        <line x1={390} y1={44} x2={450} y2={44} stroke={B} strokeWidth={1.5} markerEnd="url(#lcA)" />
        <text x={420} y={36} textAnchor="middle" fill={B} fontSize={9}>Prêt / Affect.</text>
        <Node x={450} y={14} w={150} h={60} label="Terrain / Chantier" sub="Affecté • En prêt" count={p.affectes} col={B} bg={gB} href="/movements" />

        {/* Pills */}
        {['Chantier','Atelier','Véhicule'].map((pill, i) => (
          <g key={pill}>
            <rect x={455+i*52} y={80} width={48} height={17} rx={8} fill={gB} stroke={B} strokeWidth={0.5} />
            <text x={479+i*52} y={89} textAnchor="middle" dominantBaseline="central" fill={B} fontSize={8}>{pill}</text>
          </g>
        ))}

        {/* Retard badge */}
        <rect x={625} y={18} width={60} height={50} rx={8} fill={gR} stroke={R} strokeWidth={1} />
        <text x={655} y={36} textAnchor="middle" dominantBaseline="central" fill={R} fontSize={13} fontWeight={700} fontFamily="JetBrains Mono">{p.retard}</text>
        <text x={655} y={52} textAnchor="middle" dominantBaseline="central" fill={R} fontSize={9}>En retard</text>
        <path d="M600 36 L623 36" stroke={R} strokeWidth={1.2} strokeDasharray="5 3" markerEnd="url(#lcA)" fill="none" />

        {/* Retour terrain → magasin */}
        <path d="M450 56 L430 56 L430 64 L392 64" stroke={G} strokeWidth={1.5} markerEnd="url(#lcA)" fill="none" />
        <text x={432} y={78} textAnchor="middle" fill={G} fontSize={9}>Retour</text>

        {/* ROW 2 */}
        <line x1={300} y1={74} x2={300} y2={120} stroke={P} strokeWidth={1.5} markerEnd="url(#lcA)" />
        <text x={318} y={100} textAnchor="middle" fill={P} fontSize={9}>Contrôle</text>
        <Node x={220} y={120} w={160} h={48} label="Contrôle" sub="Périodique • Sécurité" count={p.ctrl} col={P} bg={gP} href="/controls" />

        <path d="M365 74 L365 90 L505 90 L505 120" stroke={K} strokeWidth={1.5} markerEnd="url(#lcA)" fill="none" />
        <text x={440} y={84} textAnchor="middle" fill={K} fontSize={9}>Dotation EPI</text>
        <Node x={430} y={120} w={160} h={48} label="Dotation EPI" sub="Nominative • Renouvel." count={p.dotEpi} col={K} bg={gK} href="/dotations" />

        {/* EPI renewal */}
        <path d="M590 144 L615 144 L615 172 L530 172 L530 170" stroke={K} strokeWidth={1} strokeDasharray="4 3" markerEnd="url(#lcA)" fill="none" />
        <text x={622} y={160} textAnchor="middle" fill={K} fontSize={9}>Renouvellement</text>

        {/* Retard terrain → controls */}
        <line x1={525} y1={74} x2={525} y2={118} stroke={R} strokeWidth={1.2} strokeDasharray="5 3" markerEnd="url(#lcA)" />

        {/* ROW 3: Conforme */}
        <path d="M220 144 L160 144 L160 200" stroke={G} strokeWidth={1.5} markerEnd="url(#lcA)" fill="none" />
        <rect x={100} y={200} width={100} height={34} rx={8} fill={gG} stroke={G} strokeWidth={0.5} />
        <text x={150} y={217} textAnchor="middle" dominantBaseline="central" fill={G} fontSize={11} fontWeight={600}>✓ Conforme</text>
        <path d="M100 217 L60 217 L60 44 L18 44" stroke={G} strokeWidth={1.2} markerEnd="url(#lcA)" fill="none" />
        <text x={48} y={130} textAnchor="middle" fill={G} fontSize={9} transform="rotate(-90,48,130)">Remise en stock</text>

        {/* Non conforme → Maintenance */}
        <line x1={300} y1={168} x2={300} y2={220} stroke={C} strokeWidth={1.5} markerEnd="url(#lcA)" />
        <text x={322} y={196} textAnchor="middle" fill={R} fontSize={9}>Non conforme</text>

        {/* ROW 4: Maintenance */}
        <Node x={210} y={220} w={180} h={52} label="Maintenance" sub="Réparation • Corrective" count={p.maint} col={C} bg={gC} href="/controls" />
        <path d="M210 240 L160 240 L160 236" stroke={G} strokeWidth={1} strokeDasharray="4 3" markerEnd="url(#lcA)" fill="none" />
        <text x={178} y={252} textAnchor="middle" fill={G} fontSize={9}>Réparé</text>
        <line x1={300} y1={272} x2={300} y2={320} stroke={R} strokeWidth={1.5} markerEnd="url(#lcA)" />
        <text x={322} y={298} textAnchor="middle" fill={R} fontSize={9}>Irréparable</text>

        {/* ROW 5: Hors service */}
        <Node x={230} y={320} w={140} h={44} label="Hors service" sub="" count={p.horsService} col={R} bg={gR} href="/inventory" />
        <line x1={300} y1={364} x2={300} y2={405} stroke={Y} strokeWidth={1.5} markerEnd="url(#lcA)" />

        {/* ROW 6: Rebut */}
        <Node x={210} y={405} w={180} h={48} label="Rebut / Archivage" sub="Fin de vie • Réformé" count={p.rebut} col={Y} bg={gY} href="/inventory" />

        {/* Perte/Vol */}
        <path d="M560 74 L560 340 L520 340" stroke={R} strokeWidth={1.2} strokeDasharray="5 3" markerEnd="url(#lcA)" fill="none" />
        <text x={573} y={210} textAnchor="middle" fill={R} fontSize={9}>Perte / Vol</text>
        <Node x={430} y={320} w={94} h={44} label="Perdu" sub="Volé" count={p.perdus} col={R} bg={gR} href="/alerts" />
        <path d="M477 364 L477 405 L392 420" stroke={O} strokeWidth={1} strokeDasharray="3 3" markerEnd="url(#lcA)" fill="none" />

        {/* Fin de vie indicator */}
        <g className="cursor-pointer hover:opacity-80" onClick={() => go('/alerts')}>
          <rect x={30} y={320} width={120} height={48} rx={8} fill={gO} stroke={O} strokeWidth={1} />
          <rect x={112} y={312} width={36} height={20} rx={10} fill={O} />
          <text x={130} y={322} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={13} fontWeight={700} fontFamily="JetBrains Mono">{p.finVie}</text>
          <text x={90} y={340} textAnchor="middle" dominantBaseline="central" fill={O} fontSize={11} fontWeight={600}>Fin de vie</text>
          <text x={90} y={354} textAnchor="middle" dominantBaseline="central" fill="#8b8fa8" fontSize={9.5}>Usure • Expiré</text>
        </g>
        <path d="M150 344 L208 344" stroke={O} strokeWidth={1} strokeDasharray="3 3" markerEnd="url(#lcA)" fill="none" />

        {/* Inventaire physique */}
        <Node x={30} y={420} w={170} h={48} label="Inventaire physique" sub="Comptage • Écarts" count={p.campEnCours} col={O} bg={gO} href="/campaigns" />

        {/* Legend */}
        <line x1={30} y1={478} x2={685} y2={478} stroke="#2a2d3e" strokeWidth={0.5} />
        <text x={30} y={492} fill="#8b8fa8" fontSize={10} fontWeight={600}>Légende</text>
        <line x1={100} y1={489} x2={128} y2={489} stroke={G} strokeWidth={1.5} markerEnd="url(#lcA)" />
        <text x={134} y={492} fill="#8b8fa8" fontSize={10}>Flux normal</text>
        <line x1={210} y1={489} x2={238} y2={489} stroke={R} strokeWidth={1.2} strokeDasharray="5 3" markerEnd="url(#lcA)" />
        <text x={244} y={492} fill="#8b8fa8" fontSize={10}>Alerte</text>
        <line x1={290} y1={489} x2={318} y2={489} stroke={O} strokeWidth={1} strokeDasharray="3 3" markerEnd="url(#lcA)" />
        <text x={324} y={492} fill="#8b8fa8" fontSize={10}>Correction</text>
        <rect x={400} y={481} width={28} height={16} rx={8} fill={T} />
        <text x={414} y={490} textAnchor="middle" dominantBaseline="central" fill="#fff" fontSize={9} fontWeight={700} fontFamily="JetBrains Mono">N</text>
        <text x={436} y={492} fill="#8b8fa8" fontSize={10}>Compteur temps réel</text>
        <text x={590} y={492} fill="#8b8fa8" fontSize={10}>Clic = naviguer</text>
      </svg>
    </div>
  );
}
