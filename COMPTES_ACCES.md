# 🥩 ArafatBoucherieCompta — Identifiants d'Accès

Ce document récapitule les comptes d'accès pré-configurés pour se connecter et tester l'application **Arafat Compta**.

---

## 👑 1. Comptes Administrateurs (Accès Total)

### Nouveau Compte Administrateur :
- **Email** : `directeur@arafat.com`
- **Mot de passe** : `Admin2026!`
- **Nom** : Directeur Général
- **Rôle** : `admin` (Accès complet : Dashboard global, Sorties de stock, Approbations de retours de stock, Employés, Salaires, Dettes, Rapports, Paramètres)

### Compte Administrateur Historique :
- **Email** : `admin@arafat.com`
- **Mot de passe** : `admin`
- **Nom** : Brahim Ould
- **Rôle** : `admin`

---

## 🛒 2. Comptes Vendeurs (Espace Personnel)

### Nouveau Compte Vendeur :
- **Email** : `amadou@arafat.com`
- **Mot de passe** : `Vendeur2026!`
- **Nom** : Amadou Diallo
- **Rôle** : `vendeur` (Accès personnalisé : Dashboard vendeur personnel, Stock en possession, Déclaration et retour de stock pour approbation, Ventes, Dépenses, Caisse)

### Compte Vendeur Historique :
- **Email** : `vendeur@arafat.com`
- **Mot de passe** : `vendeur`
- **Nom** : Fatoumata Barry
- **Rôle** : `vendeur`

---

## 🔄 3. Fonctionnalités Utiles

- **Bascule de Rôle en Direct** : Lorsque vous êtes connecté avec un compte Administrateur, un bouton dans la barre latérale vous permet de basculer instantanément en mode **Vendeur** pour tester la vue personnelle, puis de revenir en **Admin** en un clic.
- **Flux d'Approbation du Stock** :
  1. L'Admin enregistre une sortie de viande vers le vendeur sur la page `/sorties`.
  2. Le Vendeur voit son lot sur son Dashboard personnel et clique sur **"Clôturer / Retourner le Stock"**.
  3. L'Admin reçoit la demande sur son Dashboard et clique sur **"Approuver le retour"** pour réintégrer les invendus au frigo et générer le chiffre d'affaires.
