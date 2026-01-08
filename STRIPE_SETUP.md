# 💳 Configuration de Stripe & Edge Functions

Ce guide explique comment configurer Stripe et déployer les Edge Functions pour activer les paiements réels dans Live Party Wall.

## 1. Prérequis Stripe

1. Créez un compte sur [Stripe](https://stripe.com).
2. Récupérez vos clés API dans le tableau de bord Stripe (Développeurs > Clés API) :
   - `STRIPE_PUBLISHABLE_KEY` (Clé publique)
   - `STRIPE_SECRET_KEY` (Clé secrète)

## 2. Configuration des Secrets Supabase

Vous devez ajouter vos clés Stripe comme "Secrets" dans votre projet Supabase. Utilisez la CLI Supabase ou l'interface web (Project Settings > Edge Functions).

Via la CLI :
```bash
supabase secrets set STRIPE_SECRET_KEY=votre_cle_secrete
supabase secrets set STRIPE_WEBHOOK_SECRET=votre_secret_webhook
```

## 3. Configuration du Webhook Stripe

1. Allez dans Stripe > Développeurs > Webhooks.
2. Cliquez sur "Ajouter un point de terminaison".
3. URL du point de terminaison : `https://[VOTRE_PROJET_ID].supabase.co/functions/v1/stripe-webhook`
4. Événements à écouter :
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.payment_failed`
5. Récupérez le "Secret de signature" du webhook et ajoutez-le aux secrets Supabase (`STRIPE_WEBHOOK_SECRET`).

## 4. Déploiement des Edge Functions

Depuis la racine du projet, utilisez la CLI Supabase pour déployer les fonctions :

```bash
supabase functions deploy create-checkout-session
supabase functions deploy stripe-webhook
```

## 5. Liaison des Plans avec Stripe

Pour chaque plan dans votre table `plans` de la base de données, vous devriez (optionnellement) créer un produit/prix correspondant dans Stripe et mettre à jour la colonne `stripe_price_id` dans Supabase.

Actuellement, l'implémentation crée les prix dynamiquement ("inline"), ce qui est suffisant pour commencer, mais la gestion via des ID de prix Stripe est recommandée pour une production stable.

## 6. Test en mode local

Pour tester localement avec la CLI Stripe :
1. Lancez `supabase functions serve`
2. Lancez `stripe listen --forward-to localhost:54321/functions/v1/stripe-webhook`
3. Utilisez vos clés de test Stripe (`sk_test_...`)

