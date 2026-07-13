# 🥩 ArafatBoucherieCompta — Guide de Référence (GEMINI.md)

Ce document sert de mémoire persistante et de guide d'accueil pour tout agent ou modèle d'IA (comme Gemini ou Claude) intervenant sur ce projet. Il résume l'architecture, les fonctionnalités, les choix techniques et les directives de développement de l'application.

---

## 📋 1. Présentation de l'Application

**ArafatBoucherieCompta** (nom commercial : *Arafat Compta*) est une application web moderne de gestion comptable et opérationnelle conçue sur-mesure pour les boucheries. Elle a pour but de remplacer le cahier papier traditionnel en offrant un suivi en temps réel des stocks, des ventes, des dépenses opérationnelles, des salaires du personnel et du solde de caisse journalier.

L'application intègre une gestion des rôles (**Admin** et **Vendeur**) avec des accès restreints et sécurisés pour chaque profil.

---

## 🚀 2. Fonctionnalités Implémentées

L'application est divisée en plusieurs modules opérationnels :

### 👤 Authentification & Rôles (RBAC)
*   **Connexion / Inscription / Réinitialisation** : Portails d'accès sécurisés.
*   **Deux Rôles distincts** :
    *   `admin` (Administrateur) : Accès complet (incluant rapports financiers, salaires, employés, dettes et paramètres).
    *   `vendeur` (Vendeur/Caissier) : Accès limité aux opérations quotidiennes (saisie des ventes, dépenses, gestion du stock).
*   **Simulateur de rôle** : Possibilité de basculer instantanément de rôle dans la barre latérale pour faciliter le test et la démonstration.

### 📦 Gestion des Stocks (Frigo)
*   **Stock au Frigo (`/stock`)** : Inventaire des pièces de viande et produits disponibles (quantité en kg/pièce, prix unitaire en FCFA, catégorie, observations).
*   **Sortie du Frigo Début de Journée (`/sorties`)** : Enregistrement des viandes sorties du froid pour la mise en vente. Suivi de l'état (en cours, validé) et liaison avec la caisse.
*   **Stock Restant Fin de Journée (`/stock-restant`)** : Inventaire du stock invendu en fin de journée pour calculer automatiquement la valeur résiduelle du stock et ajuster l'inventaire global.

### 💰 Flux Financiers & Caisse
*   **Ventes (`/ventes`)** : Enregistrement des ventes au détail (quantité, prix unitaire, moyen de paiement : *Espèces, Mobile Money, Carte, Autre*) avec identification du vendeur.
*   **Dépenses (`/depenses`)** : Journalisation des charges d'exploitation catégorisées (*Eau, Tomates, Cube, Maggi, Piment, Huile, Oignons, Charbon, Transport, Glace, Salaires, Divers*).
*   **Caisse (`/caisse`)** : Outil de clôture journalière qui calcule automatiquement :
    $$\text{Solde théorique} = \text{Solde initial} + \text{Total Ventes} - \text{Total Dépenses} - \text{Total Salaires}$$
    Permet la validation et le stockage historique de l'état de la caisse.

### 🤝 Fournisseurs & Dettes (Admin)
*   **Fournisseurs (`/fournisseurs`)** : Carnet d'adresses et notes des grossistes partenaires.
*   **Dettes Fournisseurs (`/dettes`)** : Suivi des crédits d'achat de viande, historique des paiements partiels et calcul dynamique du solde restant.

### 👥 Personnel & Paie (Admin)
*   **Employés (`/employes`)** : Fiches des bouchers et caissiers avec planning de présence hebdomadaire (matrice de jours travaillés).
*   **Salaires (`/salaires`)** : Calcul des rémunérations journalières ou mensuelles, suivi des statuts (*Payé*, *Non payé*) et intégration automatique dans le module Dépenses/Caisse.

