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
from xml.sax.handler import ContentHandler
from xml.sax import make_parser
from xml.sax.handler import ErrorHandler
from xml.sax import SAXException


# ==========================================================
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

# ==========================================================
class XmlHandler(ContentHandler, ErrorHandler, SAXException):
    def __init__ (self, ficCible):
        #self.fc =  open(ficCible, 'w')
        self.txtHorsBalise = ""
        self.contexte = "" # Dans quelle balise on est
        self.polygones = [] # Tableau d'objets Polygone
        self.nomP = "" # du polygone en cours de construction
        self.strJson = "" # Lles lignes à écrire dans le fichier geojson

    # Les méthodes héritées
    # ---------------------

    def startElement(self, name, attrs):

        if name == 'Placemark':
            self.contexte = name

        elif name == 'name':
            self.txtHorsBalise = ""

        elif name == 'coordinates':
            self.txtHorsBalise = ""

        else:
            pass


    def endElement(self, name):

        if name == 'name':
            self.nomP = self.txtHorsBalise


        elif name == 'coordinates':
            polygone = Polygone(self.nomP)
            coord = self.txtHorsBalise
            for line in coord.split('\n'):
                m = re.search('(\d+.\d+)\D+(\d+.\d+)\D+(\d+.\d+)', line)
                if m is not None:
                    #print("Ajout des coordonnées : lon =  {}, lat = {}".format(m[1], m[2]))
                    polygone.ajoutPoint(m[2], m[1])
            self.polygones.append(polygone)
        else:
            pass


    def characters( self, data): # Lecture par ligne
        self.txtHorsBalise = self.txtHorsBalise + data.strip(' ') # strip :  Suppression des espaces aux extremités


    def startDocument(self):
        self.strJson = '{ "type": "FeatureCollection",\n    "features": [\n'


    def endDocument(self):
        nbPolygones = len(self.polygones)
        i = 0
        sep = ','
        for p in self.polygones :
            i += 1
            if i == nbPolygones :
                sep = ''
            self.strJson += p.ecritPolygoneGeojson()
            self.strJson += sep + '\n'
        self.strJson += '    ]\n}'

    def retourneJson(self):
        return self.strJson

################################################################
if __name__ == '__main__':
    ficSource = "PolygonesLotsLaVallee.kml"
    ficCibleJson = "zones.geojson"

    fs = open(ficSource, "r")
    fc = open(ficCibleJson, "w")
    # Crée le fichier json
    # --------------------
    xmlVersJson = XmlHandler(ficCibleJson)
    saxparserJson = make_parser()
    saxparserJson.setContentHandler(xmlVersJson)

    fs = open(ficSource, "r")

    saxparserJson.parse(fs)

    fs.close()

    # Affichage provisoire qui permet de déboguer en cas de plantage
    str = xmlVersJson.retourneJson()
    fc.write(str)
    fc.close()
    #print(str)

    # Indentation et vérification que le json est valide
    parsed = json.loads(str)
    str = json.dumps(parsed, indent=4, sort_keys=False)
    #print(str)
    str = "zones = " + str

    fc = open(ficCibleJson, "w")
    fc.write(str)
    fc.close()
    print("Écrit : {}. Terminé".format(ficCibleJson))

# # Tableau des objets polygone
# polygones = []
#
# construitObjet = False
#
# print("Lecture de {}".format(ficSource))
# numLigne = 0
# for line in fs:
#     numLigne += 1
#     line = line.strip()
#     #print("***" + line)
#     if len(line) == 0:
#         if construitObjet == True :
#             print("Ajout le polygone {}".format(polygone.nom))
#             polygones.append(polygone)
#             construitObjet = False
#         continue
#     if line[0] == '#':
#         #print("COMMENTAIRE")
#         continue
#     m = re.search('([a-zA-Z])', line)
#     # Si la ligne commence par une lettre, alors c'est de début d'un objet
#     if m is not None:
#         construitObjet = True
#         print("Nouvel objet : '{}'".format(line))
#         polygone = Polygone(line)
#         continue
#     m = re.search('(\d+.\d+)\D+(\d+.\d+)', line)
#     if m is not None:
#         if construitObjet == False :
#             print("Erreur ligne {} : Coordonnées détectées en dehors d'un objet".format(numLigne))
#             exit(1)
#         print("ligne {}, Ajout des coordonnées : lat =  {}, lon = {}".format(numLigne, m[1], m[2]))
#         polygone.ajoutPoint(m[1], m[2])
#
# print("Écriture de {}".format(ficCible))
#
# str = '{ "type": "FeatureCollection",\n    "features": [\n'
#
# nbPolygones = len(polygones)
# i = 0
# sep = ','
# for p in polygones :
#     i += 1
#     if i == nbPolygones :
#         sep = ''
#     str += p.ecritPolygoneGeojson()
#     str += sep + '\n'
#
# str += '    ]\n}'
#
# # Affichage provisoire qui permet de déboguer en cas de plantage
# fc.write(str)
# fc.close()
# print(str)
#
# # Indentation et vérification que le json est valide
# parsed = json.loads(str)
# str = json.dumps(parsed, indent=4, sort_keys=False)
# print(str)
# str = "zones = " + str
#
# fc = open(ficCible, "w")
# fc.write(str)
# fc.close()
#
# print("Écrit : {}. Terminé".format(ficCible))
