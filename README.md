Francis Dupin, février 2021

# Affichage des vitalités des zones du quartier La Vallée. (Projet E3S)

## Utilisation
Ouvrir dans un navigateur la page *vitalite.html*

Le script affiche comme une carte de chaleur la vitalité de chaque zone au cours de la journée.

Sous la carte, affichage de la vitalité moyenne, et de la vitalité d'une ou plusieurs zones au cours du temps (cliquer sur une zone de la carte).

Un lecteur permet un fonctionnement automatique.

## Fonctionnement
La page charge 2 fichiers :

* Une description des zones : *zones.geojson*
* L'évolution de la vitalité de chaque zones au cours de la journée : *vitalites.json*

## Utilitaires
### Convertir kml en zones.geojson
Exécuter *conv_zones_kml_vers_geojson.py* (python 3).

Si les zones ont changées, la dernière ligne déffichage : zones = ... est à recopier en haut de *generateur_vitalites.py*

### Générer des vitalités aléatoires
Exécuter *generateur_vitalites.py* (python 3)
À exécuter à chaque modifictaion des zones.

## Format du fichier *vitalites.json*
Voir ce fichier, le format se comprend aisément.
Ajouter les contraintes suivantes :

* Le pas de temps doit être contant
* Toutes les zones doivent être présentes (et avoir une valeur de vitalité) dans un pas de temps
* La vitalité est comprise entre 0 et 1 inclus
* Format de temps : hhmm (ex : 2H03 s'écrit 0203)
* Le nom des zones doit être identique à ceux de *zones.geojson*, en respectant la casse.

## Problèmes
Tous les messages sont écrits dans la console.
