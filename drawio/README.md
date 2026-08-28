# Bibliothèques draw.io

Quatre bibliothèques, générées par `scripts/drawio.mjs` :

| Fichier | Contenu |
|---|---|
| `protocoles.xml` | 32 signes — HTTP, SSH, MQTT, SMTP… |
| `roles.xml` | 50 signes — répartiteur, cache, bastion, passerelle d'API… |
| `produits.xml` | 40 signes — Java, Kafka, PostgreSQL, Kubernetes, Redis, nginx… |
| `grammaire.xml` | les 9 formes, la zone imbriquée, le sujet accentué, la flèche annotée |

Les trois premières livrent des **signes**, la quatrième livre la **grammaire** :
les fonds de l'[ADR 0007](../docs/adr/0007-echelle-de-fonds-et-accent.md), les
liserés, l'accent et le style de flèche à étiquette réservée. Sans elle, partir
de nos badges obligeait à réappliquer tout cela à la main.

Les couleurs de `grammaire.xml` sont dérivées de `FONDS` dans
`scripts/schema.mjs`, pas recopiées : la génération échoue si un fond de la
grammaire n'apparaît pas dans la bibliothèque, pour qu'elle ne puisse pas livrer
une version périmée de l'échelle.

## Installer

**Application de bureau ou web** — `File ▸ Open Library from ▸ Device…`, puis
choisir le fichier. La bibliothèque apparaît en bas du panneau de formes, à
gauche. Un simple glisser-déposer du `.xml` sur la fenêtre fonctionne aussi.

Elle reste installée entre les sessions ; pour la retirer, clic droit sur son
titre dans le panneau ▸ *Remove*.

## Ce que vous obtenez

Chaque forme est **le signe seul**, et draw.io écrit le nom lui-même comme
étiquette, sous le signe. Le libellé est donc :

- trouvé par `Ctrl+F` ;
- modifiable sur place — `HTTPS` devient `HTTPS :8443`, `REST` devient `REST /v2` ;
- exporté comme du **vrai texte** en SVG et en HTML, donc lisible par un lecteur d'écran ;
- rendu dans la police du schéma.

C'est le contraire du choix fait pour `lockups/`, où le texte est vectorisé. La
raison est développée dans
[l'état de l'art](../docs/etat-de-l-art-schemas.md#5-la-conséquence-pour-drawio) :
draw.io sait composer, donc on le laisse composer.

## Régler la disposition du libellé

Par défaut le nom est **sous** le signe — la convention des jeux AWS et Azure,
qui garde le signe carré et donc facile à raccorder à une flèche.

Pour le passer **à droite** (comme `lockups/horizontal/`), sélectionnez la
forme, `Edit Style` (`Ctrl+E`), et remplacez :

```
verticalLabelPosition=bottom;verticalAlign=top;labelPosition=center;align=center;
```

par :

```
verticalLabelPosition=middle;verticalAlign=middle;labelPosition=right;align=left;spacingLeft=6;
```

## Couleurs

Le `fontColor` de chaque forme porte la couleur de sa couche — ou de sa marque
pour les logos officiels — assombrie si nécessaire pour atteindre **4,5:1 de
contraste sur fond blanc**. Ce n'est pas la même valeur que l'encre du signe,
qui est calculée contre le fond teinté de la pastille.

**Une légende reste indispensable.** Les six couleurs de couche sont une
convention arbitraire : sans légende, elles ne veulent rien dire. Voir la
[checklist de relecture](../docs/checklist-relecture-schema.md).

## Régénérer

```bash
./regenerer.sh
```

Ces fichiers sont générés par `scripts/drawio.mjs` — ne les modifiez pas à la
main.
