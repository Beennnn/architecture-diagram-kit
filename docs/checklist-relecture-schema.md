# Relire un schéma — la checklist

Dans l'ordre de l'impact mesuré, pas dans l'ordre du confort.
Justifications et sources : [état de l'art](etat-de-l-art-schemas.md).

- [ ] **1. Compter les croisements de flèches, et les supprimer.**
      Le levier le plus fort, et celui qu'on saute toujours. Déplacer une boîte
      coûte dix secondes. *(Purchase et al. — de loin la propriété dominante.)*

- [ ] **2. Vérifier que chaque alignement est intentionnel.**
      Deux boîtes alignées disent « nous allons ensemble ». Si c'est faux,
      désalignez. *(Petre — notation secondaire.)*

- [ ] **3. Un seul niveau d'abstraction par schéma.**
      Un conteneur et une classe sur la même image, et le lecteur ne sait plus
      où il est. *(C4 — abstraction-first.)*

- [ ] **4. Nommer chaque flèche, et l'orienter.**
      « lit les commandes dans » porte une information ; « utilise » n'en porte
      aucune.

- [ ] **5. Une légende, toujours.**
      Les six couleurs de couche sont une convention arbitraire. Sans légende,
      elles ne veulent rien dire. *(C4 — seule exigence de forme du modèle.)*

- [ ] **6. Développer tous les acronymes.**
      Y compris ceux « que tout le monde connaît » dans votre équipe.

- [ ] **7. Nommer les choses qui existent vraiment.**
      Une boîte qui désigne une base, un bucket, un topic, une machine ou un
      cluster porte son identifiant, en chasse fixe : `voltis-factures`, pas
      « S3 ». Sans lui, le schéma décrit une catégorie de systèmes, pas le
      vôtre — et personne ne peut aller vérifier. Les composants sans instance
      propre (un contrôleur, une couche) n'en ont évidemment pas.

- [ ] **8. Un seul sujet accentué, et déclaré.**
      L'accent désigne ce que le schéma sert à montrer. Au-delà d'une boîte, il
      ne désigne plus rien. La légende doit le nommer, sinon le lecteur le
      cherche parmi les couches.

- [ ] **9. Le faire lire par quelqu'un d'extérieur, sans commentaire.**
      Le seul test qui vaille. Ce qu'il demande, c'est ce qui manque.
