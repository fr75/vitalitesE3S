#!/bin/python3

# Script python3
# Francis Dupin Février 2021
import sys
import os
import os.path
import shutil
#import random
import re
import json


class Polygone:
    def __init__(self, nom):
        self.nom = nom
        self.points = []
        self.nbPoints = 0

    def ajoutPoint(self, lat, lon):
        self.points.append({'lat': lat, 'lon': lon})
        self.nbPoints += 1

    def ecritPointsGeojson(self):
        str = '            "coordinates": [\n                      [\n'
        sep = ','
        i = 0;
        for point in self.points :
            i += 1
            if i == self.nbPoints :
                sep = ''
            str += "                            [{} ,{}]{}\n".format(point['lon'], point['lat'], sep)
        # Suppression de la virgule finale
        #str = str[:-1]
        str += '                      ]\n            ]\n'
        return str

    def ecritPolygoneGeojson(self):
        str = '    { "type": "Feature",\n        "geometry": {\n            "type": "Polygon",\n'
        str += self.ecritPointsGeojson()
        str += '        },\n        "properties": {\n            "nom": "' + self.nom + '"\n        }\n    }\n'
        return str

ficSource = "zones.txt"
ficCible = "zones.geojson"

fs = open(ficSource, "r")
fc = open(ficCible, "w")


# Tableau des objets polygone
polygones = []

construitObjet = False

print("Lecture de {}".format(ficSource))
numLigne = 0
for line in fs:
    numLigne += 1
    line = line.strip()
    #print("***" + line)
    if len(line) == 0:
        if construitObjet == True :
            print("Ajout le polygone {}".format(polygone.nom))
            polygones.append(polygone)
            construitObjet = False
        continue
    if line[0] == '#':
        #print("COMMENTAIRE")
        continue
    m = re.search('([a-zA-Z])', line)
    # Si la ligne commence par une lettre, alors c'est de début d'un objet
    if m is not None:
        construitObjet = True
        print("Nouvel objet : '{}'".format(line))
        polygone = Polygone(line)
        continue
    m = re.search('(\d+.\d+)\D+(\d+.\d+)', line)
    if m is not None:
        if construitObjet == False :
            print("Erreur ligne {} : Coordonnées détectées en dehors d'un objet".format(numLigne))
            exit(1)
        print("ligne {}, Ajout des coordonnées : lat =  {}, lon = {}".format(numLigne, m[1], m[2]))
        polygone.ajoutPoint(m[1], m[2])

print("Écriture de {}".format(ficCible))

str = '{ "type": "FeatureCollection",\n    "features": [\n'

nbPolygones = len(polygones)
i = 0
sep = ','
for p in polygones :
    i += 1
    if i == nbPolygones :
        sep = ''
    str += p.ecritPolygoneGeojson()
    str += sep + '\n'

str += '    ]\n}'

# Affichage provisoire qui permet de déboguer en cas de plantage
fc.write(str)
fc.close()
print(str)

# Indentation et vérification que le json est valide
parsed = json.loads(str)
str = json.dumps(parsed, indent=4, sort_keys=False)
print(str)
str = "zones = " + str

fc = open(ficCible, "w")
fc.write(str)
fc.close()

print("Écrit : {}. Terminé".format(ficCible))
