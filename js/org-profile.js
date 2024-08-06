var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();


(function(window, document, undefined) {

    var addEventListenerSupported = (document.addEventListener);

    /*window.gdpr(function() {
        $async({
            "src": "https://embed.tawk.to/63a48f20b0d6371309d5b311/1gktcu5vf", 
            "attributes": {
                "crossorigin": "*"
            }
        });
    });*/

    // query selector
    function QUERY(q, el, multi) {
        if (!el) {
            el = document;
        }
        if (multi) {
            return el.querySelectorAll(q);
        }
        return el.querySelector(q);
    }

    function IS_ARRAY(arr) {
        return arr instanceof Array;
    }

    // add event listener
    function ADD_EVENT(trigger, handler, el) {
        try {
            if (!el) {
                el = document;
            }

            // multiple triggers
            if (IS_ARRAY(trigger)) {
                for (var l = trigger.length, i = 0; i < l; i++) {
                    ADD_EVENT(trigger[i], handler, el);
                }
            } else {

                if (!IS_ARRAY(el) && !(el instanceof NodeList)) {
                    el = [el];
                }

                var _el, passive;
                for (var l = el.length, i = 0; i < l; i++) {
                    _el = el[i];

                    if (addEventListenerSupported) {
                        passive = (['touchstart'].indexOf(trigger) !== -1);
                        _el.addEventListener(trigger, handler, (passive ? {
                            passive: true
                        } : false));
                    } else if (_el.attachEvent) {
                        // IE8
                        if (trigger === 'DOMContentLoaded') {
                            trigger = 'load';
                            _el = window;
                        }
                        _el.attachEvent('on' + trigger, handler);
                    } else {
                        try {
                            _el['on' + trigger] = handler;
                        } catch (e) {}
                    }
                }
            }

            return function() {
                return REMOVE_EVENT(trigger, handler, el);
            }
        } catch (e) {
            console.error(e);
        }
    };

    var more = QUERY('.taglinks .tags .more a');
    if (more) {
        ADD_EVENT(['click', 'touchstart'], function(e) {
            e.preventDefault();
            e.stopPropagation();
            QUERY('.taglinks').classList.toggle('more');
        }, more);
    }

})(window, document);