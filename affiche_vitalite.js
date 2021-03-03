// Affichage des vitalités pour le quartier LA VALLÉE
// Francis Dupin
// février 2021

// Nota : Les données (zones, vitalité) sont chargées par vitalite.html
// à partir de zones.geojson et vitalite.geojson, pas à partir de ce script

// ============================================================================
// Quelques variables de config importantes
// ============================================================================
// Le nombre maxi de zones à afficher sous la carte
var maxContainersZone = 3;

// Lecteur
// Temps en ms de passage à la valeur suivante
var tempo_lecteur = 1000;
var tempo_lecteur_min = 50;
var tempo_lecteur_max = 10000

// La carte, coord de centrage et zoom initial
var latInit = 48.7640
var lonInit = 2.2884
var zoomInit = 16



// ============================================================================
//                  FONCTIONS
// ============================================================================

// ------------------------------------------------------
// Malheureusement geojson code les coord en lon,lat dans cet ordre, et leaflet les utilse en lat,lon
function inverseLatLon(zones) {
    zones.features.forEach(
        function(zone) {
            zone.geometry.coordinates[0].forEach(
                function(coord) {
                    pivot = coord[0];
                    coord[0] = coord[1];
                    coord[1] = pivot;
                }
            )
        }
    )
}

// ------------------------------------------------------
function hslToHex(h, s, l) {
    h /= 360;
    s /= 100;
    l /= 100;
    let r, g, b;
    if (s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1 / 6) return p + (q - p) * 6 * t;
            if (t < 1 / 2) return q;
            if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
            return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
    }
    const toHex = x => {
        const hex = Math.round(x * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// ------------------------------------------------------
// Retourne une couleur en fonction d'un indice de chaleur entre 0 et 1
function heatMapColorforValue(value){
    var h = (1.0 - value) * 240
    var s = 100;
    var l = 50;
    return hslToHex(h, s, l);
}

// ------------------------------------------------------
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ------------------------------------------------------
// Retourne la structure heure si trouvée, false sinon
function rechercheHeure(heuresV, heure) {
    for(var i = 0; i < heuresV.length; i++) {
        //console.log("heuresV.length = " + heuresV.length);
        if (heuresV[i]['heure']['h'] == heure) {
            //console.log("heure trouvée : ")
            //console.log(heuresV[i])
            return {'h' : heuresV[i], 'index' : i}
        }
    }
    return (false);
}

// ------------------------------------------------------
// Convertit une heure exprimée en un int hhmm en minutes
function convHeureVersMn(hm) {
    return (Math.floor(hm / 100) * 60 + hm - Math.floor(hm / 100) * 100);
}

// ------------------------------------------------------
// Convertit des minutes en un int hhmm
function convMnVersHeure(mn) {
    var h = Math.floor(mn / 60);
    var m = mn - h * 60;
    return (h * 100 + m);
}

// ------------------------------------------------------
// Ajoute des zéros à gauche à un nombre sous forme de chaîne,
// pour qu'il soit représenté par nbDigits chiffres
// num est un entier
function formateNombre(num, nbDigts) {
     return (String(num).padStart(nbDigts, '0'))
}

// ------------------------------------------------------
// Convertit une heure exprimée en un int hhmm en une chaine
function convHeureVersCh(hm) {
    var h = Math.floor(hm / 100);
    var m = hm - h * 100;
    return(h + 'H' + formateNombre(m, 2));
}

// ------------------------------------------------------
// Remplit l'objet G_heuresV à partir des données d'entrées de vitalités
// Pour chaque heure, il faut que toutes les zones soient présentes dans les données d'entrées,
// ce qui est naturellement le cas.
function remplitTabHeuresChangementsVitalite(tabHeures) {
    vitalites.vitalites.forEach(
        function(v) {
            intH = parseInt(v['heure'], 10)
            // Si une entrée pour cette heure existe
            resRech = rechercheHeure(tabHeures, intH);
            if (resRech == false) {
                heure = {'heure' : { 'h' : intH, 'zones' : { [v['zone']] : v['vitalite']} } };
                tabHeures.push(heure);
            } else {
                zone = { [v['zone']] : v['vitalite']};
                i = resRech['index'];
                tabHeures[i]['heure']['zones'][v['zone']] =  v['vitalite'];
            }
        }
    )
    // Classement du tableau par heures croissantes
    tabHeures.sort(
        function(a, b) {
            return a['heure']['h'] - b['heure']['h'];
        }

    )
}

// ------------------------------------------------------
// Retourne un tableau de 2 éléments [index dans le tableau des heures, les valeurs de vitalités]
// Argument :l'heure du curseur en format entier : hhmm
// return false si erreur
function retVitalite(tabHeures, heure) {
    var heurePrec = 0
    for(var i = 0; i < tabHeures.length; i++) {
        var h = tabHeures[i]['heure']['h']
        // console.log("i = " + i + ", heure = " + h);
        if ( i == 0 && heure < h) {
            console.log("!! ERREUR Recherche vitalités pour une heure qui est en dessous de l'heure de début : " + heure)
            return false;
        }
        if (heure > h) {
            heurePrec = heure
        }
        else if (heure == h) {
            return [i, tabHeures[i]['heure']];
        }
        else if (heure < h) {
            return [i, tabHeures[i - 1]['heure']];
        }
    }
    // Dernière valeur d'heure atteinte
    return [i, tabHeures[tabHeures.length - 1]['heure']];
}

// ------------------------------------------------------
// Retourne le nom de la zone en fonction de l'identifiant leaflet
// Retoure false si non trouvée
function retNomZone(lzones, _leaflet_id) {
    for (const [k, v] of lzones) {
        //console.log("Recherche nom zone pour _leaflet_id = " + _leaflet_id + " ** " + v.get('_leaflet_id'));
        if (v.get('_leaflet_id') == _leaflet_id) {
                //console.log("Trouvé nom : " + v.get('nom') + ", pour _leaflet_id = " + v.get('_leaflet_id'));
                return v.get('nom');
        }
    }
    console.log("!!! Nom de zone non trouvée pour _leaflet_id = " + _leaflet_id);
    return false;
}

// ------------------------------------------------------
// Retourne l'identifiant leaflet de la zone passée en argument
// Retoure false si non trouvée
function ret_Leaflet_id(lzones, nomZone) {
    for (const [k, v] of lzones) {
        //console.log("Recherche nom zone pour _leaflet_id = " + _leaflet_id + " ** " + v.get('_leaflet_id'));
        if (v.get('nom') == nomZone) {
                //console.log("Trouvé  _leaflet_id = " + v.get('_leaflet_id') + ", pour nom : " + v.get('nom'));
                return v.get('_leaflet_id');
        }
    }
    console.log("!!! _leaflet_id non trouvé pour la zone = " + nomZone);
    return false;
}

// ------------------------------------------------------
// A partir de l'objet heure (partie de G_heuresV), mise à jour des couleurs des zones sur la carte
function miseAJourAffichageVitalites(structHeure) {
    var k = Object.keys(structHeure['zones']);
    k.forEach(
        function (z) {
            var vitalite = structHeure['zones'][z];
            // console.log("--- zone = *" + z + "*   vitalite = " + vitalite);
            // Test si la zone existe en tant qu'objet graphique
            if (lzones.get(z) == undefined) {
                console.log("!! ERREUR La zone : '" + z + "'  définie dans le fichier des vitalités n'existe pas dans le fichier de description des zones");
                console.log(".. Impossible de colorer la zone : '" + z + "' pour l'heure : " + structHeure['h']);
            } else {
                lzones.get(z).get('lp').setStyle({fillColor: heatMapColorforValue(vitalite)});
            }
        }
    )
}

// ------------------------------------------------------
// Met à jour l'affichage des vitalités en fonction de la position du curseur de temps
function curseurTempsMiseAJourVitalites(){
    // Marqueur Temps : la petite fenêtre dans laquelle s'affiche le temps.
    var largMarqueur = 5; //en %
    var valCurseur = curseurTemps.value;
    // Position du marqueur : P
    // P = ac + b où c est la valeur du curseur entre cm et cM (resp 0 et G_maxCurseur)
    // P à priori varie de pm = 0 à pM = 100%
    // a = (pM - pm) / (cM - cm) et b = pm - a.cm
    var a = 100 / G_maxCurseur; // et b = 0
    var posMarqueur = a * valCurseur;
    if (posMarqueur < (largMarqueur / 2)) {
        posMarqueur = 0;
    }
    else if (posMarqueur > (100 - (largMarqueur / 2))) {
        posMarqueur = 100 - (largMarqueur);
    }
    else {
        posMarqueur = posMarqueur - (largMarqueur / 2);
    }

    marqueurTemps.style.width = largMarqueur + "%";
    marqueurTemps.style.left = posMarqueur + "%";
    marqueurTemps.style.position = "relative";
    var mnMin = convHeureVersMn(G_heuresV[0]['heure']['h']);
    var mnMax = convHeureVersMn(G_heuresV[G_heuresV.length - 1]['heure']['h']);
    var mn = Math.floor(mnMin +  ((mnMax - mnMin)/G_maxCurseur) * valCurseur);
    //console.log("mnMin = " +  mnMin);
    var hm = convMnVersHeure(mn);
    //console.log("Curseur : " + valCurseur + ", minutes = " + mn + ", heures = " + hm);
    // Les valeurs de vitalités :
    var vitalites = retVitalite(G_heuresV, hm)[1];
    if (vitalites != false) {
        miseAJourAffichageVitalites(vitalites);
    }
    // Mise à jour du temps affiché dans la petite fenêtre
    var hmVitalite = vitalites['h'];
    //console.log("hmVitalite = ", hmVitalite);
    // On choisit d'afficher le temps correspondant au dernier calcul de vitalité
    marqueurTemps.textContent = convHeureVersCh(hmVitalite);
    // Si on préfère afficher le temps correspondant à la position du curseur :
    //marqueurTemps.textContent = convHeureVersCh(hm);

    // Mise à jour des indicateurs
    majPositionIndicateur("moyenneVitalitesContainer");
    majPositionIndicateursZones();
}

// ------------------------------------------------------
function ajouteGraduationsTemps(tabHeures) {
    var mnMin = convHeureVersMn(tabHeures[0]['heure']['h']);
    var mnMax = convHeureVersMn(tabHeures[tabHeures.length - 1]['heure']['h']);
    //console.log("mnMin = " + mnMin + ", mnMax = " + mnMax + ",  hmax = " + tabHeures[tabHeures.length - 1]['heure']['h']);
    // Objet donnant la position des graduations d'heure de demi-heure
    var grad = [];
    // Calcul de la position P sur le graphique en fonction du temps t
    // La position prend les valeurs pm = pM (ici pm = 0, pM = 100%)
    // Le temps varie de tm à tM
    // P = a.t + b
    //     a = (pM - pm) / (tM - tm)
    //     b = pm - a.tm
    var a = 100 / (mnMax-mnMin);
    var b = - a * mnMin;
    for (mn = mnMin ; mn <= mnMax ; mn++) {
        var position = mn * a + b;
        if (Math.floor(mn/60) == mn/60) {
            var h = {'heure': {'label': mn/60 + 'h', 'position': position}};
            //console.log('grad heure pour mn = ' + mn + ", position : " + position);
            grad.push(h);
        }
        else if (Math.floor(mn/30) == mn/30) {
            var dmh = {'demiHeure': {'label': '', 'position': position}};
            grad.push(dmh);
        }
    }
    //console.log("Nbr de graduations temps : " + grad.length);
    //onsole.log(grad);
    // Création des objets htmlgraduationsTempsContainer
    var graduationsTempsContainer = document.getElementById("graduationsTempsContainer");
    //for(var v of grad) {
    for(var i = 0 ; i < grad.length ; i++){
        var v = grad[i];
        //console.log(v);
        if (v['heure'] != undefined) {
            var baliseP = document.createElement("p");
            baliseP.className = "heure";
            baliseP.style.left = v['heure']['position'] + '%';
            var baliseSpan = document.createElement("span");
            var label = document.createTextNode(v['heure']['label']);
            //var label = document.createTextNode('x');
            if (v['heure']['position'] > 99) {
                //console.log("Graduiation pour heure : " + v['heure']['label'] + " trop à droite => Suppression label");
            }
            else {
                baliseSpan.appendChild(label);
                baliseP.appendChild(baliseSpan);
            }
            graduationsTempsContainer.appendChild(baliseP);
        }
        if (v['demiHeure'] != undefined) {
            var baliseP = document.createElement("p");
            baliseP.className = "demiHeure";
            baliseP.style.left = v['demiHeure']['position'] + '%';
            //baliseP.style.position = "relative";
            var baliseSpan = document.createElement("span");
            var label = document.createTextNode(v['demiHeure']['label']);
            //var label = document.createTextNode('x');
            baliseSpan.appendChild(label);
            //baliseP.appendChild(baliseSpan);
            graduationsTempsContainer.appendChild(baliseP);
        }

    }
}

// ------------------------------------------------------
// Positionnne l'indicateur de vitalité moyenne en fonction de la position du curseur de temps
// L'indicateur est le petit doigt triangulaire au dessus de la ligne de zone
// Arg : l'id du container ('moyenneVitalitesContainer', 'vitalite1ZoneContainer_0', 'vitalite1ZoneContainer_1', ...)
function majPositionIndicateur(idContainer) {
    // console.log("majPositionIndicateur container : " + idContainer);
    var valCurseur = curseurTemps.value ; // Le curseur de temps principal
    var container = document.getElementById(idContainer);
    // Si les éléments du container n'ont pas été créés. C'est le cas du container vitalité 1 zone : contenu créé au 1er clic sur une zone.
    if (container.getElementsByTagName("p").length == 0) {
        return 0;
    }

    var indicateur = container.getElementsByClassName("indicateur");
    indicateur[0].style.left = (100 / G_maxCurseur) *  valCurseur + "%";
    indicateur[0].style.display = "block";
}

// ------------------------------------------------------
// Met à jour tous les indicateurs des zones. Ne concerne pas la ligne de vitalité moyenne
function majPositionIndicateursZones() {
    for (index = 0 ; index < maxContainersZone ; index++) {
        if (containerZoneEstAffiche(index) == true) {
            var containerId =  "vitalite1ZoneContainer" + "_" + index;
            majPositionIndicateur(containerId);
        }
    }
}

// ***********  Ligne d'affichage de la vitalité moyenne en fct du temps
// ------------------------------------------------------
// Retourne la valeur moyenne des vitalités pour une heure
// Argument : objet heure, issu de G_heuresV
function calculeMoyenneVitalites(structHeure) {
    var vitalite = 0;
    var k = Object.keys(structHeure['zones']);
    var nbZones = 0;
    k.forEach(
        function (z) {
            nbZones += 1;
            vitalite += structHeure['zones'][z];
        }
    )
    //var nbZones = k.length;
    //console.log("nbZones = " + nbZones);
    var vitaliteMoy = vitalite / nbZones;
    if (vitaliteMoy > 1) {
        console.log("!!! ERREUR vitalité moyenne > 1 : " + vitaliteMoy +  ", pour l'heure " + structHeure['h']);
        return 0;
    }
    return (vitaliteMoy);
}

// ------------------------------------------------------
function ajouteLigneVitalitesMoyennes(tabHeures) {
    var nbElts = tabHeures.length
    //console.log("Nb de dates de calcul de vitalité : " + nbElts);
    for(var i = 0; i < nbElts; i++) {
        var structHeure = tabHeures[i]['heure'];
        var vitalite = calculeMoyenneVitalites(structHeure);
        //var vitalite = i / nbElts; //Pour tester
        var moyenneVitalitesContainer = document.getElementById("moyenneVitalitesContainer");
        var balise = document.createElement("p");
        //var texte = document.createTextNode(i);
        //balise.appendChild(texte);
        // Modification de la largeur de l'élement
        balise.style.width = (100 / nbElts) + "%";
        balise.style.backgroundColor = heatMapColorforValue(vitalite);
        // Ajout du nouvel élément
        moyenneVitalitesContainer.appendChild(balise);
    }
}

// ***********


// ***********  Lignes d'affichage de la vitalité d'une zone en fct du temps
// ------------------------------------------------------
// Retourne la valeur de vitalité d'une zone pour une heure
// Argument : objet heure, issu de G_heuresV
// Retourne false si non trouvée
function retVitalite1Zone(structHeure, zone) {
    var vitalite = 0;
    var k = Object.keys(structHeure['zones']);
    if (structHeure['zones'][zone] == undefined) {
            console.log("!!! Vitalité de la zone : " + zone + " non trouvée pour l'heure " + k['h']);
            return false;
    }
    return structHeure['zones'][zone];
}

// ------------------------------------------------------
// indexAff : le numéro du container pour l'affichage
function afficheLigneVitalites1Zone(lzones, tabHeures, _leaflet_id, indexAff) {
    //console.log("Nb de dates de calcul de vitalité : " + nbElts);
    //Recherche le nom de la zone
    var nom = retNomZone(lzones, _leaflet_id);
    if (nom == false) {
        console.log("!!! Impossible d'afficher la ligne de vitalité pour la zone _leaflet_id = " + _leaflet_id);
        return -1;
    }
    var nbElts = tabHeures.length;
    var idContainerFils = "vitalite1ZoneContainer" + "_" + indexAff;
    var vitalitesContainer1Zone = document.getElementById("vitalite1ZoneContainer");
    // Si le container fils n'a pas été créé
    if (document.getElementById(idContainerFils) == undefined) {
        // On crée les éléments dans le container
        // Création du container
        var containerFils = document.createElement("div");
        containerFils.id = idContainerFils;
        containerFils.style.position = "relative";
        containerFilsSuiv = document.getElementById("vitalite1ZoneContainer" + "_" + (indexAff + 1))
        if (containerFilsSuiv == undefined) {
            vitalitesContainer1Zone.appendChild(containerFils);
        }   else {
            // Ajout au dessus
            vitalitesContainer1Zone.insertBefore(containerFils, containerFilsSuiv);
        }
        // Ajout du titre
        var baliseTitre = document.createElement("h2");
        var baliseFermer = document.createElement("img");
        baliseFermer.src = "icones/fermer.png";
        baliseFermer.classList.add('fermer');
        baliseFermer.title = "Fermer";
        baliseFermer.addEventListener("click", function (e) {
            clickFermerLigneZone(e, lzones, tabHeures, indexAff);
        });
        baliseTitre.appendChild(baliseFermer);
        //var baliseTitre = vitalitesContainer1Zone.getElementsByTagName("h2")[0];
        baliseTitre.appendChild(document.createTextNode("Vitalité pour la zone : "));
        var baliseEmph = document.createElement("em");
        baliseEmph.classList.add('nomZone');
        baliseEmph.appendChild(baliseEmph.appendChild(document.createTextNode(nom)));
        baliseTitre.appendChild(baliseEmph);
        containerFils.appendChild(baliseTitre);
        // Ajout de l'indicateur
        var baliseIndicateur = document.createElement("img");
        baliseIndicateur.src = "icones/indicateur.png";
        baliseIndicateur.classList.add('indicateur');
        containerFils.appendChild(baliseIndicateur);
        // Ajout des vitalités
        for(var i = 0; i < nbElts; i++) {
            var structHeure = tabHeures[i]['heure'];
            vitalite = retVitalite1Zone(structHeure, nom);
            //var vitalite = i / nbElts; //Pour tester
            var balise = document.createElement("p");
            //var texte = document.createTextNode(i);
            //balise.appendChild(texte);
            // Modification de la largeur de l'élement
            balise.style.width = (100 / nbElts) + "%";
            balise.style.backgroundColor = heatMapColorforValue(vitalite);
            // Ajout du nouvel élément
            containerFils.appendChild(balise);
        }
    }
    else {
        // Les éléments existent déjà, on se contente de modifier leur valeur de vitalité
        containerFils = document.getElementById(idContainerFils);
        containerFils.classList.remove("masquer"); // Ne crée pas d'erreur si la classe n'existe pas.
        eltsContenus = containerFils.getElementsByTagName("p");
        nbEltsContenus = eltsContenus.length ;
        //console.log("elts p = " + eltsContenus.length);
        if (nbEltsContenus != nbElts) {
            console.log("!!! nb de tags pour l'affichage de la vitalité d'une zone différents du nb de points de calcul horaire");
            console.log("Il est probable que pour une date de calcul, il y a des zones absentes");
        }
        // mise à jour du titre
        var titre = containerFils.getElementsByTagName("h2")[0];
        var em = titre.getElementsByTagName("em")[0];
        em.textContent = nom;
        // Mise à jour des vitalités
        for(var i = 0; i < nbElts; i++) {
            var structHeure = tabHeures[i]['heure'];
            vitalite = retVitalite1Zone(structHeure, nom);
            //var vitalite = i / nbElts; //Pour tester
            balise = eltsContenus[i];
            //var texte = document.createTextNode(i);
            //balise.appendChild(texte);
            // Modification de la largeur de l'élement
            balise.style.width = (100 / nbElts) + "%";
            balise.style.backgroundColor = heatMapColorforValue(vitalite);
            // Ajout du nouvel élément
            //vitalitesContainer1Zone.appendChild(balise);
        }
    }
}

// ------------------------------------------------------
// Retrourne True si le container est affiché, false sinon
function containerZoneEstAffiche(indexAff) {
    var idContainerFils = "vitalite1ZoneContainer" + "_" + indexAff;
    var containerFils = document.getElementById(idContainerFils);
    if (containerFils == undefined) {
        // console.log("containerZoneEstAffiché, non défini : " + idContainerFils);
        return false;
    }
    if (containerFils.classList.contains('masquer')) {
        // console.log("Container zone index : " + indexAff + ", est masqué");
        return false;
    }
    // console.log("Container zone index : " + indexAff + ", est NON masqué");
    return true;
}

// ------------------------------------------------------
// Masque le container. Retourne false si erreur, true sinon
function masquerContainerZone(indexAff) {
    var idContainerFils = "vitalite1ZoneContainer" + "_" + indexAff;
    var containerFils = document.getElementById(idContainerFils);
    if (containerFils == undefined) {
        // console.log("Impossible de masquer le container : " + idContainerFils + " car il n'existe pas");
        return false;
    }
    containerFils.classList.add('masquer');
    return true;
}


// ------------------------------------------------------
// Les containers des zones sont affichés dans cet ordre :
// vitalite1ZoneContainer_0
// vitalite1ZoneContainer_1
// ...
// maxContainersZone - 1
// Ils sont créés dans l'odre inverse : maxContainersZone - 1, puis, ... 0
// La fonction supprime les données de l'indexAff :
// Déplace ou plus exactement réécrit les données d'index inférieur vers le bas
// passe à display=None les containers inutilisés

function deplaceDonneesContainersZone (lzones, tabHeures, indexAff) {
    //console.log("***** Déplace zone à partir index : " + indexAff);
    var nombreZonesAfficheesSup = 0; // Au dessus de indexAff (soit les index inférieurs)
    for (var index = (indexAff - 1) ; index >= 0 ; index --) {
        if (containerZoneEstAffiche(index) == true) {
            nombreZonesAfficheesSup += 1;
        }
    }
    //console.log("Nombre de zones affichées au dessus de index : " + indexAff + " : " + nombreZonesAfficheesSup);
    // Déplacement des zones
    for (var index = indexAff ; index >= 0 ; index --) {
        if (((index - 1) >= 0) && (containerZoneEstAffiche(index - 1) == true) ) {
            // Récupération de l'id leaflet de la zone sup
            var containerSup = document.getElementById("vitalite1ZoneContainer" + "_" + (index -1));
            var nomZoneAfficheeSup = containerSup.querySelectorAll(".nomZone")[0].innerText;
            var _leaflet_id = ret_Leaflet_id(lzones, nomZoneAfficheeSup);
            // console.log("Zone " + nomZoneAfficheeSup + ", affichée index : " + (index - 1) +
            //    ", sera affichée à l'index : " + index);
            // Affichage dans le container de dessous
            afficheLigneVitalites1Zone(lzones, G_heuresV, _leaflet_id, index);
        }
    }
    // Masquage des zones
    //for (var index = 0 ; index < (nombreZonesAfficheesSup - 1) ; index ++) {
    for (var index = indexAff - nombreZonesAfficheesSup ; index >= 0 ; index --) {
    // console.log("Masquer container index : " + index);
        masquerContainerZone(index);
    }

}

// ------------------------------------------------------
// Retourne l'index du container où afficher la zone.
// Retourne -1 sans rien modifier si pas d'affichage de la zone : déjà affichée.
// Supprime la ligne la plus ancienne (celle du bas) si le nombre de zone max affichables est dépassé.
function retIndexAffZone(nomZone) {
    // Recherche si cette zone est déjà affichée
    for (var indexAff = maxContainersZone - 1 ; indexAff >= 0 ; indexAff--) {
        container = document.getElementById("vitalite1ZoneContainer" + "_" + indexAff);
        if ((container != undefined) && (containerZoneEstAffiche(indexAff) == true)) {
            nomZoneAffichee = container.querySelectorAll(".nomZone")[0].innerText;
            // console.log("Nom zone affichée : " + nomZoneAffichee + ", index : " + indexAff);
            if (nomZone == nomZoneAffichee) {
                // console.log("Zone déjà affichée : " + nomZone);
                return -1;
            }
        }
    }
    // Arrivé ici, la zone n'est pas déjà affichée
    // Recherche dans quel container l'afficher
    for (var indexAff = maxContainersZone - 1 ; indexAff >= 0 ; indexAff--) {
        container = document.getElementById("vitalite1ZoneContainer" + "_" + indexAff);
        // console.log("indexAff = " + indexAff);
        if ((container == undefined) || ( containerZoneEstAffiche(indexAff) == false)) {
            return indexAff;
        }
    }
    // Tous les containers sont utilisés
    // On va afficher les données dans le container 0, et déplacer toutes les autres zones vers le bas.
    //console.log("Affichage dans container 0");
    deplaceDonneesContainersZone (lzones, G_heuresV, maxContainersZone - 1)
    return 0;
}
// ***********







// *********** Lecteur : Avancée du temps automatique
// ------------------------------------------------------
async function lecteur() {
    while (1) {
        await sleep(tempo_lecteur);
        var valCurseur = curseurTemps.value;
        if (etat_lecteur == "arrete") {
            continue;
        }
        else if (etat_lecteur == "demarre") {
            //console.log("** demarre");
            if (curseurTemps.value == G_maxCurseur) {
                if (mode_lecteur == "unique") {
                    etat_lecteur = "arrete";
                    console.log("lecteur : Passage auto en état 'arrêté' à la fin de la simulation");
                    curseurTemps.value = 0;
                    curseurTempsMiseAJourVitalites();
                    continue;
                } else if (mode_lecteur == "continu") {
                    curseurTemps.value = 0;
                    curseurTempsMiseAJourVitalites();
                    continue;
                } else {
                    console.log("!!! mode du lecteur : " + mode_lecteur + " non valide");
                }
            } else {
                curseurTemps.value = parseInt(curseurTemps.value) + 1;
                curseurTempsMiseAJourVitalites();
                //console.log("curseur Temps : " + curseurTemps.value);
            }
        } else {
            console.log("!!! état du lecteur : " + etat_lecteur + " non valide");
        }
    }  // while
}
// ***********


// *********** Contrôles d'événements divers

// ------------------------------------------------------
// Si la géométrie de la fenêtre a été modifiée
// Redimension de la carte lorsque la géométrie de la fenêtre change
function redimObjets() {
    console.log("redimObjets()");
    var l = window.innerWidth;
    var h = window.innerHeight;
    //console.log("dim fenêtre : " + l + " x " + h + " px");
    var carte = document.getElementById("mapid");
    carte.style.height = h - 450 + "px";
    carte.style.width = l - 20 + "px";
}

// ------------------------------------------------------
function recentreCarte() {
    console.log("Recentre la carte");
    mymap.panTo(new L.LatLng(latInit, lonInit));
}

// ------------------------------------------------------
function redim() {
    redimObjets();
    recentreCarte();
}

// ------------------------------------------------------
// Supprimer une ligne d'affichage de la vitalité d'une zone en fct du temps,
// après avoir cliqué sur la case de fermeture
// indexAff : l'index du container
function clickFermerLigneZone(e, lzones, tabHeures, indexAff) {
    console.log("Fermer container index : " + indexAff);
    deplaceDonneesContainersZone (lzones, tabHeures, indexAff)
}

// ------------------------------------------------------
function clavierDown(e) {
    touche = e.key;
    if (etat_touche[touche] == "pressee") {
        return 0;
    }
    //console.log("Appui touche : *" + touche + "*");
    etat_touche[touche] = "pressee";

    if (mode_lecteur == "unique" && (touche == 'c')) {
        mode_lecteur = "continu";
        console.log("Lecteur : Passage en mode 'continu'")
    } else if (mode_lecteur == "continu" && (touche == ' ')) {
        mode_lecteur = "unique";
        console.log("Lecteur : Passage en mode 'unique'")
    }

    if ( (etat_lecteur == "arrete") && ( (touche == " ") || (touche == "c") )) {
        etat_lecteur = "demarre";
        console.log("lecteur : Passage en état 'démarré'")
    } else if ( (etat_lecteur == "demarre") && (touche == " ") ) {
        etat_lecteur = "arrete";
        console.log("lecteur : Passage en état 'arrêté'")
    }

    if ((touche == '-') && (tempo_lecteur < tempo_lecteur_max)) {
        tempo_lecteur = Math.floor(tempo_lecteur * 1.5);
        console.log("lecteur : tempo augmentée : " + tempo_lecteur);
    }
    if (((touche == '+') || (touche == "=")) && (tempo_lecteur > tempo_lecteur_min)) {
        tempo_lecteur = Math.floor(tempo_lecteur / 1.5);
        console.log("lecteur : tempo diminuée : " + tempo_lecteur);
    }
}

// ------------------------------------------------------
function clavierUp(e) {
    touche = e.key
    //console.log("Relâchement touche : *" + e.key + "*"   );
    etat_touche[touche] = "relachee";
}

// ------------------------------------------------------
function onPolygonClick(e) {
    var _leaflet_id = e.sourceTarget._leaflet_id;
    var nomZone = retNomZone(lzones, _leaflet_id);
    if (nomZone == false) {
        return 0;
    }
    var indexAff = retIndexAffZone(nomZone);
    if (indexAff == -1) {
        console.log("Zone : '" + nomZone + "' déjà affichée");
        return 0;
    }
    console.log("Afficher zone : '" + nomZone + "' (id_leaflet :" + _leaflet_id + ")");

    afficheLigneVitalites1Zone(lzones, G_heuresV, _leaflet_id, indexAff);
    majPositionIndicateursZones();
    // Après avoir cliqué sur une zone, les touches +, =, espace, changent le zoom de la carte.
    // Pour l'éviter, il faut supprimer le focus.
    // document.getElementById("mapid").blur();
}

// ------------------------------------------------------
function onMapClick(e) {
    //console.log("clic map");
    // Après avoir cliqué sur une zone, les touches +, =, espace, changent le zoom de la carte.
    // Pour l'éviter, il faut supprimer le focus.
    // Si on clique sur un polygone, on passe dans onPolygonClick() et dans cette fonction.
    document.getElementById("mapid").blur();
};

// ------------------------------------------------------
function onMapMouseMove(e) {
    //console.log("clic map");
    // Après avoir cliqué sur une zone, les touches +, =, espace, changent le zoom de la carte.
    // Pour l'éviter, il faut supprimer le focus.
    // Si on clique sur un polygone, on passe dans onPolygonClick() et dans cette fonction.
    document.getElementById("mapid").blur();
};

// ------------------------------------------------------
function onCarteZoomPlus(e) {
    //console.log("Clic zoom +");
    document.getElementById("mapid").blur();
}

// ------------------------------------------------------
function onCarteZoomMoins(e) {
    //console.log("Clic zoom -");
    document.getElementById("mapid").blur();
}

// ============================================================================
//                  FIN DES FONCTIONS
// ============================================================================

// Le curseur de temps prend des valeurs de 0 à G_maxCurseur
// Fixé à nb de dates de mesure de vitalité - 1
var G_maxCurseur = undefined;



// Dans cet objet on stocke pour chaque heure les vitalités des zones
var G_heuresV = []


redimObjets();

var mymap = L.map('mapid').setView([latInit, lonInit], zoomInit);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1
	}).addTo(mymap);