### 📊 Analyses & Configuration (Admin)
*   **Rapports (`/rapports`)** : Statistiques avancées (chiffre d'affaires, marges bénéficiaires, répartition des dépenses via graphiques) et export des données au format CSV.
*   **Paramètres (`/parametres`)** : Personnalisation du nom de la boucherie, téléversement de logo, réinitialisation complète des données locales et activation du mode démo.

---

## 📁 3. Structure des Fichiers

L'application utilise l'architecture standard de **Next.js (App Router)** sous TypeScript :

```text
ArafatBoucherieCompta/
├── public/                 # Assets statiques (logos, icônes SVG)
├── supabase/               # Fichiers de configuration et scripts de base de données
│   └── schema.sql          # Définition des tables PostgreSQL, Enums et Triggers
└── src/
    ├── app/                # Pages de l'application (Next.js App Router)
    │   ├── caisse/         # Clôture et historique de caisse
    │   ├── dashboard/      # Tableau de bord principal (KPIs et graphiques)
    │   ├── depenses/       # Journal des dépenses d'exploitation
    │   ├── dettes/         # Suivi des dettes fournisseurs (Admin uniquement)
    │   ├── employes/       # Gestion du personnel et plannings (Admin uniquement)
    │   ├── fournisseurs/   # Liste des grossistes
    │   ├── login/          # Page de connexion
    │   ├── register/       # Page de création de compte
    │   ├── reset-password/ # Demande de réinitialisation du mot de passe
    │   ├── rapports/       # Analyse financière & Exports (Admin uniquement)
    │   ├── salaires/       # Calcul et paiement des salaires (Admin uniquement)
    │   ├── sorties/        # Sorties de stock du frigo pour mise en étal
    │   ├── stock/          # Inventaire global au frigo
    │   ├── stock-restant/  # Inventaire du soir / invendus
    │   ├── ventes/         # Enregistrement des tickets de caisse
    │   ├── globals.css     # Design System (Tailwind CSS v4 variables & utilities)
    │   ├── layout.tsx      # Racine de layout Next.js
    │   └── page.tsx        # Page d'accueil / Vitrine marketing
    ├── components/         # Composants React partagés
    │   ├── ui/             # Éléments d'interface réutilisables (ex: ConfirmDialog)
    │   ├── LayoutWrapper.tsx # Structure principale avec Sidebar responsive
    │   └── Sidebar.tsx     # Navigation principale dynamique selon le rôle
    ├── context/            # Contextes globaux de l'application
    │   ├── AuthContext.tsx # Gestion de session utilisateur et commutation de rôle
    │   └── ThemeContext.tsx# Gestion du mode Sombre / Clair
    └── lib/                # Bibliothèques et helpers utilitaires
        ├── db/
        │   ├── client.ts   # Configuration du client Supabase
        │   └── store.ts    # Store unifié LocalStorage / Fallback CRUD offline
        └── utils.ts        # Fonctions utilitaires génériques (ex: formateurs de devises)
```

---

## 🛠️ 4. Technologies Utilisées

*   **Framework Principal** : Next.js 16+ (React 19, TypeScript)
*   **Styling (Design)** : Tailwind CSS v4.0 (Utilisation de variables CSS natives, mode sombre, responsive complet)
*   **Animations** : Framer Motion (Transitions de pages fluides, accordéons, repli de la sidebar)
*   **Icônes** : Lucide React
*   **Gestion de Formulaires & Validation** : React Hook Form & Zod
*   **Visualisation Graphique** : Recharts (Graphiques de ventes, dépenses et projections de marge)
*   **Base de Données & Sécurité** :
    *   **Supabase (PostgreSQL)** : Hébergement distant avec triggers automatiques de calculs relationnels.
    *   **LocalStorage Fallback** : Store de secours (`LocalDbStore` dans `store.ts`) ultra-complet, pré-rempli de données simulées réalistes, permettant une exécution 100% fonctionnelle hors-ligne ou en mode démonstration sans base active.

---

## 🎨 5. Décisions de Design (Aesthetics)

1.  **Palette de Couleurs Premium** :
    *   Forte dominante sombre (`bg-slate-950` / `bg-slate-900`) pour une esthétique ultra-moderne et immersive.
    *   Accents de couleur vert émeraude (`emerald-400` / `emerald-500`) symbolisant la croissance financière, le profit et la validation des actions.
    *   Touches de bleu-gris et de bordures subtiles (`border-slate-800` / `border-slate-850`) pour délimiter les cartes de statistiques (KPIs) sans surcharger l'affichage.
2.  **Effet Glassmorphism** : Utilisation intensive de fonds semi-transparents avec floutage d'arrière-plan (`bg-slate-900/60 backdrop-blur-md`) pour les cartes interactives et les overlays de formulaires.
3.  **Micro-animations** : Hover effects progressifs sur les boutons, animations de chargement pulse sur les indicateurs de caisse en cours, et transitions légères lors des changements d'onglets pour une impression d'application réactive et vivante.

---

## 🤖 6. Instructions pour les Futures Sessions IA

Si vous êtes un modèle d'IA et que vous devez modifier ou étendre ce projet, veuillez respecter scrupuleusement les consignes suivantes :

### ⚠️ Règle de Synchronisation État & LocalStorage
Toutes les interactions de données passent par `LocalDbStore` dans [store.ts](file:///c:/Users/DELL/OneDrive/Desktop/ArafatBoucherieCompta/src/lib/db/store.ts). 
Si vous ajoutez une nouvelle fonctionnalité (comme une table ou un filtre), vous devez :
1. Déclarer son interface TypeScript dans `store.ts`.
2. Ajouter ses données mockées d'initialisation.
3. Implémenter les méthodes statiques CRUD correspondantes (ex: `getXYZ()`, `saveXYZ()`, `updateXYZ()`) en veillant à synchroniser les clés de `localStorage`.
4. Mettre à jour l'historique d'activité (`activity_logs`) lors de chaque modification de données pour préserver l'audit.

### 🛡️ Contrôle d'Accès Rôle (RBAC)
*   Ne contournez jamais les vérifications de rôle.
*   Si vous ajoutez un module d'administration, vérifiez que le chemin est protégé dans le routage ou masque la vue si `user.role !== 'admin'`.
*   Assurez-vous que la barre latérale ([Sidebar.tsx](file:///c:/Users/DELL/OneDrive/Desktop/ArafatBoucherieCompta/src/components/Sidebar.tsx)) continue de filtrer correctement les menus en fonction du rôle de l'utilisateur connecté.

### 📊 Intégrité Financière
*   Le calcul de la caisse journalière est le cœur de l'application. Tout ajout de dépenses ou de ventes doit immédiatement se répercuter sur la caisse active du jour via les déclencheurs de `LocalDbStore`.
*   Le prix unitaire et les montants totaux doivent être formatés proprement en FCFA en utilisant les fonctions de formatage localisées situées dans [utils.ts](file:///c:/Users/DELL/OneDrive/Desktop/ArafatBoucherieCompta/src/lib/utils.ts).
