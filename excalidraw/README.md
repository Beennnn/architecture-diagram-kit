# Excalidraw

Deux scènes, à ouvrir puis copier-coller vers vos propres schémas. Le
copier-coller entre scènes emporte les images.

| Fichier | Contenu |
|---|---|
| `badges.excalidraw` | les 122 signes, avec leur nom |
| `grammaire.excalidraw` | les neuf formes, la zone imbriquée, le sujet accentué |

## Ce que la grammaire perd ici

`grammaire.excalidraw` porte les fonds de l'[ADR 0007](../docs/adr/0007-echelle-de-fonds-et-accent.md)
exactement — et ce sont eux qui portent la forme et l'emboîtement. Le reste se
dégrade, ce que la planche écrit sur elle-même plutôt que de le taire :

- `strokeWidth` ne prend que **1, 2 ou 4** : nos 1,3 · 1,6 · 2,4 · 3,2 px s'y
  ramènent à 1 · 1 · 2 · 4 ;
- l'interface ne propose que deux arrondis, sans exposer de rayon : `rx` 3, 8,
  10 et 12 deviennent le même angle, donc « matériel » et « application » se
  confondent ;
- il n'existe pas de cylindre : le stockage est un rectangle et une ellipse
  groupés, que rien n'empêche de dissocier ;
- le tireté n'est pas paramétrable : « externe » et « zone » ne se distinguent
  plus que par leur fond.

C'est la raison d'être de l'[ADR 0004](../docs/adr/0004-excalidraw-voie-secondaire.md) :
esquissez ici, produisez dans draw.io, dont la bibliothèque `grammaire.xml`
porte la grammaire sans perte.

## Pourquoi une scène et non une bibliothèque

Parce qu'une bibliothèque Excalidraw **ne peut pas contenir d'images**.

Vérifié dans `@excalidraw/excalidraw` 0.18.1 : le type `ExportedLibraryData`
ne déclare que `{ type, version, source, libraryItems }` — aucune propriété
`files` — et `loadLibraryFromBlob` ne renvoie que des `LibraryItem[]`. Un
élément `image` placé dans une bibliothèque référencerait donc un `fileId`
inexistant, et s'afficherait comme un cadre vide.

Le type `ExportedDataState` d'une scène, lui, porte bien `files`. C'est le seul
format d'Excalidraw capable de transporter nos badges.

## Ce que contient la scène

82 groupes de deux éléments — une image (le symbole) et un texte (le nom) —
rangés par population. Comme pour draw.io, **c'est Excalidraw qui écrit le
nom**, pas le SVG : le libellé reste sélectionnable, modifiable et cherchable.

L'identifiant de chaque fichier est le SHA-1 de son SVG, ce qui rend la scène
reproductible d'une génération à l'autre.

## Alternative sans rien installer

Excalidraw accepte le **glisser-déposer d'un fichier SVG** sur le canvas. Les
fichiers de `symboles/` et de `lockups/` fonctionnent donc directement, sans
passer par cette scène.

## Régénérer

```bash
node scripts/excalidraw.mjs
```
