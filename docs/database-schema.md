# Architecture Frontend SimplyFoot

## Diagramme d'architecture de l'application (Mermaid)

```mermaid
graph TB
    %% Structure principale
    subgraph "📱 Application Mobile (Expo/React Native)"
        APP[app.js]

        %% Authentification
        subgraph "🔐 Authentication"
            LOGIN_PRES[login-president.js]
            LOGIN_COACH[login-coach.js]
            LOGIN_JOUEUR[login-joueur.js]
            SIGNUP_PRES[inscription-president.js]
            SIGNUP_COACH[inscription-coach.js]
            SIGNUP_JOUEUR[inscription-joueur.js]
        end

        %% Dashboards principaux
        subgraph "🏠 Dashboards"
            DASH_PRES[president/dashboard.js]
            DASH_COACH[coach/dashboard.js]
            DASH_JOUEUR[joueur/dashboard.js]
        end

        %% Modules président
        subgraph "👑 Modules Président"
            PRES_BUDGET[president/gestion-budget.js]
            PRES_ANNIV[president/anniversaires.js]
            PRES_ABON[president/abonnement.js]
        end

        %% Modules coach
        subgraph "🎽 Modules Coach"
            COACH_EQUIPE[coach/equipe/index.js]
            COACH_EQUIPE_DETAIL["coach/equipe/[id].js"]
            COACH_JOUEUR["coach/joueur/[id].js"]
            COACH_CREATION[coach/creation-equipe.js]
            COACH_STATS[coach/statistiques.js]
            COACH_CONV["coach/convocation/[id].js"]
            COACH_COMPO[coach/composition/index.js]
            COACH_FEUILLE[coach/feuille-match/index.js]
            COACH_PROG[coach/programme-stage.js]
            COACH_ANNIV[coach/anniversaires.js]
            COACH_EVAL_MENTAL["coach/evaluation-mentale/[id].js"]
            COACH_EVAL_TECH["coach/evaluation-technique/[id].js"]
        end

        %% Modules joueur
        subgraph "⚽ Modules Joueur"
            JOUEUR_EQUIPE[joueur/equipe.js]
            JOUEUR_CONV[joueur/convocation.js]
            JOUEUR_SUIVI[joueur/suivi-coach.js]
            JOUEUR_NOTE[joueur/note-globale.js]
            JOUEUR_EVAL_MENTAL[joueur/eval-mentale.js]
            JOUEUR_EVAL_TECH[joueur/eval-technique.js]
            JOUEUR_PROG[joueur/programme-stage.js]
            JOUEUR_ANNIV[joueur/anniversaires.js]
            JOUEUR_NUTRITION[joueur/nutrition/scanner.js]
            JOUEUR_NUTRITION_REAL[joueur/nutrition/NutritionScannerReal.js]
        end
    end

    %% Couche de services
    subgraph "🔧 Services & Utils"
        SUPABASE[lib/supabase.js]
        AUTH[lib/auth.js]
        CACHE[lib/cache.js]
        NOTIFICATIONS[lib/notifications.js]
        FORMAT_DATE[lib/formatDate.js]
    end

    %% Composants partagés
    subgraph "🧩 Components"
        TEAM_CARD[components/TeamCard.js]
        NUTRITION_SCANNER[components/NutritionScanner.js]
        CALENDRIER[components/CalendrierAnniversaires.js]
    end

    %% Base de données
    subgraph "💾 Database (Supabase)"
        DB_USERS[(utilisateurs)]
        DB_CLUBS[(clubs)]
        DB_EQUIPES[(equipes)]
        DB_JOUEURS[(joueurs)]
        DB_STAFF[(staff)]
        DB_EVENTS[(evenements)]
        DB_EVAL[(evaluations)]
        DB_BUDGET[(budgets)]
        STORAGE[(Storage)]
    end

    %% Relations principales
    APP --> LOGIN_PRES
    APP --> LOGIN_COACH
    APP --> LOGIN_JOUEUR

    %% Flux d'authentification
    LOGIN_PRES --> DASH_PRES
    LOGIN_COACH --> DASH_COACH
    LOGIN_JOUEUR --> DASH_JOUEUR

    SIGNUP_PRES --> DASH_PRES
    SIGNUP_COACH --> DASH_COACH
    SIGNUP_JOUEUR --> DASH_JOUEUR

    %% Dashboards vers modules
    DASH_PRES --> PRES_BUDGET
    DASH_PRES --> PRES_ANNIV
    DASH_PRES --> PRES_ABON

    DASH_COACH --> COACH_EQUIPE
    DASH_COACH --> COACH_CREATION
    DASH_COACH --> COACH_STATS
    DASH_COACH --> COACH_CONV
    DASH_COACH --> COACH_COMPO
    DASH_COACH --> COACH_FEUILLE
    DASH_COACH --> COACH_PROG
    DASH_COACH --> COACH_ANNIV

    DASH_JOUEUR --> JOUEUR_EQUIPE
    DASH_JOUEUR --> JOUEUR_CONV
    DASH_JOUEUR --> JOUEUR_SUIVI
    DASH_JOUEUR --> JOUEUR_NOTE
    DASH_JOUEUR --> JOUEUR_EVAL_MENTAL
    DASH_JOUEUR --> JOUEUR_EVAL_TECH
    DASH_JOUEUR --> JOUEUR_PROG
    DASH_JOUEUR --> JOUEUR_ANNIV
    DASH_JOUEUR --> JOUEUR_NUTRITION

    %% Relations entre modules
    COACH_EQUIPE --> COACH_EQUIPE_DETAIL
    COACH_EQUIPE_DETAIL --> COACH_JOUEUR
    COACH_JOUEUR --> COACH_EVAL_MENTAL
    COACH_JOUEUR --> COACH_EVAL_TECH

    JOUEUR_NUTRITION --> JOUEUR_NUTRITION_REAL

    %% Utilisation des services
    LOGIN_PRES -.-> AUTH
    LOGIN_COACH -.-> AUTH
    LOGIN_JOUEUR -.-> AUTH

    DASH_PRES -.-> CACHE
    DASH_COACH -.-> CACHE
    DASH_JOUEUR -.-> CACHE

    COACH_STATS -.-> CACHE
    PRES_BUDGET -.-> FORMAT_DATE
    COACH_PROG -.-> FORMAT_DATE
    JOUEUR_PROG -.-> FORMAT_DATE

    %% Utilisation des composants
    DASH_COACH -.-> TEAM_CARD
    JOUEUR_NUTRITION -.-> NUTRITION_SCANNER
    PRES_ANNIV -.-> CALENDRIER
    COACH_ANNIV -.-> CALENDRIER
    JOUEUR_ANNIV -.-> CALENDRIER

    %% Connexions base de données
    AUTH -.-> SUPABASE
    SUPABASE -.-> DB_USERS
    SUPABASE -.-> DB_CLUBS
    SUPABASE -.-> DB_EQUIPES
    SUPABASE -.-> DB_JOUEURS
    SUPABASE -.-> DB_STAFF
    SUPABASE -.-> DB_EVENTS
    SUPABASE -.-> DB_EVAL
    SUPABASE -.-> DB_BUDGET
    SUPABASE -.-> STORAGE

    %% Notifications
    DASH_PRES -.-> NOTIFICATIONS
    DASH_COACH -.-> NOTIFICATIONS
    DASH_JOUEUR -.-> NOTIFICATIONS

    %% Styles
    classDef authStyle fill:#e1f5fe
    classDef dashStyle fill:#f3e5f5
    classDef presStyle fill:#fff3e0
    classDef coachStyle fill:#e8f5e8
    classDef joueurStyle fill:#fce4ec
    classDef serviceStyle fill:#f1f8e9
    classDef componentStyle fill:#e3f2fd
    classDef dbStyle fill:#ffebee

    class LOGIN_PRES,LOGIN_COACH,LOGIN_JOUEUR,SIGNUP_PRES,SIGNUP_COACH,SIGNUP_JOUEUR authStyle
    class DASH_PRES,DASH_COACH,DASH_JOUEUR dashStyle
    class PRES_BUDGET,PRES_ANNIV,PRES_ABON presStyle
    class COACH_EQUIPE,COACH_EQUIPE_DETAIL,COACH_JOUEUR,COACH_CREATION,COACH_STATS,COACH_CONV,COACH_COMPO,COACH_FEUILLE,COACH_PROG,COACH_ANNIV,COACH_EVAL_MENTAL,COACH_EVAL_TECH coachStyle
    class JOUEUR_EQUIPE,JOUEUR_CONV,JOUEUR_SUIVI,JOUEUR_NOTE,JOUEUR_EVAL_MENTAL,JOUEUR_EVAL_TECH,JOUEUR_PROG,JOUEUR_ANNIV,JOUEUR_NUTRITION,JOUEUR_NUTRITION_REAL joueurStyle
    class SUPABASE,AUTH,CACHE,NOTIFICATIONS,FORMAT_DATE serviceStyle
    class TEAM_CARD,NUTRITION_SCANNER,CALENDRIER componentStyle
    class DB_USERS,DB_CLUBS,DB_EQUIPES,DB_JOUEURS,DB_STAFF,DB_EVENTS,DB_EVAL,DB_BUDGET,STORAGE dbStyle
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
