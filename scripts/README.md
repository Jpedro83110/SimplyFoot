# 🚀 Simulateur de Trafic SimplyFoot

Script de simulation de trafic pour tester les performances de votre application SimplyFoot avec Supabase.

## 🔧 Installation

```bash
cd scripts
npm install
```

## ⚙️ Configuration

✅ **Les URLs Supabase sont déjà configurées** dans le simulateur avec vos vraies valeurs :

- URL: `https://vkcojgudsrypkyxoendl.supabase.co`
- Clé anonyme: Configurée automatiquement

**Optionnel** - Créez des comptes de test pour une simulation plus réaliste :

- `test-joueur-1@simplyfoot.test`
- `test-coach-1@simplyfoot.test`
- etc.

## 🏃‍♂️ Utilisation

### Simulation rapide (5 utilisateurs, 30s)

```bash
npm run simulate:light
```

### Simulation normale (20 utilisateurs, 2min)

```bash
npm run simulate:medium
```

### Simulation intensive (50 utilisateurs, 5min)

```bash
npm run simulate:heavy
```

### Test de stress (100 utilisateurs, 10min)

```bash
npm run simulate:stress
```

### Simulation personnalisée

```bash
node traffic-simulator.js [utilisateurs] [durée_ms] [montée_ms] [--verbose]
```

**Exemples:**

```bash
# 30 utilisateurs pendant 3 minutes avec montée progressive de 20s
node traffic-simulator.js 30 180000 20000

# Mode verbose pour voir tous les détails
node traffic-simulator.js 10 60000 10000 --verbose
```

## 📊 Scénarios Simulés

### 👤 Utilisateur Joueur

- **Dashboard** - Récupération données tableau de bord
- **Convocations** - Consultation événements et réponses
- **Messages** - Lecture messages privés et groupe
- **Équipe** - Consultation coéquipiers
- **Évaluations** - Consultation évaluations mentales/techniques
- **Participation** - Mise à jour statut événement

### 👨‍💼 Utilisateur Coach

- **Dashboard Coach** - Vue d'ensemble équipes et événements
- **Gestion Équipes** - Consultation joueurs et équipes
- **Événements** - Gestion matchs et entraînements
- **Composition** - Mise à jour compositions d'équipe
- **Messages** - Envoi messages groupe et privés
- **Joueurs** - Consultation fiches détaillées

## 📈 Métriques Collectées

### Performance

- **Requêtes/seconde (RPS)**
- **Temps de réponse** (min/max/moyenne)
- **Taux d'erreur**
- **Throughput total**

### Détails

- **Endpoints les plus sollicités**
- **Types d'erreurs rencontrées**
- **Répartition par utilisateur**
- **Progression temporelle**

## 📁 Rapports

Les rapports sont automatiquement sauvegardés dans `scripts/reports/`:

```
traffic-report-[timestamp].json
```

### Structure du rapport

```json
{
  "simulation": {
    "users": 20,
    "duration": 120.5,
    "scenarios": ["joueur", "coach"]
  },
  "performance": {
    "totalRequests": 2456,
    "requestsPerSecond": 20.38,
    "errorRate": 1.2,
    "responseTime": {
      "average": 145,
      "min": 23,
      "max": 2341
    }
  },
  "endpoints": { ... },
  "errors": { ... }
}
```

## 🎯 Cas d'Usage

### Test de Montée en Charge

```bash
# Progression: 5 → 20 → 50 utilisateurs
npm run simulate:light
npm run simulate:medium
npm run simulate:heavy
```

### Test de Limite Supabase

```bash
# Augmentez progressivement jusqu'à voir des erreurs
node traffic-simulator.js 100 300000 30000
node traffic-simulator.js 200 300000 60000
```

### Test de Stabilité

```bash
# Simulation longue avec charge modérée
node traffic-simulator.js 25 1800000 30000  # 30 minutes
```

## ⚠️ Limitations Supabase

### Plan Gratuit

- **25 000 requêtes/mois**
- **2 connexions simultanées max**
- **500 MB base de données**

### Plan Pro

- **500 000 requêtes/mois**
- **15 connexions simultanées**
- **8 GB base de données**

## 🔍 Analyse des Résultats

### Performances Acceptables

- **RPS**: 10-50 req/sec selon plan
- **Temps réponse**: < 500ms en moyenne
- **Taux erreur**: < 5%

### Signaux d'Alarme

- **429 Too Many Requests** → Limite de taux atteinte
- **503 Service Unavailable** → Surcharge serveur
- **Timeouts fréquents** → Connexions insuffisantes

## 🛠️ Personnalisation

### Ajouter de nouveaux scénarios

```javascript
async simulateNouveauScenario(userClient) {
  return this.makeRequest(userClient, 'mon-endpoint', async () => {
    const { data } = await userClient.client
      .from('ma_table')
      .select('*')
    return data
  })
}
```

### Modifier la répartition utilisateurs

```javascript
const userType = ["joueur", "coach", "admin"][i % 3]; // 33% chaque type
```

# 🏟️ Génération de Clubs de Test

### Création de clubs réalistes

Créez des clubs complets avec joueurs, coaches, événements et données pour un mois :

```bash
# Club petit (3 équipes, 60 joueurs, 3 coaches)
npm run create:club:small

# Club moyen (6 équipes, 150 joueurs, 6 coaches)
npm run create:club:medium

# Club grand (10 équipes, 250 joueurs, 10 coaches)
npm run create:club:large

# Très grand club (15 équipes, 400 joueurs, 15 coaches)
npm run create:club:huge
```

### Création manuelle

```bash
node create-test-club.js create [small|medium|large|huge]
```

### Suppression d'un club de test

```bash
node create-test-club.js delete [CLUB_ID]
```

### 📊 Données générées par club

- **Club** avec code d'accès unique
- **Coaches** avec comptes authentifiés
- **Équipes** avec codes équipe
- **Joueurs** (70% mineurs) avec comptes
- **Événements** (matchs + entraînements) pour 1 mois
- **Participations** aux événements (85% de réponses)
- **Compositions** pour tous les matchs
- **Messages** privés et de groupe
- **Évaluations** mentales et techniques
- **Décharges parentales** pour mineurs

## 🔧 Installation complète

```bash
cd scripts
npm install
```

Installe :

- `@supabase/supabase-js` pour les requêtes
- `@faker-js/faker` pour la génération de données

## 📈 Simulation avec clubs réels

1. **Créez d'abord un club de test** :

   ```bash
   npm run create:club:medium
   ```

2. **Récupérez les identifiants** dans le rapport généré

3. **Lancez la simulation** avec de vrais utilisateurs :
   ```bash
   npm run simulate:medium
   ```

Le simulateur utilisera automatiquement les comptes créés avec le générateur de clubs !

## 🎯 Comptes de test générés

### Format des emails

- **Coaches** : `coach-[prenom].[nom]@test.simplyfoot.com`
- **Joueurs** : `joueur-[prenom].[nom]@test.simplyfoot.com`

### Mot de passe universel

- **Tous les comptes** : `TestPassword123!`

### Codes d'accès

- **Club** : `CLUB` + 6 caractères aléatoires
- **Équipes** : `EQ` + 6 caractères aléatoires

## 📁 Rapports de génération

Les rapports sont sauvegardés dans `scripts/reports/` :

```
test-club-[taille]-[timestamp].json
```

Contient toutes les informations du club créé pour référence.

---

_Documentation SimplyFoot Traffic Simulator v1.0_
