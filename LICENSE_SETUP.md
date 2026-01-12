# Configuration de la Vérification de Licence

Ce document explique comment configurer le système de vérification de licences avec une base Supabase séparée.

## Variables d'Environnement

Ajoutez les variables suivantes à votre fichier `.env` :

```env
# Base Supabase principale (déjà configurée)
VITE_SUPABASE_URL=your_main_supabase_url
VITE_SUPABASE_ANON_KEY=your_main_supabase_anon_key

# Base Supabase pour les licences (nouvelle)
VITE_LICENSE_SUPABASE_URL=your_license_supabase_url
VITE_LICENSE_SUPABASE_ANON_KEY=your_license_supabase_anon_key
```

## Structure de la Table de Licences

La base Supabase des licences doit contenir une table `licenses` avec la structure suivante :

```sql
CREATE TABLE licenses (
  license_key TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  plan_name TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'suspended', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_expires_at ON licenses(expires_at);
```

## Utilisation

1. Les organisateurs reçoivent une clé de licence par email lors de l'achat
2. Lors de la création d'un événement, ils doivent saisir leur clé de licence
3. Le système vérifie automatiquement :
   - Que la clé existe
   - Que la licence est active
   - Que la licence n'est pas expirée
   - (Optionnel) Que l'email correspond à celui de l'utilisateur

## Permissions Supabase

Assurez-vous que les politiques RLS (Row Level Security) permettent la lecture publique de la table `licenses` pour la vérification, ou utilisez une clé de service avec les permissions appropriées.

## Exemple de Données

```json
{
  "license_key": "PW-MAR-6SRU-WNZF-B1M2",
  "email": "mayssondevoye78@gmail.com",
  "full_name": "Maysson devoye",
  "plan_name": "Mariage & Soirée",
  "status": "active",
  "expires_at": "2026-01-19T09:19:59.205+00:00",
  "created_at": "2026-01-12T09:19:59.231186+00:00"
}
```

