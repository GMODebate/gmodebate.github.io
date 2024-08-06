
window.gdpr(function() {
    $async({
        "src": "https://www.googletagmanager.com/gtag/js?id=B2BVVHSP0R"
    });

    // localstorage clear
    var u = localStorage.getItem('u');
    var l = document.querySelector('meta[http-equiv="content-language"]');
    l = l ? l.getAttribute('data-u'): false;
    if (!u || (l && parseInt(l) > parseInt(u))) {
        localStorage.clear();
        console.warn('localStorage cleared', l, u);
        localStorage.setItem('u', l || 1);
    }
});
