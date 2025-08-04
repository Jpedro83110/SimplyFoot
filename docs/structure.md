# 📋 URLs et Pages de l'Application SimplyFoot

Documentation complète de toutes les routes et pages disponibles dans l'application SimplyFoot.

## 🏠 **Page d'accueil**

| URL | Page           | Description                              | Endpoints appelés            |
| --- | -------------- | ---------------------------------------- | ---------------------------- |
| `/` | Page d'accueil | Choix de connexion Club ou Joueur/Parent | `supabase.auth.getSession()` |

## 🔐 **Authentification**

| URL                        | Page             | Description                   | Endpoints appelés                                                                                                                                                 |
| -------------------------- | ---------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/auth/login-club`         | Connexion Club   | Connexion Président/Coach     | `supabase.auth.signInWithPassword()`                                                                                                                              |
| `/auth/login-joueur`       | Connexion Joueur | Connexion Parent/Joueur       | `supabase.auth.signInWithPassword()`                                                                                                                              |
| `/auth/inscription-joueur` | Inscription      | Création compte joueur/parent | `equipes.select()` (code équipe), `staff.select()` (coach), `supabase.auth.signUp()`, `utilisateurs.insert()`, `joueurs.insert()`, `decharges_generales.insert()` |

## ⚽ **Espace Joueur** (`/joueur/`)

### Pages principales

| URL                     | Page             | Description                       | Endpoints appelés                                                                                                                                                                                                                         |
| ----------------------- | ---------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/joueur/dashboard`     | Dashboard Joueur | Page d'accueil joueur avec résumé | `supabase.auth.getSession()`, `utilisateurs.select()`, `joueurs.select()`, `equipes.select()`, `clubs.select()`, `evenements.select()`, `participations_evenement.select()`, `messages_prives.select()`, `messages_groupe_coach.select()` |
| `/joueur/convocation`   | Convocations     | Liste des événements et réponses  | `supabase.auth.getSession()`, `utilisateurs.select()`, `joueurs.select()`, `evenements.select()`, `participations_evenement.select()`                                                                                                     |
| `/joueur/suivi-coach`   | Suivi Coach      | Retours personnalisés du coach    | `supabase.auth.getSession()`, `suivis_personnalises.select()`                                                                                                                                                                             |
| `/joueur/note-globale`  | Note Globale     | Note générale du joueur           | `supabase.auth.getSession()`, `utilisateurs.select()`, `joueurs.select()`                                                                                                                                                                 |
| `/joueur/equipe`        | Mon Équipe       | Liste des coéquipiers             | `supabase.auth.getSession()`, `utilisateurs.select()`, `joueurs.select()`                                                                                                                                                                 |
| `/joueur/anniversaires` | Anniversaires    | Calendrier anniversaires équipe   | `supabase.auth.getSession()`, `utilisateurs.select()`, `joueurs.select()`                                                                                                                                                                 |

### Évaluations (lecture seule)

| URL                      | Page                 | Description                 | Endpoints appelés                                               |
| ------------------------ | -------------------- | --------------------------- | --------------------------------------------------------------- |
| `/joueur/eval-mentale`   | Évaluation Mentale   | Consultation éval mentale   | `supabase.auth.getSession()`, `evaluations_mentales.select()`   |
| `/joueur/eval-technique` | Évaluation Technique | Consultation éval technique | `supabase.auth.getSession()`, `evaluations_techniques.select()` |

### Stages et programmes

| URL                       | Page            | Description                      | Endpoints appelés                                                        |
| ------------------------- | --------------- | -------------------------------- | ------------------------------------------------------------------------ |
| `/joueur/stages`          | Stages          | Consultation programmes stage    | `supabase.auth.getSession()`, `utilisateurs.select()`, `stages.select()` |
| `/joueur/programme-stage` | Programme Stage | Programmes détaillés avec export | `supabase.auth.getSession()`, `utilisateurs.select()`, `stages.select()` |

### Nutrition et conseils

| URL                          | Page              | Description                  | Endpoints appelés           |
| ---------------------------- | ----------------- | ---------------------------- | --------------------------- |
| `/joueur/nutrition/`         | Index Nutrition   | Menu nutrition et prévention | Aucun                       |
| `/joueur/nutrition/scanner`  | Scanner Nutrition | Scanner code-barres aliments | API OpenFoodFacts (externe) |
| `/joueur/nutrition/conseils` | Conseils          | Conseils nutrition (bientôt) | Aucun (désactivé)           |

### 💬 **Messagerie Joueur** (`/joueur/messages/`)

