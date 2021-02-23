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
import numpy as np
import random as rd

ZONES = {'Lot H', 'Lot G', 'Lot E', 'Lot F', 'Lot M', 'Lot K', 'Lot A', 'Groupe Scolaire GS', 'Lot R', 'Lot T', 'Lot P' }

class Zone:
    def __init__(self, nom, heure, vitalite):
        self.nom = nom
        self.heure = heure
        self.vitalite = vitalite
    def retJson(self):
        json = '{{ "zone" : "{}", "heure" : "{:04d}", "vitalite" : {}}}'.format(self.nom, self.heure, self.vitalite)
        return(json)

class Heures:
    def __init__(self, debut, fin, pasMinutes):
        self.debut = debut
        self.fin = fin
        self.pasMinutes = pasMinutes
        self.debutMn = (self.debut // 100) * 60 + self.debut - (self.debut // 100) * 100
        self.finMn = (self.fin // 100) * 60 + self.fin - (self.fin // 100) * 100

    def retNbPts(self):
        return (self.finMn - self.debutMn) // self.pasMinutes + 1

    def retJson(self):
        json = 'vitalites = {\n    "vitalites": [\n'
        for i in range(0, self.retNbPts()):
            Mn = self.debutMn + (i * self.pasMinutes)
            h = Mn // 60
            m = Mn - h * 60
            hm = h * 100 + m
            strHeure = "{:02d}{:02d}".format(h,m)
            jsonZones = ""
            for z in ZONES :
                vitalite = rd.randrange(0, 100, step = 10) / 100
                sep = ","
                jsonZones = jsonZones + '\n' + "        "  +  Zone(z, hm, vitalite).retJson() + sep
            json = json + "\n" + jsonZones
        json += "\n    ]\n}"
        return json



ficCible = "vitalite.json"

str = Heures(820, 1100, 1).retJson()

print(str)


fc = open(ficCible, "w")
fc.write(str)
fc.close()

print("Écrit : {}. Terminé".format(ficCible))
