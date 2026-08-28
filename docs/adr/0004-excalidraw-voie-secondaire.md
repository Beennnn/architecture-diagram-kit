# 0004 — Garder la voie Excalidraw, en second

- **Statut** : acceptée
- **Date** : 2026-08-28

## Contexte

Excalidraw n'a pas été demandé : il est apparu dans une proposition de fin de
message, puis a été construit. Trois faits sont ressortis en le construisant,
et ils doivent être consignés parce qu'ils ont failli faire abandonner la voie.

**Une bibliothèque Excalidraw ne peut pas contenir d'images.** Vérifié dans
`@excalidraw/excalidraw` 0.18.1 : `ExportedLibraryData` ne déclare que
`{ type, version, source, libraryItems }`, sans propriété `files`, et
`loadLibraryFromBlob` ne renvoie que des `LibraryItem[]`. Le livrable ne pouvait
donc pas être un stencil. Il a fallu basculer sur une **scène**, dont le type
`ExportedDataState` porte bien `files`.

**Le gratuit ne donne qu'une seule scène persistante** dans le cloud
d'Excalidraw. Excalidraw+ (≈ 6–7 $/mois/personne) débloque les scènes
illimitées, les dossiers, les droits d'accès et les commentaires.

**draw.io n'a aucune collaboration temps réel.** Son dépôt l'indique
explicitement : l'édition concurrente dépend entièrement du backend de stockage.
Son modèle est asynchrone.

## Décision

**Garder la voie Excalidraw, comme voie secondaire.** draw.io reste
l'intégration de référence, citée en premier partout dans la documentation.

## Justification

**La scène est le seul artefact qui prouve que les badges vivent hors de
draw.io.** C'est l'argument décisif, et il n'est pas d'usage mais
d'architecture : sans un second consommateur, rien ne garantit que le jeu ne
s'est pas silencieusement moulé sur les contraintes d'un seul outil.
L'indépendance d'outil devient vérifiée par construction plutôt qu'espérée.

**La limite du gratuit ne mord pas sur l'usage visé.** Elle ne s'applique qu'aux
scènes stockées dans le cloud d'Excalidraw. Le format étant du JSON simple, les
`.excalidraw` vivent dans le dépôt git : on les ouvre dans l'éditeur gratuit ou
dans le greffon VS Code, on collabore par lien de session, on commite. Le cloud
n'est jamais touché.

**Sur l'axe de la collaboration, c'est Excalidraw qui apporte quelque chose**,
pas l'inverse : collaborateurs illimités en temps réel sur le gratuit, là où
draw.io n'offre pas la fonction du tout.

**Le coût de maintien est proche de zéro** : un dossier, un script, aucune
dépendance de production, régénéré par le même `regenerer.sh`.

## Conséquences

### Le risque assumé : la pourriture silencieuse

Une voie sans utilisateur quotidien casse sans que personne ne le remarque. Le
risque est **mitigé, pas éliminé** : `scripts/excalidraw.mjs` porte un jeu
d'assertions de conformité qui arrête le build si la scène cesse d'être valide —
champs de base manquants, identifiant en double, image référençant un `fileId`
absent de `files`, `dataURL` qui ne redécode pas en SVG, fichier mal nommé par
son condensé, groupe qui n'est pas une paire image + texte.

Ces assertions vérifient la **cohérence interne**, pas la compatibilité future
du format. Si Excalidraw change son schéma, elles continueront de passer. La
version sur laquelle le format a été lu est consignée dans le script et dans
`excalidraw/README.md` : **0.18.1**.

### Autres conséquences

- La documentation cite draw.io en premier et Excalidraw comme alternative.
- Payer Excalidraw+ n'est pas justifié tant que les fichiers vivent dans git.
  Si l'usage bascule vers un espace d'équipe partagé, cette ADR est à reprendre —
  et la comparaison devra inclure le fait que le niveau équipe de draw.io
  (greffons Confluence et Jira) est payant lui aussi.

## Alternatives écartées

- **Tout miser sur draw.io.** Rejeté : on perd la garantie d'indépendance
  d'outil, qui est le seul vrai apport de cette voie.
- **Publier une bibliothèque `.excalidrawlib`.** Impossible : le format ne
  transporte pas d'images. Une bibliothèque n'afficherait que des cadres vides.
- **Ne rien livrer et compter sur le glisser-déposer de SVG.** Excalidraw accepte
  effectivement qu'on dépose un `.svg` sur le canvas, et cela fonctionne sans
  rien installer — c'est documenté dans `excalidraw/README.md`. Mais cela ne
  fournit ni le libellé composé par l'outil, ni la vérification que le jeu
  survit à un second consommateur.
