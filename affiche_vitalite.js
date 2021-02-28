
// Francis Dupin
// février 2021



//const zones = require('zones.js');
// import * as data from 'zones.js';
// console.log(zones.features[0].properties['nom']);
// console.log(zones.features[0].geometry.coordinates[0][1]);

// ------------------------------------------------------
// Malheureusement geojson code les coord en lon,lat dans cet ordre, et leaflet les utilse en lat,lon
function inverseLatLon(zones)
{
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
} // function hslToHex

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

// var mymap = L.map('mapid').setView([51.505, -0.09], 13);


	// L.marker([51.5, -0.09]).addTo(mymap);
//
	// L.circle([51.508, -0.11], {
	// 	color: 'red',
	// 	fillColor: '#f03',
	// 	fillOpacity: 0.5,
	// 	radius: 500
	// }).addTo(mymap);
//
	// L.polygon([
	// 	[51.509, -0.08],
	// 	[51.503, -0.06],
	// 	[51.51, -0.047]
	// ]).addTo(mymap);

//
// Polygon1.bindTooltip('La souris survole le polygon1');
// // Par défaut, le polygone est bleu. On le change en rouge
// //Polygon1.setStyle({fillColor: '#FF0000FF'});
// Polygon1.setStyle({fillColor: heatMapColorforValue(0.8)});
// Polygon1.setStyle({fillOpacity: 0.5});
//
// var Polygon2 =
// L.polygon([
//     [ 48.7652062092, 2.28561758995 ],
//     [ 48.7658143865, 2.28622913361 ],
//     [ 48.7661396876, 2.28787064552 ],
//     [ 48.7655951606, 2.28827834129 ],
//     [ 48.7648738301, 2.28743076324 ],
// ])
// Polygon2.addTo(mymap);


// Crée les objets leaflet polygones


// // On fait varier la couleur
// async function testeCouleurs() {
//     chaleur1 = 0;
//     chaleur2 = 1;
//     while (1) {
//         //console.log(lzones.get('Lot M'));
//         lzones.get('Lot M').get('lp').setStyle({fillColor: heatMapColorforValue(chaleur1)});
//         Polygon2.setStyle({fillColor: heatMapColorforValue(chaleur2)});
//         chaleur1 += 0.01;
//         chaleur2 -= 0.01
//         if (chaleur1 > 1) {
//             chaleur1 = 0;
//             chaleur2 = 1;
//             await sleep(1000);
//         }
//
//         await sleep(100);
//         //console.log(chaleur);
//     }
// }
// testeCouleurs();


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
// Retourne les valeurs de vitalités
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
            return tabHeures[i]['heure'];
        }
        else if (heure < h) {
            return tabHeures[i - 1]['heure'];
        }
    }
    // Dernière valeur d'heure atteinte
    return tabHeures[tabHeures.length - 1]['heure'];
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
    var vitalites = retVitalite(G_heuresV, hm);
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
    majPositionIndicateur("vitalite1ZoneContainer");
}

// h = retVitalite(G_heuresV, 1049);
// //console.log("Heure : " );
// //console.log(h);
// if (h != false) {
//     miseAJourAffichageVitalites(h);
// }