| URL                                 | Page               | Description            | Endpoints appelés                                                                                                                                     |
| ----------------------------------- | ------------------ | ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/joueur/messages/`                 | Index Messagerie   | Menu messagerie joueur | `supabase.auth.getSession()`, `utilisateurs.select()`, `joueurs.select()`, `decharges_generales.select()`                                             |
| `/joueur/messages/prives`           | Messages Privés    | Chat privé avec coach  | `supabase.auth.getSession()`, `utilisateurs.select()`, `joueurs.select()`, `equipes.select()`, `messages_prives.select()`, `messages_prives.insert()` |
| `/joueur/messages/groupes`          | Messages Groupe    | Chat groupe équipe     | `supabase.auth.getSession()`, `messages_groupe_coach.select()`                                                                                        |
| `/joueur/messages/besoin-transport` | Demandes Transport | Transport pour mineurs | `supabase.auth.getSession()`, `utilisateurs.select()`, `joueurs.select()`, `messages_besoin_transport.select()`                                       |

## 👨‍💼 **Espace Coach** (`/coach/`)

### Pages principales

| URL                         | Page            | Description                   | Endpoints appelés                                                                                                  |
| --------------------------- | --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `/coach/dashboard`          | Dashboard Coach | Page d'accueil coach          | `supabase.auth.getSession()`, `utilisateurs.select()`, `equipes.select()`, `clubs.select()`, `evenements.select()` |
| `/coach/creation-evenement` | Créer Événement | Création matchs/entraînements | `supabase.auth.getSession()`, `equipes.select()`, `evenements.insert()`                                            |
| `/coach/convocation`        | Convocations    | Gestion convocations équipe   | `supabase.auth.getSession()`, `evenements.select()`, `participations_evenement.select()`                           |

### Gestion joueurs

| URL                                | Page           | Description                 | Endpoints appelés                                                                                             |
| ---------------------------------- | -------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `/coach/joueur/[id]`               | Fiche Joueur   | Détail et suivi joueur      | `joueurs.select()`, `utilisateurs.select()`, `suivis_personnalises.select()`, `suivis_personnalises.upsert()` |
| `/coach/evaluation-mentale/[id]`   | Éval Mentale   | Évaluation mentale joueur   | `joueurs.select()`, `evaluations_mentales.select()`, `evaluations_mentales.upsert()`                          |
| `/coach/evaluation-technique/[id]` | Éval Technique | Évaluation technique joueur | `joueurs.select()`, `evaluations_techniques.select()`, `evaluations_techniques.upsert()`                      |

### 🏃‍♂️ **Équipes** (`/coach/equipe/`)

| URL                  | Page          | Description             | Endpoints appelés                                |
| -------------------- | ------------- | ----------------------- | ------------------------------------------------ |
| `/coach/equipe/`     | Mes Équipes   | Liste équipes du coach  | `supabase.auth.getSession()`, `equipes.select()` |
| `/coach/equipe/[id]` | Détail Équipe | Joueurs et infos équipe | `equipes.select()`, `joueurs.select()`           |

### 📋 **Compositions** (`/coach/composition/`)

| URL                       | Page               | Description             | Endpoints appelés                                                                           |
| ------------------------- | ------------------ | ----------------------- | ------------------------------------------------------------------------------------------- |
| `/coach/composition/`     | Liste Compositions | Événements à composer   | `supabase.auth.getSession()`, `evenements.select()`, `compositions.select()`                |
| `/coach/composition/[id]` | Composition        | Gestion compo événement | `evenements.select()`, `joueurs.select()`, `compositions.select()`, `compositions.upsert()` |

### 📝 **Feuilles de Match** (`/coach/feuille-match/`)

| URL                         | Page           | Description               | Endpoints appelés                                                                                               |
| --------------------------- | -------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `/coach/feuille-match/`     | Liste Feuilles | Événements futurs         | `supabase.auth.getSession()`, `evenements.select()`, `compositions.select()`                                    |
| `/coach/feuille-match/[id]` | Feuille Match  | Génération PDF officielle | `compositions.select()`, `evenements.select()`, `equipes.select()`, `utilisateurs.select()`, `joueurs.select()` |

### 💬 **Messagerie Coach** (`/coach/messages/`)

| URL                                | Page              | Description               | Endpoints appelés                                                                                |
| ---------------------------------- | ----------------- | ------------------------- | ------------------------------------------------------------------------------------------------ |
| `/coach/messages/`                 | Index Messagerie  | Menu messagerie coach     | `messages_besoin_transport.select()` (à implémenter)                                             |
| `/coach/messages/prives`           | Messages Privés   | Chat avec joueurs         | `supabase.auth.getSession()`, `messages_prives.select()`, `messages_prives.insert()`             |
| `/coach/messages/groupes`          | Messages Groupe   | Chat groupe équipe        | `supabase.auth.getSession()`, `messages_groupe_coach.select()`, `messages_groupe_coach.insert()` |
| `/coach/messages/besoin-transport` | Gestion Transport | Demandes transport équipe | `supabase.auth.getSession()`, `messages_besoin_transport.select()`                               |

## 🚗 **Transport** (`/transport/`)

| URL                       | Page              | Description                    | Endpoints appelés                                                          |
| ------------------------- | ----------------- | ------------------------------ | -------------------------------------------------------------------------- |
| `/transport/demande/[id]` | Demande Transport | Détails et signature transport | `messages_besoin_transport.select()`, `messages_besoin_transport.update()` |

## 🔧 **Layouts** (Endpoints de sécurité)

### `/joueur/_layout.js`

- **Endpoints :** `supabase.auth.getSession()`, `utilisateurs.select()`, `utilisateurs.update()` (token push)

### `/coach/_layout.js`

- **Endpoints :** `supabase.auth.getSession()`, `utilisateurs.select()`

## 📊 **Résumé des Tables Supabase utilisées**

### Tables principales

- **`utilisateurs`** - Données utilisateur et authentification
- **`joueurs`** - Profils joueurs et statistiques
- **`equipes`** - Informations équipes et codes
- **`clubs`** - Données clubs (logos, réseaux sociaux)
- **`evenements`** - Matchs, entraînements, stages
- **`staff`** - Profils staff (coaches, présidents)

### Tables fonctionnelles

- **`participations_evenement`** - Réponses aux convocations
- **`compositions`** - Compositions d'équipe validées
- **`messages_prives`** - Messagerie privée coach-joueur
- **`messages_groupe_coach`** - Messages de groupe équipe
- **`messages_besoin_transport`** - Demandes de transport
- **`suivis_personnalises`** - Suivis individuels par coach
- **`evaluations_mentales`** - Évaluations mentales
- **`evaluations_techniques`** - Évaluations techniques
- **`stages`** - Programmes de stages
- **`decharges_generales`** - Autorisations parentales
- **`notifications`** - Système de notifications

### APIs externes

- **OpenFoodFacts API** - Scanner nutritionnel (`https://world.openfoodfacts.org/api/v0/product/{code}.json`)
- **Expo Push Notifications** - Notifications push (`https://exp.host/--/api/v2/push/send`)

