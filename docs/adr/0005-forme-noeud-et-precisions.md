# 0005 — Neuvième forme : le nœud de déploiement

- **Statut** : acceptée
- **Amende** : [0003 — Une grammaire de formes, normative et fermée](0003-grammaire-de-formes.md)
- **Date** : 2026-08-28

## Contexte

L'[ADR 0003](0003-grammaire-de-formes.md) a fixé huit formes, et posé qu'une
neuvième exigerait un nouvel ADR. Elle a été écrite **avant** d'avoir été
éprouvée : les deux schémas d'exemple d'alors ne descendaient pas au matériel ni
ne remontaient au code.

Trois vues ont été construites pour la mettre à l'épreuve — socle matériel et
réseau, plateforme Kubernetes, intérieur d'un service Spring Boot. Elles ont
révélé un manque et trois imprécisions.

## Décision

### Une neuvième forme : `noeud`

| Forme | Nature codée | Géométrie |
|---|---|---|
| `noeud` | une machine qui **héberge** : serveur physique, machine virtuelle, nœud de cluster | rectangle à coins vifs, liseré épais, fond en retrait |

Elle manquait réellement. Un serveur n'est ni un `service` — il n'exécute pas de
code, il en héberge — ni un `materiel`, qui désigne un appareil **hors** du
système d'information. Sans elle, les trois vues ne pouvaient pas distinguer la
machine de ce qui tourne dessus.

Le budget de l'ADR 0003 passe donc de huit à neuf formes. C'est un dépassement
assumé, pas une dérive : neuf reste dans les limites de la discrimination
humaine, et aucune autre forme n'a été jugée nécessaire au terme de l'épreuve.

### R9 — Un conteneur porte son libellé en haut

Une forme qui en contient d'autres — `frontiere`, et `noeud` dès qu'il héberge —
ne peut pas centrer son libellé : les boîtes filles le recouvrent. Constaté
littéralement sur la première version de la vue matérielle, où les titres
« Serveur A » et « Serveur B » étaient invisibles.

### R10 — Un picto ne sert qu'à une seule entrée

Corollaire exécutable de la règle R2. Le contrôle est désormais dans le build,
qui s'arrête en nommant les entrées fautives.

Il a immédiatement trouvé quatre collisions préexistantes : `server-2` partagé
entre NFS et le rôle serveur, `file-code` entre SOAP et configuration, `router`
entre DHCP et le rôle routeur, `bucket` entre S3 et stockage objet. Toutes
arbitrées — le picto revient à l'entrée qu'il désigne le plus justement, l'autre
prend une métaphore propre : NFS devient un partage, DHCP un bail.

### Deux précisions d'emploi

**`stockage` désigne une donnée qui survit au redémarrage — pas une donnée
tout court.** Dans une vue de code, une entité du domaine ou un fichier de
configuration sont des éléments de code : ils prennent `service`. Les magasins
réels sont hors du composant. La première version de la vue composant dessinait
l'entité « Commande » en cylindre, ce qui la faisait passer pour une table.

**Un badge de protocole marque un franchissement de frontière, pas un appel de
méthode.** À l'intérieur d'un composant, les liens portent un verbe — « appelle »,
« persiste » — jamais un badge. Un protocole n'a de sens qu'entre deux boîtes qui
ne partagent pas le même espace d'exécution.

## Conséquences

- `formes.json` compte neuf formes ; la règle « pas d'ajout sans retrait » de
  l'ADR 0003 reste en vigueur à partir de neuf.
- Les trois vues servent désormais de test de non-régression de la grammaire :
  [socle](../exemple-infra.svg), [plateforme](../exemple-k8s.svg),
  [composant](../exemple-composant.svg).
- Elles sont **délibérément séparées**. Matériel, plateforme et code sont trois
  niveaux d'abstraction ; les réunir violerait la règle qui interdit d'en
  mélanger deux dans un schéma. Chaque vue nomme dans son sous-titre le lien
  avec la précédente : les VM du socle sont les nœuds du cluster, un pod du
  cluster est le composant ouvert.

## Alternatives écartées

- **Employer `materiel` pour les serveurs.** Rejeté : `materiel` désigne un
  appareil hors du système d'information — une borne, un capteur. Un serveur de
  production en fait partie intégrante, et surtout il héberge.
- **Employer `frontiere` pour les serveurs.** Rejeté : une frontière est un
  regroupement logique sans existence propre, elle ne se raccorde à aucune
  flèche. Un serveur est un objet réel, qu'on câble et qu'on redémarre.
- **Ajouter aussi une forme `module` pour les vues de code.** Rejeté après
  épreuve : `frontiere` suffit à regrouper les couches d'un composant, comme le
  montre la vue composant.
