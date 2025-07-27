# Architecture Frontend SimplyFoot

## Diagramme d'architecture de l'application (Mermaid)

```mermaid
---
title: SimplyFoot Frontend Architecture
---
flowchart TD
    subgraph APP ["📱 Application Mobile"]
        MAIN[app.js]

        subgraph AUTH ["🔐 Authentication"]
            LOGIN_PRES[login-president.js]
            LOGIN_COACH[login-coach.js]
            LOGIN_JOUEUR[login-joueur.js]
        end

        subgraph DASH ["🏠 Dashboards"]
            DASH_PRES[president/dashboard.js]
            DASH_COACH[coach/dashboard.js]
            DASH_JOUEUR[joueur/dashboard.js]
        end

        subgraph PRES ["👑 Modules Président"]
            PRES_BUDGET[president/gestion-budget.js]
            PRES_ANNIV[president/anniversaires.js]
        end

        subgraph COACH ["🎽 Modules Coach"]
            COACH_EQUIPE[coach/equipe/index.js]
            COACH_STATS[coach/statistiques.js]
            COACH_CONV[coach/convocation]
            COACH_EVAL[coach/evaluation]
        end

        subgraph JOUEUR ["⚽ Modules Joueur"]
            JOUEUR_EQUIPE[joueur/equipe.js]
            JOUEUR_NOTE[joueur/note-globale.js]
            JOUEUR_SUIVI[joueur/suivi-coach.js]
        end
    end

    subgraph SERVICES ["🔧 Services"]
        SUPABASE[lib/supabase.js]
        CACHE[lib/cache.js]
        AUTH_LIB[lib/auth.js]
    end

    subgraph COMPONENTS ["🧩 Components"]
        TEAM_CARD[components/TeamCard.js]
        CALENDRIER[components/CalendrierAnniversaires.js]
    end

    MAIN --> LOGIN_PRES
    MAIN --> LOGIN_COACH
    MAIN --> LOGIN_JOUEUR

    LOGIN_PRES --> DASH_PRES
    LOGIN_COACH --> DASH_COACH
    LOGIN_JOUEUR --> DASH_JOUEUR

    DASH_PRES --> PRES_BUDGET
    DASH_PRES --> PRES_ANNIV

    DASH_COACH --> COACH_EQUIPE
    DASH_COACH --> COACH_STATS
    DASH_COACH --> COACH_CONV
    DASH_COACH --> COACH_EVAL

    DASH_JOUEUR --> JOUEUR_EQUIPE
    DASH_JOUEUR --> JOUEUR_NOTE
    DASH_JOUEUR --> JOUEUR_SUIVI

    AUTH -.-> AUTH_LIB
    DASH -.-> CACHE
    SERVICES -.-> SUPABASE

    COACH -.-> TEAM_CARD
    PRES_ANNIV -.-> CALENDRIER
```

## Structure des dossiers

```
📁 SimplyFoot/
├── 📁 app/
│   ├── 📁 auth/
│   │   ├── login-president.js
│   │   ├── login-coach.js
│   │   ├── login-joueur.js
│   │   ├── inscription-president.js
│   │   ├── inscription-coach.js
│   │   └── inscription-joueur.js
│   ├── 📁 president/
│   │   ├── dashboard.js
│   │   ├── gestion-budget.js
│   │   ├── anniversaires.js
│   │   └── abonnement.js
│   ├── 📁 coach/
│   │   ├── dashboard.js
│   │   ├── creation-equipe.js
│   │   ├── statistiques.js
│   │   ├── programme-stage.js
│   │   ├── anniversaires.js
│   │   ├── 📁 equipe/
│   │   ├── 📁 joueur/
│   │   ├── 📁 convocation/
│   │   ├── 📁 composition/
│   │   ├── 📁 feuille-match/
│   │   ├── 📁 evaluation-mentale/
│   │   └── 📁 evaluation-technique/
│   └── 📁 joueur/
│       ├── dashboard.js
│       ├── equipe.js
│       ├── convocation.js
│       ├── suivi-coach.js
│       ├── note-globale.js
│       ├── eval-mentale.js
│       ├── eval-technique.js
│       ├── programme-stage.js
│       ├── anniversaires.js
│       └── 📁 nutrition/
├── 📁 lib/
│   ├── supabase.js
│   ├── auth.js
│   ├── cache.js
│   ├── notifications.js
│   └── formatDate.js
├── 📁 components/
│   ├── TeamCard.js
│   ├── NutritionScanner.js
│   └── CalendrierAnniversaires.js
└── 📁 assets/
    ├── 📁 badges/
    ├── 📁 minilogo/
    └── logo.png
```

## Flux de navigation par rôle

### 🔐 Authentification

```
Landing → [Choix rôle] → Login/Signup → Dashboard
```

### 👑 Président

```
Dashboard → Gestion Budget
         → Anniversaires
         → Abonnement
```

### 🎽 Coach

