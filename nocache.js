// Skript pro zamezení cachování souborů
document.addEventListener('DOMContentLoaded', function() {
    // Přidání timestamp parametru ke všem CSS a JS souborům
    const timestamp = Date.now();
    
    // Najdi všechny CSS odkazy
    const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
    cssLinks.forEach(link => {
        let href = link.getAttribute('href');
        // Odstraň existující query parametry pokud existují
        href = href.split('?')[0];
        // Přidej nový timestamp
        link.setAttribute('href', `${href}?v=${timestamp}`);
    });
    
    console.log('CSS cache prevented with timestamp: ' + timestamp);
    
    // Najdi všechny JS skripty
    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
        const currentSrc = script.getAttribute('src');
        if (currentSrc && !currentSrc.includes('?v=') && currentSrc !== 'nocache.js') {
            script.setAttribute('src', `${currentSrc}?v=${timestamp}`);
        }
    });
}); 