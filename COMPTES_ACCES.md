# 🥩 DE Gestion (ArafatBoucherieCompta) — Identifiants d'Accès

Ce document récapitule tous les comptes d'accès configurés et synchronisés pour se connecter à l'application **DE Gestion** aussi bien en **Production** (Supabase) qu'en **Local** (Démo).

---

## ⚡ Remplissage en 1 Clic
Sur la page de connexion ([/login](file:///c:/Users/DELL/OneDrive/Documents/ArafatBoucherieCompta/src/app/login/page.tsx)), des boutons rapides permettent de pré-remplir automatiquement les identifiants d'un simple clic.

---

## 👑 1. Comptes Administrateurs & Super Admin (Accès Total)

### 🌟 Compte Super Administrateur :
- **Email** : `superadmin@arafat.com`
- **Mot de passe** : `Admin2026!`
- **Nom** : Super Administrateur
- **Rôle** : `super_admin` / `admin` (Contrôle total, supervision globale, accès au stock frigo, gestion des rôles, finances et paramètres)

### 👔 Compte Directeur Général :
- **Email** : `directeur@arafat.com`
- **Mot de passe** : `Admin2026!`
- **Nom** : Directeur Général
- **Rôle** : `admin`

### 🛡️ Compte Administrateur Principal :
- **Email** : `admin@arafat.com`
- **Mot de passe** : `Admin2026!` *(accepte aussi `admin`)*
- **Nom** : Brahim Ould
- **Rôle** : `admin`

### 🏢 Compte Administrateur Diner Express :
- **Email** : `admin@dinerexpress.tg`
- **Mot de passe** : `Admin2026!`
- **Nom** : Administrateur Diner Express
- **Rôle** : `super_admin` / `admin`

---

## 🛒 2. Comptes Vendeurs (Stock & Caisse Individuels)

### 👤 Compte Vendeur Principal :
- **Email** : `vendeur@arafat.com`
- **Mot de passe** : `Vendeur2026!` *(accepte aussi `vendeur`)*
- **Nom** : Fatoumata Barry
- **Rôle** : `vendeur` (Mon Stock du Jour alloué, Ventes, Mon Tiroir Caisse quotidien)

### 👤 Compte Vendeur Adjoint :
- **Email** : `amadou@arafat.com`
- **Mot de passe** : `Vendeur2026!`
- **Nom** : Amadou Diallo
- **Rôle** : `vendeur`

---

## 🔒 Confidentialité & Rôles
1. **Accès Stock au Frigo** : Réservé exclusivement aux administrateurs.
2. **Caisse Quotidienne** : L'administrateur attribue chaque matin un fond de caisse propre à chaque vendeur.
3. **Confidentialité** : Les vendeurs ne voient ni les ventes ni la caisse de leurs collègues, et aucun salaire n'est affiché pour les vendeurs.
