# Documentation

## Faire des schémas

- **[Ce que la recherche dit des schémas](etat-de-l-art-schemas.md)** — état de
  l'art : Moody, Purchase, Petre, la méta-analyse sur la contiguïté spatiale, le
  modèle C4. Et pourquoi cette littérature tranche la question de l'intégration
  dans draw.io. ([version mise en page](etat-de-l-art-schemas.html))
- **[Faire un schéma qui se lit](formes-couleurs-fleches.html)** — guide
  pratique : quelle forme pour quel usage, les six règles de couleur, les
  flèches, l'espacement, et le test des niveaux de gris.
- **[Relire un schéma — la checklist](checklist-relecture-schema.md)** — sept
  points, dans l'ordre de l'impact mesuré.
- **[Exemple complet](exemple-voltis.svg)** — un schéma d'architecture assemblé
  avec les badges du dépôt, généré par `scripts/exemple.mjs`.
- **[Exemple en couches](exemple-couches.svg)** — une place de marché en trois
  couches, avec le dimensionnement de chaque brique.
- **Trois vues d'un même système**, à trois niveaux d'abstraction :
  [socle matériel](exemple-infra.svg) · [plateforme Kubernetes](exemple-k8s.svg) ·
  [intérieur d'un service](exemple-composant.svg) ·
  [chaîne de livraison](exemple-livraison.svg).

## Utiliser le jeu

- **[Bibliothèques draw.io](../drawio/README.md)** — installation, disposition
  du libellé, et pourquoi on y livre le signe seul plutôt que le bloc-marque.

## Décisions

Format [Michael Nygard](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions).

- **[0001](adr/0001-six-couleurs-de-couche.md)** — Six couleurs de couche,
  imposées, plutôt qu'une couleur par protocole
- **[0002](adr/0002-reutiliser-les-logos-existants.md)** — Réutiliser le logo
  officiel dès qu'il existe et qu'il est redistribuable
- **[0003](adr/0003-grammaire-de-formes.md)** — Une grammaire de formes,
  normative et fermée
- **[0004](adr/0004-excalidraw-voie-secondaire.md)** — Garder la voie Excalidraw,
  en second
- **[0005](adr/0005-forme-noeud-et-precisions.md)** — Neuvième forme : le nœud
  de déploiement
- **[0006](adr/0006-marqueurs-de-qualite.md)** — Les qualités sont des marqueurs,
  pas des badges
- **[0007](adr/0007-echelle-de-fonds-et-accent.md)** — Écarter l'échelle des
  fonds, et accentuer un sujet par schéma
