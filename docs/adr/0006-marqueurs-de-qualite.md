# 0006 — Les qualités sont des marqueurs, pas des badges

- **Statut** : acceptée
- **Complète** : [0003](0003-grammaire-de-formes.md) et [0005](0005-forme-noeud-et-precisions.md)
- **Date** : 2026-08-28

## Contexte

Une liste de cinquante-trois concepts candidats a été soumise pour entrer dans
le jeu. Les trier a révélé que le jeu n'avait **aucun dispositif** pour une part
importante d'entre eux.

Un badge nomme **une chose qu'on peut montrer du doigt sur un schéma** : une
boîte, une flèche. Or la liste mélangeait quatre natures très différentes :

| Nature | Exemples | Peut-on la montrer du doigt ? |
|---|---|---|
| Produit | Java, Kafka, Docker, draw.io | oui — une boîte |
| Rôle | analyse statique, table d'expédition, couverture | oui — une boîte |
| **Qualité ou politique** | idempotent, immuable, moindre privilège, SemVer, RLS | **non — elle qualifie une boîte** |
| **Style d'architecture** | microservices, en couches, événementiel | **non — le schéma l'incarne** |

## Décision

### Un dispositif nouveau : le marqueur

Une **qualité** ou une **politique** s'attache à une boîte ou à une flèche sous
forme de **marqueur** : une petite pastille au contour fin, texte en chasse fixe,
sans picto. Elle se pose au bord de ce qu'elle qualifie.

Ce n'est ni une forme ni un badge, et c'est délibéré : lui donner une forme
laisserait croire qu'il existe un objet « immuabilité » quelque part dans le
système. Il n'y en a pas — il y a un artefact qui, lui, est immuable.

Deux tons : neutre pour une propriété constatée, alerte pour une contrainte de
sécurité.

### Un style d'architecture ne s'ajoute jamais au jeu

« Microservices », « en couches », « événementiel », « cœur fonctionnel »,
« services sans état », « source unique de vérité » ne recevront pas de badge.

Un style se lit dans la **structure** du schéma, pas dans une boîte. La vue en
couches dit « architecture en couches » par ses trois bandes ; y ajouter une
étiquette « Layered Architecture » serait redondant au mieux, faux au pire —
un schéma qui doit annoncer son style est un schéma qui ne le montre pas.

Le bon endroit pour ces concepts est l'ADR qui les décide, pas le dessin.

### Les pratiques vivent dans la vue de livraison

Formateur, analyse statique, test d'architecture, couverture, test de mutation,
test de contrat, SBOM, décisions versionnées : ce sont des boîtes réelles, mais
**d'une chaîne, pas d'un système**. Aucune n'existe à l'exécution.

Les mettre dans une vue d'exécution mélangerait deux niveaux d'abstraction. Une
quatrième vue leur est donc dédiée : [`exemple-livraison.svg`](../exemple-livraison.svg).

## Conséquences

- `marqueur()` rejoint `scripts/schema.mjs`, à côté des formes et des badges.
- Onze rôles et cinq produits ont été ajoutés depuis la liste — ceux qui étaient
  réellement des choses. Le jeu passe à 122 entrées — 32 protocoles, 40 produits, 50 rôles.
- Les concepts sans logo redistribuable prennent un picto générique : Spotless,
  Error Prone, ArchUnit, JaCoCo, PIT n'ont pas de marque disponible, mais
  « formateur », « analyse statique », « test d'architecture », « couverture » et
  « test de mutation » sont des rôles parfaitement dessinables — et plus durables,
  puisqu'ils survivent au changement d'outil.
- Un garde-fou a été ajouté au passage : un `stockage` de moins de 60 px de haut
  arrête le build, parce que les deux ellipses du cylindre recouvrent alors le
  libellé. Le défaut était réapparu trois fois.

## Alternatives écartées

- **Faire des qualités des badges comme les autres.** Rejeté : cela crée des
  boîtes pour des choses qui n'existent pas, et le lecteur cherche où est le
  composant « idempotence ».
- **Les écrire en note libre.** Rejeté : une note se perd dans le bruit des
  libellés de flèche. Le marqueur est reconnaissable en tant que classe.
- **Ajouter les styles d'architecture comme famille de badges.** Rejeté pour la
  raison développée ci-dessus.
