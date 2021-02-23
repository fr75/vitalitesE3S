// Le curseur de temps prend des valeurs de 0 à G_maxCurseur
G_maxCurseur = 100;

// Dans cet objet on stocke pour chaque heure les vitalités des zones
G_heuresV = []




//const zones = require('zones.js');
// import * as data from 'zones.js';
// console.log(zones.features[0].properties['nom']);
// console.log(zones.features[0].geometry.coordinates[0][1]);

// Malheureusement geojson code les coord en lon,lat dans cet ordre, et leaflet les utilse ne lat,lon
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

// Retourne une couleur en fonction d'un indice de chaleur entre 0 et 1
function heatMapColorforValue(value){
    var h = (1.0 - value) * 240
    var s = 100;
    var l = 50;
    return hslToHex(h, s, l);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// var mymap = L.map('mapid').setView([51.505, -0.09], 13);
var mymap = L.map('mapid').setView([48.7640, 2.2884], 17);
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
		maxZoom: 18,
		attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, ' +
			'Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
		id: 'mapbox/streets-v11',
		tileSize: 512,
		zoomOffset: -1
	}).addTo(mymap);

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
// var Polygon1 =
// L.polygon([
//     [ 48.763714022, 2.28562831879 ],
//     [ 48.7629148704, 2.28556394577 ],
//     [ 48.7626319818, 2.28693723679 ],
//     [ 48.763805959, 2.2875058651 ]
// ]);
// Polygon1.addTo(mymap);
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
inverseLatLon(zones);
lzones = new Map();

zones.features.forEach(
    function(zone) {
        lzone = new Map();
        nom = zone.properties['nom']; // Nom de la zone
        lzone.set('nom', nom);
        lzone.set('lp', L.polygon(zone.geometry.coordinates[0]));
        lzone.get('lp').bindTooltip("Zone : " + nom)
        lzone.get('lp').addTo(mymap);
        lzones.set(nom, lzone);

    }
)

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
// Convertit une heure exprimée en un int hhmm en minutes
function ConvHeureVersMn(hm) {
    return (Math.floor(hm / 100) * 60 + hm - Math.floor(hm / 100) * 100);
}

// Convertit des minutes en un int hhmm
function ConvMnVersHeure(mn) {
    h = Math.floor(mn / 60);
    m = mn - h * 60;
    return (h * 100 + m);
}


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

// Retourne les valeurs de vitalités
// Argument :l'heure du curseur en format entier : hhmm
// return false si erreur
function retVitalite(tabHeures, heure) {
    heurePrec = 0
    for(var i = 0; i < tabHeures.length; i++) {
        h = tabHeures[i]['heure']['h']
        // console.log("i = " + i + ", heure = " + h);
        if ( i == 0 && heure < h) {
            console.log("!! ERREUR Recherche vitalités d'une heure en dessous de l'heure de début : " + heure)
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

// A partir de l'objet heure (partie de G_heuresV), mise à jour des couleurs des zones sur la carte
function miseAJourAffichageVitalites(structHeure) {
    var k = Object.keys(structHeure['zones']);
    k.forEach(
        function (z) {
            vitalite = structHeure['zones'][z];
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

remplitTabHeuresChangementsVitalite(G_heuresV);

// Met à jour l'affichage des vitalités en fonction de la position du curseur de temps
function curseurTempsMiseAJourVitalites(){
    var valCurseur = curseurTemps.value;
    mnMin = ConvHeureVersMn(G_heuresV[0]['heure']['h']);
    mnMax = ConvHeureVersMn(G_heuresV[G_heuresV.length - 1]['heure']['h']);
    mn = Math.floor(mnMin +  ((mnMax - mnMin)/G_maxCurseur) * valCurseur);
    console.log("mnMin = " +  mnMin);
    hm = ConvMnVersHeure(mn);
    console.log("Curseur : " + valCurseur + ", minutes = " + mn + ", heures = " + hm);
    // Les valeurs de vitalités :
    vitalites = retVitalite(G_heuresV, hm);
    if (vitalites != false) {
        miseAJourAffichageVitalites(vitalites);
    }
}

// h = retVitalite(G_heuresV, 1049);
// //console.log("Heure : " );
// //console.log(h);
// if (h != false) {
//     miseAJourAffichageVitalites(h);
// }




var curseurTemps = document.getElementById("curseurTemps");

console.log("curseurTemps ");
console.log(curseurTemps.min);

// Initialisations
curseurTemps.max = G_maxCurseur;
curseurTempsMiseAJourVitalites();







// Evénement déplacement curseur de temps
curseurTemps.oninput = curseurTempsMiseAJourVitalites;
