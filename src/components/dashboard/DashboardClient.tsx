'use client';

import { useState, useEffect } from 'react';
import { KpiCard } from '@/components/ui/KpiCard';
import BarChart from '@/components/dashboard/BarChart';
import DonutChart from '@/components/dashboard/DonutChart';
import TopList from '@/components/dashboard/TopList';
import LifecycleDiagram from '@/components/dashboard/LifecycleDiagram';
import { formatNumber } from '@/lib/utils';
import { hasPermission } from '@/lib/permissions';
import { useAppStore } from '@/stores/app-store';

export default function DashboardClient() {
  const currentUser = useAppStore((s) => s.currentUser);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const perms = currentUser?.permissions || [];
  const canViewCost = hasPermission(perms, 'items.view_cost');

  useEffect(() => {
    fetch('/api/dashboard').then((r) => r.json()).then(setData).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-3 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!data) return <p className="text-danger p-8">Erreur chargement dashboard</p>;

  const t = data.total || 1;
  const kpis = [
    { l:'Total articles', v:formatNumber(data.total), ic:'📦', co:'#f59e0b', bg:'rgba(245,158,11,0.12)', p:100 },
    { l:'Outillages',     v:formatNumber(data.outillages), ic:'🔧', co:'#3b82f6', bg:'rgba(59,130,246,0.12)', p:Math.round(data.outillages/t*100) },
    { l:'EPI',            v:formatNumber(data.epiCount), ic:'🦺', co:'#8b5cf6', bg:'rgba(139,92,246,0.12)', p:Math.round(data.epiCount/t*100) },
    { l:'Valeur stock',   v:canViewCost ? formatNumber(Math.round(data.valeur)) + ' FCFA' : '•••', ic:'💰', co:'#10b981', bg:'rgba(16,185,129,0.12)', p:100, txt:true },
    { l:'En magasin',     v:formatNumber(data.enMagasin), ic:'🏠', co:'#10b981', bg:'rgba(16,185,129,0.12)', p:Math.round(data.enMagasin/t*100) },
    { l:'Affectés',       v:formatNumber(data.affectes), ic:'➡', co:'#3b82f6', bg:'rgba(59,130,246,0.12)', p:Math.round(data.affectes/t*100) },
    { l:'En retard',      v:formatNumber(data.enRetard), ic:'⏰', co:'#ef4444', bg:'rgba(239,68,68,0.12)', p:Math.round(data.enRetard/t*100) },
    { l:'Fin de vie',     v:formatNumber(data.finVie), ic:'⚠', co:'#f59e0b', bg:'rgba(245,158,11,0.12)', p:Math.round(data.finVie/t*100) },
    { l:'Hors service',   v:formatNumber(data.horsService), ic:'⛔', co:'#ef4444', bg:'rgba(239,68,68,0.12)', p:Math.round(data.horsService/t*100) },
    { l:'Perdus',         v:formatNumber(data.perdus), ic:'❓', co:'#6b7280', bg:'rgba(92,96,120,0.12)', p:Math.round(data.perdus/t*100) },
  ];

  return (
    <div className="space-y-7">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.l} label={k.l} value={k.v} icon={k.ic}
            color={k.co} bgColor={k.bg} percentage={k.p} isText={k.txt} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <BarChart data={data.byType} title="📊 Par type" />
        <DonutChart data={data.byState} title="🔵 Par état" />
      </div>

      {/* Top lists */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <TopList data={data.byFamily} title="🏷 Top familles" />
        <TopList data={data.byLocation} title="🏗 Top chantiers" />
        <TopList data={data.byResponsible} title="👤 Top utilisateurs" />
      </div>

      {/* Lifecycle */}
      <LifecycleDiagram
        total={data.total} magasin={data.enMagasin} affectes={data.affectes}
        retard={data.enRetard} horsService={data.horsService} perdus={data.perdus}
        finVie={data.finVie} maint={data.lc.maint} rebut={data.lc.rebut}
        ctrl={data.lc.ctrl} dotEpi={data.lc.dotEpi} campEnCours={data.lc.campEnCours} />

      {/* Alerts preview */}
      {data.alertCount > 0 && (
        <div className="bg-gm-card border border-gm-border rounded-gm p-5">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            ⚠ Alertes actives
            <span className="bg-danger text-white text-xs px-2 py-0.5 rounded-xl">{data.alertCount}</span>
          </h3>
          <a href="/alerts" className="text-sm text-accent hover:underline">Voir toutes les alertes →</a>
        </div>
      )}
    </div>
  );
}