## 🗂️ **Architecture et Sécurité**

### Layouts de protection

#### `/joueur/_layout.js`

- **Rôles autorisés :** `joueur`, `admin`, `president`
- **Fonctionnalités :**
    - Vérification session utilisateur
    - Gestion notifications push (mobile)
    - Redirection auto vers dashboard
    - Header avec navigation

#### `/coach/_layout.js`

- **Rôles autorisés :** `coach`, `admin`
- **Fonctionnalités :**
    - Vérification rôle coach
    - Titres de pages dynamiques
    - Header avec navigation

## 🎯 **Paramètres Dynamiques**

### Routes avec `[id]`

- **`[id]`** → ID unique (joueur, événement, équipe, etc.)
- Permet l'accès aux détails spécifiques d'une entité
- Exemples :
    - `/coach/joueur/123` → Fiche du joueur ID 123
    - `/coach/composition/456` → Composition événement ID 456

## 📱 **Responsive Design**

### Adaptation Mobile/Web

- **Header adaptatif** avec bouton retour contextuel
- **Layouts responsifs** selon taille écran
- **Styles conditionnels** mobile/desktop
- **Navigation optimisée** tactile et souris

## 🔄 **Redirections Automatiques**

### Redirections par rôle

- **Non connecté** → `/auth/login-*`
- **Joueur sur `/joueur`** → `/joueur/dashboard`
- **Coach sur `/coach`** → `/coach/dashboard`
- **Rôle incorrect** → Page de connexion appropriée

## 🎨 **Thème et Design**

### Couleurs principales

- **Vert principal :** `#00ff88` (SimplyFoot Green)
- **Fond sombre :** `#121212` (Dark Theme)
- **Cartes :** `#1e1e1e` (Card Background)

### Icônes

- **Ionicons** pour interface générale
- **MaterialCommunityIcons** pour actions spécifiques
- **Emojis** pour identification rapide

---

_Documentation générée automatiquement - Dernière mise à jour : Janvier 2025_