// zones : chargé dans le html par  <script src="zones.geojson"></script>
inverseLatLon(zones);
lzones = new Map();

// Affichage des zones, avec quelques propriétés statiques
zones.features.forEach(
    function(zone) {
        // On crée l'objet lzone
        lzone = new Map();
        nom = zone.properties['nom']; // Nom de la zone
        lzone.set('nom', nom);
        // 'lp' : leaflet polygone
        lzone.set('lp', L.polygon(zone.geometry.coordinates[0]));
        lzone.get('lp').bindTooltip("Zone : " + nom);
        // Événement clic dans le polygone
        lzone.get('lp').on('click', function(e){onPolygonClick(e)});
        lzone.get('lp').addTo(mymap);
        // _leaflet_id est semble-t-il le nom du polygone. Les arcs ont certainement aussi un _leaflet_id.
        // Pas trouvé mieux...
        lzone.set('_leaflet_id', lzone.get('lp')._leaflet_id); // N'est dispo qu'après addTo()
        // Ajout de l'objet lzone au tableau lzones
        lzones.set(nom, lzone);
    }
)

var curseurTemps = document.getElementById("curseurTemps");

var marqueurTemps = document.getElementById("marqueurTemps");
remplitTabHeuresChangementsVitalite(G_heuresV);
G_maxCurseur = G_heuresV.length - 1 ;
curseurTemps.max = G_heuresV.length - 1;
// console.log(curseurTemps.max);



