# Bibliothèques draw.io

Deux bibliothèques de formes, générées depuis `symboles/` :

| Fichier | Contenu |
|---|---|
| `protocoles.xml` | 32 formes — HTTP, SSH, MQTT, SMTP… |
| `roles.xml` | 25 formes — répartiteur, cache, bastion, passerelle d'API… |
| `produits.xml` | 25 formes — Java, Kafka, PostgreSQL, Kubernetes, Redis, nginx… |

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
