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

    function lsSet() {
        if (localStorage) {
            try {
                localStorage.setItem('gdpr-ok', 1);
            } catch (e) {}
        }
    }

    function setCookie() {
        doc.cookie = cookiename + '=1; path=/; expires=' + new Date(new Date() * 1 + 365 * 864e+5).toUTCString() + '; SameSite=Strict; Secure;';

        lsSet();
    }

    function getCookie() {

        if (localStorage) {
            if (localStorage.getItem('gdpr-ok')) {
                return true;
            }
        }

        var cookies = doc.cookie ? doc.cookie.split('; ') : [];

        for (var i = 0, l = cookies.length; i < l; i++) {
            var parts = cookies[i].split('=');
            if (parts[0] === cookiename) {

                lsSet();

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
        if (gcs && count <= 100) {

            if (win.getComputedStyle(el,null).getPropertyValue('display') === 'none') {
                acceptConsent();
            } else {
                setTimeout(function() {
                    verifyCookieBlockConsent(el, count);
                },10);
            }
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
            if (domready || count === 100) {
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
    /*
        function getCookie(c_name) {
            if (document.cookie.length > 0) {
                c_start = document.cookie.indexOf(c_name + "=");
                if (c_start != -1) {
                    c_start = c_start + c_name.length + 1;
                    c_end = document.cookie.indexOf(";", c_start);
                    if (c_end == -1) c_end = document.cookie.length;
                    return unescape(document.cookie.substring(c_start, c_end));
                }
            }
            return "";
        }*/

    /*function raf(fn) {
        $async.time(52, fn);
    }*/

    function acceptConsent(setup, el) {
        if (setup === 1) {
            showEl(w);
            showEl(o);
        } else {
            consent = true;

            showEl(w, true);
            showEl(o, true);
            setCookie();

            var q = consentQueue.shift();
            while (q) {
                q();
                q = consentQueue.shift();
            }
        }
    }

    var consent = getCookie();
    if (!consent) {
        (win.adsbygoogle = win.adsbygoogle || []).pauseAdRequests;
        acceptConsent(1);
    } else {
        acceptConsent();
    }

    return function(callback) {
        if (callback) {
            if (consent) {
                callback();
            } else {
                consentQueue.push(callback);
            }
        } else if (!consent) {
            acceptConsent(1);
        }
    }
})(window, document);