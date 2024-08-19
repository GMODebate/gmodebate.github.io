window.gdpr = (function(win, doc) {

    var consentQueue = [];

    var cookiename = 'gdpr';
    var w = cookiename + '-w';
    var o = cookiename + '-o';
    var cookieSetupDone;
    var domready;
    var gcs = !!win.getComputedStyle;

    var localStorage = ("localStorage" in win) ? win.localStorage : false;

    if (document.readyState === 'complete') {
        domready = true;
    } else {
        doc.addEventListener("DOMContentLoaded", function() {
            domready = true;
        });
    }

    function decode(s) {
        return s.replace(/(%[0-9A-Z]{2})+/g, decodeURIComponent);
    }

    function lS(get) {
        if (localStorage) {
            try {
                if (get) {
                    return !!localStorage.getItem('gdpr-ok'); 
                }
                localStorage.setItem('gdpr-ok', 1);   
            } catch (e) {}
        }
    }

    function setCookie() {
        doc.cookie = cookiename + '=1; path=/; expires=' + new Date(new Date() * 1 + 365 * 864e+5).toUTCString() + '; SameSite=Strict; Secure;';
        lS();
    }

    function getCookie() {

        // try localStorage
        if (lS(1)) {
            return true;
        }

        var cookies = doc.cookie ? doc.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            if (parts[0] === cookiename) {
                lS();
                return true;
            }
        }

        return false;
    }

    function getEl(id) {
        return doc.getElementById(id);
    }

    function verifyCookieBlockConsent(el, count) {
        if (!count) {
            count = 0;
        }
        count++;
        if (!consent && gcs) {
            setTimeout(function() {
                if (win.getComputedStyle(el,null).getPropertyValue('display') === 'none') {
                    acceptConsent();
                } else {
                    verifyCookieBlockConsent(el, count);
                }
            },10);
        }
    }

    function showEl(id, hide, count, el) {
        el = getEl(id);
        if (el) {
            el.style.display = (hide) ? 'none' : 'block';
            if (id === w && !hide && !cookieSetupDone) {
                cookieSetupDone = true;
                getEl(cookiename + '-s').onclick = acceptConsent;
                verifyCookieBlockConsent(el);
            }
        } else {
            if (domready) {
                return acceptConsent();
            }
            if (!count) {
                count = 1;
            }
            setTimeout(function() {
                showEl(id, hide, ++count);
            }, 0);
        }
    }

    function acceptConsent(setup, el) {
        if (setup === 1) {
            showEl(w);
            showEl(o);
            doc.documentElement.classList.add('cookie');
        } else {
            consent = true;
            doc.documentElement.classList.remove('cookie');
            setCookie();

            showEl(w, true);
            showEl(o, true);

            var q = consentQueue.shift();
            while (q) {
                q();
                q = consentQueue.shift();
            }
        }
    }

    var consent = getCookie();
    if (!consent) {
        //(win.adsbygoogle = win.adsbygoogle || []).pauseAdRequests;
        //acceptConsent(1);

        // removed
        acceptConsent();
    } else {
        acceptConsent();
    }

    return function(callback) {
        if (callback === true || !callback) {
            acceptConsent((callback === true) ? false : 1); 
        } else if (callback) {
            if (consent) {
                callback();
            } else {
                consentQueue.push(callback);
            }
        }
    }
})(window, document);