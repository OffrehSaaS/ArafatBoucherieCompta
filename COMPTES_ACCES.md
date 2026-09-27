# 🥩 DE Gestion — Accès Directeur Général & Données Réelles

L'application **DE Gestion** a été initialisée pour démarrer l'enregistrement des **données réelles**. Tous les compteurs opérationnels (ventes, dépenses, caisse, sorties, dettes, salaires) ont été remis à zéro.

---

## 👑 1. Compte Administrateur Unique (Directeur Général)

Tous les anciens comptes de test et de démo ont été supprimés. L'accès unique administrateur est réservé au **Directeur Général** :

- **Email** : `directeur@arafat.com`
- **Mot de passe** : `Admin2026!`
- **Nom** : Directeur Général
- **Rôle** : `admin` (Accès complet : Supervision globale, Stock au frigo, Attribution de caisse quotidienne, Gestion & Approbation des vendeurs, Dettes, Salaires, Rapports, Paramètres)

> ⚡ **Sur la page de connexion ([/login](file:///c:/Users/DELL/OneDrive/Documents/ArafatBoucherieCompta/src/app/login/page.tsx))** : Un bouton permet de pré-remplir les coordonnées du Directeur Général en 1 clic.

---

## 🛒 2. Workflow d'Accès pour les Nouveaux Vendeurs

Pour ajouter un nouveau vendeur dans l'application :

1. Le vendeur se rend sur la page **« Créer un compte »** ([/register](file:///c:/Users/DELL/OneDrive/Documents/ArafatBoucherieCompta/src/app/register/page.tsx)) et renseigne ses informations (Nom, Email, Téléphone, Mot de passe).
2. Son compte est créé avec le statut **« En attente d'approbation »**.
3. Le **Directeur Général** se connecte et voit la notification sur son **Tableau de Bord** ([/dashboard](file:///c:/Users/DELL/OneDrive/Documents/ArafatBoucherieCompta/src/app/dashboard/page.tsx)) ou dans la section **Personnel & Comptes** ([/employes](file:///c:/Users/DELL/OneDrive/Documents/ArafatBoucherieCompta/src/app/employes/page.tsx)).
4. Le Directeur clique sur **« Accepter l'accès »**. Le vendeur peut alors se connecter immédiatement pour saisir ses ventes et gérer son stock quotidien.

---

## 📊 3. Démarrage des Données Réelles

Tous les compteurs sont à **0** :
- **Stock au Frigo** : Les quantités sont remises à 0. L'administrateur peut saisir les réceptions réelles via *Stock au Frigo > Nouvelle Entrée*.
- **Sorties & Stocks Vendeurs** : 0 sortie enregistrée.
- **Ventes & Dépenses** : 0 FCFA.
- **Tiroirs de Caisse** : 0 FCFA, prêt pour l'attribution des fonds de caisse réels du jour.
