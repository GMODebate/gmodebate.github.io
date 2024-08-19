(function(doc) {

    var addEventListenerSupported = (doc.addEventListener);
    
        
        function GET_QR(qrOptions, maxTypeNumber, callback, qrCode, tetry) {
            retry = true;
            while (retry) {
                if (typeof QRCodeStyling === 'undefined') {
                    return setTimeout(function() {
                        GET_QR(qrOptions, maxTypeNumber, callback, qrCode, tetry);
                    }, 1);
                }
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
            callback(qrCode);
        }
    
        function E() {
            // Keep this empty so it's easier to inherit from
            // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
        }
    
        E.prototype = {
            on: function(name, callback, ctx) {
                if (name instanceof Array) {
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
                if (name instanceof Array) {
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
    
        var dlcookieregex = /book-download/;
    
        function SLICE(args, start) {
            if (!start) {
                start = 0;
            }
            return Array.prototype.slice.call(args, start);
        }
    
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
            },0);
        }
      }
    
      function addEvent(trigger, handler, el, options) {
        try {
            el = el || document;
            options = (options === -1) ? { passive: true, once: true } : options;
    
            if (Array.isArray(trigger)) {
                trigger.forEach(_trigger => addEvent(_trigger, handler, el, options));
            } else {
                el = (!Array.isArray(el) && !(el instanceof NodeList)) ? [el] : el;
    
            el.forEach(_el => {
                if (addEventListenerSupported) {
                    let passive = ['touchstart'].includes(trigger);
                    _el.addEventListener(trigger, handler, passive ? Object.assign({ passive: true }, options || {}) : (options || false));
                } else if (_el.attachEvent) {
                    if (trigger === 'DOMContentLoaded') { trigger = 'load'; _el = window; }
                    _el.attachEvent('on' + trigger, handler);
                } else { try { _el['on' + trigger] = handler; } catch (e) {} }
            });
        }
    
        return () => removeEvent(trigger, handler, el);
        } catch (e) { console.error(e); }
    }
    
      var dlcontainer = doc.getElementById('download-links');
      var primary = dlcontainer.querySelector('.btn-primary');
      var btns = dlcontainer.querySelectorAll('.btn');
    
      var loading = doc.querySelector('.status .loading');
      var completed = doc.querySelector('.status .completed');
    
      function load_qr(btn) {
        requestAnimationFrame(function() {
    
    GET_QR({
                "width": 800,
                "height": 800,
                "data": btn.href.toString(),
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
            }, 30, function(qr) {
                document.getElementById('qr').innerHTML = '';
                qr.append(document.getElementById('qr'));
    
                addEvent('click', function(e) {
                   qr.download('png');
                  }, document.getElementById('qr'));
            });
    });
      }
    
      addEvent('click', function(e) {
    
        load_qr(e.target);
      }, btns);
    
      addEvent('mouseover', function(e) {
    
        load_qr(e.target);
    
      }, btns);
    
      if (primary) {
        primary.click();
      } else {
        primary = btns[0];
      }
    
      load_qr(primary);
    
    
    })(document);