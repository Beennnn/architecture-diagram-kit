# Excalidraw

`badges.excalidraw` — une **scène** contenant les 82 badges, à ouvrir puis à
copier-coller vers vos propres schémas. Le copier-coller entre scènes emporte
les images.

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