```
Dashboard → Équipes → Détail équipe → Joueur → Évaluations
         → Création équipe
         → Statistiques
         → Convocations
         → Compositions
         → Feuilles de match
         → Programme stage
         → Anniversaires
```

### ⚽ Joueur

```
Dashboard → Mon équipe
         → Convocations
         → Suivi coach
         → Note globale
         → Évaluations (lecture)
         → Programme stage
         → Anniversaires
         → Nutrition scanner
```

## Technologies utilisées

- **Framework** : React Native avec Expo
- **Navigation** : Expo Router
- **Base de données** : Supabase
- **Cache** : Custom cache system avec AsyncStorage
- **Notifications** : Expo Notifications
- **Caméra** : Expo Camera (scanner nutrition)
- **Charts** : react-native-chart-kit
- **State Management** : React Hooks + Custom cache
  class COACH_EQUIPE,COACH_EQUIPE_DETAIL,COACH_JOUEUR,COACH_CREATION,COACH_STATS,COACH_CONV,COACH_COMPO,COACH_FEUILLE,COACH_PROG,COACH_ANNIV,COACH_EVAL_MENTAL,COACH_EVAL_TECH coachStyle
  class JOUEUR_EQUIPE,JOUEUR_CONV,JOUEUR_SUIVI,JOUEUR_NOTE,JOUEUR_EVAL_MENTAL,JOUEUR_EVAL_TECH,JOUEUR_PROG,JOUEUR_ANNIV,JOUEUR_NUTRITION,JOUEUR_NUTRITION_REAL joueurStyle
  class SUPABASE,AUTH_LIB,CACHE,NOTIFICATIONS,FORMAT_DATE serviceStyle
  class TEAM_CARD,NUTRITION_SCANNER,CALENDRIER componentStyle
  class DB_USERS,DB_CLUBS,DB_EQUIPES,DB_JOUEURS,DB_STAFF,DB_EVENTS,DB_EVAL,DB_BUDGET,STORAGE dbStyle

```

## Structure des dossiers

```

📁 SimplyFoot/
├── 📁 app/
│ ├── 📁 auth/
│ │ ├── login-president.js
│ │ ├── login-coach.js
│ │ ├── login-joueur.js
│ │ ├── inscription-president.js
│ │ ├── inscription-coach.js
│ │ └── inscription-joueur.js
│ ├── 📁 president/
│ │ ├── dashboard.js
│ │ ├── gestion-budget.js
│ │ ├── anniversaires.js
│ │ └── abonnement.js
│ ├── 📁 coach/
│ │ ├── dashboard.js
│ │ ├── creation-equipe.js
│ │ ├── statistiques.js
│ │ ├── programme-stage.js
│ │ ├── anniversaires.js
│ │ ├── 📁 equipe/
│ │ ├── 📁 joueur/
│ │ ├── 📁 convocation/
│ │ ├── 📁 composition/
│ │ ├── 📁 feuille-match/
│ │ ├── 📁 evaluation-mentale/
│ │ └── 📁 evaluation-technique/
│ └── 📁 joueur/
│ ├── dashboard.js
│ ├── equipe.js
│ ├── convocation.js
│ ├── suivi-coach.js
│ ├── note-globale.js
│ ├── eval-mentale.js
│ ├── eval-technique.js
│ ├── programme-stage.js
│ ├── anniversaires.js
│ └── 📁 nutrition/
├── 📁 lib/
│ ├── supabase.js
│ ├── auth.js
│ ├── cache.js
│ ├── notifications.js
│ └── formatDate.js
├── 📁 components/
│ ├── TeamCard.js
│ ├── NutritionScanner.js
│ └── CalendrierAnniversaires.js
└── 📁 assets/
├── 📁 badges/
├── 📁 minilogo/
└── logo.png

```

## Flux de navigation par rôle

### 🔐 Authentification

```

Landing → [Choix rôle] → Login/Signup → Dashboard

```

### 👑 Président

```

Dashboard → Gestion Budget
→ Anniversaires
→ Abonnement

```

### 🎽 Coach

```

Dashboard → Équipes → Détail équipe → Joueur → Évaluations
→ Création équipe
→ Statistiques
→ Convocations
→ Compositions
→ Feuilles de match
→ Programme stage
→ Anniversaires

```

### ⚽ Joueur

```

Dashboard → Mon équipe
→ Convocations
→ Suivi coach
→ Note globale
→ Évaluations (lecture)
→ Programme stage
→ Anniversaires
→ Nutrition scanner

```

## Technologies utilisées

- **Framework** : React Native avec Expo
- **Navigation** : Expo Router
- **Base de données** : Supabase
- **Cache** : Custom cache system avec AsyncStorage
- **Notifications** : Expo Notifications
- **Caméra** : Expo Camera (scanner nutrition)
- **Charts** : react-native-chart-kit
- **State Management** : React Hooks + Custom cache
```
