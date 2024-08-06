(function(window, document) { 
    var addEventListenerSupported = (document.addEventListener);
    var HTMLDOC = document.documentElement;

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

    // add event listener
    function REMOVE_EVENT(trigger, handler, el) {
        if (!el) {
            el = doc;
        }

        // multiple triggers
        if (IS_ARRAY(trigger)) {
            for (var l = trigger.length, i = 0; i < l; i++) {
                REMOVE_EVENT(trigger[i], handler, el);
            }
            return;
        }

        if (!IS_ARRAY(el)) {
            el = [el];
        }

        var _el;
        for (var l = el.length, i = 0; i < l; i++) {
            _el = el[i];

            if (addEventListenerSupported) {
                _el.removeEventListener(trigger, handler, false);
            } else if (el.attachEvent) {
                // IE8
                _el.detachEvent('on' + trigger, handler);
            }
        }
    };

  var gdpr_w, gdpr_o, gdpr_init,
    menu_state;

  function showmenu(hide) {

    gtag('event', ((hide) ? 'menu_close' : 'menu_open'), {
        'event_category' : 'menu',
        'event_label' : ((hide) ? 'Close menu' : 'Open menu')
      });


    gdpr_w.style.display = (hide) ? 'none' : 'block';
    gdpr_o.style.display = (hide) ? 'none' : 'block';
  }

  function pagemenu() {

    if (!gdpr_w) {
      gdpr_w = document.getElementById('gdpr-w');
      gdpr_o = document.getElementById('gdpr-o');
    }

    if (!gdpr_w) {
      gdpr_w = document.createElement('div');
      gdpr_w.id = 'gdpr-w';
      gdpr_o = document.createElement('div');
      gdpr_o.id = 'gdpr-o';
      document.body.appendChild(gdpr_w);
      document.body.appendChild(gdpr_o);
    }

    if (!gdpr_init) {

      gdpr_init = true;

      gdpr_w.classList.add('menu');
      gdpr_w.classList.add('menu');

      var gdpr_i = gdpr_w.querySelector('.gdpr-i');
      if (gdpr_i) {
        gdpr_i.remove();
      }

      ADD_EVENT('click', function(e) {
        if (e.target === gdpr_o) {
          showmenu(true);
        }
      }, gdpr_o);

      gdpr_i = document.getElementById('menucon');
      gdpr_i.classList.add('gdpr-i');
      gdpr_i.removeAttribute('id');
      gdpr_w.appendChild(gdpr_i);

      ADD_EVENT('click', function(e) {
        showmenu(true);
      }, gdpr_w.querySelector('.close'));

      gdpr_w.classList.add('popup-w');
      gdpr_w.removeAttribute('id');
      gdpr_o.classList.add('popup-o');
      gdpr_o.removeAttribute('id');
    }

    showmenu();

    menu_state = !menu_state;
  }

  $async.time('domReady', function() {
    var menubtn = document.getElementById('menubtn');
    if (menubtn) {
      ADD_EVENT('click', function(e) {
          pagemenu();
      }, menubtn);
    }
  });
})(window, document)