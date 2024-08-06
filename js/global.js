(function(win, doc) {
    var loadSocialTimeout, socialLoaded, socialLoadedFull, socialhidden;
    var addEventListenerSupported = (doc.addEventListener);

    var HTML = doc.documentElement;
    var HEAD = doc.head;
    var DIV;
    var BODY;
    var NAV_SCROLL;

    var CURRENT = {
        chapter: false,
        subchapter: false,
        prev: false,
        next: false
    };
    var localStorage = ("localStorage" in win) ? win.localStorage : false;

    var NEXTTAG, PREVTAG, CURRENT_NAV;
    var HTAGS;
    var IMGS;
    var IMGS_RESOLVED;

    var BOOK_SPLASH, BOOK_TOC;
    var BOOK_FILES;
    var BOOK_TEMPLATES;
    var BOOK_MODE_RENDERED;
    var HTAG_REGEX = /^h[0-9]{1}$/i;
    var YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\/]{11})/;
    var BOOK_VIDEO_IMG;
    var BOOK_PRINTER;
    var VIEWPORT_HEIGHT = win.innerHeight;

    var READER;
    var READER_SETUP_DONE;
    var READER_CONTAINER;
    var FOREWORD;
    var INDEX_BTN;
    var DOMREADY_IS_READY;
    var STATUS_CUR;
    var STATUS_CUR_CHAPTER;
    var STATUS_CUR_SUBCHAPTER;

    var STATUS_NEXT;
    var STATUS_NEXT_PREV;
    var STATUS_NEXT_NEXT;

    var STATUS_NEXT_CHAPTER;
    var STATUS_NEXT_SUBCHAPTER;

    var READER_INDEX_DOWNLOAD_FORM;
    var READER_INDEX;
    var READER_INDEX_ITEMS;

    var DARK_MODE_MQ = win.matchMedia('(prefers-color-scheme: dark)');
    var OS_DARK_MODE = !!DARK_MODE_MQ.matches;
    var DARK_MODE;
    var DARK_MOON;
    var DARK_THEME_LOADED;

    var UA = (navigator) ? navigator.userAgent : 0;
    /* detect webp support */
    var WEBP_FORMAT = '.webp';
    var WEBP_LOADING;
    var WEBP_CALLBACKS;
    var WEBP_REWRITE_REGEX = /(\.(jp(e)?g|gif|bmp|png|tiff))/ig;
    var WEBP_SUPPORT = (function(userAgent, webpRegex, match, webP) {
        userAgent = UA;
        if (userAgent) {
            webpRegex = /.*\bChrome\/([0-9\.]+)|.*\bFirefox\/(\d+)\b.*/;
            match = userAgent.match(webpRegex);
            if (match && (match[1] || (match[2] && parseInt(match[2]) >= 65))) {
                return true;
            }
        }

        WEBP_CALLBACKS = [];
        WEBP_LOADING = true;

        webP = new Image();
        webP.onload = webP.onerror = function() {
            WEBP_SUPPORT = (webP.height > 0);
            WEBP_LOADING = false;

            PROCESS_CALLBACK_QUEUE(WEBP_CALLBACKS, WEBP_SUPPORT);
        }
        webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';

        return false;
    })();

    function ERROR() {
        console.error.apply(console, SLICE(arguments));
    }

    function LOG() {
        console.log.apply(console, SLICE(arguments));
    }


    function E() {
        // Keep this empty so it's easier to inherit from
        // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
    }

    E.prototype = {
        on: function(name, callback, ctx) {
            if (IS_ARRAY(name)) {
                name.forEach(function(_name) {
                    ON(_name, callback, ctx);
                });
            } else {
                var e = this.e || (this.e = {});

                (e[name] || (e[name] = [])).push({
                    fn: callback,
                    ctx: ctx
                });
            }

            return this;
        },

        once: function(name, callback, ctx) {
            var self = this;

            function listener() {
                self.off(name, listener);
                callback.apply(ctx, arguments);
            };

            listener._ = callback
            return this.on(name, listener, ctx);
        },

        emit: function(name) {
            var data = SLICE(arguments, 1);
            var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
            var i = 0;
            var len = evtArr.length;

            for (i; i < len; i++) {
                evtArr[i].fn.apply(evtArr[i].ctx, data);
            }

            return this;
        },

        off: function(name, callback) {
            if (IS_ARRAY(name)) {
                name.forEach(function(_name) {
                    OFF(_name, callback, ctx);
                });
            } else {
                var e = this.e || (this.e = {});
                var evts = e[name];
                var liveEvents = [];

                if (evts && callback) {
                    for (var i = 0, len = evts.length; i < len; i++) {
                        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
                            liveEvents.push(evts[i]);
                    }
                }

                // Remove event from queue to prevent memory leak
                // Suggested by https://github.com/lazd
                // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

                (liveEvents.length) ?
                e[name] = liveEvents: delete e[name];
            }

            return this;
        }
    };

    // event emitter
    var EE = new E;

    var ON = function() {
        EE.on.apply(EE, arguments);
    };
    var ONCE = function() {
        EE.once.apply(EE, arguments);
    };
    var OFF = function() {
        EE.off.apply(EE, arguments);
    };
    var EMIT = function() {
        EE.emit.apply(EE, arguments);
    };


    if (!win.gdpr) {
        win.gdpr = function(fn) {
            fn();
        }
    }

    function DOMREADY(fn) {
        state = doc.readyState;
        if (state === 'complete' || state === 'interactive') {
            fn();
            DOMREADY_IS_READY = true;
        } else {
            requestAnimationFrame(function() {
                DOMREADY(fn);
            });
        }
    }

    function SLICE(args, start) {
        if (!start) {
            start = 0;
        }
        return Array.prototype.slice.call(args, start);
    }


    function REPLACE(el, newEl) {
        PARENT(el).replaceChild(newEl, el);
    }

    function NEXT(el, n, next) {
        n = n || 1;
        next = el.nextElementSibling;
        while (n > 1) {
            return NEXT(next, --n);
        }
        return next;
    }

    function PREV(el, n, next) {
        n = n || 1;
        next = el.previousElementSibling;
        while (n > 1) {
            return PREV(next, --n);
        }
        return next;
    }


    function BEFORE(target, el) {
        PARENT(target).insertBefore(el, target);
    }

    function AFTER(target, el, next) {
        next = NEXT(target);
        if (next) {
            return BEFORE(next, el);
        } else {
            return APPEND_CHILD(PARENT(target), el);
        }
    }

    function IS_ARRAY(arr) {
        return arr instanceof Array;
    }

    function IS(mixed, type) {
        return typeof mixed === type;
    }

    function IS_STRING(str) {
        return IS(str, 'string');
    }

    function EMPTY_HTML(el) {
        while (FIRST(el)) {
            REMOVE(FIRST(el));
        };
    }

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

    function CREATE_FRAGMENT() {
        return document.createDocumentFragment();
    }

    function PARSE_HTML(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        html = CREATE_FRAGMENT();
        APPEND_CHILD(html, SLICE(doc.body.childNodes));
        return html;
    }

    function APPEND_CHILD(target, el) {
        if (!IS_ARRAY(el)) {
            el = [el];
        }
        for (var i = 0, l = el.length; i < l; i++) {
            if (el[i]) {
                if (IS_STRING(el[i])) {
                    el[i] = TEXT(el[i]);
                }
                target.appendChild(el[i]);
            }
        }
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

    function ADD_EVENT_ONCE(trigger, handler, el, off, aborted) {
        off = ADD_EVENT(trigger, function() {
            if (!aborted) {
                off();
                handler.apply(null, arguments);
            }
        }, el, {
            "passive": true,
            "once": true
        });
        return function() {
            aborted = true;
            off();
        }
    }

    function ADD_EVENT(trigger, handler, el, options) {
        try {
            if (!el) {
                el = document;
            }
            if (options === -1) {
                options = {
                    "passive": true,
                    "once": true
                };
            }

            // multiple triggers
            if (IS_ARRAY(trigger)) {
                LOOP_OBJECT(trigger, function(i, _trigger) {
                    ADD_EVENT(_trigger, handler, el, options);
                });
            } else {

                if (!IS_ARRAY(el) && !(el instanceof NodeList)) {
                    el = [el];
                }

                LOOP_OBJECT(el, function(i, _el, passive) {
                    if (addEventListenerSupported) {
                        passive = (['touchstart'].indexOf(trigger) !== -1);
                        _el.addEventListener(trigger, handler, (passive ? Object.assign({
                            passive: true
                        }, options || {}) : (options || false)));
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
                });
            }

            return function() {
                return REMOVE_EVENT(trigger, handler, el);
            }
        } catch (e) {
            ERROR(e);
        }
    };

    // add event listener
    function REMOVE_EVENT(trigger, handler, el) {
        if (!el) {
            el = doc;
        }

        // multiple triggers
        if (IS_ARRAY(trigger)) {
            LOOP_OBJECT(trigger, function(i, _trigger) {
                REMOVE_EVENT(_trigger, handler, el);
            });
            return;
        }

        if (!IS_ARRAY(el) && !(el instanceof NodeList)) {
            el = [el];
        }

        LOOP_OBJECT(el, function(i, _el) {
            if (addEventListenerSupported) {
                _el.removeEventListener(trigger, handler, false);
            } else if (el.attachEvent) {
                // IE8
                _el.detachEvent('on' + trigger, handler);
            }
        });
    };


    var gdpr_w, gdpr_o, gdpr_init,
        menu_state;

    function SCROLLTO(element, margin, settings, top) {
        if (typeof margin === 'undefined') {
            margin = (element) ? 20 : 0;
        }
        if (element === -1) {
            var hash = doc.location.hash.split('#')[1];
            if (hash) {
                element = doc.getElementById(hash);
                if (!element) {
                    return;
                }
            }
        }
        if (element) {
            var dims = element.getBoundingClientRect();
            top = dims.top - margin + win.scrollY;
        } else {
            top = margin;
        }

        if (!settings || typeof settings !== 'object') {
            settings = {
                behavior: 'smooth'
            }
        }

        win.scrollTo(Object.assign({
            left: 0,
            top: top
        }, settings));
    }

    function HAS_CLASS(el, classes, any, match) {
        if (!IS_ARRAY(classes)) {
            classes = [classes];
        }

        match = false;
        for (var i = 0, l = classes.length; i < l; i++) {
            if (!el.classList.contains(classes[i])) {
                if (any) {
                    continue;
                } else {
                    return false;
                }
            } else {
                match = true;
                if (any) {
                    return match;
                }
            }
        }

        return match;
    }

    function SET_CLASS(el, classes, del) {
        if (!IS_ARRAY(classes)) {
            classes = [classes];
        }

        for (var i = 0, c, l = classes.length; i < l; i++) {
            c = classes[i];
            if (del) {
                el.classList.remove(c);
            } else {
                el.classList.add(c);
            }
        }
    }

    function IS_ARRAY(arr) {
        return arr instanceof Array;
    }

    function SET_CHAPTER(el, text, index) {
        if (text || text === '') {
            el.innerHTML = text;
        }
        if (!isNaN(index)) {
            el.setAttribute('data-index', index);
        } else {
            el.removeAttribute('data-index', index);
        }
        return el;
    }

    function CHAPTER_TITLE(chapter, chapterIndex, title) {
        if (chapter.type === 'link' && chapter.chapterTitle) {
            return chapter.chapterTitle;
        } else {
            title = (chapter.chapterTitle) ? chapter.chapterTitle : chapter.innerHTML;
            if (chapterIndex === false) {
                return title;
            }
            if (chapter.chapterIndex) {
                return chapter.chapterIndex + ' ' + title;
            }
            return title;
        }
    }

    function GET_INDEX(el, index) {
        index = el ? parseInt(el.getAttribute('data-index')) : false;
        return (!isNaN(index)) ? index : false;
    }

    var nav_scroll_timeout, nav_scroll_completed;

    function NAV_CHAPTER(index, tag) {
        READER_SHOW(false);

        index = (typeof index === 'object') ? GET_INDEX(index) : index;

        if (!isNaN(index) && index !== false) {
            if (nav_scroll_timeout) {
                clearTimeout(nav_scroll_timeout);
            }
            if (nav_scroll_completed) {
                nav_scroll_completed();
                nav_scroll_completed = false;
            }

            tag = HTAGS[index];
            CURRENT_NAV = tag;

            var info = tag.readerInfo;
            if (info && info.expand) {
                var explink = QUERY(info.expand);
                if (explink) {
                    expand_blockquote(explink, true);
                    info.expand = false;
                }
            }

            UPDATE_READER(tag, true);

            NAV_SCROLL = true;
            nav_scroll_completed = ADD_EVENT('scroll', function(e) {
                if (nav_scroll_timeout) {
                    clearTimeout(nav_scroll_timeout);
                }
                nav_scroll_timeout = setTimeout(function() {
                    NAV_SCROLL = false;
                    nav_scroll_completed();
                    nav_scroll_completed = false;
                }, 1000);
            }, win);

            SCROLLTO(tag, 80);

            var title = tag.chapterTitleText || tag.innerText;
            if (win.history) {
                win.history.pushState('', title, doc.location.pathname + '#' + tag.id);
            }
            doc.title = title;
        }
    }

    function HANDLE_SCROLL() {
        var closestHeader = null;
        var closestDistance = Number.MAX_VALUE;

        HTAGS.forEach(function(header) {
            //const distance = Math.abs(window.scrollY - header.offsetTop);
            const rect = header.getBoundingClientRect();
            const distanceFromBottom = window.innerHeight - rect.bottom;

            if (rect.top < window.innerHeight && distanceFromBottom < closestDistance) {

                closestHeader = header;
                //closestDistance = distance;
                closestDistance = distanceFromBottom;
            }

        });

        UPDATE_READER(closestHeader);
    }

    var reader_update_timeout;

    function UPDATE_READER(closestHeader, isNav) {

        if (reader_update_timeout) {
            clearTimeout(reader_update_timeout);
        }

        reader_update_timeout = setTimeout(function() {
            var chapter, subchapter;
            if (closestHeader) {
                NEXTTAG = HTAGS.slice(HTAGS.indexOf(closestHeader) + 1).shift();
                PREVTAG = HTAGS.slice(0, HTAGS.indexOf(closestHeader)).pop();
                /*if (NEXT && CURRENT_NAV && NEXT === CURRENT_NAV) {
                  closestHeader = CURRENT_NAV;
                  NEXT = HTAGS.slice(HTAGS.indexOf(CURRENT_NAV) + 1).shift();
                  PREV = HTAGS.slice(0, HTAGS.indexOf(closestHeader)).pop();
                }
                
                if (PREV && CURRENT_NAV && PREV === CURRENT_NAV) {
                  closestHeader = CURRENT_NAV;
                  PREV = HTAGS.slice(0, HTAGS.indexOf(CURRENT_NAV)).pop();
                  NEXT = HTAGS.slice(HTAGS.indexOf(closestHeader) + 1).shift();
                }*/

                if (closestHeader.classList.contains('subchapter') || closestHeader.type === 'link' || (
                        closestHeader.readerInfo && closestHeader.readerInfo.subchapter
                    )) {
                    subchapter = closestHeader;
                    var subchapterIndex = HTAGS.lastIndexOf(subchapter);
                    chapter = HTAGS.slice(0, subchapterIndex).filter(function(el) {
                        return (el.readerInfo && el.readerInfo.chapter) ? true : el.classList.contains('chapter');
                    }).pop();
                } else {
                    chapter = closestHeader;
                }
            } else {
                NEXTTAG = false;
                PREVTAG = false;
            }

            var chapter_id;
            var subchapter_id
            var prev_id;
            var next_id;
            if (chapter) {
                chapter_id = chapter.id;
            }
            if (subchapter) {
                subchapter_id = subchapter.id;
            }
            if (PREVTAG) {
                prev_id = PREVTAG.id;
            }
            if (NEXTTAG) {
                next_id = NEXTTAG.id;
            }

            var index = (subchapter) ? subchapter.index : ((chapter) ? chapter.index : false);
            if (index) {
                index = parseInt(index);
            }
            requestAnimationFrame(function() {
                READER_INDEX_ITEMS.forEach(function(item, i) {
                    i = parseInt(item.getAttribute('data-index'));
                    if (index === i) {
                        item.parentElement.classList.add('active');
                    } else {
                        item.parentElement.classList.remove('active');
                    }
                });
            });


            if (
                CURRENT.chapter === chapter_id &&
                CURRENT.subchapter === subchapter_id &&
                CURRENT.prev === prev_id &&
                CURRENT.next === next_id
            ) {
                return;
            }

            CURRENT.chapter = (chapter) ? chapter.id : false;
            CURRENT.subchapter = (subchapter) ? subchapter.id : false;
            CURRENT.prev = (PREVTAG) ? PREVTAG.id : false;
            CURRENT.next = (NEXTTAG) ? NEXTTAG.id : false;

            requestAnimationFrame(function() {

                if (chapter) {
                    SET_CHAPTER(STATUS_CUR_CHAPTER, CHAPTER_TITLE(chapter), chapter.index);

                    if (subchapter) {
                        SET_CHAPTER(STATUS_CUR_SUBCHAPTER, CHAPTER_TITLE(subchapter), subchapter.index);
                        STATUS_CUR.classList.remove('no-subchapter');
                    } else {
                        SET_CHAPTER(STATUS_CUR_SUBCHAPTER);
                        STATUS_CUR.classList.add('no-subchapter');
                    }
                } else {

                    STATUS_CUR_CHAPTER.innerHTML = FOREWORD;
                    SET_CHAPTER(STATUS_CUR_CHAPTER, FOREWORD);
                    SET_CHAPTER(STATUS_CUR_SUBCHAPTER);

                    STATUS_CUR.classList.add('no-subchapter');
                    NEXTTAG = HTAGS[0];
                }

                if (PREVTAG) {
                    STATUS_NEXT_PREV.setAttribute('title', PREVTAG.innerText);

                    SET_CHAPTER(STATUS_NEXT_PREV, false, HTAGS.indexOf(PREVTAG));

                    STATUS_NEXT_PREV.href = '#' + ((PREVTAG.id) ? PREVTAG.id : '');
                    STATUS_NEXT.classList.remove('no-prev');
                } else {
                    SET_CHAPTER(STATUS_NEXT_PREV);
                    STATUS_NEXT_PREV.href = '#'
                    STATUS_NEXT.classList.add('no-prev');
                }

                if (NEXTTAG) {
                    STATUS_NEXT_NEXT.setAttribute('title', NEXTTAG.innerText);

                    SET_CHAPTER(STATUS_NEXT_NEXT, false, HTAGS.indexOf(NEXTTAG));

                    STATUS_NEXT_NEXT.href = '#' + ((NEXTTAG.id) ? NEXTTAG.id : '');
                    STATUS_NEXT.classList.remove('no-next');

                    if (NEXTTAG.classList.contains('subchapter') || NEXTTAG.type === 'link') {
                        var subchapterIndex = HTAGS.lastIndexOf(NEXTTAG);
                        var next_chapter = HTAGS.slice(0, subchapterIndex).filter(function(el) {
                            return (el.readerInfo && el.readerInfo.chapter) ? true : el.classList.contains('chapter');
                        }).pop();

                        if (next_chapter.id === CURRENT.chapter) {
                            SET_CHAPTER(STATUS_NEXT_CHAPTER, '');
                            STATUS_NEXT.classList.add('same-chapter');
                        } else {
                            SET_CHAPTER(STATUS_NEXT_CHAPTER, CHAPTER_TITLE(next_chapter), next_chapter.index);
                            STATUS_NEXT.classList.remove('same-chapter');
                        }

                        SET_CHAPTER(STATUS_NEXT_SUBCHAPTER, CHAPTER_TITLE(NEXTTAG), NEXTTAG.index);
                        STATUS_NEXT.classList.remove('no-subchapter');
                    } else {
                        SET_CHAPTER(STATUS_NEXT_SUBCHAPTER, '');
                        SET_CHAPTER(STATUS_NEXT_CHAPTER, CHAPTER_TITLE(NEXTTAG), NEXTTAG.index);

                        STATUS_NEXT.classList.add('no-subchapter');
                        STATUS_NEXT.classList.remove('same-chapter');
                    }
                } else {
                    SET_CHAPTER(STATUS_NEXT_NEXT);
                    STATUS_NEXT_NEXT.href = '#'
                    STATUS_NEXT.classList.add('no-next');
                }

            });

        }, 10);

    }

    var socialLoaded;

    function LOAD_SOCIAL() {
        if (!socialLoaded) {
            socialLoaded = 1;
            $async("/css/all.min.css").then(function() {

                //doc.getElementById('select-lg').classList.add('show');

                //doc.getElementById('social').classList.add('visible');

                /*ADD_EVENT('click', function(e) {
                     doc.getElementById('social').classList.add('closed');
                }, QUERY('#social .close'));*/

            });
        }
    }

    function GET_QR(qrOptions, maxTypeNumber, qrCode, tetry) {
        retry = true;
        while (retry) {
            try {
                qrCode = new QRCodeStyling(
                    qrOptions
                );
                retry = false;
            } catch (err) {
                qrOptions.qrOptions.typeNumber++;
                qrOptions.qrOptions.typeNumber++;

                if (qrOptions.qrOptions.typeNumber > maxTypeNumber) {
                    throw err;
                }
            }
        }
        return qrCode;
    }

    var menu_visible;
    function showmenu(hide, callback) {

        if (hide && !menu_visible) {
            return;
        }
        menu_visible = !hide;

        if (!gdpr_init) {
            if (callback) {
                callback()
            }
            return;
        }

        gtag('event', ((hide) ? 'menu_close' : 'menu_open'), {
            'event_category': 'menu',
            'event_label': ((hide) ? 'Close menu' : 'Open menu')
        });

        requestAnimationFrame(function() {
            if (hide) {
                HTML.classList.remove('noscroll');
            } else {
                LOAD_SOCIAL();
                HTML.classList.add('noscroll');
            }

            gdpr_w.style.display = (hide) ? 'none' : 'block';
            gdpr_o.style.display = (hide) ? 'none' : 'block';

            if (!hide) {
                QUERY('.layer', gdpr_w).scrollTo(0, 0);
            }

            if (callback) {
                callback()
            }
        });

    }

    function SHOW_HTML_POPUP(config) {

        config = Object.assign({
            "class": ""
        }, config);

        function onclose() {
            if (config.onclose) {
                config.onclose();
            }
            SET_CLASS(HTML, ['noscroll', 'reader-win'], true);
        }

        if (!gdpr_w) {
            gdpr_w = QUERY('#gdpr-w');
            gdpr_o = QUERY('#gdpr-o');
        }

        if (!gdpr_w) {
            gdpr_w = CREATE_ELEMENT('div');
            gdpr_w.id = 'gdpr-w';
            gdpr_o = CREATE_ELEMENT('div');
            gdpr_o.id = 'gdpr-o';
        }

        APPEND_CHILD(BODY,gdpr_w);
        APPEND_CHILD(BODY,gdpr_o);

        if (!gdpr_init) {

            gdpr_init = true;

            ADD_EVENT('click', function(e) {
                if (e.target === gdpr_o) {
                    onclose();
                    //showmenu(true);
                }
            }, gdpr_o);

            ADD_EVENT('hashchange', function(e) {
                onclose();
            }, window);
        }

        SET_ATTRS(gdpr_w, {
            'class': 'popup-w' + ((config.class) ? ' ' + config.class : ''),
            'id': null
        });
        SET_ATTRS(gdpr_o, {
            'class': 'popup-o' + ((config.class) ? ' ' + config.class : ''),
            'id': null
        });

        var gdpr_i = QUERY('.gdpr-i', gdpr_w);
        if (gdpr_i) {
            REMOVE(gdpr_i);
        }

        gdpr_i = CLONE_ELEMENT(config.el);
        SET_CLASS(gdpr_i, 'gdpr-i');
        gdpr_i.removeAttribute('id');
        APPEND_CHILD(gdpr_w, gdpr_i);

        ADD_EVENT('click', function(e) {
            onclose();
        }, QUERY('.close', gdpr_w));

        SHOW([gdpr_w, gdpr_o]);

        SET_CLASS(HTML, ['noscroll', 'reader-win']);

        return {
            i: gdpr_i, 
            w: gdpr_w, 
            o: gdpr_o
        };
    }

    function SHOW_SOCIAL_POPUP(hide) {

        gtag('event', ((hide) ? 'social_close' : 'social_open'), {
            'event_category': 'social',
            'event_label': ((hide) ? 'Close social share' : 'Open social share')
        });

        READER_SHOW(false);

        LOAD_SOCIAL();

        requestAnimationFrame(function() {

            if (!hide) {
                var menu = SHOW_HTML_POPUP({
                    el: QUERY('#social-popup'),
                    "class": "social-popup light-o",
                    onclose: function() {
                        SHOW_SOCIAL_POPUP(true);
                    }
                });

                QUERY('.layer', gdpr_w).scrollTo(0, 0);

                LOOP_OBJECT(QUERY('img[data-z], [data-anim]', menu.i, true), function(i, el) {
                    RESOLVE_IMAGE(el);
                });
            } else {
                SET_CLASS(HTML, ['noscroll', 'reader-win'], true);
                HIDE([gdpr_w, gdpr_o]);
            }              
        });
    }


    function SHOW_EBOOK_POPUP(hide, emailFocus) {

        gtag('event', ((hide) ? 'ebook_close' : 'ebook_open'), {
            'event_category': 'ebook',
            'event_label': ((hide) ? 'Close ebook print' : 'Open ebook print')
        });
        
        READER_SHOW(false);

        requestAnimationFrame(function() {

            if (!hide) {
                var menu = SHOW_HTML_POPUP({
                    el: QUERY('#ebook-popup'),
                    "class": "ebook-popup light-o",
                    onclose: function() {
                        SHOW_EBOOK_POPUP(true);
                    }
                });

                QUERY('.layer', gdpr_w).scrollTo(0, 0);

                LOOP_OBJECT(QUERY('img[data-z], [data-anim]', menu.i, true), function(i, el) {
                    RESOLVE_IMAGE(el);
                });

                if (emailFocus) {
                    QUERY('.ebook-download input', menu.i).focus();
                }

                function emailDownload() {

                    SET_CLASS(form, 'loading');

                    grecaptcha.execute(captchaEl);
                }

                var captchaEl;
                var downloadUrl = QUERY('.direct-download a', menu.i).href;
                //var spinner = QUERY('.ebook-download .spinner', menu.i);
                var emailEl = QUERY('.ebook-download input', menu.i);
                var buttonEl = QUERY('.ebook-download button', menu.i);
                var form = PARENT(buttonEl);

                LOAD_RECAPTCHA(function(key) {

                    key = GET_ATTR(buttonEl, 'data-sitekey');

                    // temporarily move out of html window for captcha HTML insertion
                    APPEND_CHILD(READER_CONTAINER, buttonEl);

                    captchaEl = grecaptcha.render(buttonEl, {
                        'sitekey': key,
                        'callback': function(token, email) {
                            email = emailEl.value.trim();
                            if (email === '') {
                                SET_CLASS(emailEl, 'error');
                                ADD_EVENT_ONCE(['keypress', 'change'], function() {
                                    SET_CLASS(emailEl, 'error', true);
                                }, emailEl);
                                SET_CLASS(form, 'loading', true);
                                return emailEl.focus();
                            }

                            DOWNLOAD_EMAIL(email, token, function() {
                                SET_CLASS(form, 'loading', true);
                                document.location.href = downloadUrl;
                            });
                        }
                        //callback
                    });

                    // move back
                    AFTER(emailEl, buttonEl);

                    ADD_EVENT('keypress', function(e) {
                        if (e.key === 'Enter') {
                            emailDownload();
                        }
                    }, emailEl);
                });

                ADD_EVENT('click', function(e) {
                    emailDownload();
                }, buttonEl);
            

            } else {
                SET_CLASS(HTML, ['noscroll', 'reader-win'], true);
                HIDE([gdpr_w, gdpr_o]);
            }              
        });
    }

    function pagemenu() {

        var menu = SHOW_HTML_POPUP({
            el: QUERY('#menucon'),
            "class": "menu",
            onclose: function() {
                showmenu(true);
            }
        });

        LOOP_OBJECT(QUERY('img[data-z], [data-anim]', menu.i, true), function(i, el) {
            RESOLVE_IMAGE(el);
        });

        showmenu();

        menu_state = !menu_state;
    }

    var READER_VISIBLE;
    var READER_DOWNLOAD_CONTAINER;
    var READER_DOWNLOAD_SELECT;
    var READER_DOWNLOAD_BUTTON;
    var READER_DOWNLOAD_QR;
    var READER_DOWNLOAD_QR_LOADING;
    var READER_QR_LOADED;

    async function READER_DOWNLOAD_URL(config, url, qrCode) {
        if (!BOOK_FILES) {
            return;
        }
        var book_file;
        if (config.type === 'pdf') {
            if (config.screen === 'A3') {
                book_file = BOOK_FILES['pdf_a3'];
            } else {
                book_file = BOOK_FILES['pdf_a4'];
            }
        } else {
            book_file = BOOK_FILES['epub'];
        }
        gtag('event', 'download_book_' + book_file, {
            'event_category': 'book',
            'event_label': 'Download book ' + book_file
        });

        SET_ATTRS(READER_DOWNLOAD_BUTTON, {
            "href": '/book/' + book_file,
            "download": book_file
        });
        url = READER_DOWNLOAD_BUTTON.href;

        if (!READER_QR_LOADED) {
            await PROMISE(function(resolve, reject) {
                $async('/js/qr.js')
                    .then(function() {
                        READER_QR_LOADED = true;
                        resolve();
                    });
            });
        }

        requestAnimationFrame(function(loading, qrOptions) {

            qrOptions = {
                "width": 200,
                "height": 200,
                "data": url,
                "margin": 0,
                "qrOptions": {
                    "typeNumber": "8",
                    "mode": "Byte",
                    "errorCorrectionLevel": "Q"
                },
                "imageOptions": {
                    "hideBackgroundDots": true,
                    "imageSize": 0.4,
                    "margin": 0
                },
                "dotsOptions": {
                    "type": "square",
                    "color": "#000000"
                },
                "backgroundOptions": {
                    "color": "#ffffff"
                },
                "image": "/images/plant.png",
                "dotsOptionsHelper": {
                    "colorType": {
                        "single": true,
                        "gradient": false
                    },
                    "gradient": {
                        "linear": true,
                        "radial": false,
                        "color1": "#6a1a4c",
                        "color2": "#6a1a4c",
                        "rotation": "0"
                    }
                },
                "cornersSquareOptions": {
                    "type": "",
                    "color": "#000000"
                },
                "cornersSquareOptionsHelper": {
                    "colorType": {
                        "single": true,
                        "gradient": false
                    },
                    "gradient": {
                        "linear": true,
                        "radial": false,
                        "color1": "#000000",
                        "color2": "#000000",
                        "rotation": "0"
                    }
                },
                "cornersDotOptions": {
                    "type": "",
                    "color": "#000000"
                },
                "cornersDotOptionsHelper": {
                    "colorType": {
                        "single": true,
                        "gradient": false
                    },
                    "gradient": {
                        "linear": true,
                        "radial": false,
                        "color1": "#000000",
                        "color2": "#000000",
                        "rotation": "0"
                    }
                },
                "backgroundOptionsHelper": {
                    "colorType": {
                        "single": true,
                        "gradient": false
                    },
                    "gradient": {
                        "linear": true,
                        "radial": false,
                        "color1": "#ffffff",
                        "color2": "#ffffff",
                        "rotation": "0"
                    }
                }
            };

            EMPTY_HTML(READER_DOWNLOAD_QR);
            qrCode = GET_QR(qrOptions, 30);

            qrCode.append(READER_DOWNLOAD_QR);
            var canvas = QUERY('canvas', READER_DOWNLOAD_QR);
            if (canvas) {
                ADD_EVENT(['click', 'dblclick'], async function(e, svg) {
                    if (e.target.nodeName !== 'CANVAS') {
                        return;
                    }
                    try {
                        if (qrOptions.width === 200) {
                            qrOptions.width = 800;
                            qrOptions.height = 800;
                            qrCode.update(qrOptions);
                        }
                        if (e.type === 'dblclick') {
                            qrCode.download('png');
                            SET_CLASS(READER_DOWNLOAD_CONTAINER, 'qr');
                        } else {
                            READER_DOWNLOAD_CONTAINER.classList.toggle('qr')
                        }

                    } catch(err) {}
                }, READER_DOWNLOAD_QR);
            }
            SET_CLASS(READER_DOWNLOAD_QR, 'show');
        });
    }

    function DOWNLOAD_EMAIL(email, token, callback, reading) {

        // get 
        /*toc = CLONE_ELEMENT(QUERY('.reader-container .reader-index'));
        REMOVE(QUERY('.ebook-download', toc));
        
        reading = QUERY('#reader-index', toc);
        SET_ATTRS(reading, {
            "id": null
        });
        LOOP_OBJECT(QUERY('a', toc, true), function(i, el) {
            SET_ATTRS(el, {
                "href": el.href.toString()
            });
        });

        function resolve_images(_el, img) {
            img = !!WEBP_SUPPORT;
            WEBP_SUPPORT = false;
            LOOP_OBJECT(QUERY('img[data-z]', _el, true), function(i, el) {
                DO_RESOLVE_IMAGE(el);
                SET_ATTRS(el, {
                    "data-z": null,
                    "data-zd": null
                });
            });
            WEBP_SUPPORT = !!img;    
        }
        resolve_images(toc);*/

        reading = false;
        var index;
        if (CURRENT.chapter) {
            index = GET_INDEX(QUERY('#' + CURRENT.chapter));
            if (!isNaN(index) && index !== false) {
                reading = {};
                reading.chapter = {
                    "id": HTAGS[index].id,
                    "title": HTAGS[index].chapterTitle
                };

                if (CURRENT.subchapter) {
                    index = GET_INDEX(QUERY('#' + CURRENT.subchapter));
                    if (!isNaN(index) && index !== false) {
                        reading.subchapter = {
                            "id": HTAGS[index].id,
                            "title": HTAGS[index].chapterTitle
                        };
                    }
                }
            }
        }

        /*var book_config = {};
        LOOP_OBJECT(['content', 'screen', 'type'], function(i, key, select_content) {
            select_content = QUERY('select.' + key, READER_DOWNLOAD_CONTAINER);
            book_config[select_content.name] = select_content.value;
        });*/

        var formData = new FormData();
        formData.append('action', 'email');
        formData.append('email', email);
        /*formData.append('toc', toc.innerHTML);
        formData.append('content', book_config.content);
        formData.append('screen', book_config.screen);
        formData.append('type', book_config.type);*/
        formData.append('reading', JSON.stringify(reading));

        formData.append('url', doc.location.href.toString());
        formData.append('g-recaptcha-response', token);

        fetch('/book.php', {
            "method": "POST",
            body: formData
        }).then(function(data) {

            data.json().then(function(data, completed, qr) {
                if (data && data.error) {
                    ERROR(data);
                    alert(data.error);
                } else if (data && data.ok) {
                    if (callback) {
                        callback();
                    }
                } else {
                    ERROR(data);
                    return alert('Unknown error with submission to backend.');
                }
            }).catch(function(err) {
                ERROR(err);
                return alert('Our backend returned an invalid response: ' + err.toString());
            });
        });
    }

    function READER_SHOW(type, hidesocial, visible, active, downloadConfig, setDefaultConfig) {
        READER_VISIBLE = false;
        requestAnimationFrame(function() {
            /*if (type === 'download' || type === 'download_promo') {

                if (hidesocial) {
                    downloadConfig = hidesocial;
                } else {
                    downloadConfig = {
                        "content": "article",
                        "screen": "A4",
                        "type": ""
                    }
                }

                if (visible) {
                    setDefaultConfig = true;

                    try {
                        var userConfig = localStorage.getItem('download-config');
                        if (userConfig) {
                            userConfig = JSON.parse(userConfig);
                            downloadConfig = Object.assign({}, downloadConfig, userConfig);
                        }
                    } catch (err) {}
                }

                if (!READER_DOWNLOAD_CONTAINER) {

                    try {
                        BOOK_FILES = JSON.parse(GET_ATTR(QUERY('#book-splash'), 'data-files'));
                        if (!BOOK_FILES) {
                            throw new Error('no files', BOOK_SPLASH);
                        }
                    } catch (err) {
                        BOOK_FILES = false;
                        return;
                    }

                    READER_DOWNLOAD_CONTAINER = QUERY('.download-index', READER_CONTAINER);
                    if (!BOOK_FILES) {
                        SET_CLASS(READER_DOWNLOAD_CONTAINER, 'no-files');
                    }
                    READER_DOWNLOAD_SELECT = Array.from(QUERY('.dl-links .option > select', READER_DOWNLOAD_CONTAINER, true));
                    READER_DOWNLOAD_BUTTON = QUERY('.dl-links .links > .button > a', READER_DOWNLOAD_CONTAINER);
                    READER_DOWNLOAD_QR = QUERY('.dl-links .links > .qr', READER_DOWNLOAD_CONTAINER);
                    READER_DOWNLOAD_QR_LOADING = CLONE_ELEMENT(QUERY('.loading', READER_DOWNLOAD_QR));
                    READER_DOWNLOAD_QR_COMPLETED = CLONE_ELEMENT(QUERY('.completed', READER_DOWNLOAD_QR));

                    ADD_EVENT('change', function(e, select) {
                        select = e.target;
                        requestAnimationFrame(function() {
                            if (select.value) {
                                SET_CLASS(select, 'empty', true);
                            }
                            SET_CLASS(READER_DOWNLOAD_QR, 'show', true);

                            var all_set = true;
                            var config = {};
                            LOOP_OBJECT(READER_DOWNLOAD_SELECT, function(i, el) {
                                if (!el.value) {
                                    all_set = false;
                                }
                                config[el.name] = el.value;

                                if (select.name === 'type' && el.name === 'screen') {
                                    SHOW(el, (select.value === 'epub'));
                                }
                            });

                            SET_CLASS(QUERY('.dl-links .links', READER_DOWNLOAD_CONTAINER), 'show', !all_set);

                            if (all_set) {
                                READER_DOWNLOAD_URL(config);
                            }

                            if (setDefaultConfig) {
                                try {
                                    localStorage.setItem('download-config', JSON.stringify(config));
                                } catch (err) {

                                }
                            }
                        });
                    }, READER_DOWNLOAD_SELECT);

                    ADD_EVENT('click', async function(e, data) {
                        requestAnimationFrame(function(qr, loading) {

                            doc.cookie = 'book-download=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
                            if (QUERY('.completed', READER_DOWNLOAD_QR)) {
                                REMOVE(QUERY('.completed', READER_DOWNLOAD_QR));
                            }

                            //EMPTY_HTML(READER_DOWNLOAD_QR);
                            if (QUERY('.loading', READER_DOWNLOAD_QR)) {
                                return;
                            }

                            qr = FIRST(READER_DOWNLOAD_QR);
                            loading = CLONE_ELEMENT(READER_DOWNLOAD_QR_LOADING);
                            if (qr) {
                                BEFORE(qr, loading);
                            } else {
                                APPEND_CHILD(READER_DOWNLOAD_QR, loading);
                            }
                            RESOLVE_IMAGE(QUERY('[data-anim]', READER_DOWNLOAD_QR));

                            SET_CLASS(READER_DOWNLOAD_QR, 'show');

                            WATCH_DOWNLOAD_COOKIE(function(completed) {
                                //SET_CLASS(READER_DOWNLOAD_QR, 'show', true);
                                REMOVE(loading);

                                if (QUERY('.completed', READER_DOWNLOAD_QR)) {
                                    REMOVE(QUERY('.completed', READER_DOWNLOAD_QR));
                                }

                                completed = CLONE_ELEMENT(READER_DOWNLOAD_QR_COMPLETED);
                                if (qr) {
                                    BEFORE(qr, completed);
                                } else {
                                    APPEND_CHILD(READER_DOWNLOAD_QR, completed);
                                }
                                RESOLVE_IMAGE(QUERY('[data-anim]', READER_DOWNLOAD_QR));
                            });
                        });
                    }, READER_DOWNLOAD_BUTTON);

                    var setup_email_done;
                    function setup_email() {
                        if (!setup_email_done) {
                            setup_email_done = true;

                            SET_CLASS(READER_DOWNLOAD_CONTAINER, 'promo', true);

                            LOAD_RECAPTCHA(function(el, key, form, captchaEl, emailEl) {

                                el = QUERY('#download-email', READER_DOWNLOAD_CONTAINER);
                                form = PARENT(el);
                                emailEl = QUERY('input[type="email"]', form);
                                APPEND_CHILD(READER_CONTAINER, el);
                                key = GET_ATTR(el, 'data-sitekey');
                                captchaEl = grecaptcha.render(el, {
                                    'sitekey': key,
                                    'callback': function(token, email) {
                                        email = emailEl.value.trim();
                                        if (email === '') {
                                            SET_CLASS(emailEl, 'error');
                                            ADD_EVENT_ONCE(['keypress', 'change'], function() {
                                                SET_CLASS(emailEl, 'error', true);
                                            }, emailEl);
                                            return emailEl.focus();
                                        }

                                        DOWNLOAD_EMAIL(email, token);
                                    }
                                    //callback
                                });
                                APPEND_CHILD(form, el);

                                ADD_EVENT('keypress', function(e) {
                                    if (e.key === 'Enter') {
                                        grecaptcha.execute(captchaEl);
                                    }
                                }, emailEl);
                            });
                        }
                    }

                    if (type === 'download_promo') {
                        ADD_EVENT_ONCE(['click', 'keydown', 'focus'] ,function(e) {
                            setup_email();
                        }, QUERY('input[type="email"]', READER_DOWNLOAD_CONTAINER));
                    } else {
                        setup_email();
                    }
                }

                READER_CONTAINER.classList.toggle('show-download');
                READER_CONTAINER.classList.remove('show-social');
                READER_CONTAINER.classList.remove('show-lg');
                READER_CONTAINER.classList.remove('show-index');
                visible = READER_CONTAINER.classList.contains('show-download');

                if (type === 'download_promo') {
                    SET_CLASS(READER_DOWNLOAD_CONTAINER, 'promo');
                }

                var all_set = true;
                var config = {};
                LOOP_OBJECT(['content', 'screen', 'type'], function(i, key, select_content) {
                    select_content = QUERY('select.' + key, READER_DOWNLOAD_CONTAINER);
                    select_content.value = downloadConfig[key] || '';
                    SET_CLASS(select_content, 'empty', !!select_content.value);
                    if (!select_content.value) {
                        select_content.selectedIndex = 0;
                        all_set = false;
                    }
                    config[select_content.name] = select_content.value;

                    if (key === 'type') {
                        SHOW(QUERY('select.screen', READER_DOWNLOAD_CONTAINER), (select_content.value === 'epub'));
                    }
                });

                SET_CLASS(QUERY('.dl-links .links', READER_DOWNLOAD_CONTAINER), 'show', !all_set);

                if (all_set) {
                    READER_DOWNLOAD_URL(config);
                }

                if (visible) {

                    gtag('event', 'download_book', {
                        'event_category': 'book',
                        'event_label': 'Download book'
                    });
                }
            } else */
             
            /*if (type === 'social') {
                READER_CONTAINER.classList.toggle('show-social');
                READER_CONTAINER.classList.remove('show-download');
                READER_CONTAINER.classList.remove('show-lg');
                READER_CONTAINER.classList.remove('show-index');
                visible = READER_CONTAINER.classList.contains('show-social');

                if (visible) {
                    gtag('event', 'show_social', {
                        'event_category': 'social',
                        'event_label': 'Show social share'
                    });
                }
            } else */ if (type === 'lg') {
                READER_CONTAINER.classList.toggle('show-lg');
                //READER_CONTAINER.classList.remove('show-download');
                //READER_CONTAINER.classList.remove('show-social');
                READER_CONTAINER.classList.remove('show-index');
                visible = READER_CONTAINER.classList.contains('show-lg');

                if (visible) {
                    gtag('event', 'show_languages', {
                        'event_category': 'languages',
                        'event_label': 'Show language menu'
                    });
                }
            } else if (type === 'index') {
                //READER_CONTAINER.classList.remove('show-download');
                READER_CONTAINER.classList.remove('show-lg');
                //READER_CONTAINER.classList.remove('show-social');
                READER_CONTAINER.classList.toggle('show-index');
                visible = READER_CONTAINER.classList.contains('show-index');
                if (visible) {
                    active = READER_CONTAINER.querySelector('li.active');
                    if (active) {
                        active.scrollIntoView({
                            behavior: "smooth",
                            block: "center"
                        });
                    }

                    gtag('event', 'reader_show_index', {
                        'event_category': 'reader_index',
                        'event_label': 'Show index'
                    });
                }
            } else {
                //READER_CONTAINER.classList.remove('show-download');
                READER_CONTAINER.classList.remove('show-lg');
                READER_CONTAINER.classList.remove('show-index');
                //READER_CONTAINER.classList.remove('show-social');
            }

            if (visible) {
                READER_VISIBLE = type;
            }


            if (visible && type !== 'download_promo') {
                doc.documentElement.classList.add('reader-win');
            } else {
                doc.documentElement.classList.remove('reader-win');
            }
        });
    }


    function OBSERVER(callback, options, observe) {

        var observer = new IntersectionObserver(function(entries) {
            LOOP_OBJECT(entries, function(i, entry) {
                callback(entry, entry.target);
            });
        }, options); // {threshold: [1], rootMargin: '-46px 0px 0px 0px'}

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

    function LOAD_STARS_BG() {
        if (!DARK_MOON) {
            DARK_MOON = true;
            starbg = new Image();

            starbg.src = WEBP_REWRITE('/images/stars.png', starbg, function() {
                SET_STYLE(BODY, {
                    "background-image": 'url(' + starbg.src + ')'
                });
            });

            localStorage.setItem('stars', '1');
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

    function HIDE(el) {
        SHOW(el, 1);
    }

    function SET_STYLE(el, props, noImportant) {
        LOOP_OBJECT(props, function(prop, propData) {
            if (IS_UNDEFINED(propData)) {
                el.style.removeProperty(prop);
            } else {
                el.style.setProperty(prop, propData, (noImportant) ? "" : "important");
            }
        });
    }

    function TOGGLE_DARK_THEME() {
        if (DARK_MODE) {
            SET_CLASS(QUERY('#darkswitch .dark'), 'active');
            SET_CLASS(QUERY('#darkswitch .light'), 'active', true);
            gtag('event', 'dark_on', {
                'event_category': 'dark_mode',
                'event_label': 'Dark on'
            });
        } else {
            SET_CLASS(QUERY('#darkswitch .light'), 'active');
            SET_CLASS(QUERY('#darkswitch .dark'), 'active', true);

            gtag('event', 'dark_off', {
                'event_category': 'dark_mode',
                'event_label': 'Dark off'
            });
        }
    }

    function LOAD_DARK_THEME() {
        if (!DARK_THEME_LOADED) {
            DARK_THEME_LOADED = true;

            console.log('dark theme');
            DARK_MODE = true;
            SET_CLASS(HTML, 'dark');
            LOAD_STYLE(win.darkcss);

            //TRACK_EVENT('dark_theme', 'dark_theme', 'Dark Theme Enabled');
        }
    }

    function IS_UNDEFINED(obj) {
        return typeof obj === 'undefined';
    }

    async function LOAD_STYLE(css, style) {
        style = doc.createElement('style');
        if (style.styleSheet) {
            style.styleSheet.cssText = css;
        } else if ('textContent' in style) {
            style.textContent = css;
        } else {
            style.appendChild(TEXT(css));
        }
        requestAnimationFrame(function() {
            APPEND_CHILD(HEAD, style);
        });
        return style;
    }

    function LOCALSTORAGE_GET_JSON(key, data) {
        try {
            // localstorage
            data = localStorage.getItem(key);
            if (data) {
                if (data === '1' || data === '0') {
                    return parseInt(data);
                }
                data = JSON.parse(data);
                return $data;
            }
        } catch (e) {}
    }

    ON('dark', function(dark, starsloaded, darkcb, imgs) {
        if (dark) {
            DARK_MODE = true;
            LOAD_DARK_THEME();
            LOAD_STARS_BG();
        } else {
            DARK_MODE = false;
        }
        TOGGLE_DARK_THEME();

        OS_DARK_MODE = win.matchMedia('(prefers-color-scheme: dark)').matches;
        if (OS_DARK_MODE === DARK_MODE) {
            localStorage.removeItem('dark');
        } else {
            localStorage.setItem('dark', (DARK_MODE) ? '1' : '0');
        }

        SET_CLASS(HTML, 'dark', !DARK_MODE);

        darkcb = QUERY('#dark');
        if (darkcb) {
            darkcb.checked = DARK_MODE;
        }

        imgs = QUERY('img[data-d],img[data-zd]', false, true);
        LOOP_OBJECT(imgs, function(i, el) {
            RESOLVE_IMAGE(el);
        });
    });

    function TEXT(txt, text) {
        if (text) {
            txt.textContent = text;
        } else {
            return document.createTextNode(txt);
        }
    }
    async function DO_RESOLVE_IMAGE(el, callback, i, slugdir, dark, src, dark_resolved, shape) {
        i = GET_ATTR(el, 'data-z');
        shape = HAS_CLASS(el, 'shape');
        if (i) {
            dark = (DARK_MODE) ? GET_ATTR(el, 'data-zd') : false;
            if (dark) {
                i = dark;
            }
            var src = WEBP_REWRITE(i, el, function(err, src) {
                if (callback) {
                    callback(err, src);
                }
            }, true);
            if (!src) {
                src = 'SRC_EMPTY';
            }

            // wait for webp verification
            if (src instanceof Promise) {
                src = await src;
                if (!src) {
                    src = 'SRC_EMPTY';
                }
            }
            if (src === el.src) {
                return;
            }

            SET_ATTRS(el, {
                "src": src
            });

            if (shape) {
                SET_STYLE(el, {
                    "shape-outside": "url(" + src + ")"
                });
            }
        } else {
            dark = function() {
                SET_STYLE(el, {
                    "background-image": "url(" + src + ")"
                });
                SET_CLASS(el, 'anim');
            };

            // instant rewrite
            slugdir = !!callback;
            i = GET_ATTR(el, 'data-anim');
            if (i) {
                src = "/images/anim/" + i + ".webp";
                if (slugdir) {
                    dark();
                } else {
                    i = new Image();
                    ADD_EVENT_ONCE('load', dark, i);
                    i.src = src;
                }
            }
        }
    }

    function RESOLVE_IMAGE(el, callback) {
        requestAnimationFrame(function() {
            DO_RESOLVE_IMAGE(el, callback);
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

            LOOP_OBJECT(setAttrs, function(attr, attrData) {
                if (attrData === null) {
                    REMOVE_ATTR(el, attr);
                } else {
                    el.setAttribute(attr, attrData);
                }
            });
        }
    };

    // check for multiple attributes
    function REMOVE_ATTR(el, attr) {
        if (IS_ARRAY(el)) {
            LOOP_OBJECT(el, function(i, _el) {
                REMOVE_ATTR(el, attr);
            });
        } else {
            if (!IS_ARRAY(attr)) {
                attr = [attr];
            }
            LOOP_OBJECT(attr, function(i, _attr) {
                el.removeAttribute(_attr);
            });
        }
    };


    function PROMISE(callback, promises) {
        if (IS_ARRAY(callback)) {
            promises = [];
            LOOP_OBJECT(callback, function(i, cb) {
                promises.push(PROMISE(cb));
            });
            return Promise.all(promises);
        }
        return new Promise(callback);
    }

    function WEBP_REWRITE(src, target, callback, force, options, webp_src) {
        if (!WEBP_SUPPORT) {
            if (force && WEBP_LOADING) {
                return PROMISE(function(resolve) {
                    WEBP_CALLBACKS.push(function() {
                        resolve(WEBP_REWRITE(src, target, callback));
                    });
                });
            }
            if (callback) {
                requestAnimationFrame(function() {
                    callback(true, src, target);
                });
            }
            return src;
        }

        webp_src = src.replace(WEBP_REWRITE_REGEX, WEBP_FORMAT);

        if (target) {

            if (target.src === webp_src || (target.webp_resolved && target.webp_resolved === target.src)) {
                if (callback) {
                    requestAnimationFrame(function() {
                        callback((target.webp_error) ? target.webp_error : null, src, target);
                    });
                }
            } else {

                // fallback on error or 404
                ADD_EVENT_ONCE('error', function(e, that) {
                    //error_handler_off();

                    target.src = src;
                    target.webp_resolved = src;
                    target.webp_error = src;
                    if (callback) {
                        callback(e, src, target);
                    }
                }, target);

                if (callback) {
                    ADD_EVENT_ONCE('load', function() {
                        target.webp_resolved = webp_src;
                        callback(false, src, target);
                    }, target);
                }
            }
        }

        return webp_src;
    }
    win.webprw = WEBP_REWRITE;

    function PARENT(el, n, parent) {
        n = n || 1;
        parent = el.parentElement;
        while (n > 1) {
            return PARENT(parent, --n);
        }
        return parent;
    }

    // query selector
    function QUERY(q, el, multi, res) {
        if (!el) {
            el = document;
        }
        if (IS_ARRAY(q)) {
            res = [];
            LOOP_OBJECT(q, function(i, _q) {
                res.push(QUERY(_q, el, multi));
            });
            return res;
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


    function expand_blockquote(el, noscroll) {
        var b, i, p = el.parentElement;
        while (p.nodeName !== 'BLOCKQUOTE' && i < 5) {
            i++;
            p = el.parentElement;
        }
        if (p.nodeName === 'BLOCKQUOTE') {
            b = p;
        }
        if (b) {
            b.classList.add('expand');

            if (!noscroll) {
                SCROLLTO(b, 120);
            }
        }
    }

    DIV = CREATE_ELEMENT('div');
    var dlcookieregex = /book-download/;

    function WATCH_DOWNLOAD_COOKIE(callback) {
        var dlcookie = (dlcookieregex.test(doc.cookie) ? doc.cookie.replace(/(?:(?:^|.*;\s*)book-download\s*\=\s*([^;]*).*$)|^.*$/, "$1") : false);
        if (callback) {
            ONCE('bookdl', callback);
        }

        if (dlcookie) {
            EMIT('bookdl', dlcookie);
            doc.cookie = 'book-download=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
        } else {
            setTimeout(function() {
                WATCH_DOWNLOAD_COOKIE();
            }, 0);
        }
    }

    function EXPORT_EPUB(toc, splashHtml, imgs, contentHtml, epubTemplates) {

        return PROMISE(function(resolve, reject) {
            // extract images
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    requestAnimationFrame(function(img, atpl) {

                        atpl = CREATE_ELEMENT('a');

                        contentHtml = CLONE_ELEMENT(QUERY('#main-content'));

                        function rewrite_imgs(_el) {
                            LOOP_OBJECT(QUERY('img', _el, true), function(i, el, img) {
                                img = CLONE_ELEMENT(atpl, {
                                    "href": el.src.toString()
                                });
                                //imgs.push(img.href.toString()); // url
                                SET_ATTRS(el, {
                                    "src": img.href.toString()
                                });
                            });
                        }

                        function rewrite_chapter_links(_el, chapterFile) {

                            LOOP_OBJECT(QUERY('a.chapter-link,a[href*="'+doc.location.pathname.split('#')[0]+'#"],a[href^="#"]', _el, true), function(i, el) {
                                if (HAS_CLASS(el, 'chapter-link')) {
                                    el.href = '#' + GET_ATTR(el, 'data-chapter-id');
                                }
                                img = CLONE_ELEMENT(atpl, {
                                    "href": el.href
                                });
                                SET_ATTRS(el, {
                                    href: chapterFile + '#' + el.href.split('#')[1]
                                    //href: '#' + el.href.split('#')[1]
                                });
                            });
                        }

                        imgs = [];
                        LOOP_OBJECT(QUERY('iframe,script,style,.video-container,.hide-print,.donate-big', contentHtml, true), function(i, el) {
                            REMOVE(el);
                        });
                        rewrite_imgs(contentHtml);

                        function resolve_images(_el, img) {
                            img = !!WEBP_SUPPORT;
                            WEBP_SUPPORT = false;
                            LOOP_OBJECT(QUERY('img[data-z]', _el, true), function(i, el) {
                                DO_RESOLVE_IMAGE(el);
                                SET_ATTRS(el, {
                                    "data-z": null,
                                    "data-zd": null
                                });
                            });
                            WEBP_SUPPORT = !!img;    
                        }
                        resolve_images(contentHtml);
                        

                        LOOP_OBJECT(QUERY('[data-reader-info],[data-reader-link]', contentHtml, true), function(i, el) {
                            SET_ATTRS(el, {
                                "data-reader-info": null,
                                "data-reader-link": null
                            });
                        });

                        // get toc
                        var chapters = [];
                        toc = CLONE_ELEMENT(QUERY('.book-splash'));
                        LOOP_OBJECT(QUERY('.chapter', toc, true), function(i, el, href, h, tplfile, chapterFrag, next, prev,xx, txx) {
                            href = GET_ATTR(QUERY('a', el), 'href');
                            if (!href || href.indexOf('#') === -1) {
                                return;
                            }
                            tplfile = href.toString().trim().replace(/^\#/, '') + '.xhtml';

                            SET_ATTRS(QUERY('a', el), {
                                href: tplfile
                            });

                            // chapter HTML
                            h = QUERY(href, contentHtml);
                            if (!h) {
                                return;
                            }
                            if (HAS_CLASS(PARENT(h), 'book-chapter-block')) {
                                h = PARENT(h);
                            }
                            next = NEXT(h);
                            chapterFrag = CREATE_ELEMENT('div');
                            APPEND_CHILD(chapterFrag, h);
                            while (next && !HAS_CLASS(next, 'chapter')) {
                                if (HAS_CLASS(next, 'subchapter') || HAS_CLASS(next, 'reader-link')) {
                                    xx = next.id;
                                    if (QUERY('.subchapter', next)) {
                                        xx = QUERY('.subchapter', next).id;
                                    }
                                    if (xx) {
                                        txx = QUERY('a[href*="#'+xx+'"]', toc);
                                        if (txx) {
                                            SET_ATTRS(txx, {
                                                //href: '#' + next.id
                                                href: tplfile + '#' + xx
                                            });
                                        }
                                    }
                                }
                                prev = NEXT(next);
                                APPEND_CHILD(chapterFrag, next);
                                next = prev;
                            }

                            rewrite_imgs(chapterFrag);
                            rewrite_chapter_links(chapterFrag, tplfile);

                            chapters.push({
                                title: QUERY('span.text', el).innerHTML,
                                content: chapterFrag.innerHTML,
                                filename: tplfile,
                                id: href
                            });
                        });

                        LOOP_OBJECT(QUERY('li.active', toc, true), function(i, el) {
                            SET_CLASS(el, 'active', true);
                        });

                        if (chapters.length > 0) {
                            img = CREATE_ELEMENT('div', null, CLONE_ELEMENT(QUERY('#footer')));
                            resolve_images(img);
                            rewrite_imgs(img);
                            chapters[chapters.length - 1].content += img.innerHTML;
                        }

                        /*img = CREATE_ELEMENT('div', null, CLONE_ELEMENT(QUERY('.book-splash')));
                        REMOVE(QUERY('.book-toc', img));
                        REMOVE(QUERY('.templates', img));
                        resolve_images(img);
                        rewrite_imgs(img);
                        splash = img.innerHTML;*/

                        epubTemplates = [];

                        img = QUERY('template.epub', false, true);
                        LOOP_OBJECT(img, function(i, el, tplid, tpl) {
                            tplid = GET_ATTR(el, 'data-id');
                            epubTemplates[tplid] = CLONE_ELEMENT(el.content).innerHTML;
                        });

                        SET_ATTRS(QUERY('.reader-index', toc), {
                             "id": "toc",
                             "epub:type": "toc"
                        });

                        resolve_images(toc);
                        rewrite_imgs(toc);

                        resolve({
                            chapters: chapters,
                            tocHTML: toc.innerHTML,
                            //splash: toc.innerHTML, //splash,
                            templates: epubTemplates
                        });

                        /*LOOP_OBJECT(QUERY('a', toc, true), function(i, el) {
                            SET_ATTRS(el, {
                                "href": el.href.toString()
                            });
                        });*/

                    });
                });
            });
        });
    }

    function EXPORT_TOC() {
        return PROMISE(function(resolve, reject) {
            // extract images
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    requestAnimationFrame(function(img, atpl) {

                        atpl = CREATE_ELEMENT('a');
                        
                        // get toc
                        var toc = CLONE_ELEMENT(QUERY('.book-splash .toc'));

                        LOOP_OBJECT(QUERY('li.active', toc, true), function(i, el) {
                            SET_CLASS(el, 'active', true);
                        });
                        LOOP_OBJECT(QUERY('a', toc, true), function(i, el) {
                            if (el.href) {
                                SET_ATTRS(el, {
                                    "href": el.href.toString()
                                });
                            }
                        });

                        function rewrite_imgs(_el) {
                            LOOP_OBJECT(QUERY('img', _el, true), function(i, el, img) {
                                img = CLONE_ELEMENT(atpl, {
                                    "href": el.src.toString()
                                });
                                //imgs.push(img.href.toString()); // url
                                SET_ATTRS(el, {
                                    "src": img.href.toString()
                                });
                            });
                        }
                        function resolve_images(_el, img) {
                            img = !!WEBP_SUPPORT;
                            WEBP_SUPPORT = false;
                            LOOP_OBJECT(QUERY('img[data-z]', _el, true), function(i, el) {
                                DO_RESOLVE_IMAGE(el);
                                SET_ATTRS(el, {
                                    "data-z": null,
                                    "data-zd": null
                                });
                            });
                            WEBP_SUPPORT = !!img;    
                        }

                        resolve_images(toc);
                        rewrite_imgs(toc);

                        resolve({
                            toc: toc.innerHTML
                        });

                        /*LOOP_OBJECT(QUERY('a', toc, true), function(i, el) {
                            SET_ATTRS(el, {
                                "href": el.href.toString()
                            });
                        });*/

                    });
                });
            });
        });
    }

    win.epubExport = EXPORT_EPUB;
    win.tocExport = EXPORT_TOC;

    function PRINT_BOOK(tpls) {
        if (BOOK_MODE_RENDERED) {
            // ignore
            return;
        }

        //requestAnimationFrame(function(tpls) {

        // splash images first
        if (IS_UNDEFINED(BOOK_MODE_RENDERED)) {
            BOOK_SPLASH = QUERY('#book-splash');
            BOOK_SPLASH = FIRST(CLONE_ELEMENT(BOOK_SPLASH.content));

            AFTER(QUERY('#sub-nav'), BOOK_SPLASH);

            tpls = QUERY('[data-template]', BOOK_SPLASH, true);
            if (tpls.length) {
                LOOP_OBJECT(tpls, function(i, el, tplid, tpl) {
                    tplid = GET_ATTR(el, 'data-template');
                    tpl = QUERY(tplid);
                    if (tpl) {
                        APPEND_CHILD(el, CLONE_ELEMENT(tpl.content));
                    } else {
                        el.innerHTML = 'template not found: ' + tplid;
                    }
                });
            }

            BOOK_VIDEO_IMG = CREATE_ELEMENT('a', {
                "class": "show-print",
                "target": "_blank"
            }, CREATE_ELEMENT('img'));

            // videos
            var iframes = Array.from(QUERY('[data-z],[data-print]', false, true));
            if (iframes.length) {
                imgs = [];
                LOOP_OBJECT(iframes, function(i, el, src, m, yt, iframe) {
                    m = GET_ATTR(el, 'data-print');
                    if (el.nodeName === 'IFRAME' || m) {
                        src = GET_ATTR(el, 'data-z');
                        if (!src && !m) {
                            LOG(el, 'no src');
                            return;
                        }

                        iframe = PARENT(el);
                        if (HAS_CLASS(iframe, 'video-container')) {
                            SET_CLASS(iframe, 'hide-print');
                        } else {
                            SET_CLASS(el, 'hide-print');
                            iframe = false;
                        }

                        if (m) {
                            try {
                                m = JSON.parse(m);
                            } catch (err) {
                                return;
                            }
                            if (IS_STRING(m)) {
                                m = {
                                    "image": m
                                };
                            }
                            if (!m.url) {
                                m.url = src;
                            }
                        } else {
                            m = src.match(YOUTUBE_REGEX);
                            if (m && m[1]) {
                                m = {
                                    "url": "http://youtube.com/watch?v=" + m[1],
                                    "image": "https://img.youtube.com/vi/" + m[1] + "/0.jpg",
                                    "classes": "youtube-print"
                                };
                            } else {
                                return;
                            }
                        }

                        yt = CLONE_ELEMENT(BOOK_VIDEO_IMG, {
                            "href": m.url
                        });
                        if (m.classes) {
                            SET_CLASS(yt, m.classes);
                        }
                        requestAnimationFrame(function() {
                            SET_ATTRS(QUERY('img', yt), {
                                "src": m.image
                            });
                        });

                        AFTER(iframe || el, yt);

                    }
                    imgs.push(el);
                });
            } else {
                imgs = iframes;
            }
            RESOLVE_IMGS(imgs);

            if (!BOOK_TEMPLATES) {
                BOOK_TEMPLATES = {};
                LOOP_OBJECT(['chapter-number', 'chapter-block', 'chapter-cover'], function(i, key, srcel) {
                    srcel = QUERY('#book-' + key, BOOK_SPLASH);
                    if (!srcel) {
                        return ERROR('#book-' + key, BOOK_SPLASH);
                    }
                    BOOK_TEMPLATES[key] = CLONE_ELEMENT(srcel);
                    SET_ATTRS(BOOK_TEMPLATES[key], {
                        "id": null,
                        "class": "book-" + key
                    });
                });
            }

            BOOK_MODE_RENDERED = false;
        }

        if (!READER_SETUP_DONE) {
            console.info('🖨️', 'wait for reader index');
            return ON('reader-setup-done', PRINT_BOOK);
        }

        BOOK_MODE_RENDERED = true;

        SET_CLASS(HTML, 'book-print');

        // build TOC
        BOOK_TOC = QUERY('.book-toc .toc', BOOK_SPLASH);
        APPEND_CHILD(BOOK_TOC, CLONE_ELEMENT(READER_INDEX, {
            "id": null
        }));
        RESOLVE_IMGS(false, BOOK_TOC);

        LOOP_OBJECT(HTAGS, function(i, el, div, chapterNum, printConfig, readerInfo, chapterBlock, prevChild) {

            readerInfo = el.readerInfo;

            if (HTAG_REGEX.test(el.nodeName) && el.chapterIndex) {

                printConfig = readerInfo.print || {};

                // add page break
                chapterBlock = CLONE_ELEMENT(BOOK_TEMPLATES['chapter-block']);
                BEFORE(el, chapterBlock);
                APPEND_CHILD(chapterBlock, el);

                prevChild = PREV(chapterBlock);
                if (prevChild && prevChild.nodeName === 'HR') {
                    SET_CLASS(prevChild, 'hide-print');
                }

                if (readerInfo.chapter) {
                    SET_CLASS(chapterBlock, 'chapter');
                } else if (readerInfo.subchapter) {
                    SET_CLASS(chapterBlock, 'subchapter');
                }

                if (IS_UNDEFINED(printConfig.newpage) || printConfig.newpage) {
                    if (readerInfo.chapter || printConfig.newpage) {
                        SET_CLASS(chapterBlock, 'newpage');
                    }
                }

                // splash content
                if (printConfig.cover) {

                    // template
                    div = CLONE_ELEMENT(BOOK_TEMPLATES['chapter-cover']);
                    if (/^#/.test(printConfig.cover) && QUERY(printConfig.cover)) {
                        APPEND_CHILD(div, CLONE_ELEMENT(QUERY(printConfig.cover).content));
                    } else {
                        APPEND_CHILD(div, PARSE_HTML(printConfig.cover));
                    }
                    BEFORE(el, div);
                }

                // chapter number disabled
                if (!IS_UNDEFINED(printConfig.chapter) && !printConfig.chapter) {

                } else {
                    chapterNum = CLONE_ELEMENT(BOOK_TEMPLATES['chapter-number']);
                    APPEND_CHILD(QUERY('span', chapterNum), TEXT(el.chapterIndex));
                    BEFORE(el, chapterNum);
                }
            }
        });

        console.info('🖨️', 'book print mode enabled');
        //});
    }

    function VIEWPORT_UPDATE() {
        VIEWPORT_HEIGHT = win.innerHeight;
        SET_STYLE(HTML, {
            "--maxheight": 'calc(' + VIEWPORT_HEIGHT + 'px - 150px)'
        });
        EMIT('vp');
    }

    function RESOLVE_IMGS(imgs, parent) {

        IMGS = imgs || Array.from(QUERY('img[data-z]', parent || false, true));
        LOOP_OBJECT(IMGS, function(i, el) {
            DO_RESOLVE_IMAGE(el);
        });
    }

    ADD_EVENT(['resize', 'orientationchange'], function(e) {
        VIEWPORT_UPDATE();
    }, win);

    var read_status = {
        scroll: false,
        time: false
    };
    var scroll_watch = ADD_EVENT('scroll', function(e) {
        if (!read_status.scroll) {
            read_status.scroll = true;
            //EMIT('read-status', 'scroll');
            scroll_watch();
        }
    }, win);
    setTimeout(function() {
        //EMIT('read-status', 'time');
    },3000);
    ON('read-status', function(status) {
        read_status[status] = true;
        if (!READER_DOWNLOAD_CONTAINER && read_status.scroll && read_status.time) {
            //READER_SHOW('download_promo', false, true);
        }
    });

    win.resolveImgs = function() {
        return PROMISE(function(resolve, reject, resolved, resolveTimeout) {

            var loading = [];
            LOOP_OBJECT(QUERY('img[data-z]', false, true), function(i, el, options) {

                // resolved
                if (el.webp_resolved) {

                    if (!el.complete) {
                        // still loading
                        loading.push(PROMISE(function(_resolve, _reject) {
                            ADD_EVENT_ONCE(['load', 'error'], function(e) {
                                _resolve();
                            }, target, options);
                        }));
                    }
                }
            });

            if (loading.length) {

                // 10 seconds
                resolveTimeout = setTimeout(function() {
                    if (!resolved) {
                        resolved = true;
                        resolve();
                    }
                }, 10000);

                Promise.all(loading)
                    .then(function() {
                        if (resolveTimeout) {
                            clearTimeout(resolveTimeout);
                        }
                        if (!resolved) {
                            resolved = true;
                            resolve();
                        }
                    });
            } else {
                resolve();
            }
        });
    }

    var loaded_recaptcha;
    function LOAD_RECAPTCHA(callback) {
        if (loaded_recaptcha) {
            if (callback) {
                callback();
            }
            return;
        }
        if (loaded_recaptcha === false) {
            return ON('recaptcha', function() {
                if (callback) {
                    callback();
                }
            });
        }
        loaded_recaptcha = false;
        $async('https://www.google.com/recaptcha/api.js?render=explicit')
            .then(function(i) {
                i = setInterval(function() {
                    if (grecaptcha) {
                        loaded_recaptcha = true;
                        if (i) {
                            clearTimeout(i);
                            grecaptcha.ready(function() {
                                if (callback) {
                                    callback();
                                }
                                EMIT('recaptcha');
                            });
                        }
                    }
                }, 0);
            });
    }

    win.commentSubmit = function(token) {
        QUERY("#comment-form").submit();
    }

    ADD_EVENT()

    if (document.cookie.indexOf('ebook-pdf-printer=') !== -1) {
        BOOK_PRINTER = true;
    }

    DOMREADY(function() {
        BODY = doc.body;

        if (BOOK_PRINTER) {
            RESOLVE_IMGS();
        }

        VIEWPORT_UPDATE();

        var loaded_comments;
        OBSERVER(function(entry, el) {
                if (entry.isIntersecting) {
                    if (!loaded_comments) {
                        if (!BOOK_PRINTER) {
                            $async('/css/comment.css');
                            LOAD_RECAPTCHA(function(formid) {
                                LOOP_OBJECT(QUERY('form.comment .g-recaptcha', false, true), function(i, el, key, callback) {
                                    key = GET_ATTR(el, 'data-sitekey');
                                    callback = GET_ATTR(el, 'data-callback');
                                    grecaptcha.render(el, {
                                        'sitekey': key,
                                        'callback': function() {
                                            QUERY("#comment-form").submit();
                                        }
                                        //callback
                                    });
                                });
                            });
                        }
                        loaded_comments = true;
                    }
                }
            }, {
                threshold: 0,
                rootMargin: '0px'
            },
            QUERY('#comment-form', false, true)
        );

        requestAnimationFrame(function() {
            if (doc.location.hash === '#comment-form') {
                SCROLLTO(-1, 80);
            }
        });

        try {
            DARK_MODE = LOCALSTORAGE_GET_JSON('dark');
            DARK_MODE = (!IS_UNDEFINED(DARK_MODE)) ? DARK_MODE : OS_DARK_MODE;
            if (DARK_MODE) {
                LOAD_DARK_THEME();
                LOAD_STARS_BG();
            }
            TOGGLE_DARK_THEME();
        } catch (err) {
            console.error(err)
        }

        ADD_EVENT('change', function(e) {
            console.log('dark mode change', e.matches);
            EMIT('dark', !!e.matches);
        }, DARK_MODE_MQ);

        ADD_EVENT('click', function(e) {
            EMIT('dark', !DARK_MODE);
        }, QUERY('#darkswitch > span'));

        if (!BOOK_PRINTER) {
            IMGS = Array.from(QUERY('[data-z],[data-anim]', false, true));
            var imgObserver = OBSERVER(function(entry, el) {
                    if (entry.isIntersecting) {
                        RESOLVE_IMAGE(el);
                        imgObserver.unobserve(el);
                        IMGS = IMGS.filter(function(_el) {
                            return el !== _el;
                        });
                    }
                }, {
                    threshold: 0,
                    rootMargin: '0px'
                },
                IMGS
            );

            // add images to observer
            ON('i', function(img) {
                if (!IS_ARRAY(img)) {
                    img = [img];
                }
                LOOP_OBJECT(img, function(i, el) {
                    OBSERVE(el, imgObserver);
                    IMGS.push(el);
                });
            });

            var loaded_twitter;
            OBSERVER(function(entry, el) {
                    if (entry.isIntersecting) {
                        if (!BOOK_PRINTER) {
                            if (!loaded_twitter) {
                                loaded_twitter = true;
                                $async('https://platform.twitter.com/widgets.js');
                            }
                        }
                    }
                }, {
                    threshold: 0,
                    rootMargin: '0px'
                },
                QUERY('.twitter-tweet', false, true)
            );
            // 
        }

        var menubtn = doc.getElementById('menubtn');
        if (menubtn) {
            ADD_EVENT('click', function(e) {
                pagemenu();
            }, menubtn);
        }
        var donateform = QUERY('form.donate');
        if (donateform) {
            ADD_EVENT('submit', function(e) {
                if (donateform.querySelector('input').value == '') {
                    e.preventDefault();
                    alert('Please enter an e-mail address...')
                    donateform.querySelector('input').focus();
                }

            }, donateform);
        }


        //$lazy('img[data-z],iframe[data-z]');
        //if (doc.getElementById('tongassvideo')) {
        /*$lazy('#tongassvideo', function() {
          $lazy('#forthewild', 1);
        });*/
        // @todo
        //}

        var videos = QUERY('.video-container [data-video]', false, true);
        if (videos.length) {
            ADD_EVENT('click', function(e, el, config, iframe, attrs) {
                e.preventDefault();
                el = e.target;

                config = GET_ATTR(el, 'data-video');
                while (el && !config) {
                    el = PARENT(el);
                    config = GET_ATTR(el, 'data-video');
                }

                SET_CLASS(PARENT(el), 'playing');
                config = JSON.parse(GET_ATTR(el, 'data-video'));
                attrs = {
                    width: 720,
                    height: 405,
                    src: "https://www.youtube.com/embed/" + config.id + '?autoplay=1',
                    title: "YouTube video player",
                    frameborder: "0",
                    allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture",
                    allowfullscreen: true
                }
                if (config.attrs) {
                    attrs = Object.assign(attrs, config.attrs);
                }
                iframe = CREATE_ELEMENT('iframe', attrs);
                REPLACE(el, iframe);
            }, videos);

            LOOP_OBJECT(videos, function(i, el, container) {
                container = PARENT(el);
                SET_CLASS(container, 'imgplay');
            }, videos);
        }

        // get the sticky element
        if (win.IntersectionObserver) {
            var stickyElm = QUERY('#sub-nav');

            var observer = new win.IntersectionObserver(function(entries) {
                var e = entries[0];
                e.target.classList.toggle('isSticky', e.intersectionRatio < 1);
            }, {
                threshold: [1],
                rootMargin: '-1px 0px 0px 0px'
            });

            observer.observe(stickyElm);
        }

        var l = QUERY('meta[http-equiv="content-language"]');

        var explnks = QUERY('blockquote .expandlink', false, true);
        if (explnks && explnks.length) {
            explnks.forEach(function(el) {
                ADD_EVENT('click', function(e) {
                    e.preventDefault();
                    expand_blockquote(el);
                }, el);

                var hash_key = el.getAttribute('data-hash');
                if (hash_key && doc.location.hash && doc.location.hash.split('#')[1] === hash_key) {
                    expand_blockquote(el);
                }
            });
        }

        var rfn = QUERY('.rightsnature');
        if (rfn) {
            rfn.onclick = function() {
                gtag('event', 'newsletter_rightsfornature', {
                    'event_category': 'newsletter',
                    'event_label': 'Newsletter Rights for Nature'
                });
            }
        }
        var lnks = QUERY('a[target="_blank"]', false, true);
        if (lnks && lnks.length) {
            ADD_EVENT('click', function(e) {
                gtag('event', 'ext_link', {
                    'event_category': (el.classList.contains('quote')) ? 'quote' : 'other',
                    'event_label': el.href
                });
            }, lnks);
        }

        var donatelinks = QUERY('p.donate a', false, true);
        if (donatelinks && donatelinks.length && doc.getElementById('donate')) {
            ADD_EVENT('click', function(e) {
                e.preventDefault(true);
                SCROLLTO(doc.getElementById('donate'), 80);

                gtag('event', 'donate_button', {
                    'event_category': 'donate',
                    'event_label': 'Donate Button'
                });
            }, donatelinks);

            /*
        QUERY('div.donatelnk a').onclick = function(e) {
            gtag('event', 'donate_stripe_link', {
              'event_category' : 'donate',
              'event_label' : 'Donate Stripe'
            });
        }
        QUERY('div.donatelnk blockquote').onselectstart = function(e) {
            gtag('event', 'donate_select_iban', {
              'event_category' : 'donate',
              'event_label' : 'Donate Select IBAN'
            });
            console.log('donate_select_iban', {
              'event_category' : 'donate',
              'event_label' : 'Donate Select IBAN'
            })
        }
      */
            var entryTimeout;
            QUERY('form.donate input').onfocus = QUERY('form.donate input').onkeypress = function(e) {
                if (entryTimeout) {
                    clearTimeout(entryTimeout);
                }
                entryTimeout = setTimeout(function() {
                    gtag('event', 'donate_form_entry', {
                        'event_category': 'donate',
                        'event_label': 'Donate Form Email Entry'
                    });
                }, 1000);
            }
        }

        var dark_before_print;
        var print_view_state;

        function PRINT_VIEW(state, currentArticleSlug) {

            if (state) {

                BOOK_PRINTER = true;

                if (print_view_state) {
                    return;
                }
                print_view_state = true;

                PRINT_BOOK();
                dark_before_print = DARK_MODE;
                EMIT('dark', false);

                console.info('🖨️', 'print view enabled');
            } else {

                BOOK_PRINTER = false;

                if (print_view_state === false) {
                    return;
                }
                print_view_state = false;
                DARK_MODE = dark_before_print;
                EMIT('dark', DARK_MODE);
            }

            // local links
            var links = Array.from(QUERY('a[href^="/"]', QUERY('#main-content'), true));
            if (links.length) {

                LOG(links, window.articleSlug);
                imgs = [];
                LOOP_OBJECT(links, function(i, el, src, m, yt, iframe) {
                    if (BOOK_PRINTER) {
                        src = GET_ATTR(el, 'href');
                        m = src.match(/^\/([^\/]+)\/(\#.*)?$/);
                        if (m && m[1] !== window.articleSlug) {
                            SET_ATTRS(el, {
                                "data-href": src,
                                "href": "/book/" + m[1] + ".html"
                            });
                        }
                    } else {
                        src = GET_ATTR(el, 'data-href');
                        if (src) {
                            SET_ATTRS(el, {
                                "href": src
                            });
                        }
                    }
                });
            }
        }
        ADD_EVENT(['beforeprint', 'afterprint'], function(e) {
            EMIT('print', !(e.type === 'afterprint'));
            if (e.type === 'beforeprint') {
                //alert('🖨️ Images in your print\n\nThis website uses lazyloaded images. To be certain that all images are included in your print, please start the print command twice.');
            }
        }, win);

        var PRINT_MQ = win.matchMedia('print');
        ADD_EVENT('change', function(e) {
            EMIT('print', !!e.matches);
        }, PRINT_MQ);

        ON('print', PRINT_VIEW);

        if (!!PRINT_MQ.matches) {
            EMIT('print', true);
        }

        READER = QUERY('#reader');
        READER_CONTAINER = QUERY('.reader-container');

        doc.body.appendChild(READER_CONTAINER);
        FOREWORD = READER.getAttribute('data-foreword');
        INDEX_BTN = READER.querySelector('.index-btn');

        STATUS_CUR = READER.querySelector('.status > .cur');
        STATUS_CUR_CHAPTER = STATUS_CUR.querySelector('span.chapter');
        STATUS_CUR_SUBCHAPTER = STATUS_CUR.querySelector('span.subchapter');

        STATUS_NEXT = READER.querySelector('.status > .next');
        STATUS_NEXT_PREV = STATUS_NEXT.querySelector('a.prev');
        STATUS_NEXT_NEXT = STATUS_NEXT.querySelector('a.next');

        STATUS_NEXT_CHAPTER = STATUS_NEXT.querySelector('span.chapter');
        STATUS_NEXT_SUBCHAPTER = STATUS_NEXT.querySelector('span.subchapter');

        //var READER_INDEX_CONTAINER = QUERY('.reader-index');
        READER_INDEX = QUERY('#reader-index');
        READER_INDEX_ITEMS;

        ADD_EVENT('click', function(e) {
            e.preventDefault();
            var type = (e.target === STATUS_NEXT_PREV) ? 'prev' : 'next';
            if (
                (e.target === STATUS_NEXT_PREV && STATUS_NEXT.classList.contains('no-prev')) ||
                (e.target === STATUS_NEXT_NEXT && STATUS_NEXT.classList.contains('no-next'))
            ) {
                return;
            }

            NAV_CHAPTER(e.target);

            gtag('event', 'reader_' + type, {
                'event_category': 'reader_nav',
                'event_label': type + ' nav'
            });
        }, [
            STATUS_NEXT_PREV, STATUS_NEXT_NEXT
        ]);

        var READER_INDEX_DOWNLOAD_FORM = QUERY('.reader-index .ebook-download');
        var READER_INDEX_DOWNLOAD_FORM_BUTTON = QUERY('button', READER_INDEX_DOWNLOAD_FORM);
        var READER_INDEX_DOWNLOAD_FORM_EMAIL = QUERY('input', READER_INDEX_DOWNLOAD_FORM);

        ADD_EVENT('click', function(e, email) {
            e.preventDefault();

            

            var target = e.target;
            SHOW_EBOOK_POPUP(false, (target === READER_INDEX_DOWNLOAD_FORM_EMAIL));

        }, [READER_INDEX_DOWNLOAD_FORM_BUTTON, READER_INDEX_DOWNLOAD_FORM_EMAIL]);

        ebook_download_setup = false;
        var READER_INDEX_CONTAINERS = Array.from(QUERY('.reader-index,.download-index', READER_CONTAINER, true));
        ADD_EVENT('click', function(e) {
            var el = e.target;
            if (!el) {
                return;
            }

            if (READER_INDEX_CONTAINERS.indexOf(el) === -1 && !HAS_CLASS(el, 'reader-container')) {
                while (el !== BODY) {
                    if (HAS_CLASS(el, 'reader-container') || HAS_CLASS(el, 'popup-w')) {
                        return;
                    }
                    el = PARENT(el);
                    if (!el) {
                        return;
                    }
                }
            }
            READER_SHOW(false, false);
        }, BODY);

        var loaded_all_imgs;
        ADD_EVENT('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            READER_SHOW('index');
            if (!loaded_all_imgs) {
                RESOLVE_IMGS(); //$lazy('z', 1);
                loaded_all_imgs = true;
            }

            /*if (!ebook_download_setup) {
                ebook_download_setup = true;

                LOAD_RECAPTCHA(function(el, key, form, captchaEl, emailEl) {

                    key = GET_ATTR(QUERY('#download-email', READER_DOWNLOAD_CONTAINER), 'data-sitekey');
                    APPEND_CHILD(READER_CONTAINER, READER_INDEX_DOWNLOAD_FORM_BUTTON);
                    captchaEl = grecaptcha.render(READER_INDEX_DOWNLOAD_FORM_BUTTON, {
                        'sitekey': key,
                        'callback': function(token, email) {
                            email = READER_INDEX_DOWNLOAD_FORM_EMAIL.value.trim();
                            if (email === '') {
                                SET_CLASS(READER_INDEX_DOWNLOAD_FORM_EMAIL, 'error');
                                ADD_EVENT_ONCE(['keypress', 'change'], function() {
                                    SET_CLASS(READER_INDEX_DOWNLOAD_FORM_EMAIL, 'error', true);
                                }, READER_INDEX_DOWNLOAD_FORM_EMAIL);
                                return READER_INDEX_DOWNLOAD_FORM_EMAIL.focus();
                            }

                            var el = QUERY('#download-email', READER_DOWNLOAD_CONTAINER);
                            var form = PARENT(el);
                            var _emailEl = QUERY('input[type="email"]', form);
                            _emailEl.value = email;
    
                            DOWNLOAD_EMAIL(email, token);

                            READER_SHOW('download', false, true);
                        }
                        //callback
                    });
                    APPEND_CHILD(READER_INDEX_DOWNLOAD_FORM, READER_INDEX_DOWNLOAD_FORM_BUTTON);
    
                    ADD_EVENT('keypress', function(e) {
                        if (e.key === 'Enter') {
                            grecaptcha.execute(captchaEl);

                            READER_SHOW('download', false, true);

                            window.open('/book/' + window.articleSlug + '.html');
                        }
                    }, READER_INDEX_DOWNLOAD_FORM_EMAIL);

                });
            }*/
            
        }, INDEX_BTN);

        var lgsel = QUERY('#select-lg');
        if (lgsel) {
            ADD_EVENT('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                READER_SHOW('lg');
            }, lgsel);
        }

        var downloadbtn = QUERY('#download');
        if (downloadbtn && !HAS_ATTR(downloadbtn, 'data-no-download')) {

            /*var defaultDownloadConfig = GET_ATTR(downloadbtn, 'data-config');
            if (defaultDownloadConfig) {
                try {
                    defaultDownloadConfig = JSON.parse(defaultDownloadConfig);
                } catch (err) {
                    defaultDownloadConfig = false;
                }
            }
            if (!defaultDownloadConfig || typeof defaultDownloadConfig !== 'object') {
                defaultDownloadConfig = {};
            }
            defaultDownloadConfig = Object.assign({
                "content": "article",
                "screen": "A4",
                "type": ""
            }, defaultDownloadConfig);*/

            ADD_EVENT('click', function(e, a) {
                e.preventDefault();
                e.stopPropagation();

                a = e.target;
                while (a.nodeName !== 'A' && a !== BODY) {
                    a = PARENT(a);
                }

                /*var config = GET_ATTR(a, 'data-download-config');
                var setDefaultConfig = false;
                if (config) {
                    try {
                        config = JSON.parse(config);
                        if (config && typeof config === 'object') {
                            config = Object.assign({}, defaultDownloadConfig, config);
                        }
                    } catch (err) {
                        config = false;
                    }
                } else {
                    config = defaultDownloadConfig;
                    setDefaultConfig = true;
                }*/

                SHOW_EBOOK_POPUP();

                /*showmenu(true, function() {
                    READER_SHOW('download', config, setDefaultConfig);
                });*/
            }, [downloadbtn]); // QUERY('a.bookdl')
        }

        var showsocial = QUERY('#show-social');
        if (showsocial) {
            ADD_EVENT('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                LOAD_SOCIAL();

                SHOW_SOCIAL_POPUP();

                //READER_SHOW('social', false);

            }, showsocial);
        }


        // reader
        var main = QUERY('.main');
        var hnames = ['h1', 'h2', 'h3', 'h4', 'h5', 'p'];
        var hquery = [
            '.reader-link' // links
        ];
        hnames.forEach(function(name) {
            hquery.push(name + '.chapter,' + name + '.subchapter');
        });

        if (HAS_CLASS(BODY, 'no-reader')) {
            HTAGS = [];
        } else {

            HTAGS = Array.from(main.querySelectorAll(hquery.join(',')));

            if (HTAGS.length === 0) {
                var hindex = 1;
                var h1big = main.querySelectorAll('h1.bighead');
                if (h1big.length === 0) {
                    hindex = 2;
                    h1big = main.querySelectorAll('h2.bighead');
                }
                if (h1big.length === 0) {
                    hindex = 3;
                    h1big = main.querySelectorAll('h3.bighead');
                }
                if (h1big.length > 0) {
                    hbig = Array.from(main.querySelectorAll('.bighead'));
                    h1big = Array.from(h1big);
                    h1first = hbig.indexOf(h1big[0])

                    var q = [];
                    for (var i = 1; i <= 5; i++) {
                        if (i <= hindex) {
                            continue;
                        }
                        q.push('h' + i + '.bighead');
                    }
                    if (q.length) {
                        h2big = main.querySelectorAll(q.join(','));
                    }

                    h1big.forEach(function(h1) {
                        h1.classList.add('chapter');
                    });

                    if (h2big.length) {
                        h2big = Array.from(h2big);
                        h2big.forEach(function(h1) {
                            var h2index = hbig.indexOf(h1);
                            h1.classList.add((h2index < h1first) ? 'chapter' : 'subchapter');
                        });
                    }
                }
                HTAGS = Array.from(main.querySelectorAll(hquery.join(',')));
            }

            var chapterLinks = main.querySelectorAll('[data-chapter-link]');
            ADD_EVENT('click', function(e, node, el) {
                e.preventDefault();
                node = e.target;
                while (node.nodeName !== 'A') {
                    node = node.parentElement;
                }
                el = QUERY(node.getAttribute('data-chapter-link'));
                if (el) {

                    NAV_CHAPTER(el);

                    gtag('event', 'reader_link_' + el.id, {
                        'event_category': 'reader_link_selection',
                        'event_label': CHAPTER_TITLE(el)
                    });
                }
            }, chapterLinks);
        }

        if (HTAGS.length === 0) {
            SET_CLASS(READER,'nochapters');
        } else {

            var lang = doc.documentElement.getAttribute('lang');
            var formatter;
            try {
                formatter = new Intl.NumberFormat(lang, {
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                });
            } catch (err) {

            }

            var template_li = doc.createElement('li');
            var template_a = doc.createElement('a');
            var template_a_num = doc.createElement('span');
            var template_a_text = doc.createElement('span');
            SET_CLASS(template_a_num, 'num');
            template_a_text.classList.add('text');
            template_a.appendChild(template_a_num);
            template_a.appendChild(template_a_text);
            template_li.appendChild(template_a);

            requestAnimationFrame(function() {
                var li, a, a_num, a_text, chapter, subchapter, level, anim;

                var parents = [],
                    type, childs;
                var chapter_index = 0;
                var tag_html;
                var tag_info;
                var is_reader_link;
                var index_str;
                var classes;
                var chapterref = {};

                for (var i = 0, l = HTAGS.length; i < l; i++) {
                    tag = HTAGS[i];
                    if (!tag.id) {
                        tag.id = '_h' + i;
                    }

                    tag.type = false;

                    tag.index = i;
                    tag.setAttribute('data-index', i);
                    tag_html = false;
                    is_reader_link = false;
                    tag_info = false;
                    classes = false;

                    // chapter
                    if (tag.classList.contains('chapter')) {
                        chapter_index++;
                        parents = [
                            [chapter_index, 0]
                        ];
                        chapter = true;
                        level = false;
                        subchapter = false;
                    } else {
                        chapter = false;
                        level = tag.getAttribute('data-level');
                        if (level) {
                            level = parseInt(level);
                        }
                        subchapter = tag.classList.contains('subchapter');
                    }

                    li = template_li.cloneNode(true);
                    a = li.querySelector('a');
                    a_num = a.querySelector('span.num');
                    a_text = a.querySelector('span.text');

                    if (tag.classList.contains('reader-link')) {
                        is_reader_link = true;
                        try {
                            tag_info = JSON.parse(tag.getAttribute('data-reader-link'));
                        } catch (err) {
                            console.error(err);
                            continue;
                        }

                        if (tag_info.level) {
                            level = tag_info.level;
                        }
                        if (tag_info.classes) {
                            classes = (tag_info.classes instanceof Array) ? tag_info.classes : [tag_info.classes];
                        }

                        a_text.innerHTML = (tag_info.title) ? tag_info.title : tag.innerHTML;

                        if (tag_info.chapter) {
                            tag.readerInfo = tag_info;
                            a_text.innerHTML = ((tag_info.emoji) ? '<span class=e' + ((tag_info.emoji_anim) ? ' data-anim="' + tag_info.emoji_anim + '"' : '') + '>' + tag_info.emoji + '</span> ' : '') + ((tag_info.title) ? tag_info.title : tag.innerHTML);
                            tag.chapterTitle = a_text.innerHTML;
                            is_reader_link = false;
                            chapter_index++;
                            parents = [
                                [chapter_index, 0]
                            ];
                            chapter = true;
                            level = false;
                        } else if (!tag_info.subchapter) {
                            li.classList.add('reader-link');

                            tag.readerInfo = tag_info;
                            tag.type = 'link';
                            tag.chapterTitle = ((tag_info.emoji) ? '<span class=e' + ((tag_info.emoji_anim) ? ' data-anim="' + tag_info.emoji_anim + '"' : '') + '>' + tag_info.emoji + '</span> ' : '') + ' ' + a_text.innerHTML;
                        } else {
                            subchapter = true;
                            tag.readerInfo = tag_info;
                            a_text.innerHTML = ((tag_info.emoji) ? '<span class=e' + ((tag_info.emoji_anim) ? ' data-anim="' + tag_info.emoji_anim + '"' : '') + '>' + tag_info.emoji + '</span> ' : '') + ((tag_info.title) ? tag_info.title : tag.innerHTML);
                            tag.chapterTitle = a_text.innerHTML;
                            is_reader_link = false;
                        }
                    } else {

                        if (tag.hasAttribute('data-reader-info')) {
                            try {
                                tag_info = JSON.parse(tag.getAttribute('data-reader-info'));
                            } catch (err) {
                                console.error(err);
                                continue;
                            }
                        }

                        if (tag_info) {
                            if (tag_info.level) {
                                level = tag_info.level;
                            }
                            tag.readerInfo = tag_info;
                            a_text.innerHTML = ((tag_info.emoji) ? '<span class=e' + ((tag_info.emoji_anim) ? ' data-anim="' + tag_info.emoji_anim + '"' : '') + '>' + tag_info.emoji + '</span> ' : '') + ((tag_info.title) ? tag_info.title : tag.innerHTML);
                            tag.chapterTitle = a_text.innerHTML;

                            if (tag_info.classes) {
                                classes = (tag_info.classes instanceof Array) ? tag_info.classes : [tag_info.classes];
                            }

                        } else {
                            tag.chapterTitle = tag.innerHTML;
                            a_text.innerHTML = tag.innerHTML;
                        }
                    }

                    var title_el = doc.createElement('div');
                    title_el.innerHTML = tag.chapterTitle;
                    tag.chapterTitleText = (tag.readerInfo && tag.readerInfo.titleText) ? tag.readerInfo.titleText : title_el.innerText;
                    //tag.chapterIndexTitleText = (tag.readerInfo && tag.readerInfo.indexTitle) ? tag.readerInfo.indexTitle : tag.chapterTitleText;

                    if (tag.readerInfo && tag.readerInfo.indexTitle) {
                        a_text.innerHTML = tag_info.indexTitle;
                    }
                    if (tag.readerInfo && tag.readerInfo.emoji_anim) {
                        title_el = CLONE_ELEMENT(DIV, null, PARSE_HTML(tag.chapterTitle));
                        DO_RESOLVE_IMAGE(QUERY('[data-anim]', title_el), true);
                        tag.chapterTitle = title_el.innerHTML;
                    }

                    if (!isNaN(level) && level !== false) {
                        level--;
                    }
                    if (level < 0) {
                        level = 0;
                    }
                    if (!tag.readerInfo) {
                        tag.readerInfo = {};
                    }
                    tag.readerInfo.level = level;
                    if (chapter || tag.readerInfo.chapter) {
                        tag.readerInfo.chapter = true;
                    } else if (subchapter || tag.readerInfo.subchapter) {
                        tag.readerInfo.subchapter = subchapter;
                    }

                    if (!chapter) {

                        if (typeof parents[level] === 'undefined') {
                            if (typeof parents[level - 1] === 'undefined') {
                                console.error('invalid parent', tag, parents, level);
                                parents[level] = [-1, 0];
                            } else {
                                parents[level] = [parents[level - 1][1], 0];
                            }
                        }

                        if (is_reader_link) {
                            a_num.innerHTML = '&nbsp;';
                            a_num_sub = a_num.cloneNode(true);
                            SET_CLASS(a_num_sub, 'e');
                            a_num_sub.innerHTML = (tag_info.emoji) ? tag_info.emoji : '📌';
                            if (tag_info.emoji && tag_info.emoji_anim) {
                                SET_ATTRS(a_num_sub, {
                                    "data-anim": tag_info.emoji_anim
                                });
                            }
                            a_num.parentNode.insertBefore(a_num_sub, a_num.nextSibling);
                        } else {

                            while (parents[level + 1]) {
                                parents.pop();
                            }

                            parents[level][1]++;

                            index_str = [];

                            //childs = parents.slice(1);
                            parents.reverse().forEach(function(parent) {
                                a_num_sub = a_num.cloneNode(true);
                                a_num_sub.innerHTML = ((formatter) ? formatter.format(parent[1]) : parent[1]) + '.';
                                a_num.parentNode.insertBefore(a_num_sub, a_num.nextSibling);
                                index_str.push(a_num_sub.innerHTML);
                            });
                            parents.reverse();
                            a_num.innerHTML = ((formatter) ? formatter.format(parents[0][0]) : parents[0][0]) + '.';

                            index_str.reverse();
                            index_str.unshift(a_num.innerHTML);

                            tag.chapterIndex = index_str.join('');
                        }

                        li.classList.add('subchapter');

                        if (classes) {
                            classes.forEach(function(c) {
                                li.classList.add(c);
                            });
                        }

                        if (level > 0) {
                            li.classList.add('l' + (level + 1));
                        }
                    } else {
                        li.classList.add('chapter');
                        a_num.innerHTML = ((formatter) ? formatter.format(chapter_index) : chapter_index) + '.';
                        tag.chapterIndex = a_num.innerHTML;
                    }

                    chapterref[tag.id] = tag;

                    var href;
                    if (tag.readerInfo && tag.readerInfo.link) {
                        href = tag.readerInfo.link;
                    } else {
                        href = "#" + tag.id
                    }

                    SET_ATTRS(a, {
                        "data-index": i,
                        "href": href
                    });

                    READER_INDEX.appendChild(li);
                }

                imgs = Array.from(QUERY('img[data-d],img[data-z],img[data-zd],[data-anim]', READER_INDEX, true));
                EMIT('i', imgs);
                /*LOOP_OBJECT(imgs, function(i, el) {
                    RESOLVE_IMAGE(el);
                });*/

                var chapterLinks = Array.from(QUERY('a.chapter-link', false, true));
                LOOP_OBJECT(chapterLinks, function(i, el, id, tag, span) {
                    id = GET_ATTR(el, 'data-chapter-id');
                    tag = chapterref[id];
                    if (tag) {
                        span = QUERY('span', el);
                        if (span) {
                            span.innerHTML = tag.chapterIndex;
                        }
                        SET_ATTRS(el, {
                            "data-index": GET_ATTR(tag, "data-index"),
                            "title": tag.chapterTitleText
                        })
                    }
                });

                READER_INDEX_ITEMS = Array.from(READER_INDEX.querySelectorAll('[data-index]'));

                if (doc.location.hash) {
                    (function() {
                        var tag;
                        try {
                            tag = QUERY(doc.location.hash.toString());
                            if (tag) {
                                var index = GET_INDEX(tag);
                                if (!isNaN(index) && index !== false) {
                                    tag = HTAGS[index];
                                } else {
                                    return;
                                }
                            } else {
                                return;
                            }
                        } catch (err) {
                            console.error('hash', err);
                            return;
                        }

                        function doScrollHash() {

                            var info = tag.readerInfo;
                            if (info && info.expand) {
                                var explink = QUERY(info.expand);
                                if (explink) {
                                    expand_blockquote(explink, true);
                                    info.expand = false;
                                }
                            }

                            //NAV_CHAPTER(tag);
                            SCROLLTO(tag, 80, {});
                        }

                        //$lazy('z', 1);
                        RESOLVE_IMGS();

                        var title = tag.chapterTitleText || tag.innerText;
                        if (win.history) {
                            win.history.replaceState('', title, doc.location.pathname + '#' + tag.id);
                        }
                        doc.title = title;

                        doScrollHash();
                        requestAnimationFrame(function() {
                            doScrollHash();
                        });
                        setTimeout(function() {
                            doScrollHash();
                        }, 1000);
                    })();
                }

                if (chapterLinks.length) {
                    ADD_EVENT('click', function(e) {
                        e.preventDefault();
                        var el = e.target;
                        while (!el.classList.contains('chapter-link') && el.tagName !== 'A') {
                            el = el.parentElement;
                        }

                        var index = GET_INDEX(el);
                        if (!isNaN(index) && index !== false) {
                            var active = HTAGS[index];

                            NAV_CHAPTER(el);

                            gtag('event', 'reader_chapter_link_' + active.id, {
                                'event_category': 'reader_chapter_link',
                                'event_label': CHAPTER_TITLE(active)
                            });
                        }

                    }, chapterLinks);
                }

                ADD_EVENT('click', function(e) {
                    e.preventDefault();
                    var el = e.target;
                    while (!el.classList.contains('reader-link') && el.tagName !== 'A') {
                        el = el.parentElement;
                    }

                    var index = GET_INDEX(el);
                    if (!isNaN(index) && index !== false) {
                        var active = HTAGS[index];

                        var info = active.readerInfo;
                        if (info && info.link) {
                            if (info.target && info.target === '_blank') {
                                win.open(info.link);
                            } else {
                                doc.location.href = info.link;
                            }
                            return;
                        }

                        NAV_CHAPTER(el);

                        gtag('event', 'reader_index_' + active.id, {
                            'event_category': 'reader_index_selection',
                            'event_label': CHAPTER_TITLE(active)
                        });
                    }

                }, READER_INDEX_ITEMS);

                READER_SETUP_DONE = true;
                EMIT('reader-setup-done');
            });

            ADD_EVENT('scroll', function() {

                // scroll
                var scrollTop = win.scrollY; // Current vertical scroll position from the top
                var docHeight = BODY.offsetHeight; // Total height of the document
                var winHeight = win.innerHeight; // Height of the viewport
                var scrollPercent = (scrollTop / (docHeight - winHeight)) * 100; // Calculate the scroll percentage

                requestAnimationFrame(function() {
                    SET_STYLE(READER, {
                        "border-image-source": 'linear-gradient(to right, var(--readerbarfill) ' + scrollPercent + '%, var(--readerbar) 0%)'
                    });
                });

                if (NAV_SCROLL) {
                    return;
                }
                HANDLE_SCROLL();
            }, window);

            NAV_SCROLL;
            ADD_EVENT('wheel', function(e) {
                if (nav_scroll_timeout) {
                    clearTimeout(nav_scroll_timeout);
                }
                if (nav_scroll_completed) {
                    nav_scroll_completed();
                }
                NAV_SCROLL = false;
            }, window);

            ADD_EVENT('keydown', function(e) {
                if (READER_VISIBLE) {
                    if (event.key === "Escape") {
                        return READER_SHOW(false, false);
                    }

                    if (READER_VISIBLE === 'index') {
                        var scrollContainer = READER_INDEX.parentElement;
                        if (event.key === "ArrowUp") {
                            scrollContainer.scrollTop -= 50;
                        } else if (event.key === "ArrowDown") {
                            scrollContainer.scrollTop += 50;
                        }
                    }
                }
            }, doc);

            HANDLE_SCROLL()

            ADD_EVENT('keydown', function(e) {
                if (
                    ['INPUT', 'TEXTAREA', 'SELECT'].indexOf(e.target.tagName) !== -1 ||
                    e.altKey ||
                    e.ctrlKey
                ) {
                    return false;
                }
                if (e.keyCode == 37) {
                    if (win.pageXOffset <= 0) {
                        e.preventDefault();
                        var index = GET_INDEX(STATUS_NEXT_PREV);
                        if (index === 0 && CURRENT_NAV && GET_INDEX(CURRENT_NAV) === index) {
                            // to top
                            SCROLLTO();
                            CURRENT_NAV = false;
                        }
                        /*else if (index === false) {
                                         // index
                                         //SCROLLTO(false, doc.body.scrollHeight);
                                       }*/
                        else {
                            NAV_CHAPTER(STATUS_NEXT_PREV, false, true);
                        }
                    }
                } else if (e.keyCode == 39) {
                    var totalWidth = doc.body.scrollWidth;
                    var maxScroll = totalWidth - win.innerWidth;

                    if (win.pageXOffset >= maxScroll) {
                        e.preventDefault();
                        NAV_CHAPTER(STATUS_NEXT_NEXT);
                    }
                }
            }, doc);

        }

        // todo print event
        if (BOOK_PRINTER) {
            PRINT_BOOK();
        }

        if (doc.location.hash === '#print') {
            READER_SHOW('download', false, true);
        }

    });

})(window, document);