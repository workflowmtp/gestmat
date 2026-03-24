import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding GEST-MAT BTP database...');

  // ═══════════════════════════════════════
  // 1. PERMISSIONS (38 — lecture seule pour les users)
  // ═══════════════════════════════════════
  const permissionsData = [
    // Module: items
    { code:'items.view',        label:'Voir l\'inventaire',           module:'items' },
    { code:'items.create',      label:'Créer un article',             module:'items' },
    { code:'items.edit',        label:'Modifier un article',          module:'items' },
    { code:'items.delete',      label:'Archiver/Supprimer un article',module:'items' },
    { code:'items.view_cost',   label:'Voir les coûts et valorisation',module:'items' },
    { code:'items.export',      label:'Exporter l\'inventaire',       module:'items' },
    { code:'items.print',       label:'Imprimer l\'inventaire',       module:'items' },
    { code:'items.photo',       label:'Gérer les photos d\'articles', module:'items' },
    // Module: movements
    { code:'movements.view',    label:'Voir les mouvements',          module:'movements' },
    { code:'movements.create',  label:'Créer un mouvement',           module:'movements' },
    { code:'movements.validate',label:'Valider un mouvement',         module:'movements' },
    { code:'movements.quick_return',label:'Retour rapide',            module:'movements' },
    // Module: dotations
    { code:'dotations.view',    label:'Voir les dotations EPI',       module:'dotations' },
    { code:'dotations.create',  label:'Créer une dotation',           module:'dotations' },
    { code:'dotations.renew',   label:'Renouveler une dotation',      module:'dotations' },
    { code:'dotations.print',   label:'Imprimer fiche dotation',      module:'dotations' },
    // Module: controls
    { code:'controls.view',     label:'Voir les contrôles',           module:'controls' },
    { code:'controls.create',   label:'Enregistrer un contrôle',      module:'controls' },
    { code:'controls.plan',     label:'Planifier un contrôle',        module:'controls' },
    // Module: campaigns
    { code:'campaigns.view',    label:'Voir les campagnes inventaire',module:'campaigns' },
    { code:'campaigns.create',  label:'Lancer une campagne',          module:'campaigns' },
    { code:'campaigns.count',   label:'Saisir les comptages',         module:'campaigns' },
    { code:'campaigns.validate',label:'Valider un inventaire',        module:'campaigns' },
    { code:'campaigns.print',   label:'Imprimer PV inventaire',       module:'campaigns' },
    // Module: alerts
    { code:'alerts.view',       label:'Voir les alertes',             module:'alerts' },
    { code:'alerts.print',      label:'Imprimer rapport alertes',     module:'alerts' },
    // Module: reports
    { code:'reports.view',      label:'Accéder aux rapports',         module:'reports' },
    { code:'reports.export',    label:'Exporter les données',         module:'reports' },
    { code:'reports.backup',    label:'Sauvegarde/Restauration',      module:'reports' },
    // Module: audit
    { code:'audit.view',        label:'Voir le journal d\'audit',     module:'audit' },
    { code:'audit.export',      label:'Exporter le journal',          module:'audit' },
    // Module: config
    { code:'config.locations',  label:'Gérer les localisations',      module:'config' },
    { code:'config.families',   label:'Gérer les familles',           module:'config' },
    { code:'config.users',      label:'Gérer les utilisateurs',       module:'config' },
    { code:'config.roles',      label:'Gérer les rôles et permissions',module:'config' },
    { code:'config.settings',   label:'Modifier les paramètres',      module:'config' },
    // Module: ai
    { code:'ai.agent',          label:'Utiliser l\'agent IA',         module:'ai' },
    { code:'ai.config',         label:'Configurer l\'agent IA',       module:'ai' },
  ];

  const perms: Record<string, string> = {};
  for (const p of permissionsData) {
    const created = await prisma.permission.upsert({
      where: { code: p.code },
      update: { label: p.label, module: p.module },
      create: p,
    });
    perms[p.code] = created.id;
  }
  console.log(`  ✅ ${permissionsData.length} permissions créées`);

  // ═══════════════════════════════════════
  // 2. RÔLES (8 built-in)
  // ═══════════════════════════════════════
  const rolesConfig: Record<string, { label:string; level:number; perms:string[] }> = {
    admin: {
      label: 'Administrateur', level: 100,
      perms: Object.keys(perms), // toutes les permissions
    },
    magasinier: {
      label: 'Magasinier', level: 70,
      perms: [
        'items.view','items.create','items.edit','items.view_cost','items.export','items.print','items.photo',
        'movements.view','movements.create','movements.validate','movements.quick_return',
        'dotations.view','dotations.create','dotations.print',
        'controls.view',
        'campaigns.view','campaigns.create','campaigns.count','campaigns.validate','campaigns.print',
        'alerts.view','alerts.print',
        'reports.view','reports.export',
        'config.locations','config.families',
        'ai.agent',
      ],
    },
    hse: {
      label: 'HSE / Sécurité', level: 60,
      perms: [
        'items.view','items.create','items.edit','items.print','items.photo',
        'movements.view','movements.create',
        'dotations.view','dotations.create','dotations.renew','dotations.print',
        'controls.view','controls.create','controls.plan',
        'campaigns.view',
        'alerts.view','alerts.print',
        'reports.view','reports.export',
        'ai.agent',
      ],
    },
    chef_chantier: {
      label: 'Chef de chantier', level: 50,
      perms: [
        'items.view','items.print',
        'movements.view','movements.create','movements.quick_return',
        'dotations.view',
        'controls.view',
        'campaigns.view','campaigns.count',
        'alerts.view',
        'ai.agent',
      ],
    },
    rh: {
      label: 'Ressources humaines', level: 40,
      perms: [
        'items.view',
        'dotations.view','dotations.create','dotations.renew','dotations.print',
        'alerts.view',
        'reports.view','reports.export',
        'ai.agent',
      ],
    },
    maintenance: {
      label: 'Maintenance', level: 50,
      perms: [
        'items.view','items.edit','items.print',
        'movements.view','movements.create',
        'controls.view','controls.create','controls.plan',
        'alerts.view',
        'ai.agent',
      ],
    },
    direction: {
      label: 'Direction', level: 80,
      perms: [
        'items.view','items.view_cost','items.export','items.print',
        'movements.view',
        'dotations.view',
        'controls.view',
        'campaigns.view','campaigns.validate',
        'alerts.view','alerts.print',
        'reports.view','reports.export','reports.backup',
        'audit.view','audit.export',
        'ai.agent',
      ],
    },
    consultation: {
      label: 'Consultation', level: 10,
      perms: ['items.view','movements.view','dotations.view','controls.view','campaigns.view','alerts.view','ai.agent'],
    },
  };

  const roleIds: Record<string, string> = {};
  for (const [name, config] of Object.entries(rolesConfig)) {
    const role = await prisma.role.upsert({
      where: { name },
      update: { label: config.label, level: config.level },
      create: { name, label: config.label, level: config.level, builtIn: true },
    });
    roleIds[name] = role.id;

    // Assign permissions
    for (const permCode of config.perms) {
      if (perms[permCode]) {
        await prisma.rolePermission.upsert({
          where: { roleId_permissionId: { roleId: role.id, permissionId: perms[permCode] } },
          update: {},
          create: { roleId: role.id, permissionId: perms[permCode] },
        });
      }
    }
  }
  console.log(`  ✅ ${Object.keys(rolesConfig).length} rôles créés avec permissions`);

  // ═══════════════════════════════════════
  // 3. UTILISATEURS DÉMO
  // ═══════════════════════════════════════
  const hash = await bcrypt.hash('demo', 10);
  const usersData = [
    { username:'admin',   fullname:'Martin Kouamé',  role:'admin',        email:'admin@gestmat.cm',   phone:'691000001' },
    { username:'magasin', fullname:'Jean Mbarga',     role:'magasinier',   email:'magasin@gestmat.cm', phone:'691000002' },
    { username:'hse',     fullname:'Alice Fotso',     role:'hse',          email:'hse@gestmat.cm',     phone:'691000003' },
    { username:'chef',    fullname:'Paul Ndongo',     role:'chef_chantier',email:'chef@gestmat.cm',    phone:'691000004' },
    { username:'consult', fullname:'Marie Atangana',  role:'consultation', email:'consult@gestmat.cm', phone:'691000005' },
    { username:'maint',   fullname:'Didier Ekambi',   role:'maintenance',  email:'maint@gestmat.cm',   phone:'691000006' },
  ];

  const userIds: Record<string, string> = {};
  for (const u of usersData) {
    const user = await prisma.user.upsert({
      where: { username: u.username },
      update: {},
      create: { username: u.username, password: hash, fullname: u.fullname, email: u.email, phone: u.phone, roleId: roleIds[u.role] },
    });
    userIds[u.username] = user.id;
  }
  console.log(`  ✅ ${usersData.length} utilisateurs créés (mdp: demo)`);

  // ═══════════════════════════════════════
  // 4. TYPES D'ARTICLES
  // ═══════════════════════════════════════
  const typeIds: Record<string, string> = {};
  for (const name of ['Outillage', 'EPI', 'Consommable traçable', 'Accessoire']) {
    const t = await prisma.itemType.upsert({ where: { name }, update: {}, create: { name } });
    typeIds[name] = t.id;
  }

  // ═══════════════════════════════════════
  // 5. FAMILLES
  // ═══════════════════════════════════════
  const familyNames = [
    'Électroportatif','Mesure & Topographie','Levage & Manutention','Échafaudage & Accès',
    'Protection tête','Protection mains','Protection pieds','Protection corps',
    'Protection yeux','Protection auditive','Protection respiratoire','Antichute',
    'Outillage main','Coffrage',
  ];
  const famIds: Record<string, string> = {};
  for (const name of familyNames) {
    const f = await prisma.itemFamily.upsert({ where: { name }, update: {}, create: { name } });
    famIds[name] = f.id;
  }
  console.log(`  ✅ ${familyNames.length} familles créées`);

  // ═══════════════════════════════════════
  // 6. LOCALISATIONS
  // ═══════════════════════════════════════
  const locsData = [
    { name:'Magasin principal',   code:'MAG', type:'magasin',          responsible:'Jean Mbarga' },
    { name:'Dépôt Bonaberi',      code:'DEP', type:'dépôt',            responsible:'Jean Mbarga' },
    { name:'Chantier Akwa Tower', code:'AKW', type:'chantier',         responsible:'Paul Ndongo', comment:'R+12' },
    { name:'Chantier Bonamoussadi',code:'BON',type:'chantier',         responsible:'Paul Ndongo', comment:'Villa duplex' },
    { name:'Chantier Makepe BTP', code:'MKP', type:'chantier',         responsible:'Paul Ndongo', comment:'R+6' },
    { name:'Atelier mécanique',   code:'ATE', type:'atelier',          responsible:'Didier Ekambi' },
    { name:'Véhicule Hilux 01',   code:'VH1', type:'véhicule',         responsible:'Paul Ndongo' },
    { name:'Zone quarantaine',    code:'QUA', type:'zone quarantaine',  responsible:'Alice Fotso' },
    { name:'Rebut',               code:'REB', type:'rebut' },
  ];
  const locIds: Record<string, string> = {};
  for (const l of locsData) {
    const loc = await prisma.location.upsert({
      where: { name: l.name },
      update: {},
      create: { name: l.name, code: l.code, type: l.type, responsible: l.responsible, comment: (l as any).comment },
    });
    locIds[l.name] = loc.id;
  }
  console.log(`  ✅ ${locsData.length} localisations créées`);

  // ═══════════════════════════════════════
  // 7. ARTICLES DÉMO (15)
  // ═══════════════════════════════════════
  const d = (days: number) => new Date(Date.now() - days * 86400000);
  const df = (days: number) => new Date(Date.now() + days * 86400000);

  const itemsData = [
    { code:'OUT-0001', designation:'Perforateur Bosch GBH 2-26',      type:'Outillage',  family:'Électroportatif',     brand:'Bosch',  model:'GBH 2-26 DRE', serialNumber:'SN-2024-0451', unitCost:185000, qty:1, state:'bon', location:'Chantier Akwa Tower', responsible:'Paul Ndongo', currentProject:'Chantier Akwa Tower', purchaseDate:d(365), lifespanDays:1095, lifespanAlertDays:90, controlFrequency:180, nextControlDate:df(15), returnDate:d(-3), conformity:'conforme', supplier:'Bricoma Douala', warranty:'2 ans' },
    { code:'OUT-0002', designation:'Meuleuse Makita GA5030',          type:'Outillage',  family:'Électroportatif',     brand:'Makita', model:'GA5030',        serialNumber:'SN-2024-0452', unitCost:95000,  qty:1, state:'bon', location:'Magasin principal',    responsible:'Jean Mbarga', purchaseDate:d(200), lifespanDays:730,  lifespanAlertDays:60, controlFrequency:90, nextControlDate:df(30), conformity:'conforme', supplier:'Quincaillerie Centrale', warranty:'1 an', safetyNote:'Lunettes obligatoires' },
    { code:'OUT-0003', designation:'Niveau laser Bosch GLL 3-80',     type:'Outillage',  family:'Mesure & Topographie', brand:'Bosch',  model:'GLL 3-80 CG',  serialNumber:'SN-2024-0453', unitCost:320000, qty:1, state:'bon', location:'Chantier Bonamoussadi',responsible:'Paul Ndongo', currentProject:'Chantier Bonamoussadi', purchaseDate:d(150), lifespanDays:1825, lifespanAlertDays:180, controlFrequency:365, nextControlDate:df(60), returnDate:df(5), conformity:'conforme', comment:'Avec trépied' },
    { code:'OUT-0004', designation:'Échelle aluminium 3 plans',       type:'Outillage',  family:'Échafaudage & Accès',  brand:'Tubesca',model:'Starline 3x12', unitCost:125000, qty:2, state:'moyen', location:'Chantier Makepe BTP', responsible:'Paul Ndongo', currentProject:'Chantier Makepe BTP', purchaseDate:d(800), lifespanDays:2555, lifespanAlertDays:180, controlFrequency:180, nextControlDate:d(-10), conformity:'à vérifier', safetyNote:'Vérifier échelons' },
    { code:'OUT-0005', designation:'Bétonnière électrique 350L',      type:'Outillage',  family:'Électroportatif',     brand:'Altrad', model:'BI350', serialNumber:'SN-2023-0101', unitCost:450000, qty:1, qtyHS:1, qtyAvailable:0, state:'hors service', location:'Atelier mécanique', responsible:'Didier Ekambi', purchaseDate:d(900), lifespanDays:1460, conformity:'non conforme', comment:'Moteur grillé' },
    { code:'EPI-0001', designation:'Casque de chantier MSA V-Gard',   type:'EPI', family:'Protection tête',    brand:'MSA',   model:'V-Gard 520', unitCost:18000, qty:15, qtyAvailable:8, qtyAffected:7, state:'bon', location:'Magasin principal', responsible:'Jean Mbarga', purchaseDate:d(180), lifespanDays:1095, lifespanAlertDays:90, controlFrequency:180, nextControlDate:df(45), minStock:5, conformity:'conforme', safetyNote:'Remplacement après choc' },
    { code:'EPI-0002', designation:'Gants anti-coupure Ansell HyFlex',type:'EPI', family:'Protection mains',   brand:'Ansell', model:'HyFlex 11-724', unitCost:8500, qty:30, qtyAvailable:12, qtyAffected:18, state:'bon', location:'Magasin principal', responsible:'Jean Mbarga', purchaseDate:d(60), lifespanDays:90, lifespanAlertDays:15, minStock:10, renewalDate:df(-5), conformity:'conforme' },
    { code:'EPI-0003', designation:'Harnais antichute Petzl AVAO',    type:'EPI', family:'Antichute',          brand:'Petzl', model:'AVAO BOD', serialNumber:'SN-HAR-001', unitCost:145000, qty:4, qtyAvailable:2, qtyAffected:2, state:'bon', location:'Magasin principal', responsible:'Alice Fotso', purchaseDate:d(300), lifespanDays:1825, lifespanAlertDays:180, controlFrequency:365, nextControlDate:df(90), minStock:2, conformity:'conforme', safetyNote:'Inspection visuelle avant usage' },
    { code:'EPI-0004', designation:'Bottes sécurité S3 Caterpillar',  type:'EPI', family:'Protection pieds',   brand:'Caterpillar', model:'Holton S3', unitCost:35000, qty:20, qtyAvailable:6, qtyAffected:14, state:'moyen', location:'Magasin principal', responsible:'Jean Mbarga', purchaseDate:d(400), lifespanDays:365, lifespanAlertDays:30, controlFrequency:90, nextControlDate:d(-5), minStock:5, renewalDate:d(-15), conformity:'à vérifier' },
    { code:'EPI-0005', designation:'Lunettes Bollé Safety RUSH+',     type:'EPI', family:'Protection yeux',    brand:'Bollé', model:'RUSH+ Clear', unitCost:6500, qty:25, qtyAvailable:10, qtyAffected:15, state:'bon', location:'Magasin principal', responsible:'Jean Mbarga', purchaseDate:d(90), lifespanDays:180, lifespanAlertDays:20, minStock:8, conformity:'conforme' },
    { code:'OUT-0006', designation:'Coffret clés à douille 94 pièces',type:'Outillage', family:'Outillage main', brand:'Facom', model:'S.360DBOX1', unitCost:175000, qty:3, qtyAvailable:2, qtyAffected:1, state:'bon', location:'Magasin principal', responsible:'Jean Mbarga', purchaseDate:d(500), lifespanDays:3650, lifespanAlertDays:365, conformity:'conforme', warranty:'À vie' },
    { code:'OUT-0007', designation:'Visseuse Dewalt DCD791',          type:'Outillage', family:'Électroportatif', brand:'Dewalt', model:'DCD791D2', serialNumber:'SN-2024-0712', unitCost:210000, qty:1, state:'bon', location:'Chantier Akwa Tower', responsible:'Paul Ndongo', currentProject:'Chantier Akwa Tower', purchaseDate:d(120), lifespanDays:1095, lifespanAlertDays:90, controlFrequency:180, nextControlDate:df(60), returnDate:df(2), conformity:'conforme', comment:'2 batteries' },
    { code:'OUT-0008', designation:'Disques meuleuse 125mm',          type:'Consommable traçable', family:'Électroportatif', brand:'3M', model:'Cubitron II', unitCost:12000, qty:8, state:'neuf', location:'Magasin principal', responsible:'Jean Mbarga', purchaseDate:d(30), minStock:3, conformity:'conforme', comment:'Boîtes de 25' },
    { code:'EPI-0006', designation:'Casque anti-bruit 3M Peltor',     type:'EPI', family:'Protection auditive', brand:'3M', model:'Peltor X4A', unitCost:32000, qty:10, qtyAvailable:6, qtyAffected:4, state:'bon', location:'Magasin principal', responsible:'Jean Mbarga', purchaseDate:d(220), lifespanDays:730, lifespanAlertDays:60, controlFrequency:180, nextControlDate:df(40), minStock:4, conformity:'conforme' },
    { code:'EPI-0007', designation:'Masque FFP2 3M 9322+',            type:'EPI', family:'Protection respiratoire', brand:'3M', model:'9322+', unitCost:25000, qty:5, state:'neuf', location:'Magasin principal', responsible:'Jean Mbarga', purchaseDate:d(15), lifespanDays:365, lifespanAlertDays:30, minStock:2, conformity:'conforme', safetyNote:'Usage unique', comment:'Boîtes de 10' },
  ];

  const itemIds: Record<string, string> = {};
  for (const it of itemsData) {
    const item = await prisma.item.upsert({
      where: { code: it.code },
      update: {},
      create: {
        code: it.code,
        designation: it.designation,
        typeId: typeIds[it.type],
        familyId: it.family ? famIds[it.family] : undefined,
        brand: it.brand,
        model: it.model,
        serialNumber: (it as any).serialNumber || undefined,
        unit: 'unité',
        qty: it.qty,
        qtyAvailable: (it as any).qtyAvailable ?? it.qty,
        qtyAffected: (it as any).qtyAffected ?? 0,
        qtyHS: (it as any).qtyHS ?? 0,
        minStock: (it as any).minStock,
        state: it.state,
        conformity: (it as any).conformity ?? 'conforme',
        unitCost: it.unitCost,
        purchaseDate: (it as any).purchaseDate,
        serviceDate: (it as any).purchaseDate,
        lifespanDays: (it as any).lifespanDays,
        lifespanAlertDays: (it as any).lifespanAlertDays,
        controlFrequency: (it as any).controlFrequency,
        nextControlDate: (it as any).nextControlDate,
        returnDate: (it as any).returnDate,
        locationId: it.location ? locIds[it.location] : undefined,
        responsible: (it as any).responsible,
        currentProject: (it as any).currentProject,
        supplier: (it as any).supplier,
        warranty: (it as any).warranty,
        safetyNote: (it as any).safetyNote,
        renewalDate: (it as any).renewalDate,
        comment: (it as any).comment,
      },
    });
    itemIds[it.code] = item.id;
  }
  console.log(`  ✅ ${itemsData.length} articles démo créés`);

  // ═══════════════════════════════════════
  // 8. PARAMÈTRES
  // ═══════════════════════════════════════
  const settings = [
    { key: 'companyName', value: 'BTP Solutions Cameroun' },
    { key: 'currency', value: 'FCFA' },
    { key: 'language', value: 'fr' },
  ];
  for (const s of settings) {
    await prisma.setting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  // ═══════════════════════════════════════
  // 9. AUDIT LOG INITIAL
  // ═══════════════════════════════════════
  await prisma.auditLog.create({
    data: { action: 'init', detail: 'Initialisation de la base de données GEST-MAT BTP', userId: userIds['admin'] },
  });

  console.log('  ✅ Paramètres et audit initialisés');
  console.log('✅ Seed terminé avec succès !');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
