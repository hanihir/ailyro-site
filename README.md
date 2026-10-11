# Ailyro — site de téléchargement

Nom provisoire du site de Nério. Page française statique, sans framework, service d’analyse ni étape de compilation. La police Mona Sans est hébergée localement sous licence OFL (voir assets/LICENSE-MonaSans.txt).

## Aperçu local

Depuis ce dossier : `python -m http.server 8000`, puis ouvrir http://localhost:8000. Le serveur HTTP est nécessaire pour charger le SVG animé ; le contenu et le lien de téléchargement restent accessibles sans JavaScript.

## Configuration

`config.js` centralise le nom affiché, le dépôt de téléchargement, le nom de l’installeur et l’URL du site. Après un changement de nom ou d’adresse, actualiser aussi les valeurs HTML de secours et les métadonnées de index.html, ainsi que assets/og-image.png.

L’aperçu du navigateur est une illustration HTML signalée comme telle. Il peut être remplacé par une capture actuelle fournie par l’auteur. Le logo original du navigateur est conservé, redimensionné pour le Web ; manta.svg en reprend le dessin pour animer séparément les ailes et la queue.

## Publication

Le dépôt public contient uniquement ce site. Le code du navigateur reste dans son dépôt privé. GitHub Pages publie la racine de main (.nojekyll désactive Jekyll).

L’installeur n’est jamais commité. Publier `Nerio-Setup.exe` dans une Release publique, marquée comme dernière version. Le bouton utilise `releases/latest/download/Nerio-Setup.exe`, indépendamment de la disponibilité de l’API. La version, la date et la taille sont lues depuis la Release ; en cas d’échec, la page affiche « Dernière version ».

Pour une nouvelle version : exécuter `npm run dist:win` dans le projet du navigateur, créer la Release correspondant à package.json et joindre dist/Nerio-Setup.exe. Le site ne nécessite pas de nouvelle publication.

## Animation et confidentialité

L’animation décorative utilise transform/opacity, s’arrête quand l’onglet est caché et respecte prefers-reduced-motion ainsi que le bouton de pause. Aucun cookie de pistage. Les requêtes réseau concernent les fichiers du site et les métadonnées de téléchargement GitHub. Le texte de confidentialité distingue stockage local et échanges avec les sites ou la traduction.
