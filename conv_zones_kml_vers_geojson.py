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
        self.contexte = "None" # Dans quelle balise on est
        self.polygones = [] # Tableau d'objets Polygone
        self.nomP = "" # du polygone en cours de construction
        self.strJson = "" # Lles lignes à écrire dans le fichier geojson
        self.listeZones = ""
    # Les méthodes héritées
    # ---------------------

    def startElement(self, name, attrs):

        if name == 'Placemark':
            self.contexte = 'Placemark'
            #print("* Contexte = " + self.contexte)

        elif name == 'name':
            self.txtHorsBalise = ""

        elif name == 'coordinates':
            self.txtHorsBalise = ""

        else:
            pass


    def endElement(self, name):

        if name == 'Placemark':
            self.contexte = 'None'
            print("Contexte = " + self.contexte)

        if name == 'name':
            if self.contexte == "Placemark":
                self.nomP = self.txtHorsBalise
                self.listeZones += "'{}', ".format(self.nomP)
                #print("Contexte = " + self.contexte + ", nom = " + self.nomP)

        elif name == 'coordinates':
            if self.contexte != "Placemark":
                pass
            polygone = Polygone(self.nomP)
            coord = self.txtHorsBalise
            tabCoord = re.split('\s', coord) # On découpe la ligne suivant espace ou saut de ligne
            for line in tabCoord:
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
        self.listeZones = "ZONES = {\n"


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
        self.listeZones += "\n}"
        print(self.listeZones)

    def retourneJson(self):
        return self.strJson

################################################################
if __name__ == '__main__':
    ficSource = "PolygonesLotsLaValleeEntier.kml"
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
