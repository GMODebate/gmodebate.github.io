(function(window, document, localStorage, dark) {
    function LOAD_STYLE(css, style) {
        style = document.createElement('style');
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else if ('textContent' in style) {
            style.textContent = css;
        } else {
            style.appendChild(TEXT(css));
        }
        requestAnimationFrame(function() {
            document.head.appendChild(style);
        });
    }

    localStorage = (window.localStorage) ? window.localStorage : false;
    try {
        // localstorage
        dark = localStorage.getItem('dark');
        if (dark !== null) {
            dark = !!parseInt(dark);
        } else {
            dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
    } catch (e) {}

    if (dark) {
        document.documentElement.classList.add('dark');
        LOAD_STYLE(window.darkcss);
    }
})(window, document);