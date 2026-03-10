const fs = require('fs');
const path = require('path');

const filesToFix = [
    'App.js',
    'src/gameEngine.js',
    'src/components/Header.js',
    'src/components/BottomNav.js',
    'src/components/FarmZone.js',
    'src/components/MarketZone.js',
    'src/components/FactoryZone.js',
    'src/components/UpgradesZone.js',
    'src/components/TrucksZone.js',
    'src/components/FinanceZone.js',
    'src/components/OverlayKit.js'
];

filesToFix.forEach(file => {
    const p = path.join(__dirname, file);
    if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf8');
        // Replace \` with `
        content = content.replace(/\\`/g, '`');
        // Replace \${ with ${
        content = content.replace(/\\\${/g, '${');
        fs.writeFileSync(p, content);
        console.log(`Fixed ${file}`);
    }
});
