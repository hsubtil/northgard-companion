# Northgard – Compagnon de jeu

Application web (React + Vite + TypeScript) qui accompagne une partie de **Northgard: Uncharted Lands** pas à pas : mise en place, ordre des tours, phases de l’année, ligne des créatures, calculateur de combat, aide-mémoire des règles et journal.

## Lancer

```powershell
npm.cmd install
npm.cmd run dev      # http://localhost:5173
npm.cmd test         # tests unitaires (Vitest)
npm.cmd run build    # version de production dans dist/
```

## Fonctionnalités

- **Configuration** : 2 à 5 joueurs (ordre de table, couleur, clan), extensions *Wilderness* et *Warchiefs*, module Créatures, variantes (Partie longue, Plus de créatures !, jeu en équipe).
- **Mise en place** : liste de contrôle adaptée au nombre de joueurs et aux modules (nombre de cartes Développement, pioche Créature, ressources de départ selon la position, tuiles Environnement, Antre de la Wyverne…).
- **Déroulement guidé** : année et phase en cours, joueur actif, choix du tour (jouer / attendre / remplacer / retirer / améliorer / passer), rappels de pouvoir de clan et de chef de guerre, gestion du marqueur Premier joueur.
- **Créatures** : quand une tuile avec repaire est explorée, l’application demande quelle créature est piochée et l’ajoute à la ligne des créatures ; phase Créatures guidée de gauche à droite.
- **Combat** : calcul du score et des pertes (dé, nourriture, forteresses, tours, chefs de guerre, Kaija, créatures).
- **Récolte / Hiver / Fin d’année** : renommée des territoires fermés, coût d’hiver selon le nombre d’unités, cartes Troubles.
- **Annuler** (100 niveaux) et sauvegarde automatique dans le navigateur (`localStorage`).

## Identité visuelle

Le thème s’inspire des paysages bleu orage et des titres blancs du [site Northgard](https://northgard.net/). Le logo boussole, le favicon et le paysage SVG sont des créations originales dans `public/` ; aucun visuel officiel ni police distante n’est embarqué. Le compagnon est non officiel et non affilié aux créateurs du jeu.

Les couleurs et styles partagés sont dans `src/index.css`. Les visuels restent servis localement et utilisent le chemin de base Vite pour GitHub Pages.

## Où modifier les règles

Tout le contenu de règles est dans `src/data/` (textes en français) :

| Fichier | Contenu |
| --- | --- |
| `clans.ts` | Clans, pouvoirs et chefs de guerre |
| `creatures.ts` | Créatures, effets, priorités de déplacement |
| `environment.ts` | Tuiles Environnement (Wilderness) |
| `reference.ts` | Phases, actions, bâtiments, coûts d’hiver, faces du dé, aide-mémoire |
| `expansions.ts` | Registre des extensions |

La logique de règles (calculs) est dans `src/logic/` et testée par `*.test.ts`.

## Ajouter Uncharted Horizon

1. Passer `available: true` pour `unchartedHorizon` dans `src/data/expansions.ts`.
2. Ajouter les options de module dans `ModuleConfig` (`src/types.ts`) et dans `ConfigScreen.tsx`.
3. Ajouter les étapes de mise en place dans `src/logic/setup.ts` et les rappels dans les composants de phase (`src/components/phases/`).

## Points à vérifier

- Les valeurs de combat / renommée de certaines créatures ne figurent pas dans les livrets : saisissez-les depuis la carte dans le calculateur (« Autre créature »).
- La couleur du 5ᵉ joueur est libre (6 couleurs proposées).
- Jeu en équipe : les joueurs doivent être saisis dans l’ordre de table (équipes 1 & 3 contre 2 & 4).
