# GEST-MAT BTP — Gestion Outillage, EPI & Suivi des Dotations

Application web de gestion du parc matériel et équipements pour entreprises BTP.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | Next.js 15 (App Router) |
| Langage | TypeScript |
| ORM | Prisma |
| Base de données | PostgreSQL (externe) |
| Auth | NextAuth v5 (JWT + Credentials) |
| State | Zustand |
| CSS | Tailwind CSS |
| Agent IA | n8n (webhook) |
| Déploiement | Vercel |

## Installation

```bash
# 1. Cloner / Extraire
cd gestmat-nextjs

# 2. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec votre DATABASE_URL PostgreSQL

# 3. Installer
npm install

# 4. Initialiser la base de données
npx prisma migrate dev --name init
npx prisma db seed

# 5. Lancer
npm run dev
```

## Comptes de démonstration

Tous les comptes ont le mot de passe : `demo`

| Identifiant | Rôle | Accès |
|-------------|------|-------|
| admin | Administrateur | Accès complet |
| magasin | Magasinier | Stock, mouvements, dotations |
| hse | HSE / Sécurité | EPI, contrôles, dotations |
| chef | Chef de chantier | Vue chantier, mouvements |
| maint | Maintenance | Contrôles, réparations |
| consult | Consultation | Lecture seule |

## Architecture

```
src/
├── app/                    # Pages (App Router)
│   ├── (app)/              # Route group authentifié
│   │   ├── dashboard/      # Tableau de bord
│   │   ├── inventory/      # Inventaire + fiche article
│   │   ├── movements/      # Mouvements
│   │   ├── dotations/      # Dotations EPI
│   │   ├── controls/       # Contrôles & Maintenance
│   │   ├── campaigns/      # Inventaires physiques
│   │   ├── alerts/         # Centre d'alertes
│   │   ├── reports/        # Rapports & exports
│   │   ├── audit/          # Journal d'audit
│   │   └── config/         # Configuration
│   ├── api/                # 20 API routes
│   └── login/              # Page de connexion
├── components/             # 30+ composants React
├── lib/                    # Logique métier
│   ├── auth.ts             # NextAuth config
│   ├── permissions.ts      # Système permissions
│   ├── alert-engine.ts     # 14 types d'alertes
│   ├── utils.ts            # Formatage, status engine
│   └── n8n.ts              # Client webhook IA
├── stores/                 # Zustand global state
└── types/                  # TypeScript declarations
```

## Permissions

38 permissions réparties en 10 modules. L'utilisateur peut :
- **Créer des rôles** (pas des permissions — elles sont prédéfinies)
- **Assigner des permissions** à un rôle via la matrice visuelle
- **Assigner un rôle** à un utilisateur

## Déploiement Vercel

```bash
# Ajouter les variables d'environnement dans Vercel Dashboard
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add NEXTAUTH_URL

# Déployer
vercel deploy --prod
```

## Variables d'environnement

Voir `.env.example` pour la liste complète. Les variables essentielles :

- `DATABASE_URL` — URL PostgreSQL
- `NEXTAUTH_SECRET` — Secret JWT (générer avec `openssl rand -base64 32`)
- `NEXTAUTH_URL` — URL de l'application
- `N8N_WEBHOOK_URL` — URL webhook n8n pour l'agent IA