// ------------------------------------------------------
// Positionnne l'indicateur de vitalité moyenne en fonction de la position du curseur de temps
// Arg : l'id du container
function majPositionIndicateur(container) {
    var valCurseur = curseurTemps.value ; // Le curseur de temps principal
    var container = document.getElementById(container);
    // Si les éléments du container n'ont pas été créés. C'est le cas du container vitalité 1 zone : contenu créé au 1er clic sur une zone.
    if (container.getElementsByTagName("p").length == 0) {
        return 0;
    }

    var indicateur = container.getElementsByTagName("img");
    indicateur[0].style.left = (100 / G_maxCurseur) *  valCurseur + "%";
    indicateur[0].style.display = "block";
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

// ------------------------------------------------------
// Retourne le nom de la zone en fonction de l'identifiant leaflet
// Retoure false si non trouvée
function retNomZone(lzones, _leaflet_id) {
    for (const [k, v] of lzones) {
        //console.log("Recherche nom zone pour _leaflet_id = " + _leaflet_id + " ** " + v.get('_leaflet_id'));
        if (v.get('_leaflet_id') == _leaflet_id) {
                console.log("Trouvé nom : " + v.get('nom') + " pour _leaflet_id = " + v.get('_leaflet_id'));
                return v.get('nom');
        }
    }
    console.log("!!! Nom de zone non trouvée pour _leaflet_id = " + _leaflet_id);
    return false;
}

// ------------------------------------------------------
function afficheLigneVitalites1Zone(lzones, tabHeures, _leaflet_id) {
    //console.log("Nb de dates de calcul de vitalité : " + nbElts);
    //Recherche le nom de la zone
    var nom = retNomZone(lzones, _leaflet_id);
    if (nom == false) {
        console.log("!!! Impossible d'afficher la ligne de vitalité pour la zone _leaflet_id = " + _leaflet_id);
        return -1;
    }
    var nbElts = tabHeures.length;
    var vitalitesContainer1Zone = document.getElementById("vitalite1ZoneContainer");
    // nbElts = 1 si le container ne contient rien.
    //var nbEltsContenus = vitalitesContainer1Zone.childNodes.length;
    var nbEltsContenus = vitalitesContainer1Zone.getElementsByTagName("p").length;
    //console.log("nb Elts contenus par vitalite1ZoneContainer = " + nbEltsContenus);
    if (nbEltsContenus == 0) {
        // On crée les éléments dans le container
        // Ajout du titre
        var baliseTitre = vitalitesContainer1Zone.getElementsByTagName("h2")[0];
        baliseTitre.appendChild(document.createTextNode("Vitalité pour la zone : "));
        var baliseEmph = document.createElement("em");
        baliseEmph.appendChild(baliseEmph.appendChild(document.createTextNode(nom)));
        baliseTitre.appendChild(baliseEmph);
        //vitalitesContainer1Zone.appendChild(baliseTitre);
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
            vitalitesContainer1Zone.appendChild(balise);
        }
    }
    else {
        // Les éléments existent déjà, on se contente de modifier leur valeur de vitalité
        eltsContenus = vitalitesContainer1Zone.getElementsByTagName("p");
        nbEltsContenus = eltsContenus.length ;
        //console.log("elts p = " + eltsContenus.length);
        if (nbEltsContenus != nbElts) {
            console.log("!!! nb de tags pour l'affichage de la vitalité d'une zone différents du nb de points de calcul horaire");
            console.log("Il es probable que pour une date de calcul, il y a des zones absentes");
        }
        // mise à jour du titre
        var titre = vitalitesContainer1Zone.getElementsByTagName("h2")[0];
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

function redimCarte() {
    var l = window.innerWidth;
    var h = window.innerHeight;
    console.log("dim fenêtre : " + l + " x " + h + " px");
    var carte = document.getElementById("mapid");
    carte.style.height = h - 400 + "px";
    carte.style.width = l - 20 + "px";
}

// ============================================================================
// ============================================================================

// Le curseur de temps prend des valeurs de 0 à G_maxCurseur
// Fixé à nb de dates de mesure de vitalité - 1
G_maxCurseur = undefined;



// Dans cet objet on stocke pour chaque heure les vitalités des zones
G_heuresV = []


var mymap = L.map('mapid').setView([48.7640, 2.2884], 17);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1
	}).addTo(mymap);

redimCarte();

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

// Gestion des événements
// ========================

window.onresize = redimCarte;

// Evénement déplacement curseur de temps
curseurTemps.oninput = curseurTempsMiseAJourVitalites;


function onPolygonClick(e) {
    var _leaflet_id = e.sourceTarget._leaflet_id;
    console.log("** clic zone " + _leaflet_id);
    afficheLigneVitalites1Zone(lzones, G_heuresV, _leaflet_id);
    majPositionIndicateur("vitalite1ZoneContainer");
}
