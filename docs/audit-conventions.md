# Audit : nos choix face aux conventions établies

Date : 2026-08-28

Cet audit est né d'une affirmation que j'avais posée de mémoire — « poser
l'étiquette sur le trait, c'est la convention de draw.io, d'AWS et de PlantUML » —
et qu'il fallait vérifier. Elle tient, mais la vérification a rapporté plus que
sa confirmation : deux de nos décisions récentes sont corroborées par des sources
indépendantes, une formulation de notre ADR 0007 doit être corrigée, et un manque
apparaît que personne n'avait vu.

## Ce qui est confirmé

**L'étiquette sur le trait, avec réserve.** draw.io expose `labelBackgroundColor`
sur les arêtes, couramment à `#ffffff`, et son propre suivi de bugs porte une
demande intitulée « ajouter des étiquettes d'arête avec un fond transparent sans
que l'étiquette croise l'arête » : le croisement texte/trait y est traité comme
un défaut, et la réserve comme le remède. C'est exactement le mécanisme de notre
`annotation()`. Nuance à apporter à ma formulation initiale : c'est une
convention outillée, pas un défaut d'usine universel.

**Le protocole sur la flèche.** C4-PlantUML en fait un paramètre de premier rang :
`Rel($from, $to, $label, $techn)`, où `$techn` porte « HTTPS », « gRPC » et
s'affiche sur la flèche. Côté AWS, la recommandation est d'étiqueter la flèche
« quand le protocole ou l'objet n'est pas évident ». Notre choix d'annoter les
flèches par un protocole est donc aligné, et notre jeu de 32 protocoles sert
précisément ce point.

**Nommer l'instance, pas la catégorie.** Les guides de rédaction de schémas AWS
recommandent que chaque icône porte une étiquette courte et spécifique décrivant
son rôle — « orders RDS (PostgreSQL) » plutôt que « database ». C'est mot pour
mot la règle 7 de notre checklist, arrivée par le terrain (« dire qu'on a S3
c'est bien, mais il faut aussi donner un nom au bucket ») et non par la
littérature. Convergence indépendante : bon signe.

**Le routage orthogonal.** AWS demande lignes droites et angles droits, les
diagonales seulement quand l'angle droit est impossible. C'est ce que font nos
six vues.

**La légende.** Exigée par C4. C'est notre règle R5, et nos légendes sont
dérivées du contenu pour ne pas pouvoir mentir.

## Ce qu'il faut corriger chez nous

**L'ADR 0007 surestime le rôle de la valeur.** Il écrit que « l'emboîtement se lit
désormais par la valeur seule ». C4 pose la règle inverse, et elle est meilleure :
*« assurez-vous que le schéma garde son sens si vous retirez toute couleur, toute
forme et toute taille — celles-ci servent l'agrément et la lecture, pas le
transport de l'information nécessaire. »*

Notre échelle de gris ne viole pas ce principe, parce que l'emboîtement est
d'abord porté par la géométrie : une boîte contenue est dans son conteneur, gris
ou pas. La valeur **redouble** cette information, elle ne la porte pas. Mais la
formulation de l'ADR laissait croire le contraire, et c'est précisément le genre
de glissement qui produit un schéma qui s'effondre en noir et blanc. Corrigé.

## Le manque que l'audit révèle

**Nos flèches portent le protocole ou l'intention, rarement les deux.** C4 est
explicite : une relation se lit « envoie les événements de commande à, via
Kafka » — l'intention *et* le transport. « Évitez de dire que A utilise B, dites
comment A utilise B. »

Or dans la vue Voltis, cinq flèches portent un protocole nu (HTTPS, gRPC, MQTT,
SSH, SMTP) et quatre portent un verbe nu (« publie », « consomme », « dépose les
factures », « SQL »). Aucune ne porte les deux. Un lecteur voit bien que l'app
mobile parle en HTTPS à l'API publique, mais pas ce qu'elle lui demande.

C'était le principal écart de fond entre notre jeu et l'état de l'art. Il est
d'autant plus notable que notre propre checklist le demandait déjà — règle 4.
Nous avions ajouté le protocole et laissé tomber le verbe.

**Corrigé.** Les six vues portent désormais les deux, avec deux exceptions
tirées de la formulation d'AWS — « étiqueter quand le protocole ou l'objet n'est
pas évident » : le transport se tait quand la boîte d'arrivée le nomme déjà, et
l'intention se tait quand la topologie la dit.

La correction a coûté de la géométrie, ce qui est la vraie leçon : un verbe fait
110 px et nos flèches en faisaient 82. Ce sont les intervalles qui ont dû
s'élargir, pas les phrases se raccourcir jusqu'à ne plus rien dire. Un contrôle
mécanique refuse maintenant de générer une vue dont une étiquette recouvre une
boîte — il a d'ailleurs révélé un débordement antérieur, « HTTPS / TLS » sur
« Internet » dans la vue du socle, que personne n'avait vu.

## Ce que nous assumons de faire autrement

**AWS sépare l'étiquette de son icône**, pour permettre l'ajustement et
l'abréviation. Nous verrouillons les deux dans un bloc-marque. La divergence est
délibérée : l'iconographie AWS est un vocabulaire public que le lecteur a déjà
appris, la nôtre ne l'est pas. Le *dual coding* nous est donc plus nécessaire
qu'à eux — c'est le même argument qui nous impose une légende là où les jeux AWS
et Azure s'en passent.

**C4 veut un nom, un type et une description par élément.** Nos vues d'exécution
portent le nom, la technologie et l'identifiant d'instance, mais pas de
description : à douze ou dix-sept nœuds, une phrase par boîte les rendrait
illisibles.

La bonne réponse n'était pas de renoncer mais de reconnaître que la description
appartient à un autre niveau. C4 la situe au niveau contexte, où les boîtes se
comptent sur une main — et ce niveau nous manquait. `exemple-contexte.svg` le
comble et porte les trois champs. La règle est donc : description au contexte,
identifiant d'instance à l'exécution.

## Sources

- [C4 model — notation et conseils](https://c4model.com/)
- [C4-PlantUML — macros de relation](https://plantuml-stdlib.github.io/C4-PlantUML/)
- [jgraph/drawio #1743 — étiquettes d'arête et fond](https://github.com/jgraph/drawio/issues/1743)
- [drawio-app — styles de forme et d'arête](https://drawio-app.com/blog/shape-styles/)
- [AWS — bonnes pratiques de schéma d'architecture](https://miro.com/diagramming/aws-architecture-best-practices/)
- [How to Create Good AWS Architecture Diagrams](https://www.naddison.com/blog/2025_04_20_how_to_create_good_aws_architecture_diagrams/)
