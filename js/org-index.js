(function(window, document, undefined) {

    var VERSION = '1'; 

    var addEventListenerSupported = (document.addEventListener);
    var localStorage = ("localStorage" in window) ? window.localStorage : false;
    var _i18n = window._i18n;
    var _sprintf = window._sprintf;

    var FILTERDATA = {};
    var FILTER_CONFIG = {};
    var FILTERDATA_KEYINDEX = {};
    var LOCATION_HASH = document.location.hash;
    var LOCATION_HOST = document.location.hostname;
    var LOCATION_PATH = document.location.pathname;
    var FILTER_HASH;
    var PUSH_SUPPORT = ("history" in window && typeof history.pushState === "function");
    var BODY = document.body;

    /*(function(i, s, o, r) {
        i['GoogleAnalyticsObject'] = r;
        i[r] = i[r] || function() {
            (i[r].q = i[r].q || []).push(arguments)
        }, i[r].l = 1 * new Date();
    })(window, document, 'script', 'ga');*/

    function ga(cmd, key, event_name, action, data) {
        if (cmd === 'send' && key === 'event') {
            gtag('event', event_name, {
                'app_name': 'e-scooter.co',
                'screen_name': 'Index'
              });
        }
    }

    /*var requestAnimationFrame = function(fn) {
        $async.time("requestAnimationFrame", fn);
    }*/

    var requestIdleCallback = function(fn, timeout) {
        var timing = {
            type: "requestIdleCallback"
        }
        if (timeout) {
            timing.timeout = timeout;
        }
        $async.time(timing, fn);
    }

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
    function LOOP_OBJECT(obj, callback) {
        if (IS_ARRAY(obj)) {
            for (var i = 0, l = obj.length; i < l; i++) {
                callback(i, obj[i]);
            }
        } else {
            for (var varkey in obj) {
                if (obj.hasOwnProperty(varkey)) {
                    callback(varkey, obj[varkey]);
                }
            }
        }
    }



    function OBSERVER(callback, options, observe) {

        var observer = new IntersectionObserver(function(entries) {
            LOOP_OBJECT(entries, function(i, entry) {
                callback(entry, entry.target);
            });
        }, options);// {threshold: [1], rootMargin: '-46px 0px 0px 0px'}
        
        if (observe) {
            OBSERVE(observe, observer);
        }

        return observer;
    }

    function OBSERVE(el, observer, unobserve) {
        if (!IS_ARRAY(el) && !(el instanceof NodeList)) {
            el = [el];
        }
        LOOP_OBJECT(el, function(i, _el) {
            if (unobserve) {
                observer.unobserve(_el);
            } else {
                observer.observe(_el);    
            }
        });
    }


    // get attribute
    function GET_ATTR(el, attr) {
        return el ? el.getAttribute(attr) : undefined;
    }
    function HAS_ATTR(el, attr) {
        return el ? el.hasAttribute(attr) : false;
    }

    function SET_ATTRS(el, setAttrs, value) {
        var param, del;
        if (IS_ARRAY(el)) {
            for (var i = 0, l = el.length; i < l; i++) {
                SET_ATTRS(el[i], setAttrs);
            }
        } else {
            if (IS_STRING(setAttrs)) {
                var key = setAttrs;
                setAttrs = {};
                setAttrs[key] = value;
            }
            for (var attr in setAttrs) {
                if (setAttrs.hasOwnProperty(attr)) {
                    if (setAttrs[attr] === null) {
                        REMOVE_ATTR(el, attr);
                    } else {
                        el.setAttribute(attr, setAttrs[attr]);
                    }
                }
            }
        }
    };

    // check for multiple attributes
    function REMOVE_ATTR(el, attr) {
        if (IS_ARRAY(el)) {
            for (var i = 0, l = el.length; i < l; i++) {
                REMOVE_ATTR(el[i], attr);
            }
        } else {
            el.removeAttribute(attr);
        }
    };

    function IS_ARRAY(arr) {
        return arr instanceof Array;
    }


    function IS(mixed, type) {
        return typeof mixed === type;
    }

    function IS_STRING(str) {
        return IS(str, 'string');
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

    function CREATE_ELEMENT(type, setAttrs, contents, _doc) {
        _doc = _doc || document;
        var el = _doc.createElement(type);
        if (setAttrs) {
            SET_ATTRS(el, setAttrs);
        }
        ADD_ELEMENT_CONTENTS(el, contents);

        return el;
    }

    // return element clone
    function CLONE_ELEMENT(el, setAttrs, contents) {
        if (!el) {
            return 0;
        }
        var clone = el.cloneNode(true);
        if (setAttrs) {
            SET_ATTRS(clone, setAttrs);
        }
        ADD_ELEMENT_CONTENTS(clone, contents)
        return clone;
    }

    function APPEND_CHILD(target, el) {
        if (!IS_ARRAY(el)) {
            el = [el];
        }
        for (var i = 0, l = el.length; i < l; i++) {
            if (el[i] === 0) { continue; }
            if (IS_STRING(el[i])) {
                el[i] = TEXT(el[i]);
            }
            target.appendChild(el[i]);
        }
    }

    function SET_STYLE(el, props, noImportant) {
        for (var prop in props) {
            if (props.hasOwnProperty(prop)) {
                el.style.setProperty(prop, props[prop], (noImportant) ? "" : "important");
            }
        }
    }

    function SHOW(el, hide, showvalue) {
        if (!IS_ARRAY(el)) {
            el = [el];
        }
        if (!showvalue) {
            showvalue = '';
        }
        for (var i = 0, l = el.length; i < l; i++) {
            SET_STYLE(el[i], {
                'display': (hide) ? 'none' : showvalue
            });
        }
    }

    function CREATE_FRAGMENT() {
        return document.createDocumentFragment();
    }

    function HIDE(el) {
        SHOW(el, 1);
    }

    function TEXT(txt, text) {
        if (text) {
            txt.textContent = text;
        } else {
            return document.createTextNode(txt);
        }
    }

    function PARENT(el, n, parent) {
        n = n || 1;
        parent = el.parentElement;
        while (n > 1) {
            return PARENT(parent, --n);
        }
        return parent;
    }

    function REMOVE(el, p) {
        p = PARENT(el);
        if (p) {
            p.removeChild(el);
        }
    }

    function FIRST(el) {
        return el.firstChild;
    }


    function NEXT(el, n, next) {
        n = n || 1;
        next = el.nextSibling;
        while (n > 1) {
            return NEXT(next, --n);
        }
        return next;
    }

    function PREV(el, n, next) {
        n = n || 1;
        next = el.previousSibling;
        while (n > 1) {
            return PREV(next, --n);
        }
        return next;
    }

    function BEFORE(target, el) {
        PARENT(target).insertBefore(el, target);
    }

    function AFTER(target, el) {
        if (NEXT(target)) {
            return BEFORE(NEXT(target), el);
        } else {
            return APPEND_CHILD(PARENT(target), el);
        }
    }

    function EMPTY_HTML(el) {
        while (FIRST(el)) {
            REMOVE(FIRST(el));
        };
    }

    var ADD_ELEMENT_CONTENTS_CONTAINER;

    function ADD_ELEMENT_CONTENTS(el, contents) {
        if (contents) {
            if (!IS_ARRAY(contents)) {
                contents = [contents];
            }
            if (!IS_ARRAY(contents)) {
                contents = [contents];
            }
            if (!ADD_ELEMENT_CONTENTS_CONTAINER) {
                
                ADD_ELEMENT_CONTENTS_CONTAINER = CLONE_ELEMENT(DIV);
            }
            for (var i = 0, l = contents.length; i < l; i++) {
                if (IS_STRING(contents[i])) {
                    ADD_ELEMENT_CONTENTS_CONTAINER.innerHTML = contents[i];
                    while (FIRST(ADD_ELEMENT_CONTENTS_CONTAINER)) {
                        APPEND_CHILD(el, FIRST(ADD_ELEMENT_CONTENTS_CONTAINER));
                    }
                } else {
                    APPEND_CHILD(el, contents[i]);
                }
            }
        }
    }

    var OPTION, FILTERS, FILTERS_RESET, SEARCH_FIELD, SEARCH_FIELD_BUTTON, SEARCH_FIELD_BLUR_TIMEOUT, SOCIAL_SEARCH = {};
    var locale;

    var DIV = CREATE_ELEMENT('div');
    var SPAN = CREATE_ELEMENT('span');
    var P;
    var I = CREATE_ELEMENT('i');
    var A = CREATE_ELEMENT('a', {
        "href": "javascript:void(0);"
    });
    var A_EXT = CREATE_ELEMENT('a', {
        "href": "#",
        "target": "_blank",
        "rel": "noopener"
    });

    var REL_PRELOAD = CREATE_ELEMENT('link', {
        "rel": "preload",
        "as": "fetch"
    });
    var REL_PREFETCH = CREATE_ELEMENT('link', {
        "rel": "prefetch"
    });
    var SPAN_EMOJI = CREATE_ELEMENT('span', {
        "class": "e"
    });
    
    function INIT_FILTER_HASH() {
        //var config = JSON.parse(JSON.stringify(FILTER_CONFIG));
        //delete config.favorites;
        if (!FILTER_CONFIG) {
            return '{}';
        }
        FILTER_HASH = JSON.stringify(FILTER_CONFIG);
        return FILTER_HASH;
    }

    function FETCH_JSON(file, type, cache) {

        var cache_data;
        if (cache) {
            try {
                // localstorage
                cache_data = JSON.parse(localStorage.getItem('j:' + cache));
                //cache_data = false;
                if (cache_data) {

                    // verify update in background
                    fetch(file, {
                        method: 'HEAD',
                        headers: {
                            'If-Modified-Since': cache_data[1]
                        }
                    })
                    .then(function(res) {
                        if (res.status !== 304) {
                            localStorage.removeItem('j:' + cache);
                        }
                    })
                    .catch(function(err) {
                        console.error('JSON index head update',file,type,err);
                    });

                    return Promise.resolve(cache_data[0]);
                }
            } catch (e) { }
        }

        return fetch(file)
            .then(function(res) {
                return res.json()
                    .then(function(json) {
                        return [json,res.headers.get('last-modified')];
                    });
            })
            .then(function(json) {

                if (cache) {
                    try {
                        localStorage.setItem('j:' + cache, JSON.stringify([
                            json[0], json[1]
                        ]));
                    } catch (e) {
                        console.error(e);
                    }
                }
                return json[0];
            })
            .catch(function(err) {
                console.error('JSON index',file,type,err);
            });
    }

    function SETUP_INDEX() {

        FILTERS = QUERY('.searchbox');

        locale = GET_ATTR(QUERY('html'), 'lang');
        if (locale) {
            locale = locale.replace(/_/g, '-');
        } else {
            locale = 'en-US';
        }

        // search field
        if (!SEARCH_FIELD) {
            SEARCH_FIELD = QUERY('.search-input', FILTERS);
            SEARCH_FIELD_BUTTON = QUERY('.filter-search-button', FILTERS);
            if (SEARCH_FIELD) {

                if (FILTER_CONFIG.query) {
                    SEARCH_FIELD.value = FILTER_CONFIG.query;
                    SEARCH_FIELD_BUTTON.classList.add('active');
                }

                var search_field_timeout;
                ADD_EVENT(['keypress', 'input', 'change'], function(e) {
                    var _that = this, value = _that.value.trim();
                    if (search_field_timeout) {
                        clearTimeout(search_field_timeout);
                    }

                    if (e.keyCode == 13) {
                        SEARCH_FIELD_BLUR_TIMEOUT = -1;
                        AUTOCOMPLETE(false);

                        RESET_FILTERS();
                        SEARCH_FIELD.value = value;
                        SAVE_FILTER_CONFIG('query', (value) ? value : false);
                        APPLY_FILTERS();

                        /*if (!value) {
                            SEARCH_FIELD_BUTTON.classList.remove('active');
                        } else {
                            SEARCH_FIELD.value = value;
                            SEARCH_FIELD_BUTTON.classList.add('active');
                        }*/
                        setTimeout(function() {
                            SEARCH_FIELD_BLUR_TIMEOUT = false;
                        });
                        return;
                    }

                    search_field_timeout = setTimeout(function() {
                        search_field_timeout = 0;

                        AUTOCOMPLETE(value);

                        if (!value) {
                            SEARCH_FIELD_BUTTON.classList.remove('active');
                        } else {
                            SEARCH_FIELD_BUTTON.classList.add('active');
                        }

                    });

                }, SEARCH_FIELD);

                ADD_EVENT(['blur','focus', 'mousedown', 'touchstart'], function(e) {
                    var that = this;
                    if (search_field_timeout) {
                        clearTimeout(search_field_timeout);
                    }
                    if (SEARCH_FIELD_BLUR_TIMEOUT === -1) {
                        SEARCH_FIELD_BLUR_TIMEOUT = false;
                        return;
                    }
                    if (SEARCH_FIELD_BLUR_TIMEOUT) {
                        clearTimeout(SEARCH_FIELD_BLUR_TIMEOUT);
                    }
                    SEARCH_FIELD_BLUR_TIMEOUT = setTimeout(function() {
                        if (e.type === 'blur') {
                            AUTOCOMPLETE(false);
                        } else {
                            AUTOCOMPLETE(that.value.trim());
                        }
                    });

                }, SEARCH_FIELD);

                var site_host;
                ADD_EVENT('click', function(e) {
                    
                    if (SEARCH_FIELD.value.trim() !== '') {
                        if (!site_host) {
                            site_host = CLONE_ELEMENT(A, {
                                "href": CANONICAL.href
                            }).hostname;
                        }
                        window.open('https://www.google.com/search?q=' + encodeURIComponent(SEARCH_FIELD.value+' site:' +site_host), 'google')
                    }

                }, SEARCH_FIELD_BUTTON);

                // escape key
                ADD_EVENT(['keypress', 'keydown'], function(e) {
                    if (e.keyCode == 27 && SEARCH_FIELD.value) {
                        e.preventDefault();
                        AUTOCOMPLETE(false);
                    }
                });
            }
        }

        // multi menus
        var multi_menus = ['animals', 'environment', 'regions', 'tags', 'jobs', 'features'];
        for (var i = 0, l = multi_menus.length; i < l; i++) {
            (function(menu_key, menu) {

                menu = QUERY('.multi-input[data-name="' + menu_key + '"]', FILTERS);

                if (menu) {
                    if (QUERY('.placeholder', menu)) {
                        SET_ATTRS(menu, {
                            "data-placeholder": QUERY('.placeholder', menu).innerHTML
                        });
                    }

                    var selected = [];
                    var menuoptions = (menu_key in FILTER_CONFIG && IS_ARRAY(FILTER_CONFIG[menu_key])) ? FILTER_CONFIG[menu_key] : [];
                    for (var i = 0, l = menuoptions.length; i < l; i++) {
                        selected.push(menuoptions[i].toString());
                    }
                    UPDATE_MULTI_SELECT(menu_key, menu, selected);

                    ADD_EVENT(['click'], function() {

                        MULTI_SELECT_LOAD_FILTERS(menu_key, menu);

                    }, menu);

                }

            })(multi_menus[i]);
        }
    }

    // load filters for multi-select menu
    function MULTI_SELECT_LOAD_FILTERS(menu_key, menu, on_select, groupfocus) {

        var options = [];
        var filter;
        var optgroup;
        var option_method;
        var after_render;

        LOAD_INDEX_JSON(function() {

            switch (menu_key) {
                case "animals":
                case "environment":
                case "jobs":
                case "features":

                    function render_optgroups(parent, level) {
                        for (var _i = 0, animalgroup, _l = FILTERDATA[menu_key][1].length; _i < _l; _i++) {
                            animalgroup = FILTERDATA[menu_key][1][_i];

                            if (
                                (!parent && animalgroup[3])
                                || (parent && parent !== animalgroup[3])
                            ) {
                                continue;
                            }

                            optgroup = [
                                [], 
                                animalgroup[1], // slug
                                animalgroup[0], // name
                                (parent) ? false : animalgroup[2], // emoji
                                (parent) ? [parent, level] : false,
                                true,
                                animalgroup[4] // search
                            ];
                            options.push(optgroup);

                            if (animalgroup[1]) {
                                render_optgroups(animalgroup[1], level + 1);
                            }

                            for (var i = 0, animal, l = FILTERDATA[menu_key][0].length; i < l; i++) {
                                animal = FILTERDATA[menu_key][0][i];
                                if (animal[3] === animalgroup[1]) {
                                    optgroup[0].push([
                                        animal[1], // slug
                                        animal[0], // name
                                        animal[2], // emoji
                                        animal[4] // search
                                    ]);
                                }
                                
                            }
                        }
                    }

                    render_optgroups(false, 0);

                break;
                case "tags":
                    var title;
                    var optgroup = [
                        []
                    ];

                    var tags = [], tagrow, tagname;

                    // @todo precache sorting?
                    for (var tag in TAGS) {
                        if (TAGS.hasOwnProperty(tag)) {
                            tagrow = TAGS[tag];

                            // filter tag
                            if (tagrow[3]) {
                                continue;
                            }

                            tags.push([tag, tagrow[1]]);
                        }
                    }

                    tags.sort(function (a, b) {
                        return a[1].localeCompare(b[1]);
                    });

                    for (var i = 0, tag, l = tags.length; i < l; i++) {
                        tag = tags[i][0];
                        tagrow = TAGS[tag];
                        optgroup[0].push([
                            tagrow[0],  // slug
                            tagrow[1], // name
                            tagrow[2], // emoji
                            tagrow[4] // search
                        ]);
                    }

                    options.push(optgroup);

                    /*option_method = function(option) {
                        if (!FLAG) {
                            FLAG = CREATE_ELEMENT('img', {
                                "class": "flag",
                                "src": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                            });
                        }
                        APPEND_CHILD(option, CLONE_ELEMENT(FLAG, {
                            "title": GET_ATTR(option, 'data-search'),
                            "alt": "",
                            "data-src": "/flags/4x3/" + option.firstChild.name + '.svg'
                        }));

                        return option;
                    }*/

                    optgroup = true;

                    /*after_render = function() {
                        $lazy(['.multi-select .flag', 0, '100px']);
                    }*/
                break;
                case "regions":
                    var title;
                    var optgroup;
                    var country;
                    var continent;
                    var region;
                    var sitecountry = (SITE_COUNTRY && COUNTRIES[SITE_COUNTRY]) ? COUNTRIES[SITE_COUNTRY] : false;

                    optgroup = [
                        [
                            [
                                'int',
                                _i18n('int_planet'),
                                CONTINENTS.int[1],
                                CONTINENTS.int[3]
                            ]
                        ]
                    ];

                    if (sitecountry) {
                        optgroup[0].push([
                            SITE_COUNTRY, 
                            sitecountry[0],
                            sitecountry[1],
                            sitecountry[COUNTRIES[SITE_COUNTRY]?4:3]
                        ]);
                    }

                    if (sitecountry && sitecountry[2]) {

                        // self
                        for (var i = 0, l = sitecountry[2].length; i < l; i++) {
                            region = COUNTRIES[sitecountry[2][i]];
                            if (region) {
                                optgroup[0].push([
                                    sitecountry[2][i], 
                                    region[0],
                                    region[1],
                                    region[4]
                                ]);
                            }
                        }
                    }

                    options.push(optgroup);

                    // continents

                    optgroup = [
                        [], 
                        'continents', // slug
                        _i18n('continents'), // name
                        TAG_EMOJI_EL('🗺️'), // emoji
                        false,
                        true,
                        false
                    ];

                    for (var cc in CONTINENTS) {
                        if (CONTINENTS.hasOwnProperty(cc)) {
                            if (cc === 'int') {
                                continue;
                            }
                            region = CONTINENTS[cc];
                            country = [
                                cc, 
                                region[0],
                                region[1],
                                region[3]
                            ];

                            optgroup[0].push(country);
                        }
                    }
                            
                    options.push(optgroup);

                    var continent_order = CONTINENT_ORDER.slice(0);
                    if (sitecountry) {
                        continent_order.unshift(sitecountry.continent);
                    }
                    for (var i = 0, cc, l = continent_order.length; i < l; i++) {
                        cc = continent_order[i];
                        if (cc === 'int' || (i !== 0 && sitecountry.continent === cc)) {
                            continue;
                        }

                        region = CONTINENTS[cc];

                        optgroup = [
                            [], 
                            cc, // slug
                            region[0], // name
                            region[1], // emoji
                            false,
                            true,
                            region[3]
                        ];

                        for (var _cc in COUNTRIES) {
                            if (COUNTRIES.hasOwnProperty(_cc)) {
                                country = COUNTRIES[_cc];

                                if (
                                    country.continent === cc 
                                    && (
                                        !sitecountry[2]
                                        || sitecountry[2].indexOf(_cc) === -1
                                    )
                                    && _cc !== SITE_COUNTRY
                                ) {
                                    optgroup[0].push([
                                        _cc, 
                                        country[0],
                                        country[1],
                                        country[4]
                                    ]);
                                }
                            }
                        }
                        options.push(optgroup);
                    }

                    /*option_method = function(option) {
                        if (!FLAG) {
                            FLAG = CREATE_ELEMENT('img', {
                                "class": "flag",
                                "src": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                            });
                        }
                        APPEND_CHILD(option, CLONE_ELEMENT(FLAG, {
                            "title": GET_ATTR(option, 'data-search'),
                            "alt": "",
                            "data-src": "/flags/4x3/" + option.firstChild.name + '.svg'
                        }));

                        return option;
                    }*/

                    optgroup = true;

                    /*after_render = function() {
                        $lazy(['.multi-select .flag', 0, '100px']);
                    }*/
                break;
            }

            OPEN_MULTI_SELECT(menu_key, menu, options, optgroup, option_method, after_render, on_select, groupfocus);

        });
/*


        LOAD_JS_INDEX('/filters-animals.json', 'filters', function(filters) {

            AVAILABILITY = filters[3];

            var options = [];
            var filter;
            var optgroup;
            var option_method;
            var after_render;

            switch (menu_key) {
                case "tags":
                    for (var i = 0, l = filters[0].length; i < l; i++) {
                        filter = filters[0][i];
                        options.push([filter.id, filter.name]);
                    }
                    break;
                case "features":
                    var feature;

                    var optgroup;

                    /* = [
                        [], 'general', null
                    ];
                    for (var i = 0, l = filters[1].general.length; i < l; i++) {
                        filter = filters[1].general[i];
                        optgroup[0].push([filter[0], filter[1]]);
                    }
                    options.push(optgroup); 

                    * /

                    var opt_keys = ['general','battery', 'style', 'drive', 'special'];

                    var _key, fid;
                    for (var _i = 0, _l = opt_keys.length; _i < _l; _i++) {
                        _key = opt_keys[_i];
                        if (filters[1][_key]) {
                            optgroup = [
                                [], _key, _i18n(_key)
                            ];
                            for (var i = 0, l = filters[1][_key].length; i < l; i++) {
                                fid = filters[1][_key][i];
                                filter = filters[4][fid];
                                optgroup[0].push([fid, filter[0], filter[1], {
                                    emoij: filter[3]
                                }]);
                            }
                            options.push(optgroup);
                        }
                    }

                    option_method = function(option, optiondata) {

                        var name = option.firstChild.name;
                        var fid = parseInt(name);
                        if (isNaN(fid)) {
                            fid = name;
                        }
                        if (optiondata && optiondata.emoij) {
                            if (!FEATURE_MENU_ICON) {
                                FEATURE_MENU_ICON = CLONE_ELEMENT(SPAN, {
                                    "style": "float:right;margin-right: 10px;"
                                });
                            }
                            APPEND_CHILD(option, CLONE_ELEMENT(FEATURE_MENU_ICON, null, TEXT(optiondata.emoij)));
                        }

                        return option;
                    }

                    optgroup = true;
                    break;
                case "regions":

                    var title;
                    var optgroup;

                    optgroup = [
                        [], 'neighbours'
                    ];

                    var cc = window.countrylist[0];

                    // self
                    var self_printed;
                    for (var i = 0, l = window.countrylist[4].length; i < l; i++) {
                        filter = window.countrylist[4][i];
                        if (filter[0] === cc) {
                            title = filter[1];
                            if (['eu', 'us', 'in'].indexOf(filter[0]) !== -1) {
                                title = filter[2];
                            }

                            self_printed = filter[0];

                            optgroup[0].push([filter[0], title, filter[2]]);
                        }
                    }

                    for (var region in window.countrylist[5]) {
                        if (window.countrylist[5].hasOwnProperty(region)) {
                            optgroup = [
                                [], region, _i18n(region)
                            ];
                            for (var i = 0, l = window.countrylist[4].length; i < l; i++) {
                                filter = window.countrylist[4][i];
                                if (filter[3] === region && neighbours.indexOf(filter[0]) === -1) {

                                    title = filter[1];
                                    if (['eu', 'us', 'in'].indexOf(filter[0]) !== -1) {
                                        title = filter[2];
                                    }

                                    optgroup[0].push([filter[0], title, filter[2]]);
                                }
                            }
                            options.push(optgroup);
                        }
                    }

                    option_method = function(option) {
                        if (!FLAG) {
                            FLAG = CREATE_ELEMENT('img', {
                                "class": "flag",
                                "src": "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                            });
                        }
                        APPEND_CHILD(option, CLONE_ELEMENT(FLAG, {
                            "title": GET_ATTR(option, 'data-search'),
                            "alt": "",
                            "data-src": "/flags/4x3/" + option.firstChild.name + '.svg'
                        }));

                        return option;
                    }

                    optgroup = true;

                    after_render = function() {
                        $lazy(['.multi-select .flag', 0, '100px']);
                    }
                    break;
            }

            OPEN_MULTI_SELECT(menu_key, menu, options, optgroup, option_method, after_render, on_select, groupfocus);

        });

*/

    }

    function OPEN_MULTI_SELECT_BY_KEY(menu_key, on_select, groupfocus) {
        var menu = QUERY('.multi-input[data-name="' + menu_key + '"]', FILTERS);
        switch (menu_key) {
            case "madein":
                LOAD_COUNTRIES(function() {
                    MULTI_SELECT_LOAD_FILTERS(menu_key, menu, on_select, groupfocus);
                });
                break;
            default:
                MULTI_SELECT_LOAD_FILTERS(menu_key, menu, on_select, groupfocus);
                break;
        }
    }

    var DESELECT_BUTTON;
    var X_SELECTED;

    function UPDATE_MULTI_SELECT(menu_key, menu, selected) {

        requestAnimationFrame(function() {

            if (!GET_ATTR(menu, 'data-placeholder') && QUERY('.placeholder', menu)) {
                SET_ATTRS(menu, {
                    "data-placeholder": QUERY('.placeholder', menu).innerHTML
                });
            }

            EMPTY_HTML(menu);
            if (selected && selected.length) {

                if (!DESELECT_BUTTON) {
                    DESELECT_BUTTON = CLONE_ELEMENT(A, {
                        "class": "deselect",
                        "title": _i18n('deselect')
                    }, 'x');
                }
                var deselect = CLONE_ELEMENT(DESELECT_BUTTON);
                APPEND_CHILD(menu, deselect);

                APPEND_CHILD(menu, CLONE_ELEMENT(DIV, {
                    "class": "selected"
                }, _i18n('x_selected', selected.length)));

                ADD_EVENT('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    SAVE_FILTER_CONFIG(menu_key, []);
                    UPDATE_MULTI_SELECT(menu_key, menu, 0);
                    APPLY_FILTERS(false, false, true);
                }, deselect);
            } else {
                APPEND_CHILD(menu, CLONE_ELEMENT(DIV, {
                    "class": "placeholder"
                }, GET_ATTR(menu, 'data-placeholder')));
            }
        });
    }

    var MULTI_SELECT;
    var MULTI_SELECT_OVERLAY;
    var MULTI_SELECT_MENU;

    var MULTI_SELECT_ELEMENT;
    var MULTI_SELECT_OVERLAY_ELEMENT;
    var FLAG;

    function CLOSE_MULTI_SELECT() {

        // remove existing select
        if (MULTI_SELECT) {
            try {
                REMOVE(MULTI_SELECT);
                REMOVE(MULTI_SELECT_OVERLAY);
            } catch (e) {}
        }
        MULTI_SELECT = false;
        MULTI_SELECT_OVERLAY = false;
        MULTI_SELECT_MENU = false;
    }

    function OPEN_MULTI_SELECT(menu_key, menu, options, optgroups, option_method, after_render, on_select, groupfocus) {

        AUTOCOMPLETE(false);

        if (MULTI_SELECT) {
            CLOSE_MULTI_SELECT();
        }

        if (!MULTI_SELECT_ELEMENT) {

            var search_placeholder = _i18n('search');

            MULTI_SELECT_ELEMENT = CLONE_ELEMENT(DIV, {
                "class": "multi-select"
            }, CLONE_ELEMENT(DIV, {
                "class": "head"
            }, [CLONE_ELEMENT(A, {
                "class": "close"
            }, 'X'), CREATE_ELEMENT('input', {
                "type": "search",
                "tabindex": "0",
                "placeholder": search_placeholder
            })]));

            APPEND_CHILD(MULTI_SELECT_ELEMENT, CLONE_ELEMENT(DIV, {
                "class": "options",
                "tabindex": "-1"
            }, CLONE_ELEMENT(MULTI_SELECT_OPTION('', 'toggle', _i18n('check_all')), {
                "class": "toggle",
                "title": _i18n('check_all')
            })));

            APPEND_CHILD(MULTI_SELECT_ELEMENT, CLONE_ELEMENT(DIV, {
                "class": "buttons"
            }, CREATE_ELEMENT('input', {
                "type": "button",
                "value": _i18n('select')
            })));

            MULTI_SELECT_OVERLAY_ELEMENT = CLONE_ELEMENT(DIV, {
                "class": "multi-select-overlay"
            });

            // escape key
            ADD_EVENT(['keypress', 'keydown'], function(e) {
                if (e.keyCode == 27 && MULTI_SELECT) {
                    e.preventDefault();
                    CLOSE_MULTI_SELECT();
                }
            });

            if (PUSH_SUPPORT) {
                window.onpopstate = function() {
                    if (MULTI_SELECT) {
                        CLOSE_MULTI_SELECT();
                    }
                };
            } else {
                window.onhashchange = function() {
                    if (MULTI_SELECT) {
                        CLOSE_MULTI_SELECT();
                    }
                };
            }
        }

        if (PUSH_SUPPORT) {
            history.pushState("multi-menu", null, null);
        } else {
            document.location.hash = '#multi-menu';
        }

        MULTI_SELECT = CLONE_ELEMENT(MULTI_SELECT_ELEMENT);
        MULTI_SELECT.classList.add(menu_key);
        MULTI_SELECT_OVERLAY = CLONE_ELEMENT(MULTI_SELECT_OVERLAY_ELEMENT);
        MULTI_SELECT_MENU = menu;

        var _options = CREATE_FRAGMENT();

        var selected = [];
        var menuoptions = (menu_key in FILTER_CONFIG && IS_ARRAY(FILTER_CONFIG[menu_key])) ? FILTER_CONFIG[menu_key] : [];
        for (var i = 0, l = menuoptions.length; i < l; i++) {
            selected.push(menuoptions[i].toString());
        }

        if (!optgroups) {
            optgroups = [
                [options]
            ];
        } else {
            optgroups = options;
        }

        var option, optgroup, optgroupkey, tabindex = 0;
        for (var og = 0, emoji, ogel, ogattr, ol = optgroups.length; og < ol; og++) {

            optgroupkey = (optgroups[og][1]) ? optgroups[og][1] : false;
            if (optgroups[og][2]) {
                ogattr = {
                    "rel": optgroupkey
                };
                if (optgroups[og][7]) {
                    ogattr = Object.assign(optgroups[og][7], ogattr);
                }
                if (optgroups[og][4]) {
                    ogattr['class'] = ((ogattr['class']) ? ogattr['class'] : '') + 'sub';
                    if (optgroups[og][4][1] > 1) {
                        ogattr['class'] += ' l' + ((optgroups[og][4][1] <= 3) ? optgroups[og][4][1] : 3);
                    }
                    ogattr['data-level'] = optgroups[og][4][1];
                }

                emoji = 0;
                if (optgroups[og][3]) {
                    emoji = CLONE_ELEMENT(optgroups[og][3]);
                }
                
                ogel = CREATE_ELEMENT('h3',ogattr, [
                    CLONE_ELEMENT(SPAN, 0, [
                        ((optgroups[og][4]) ? '└ ': '') + optgroups[og][2],
                        (optgroups[og][5]) ? CLONE_ELEMENT(MULTI_SELECT_OPTION(
                            '', optgroupkey, '', 
                            (selected.indexOf(optgroupkey) !== -1)
                        ), {
                            "class": "toggle",
                            "title": _i18n('check_all')
                        }) : 0]), emoji]);

                optgroups[og].el = ogel;

                APPEND_CHILD(_options, ogel);
            }
            options = optgroups[og][0];
            for (var i = 0, l = options.length; i < l; i++) {
                option = MULTI_SELECT_OPTION(
                    menu_key + ((optgroupkey) ? '_' + optgroupkey : ''),
                    options[i][0],
                    options[i][1],
                    (selected.indexOf(options[i][0].toString()) !== -1),
                    (options[i][2]) ? CLONE_ELEMENT(options[i][2]) : 0,
                    ++tabindex
                );

                if (option_method) {
                    option = option_method(option, options[i]);
                }

                options[i].el = option;

                APPEND_CHILD(_options, option);
            }
        }

        var options_container = QUERY('.options', MULTI_SELECT);
        APPEND_CHILD(options_container, _options);

        requestAnimationFrame(function() {

            // add to DOM
            APPEND_CHILD(BODY, [MULTI_SELECT, MULTI_SELECT_OVERLAY]);

            var closelink = QUERY('a.close', MULTI_SELECT);
            var search = QUERY('.head input', MULTI_SELECT);
            var selectbutton = QUERY('.buttons input', MULTI_SELECT);

            requestAnimationFrame(function() {

                ADD_EVENT('click', function(e) {
                    if (e.srcElement === closelink || e.srcElement === MULTI_SELECT_OVERLAY) {
                        e.preventDefault();
                        CLOSE_MULTI_SELECT();
                    }
                }, [closelink, MULTI_SELECT_OVERLAY]);

                ADD_EVENT('click', function(e) {
                    var checked = this.checked;

                    var sub = PARENT(this, 3);
                    if (sub.nodeName === 'H3') {
                        var next = NEXT(sub, 1);
                        if (next) {
                            var level = GET_ATTR(sub, 'data-level'), subh, subl, subi,
                                option, pauzed;
                            subh = next.classList.contains('sub');
                            option = next.classList.contains('option');
                            while (
                                subh || option
                            ) {
                                if (subh) {
                                    subl = GET_ATTR(next, 'data-level');
                                    if (!subl || (level && parseInt(subl) <= parseInt(level))) {
                                        break;
                                    }
                                    if (subl && parseInt(subl) > parseInt(level)) {
                                        pauzed = true;
                                    }
                                    subi = QUERY('input', next);
                                    if (subi) {
                                        subi.checked = checked;
                                    }
                                } else {
                                    subi = QUERY('input', next);
                                    if (subi) {
                                        subi.checked = checked;
                                    }
                                }
                                next = NEXT(next, 1);
                                subh = next.classList.contains('sub');
                                option = next.classList.contains('option');
                            }
                        }

                        /*if (!checked) {

                            var self = PARENT(this, 3), prev = PREV(self, 1), 
                                prevsearch = prev, subl,
                                prevlevel = GET_ATTR(self, 'data-level');

                            if (prev) {

                                // detect parent
                                issub = prevsearch.classList.contains('sub'), 
                                subh = false;

                                while (!subh && prevsearch) {
                                    issub = prevsearch.classList.contains('sub')

                                    if (!issub && prevsearch.nodeName === 'H3') {
                                        subh = prevsearch;
                                        subi = QUERY('input', prevsearch);
                                        if (subi) {
                                            subi.checked = false;
                                        }
                                        break;
                                    } else if (issub) {
                                        subl = GET_ATTR(prevsearch, 'data-level');
                                        if (!prevlevel || (subl && parseInt(subl) < parseInt(prevlevel))) {
                                            subi = QUERY('input', prevsearch);
                                            if (subi) {
                                                subi.checked = false;
                                            }
                                        }

                                        if (!prevlevel) {
                                            prevlevel = subl;
                                        }
                                        
                                    }
                                    prevsearch = PREV(prevsearch, 1);
                                }
                            }
                        }*/

                    } else {
                        
                        var options = QUERY('.option input, h3 .toggle input', options_container, true);
                        for (var i = 0, l = options.length; i < l; i++) {
                            options[i].checked = checked;
                        }
                    }
                }, QUERY('.toggle input', options_container, true));

                /*ADD_EVENT('click', function(e) {
                    var checked = this.checked;

                    var prev = PREV(PARENT(this), 1), 
                        prevsearch = prev,subl, subi,
                        prevlevel;

                    if (prev) {

                        // detect parent
                        issub = prevsearch.classList.contains('sub'), 
                        subh = false;

                        while (!subh && prevsearch) {
                            issub = prevsearch.classList.contains('sub')

                            if (!issub && prevsearch.nodeName === 'H3') {
                                subh = prevsearch;
                                subi = QUERY('input', prevsearch);
                                if (subi) {
                                    subi.checked = false;
                                }
                                break;
                            } else if (issub) {
                                subl = GET_ATTR(prevsearch, 'data-level');
                                if (!prevlevel || (subl && parseInt(subl) < parseInt(prevlevel))) {
                                    subi = QUERY('input', prevsearch);
                                    if (subi) {
                                        subi.checked = false;
                                    }
                                }

                                if (!prevlevel) {
                                    prevlevel = subl;
                                }
                                
                            }
                            prevsearch = PREV(prevsearch, 1);
                        }
                    }
                }, QUERY('.option input', options_container, true));*/


                if (QUERY('h3 input', options_container)) {

                    ADD_EVENT('click', function(e) {
                        if (PARENT(e.target).nodeName === 'H3') {
                            var input = QUERY('input', this);
                            if (input) {
                                e.stopPropagation();
                                input.click();
                            }
                        }
                    }, QUERY('h3', options_container, true));
                }

                function confirm_select() {

                    var selected = [];

                    var options = QUERY('.option input', options_container, true);
                    for (var i = 0, l = options.length; i < l; i++) {
                        if (options[i].checked) {
                            selected.push(options[i].name.toString());
                        }
                    }

                    options = QUERY('h3 .toggle input', options_container, true);
                    for (var i = 0, l = options.length; i < l; i++) {
                        if (options[i].checked) {
                            selected.push(options[i].name.toString());
                        }
                    }

                    SAVE_FILTER_CONFIG(menu_key, selected);

                    UPDATE_MULTI_SELECT(menu_key, menu, selected);

                    if (on_select){
                        on_select(selected);
                    }

                    CLOSE_MULTI_SELECT();

                    APPLY_FILTERS(false, false, true);
                }

                // select
                ADD_EVENT('click', function(e) {
                    confirm_select();
                }, selectbutton);

                // enter key
                ADD_EVENT('keypress', function(e) {

                    if (e.keyCode == 13) {
                        confirm_select();
                    }

                }, [selectbutton, options_container]);

                // search
                var search_timeout;

                var show_parents = function(parent) {
                    for (var _i = 0, _l = optgroups.length; _i < _l; _i++) {
                        _og = optgroups[_i];
                        if (_og[1] === parent) {
                            SHOW(_og.el);

                            if (_og[4]) {
                                show_parents(_og[4][0]);
                            }
                        }
                    }
                }

                ADD_EVENT(['keypress', 'input', 'change'], function(e) {
                    var _that = this;
                    if (search_timeout) {
                        clearTimeout(search_timeout);
                    }

                    search_timeout = setTimeout(function() {
                        search_timeout = 0;

                        var search_regex = new RegExp(_that.value, "i");

                        var search_param;
                        var options = QUERY('.option', options_container, true);

                        requestAnimationFrame(function() {

                            var og_visible = [];

                            for (var oi = 0, og, ogv, _ogv, ol = optgroups.length; oi < ol; oi++) {
                                og = optgroups[oi];
                                ogv = false;
                                _ogv = false;
                                if (
                                    search_regex.test(og[1]) // slug
                                    || search_regex.test(og[2]) // name
                                    || (og[6] && search_regex.test(og[6])) // search
                                ) {
                                    ogv = true;
                                    og_visible.push(og[1]);
                                }

                                if (og[4] && og_visible.indexOf(og[4][0]) !== -1) {
                                    ogv = true;
                                }

                                for (var i = 0, visible, opt, l = og[0].length; i < l; i++) {
                                    opt = og[0][i];

                                    if (ogv) {
                                        SHOW(opt.el);
                                    } else {

                                        visible = (
                                            search_regex.test(opt[0])
                                            || search_regex.test(opt[1])
                                            || (opt[3] && search_regex.test(opt[3]))
                                        );
                                        SHOW(opt.el, !visible);

                                        if (visible) {
                                            _ogv = true;
                                        }
                                    }
                                }
                                if (_ogv) {
                                    ogv = _ogv;
                                }

                                if (ogv && og[4]) {
                                    show_parents(og[4][0]);
                                }

                                if (og.el) {
                                    if (!ogv && (
                                        search_regex.test(og[1])
                                        || search_regex.test(og[2])
                                    )) {
                                        SHOW(og.el);
                                    } else {
                                        SHOW(og.el, !ogv);
                                    }
                                }
                            }

                            /*for (var i = 0, l = options.length; i < l; i++) {
                                if (!value) {
                                    SHOW(options[i])
                                } else {
                                    search_param = GET_ATTR(options[i], 'data-search');
                                    SHOW(options[i], !(search_param.toLowerCase().indexOf(value) !== -1));
                                }
                            }*/
                        });

                    });

                }, search);

                ADD_EVENT(['click', 'keydown'], function(e) {
                    var _that = this;

                    if (e.type === 'click') {
                        if (e.target.classList.contains('option')) {
                            var i = QUERY('input', e.target);
                            i.checked = !i.checked;
                        }
                    }
                    
                    if (e.type === 'keydown' && e.keyCode === 32) {

                        if (document.activeElement && document.activeElement.classList.contains('option')) {
                            e.preventDefault();
                            var i = QUERY('input', document.activeElement);
                            i.checked = !i.checked;
                        }

                    }

                }, options_container);
            });

            if (groupfocus) {
                QUERY('h3[rel="'+groupfocus+'"]', MULTI_SELECT).scrollIntoView();
            } else {
                if (GET_ATTR(MULTI_SELECT_MENU, 'data-focus') === '0') {

                } else {
                    search.focus();
                }

            }

            if (after_render) {
                after_render(MULTI_SELECT);
            }
        });

    }

    var MULTI_SELECT_OPTION_ELEMENT, MULTI_SELECT_OPTION_INPUT, MULTI_SELECT_OPTION_LABEL;

    function MULTI_SELECT_OPTION(menu_key, id, text, selected, emoji, tabindex) {
        if (!MULTI_SELECT_OPTION_ELEMENT) {
            
            MULTI_SELECT_OPTION_ELEMENT = CLONE_ELEMENT(DIV, {
                "class": "option"
            });

            MULTI_SELECT_OPTION_INPUT = CREATE_ELEMENT('input', {
                "type": "checkbox",
                "tabindex": "-1"
            });

            MULTI_SELECT_OPTION_LABEL = CREATE_ELEMENT('label', null, [CLONE_ELEMENT(SPAN, {
                "class": "cb"
            })]);
        }

        var label = CLONE_ELEMENT(MULTI_SELECT_OPTION_LABEL, {
            for: menu_key + '_' + id
        });
        APPEND_CHILD(label, CLONE_ELEMENT(SPAN, 0, TEXT(text)));

        if (emoji) {
            APPEND_CHILD(label, emoji);
        }

        var cb = CLONE_ELEMENT(MULTI_SELECT_OPTION_INPUT, {
            id: menu_key + '_' + id,
            name: id
        });
        if (selected) {
            cb.checked = true;
        }

        return CLONE_ELEMENT(MULTI_SELECT_OPTION_ELEMENT, (tabindex) ? { "tabindex" : "0" } : 0, [cb, label]);
    }

    var save_timeout;
    var EU_COUNTRIES;
    var NEW_FILTERS_APPLIED = true;

    function SAVE_FILTER_CONFIG(key, config, no_track_ga, no_filter_reset, no_storage) {
  
        NEW_FILTERS_APPLIED = false;

        FILTER_CONFIG[key] = config;
        if (IS_ARRAY(config) && !config.length) {
            delete FILTER_CONFIG[key];
        } else if (!IS_ARRAY(config) && !config) {
            delete FILTER_CONFIG[key];
        }

        if (save_timeout) {
            clearTimeout(save_timeout);
        }

        var data = config;

        config = JSON.stringify(FILTER_CONFIG);

        INIT_FILTER_HASH();

        if (no_storage) {
            return;
        } 

        save_timeout = setTimeout(function() {
            save_timeout = false;

            try {
                localStorage.setItem('search-filters', config);
            } catch (e) {
                console.error(e);
            }

            if (!no_filter_reset) {
                TOGGLE_FILTER_RESET();
            }

            // @todo ga
            /*if (!no_track_ga) {
                if (config !== '{}' && data) {
                    if (IS_ARRAY(data)) {
                        ga('send', 'event', 'filter-' + key, ((data.length > 5) ? '+5' : data.join(',')));
                    } else {
                        try {
                            ga('send', 'event', 'filter-' + key, data.toString());
                        } catch (e) {

                        }
                    }
                }
            }*/
        });
    }

    // site country
    var CANONICAL = QUERY('link[rel="canonical"]');
    var CONTENT_LG = QUERY('meta[http-equiv="content-language"]');
    var SITE_COUNTRY = GET_ATTR(CONTENT_LG, 'data-c');
    var SITE_LG = (GET_ATTR(CONTENT_LG, 'data-gt') || SITE_COUNTRY).toLowerCase();

    var FILTER_RESET_SETUP;
    var HASH_LINK_DOMAIN, HASH_LINK_URL, HASH_LINK_PATH;
    if (!HASH_LINK_URL) {
        var hlink =  CLONE_ELEMENT(A, {
            "href": GET_ATTR(CANONICAL,'data-index')
        });
        HASH_LINK_PATH = hlink.pathname;
        if (HASH_LINK_PATH.substr(-1) !== '/') {
            HASH_LINK_PATH += '/';
        }
        HASH_LINK_URL = 'https://' + hlink.hostname + HASH_LINK_PATH;
        
        HASH_LINK_DOMAIN = hlink.hostname.replace(/^www\./,'') + HASH_LINK_PATH;
    }

    function TOGGLE_FILTER_RESET() {

        if (!FILTER_HASH) {
            FILTER_HASH = JSON.stringify(FILTER_CONFIG);
        }

        if (RESET_BUTTON) {
            var active;
            var hash;
            if (FILTER_HASH !== '{}') {
                active = 1;
            }

            if (!FILTERS) {
                FILTERS = QUERY('.searchbox');    
            }

            if (!FILTERS_RESET) {
                FILTERS_RESET = QUERY('.searchbox_reset');;
            }
     
            if (FILTERS) {
                if (active) {
                    FILTERS.classList.add('active');

                    var rlink = QUERY('a.lnk', FILTERS_RESET);
                    if (rlink) {
                        LOAD_INDEX_JSON(function() {
                        
                            var hlink;

                            var fkeys = Object.keys(FILTER_CONFIG), fklen = fkeys.length, regionslug = '';

                            if (!FILTER_RESET_SETUP) {
                                FILTER_RESET_SETUP = true;

                                ADD_EVENT('click', function(e) {
                                    e.preventDefault();

                                    var node = this;
                                    var hlink = GET_ATTR(node,'data-u');
                                    EMPTY_HTML(rlink);
                                    APPEND_CHILD(rlink, TEXT(hlink));

                                    // @todo analytics
                                    //ga('send', 'event', 'filter-copy-url', GET_ATTR(node,'data-f'));

                                    try {
                                         if (BODY.createTextRange) {
                                            var range = BODY.createTextRange();
                                            range.moveToElementText(node);
                                            range.select();
                                        } else if (window.getSelection) {
                                            var selection = window.getSelection();
                                            var range = document.createRange();
                                            range.selectNodeContents(node);
                                            selection.removeAllRanges();
                                            selection.addRange(range);
                                        }
                                    } catch(e) {}
                                }, rlink);

                                ADD_EVENT('blur', function(e) {
                                    e.preventDefault();

                                    var node = this;
                                    var hlink = GET_ATTR(node,'data-f');
                                    EMPTY_HTML(rlink);
                                    APPEND_CHILD(rlink, [TEXT(HASH_LINK_DOMAIN), CLONE_ELEMENT(SPAN, {}, TEXT(hlink))]);

                                }, rlink);
                            }

                            if (PUSH_SUPPORT && fklen > 1 && fkeys.indexOf('regions') !== -1 && FILTER_CONFIG.regions.length === 1 && FILTER_CONFIG.regions[0] !== 'int') {

                                var slughash, page_slug;
                                var regions = FILTER_CONFIG.regions.filter(function(value, index, self) {
                                    return self.indexOf(value) === index;
                                });

                                // slug
                                regionslug = regions[0] + '/';
                                fklen--;
                                fkeys = fkeys.filter(function(value, index, self) {
                                    return value !== 'regions';
                                });
                            }

                            if (!regionslug && fklen === 1 && fkeys[0] === 'regions') {

                                var slughash, page_slug;
                                var regions = FILTER_CONFIG.regions.filter(function(value, index, self) {
                                    return self.indexOf(value) === index;
                                });

                                if (regions[0] === 'int') {
                                    hlink = '#🌐';
                                } else {

                                    // slug
                                    if (PUSH_SUPPORT && regions.length === 1) {
                                        slughash = regions[0];
                                    }
                              
                                    if (slughash) {
                                        hlink = slughash + '/';
                                    } else {
                                        hash = FILTER_CONFIG.regions.join(',');
                                        hlink = '#🌐' + hash;
                                    }
                                }
                                
                            } else if (fklen === 1 && fkeys[0] === 'tags') {

                                var slughash, page_slug;
                                var tags = FILTER_CONFIG.tags.filter(function(value, index, self) {
                                    return self.indexOf(value) === index;
                                });

                                // slug
                                if (PUSH_SUPPORT && tags.length === 1) {
                                    slughash = tags[0];
                                }
                          
                                if (slughash) {
                                    if (slughash === 'gmo') {
                                        hlink = '';
                                    } else {
                                        hlink = slughash + '/';
                                    }
                                } else {
                                    hash = FILTER_CONFIG.tags.join(',');
                                    hlink = '#🏷️' + hash;
                                }
                                
                            } else /*if (fklen === 1 && fkeys[0] === 'features') {

                                

                            } else */ if (fklen === 1 && fkeys[0] === 'query') {

                                hlink = '#🔍' + encodeURIComponent(FILTER_CONFIG.query);

                            } else if (
                                fklen === 1 &&
                                ['animals', 'environment'].indexOf(fkeys[0]) !== -1
                            ) {

                                var slughash, page_slug, animal, i;
                                var animals = FILTER_CONFIG[fkeys[0]].filter(function(value, index, self) {
                                    return self.indexOf(value) === index;
                                });

                                var filterdata = FILTERDATA[fkeys[0]];

                                // slug
                                if (PUSH_SUPPORT && filterdata && animals.length === 1) {
                                    i = FILTERDATA_KEYINDEX[fkeys[0]][animals[0]];
                                    if (i) {
                                        animal = (filterdata[i[0]]) ? filterdata[i[0]][i[1]] : false;
                                        if (animal) {
                                            slughash = (animal[5]) ? animal[5] : animal[1];
                                        }
                                    }
                                }
                          
                                if (slughash) {
                                    hlink = slughash + '/';
                                } else {

                                    var hash_prefix;
                                    if (fkeys[0] === 'animals') {
                                        hash_prefix = '🐾';
                                    } else if (fkeys[0] === 'environment') {
                                        hash_prefix = '♻️';
                                    }

                                    hash = animals.join(',');
                                    hlink = '#' + hash_prefix + hash;
                                }

                            } else  {

                                var filter_hash = FILTER_HASH;
                                
                                if (filter_hash !== '{}') {
                                    hash = window.btoa(filter_hash);
                                    hlink = '#💚' + hash;
                                }
                            }

                            if (hlink) {

                                SET_ATTRS(rlink,{
                                    "href": HASH_LINK_URL + regionslug + hlink,
                                    "data-u": HASH_LINK_URL + regionslug + hlink,
                                    "data-f": hlink
                                });
                                EMPTY_HTML(rlink);

                                if (PUSH_SUPPORT) {
                                    history.replaceState('', document.title, HASH_LINK_PATH + regionslug + hlink);
                                } else {
                                    document.location.hash = HASH_LINK_PATH + hlink;
                                }

                                APPEND_CHILD(rlink, [TEXT(HASH_LINK_DOMAIN), CLONE_ELEMENT(SPAN, {}, TEXT(regionslug + hlink))]);
                            } else {
                                RESET_HASH();

                                alert(1)
                               
                                FILTERS.classList.remove('active');
                            }
                        });
                    }

                } else {
                    RESET_HASH();
                    FILTERS.classList.remove('active');
                }
            }
        }
    }

    function RESET_HASH() {

        if (PUSH_SUPPORT) {
            history.replaceState('', document.title, HASH_LINK_PATH);
        } else {
            var loc = CLONE_ELEMENT(A, {
                "href": document.location.href
            });
            if (loc.pathname !== HASH_LINK_PATH) {
                document.location.replace(HASH_LINK_PATH);
            } else {
                document.location.hash = '';
            }
        }
    }

    function RESET_FILTERS(notoggle) {

        var mm = ['regions', 'tags', 'animals', 'environment', 'features', 'jobs'];
        mm.forEach(function(key) {
            SAVE_FILTER_CONFIG(key, false, true, true, true);
            UPDATE_MULTI_SELECT(key, QUERY('.multi-input[data-name="'+key+'"]', FILTERS), []);
        });

        SAVE_FILTER_CONFIG('query', false, true, true, true);
        SEARCH_FIELD.value = '';
        SEARCH_FIELD_BUTTON.classList.remove('active');

        FILTER_HASH = JSON.stringify({});
        FILTER_CONFIG = {};
        LOCATION_HASH = '';

        if (localStorage) {
            try {
                localStorage.clear();
            } catch (e) {

            }
        }

        if (!notoggle) {
            TOGGLE_FILTER_RESET();
        }
    }

    var filter_config;
    var animals, animals_key, ga_key;

    try {
        var loc = CLONE_ELEMENT(A, {
            "href": document.location.href
        });
        if (loc.pathname !== HASH_LINK_PATH) {
            var slugpath = loc.pathname.replace(new RegExp("^" + HASH_LINK_PATH), "").split('/');
            var tagtype = GET_ATTR(CANONICAL, 'data-t');
            if (tagtype && slugpath.length) {
                var tags = [];
                for (var i = 0, p; i < slugpath.length; i++) {
                    p = slugpath[i].trim();
                    if (p) {
                        tags.push(p);
                    }
                }

                // invalid @todo
                filter_config = {};
                var region;

                if (tags.length > 1 || ['country','continent'].indexOf(tagtype) !== -1) {
                    region = tags.shift();
                    filter_config['regions'] = [region];
                    ga_key = 'path:'+fkey;
                }
                if (tags.length) {
                    if (['animal', 'environment'].indexOf(tagtype) !== -1) {
                        animals_key = (tagtype === 'animal') ? 'animals' : 'environment';
                        filter_config[animals_key] = tags;
                        ga_key = (ga_key) ? animals_key : 'path:'+animals_key;
                    } else {
                        filter_config['tags'] = tags;
                        ga_key = (ga_key) ? 'tags' : 'path:'+fkey;
                    }
                }
            }

        }

        // filter hash
        if (LOCATION_HASH) {

            LOCATION_HASH = decodeURI(LOCATION_HASH);

            var animal_hash_regex = /^\#(🐾|♻️)/;
            var cc_regex = /^\#🌐/;
            var hash_regex = /^\#💚/;
            var search_regex = /^\#🔍/;
            var label_regex = /^\#🏷️/;

            ADD_EVENT('hashchange', function(e) {
                var query = decodeURI(document.location.hash).replace(search_regex,'');

                RESET_FILTERS(true);
                SAVE_FILTER_CONFIG('query', query);
                SEARCH_FIELD.value = query;

                APPLY_FILTERS(false, false, true);
            }, window);

            ga_key = 'hash',
                cc_match = cc_regex.test(LOCATION_HASH);
            if (cc_match || label_regex.test(LOCATION_HASH)) {
                var fkey = (cc_match) ? 'regions' : 'tags';
                var regions = LOCATION_HASH.replace(cc_match ? cc_regex : label_regex,'').split(',');
                if (cc_match && !regions.length) {
                    regions = ['int'];
                }

                filter_config = (filter_config) ? filter_config : {};
                filter_config[fkey] = regions;
                ga_key = 'hash:'+fkey;
            } else if (search_regex.test(LOCATION_HASH)) {
                filter_config = Object.assign((filter_config) ? filter_config : {}, {
                    "query": LOCATION_HASH.replace(search_regex,'')
                });
            } else if (hash_regex.test(LOCATION_HASH)) {
                filter_config = Object.assign((filter_config) ? filter_config : {}, 
                    JSON.parse(window.atob(LOCATION_HASH.replace(hash_regex,'')))
                );
            } else if (animal_hash_regex.test(LOCATION_HASH)) {

                var m = LOCATION_HASH.match(animal_hash_regex);
                animals = LOCATION_HASH.replace(animal_hash_regex,'');

                if (m[1] === '🐾') {
                    animals_key = 'animals';
                } else if (m[1] === '♻️') {
                    animals_key = 'environment';
                }

                filter_config = (filter_config) ? filter_config : {};
                filter_config[animals_key] = animals.split(',');
                ga_key = 'filter:' + animals_key;
            }
        }

        if (filter_config) {

            LOAD_INDEX_JSON(function() {

                // @todo: analytics
                setTimeout(function(ga_key, hash) {
                    //ga('send', 'event', ga_key, hash);
                }, 1000, ga_key, LOCATION_HASH);

                LOCATION_HASH = '';
                localStorage.setItem('search-filters', JSON.stringify(filter_config));

                TOGGLE_FILTER_RESET();
            });
            
        }
    } catch(e) {

    }

    if (!filter_config) {
        try {
            // localstorage
            filter_config = JSON.parse(localStorage.getItem('search-filters'));
        } catch (e) {

        }
    }

    if (filter_config && typeof filter_config === 'object') {
        FILTER_CONFIG = filter_config;
    }

    if (FILTER_CONFIG) {
        INIT_FILTER_HASH();
    }

    var ORGS, FETCHING_ORGS, COUNTRIES, CONTINENTS, TAGS, TAGS_DISPLAY;
    var SITE_COUNTRY,
        CONTINENT_ORDER = [
            'north-america',
            'europe',
            'south-america',
            'asia',
            'australia',
            'africa',
            'antarctica'
        ];
    var ORGS_ROWS = [];
    var ORGS_ROWS_ADDED = [];
    var ORGS_INDEX;
    var ORGS_INDEX_DATA;
    var ORGS_INDEX_LOADED;
    var ORGS_ROW, ORGS_INFO_SEP, ORGS_FEATURE;

    var ORGS_LOADED;

    var LOAD_STATUS = {};
    var LOAD_QUEUE = {};

    function MULTI_LOAD_JS_INDEX(refs, callback) {
        var refkeys = Object.keys(refs);

        var resolve = function(key, data) {
            done++;
            results[key] = data;
            if (done === todo && callback) {
                callback(results);
            }
        };

        var todo = refkeys.length;
        var done = 0;
        var results = {};
        var refkey;
        for (var i = 0; i < todo; i++) {
            (function(refkey) {
                if (refkey === 'countries') {
                    LOAD_COUNTRIES(function(data) {
                        resolve(refkey, data);
                    })
                } else {
                    LOAD_JS_INDEX(refs[refkey], refkey, function(data) {
                        resolve(refkey, data);
                    });
                }
            })(refkeys[i]);
        }
    }

    function TAG_EMOJI_EL(emoji, el) {
        el = CLONE_ELEMENT(SPAN_EMOJI);
        el.innerHTML = emoji;
        return el;
    }

    function LOAD_INDEX_JSON(callback) {
        if (FETCHING_ORGS) {
            if (FETCHING_ORGS === true) {
                FETCHING_ORGS = [];
            }
            FETCHING_ORGS.push(callback);
        }
        if (!ORGS) {
            FETCHING_ORGS = true;

            FETCH_JSON('/org.json', 'index', 'index')
                .then(function(json, fields, f, fcb, emoji, el) {
                    f = (IS_ARRAY(FETCHING_ORGS)) ? FETCHING_ORGS.slice(0) : false;
                    FETCHING_ORGS = false;

                    ORGS = [];

                    TAGS = json[1];
                    fields = json[4];
                    LANGUAGEINFO = json[5];

                    for (var tag in TAGS) {
                        if (TAGS.hasOwnProperty(tag)) {
                            tagrow = TAGS[tag];
                            if (!IS_ARRAY(tagrow)) {
                                TAGS[tag] = [tagrow];
                                tagrow = TAGS[tag];
                            }
                            if (!TAGS[tag][0]) {
                                TAGS[tag][0] = tag;
                            }
                            if (tagrow[1] && IS_ARRAY(tagrow[1])) {
                                TAGS[tag][5] = tagrow[1][1];
                                TAGS[tag][1] = tagrow[1][0];
                            } else {
                                TAGS[tag][1] = TAGS[tag][5] = TAGS[tag][1] || tag;
                            }

                            // emoji
                            if (tagrow[2]) {
                                TAGS[tag][2] = TAG_EMOJI_EL(tagrow[2]);
                            }
                        }
                    }

                    // countries
                    COUNTRIES = {};
                    CONTINENTS = {};

                    var continent, country, groups, children;
                    var rowfilters = ['animals', 'environment'];
                    var lglinkfields = ['website', 'donate', 'volunteer', 'jobs', 'science', 'internship'];

                    for (var cc in json[2]) {
                        if (json[2].hasOwnProperty(cc)) {
                            continent = json[2][cc];
                            for (var _cc in continent[0]) {
                                if (continent[0].hasOwnProperty(_cc)) {
                                    continent[0][_cc].continent = cc;
                                    COUNTRIES[_cc] = continent[0][_cc];

                                    if (COUNTRIES[_cc][1]) {
                                        COUNTRIES[_cc][1] = TAG_EMOJI_EL(COUNTRIES[_cc][1]);
                                    }
                                }
                            }
                            CONTINENTS[cc] = continent.slice(0);
                            CONTINENTS[cc].shift();
                            
                            if (CONTINENTS[cc][1]) {
                                CONTINENTS[cc][1] = TAG_EMOJI_EL(CONTINENTS[cc][1]);
                            }
                        }
                    }

                    function parse_children(key, parent, groups) {
                        FILTERDATA[key][1].forEach(function(entry) {
                            if (entry[3] === parent) {
                                groups.push(entry[1]);
                                groups = parse_children(key, entry[1], groups);
                            }
                        });
                        return groups;
                    }

                    // filters
                    ['animals', 'environment',  'jobs', 'features'].forEach(function(key) {
                        FILTERDATA[key] = json[3][key];
                        FILTERDATA_KEYINDEX[key] = {};
                        for (var k = 0; k <= 1; k++) {
                            if (FILTERDATA[key][k]) {
                                for (var i = 0, slug, f; i < FILTERDATA[key][k].length; i++) {
                                    f = FILTERDATA[key][k][i];

                                    if (f[2]) {
                                        FILTERDATA[key][k][i][2] = f[2] = TAG_EMOJI_EL(f[2]);
                                    }

                                    slug = f[1];
                                    if (!FILTERDATA_KEYINDEX[key][slug]) {
                                        FILTERDATA_KEYINDEX[key][slug] = [k,i];

                                        if (k === 1) {
                                            children = [];
                                            groups = parse_children(key, slug, []);
                                            groups.forEach(function(group) {
                                                children.push(group);
                                                FILTERDATA[key][0].forEach(function(entry) {
                                                    if (entry[3] === group) {
                                                        children.push(entry[1]);
                                                    }
                                                });
                                            });
                                            FILTERDATA_KEYINDEX[key][slug][2] = children;
                                        }
                                    }

                                    if (rowfilters.indexOf(key) !== -1) {
                                        TAGS[slug] = [
                                            slug,
                                            f[0],
                                            f[2],//(f[2]) ? TAG_EMOJI_EL(f[2]) : null,
                                            (k === 1) ? [key] : key,
                                            f[4],
                                            f[0]
                                        ];
                                    }
                                }
                            }
                        }
                    });

                    for (var i = 0, org, search, continent, l = json[0].length; i < l; i++) {
                        org = {};
                        for (var y = 0, yl = fields.length; y < yl; y++) {
                            org[fields[y]] = json[0][i][y];
                        }

                        if (IS_ARRAY(org.title)) {
                            org.title_lg = org.title[1];
                            org.title = org.title[0];
                        }

                        search = [org.search, org.title, org.description];
                        if (org.title_lg) {
                            search.push(org.title_lg);
                        }

                        lglinkfields.forEach(function(t) {
                            if (org[t] && IS_ARRAY(org[t])) {
                                org[t+'_lg'] = org[t][1];
                                org[t] = org[t][0];
                            }
                        });

                        if (org.website) {
                            search.push(org.website);
                        }
                        if (org.primary_address) {
                            search.push(org.primary_address[0], org.primary_address[1]);
                        }

                        org.tagindex = {};
                        if (org.tags_search) {
                            org.tags_search.forEach(function(tag) {
                                org.tagindex[tag] = 1;
                                search.push(tag);
                                if (TAGS[tag]) {
                                    search.push(TAGS[tag][1]);
                                    search.push(TAGS[tag][4]);
                                }
                            });
                        } else {
                            org.tags_search = [];
                        }
                        if (org.tags) {
                            org.tags.forEach(function(tag) {
                                org.tagindex[tag] = 1;
                                org.tags_search.push(tag);
                                search.push(tag);
                                if (TAGS[tag]) {
                                    search.push(TAGS[tag][1]);
                                    search.push(TAGS[tag][4]);
                                }
                            });
                        }
                        org.search = search.join(',');

                        if (org.social) {
                            search = {};
                            for (var social in org.social) {
                                if (org.social.hasOwnProperty(social)) {
                                    search[social] = 1;
                                    SOCIAL_SEARCH[social] = 1;
                                }
                            }
                            org.social_search = search;
                        } else {
                            org.social_search = {};
                        }

                        if (org.regions) {
                            org.regionindex = {};
                            org.continentindex = {};
                            org.regions.forEach(function(cc) {
                                org.regionindex[cc] = 1;

                                continent = (COUNTRIES[cc]) ? COUNTRIES[cc].continent : false;
                                if (continent) {
                                    org.continentindex[continent] = 1;
                                }

                            });
                        }

                        ORGS.push(org);
                    }

                    callback();

                    if (f) {
                        while (fcb = f.shift()) {
                            fcb();
                        }
                    }
            });
        } else {
            callback();
        }
    }

    /*function LOAD_FILTER_JSON(key, callback, keys) {

        if (IS_ARRAY(key)) {
            keys = key;
            var fn = [];
            keys.forEach(function(key) {
                fn.push(new Promise(function(resolve,reject) {
                    LOAD_FILTER_JSON(key, resolve);
                }));
            });

            return Promise.all(fn).then(callback);
        }

        if (key === 'tags') {
            LOAD_INDEX_JSON(callback);
        } else {

            if (!FILTERDATA[key]) {
                FETCH_JSON('/filter-' + key + '.json', key, 'f:' + key)
                    .then(function(json) {
                        FILTERDATA[key] = json;

                        if (['animals', 'environment',  'jobs', 'features'].indexOf(key) !== -1) {
                            FILTERDATA_KEYINDEX[key] = {};
                            for (var k = 0; k <= 1; k++) {
                                if (json[k]) {
                                    for (var i = 0, slug; i < json[k].length; i++) {
                                        slug = json[k][i][1];
                                        if (!FILTERDATA_KEYINDEX[key][slug]) {
                                            FILTERDATA_KEYINDEX[key][slug] = k;
                                        }
                                    }
                                }
                            }
                        }

                        /*if (key === 'regions') {

                            // countries
                            COUNTRIES = {};
                            CONTINENTS = {};

                            var continent, country;
                            for (var cc in json) {
                                if (json.hasOwnProperty(cc)) {
                                    continent = json[cc];
                                    for (var _cc in continent[0]) {
                                        if (continent[0].hasOwnProperty(_cc)) {
                                            continent[0][_cc].continent = cc;
                                            COUNTRIES[_cc] = continent[0][_cc];
                                        }
                                    }

                                    CONTINENTS[cc] = continent.slice(0);
                                    CONTINENTS[cc].shift();
                                }
                            }
                        }* 

                        callback(FILTERDATA[key]);
                    });
            } else {
                callback(FILTERDATA[key]);
            }
        }
    }*/

    function LOAD_JS_INDEX(file, ref, callback, status) {
        status = (file in LOAD_STATUS) ? LOAD_STATUS[file] : 0;

        if (status === 0 || status === 1) {

            if (!(file in LOAD_QUEUE)) {
                LOAD_QUEUE[file] = [];
            }

            LOAD_QUEUE[file].push(callback);
        }

        if (status === 2) {
            callback(window[ref]);
        } else {
            if (!status) {
                LOAD_STATUS[file] = 1;
                $async.js({
                    src: file,
                    cache: {
                        "type": "localstorage",
                        "update": {
                            "head": true,
                            "interval": 3600,

                            source: 'xhr',
                             xhr: {
                                headers: {
                                   "Cache-Control": "ache, must-revalidate, post-check=0, pre-check=0, max-age=0",
                                   "expires": "0",
                                   "pragma": "no-cache"
                                }
                             }
                        }
                    }
                }).then(function() {
                    LOAD_STATUS[file] = 2;

                    if (ref === 'filters') {
                        INDEX_FILTERS = window[ref];
                    }

                    var q;
                    if (file in LOAD_QUEUE) {
                        while (LOAD_QUEUE[file].length) {
                            q = LOAD_QUEUE[file].shift();
                            q(window[ref]);
                        }
                    }
                });
            }
        }

    }

    function PRELOAD(url, type) {
        APPEND_CHILD(document.head, CLONE_ELEMENT(REL_PRELOAD, {
            "href": url,
            "as": type
        }));
    }

    var FORMAT_TOKEN = '-^-';
    var UNKNOWN;
    var INDEX_FILTERS;

    var LANGUAGEINFO;
    var ORGS_ROW_IMG;
    var ORGS_ROW_INFO;
    var ORGS_ROW_TITLE_VIDEO;
    var ORGS_ROW_CONTACT;
    var ORGS_ROW_CONTACT_SOCIAL_MORE;
    var ORGS_ROW_STATE = {};
    var ORGS_OPTION_ITEM;
    var ORGS_SOCIAL = {};
    var ORGS_SOCIAL_TYPES = [
        'facebook', 'twitter', 'instagram', 'linkedin',
        'youtube', 'whatsapp', 'snapchat', 'messenger'
    ];
    var NORESULTS_ROW;

    var ORGS_LOADED;

    function LOAD_ORGS(callback, selection, selected_make) {

        if (ORGS_LOADED) {
            if (typeof callback === 'function') {
                requestIdleCallback(callback, 500);
            }
            return;
        }
        ORGS_LOADED = 1;

        if (!ORGS_ROW) {

            ORGS_ROW = CLONE_ELEMENT(DIV, {
                "class": "org"
            });

            ORGS_ROW_IMG = CLONE_ELEMENT(A, {
                "class": "img"
            }, CREATE_ELEMENT('img', {
                "width": 100,
                "alt": "",
                "loading":"lazy"
            }));

            ORGS_ROW_INFO = CLONE_ELEMENT(DIV, {
                "class": "info"
            }, [
                CLONE_ELEMENT(A, {
                    "class": "title"
                }),
                CLONE_ELEMENT(DIV, {
                    "class": "desc"
                }),
                CLONE_ELEMENT(DIV, {
                    "class": "foot"
                }, [
                    CLONE_ELEMENT(SPAN, {
                        "class": "regions"
                    }),
                    CLONE_ELEMENT(SPAN, {
                        "class": "tags"
                    }),
                    CLONE_ELEMENT(SPAN, {
                        "class": "options"
                    })
                ])
            ]);

            ORGS_ROW_TITLE_VIDEO = CLONE_ELEMENT(SPAN, {
                "class": "video"
            }, TEXT('🎬'));

            ORGS_ROW_CONTACT = CLONE_ELEMENT(DIV, {
                "class": "contact"
            }, [
                CLONE_ELEMENT(DIV, {
                    "class": "addr"
                },[
                    CLONE_ELEMENT(SPAN, {
                        "class": "city"
                    }),
                    CLONE_ELEMENT(SPAN, {
                        "class": "flag"
                    }),
                    CLONE_ELEMENT(DIV, {
                        "class": "offices"
                    },
                        [
                            CLONE_ELEMENT(A_EXT)
                        ]
                    )
                ]),
                CLONE_ELEMENT(DIV, {
                        "class": "phone"
                    },
                    [TEXT('📞'), CLONE_ELEMENT(A)]
                ),
                CLONE_ELEMENT(DIV, {
                        "class": "email"
                    },
                    [TEXT('📧'), CLONE_ELEMENT(A)]
                ),
                CLONE_ELEMENT(DIV, {
                        "class": "web"
                    },
                    [TEXT('🌐'), CLONE_ELEMENT(A_EXT)]
                ),
                CLONE_ELEMENT(DIV, {
                        "class": "social"
                    }
                )
            ]);

            var icons = CLONE_ELEMENT(DIV);
            icons.innerHTML = '<span>[</span><span>📞</span><span>📬</span><span>🌐</span><span>]</span>';
            ORGS_ROW_CONTACT_OPTIONS_BUTTON = CLONE_ELEMENT(SPAN, {
                "class": "open"
            }, CLONE_ELEMENT(A, false, Array.from(icons.children)));

            ORGS_ROW_CONTACT_SOCIAL_MORE = CLONE_ELEMENT(DIV, {
                "class": "more"
            }, CLONE_ELEMENT(A, false, TEXT(_i18n('social_more_offices'))));

            ORGS_SOCIAL.facebook = CLONE_ELEMENT(A_EXT, 0, CLONE_ELEMENT(I, {
                "class": "fa-brands fa-facebook"
            }));
            ORGS_SOCIAL.twitter = CLONE_ELEMENT(A_EXT, 0, CLONE_ELEMENT(I, {
                "class": "fa-brands fa-twitter"
            }));
            ORGS_SOCIAL.youtube = CLONE_ELEMENT(A_EXT, 0, CLONE_ELEMENT(I, {
                "class": "fa-brands fa-youtube"
            }));
            ORGS_SOCIAL.linkedin = CLONE_ELEMENT(A_EXT, 0, CLONE_ELEMENT(I, {
                "class": "fa-brands fa-linkedin"
            }));
            ORGS_SOCIAL.instagram = CLONE_ELEMENT(A_EXT, 0, CLONE_ELEMENT(I, {
                "class": "fa-brands fa-instagram"
            }));
            ORGS_SOCIAL.messenger = CLONE_ELEMENT(A_EXT, 0, CLONE_ELEMENT(I, {
                "class": "fa-brands fa-facebook-messenger"
            }));
            ORGS_SOCIAL.whatsapp = CLONE_ELEMENT(A_EXT, 0, CLONE_ELEMENT(I, {
                "class": "fa-brands fa-whatsapp"
            }));
            ORGS_SOCIAL.snapchat = CLONE_ELEMENT(A_EXT, 0, CLONE_ELEMENT(I, {
                "class": "fa-brands fa-snapchat"
            }));

        }

        ORGS_INDEX = QUERY('#orgindex');

        LOAD_INDEX_JSON(function() {

            var ORGS_ROWS_CONTAINER = CREATE_FRAGMENT();

            var row, org, link, bar;
            var count = 0, visible_count = 0, visible;
            for (var i = 0, l = ORGS.length; i < l; i++) {
                org = ORGS[i];
                row = CLONE_ELEMENT(ORGS_ROW, {
                    id: 'org-' + org.slug,
                    "data-i": i
                });

                count++;

                ORGS_ROWS.push(row);
                APPEND_CHILD(ORGS_ROWS_CONTAINER, row);

                if (FILTER_ORGS_ROW(row, selection)) {
                    visible_count++;
                }
            }

            requestAnimationFrame(function() {

                EMPTY_HTML(ORGS_INDEX);
                APPEND_CHILD(ORGS_INDEX, ORGS_ROWS_CONTAINER);

                ADD_EVENT('click', function(e) {

                    var el = e.target, c, cc;
                    if (el) {

                        var nodename = el.nodeName.toUpperCase();
                        if (nodename === 'SPAN' && el.classList.contains('e')) {
                            el = PARENT(el);
                            nodename = el.nodeName.toUpperCase()
                        }

                        if (nodename === 'A') {
                            c = PARENT(el).classList;
                            cc = ((c.contains('tags')) ? 1 : (c.contains('regions')) ? 2 : 0);

                            if (cc) {
                                e.preventDefault();
                                var tags, type, tag;
                                tag = GET_ATTR(el, 'rel');
                                tags = [tag];

                                if (cc === 1) {
                                    type = GET_ATTR(el, 'data-type') || 'tags';
                                } else/*if (c === 2)*/ {
                                    type = 'regions';
                                }
                                
                                //if (type !== 'tags') {
                                    //tags = SELECT_FILTERS_BY_KEY_OR_GROUP(type, tag);
                                //}

                                SAVE_FILTER_CONFIG(type, tags);
                                UPDATE_MULTI_SELECT(type, QUERY('.multi-input[data-name="'+type+'"]', FILTERS), tags);

                                APPLY_FILTERS();

                                FILTERS.scrollIntoView();
                            } else if (c.contains('web') || c.contains('options')) {
                                var lg = GET_ATTR(el, 'data-lg');
                                var cc = QUERY('.addr .country', (c.contains('web')) ? PARENT(el,2) : PARENT(el, 4));
                                if (cc) {
                                    cc = cc.innerHTML;
                                }
                                if (lg && lg.toLowerCase() !== SITE_LG) {
                                    e.preventDefault(true);
                                    WEBSITE_LANG_POPUP(el.href, lg, cc)
                                }
                            } else if (PARENT(el).classList.contains('open')) {
                                PARENT(el,3).classList.toggle('open');
                            }
                        } else if (el.nodeName === 'SPAN' && PARENT(el,2).classList.contains('open')) {
                            PARENT(el,4).classList.toggle('open');
                        }

                    }
                }, ORGS_INDEX);

                /*var mouseover_timeout;
                var mouseover_preload_done = {};
                ADD_EVENT('mouseover', function(e) {
                    if (mouseover_timeout) {
                        clearTimeout(mouseover_timeout);
                    }
                    var el = e.target;
                    mouseover_timeout = setTimeout(function() {
                        mouseover_timeout = false;

                        for (var i = 0; i < 5; i++) {
                            if (i > 0) {
                                el = PARENT(el);
                                if (!el) {
                                    break;
                                }
                            }
                            if (el && el.classList.contains('org')) {

                                if (el.id in mouseover_preload_done) {
                                    break;
                                }
                                mouseover_preload_done[el.id] = 1;

                                var href = QUERY('a.title', el).href;
                                if (href) {
                                    PRELOAD(href, 'document');
                                }
                                break;
                            }
                        }

                    }, 100);
                });*/

                requestAnimationFrame(function() {

                    var imgObserver = OBSERVER(function(entry, el) {
                            if (entry.isIntersecting) {
                                // hidden
                                if (el.id in ORGS_ROW_STATE && ORGS_ROW_STATE[el.id] === 0) {
                                    return false;
                                }

                                RENDER_ORGS_ROW(el);
                            }
                        }, 
                        {threshold: [0, 0.25, 0.5, 0.75, 1], rootMargin: '500px'},
                        QUERY('#orgindex .org', false, true)
                    );

                    requestIdleCallback(function() {

                        if (typeof callback === 'function') {
                            callback();
                        }
                    }, 500);
                });
            });


        });
    }

    function APPLY_FILTERS(selection, selected_id, noscroll) {

        NEW_FILTERS_APPLIED = true;

        var searchvalue = SEARCH_FIELD.value;
        SAVE_FILTER_CONFIG('query', searchvalue);
        if (searchvalue) {
            SEARCH_FIELD.value = searchvalue;
            SEARCH_FIELD_BUTTON.classList.add('active');
        } else {
            SEARCH_FIELD_BUTTON.classList.remove('active');
        }

        var selected_row;
        if (isNaN(selected_id)) {
            selected_id = false;
        }

        if (!ORGS_ROW) {
            LOAD_ORGS(APPLY_FILTERS);
            return;
        }

        if (!ORGS_INDEX) {
            ORGS_INDEX = QUERY('#orgindex');
        }

        var rows = QUERY('.org', ORGS_INDEX, true);

        requestAnimationFrame(function() {
            var first_visible, visible_count = 0;
            for (var i = 0, l = rows.length; i < l; i++) {
                if (FILTER_ORGS_ROW(rows[i], selection)) {
                    if (!first_visible) {
                        first_visible = rows[i];
                    }

                    if (selected_id !== false && selected_id === parseInt(GET_ATTR(rows[i], 'data-i'))) {
                        selected_row = rows[i];
                    }
                    visible_count++;
                }
            }

            if ((first_visible || selected_row) && !noscroll) {

                if (selected_row) {
                    selected_row.scrollIntoView();
                } else {
                   first_visible.scrollIntoView();
                }
            }

            if (visible_count === 0) {
                if (!NORESULTS_ROW) {
                    NORESULTS_ROW = CLONE_ELEMENT(DIV, {
                        "class": "nores"
                    }, [
                        CREATE_ELEMENT('h3', 0, _i18n('nores'))
                    ]);
                    ORGS_INDEX.insertBefore(NORESULTS_ROW, ORGS_INDEX.childNodes[0]);
                }
                SHOW(NORESULTS_ROW);

                //NORESULTS_ROW.scrollIntoView();

            } else if (NORESULTS_ROW) {
                HIDE(NORESULTS_ROW);
            }

            TOGGLE_FILTER_RESET();
        });
    }

    var APPLY_BUTTON = QUERY('#applyfilters', FILTERS);
    if (APPLY_BUTTON) {

        ADD_EVENT('click', function() {
            APPLY_FILTERS();

            // @todo
            //ga('send', 'event', 'filter-apply');

        }, APPLY_BUTTON);

        var reset_btns = [];

        var RESET_BUTTON = QUERY('#resetfilters', FILTERS);
        if (RESET_BUTTON) {
            reset_btns.push(RESET_BUTTON);
        }

        if (reset_btns.length) {
            ADD_EVENT('click', function(e) {
                e.preventDefault();

                RESET_FILTERS();

                APPLY_FILTERS(false, false, true);
            }, reset_btns);

            TOGGLE_FILTER_RESET();
        }
    }

    var SEARCH_REGEX, SEARCH_REGEX_Q;
    function FILTER_ORG(org) {
        var match, show = true;

        if (!FILTER_HASH) {
            INIT_FILTER_HASH();
        }

        // empty
        if (FILTER_HASH === '{}') {
            return true;
        }

        // search
        if (FILTER_CONFIG['query']) {
            if (SEARCH_REGEX_Q !== FILTER_CONFIG['query']) {
                SEARCH_REGEX_Q = FILTER_CONFIG['query'];
                SEARCH_REGEX = new RegExp(SEARCH_REGEX_Q,"i");
            }
            if (!SEARCH_REGEX.test(org.search)) {
                return false;
            }
        }

        // regions
        if (FILTER_CONFIG['regions'] && IS_ARRAY(FILTER_CONFIG['regions'])) {

            if (!org.regions) {
                return false;
            } else if (IS_ARRAY(org.regions)) {

                FILTER_CONFIG['regions'].forEach(function(region) {
                    if (!match) {
                        if (org.regionindex[region] || org.continentindex[region]) {
                            match = true;
                        }
                    }
                });

                if (!match) {
                    return false;
                }
            }
        }

        ['animals', 'environment'].forEach(function(key) {
            if (show && FILTER_CONFIG[key] && IS_ARRAY(FILTER_CONFIG[key])) {
                var match = false, k, i, c;

                FILTER_CONFIG[key].forEach(function(entry) {
                    if (!match) {
                        if (org.tagindex[entry]) {
                            match = true;
                            return;
                        }
                        k = FILTERDATA_KEYINDEX[key][entry];
                        if (k[0] === 1 && k[2]) {
                            k[2].forEach(function(fkey) {
                                if (!match && org.tagindex[fkey]) {
                                    match = true;
                                }
                            });
                        }
                    }
                }); 
                if (!match) {
                    show = false;
                }
            }
        });
        if (!show) {
            return false;
        }

        ['tags'].forEach(function(key) {
            if (show && FILTER_CONFIG[key] && IS_ARRAY(FILTER_CONFIG[key])) {
                var match = false;
                FILTER_CONFIG[key].forEach(function(entry) {
                    if (!match && org.tagindex[entry]) {
                        match = true;
                    }
                }); 
                if (!match) {
                    show = false;
                }
            }
        });
        if (!show) {
            return false;
        }

        // features
        ['features', 'jobs'].forEach(function(key) {
            if (show && FILTER_CONFIG[key] && IS_ARRAY(FILTER_CONFIG[key]) && FILTER_CONFIG[key].length) {

                var features = FILTER_CONFIG[key];
                match = true;
                features.forEach(function(feature) {
                   if (match) {
                        if (key === 'features' && SOCIAL_SEARCH[feature]) {
                            if (!org.social_search[feature]) {
                                match = false;
                            }
                        } else if (!org[feature]) {
                            match = false;
                        }
                    }
                });

                if (!match) {
                    show = false;
                }
            }
        });
        if (!show) {
            return false;
        }

        return show;
    }

    function PARSE_ORGS_ID(id) {
        return parseInt(id.replace(/^scooter/, ''));
    }

    var FILTER_CACHE = {};

    function FILTER_ORGS_ROW(row, selection) {
        var id = row.id;
        var id_num = PARSE_ORGS_ID(id);

        var show = true;

        if (selection) {
            show = (selection.indexOf(id_num) !== -1);
        } else {

            if (id in FILTER_CACHE && FILTER_CACHE[id] === FILTER_HASH) {
                show = FILTER_CACHE[id];
            } else {

                var org = ORGS[parseInt(GET_ATTR(row, 'data-i'))];
                show = FILTER_CACHE[id] = FILTER_ORG(org);
            }
        }

        SHOW(row, !show);

        return show;

    }

    var RENDERED = {};

    var FEATURE_ICONS = {
        "609": "🏍️", // moped
        "47": "🚚", // cargo
        "605": "🕰️", // oldtimer
        "620": "🚲", // pedals
        "632": "💧", // water cooled
        "709": "☀️", // solar panels
        "757": "🎨" // customizable
    };

    var FEATURE_MENU_ICON;

    var OPTION_URL_KEYS = ['donate', 'volunteer', 'jobs', 'science', 'internship'];

    function RENDER_ORGS_ROW(row) {

        var id = row.id;
        if (id in RENDERED) {
            return;
        }
        RENDERED[id] = 1;

        var org = ORGS[parseInt(GET_ATTR(row, 'data-i'))];

        var contents = CREATE_FRAGMENT();

        var img = CLONE_ELEMENT(ORGS_ROW_IMG);
        SET_ATTRS(img, {
            "href": "/@" + org.slug
        })

        var img_i = QUERY('img', img);
        img_i.src = window.webprw('/org/' + org.slug + '/' + org.logo, img_i);
        
        var info = CLONE_ELEMENT(ORGS_ROW_INFO);

        var link = QUERY('a.title', info);
        SET_ATTRS(link, {
            "href": "/@" + org.slug
        });
        var title = org.title;
        if (org.video) {
            title = [CLONE_ELEMENT(SPAN,0,org.title || ''), CLONE_ELEMENT(ORGS_ROW_TITLE_VIDEO)];
        }
        APPEND_CHILD(link, title);
        APPEND_CHILD(QUERY('.desc', info), org.description || '');

        var foot_features = QUERY('.foot .regions', info);
        if (org.regions) {
            for (var cc, country, i = 0; i < org.regions.length; i++) {
                cc = org.regions[i];
                country = (COUNTRIES[cc]) ? COUNTRIES[cc] : CONTINENTS[cc];
                if (country) {
                    APPEND_CHILD(foot_features, CLONE_ELEMENT(A, {
                        href: HASH_LINK_URL +  ((cc === 'int') ? '#🌐' : cc + '/'),
                        class: (cc === 'int') ? 'int' : '',
                        rel: cc,
                        title: country[0]
                    }, (country[1]) ? CLONE_ELEMENT(country[1]) : 0));
                }
            }
        } else {
            HIDE(foot_features);
        }

        foot_features = QUERY('.foot .tags', info);
        if (org.tags) {

            tags_printed = 0;
            for (var tag, taginfo, tagsrc, a, k, tagslug, tagname, i = 0, taglen = org.tags.length; i < taglen; i++) {
                
                tag = org.tags[i];
                taginfo = TAGS[tag];

                a = false;

                if (taginfo) {

                    // multi-select filter
                    if (taginfo[3]) {
                        k = 0;
                        tagsrc = taginfo[3];
                        if (IS_ARRAY(taginfo[3])) {
                            k = 1;
                            tagsrc = taginfo[3][0];
                        }

                        // @todo convert to object
                        if (FILTERDATA[tagsrc]) {
                            for (var _i = 0, filter; _i < FILTERDATA[tagsrc][k].length; _i++) {
                                filter = FILTERDATA[tagsrc][k][_i];
                                if (filter[1] === tag) {
                                    a = filter;
                                    a.type = tagsrc;
                                    break;
                                }
                            }
                        }
                    }

                    if (a) {
                        if (taginfo[2]) {
                            tagname = [CLONE_ELEMENT(taginfo[2]), TEXT(taginfo[5])];
                        } else {
                            tagname = TEXT(taginfo[5]);
                        }

                        APPEND_CHILD(foot_features, CLONE_ELEMENT(A, {
                            "href": HASH_LINK_URL +  a[1] + '/',
                            "rel": a[1],
                            "data-type": a.type
                        }, tagname));

                    } else {

                        tagslug = taginfo[0];

                        if (taginfo[2]) {
                            tagname = [CLONE_ELEMENT(taginfo[2]), TEXT(taginfo[5])];
                        } else {
                            tagname = taginfo[5];
                        }

                        APPEND_CHILD(foot_features, CLONE_ELEMENT(A, {
                            href: HASH_LINK_URL +  tagslug + '/',
                            "rel": tagslug
                        }, tagname));
                    }

                    tags_printed++;
                }

                if (tags_printed === 3) {
                    break;
                }
            }

        } else {
            HIDE(foot_features);
        }

        foot_features = QUERY('.foot .options', info);

        var options_printed;

        for (var tag, optkey, i = 0; i < OPTION_URL_KEYS.length; i++) {
            if (org[OPTION_URL_KEYS[i]]) {
                APPEND_CHILD(foot_features, CLONE_ELEMENT(A_EXT, {
                        href: org[OPTION_URL_KEYS[i]],
                        "data-lg": (org[OPTION_URL_KEYS[i] + '_lg'] || SITE_LG)
                    }, '✔️ ' + _i18n(OPTION_URL_KEYS[i]))
                );
                options_printed = 1;
            }
        }

        if (!options_printed) {
            HIDE(foot_features);
        }

        var contact = CLONE_ELEMENT(ORGS_ROW_CONTACT);

        // options clone for mobile
        var contact_options = CLONE_ELEMENT(foot_features);
        SHOW(contact_options);
        APPEND_CHILD(contact_options, CLONE_ELEMENT(ORGS_ROW_CONTACT_OPTIONS_BUTTON));
        contact.prepend(contact_options);

        if (org.primary_address) {
            if (org.primary_address[1]) {
                var city = [TEXT(org.primary_address[1])];
                if (org.primary_address[2]) {
                    var country = (COUNTRIES[org.primary_address[2]]) ? COUNTRIES[org.primary_address[2]] : CONTINENTS[org.primary_address[2]];
                    if (country) {
                        city.push(CLONE_ELEMENT(SPAN, {
                            "class": "country"
                        }, TEXT(org.primary_address[2])));

                        APPEND_CHILD(QUERY('.addr .flag', contact), CLONE_ELEMENT(country[1]));
                    }
                }
                APPEND_CHILD(QUERY('.addr .city', contact), city);
            }
            if (org.offices) {
                var officelink = QUERY('.addr .offices a', contact);
                APPEND_CHILD(officelink, _sprintf('+%d offices', org.offices));
                SET_ATTRS(officelink, {
                    "href": (org.offices_link) ? org.offices_link : "/@" + org.slug,
                    "target": (org.offices_link) ? '_blank' : '_top'
                });
            }
        }

        var field = QUERY('.phone a', contact);
        if (org.phone) {
            APPEND_CHILD(field, TEXT(org.phone));
            SET_ATTRS(field, {
                "href": "tel:" + org.phone.replace(/[\s-\.]+/gi,'')
            });
        } else {
            HIDE(field.parentElement);
        }

        field = QUERY('.email a', contact);
        if (org.email) {
            APPEND_CHILD(field, TEXT(org.email));
            SET_ATTRS(field, {
                "href": "mailto:" + org.email,
                "title": org.email
            });
        } else {
            HIDE(field.parentElement);
        }

        field = QUERY('.web a', contact);

        if (org.website) {
            var link = CLONE_ELEMENT(A, {
                "href": org.website
            }),
            hostname = link.hostname.replace(/^www\./,'');

            APPEND_CHILD(field, TEXT(hostname));
            SET_ATTRS(field, {
                "href": org.website,
                "title": hostname,
                "data-lg": (org.website_lg) ? org.website_lg : SITE_LG
            });
        } else {
            HIDE(field.parentElement);
        }

        field = QUERY('.social', contact);
        if (org.social) {

            for (var type, social_url, i = 0; i < ORGS_SOCIAL_TYPES.length; i++) {
                type = ORGS_SOCIAL_TYPES[i];
                if (org.social[type]) {
                    switch (type) {
                        case "facebook": 
                            social_url = 'https://facebook.com/' + org.social[type]
                        break;
                        case "twitter": 
                            social_url = 'https://twitter.com/' + org.social[type]
                        break;
                        case "linkedin": 
                            social_url = org.social[type]
                        break;
                        case "instagram": 
                            social_url = 'https://instagram.com/' + org.social[type]
                        break;
                        case "whatsapp": 
                            social_url = 'https://wa.me/' + org.social[type]
                        break;
                        case "snapchat": 
                            social_url = 'https://snapchat.com/' + org.social[type]
                        break;
                        case "youtube": 
                            social_url = 'https://youtube.com/@' + org.social[type]
                        break;
                        case "messenger": 
                            social_url = 'https://m.me/' + org.social['facebook']
                        break;
                    }

                    APPEND_CHILD(field, CLONE_ELEMENT(ORGS_SOCIAL[type], {
                        "href": social_url
                    }));
                }
            }

            if (org.social_offices) {
                APPEND_CHILD(field, CLONE_ELEMENT(ORGS_ROW_CONTACT_SOCIAL_MORE));
                SET_ATTRS(QUERY('.social .more a', field), {
                    "href": "/@" + org.slug
                });
            }

        } else {
            HIDE(field);
        }

/*
ORGS_ROW_CONTACT = CLONE_ELEMENT(DIV, {
                "class": "contact"
            }, [
                CLONE_ELEMENT(DIV, {
                    "class": "addr"
                },[
                    CLONE_ELEMENT(SPAN, {
                        "class": "city"
                    }),
                    CLONE_ELEMENT(SPAN, {
                        "class": "flag"
                    }),
                    CLONE_ELEMENT(DIV, {
                        "class": "offices"
                    },
                        [
                            CLONE_ELEMENT(A_EXT)
                        ]
                    )
                ]),
                CLONE_ELEMENT(DIV, {
                        "class": "phone"
                    },
                    [TEXT('📞'), CLONE_ELEMENT(A)]
                ),
                CLONE_ELEMENT(DIV, {
                        "class": "email"
                    },
                    [TEXT('📧'), CLONE_ELEMENT(A)]
                ),
                CLONE_ELEMENT(DIV, {
                        "class": "web"
                    },
                    [TEXT('🌐'), CLONE_ELEMENT(A_EXT)]
                ),
                CLONE_ELEMENT(DIV, {
                        "class": "social"
                    },
                    [CLONE_ELEMENT(DIV, {
                        "class": "more"
                    }, CLONE_ELEMENT(A, false, TEXT(_i18n('More at offices'))))]
                )
            ]);
*/

        APPEND_CHILD(contents, [img, info, contact]);

        requestAnimationFrame(function() {
            APPEND_CHILD(row, contents);
        });

    }

    SETUP_INDEX();

    // index
    var INFO_PAGE;
    var quickfilter_selected = {};

    selected = false;

    LOAD_ORGS(function() {

        APPLY_FILTERS(false, false, true);

    }, 0, selected);

    function RESET_CACHE(callback) {
        var p = [];

        try {
            p.push(new Promise(function(resolve, reject) {
                navigator.serviceWorker.getRegistrations().then(function(r) {
                    return Promise.all(r.map(function(reg) {
                        reg.unregister();
                    })).then(resolve).catch(reject);
                });
            }));
        } catch (e) {

        }

        if (localStorage) {
            try {
                localStorage.clear();
            } catch (e) {

            }
        }

        try {
            p.push(new Promise(function(resolve, reject) {
                // open all caches
                caches.keys()
                    .then(function(cacheNames) {
                        if (!cacheNames || cacheNames.length === 0) {
                            return Promise.resolve();
                        }

                        return Promise.all(
                            cacheNames.map(function(cacheName) {
                                caches.delete(cacheName);
                            }));
                    }).then(resolve).catch(reject);

            }));
        } catch (e) {

        }

        // force browser reload
        Promise.all(p)
            .then(function() {

                if (callback) {
                    callback();
                }

            });
    }

    function SELECT_FILTERS_BY_KEY_OR_GROUP(filter, key) {

        var results = [];

        if (FILTERDATA[filter]) {

            var match;
            if (FILTERDATA[filter][0]) {
                FILTERDATA[filter][0].forEach(function(entry) {
                    if (!match && entry[1] === key) {
                        match = entry;
                    }
                });
            }

            if (match) {
                results.push(match[1]);
            } else if (FILTERDATA[filter][1]) {
                FILTERDATA[filter][1].forEach(function(entry) {
                    if (!match && entry[1] === key) {
                        match = entry;
                    }
                });

                if (match) {
                    var groups = [match[1]];
                    function parse_children(parent) {
                        FILTERDATA[filter][1].forEach(function(entry) {
                            if (entry[3] === parent) {
                                groups.push(entry[1]);
                                parse_children(entry[1]);
                            }
                        });
                    }
                    parse_children(match[1]);

                    groups.forEach(function(group) {

                        results.push(group);

                        FILTERDATA[filter][0].forEach(function(entry) {
                            if (entry[3] === group) {
                                results.push(entry[1]);
                            }
                        });
                    });
                }
            }
        }

        return results;
    }

    var AUTOCOMPLETE_START;
    var AUTOCOMPLETE_RESULTS;
    var AUTOCOMPLETE_FLAG;

    function AUTOCOMPLETE_ROW_CLICK(target) {
        var hashtype = GET_ATTR(target, 'data-type');
        var href = GET_ATTR(target, 'href');

        if (hashtype) {
            var ref = GET_ATTR(target, 'data-ref');
            try {
                ref = JSON.parse(ref);
            } catch(err) {
                return;
            }


            var searchvalue = SEARCH_FIELD.value;
            var tags = [];
            var gakey;

            RESET_FILTERS();

            var mm_update;

            if (hashtype === 'country' || hashtype === 'continent') {
                mm_update = ['regions', [ref[0]]];
            } else if (hashtype === 'tags') {
                mm_update = [hashtype, [ref[1]]];
            } else if (hashtype === 'animals' || hashtype === 'environment') {
                mm_update = [hashtype, SELECT_FILTERS_BY_KEY_OR_GROUP(hashtype, ref[1])];

            } else if (hashtype === 'all') {
                SAVE_FILTER_CONFIG('query', searchvalue);
                if (searchvalue) {
                    SEARCH_FIELD.value = searchvalue;
                    SEARCH_FIELD_BUTTON.classList.add('active');
                }
            }

            if (mm_update) {
                SAVE_FILTER_CONFIG(mm_update[0], mm_update[1]);
                UPDATE_MULTI_SELECT(mm_update[0], QUERY('.multi-input[data-name="'+mm_update[0]+'"]', FILTERS), mm_update[1]);
            }

            //ga('send', 'event', 'quicksearch-hash-' + gakey, ref);
            AUTOCOMPLETE_RESULTS.classList.add('active');

            if (hashtype !== 'all') {
                SEARCH_FIELD.value = '';
                SEARCH_FIELD_BUTTON.classList.remove('active');
            }

            HIDE(AUTOCOMPLETE_RESULTS);

            APPLY_FILTERS();

            setTimeout(function() {
                AUTOCOMPLETE_RESULTS.classList.remove('active');
            }, 100);

        } else {
            document.location.href = href;
        }
    }

    //var AUTOCOMPLETE_BAT = {};
    function AUTOCOMPLETE(query) {
        if (!query) {
            if (AUTOCOMPLETE_RESULTS) {
                HIDE(AUTOCOMPLETE_RESULTS);
            }
            return;
        }

        if (AUTOCOMPLETE_RESULTS && AUTOCOMPLETE_RESULTS.classList.contains('active')) {
            return;
        }

        if (AUTOCOMPLETE_START) {
            clearTimeout(AUTOCOMPLETE_START);
        }

        // load feeds
    
        AUTOCOMPLETE_START = setTimeout(function() {
            AUTOCOMPLETE_START = false;

            var query_regex = new RegExp(query,"i");
            var query_regex_start = new RegExp("^" + query,"i");
            var query_lower = query.toLowerCase();

            // @todo ga
            //ga('send', 'event', 'quicksearch', query);

            /*var featureMatch, featureid, startMatch, featureslug, feature;
            for (var i = 0; i < AUTOCOMPLETE_FEATURES.length; i++) {
                feature = AUTOCOMPLETE_FEATURES[i];
                featureid = feature[0];
                if (query_regex.test(feature[1]) || (feature[2] && query_regex.test(feature[2]))) {
                    startMatch = query_regex_start.test(feature[1]);

                    if (!featureMatch || (!featureMatch[0][2] && feature[2]) || (!featureMatch[2] && startMatch)) {
                        featureMatch = [feature, [], startMatch];

                        // slug and start match
                        if (featureMatch[0][2] && featureMatch[2]) {
                            break;
                        }
                    }
                }
            }

            var makeMatch, slugmatch;
            for (var i = 0; i < INDEX_FILTERS[0].length; i++) {
                if ((!makeMatch || !makeMatch.slugmatch || (!makeMatch.slugmatch && !makeMatch.startmatch)) && query_regex.test(INDEX_FILTERS[0][i].name)) {
                    startMatch = query_regex_start.test(INDEX_FILTERS[0][i].name);
                    slugmatch = (INDEX_FILTERS[0][i].slug === query_lower);
                    makeMatch = Object.assign({
                        slugmatch: slugmatch,
                        startmatch: startMatch,
                        scooters: []
                    }, INDEX_FILTERS[0][i]);
                }
            }*/
            
            var matches = [], countryMatches = [], countryMatch, continentMatch, 
                countryMatchHash, match;

            var limit = 6;
            /*var scooters = window.scooters,
                scooter;*/

            // country match
            if (query.length === 2 && COUNTRIES[query_lower]) {
                countryMatch = [query_lower,COUNTRIES[query_lower]];
            } else if (CONTINENTS[query_lower]) {
                countryMatch = [query_lower,CONTINENTS[query_lower], 1];
            } else if (query.length > 2) {
                for (var cc in COUNTRIES) {
                    if (COUNTRIES.hasOwnProperty(cc) && query_regex.test((COUNTRIES[cc][0] + ' ' + (COUNTRIES[cc][3]||'') + ' ' + (COUNTRIES[cc][4]||'')))) {
                        countryMatch = [cc,COUNTRIES[cc]];
                        break;
                    }
                }

                if (!countryMatch) {
                    for (var cc in CONTINENTS) {
                        if (CONTINENTS.hasOwnProperty(cc) && query_regex.test((CONTINENTS[cc][0] + ' ' + (CONTINENTS[cc][3]||'') + ' ' + (CONTINENTS[cc][4]||'')))) {
                            countryMatch = [cc,CONTINENTS[cc]];
                            break;
                        }
                    }
                }
            }

            if (countryMatch) {
                matches.push(null);
            }

            ['animals', 'environment'].forEach(function(key) {
                for (var i = 0, filter; i < FILTERDATA[key][0].length; i++) {
                    if (matches.length === limit) {
                        break;
                    }
                    filter = FILTERDATA[key][0][i];
                    if (query_regex.test((filter[0] + ' ' + (filter[4]||'')))) {
                        matches.push([
                            key,
                            filter[1],
                            filter[0],
                            filter[2]
                        ]);
                    }
                }
                for (var i = 0, filter; i < FILTERDATA[key][1].length; i++) {
                    if (matches.length === limit) {
                        break;
                    }
                    filter = FILTERDATA[key][1][i];
                    if (query_regex.test((filter[0] + ' ' + (filter[4]||'')))) {
                        matches.push([
                            key,
                            filter[1],
                            filter[0],
                            filter[2],
                            'group:' + filter[1]
                        ]);
                    }
                }
            });

            if (matches.length < limit) {

                var tags = [], tagrow, tagname;
                for (var tag in TAGS) {
                    if (TAGS.hasOwnProperty(tag)) {
                        tagrow = TAGS[tag];
                        if (tagrow[3]) {
                            continue;
                        }
                        if (query_regex.test(tagrow[1]) || (tagrow[4] && query_regex.test(tagrow[4]))) {
                            matches.push([
                                'tags',
                                tagrow[0],
                                tagrow[1],
                                tagrow[2]
                            ]);
                        }
                    }
                }
            }
            
            AUTOCOMPLETE_RESULTS = QUERY('.autocomplete', PARENT(SEARCH_FIELD));
            if (!AUTOCOMPLETE_RESULTS) {
                AUTOCOMPLETE_RESULTS = CLONE_ELEMENT(DIV, {
                    "class": "autocomplete"
                });
                APPEND_CHILD(PARENT(SEARCH_FIELD), AUTOCOMPLETE_RESULTS);

                var clickTimeout,sfclearTimeout;
                ADD_EVENT(['mousedown','touchstart'], function(event) {
                    var target = event.target;


                    if (SEARCH_FIELD_BLUR_TIMEOUT) {
                        clearTimeout(SEARCH_FIELD_BLUR_TIMEOUT);
                    }
                    if (sfclearTimeout) {
                        clearTimeout(sfclearTimeout);
                    }
                    SEARCH_FIELD_BLUR_TIMEOUT = -1;

                    if (target.nodeName === 'A') {

                        if (event.button > 0) {
                            return;
                        }

                        if (clickTimeout) {
                            clearTimeout(clickTimeout);
                        }
                        clickTimeout = setTimeout(function() {
                            AUTOCOMPLETE_ROW_CLICK(target);
                            SEARCH_FIELD_BLUR_TIMEOUT = false;
                        });
                    }
                }, AUTOCOMPLETE_RESULTS);

            }

            requestAnimationFrame(function() {
                SHOW(AUTOCOMPLETE_RESULTS);

                var rows = QUERY('a', AUTOCOMPLETE_RESULTS, true), row;

                var start = 0;
                var hlink;

                // search all row
                hlink = 'all';
                if (rows[start] && GET_ATTR(rows[start],'data-id') === hlink) {
                    SET_ATTRS(rows[start], {
                        "href": HASH_LINK_URL + '#🔍' + encodeURIComponent(query)
                    });
                    start++;
                } else {

                    row = CLONE_ELEMENT(A, {
                        "href": HASH_LINK_URL + '#🔍' + encodeURIComponent(query),
                        "data-id": hlink,
                        "class": hlink,
                        "data-type": hlink,
                        "data-ref": "[]"
                    },[
                        TEXT('🔍 ' + _i18n('search_all'))    
                    ]);

                    if (rows[start]) {
                        rows[start].replaceWith(row);
                    } else {
                        APPEND_CHILD(AUTOCOMPLETE_RESULTS, row);
                    }
                    start++;
                }

                if (countryMatch) {
                    hlink = countryMatch[0];

                    if (rows[start] && GET_ATTR(rows[start],'data-id') === hlink) {
                        start++;
                    } else {
                        row = CLONE_ELEMENT(A, {
                            "href": HASH_LINK_URL + hlink + '/',
                            "data-id": hlink,
                            "class": "hash",
                            "data-type": (countryMatch[2]) ? "continent" : "country",
                            "data-ref": JSON.stringify(countryMatch)
                        },[
                            CLONE_ELEMENT(SPAN, {
                                "class": "ms"
                            }, TEXT(_i18n('regions') + ' ›')),
                            CLONE_ELEMENT(countryMatch[1][1]),
                            TEXT(countryMatch[1][0])
                        ]);

                        if (rows[start]) {
                            rows[start].replaceWith(row);
                        } else {
                            APPEND_CHILD(AUTOCOMPLETE_RESULTS, row);
                        }
                        start++;
                    }
                }
            
                var match;

                for (var i = start; i < limit; i++) {
                    match = matches[i - start];
                    if (!match) {
                        if (rows[i]) {
                            REMOVE(rows[i]);
                        }
                        continue;
                    }

                    if (rows[i]) {
                        if (parseInt(GET_ATTR(rows[i],'data-id')) === match[1]) {
                            continue;
                        }
                    }

                    row = CLONE_ELEMENT(A, {
                        "href": HASH_LINK_URL + match[1] + '/',
                        "data-id": match[1],
                        "class": "hash",
                        "data-type": match[0],
                        "data-ref": JSON.stringify(match)
                    },[
                        CLONE_ELEMENT(SPAN, {
                            "class": "ms"
                        }, TEXT(_i18n(match[0]) + ' ›')),
                        CLONE_ELEMENT(match[3]),
                        TEXT(match[2])
                    ]);

                    if (rows[i]) {
                        rows[i].replaceWith(row);
                    } else {
                        APPEND_CHILD(AUTOCOMPLETE_RESULTS, row);
                    }
                }
            });
        },10);
    }

    var GDPR_CONTAINER,
        GDPR_OVERLAY;

    function WEBSITE_LANG_POPUP(url, lg, cc) {

        if (!GDPR_CONTAINER) {
            GDPR_CONTAINER = CLONE_ELEMENT(QUERY('#gdpr-w'), {
                "id": "",
                "class": "popup-w"
            });
            REMOVE(QUERY('.gdpr-i',GDPR_CONTAINER));

            GDPR_OVERLAY = CLONE_ELEMENT(QUERY('#gdpr-o'), {
                "id": "",
                "class": "popup-o"
            });
            APPEND_CHILD(BODY, [GDPR_CONTAINER, GDPR_OVERLAY]);

            ADD_EVENT('click', function(e) {
                if (e.target === GDPR_OVERLAY) {
                    HIDE(GDPR_CONTAINER);
                    HIDE(GDPR_OVERLAY);
                }
            }, GDPR_OVERLAY);

            // escape key
            ADD_EVENT(['keypress', 'keydown'], function(e) {
                if (e.keyCode == 27 && GDPR_OVERLAY.style.display === 'block') {
                    e.preventDefault();
                    HIDE(GDPR_CONTAINER);
                    HIDE(GDPR_OVERLAY);
                }
            });
        }

        var container = QUERY('.popup', GDPR_CONTAINER), p, u, buttons, t, 
            lginfo = LANGUAGEINFO[lg];
        lginfo[1] = (lginfo[1]) ? lginfo[1] : lg.toUpperCase(),
        lgemoji = lginfo[0];
        if (cc === 'us' && lg === 'en') {
            lgemoji = '🇺🇸';
        } else if (cc === 'au' && lg === 'en') {
            lgemoji = '🇦🇺';
        } else if (cc === 'nz' && lg === 'en') {
            lgemoji = '🇳🇿';
        } else if (cc === 'ca' && lg === 'en') {
            lgemoji = '🇨🇦';
        }
        if (!container) {
            container = CLONE_ELEMENT(DIV, {
                "class": "popup"
            });
            APPEND_CHILD(GDPR_CONTAINER, container);
        } else {
            EMPTY_HTML(container);
        }
        if (!P) {
            P = CREATE_ELEMENT('p');
        }

        requestAnimationFrame(function() {

            console.log(11111);

            u = CLONE_ELEMENT(A, {
                "href": url
            });

            p = CLONE_ELEMENT(P, {
                "class": "center"
            });
            p.innerHTML = _i18n('x_in_lg_y', u.hostname.replace(/^www\./,''), lginfo[1] + ' ('+lgemoji+')');
                //The website <strong>'+u.hostname+'</strong> is in the language '+;
            APPEND_CHILD(container, p);

            buttons = CLONE_ELEMENT(P, {
                "class": "buttons"
            });

            t = CLONE_ELEMENT(A, {
                "href": url
            });
            t.hostname = t.hostname.replace(/[-]+/g,'--').replace(/[^a-z0-9\-]+/g,'-') + '.translate.goog';
            var targetlg = SITE_LG;
            t.search = (t.search + '&' || '?') + '_x_tr_sl='+lg+'&_x_tr_tl='+targetlg+'&_x_tr_hl='+targetlg+'&_x_tr_pto=wapp'

            APPEND_CHILD(buttons, CLONE_ELEMENT(A_EXT, {
                "href": t.href
            }, [
                CLONE_ELEMENT(SPAN,0, TEXT(GET_ATTR(CONTENT_LG, 'data-e'))), 
                TEXT(_i18n('gtranslate'))
            ]));

            APPEND_CHILD(buttons, CLONE_ELEMENT(A_EXT, {
                "href": url,
                "class": "original"
            }, [
                CLONE_ELEMENT(SPAN, 0, TEXT(lgemoji)), 
                TEXT(_i18n('original_ws'))
            ]));

            APPEND_CHILD(container, buttons);

            cancel = CLONE_ELEMENT(A, {
                "href":'#'
            }, _i18n('cancel'));
            p = CLONE_ELEMENT(P, {
                "class": "cancel"
            }, cancel);

            APPEND_CHILD(container, p);

            ADD_EVENT('click', function(e) {
                if (e.target.nodeName === 'A') {
                    if (PARENT(e.target).classList.contains('cancel')) {
                        e.preventDefault();
                    }

                    // todo ga

                    HIDE(GDPR_CONTAINER);
                    HIDE(GDPR_OVERLAY);
                }
            }, [buttons, cancel]);

            SHOW(GDPR_CONTAINER, false, 'block');
            SHOW(GDPR_OVERLAY, false, 'block');
        });

    }

})(window, document);