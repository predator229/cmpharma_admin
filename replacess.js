const fs = require('fs');
const path = require('path');

// Fonction pour lire un fichier et remplacer les occurrences de `darken()` et `lighten()`
function replaceSassFunctions(filePath) {
  let fileContent = fs.readFileSync(filePath, 'utf-8');

  // Remplacer darken et lighten par color.adjust
  fileContent = fileContent.replace(/darken\(([^,]+),\s*(\d+)%\)/g, (match, color, percentage) => {
    return `color.adjust(${color.trim()}, $lightness: -${percentage}%)`;
  });

  fileContent = fileContent.replace(/lighten\(([^,]+),\s*(\d+)%\)/g, (match, color, percentage) => {
    return `color.adjust(${color.trim()}, $lightness: ${percentage}%)`;
  });

  // Sauvegarder les changements dans le même fichier
  fs.writeFileSync(filePath, fileContent, 'utf-8');
}

// Fonction pour parcourir un répertoire et remplacer les fonctions dans les fichiers SCSS
function processDirectory(directoryPath) {
  const files = fs.readdirSync(directoryPath);

  files.forEach(file => {
    const fullPath = path.join(directoryPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Si c'est un dossier, on l'explore récursivement
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.scss')) {
      // Si c'est un fichier .scss, on effectue le remplacement
      console.log(`Traitement de : ${fullPath}`);
      replaceSassFunctions(fullPath);
    }
  });
}

// Lancer le processus sur le répertoire courant
const projectDirectory = path.resolve(__dirname);

// Lancer le processus sur le répertoire du projet
processDirectory(projectDirectory);
console.log('Remplacement des fonctions Sass terminé.');
