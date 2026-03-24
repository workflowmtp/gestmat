'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/app-store';
import Button from '@/components/ui/Button';

interface ItemFormProps {
  item?: any;
  isEdit?: boolean;
}

export default function ItemForm({ item, isEdit }: ItemFormProps) {
  const router = useRouter();
  const { showToast } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [types, setTypes] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [photoPreview, setPhotoPreview] = useState<string | null>(item?.photo || null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  // Form state
  const [form, setForm] = useState({
    code: item?.code || '',
    designation: item?.designation || '',
    typeId: item?.typeId || '',
    familyId: item?.familyId || '',
    subFamily: item?.subFamily || '',
    brand: item?.brand || '',
    model: item?.model || '',
    manufacturerRef: item?.manufacturerRef || '',
    serialNumber: item?.serialNumber || '',
    barcode: item?.barcode || '',
    unit: item?.unit || 'unité',
    qty: item?.qty || 1,
    qtyAvailable: item?.qtyAvailable ?? item?.qty || 1,
    minStock: item?.minStock || '',
    state: item?.state || 'neuf',
    conformity: item?.conformity || 'conforme',
    purchaseDate: item?.purchaseDate ? new Date(item.purchaseDate).toISOString().split('T')[0] : '',
    serviceDate: item?.serviceDate ? new Date(item.serviceDate).toISOString().split('T')[0] : '',
    unitCost: item?.unitCost || '',
    lifespanDays: item?.lifespanDays || '',
    lifespanAlertDays: item?.lifespanAlertDays || '',
    controlFrequency: item?.controlFrequency || '',
    nextControlDate: item?.nextControlDate ? new Date(item.nextControlDate).toISOString().split('T')[0] : '',
    returnDate: item?.returnDate ? new Date(item.returnDate).toISOString().split('T')[0] : '',
    locationId: item?.locationId || '',
    responsible: item?.responsible || '',
    supplier: item?.supplier || '',
    warranty: item?.warranty || '',
    safetyNote: item?.safetyNote || '',
    comment: item?.comment || '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/items?pageSize=0').then(() => {}), // warm up
      fetch('/api/families').then((r) => r.json()).then((d) => setFamilies(d.families || [])),
      fetch('/api/locations').then((r) => r.json()).then((d) => setLocations(d.locations || [])),
    ]);
    // Fetch types from DB (or use constants)
    setTypes([
      { id: 'type-outillage', name: 'Outillage' },
      { id: 'type-epi', name: 'EPI' },
      { id: 'type-consommable', name: 'Consommable traçable' },
      { id: 'type-accessoire', name: 'Accessoire' },
    ]);
  }, []);

  function update(key: string, value: any) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { showToast('Photo trop lourde (max 2 Mo)', 'error'); return; }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleSubmit() {
    if (!form.code || !form.designation) { showToast('Code et désignation obligatoires', 'error'); return; }
    if (!form.typeId) { showToast('Type obligatoire', 'error'); return; }

    setSaving(true);
    const body: any = { ...form };
    // Convert numeric fields
    ['qty','qtyAvailable','minStock','unitCost','lifespanDays','lifespanAlertDays','controlFrequency'].forEach((k) => {
      if (body[k] === '' || body[k] === null) body[k] = null;
      else body[k] = Number(body[k]);
    });
    // Convert date fields
    ['purchaseDate','serviceDate','nextControlDate','returnDate'].forEach((k) => {
      if (!body[k]) body[k] = null;
      else body[k] = new Date(body[k]).toISOString();
    });

    // Photo handling (base64 for now, Vercel Blob in production)
    if (photoFile) {
      body.photo = photoPreview; // base64
    }

    try {
      const url = isEdit ? '/api/items/' + item.id : '/api/items';
      const method = isEdit ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (res.ok) {
        showToast(isEdit ? 'Article modifié' : 'Article créé', 'success');
        router.push('/inventory/' + (data.item?.id || item?.id));
        router.refresh();
      } else {
        showToast(data.error || 'Erreur', 'error');
      }
    } catch (e: any) {
      showToast('Erreur réseau', 'error');
    }
    setSaving(false);
  }

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="mb-6">
        <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-3 pb-2 border-b border-gm-border">{title}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-5 gap-y-4">{children}</div>
      </div>
    );
  }

  function Input({ label, id, type, ...props }: any) {
    return (
      <div>
        <label className="gm-label" htmlFor={id}>{label}</label>
        <input id={id} type={type || 'text'} className="gm-input text-sm"
          value={form[id as keyof typeof form] || ''} onChange={(e) => update(id, e.target.value)} {...props} />
      </div>
    );
  }

  function Select({ label, id, options, ...props }: any) {
    return (
      <div>
        <label className="gm-label" htmlFor={id}>{label}</label>
        <select id={id} className="gm-input text-sm"
          value={form[id as keyof typeof form] || ''} onChange={(e) => update(id, e.target.value)} {...props}>
          <option value="">— Sélectionner —</option>
          {options.map((o: any) => typeof o === 'string'
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
          )}
        </select>
      </div>
    );
  }

  return (
    <div className="max-w-[900px]">
      <Section title="Identification">
        <Input label="Code article *" id="code" />
        <Input label="Désignation *" id="designation" />
        <Select label="Type *" id="typeId" options={types.map((t) => ({ value: t.id, label: t.name }))} />
        <Select label="Famille" id="familyId" options={families.map((f) => ({ value: f.id, label: f.name }))} />
        <Input label="Sous-famille" id="subFamily" />
        <Input label="Code-barres" id="barcode" />
      </Section>

      <Section title="Caractéristiques">
        <Input label="Marque" id="brand" />
        <Input label="Modèle" id="model" />
        <Input label="Réf. fabricant" id="manufacturerRef" />
        <Input label="N° de série" id="serialNumber" />
        <Input label="Unité" id="unit" />
        <Select label="État" id="state"
          options={['neuf','bon','moyen','usé','à contrôler','à réparer','hors service']} />
        <Select label="Conformité" id="conformity"
          options={['conforme','non conforme','à vérifier']} />
        <Input label="Note sécurité" id="safetyNote" />
      </Section>

      <Section title="Quantités">
        <Input label="Quantité totale" id="qty" type="number" min={0} />
        <Input label="Qté disponible" id="qtyAvailable" type="number" min={0} />
        <Input label="Stock minimum" id="minStock" type="number" min={0} />
      </Section>

      <Section title="Dates & Durée de vie">
        <Input label="Date d'achat" id="purchaseDate" type="date" />
        <Input label="Mise en service" id="serviceDate" type="date" />
        <Input label="Durée de vie (jours)" id="lifespanDays" type="number" min={0} />
        <Input label="Alerte fin vie (jours)" id="lifespanAlertDays" type="number" min={0} />
        <Input label="Fréq. contrôle (jours)" id="controlFrequency" type="number" min={0} />
        <Input label="Prochain contrôle" id="nextControlDate" type="date" />
        <Input label="Date retour prévue" id="returnDate" type="date" />
      </Section>

      <Section title="Localisation & Affectation">
        <Select label="Localisation" id="locationId"
          options={locations.map((l) => ({ value: l.id, label: l.name + ' (' + l.type + ')' }))} />
        <Input label="Responsable" id="responsible" />
      </Section>

      <Section title="Financier">
        <Input label="Coût unitaire (FCFA)" id="unitCost" type="number" min={0} />
        <Input label="Fournisseur" id="supplier" />
        <Input label="Garantie" id="warranty" />
      </Section>

      {/* Photo */}
      <div className="mb-6">
        <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-3 pb-2 border-b border-gm-border">Photo</h4>
        <div className="flex gap-4 items-start">
          <div className="w-[120px] h-[90px] rounded-gm-sm border-2 border-dashed border-gm-border flex items-center justify-center overflow-hidden flex-shrink-0 cursor-pointer bg-gm-input"
            onClick={() => document.getElementById('photoInput')?.click()}>
            {photoPreview
              ? <img src={photoPreview} alt="" className="w-full h-full object-cover" />
              : <span className="text-3xl text-txt-muted">📷</span>}
          </div>
          <div>
            <input type="file" id="photoInput" accept="image/*" capture="environment" className="hidden" onChange={handlePhoto} />
            <Button variant="secondary" size="sm" onClick={() => document.getElementById('photoInput')?.click()}>
              📷 {photoPreview ? 'Changer' : 'Ajouter'} une photo
            </Button>
            {photoPreview && (
              <Button variant="ghost" size="sm" className="ml-2 text-danger" onClick={() => { setPhotoPreview(null); setPhotoFile(null); }}>
                Supprimer
              </Button>
            )}
            <p className="text-xs text-txt-muted mt-2">JPG, PNG ou WebP • Max 2 Mo</p>
          </div>
        </div>
      </div>

      {/* Comment */}
      <div className="mb-6">
        <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-3 pb-2 border-b border-gm-border">Notes</h4>
        <textarea className="gm-input text-sm min-h-[80px]" value={form.comment} onChange={(e) => update('comment', e.target.value)}
          placeholder="Commentaire libre..." />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4 border-t border-gm-border">
        <Button variant="secondary" onClick={() => router.back()}>Annuler</Button>
        <Button onClick={handleSubmit} disabled={saving}>
          {saving ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer l\'article'}
        </Button>
      </div>
    </div>
  );
}