curseurTempsMiseAJourVitalites();



ajouteLigneVitalitesMoyennes(G_heuresV);

majPositionIndicateur("moyenneVitalitesContainer");


ajouteGraduationsTemps(G_heuresV);


// Le lecteur
// ===========
// etat de la touche : "relachee", "pressee"
var etat_touche = [];

// etats du lecteur : "arrete", "demarre"
var etat_lecteur = "arrete";

// Modes du lecteur : "unique", "continu"
// unique : il s'arrête à la fin
// continu : il recommence
var mode_lecteur = "unique";

lecteur();

// Gestion des événements
// ========================

// Aussi dans le code :
//     baliseFermer.addEventListener("click"

window.onresize = redim;

// Evénement déplacement curseur de temps
curseurTemps.oninput = curseurTempsMiseAJourVitalites;

// Clic gauche souris
mymap.on('click', onMapClick);
// Clic droit souris
mymap.on('contextmenu', onMapClick);
// Déplacement de la carte
mymap.on('mousemove', onMapMouseMove);


document.addEventListener('keydown', clavierDown);
document.addEventListener('keyup', clavierUp);

L.DomEvent.addListener(document.querySelector('a.leaflet-control-zoom-in'), 'click', onCarteZoomPlus);
L.DomEvent.addListener(document.querySelector('a.leaflet-control-zoom-out'), 'click', onCarteZoomMoins);
