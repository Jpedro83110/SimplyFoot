# Guide de Migration JavaScript → TypeScript

## Stratégie de migration progressive

### 1. Étapes pour convertir un fichier

1. **Renommer l'extension** : `.js` → `.ts` ou `.jsx` → `.tsx`
2. **Ajouter les types progressivement** :
   - Commencer par les paramètres de fonctions
   - Ajouter les types de retour
   - Typer les variables importantes
3. **Importer les types nécessaires**
4. **Corriger les erreurs TypeScript une par une**

### 2. Ordre de conversion recommandé

1. **Utilitaires** (`lib/`) - Déjà fait pour `formatDate.ts` et `cache.ts`
2. **Types et interfaces** (`types/`)
3. **Composants réutilisables** (`components/`)
4. **Hooks personnalisés**
5. **Pages principales** (`app/`)

### 3. Types prioritaires à créer

```typescript
// Types pour les props des composants
interface TeamCardProps {
  equipe: Tables<"equipes"> & { joueurs?: number };
  onPress?: () => void;
}

// Types pour les états de formulaires
interface FormData {
  titre: string;
  dateDebut: string;
  dateFin: string;
  // ...
}

// Types pour les réponses API
interface ApiResponse<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
}
```

### 4. Configuration VSCode recommandée

Ajoutez dans `.vscode/settings.json` :

```json
{
  "typescript.preferences.files.excludeFileFromAutoImport": ["**/*.js"],
  "typescript.suggest.autoImports": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true
  }
}
```

### 5. Scripts NPM utiles

```json
"scripts": {
  "type-check": "tsc --noEmit",
  "type-check:watch": "tsc --noEmit --watch"
}
```
