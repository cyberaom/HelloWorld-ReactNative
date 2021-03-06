exports["Puppet"] = /******/ (function(modules) {
  // webpackBootstrap
  /******/ // The module cache
  /******/ var installedModules = {}; // The require function

  /******/ /******/ function __webpack_require__(moduleId) {
    /******/ // Check if module is in cache
    /******/ if (installedModules[moduleId])
      /******/ return installedModules[moduleId].exports; // Create a new module (and put it into the cache)

    /******/ /******/ var module = installedModules[moduleId] = {
      /******/ exports: {},
      /******/ id: moduleId,
      /******/ loaded: false
      /******/
    }; // Execute the module function

    /******/ /******/ modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    ); // Flag the module as loaded

    /******/ /******/ module.loaded = true; // Return the exports of the module

    /******/ /******/ return module.exports;
    /******/
  } // expose the modules object (__webpack_modules__)

  /******/ /******/ __webpack_require__.m = modules; // expose the module cache

  /******/ /******/ __webpack_require__.c = installedModules; // __webpack_public_path__

  /******/ /******/ __webpack_require__.p = ""; // Load entry module and return exports

  /******/ /******/ return __webpack_require__(0);
  /******/
})(
  /************************************************************************/
  /******/ [
    /* 0 */
    /***/ function(module, exports, __webpack_require__) {
      var Puppet_1 = __webpack_require__(1);
      module.exports = Puppet_1.default;

      /***/
    },
    /* 1 */
    /***/ function(module, exports, __webpack_require__) {
      /* WEBPACK VAR INJECTION */ (function(global) {
        /*! puppet.js version: 2.4.0
	 * (c) 2013 Joachim Wester
	 * MIT license
	 */
        /// <reference path="../typings/index.d.ts" />
        var __extends = this && this.__extends ||
          function(d, b) {
            for (var p in b)
              if (b.hasOwnProperty(p)) d[p] = b[p];
            function __() {
              this.constructor = d;
            }
            d.prototype = b === null
              ? Object.create(b)
              : (__.prototype = b.prototype, new __());
          };
        var events_1 = __webpack_require__(2);
        var Reconnector_1 = __webpack_require__(3);
        var Heartbeat_1 = __webpack_require__(4);
        var fast_json_patch_1 = __webpack_require__(5);
        var PuppetNetworkChannel_1 = __webpack_require__(6);
        var JSONPatchQueueSynchronous_1 = __webpack_require__(44);
        var JSONPatchOTAgent_1 = __webpack_require__(45);
        var JSONPatchQueue_1 = __webpack_require__(46);
        var JSONPatchOT_1 = __webpack_require__(47);
        var NoQueue_1 = __webpack_require__(48);
        var Puppet = (function(_super) {
          __extends(Puppet, _super);
          /**
	       * Defines a connection to a remote PATCH server, serves an object that is persistent between browser and server.
	       * @param {Object} [options] map of arguments. See README.md for description
	       */
          function Puppet(options) {
            if (options === void 0) {
              options = {};
            }
            var _this = //for EventEmitter
            _super.call(this) || this;
            _this.ignoreCache = {};
            _this.debug = options.debug != undefined ? options.debug : true;
            _this.usePolling = options.usePolling != undefined
              ? options.usePolling
              : true;
            if ("obj" in options) {
              if (typeof options.obj != "object") {
                throw new Error("'options.obj' is not an object");
              }
              _this.obj = options.obj;
            } else {
              _this.obj = {};
            }
            if (!("remoteUrl" in options)) {
              throw new Error("remoteUrl must be defined");
            }
            var noOp = function() {};
            _this.observer = null;
            _this.onLocalChange = options.onLocalChange;
            _this.onRemoteChange = options.onRemoteChange;
            _this.onPatchReceived = options.onPatchReceived || noOp;
            _this.onPatchSent = options.onPatchSent || noOp;
            _this.onSocketStateChanged = options.onSocketStateChanged || noOp;
            _this.onConnectionError = options.onConnectionError || noOp;
            _this.retransmissionThreshold = options.retransmissionThreshold ||
              3;
            _this.onReconnectionCountdown = options.onReconnectionCountdown ||
              noOp;
            _this.onReconnectionEnd = options.onReconnectionEnd || noOp;
            _this.onDataReady = options.callback;
            _this.reconnector = new Reconnector_1.default(
              (function() {
                this.makeReconnection(this);
              }).bind(_this),
              _this.onReconnectionCountdown,
              _this.onReconnectionEnd
            );
            if (options.pingIntervalS) {
              var intervalMs = options.pingIntervalS * 1000;
              _this.heartbeat = new Heartbeat_1.default(
                _this.ping.bind(_this),
                _this.handleConnectionError.bind(_this),
                intervalMs,
                intervalMs
              );
            } else {
              _this.heartbeat = Heartbeat_1.default.noHeartBeat();
            }
            _this.network = new PuppetNetworkChannel_1.default(
              _this, // puppet instance TODO: to be removed, used for error reporting
              options.remoteUrl,
              options.useWebSocket || false, // useWebSocket
              _this.handleRemoteChange.bind(_this), //onReceive
              _this.onPatchSent.bind(_this), //onSend,
              _this.handleConnectionError.bind(_this), //onConnectionError,
              _this.handleFatalError.bind(_this), //onFatalError,
              _this.onSocketStateChanged.bind(_this) //onStateChange
            );
            _this.ignoreCache = {};
            _this.ignoreAdd = options.ignoreAdd || null; //undefined, null or regexp (tested against JSON Pointer in JSON Patch)
            //usage:
            //puppet.ignoreAdd = null;  //undefined or null means that all properties added on client will be sent to remote
            //puppet.ignoreAdd = /./; //ignore all the "add" operations
            //puppet.ignoreAdd = /\/\$.+/; //ignore the "add" operations of properties that start with $
            //puppet.ignoreAdd = /\/_.+/; //ignore the "add" operations of properties that start with _
            // choose queuing engine
            if (options.localVersionPath) {
              if (!options.remoteVersionPath) {
                // just versioning
                _this.queue = new JSONPatchQueueSynchronous_1.default(
                  options.localVersionPath,
                  _this.validateAndApplySequence.bind(_this),
                  options.purity
                );
              } else {
                // double versioning or OT
                _this.queue = options.ot
                  ? new JSONPatchOTAgent_1.default(
                      JSONPatchOT_1.default.transform,
                      [options.localVersionPath, options.remoteVersionPath],
                      _this.validateAndApplySequence.bind(_this),
                      options.purity
                    )
                  : new JSONPatchQueue_1.default(
                      [options.localVersionPath, options.remoteVersionPath],
                      _this.validateAndApplySequence.bind(_this),
                      options.purity
                    ); // full or noop OT
              }
            } else {
              // no queue - just api
              _this.queue = new NoQueue_1.default(
                _this.validateAndApplySequence.bind(_this)
              );
            }
            _this.makeInitialConnection();
            return _this;
          }
          Object.defineProperty(Puppet.prototype, "useWebSocket", {
            /* useWebSocket getter and setter */
            get: function() {
              if (this.network) return this.network.useWebSocket;
              return null;
            },
            set: function(newUseWebSocket) {
              if (this.network) this.network.useWebSocket = newUseWebSocket;
            },
            enumerable: true,
            configurable: true
          });
          Puppet.prototype.isIgnored = function(
            pattern,
            ignoreCache,
            path,
            op
          ) {
            if (op === "add" && pattern.test(path)) {
              ignoreCache[path] = true;
              return true;
            }
            var arr = path.split("/");
            var joined = "";
            for (var i = 1, arrLength = arr.length; i < arrLength; i++) {
              joined += "/" + arr[i];
              if (ignoreCache[joined]) {
                return true; //once we decided to ignore something that was added, other operations (replace, remove, ...) are ignored as well
              }
            }
            return false;
          };
          Puppet.prototype.handleLocalChange = function(patches) {
            if (!this.isObserving) return;
            /* there seems to be a bug here, in the original Puppet.
	        I can't find anywhere where this.remoteObj is modified
	        except when a message is received from server, disabling
	        it for now */
            /*
	        if (this.debug) {
	          this.validateSequence(this.remoteObj, patches);
	        } */
            this.sendPatches(this.queue.send(patches));
            if (this.onLocalChange) {
              this.onLocalChange(patches);
            }
          };
          Puppet.prototype.sendPatches = function(patches) {
            var txt = JSON.stringify(patches);
            this.unobserve();
            this.heartbeat.notifySend();
            this.network.send(txt);
            this.observe();
          };
          Puppet.prototype.validateSequence = function(tree, sequence) {
            var error = fast_json_patch_1.default.validate(sequence, tree);
            if (error) {
              error.message = "Outgoing patch validation error: " +
                error.message;
              this.dispatchErrorEvent(error);
            }
          };
          Puppet.prototype.dispatchErrorEvent = function(error) {
            this.emit("error", error);
          };
          Puppet.prototype.filterIgnoredPatches = function(patches) {
            if (this.ignoreAdd) {
              for (var i = 0, arrLength = patches.length; i < arrLength; i++) {
                if (
                  this.isIgnored(
                    this.ignoreAdd,
                    this.ignoreCache,
                    patches[i].path,
                    patches[i].op
                  )
                ) {
                  patches.splice(i, 1); //ignore changes to properties that start with PRIVATE_PREFIX
                  arrLength--;
                  i--;
                }
              }
            }
            return patches;
          };
          Puppet.prototype.filterChangedCallback = function(patches) {
            this.filterIgnoredPatches(patches);
            if (patches.length) {
              this.handleLocalChange(patches);
            }
          };
          Puppet.prototype.observe = function() {
            this.isObserving = true;
            this.observer = fast_json_patch_1.default.observe(
              this.obj,
              this.filterChangedCallback.bind(this),
              this.usePolling
            );
          };
          Puppet.prototype.connectToRemote = function(reconnectionFn) {
            // if we lose connection at this point, the connection we're trying to establish should trigger onError
            this.heartbeat.stop();
            reconnectionFn(
              (function bootstrap(json) {
                /* axios automatically parses response
	            var json = JSON.parse(responseText); */
                this.reconnector.stopReconnecting();
                this.queue.reset(this.obj, json);
                if (this.debug) {
                  this.remoteObj = json;
                }
                this.observe();
                if (this.onDataReady) {
                  this.onDataReady.call(this, this.obj);
                }
                this.heartbeat.start();
              }).bind(this)
            );
          };
          Puppet.prototype.makeInitialConnection = function() {
            this.connectToRemote(this.network.establish.bind(this.network));
          };
          Puppet.prototype.makeReconnection = function() {
            this.connectToRemote(
              (function(bootstrap) {
                this.network.reestablish(this.queue.pending, bootstrap);
              }).bind(this)
            );
          };
          Puppet.prototype.ping = function() {
            this.sendPatches([]); // sends empty message to server
          };
          Puppet.prototype.handleConnectionError = function() {
            this.heartbeat.stop();
            this.reconnector.triggerReconnection();
          };
          /**
	     * Handle an error which probably won't go away on itself (basically forward upstream)
	     */
          Puppet.prototype.handleFatalError = function(data, url, method) {
            this.heartbeat.stop();
            this.reconnector.stopReconnecting();
            if (this.onConnectionError) {
              this.onConnectionError(data, url, method);
            }
          };
          Puppet.prototype.reconnectNow = function() {
            this.reconnector.reconnectNow();
          };
          Puppet.prototype.showWarning = function(heading, description) {
            if (this.debug && global.console && console.warn) {
              if (description) {
                heading += " (" + description + ")";
              }
              console.warn("PuppetJs warning: " + heading);
            }
          };
          Puppet.prototype.handleRemoteChange = function(data, url, method) {
            this.heartbeat.notifyReceive();
            /* axios automatically parses responses */
            //var patches = JSON.parse(data || '[]'); // fault tolerance - empty response string should be treated as empty patch array
            var patches = data ? data : [];
            if (patches.length === 0) {
              return;
            }
            if (this.onPatchReceived) {
              this.onPatchReceived(data, url, method);
            }
            // apply only if we're still watching
            if (!this.observer) {
              return;
            }
            this.queue.receive(this.obj, patches);
            if (
              this.queue.pending &&
              this.queue.pending.length &&
              this.queue.pending.length > this.retransmissionThreshold
            ) {
              // remote counterpart probably failed to receive one of earlier messages, because it has been receiving
              // (but not acknowledging messages for some time
              this.queue.pending.forEach(
                this.sendPatches.bind(this)
              ); /* alshakero */
            }
            if (this.debug) {
              this.remoteObj = JSON.parse(JSON.stringify(this.obj));
            }
          };
          Puppet.prototype.validateAndApplySequence = function(tree, sequence) {
            // we don't want this changes to generate patches since they originate from server, not client
            this.unobserve();
            try {
              var results = fast_json_patch_1.default.apply(
                tree,
                sequence,
                this.debug
              );
            } catch (error) {
              if (this.debug) {
                error.message = "Incoming patch validation error: " +
                  error.message;
                this.dispatchErrorEvent(error);
                return;
              } else {
                throw error;
              }
            }
            var that = this;
            sequence.forEach(function(patch) {
              if (patch.path === "") {
                var desc = JSON.stringify(sequence);
                if (desc.length > 103) {
                  desc = desc.substring(0, 100) + "...";
                }
              }
            });
            // notifications have to happen only where observe has been re-enabled
            // otherwise some listener might produce changes that would go unnoticed
            this.observe();
            // until notifications are converged to single method (events vs. callbacks, #74)
            if (this.onRemoteChange) {
              console.warn(
                "PuppetJs.onRemoteChange is deprecated, please use patch-applied event instead."
              );
              this.onRemoteChange(sequence, results);
            }
            this.emit("patch-applied", {
              bubbles: true,
              cancelable: true,
              detail: { patches: sequence, results: results }
            });
          };
          Puppet.prototype.unobserve = function() {
            this.isObserving = false;
            if (this.observer) {
              fast_json_patch_1.default.unobserve(this.obj, this.observer);
              this.observer = null;
            }
          };
          return Puppet;
        })(events_1.EventEmitter);
        exports.Puppet = Puppet;
        Object.defineProperty(exports, "__esModule", { value: true });
        exports.default = Puppet;

        /* WEBPACK VAR INJECTION */
      }).call(
        exports,
        (function() {
          return this;
        })()
      );

      /***/
    },
    /* 2 */
    /***/ function(module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      function EventEmitter() {
        this._events = this._events || {};
        this._maxListeners = this._maxListeners || undefined;
      }
      module.exports = EventEmitter;

      // Backwards-compat with node 0.10.x
      EventEmitter.EventEmitter = EventEmitter;

      EventEmitter.prototype._events = undefined;
      EventEmitter.prototype._maxListeners = undefined;

      // By default EventEmitters will print a warning if more than 10 listeners are
      // added to it. This is a useful default which helps finding memory leaks.
      EventEmitter.defaultMaxListeners = 10;

      // Obviously not all Emitters should be limited to 10. This function allows
      // that to be increased. Set to zero for unlimited.
      EventEmitter.prototype.setMaxListeners = function(n) {
        if (!isNumber(n) || n < 0 || isNaN(n))
          throw TypeError("n must be a positive number");
        this._maxListeners = n;
        return this;
      };

      EventEmitter.prototype.emit = function(type) {
        var er, handler, len, args, i, listeners;

        if (!this._events) this._events = {};

        // If there is no 'error' event listener then throw.
        if (type === "error") {
          if (
            !this._events.error ||
            isObject(this._events.error) && !this._events.error.length
          ) {
            er = arguments[1];
            if (er instanceof Error) {
              throw er; // Unhandled 'error' event
            } else {
              // At least give some kind of context to the user
              var err = new Error(
                'Uncaught, unspecified "error" event. (' + er + ")"
              );
              err.context = er;
              throw err;
            }
          }
        }

        handler = this._events[type];

        if (isUndefined(handler)) return false;

        if (isFunction(handler)) {
          switch (arguments.length) {
            // fast cases
            case 1:
              handler.call(this);
              break;
            case 2:
              handler.call(this, arguments[1]);
              break;
            case 3:
              handler.call(this, arguments[1], arguments[2]);
              break;
            // slower
            default:
              args = Array.prototype.slice.call(arguments, 1);
              handler.apply(this, args);
          }
        } else if (isObject(handler)) {
          args = Array.prototype.slice.call(arguments, 1);
          listeners = handler.slice();
          len = listeners.length;
          for (i = 0; i < len; i++)
            listeners[i].apply(this, args);
        }

        return true;
      };

      EventEmitter.prototype.addListener = function(type, listener) {
        var m;

        if (!isFunction(listener))
          throw TypeError("listener must be a function");

        if (!this._events) this._events = {};

        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (this._events.newListener)
          this.emit(
            "newListener",
            type,
            isFunction(listener.listener) ? listener.listener : listener
          );

        if (!this._events[type])
          // Optimize the case of one listener. Don't need the extra array object.
          this._events[type] = listener;
        else if (isObject(this._events[type]))
          // If we've already got an array, just append.
          this._events[type].push(listener);
        else
          // Adding the second element, need to change to array.
          this._events[type] = [this._events[type], listener];

        // Check for listener leak
        if (isObject(this._events[type]) && !this._events[type].warned) {
          if (!isUndefined(this._maxListeners)) {
            m = this._maxListeners;
          } else {
            m = EventEmitter.defaultMaxListeners;
          }

          if (m && m > 0 && this._events[type].length > m) {
            this._events[type].warned = true;
            console.error(
              "(node) warning: possible EventEmitter memory " +
                "leak detected. %d listeners added. " +
                "Use emitter.setMaxListeners() to increase limit.",
              this._events[type].length
            );
            if (typeof console.trace === "function") {
              // not supported in IE 10
              console.trace();
            }
          }
        }

        return this;
      };

      EventEmitter.prototype.on = EventEmitter.prototype.addListener;

      EventEmitter.prototype.once = function(type, listener) {
        if (!isFunction(listener))
          throw TypeError("listener must be a function");

        var fired = false;

        function g() {
          this.removeListener(type, g);

          if (!fired) {
            fired = true;
            listener.apply(this, arguments);
          }
        }

        g.listener = listener;
        this.on(type, g);

        return this;
      };

      // emits a 'removeListener' event iff the listener was removed
      EventEmitter.prototype.removeListener = function(type, listener) {
        var list, position, length, i;

        if (!isFunction(listener))
          throw TypeError("listener must be a function");

        if (!this._events || !this._events[type]) return this;

        list = this._events[type];
        length = list.length;
        position = -1;

        if (
          list === listener ||
          isFunction(list.listener) && list.listener === listener
        ) {
          delete this._events[type];
          if (this._events.removeListener)
            this.emit("removeListener", type, listener);
        } else if (isObject(list)) {
          for (i = length; i-- > 0; ) {
            if (
              list[i] === listener ||
              list[i].listener && list[i].listener === listener
            ) {
              position = i;
              break;
            }
          }

          if (position < 0) return this;

          if (list.length === 1) {
            list.length = 0;
            delete this._events[type];
          } else {
            list.splice(position, 1);
          }

          if (this._events.removeListener)
            this.emit("removeListener", type, listener);
        }

        return this;
      };

      EventEmitter.prototype.removeAllListeners = function(type) {
        var key, listeners;

        if (!this._events) return this;

        // not listening for removeListener, no need to emit
        if (!this._events.removeListener) {
          if (arguments.length === 0) this._events = {};
          else if (this._events[type]) delete this._events[type];
          return this;
        }

        // emit removeListener for all listeners on all events
        if (arguments.length === 0) {
          for (key in this._events) {
            if (key === "removeListener") continue;
            this.removeAllListeners(key);
          }
          this.removeAllListeners("removeListener");
          this._events = {};
          return this;
        }

        listeners = this._events[type];

        if (isFunction(listeners)) {
          this.removeListener(type, listeners);
        } else if (listeners) {
          // LIFO order
          while (listeners.length)
            this.removeListener(type, listeners[listeners.length - 1]);
        }
        delete this._events[type];

        return this;
      };

      EventEmitter.prototype.listeners = function(type) {
        var ret;
        if (!this._events || !this._events[type]) ret = [];
        else if (isFunction(this._events[type])) ret = [this._events[type]];
        else ret = this._events[type].slice();
        return ret;
      };

      EventEmitter.prototype.listenerCount = function(type) {
        if (this._events) {
          var evlistener = this._events[type];

          if (isFunction(evlistener)) return 1;
          else if (evlistener) return evlistener.length;
        }
        return 0;
      };

      EventEmitter.listenerCount = function(emitter, type) {
        return emitter.listenerCount(type);
      };

      function isFunction(arg) {
        return typeof arg === "function";
      }

      function isNumber(arg) {
        return typeof arg === "number";
      }

      function isObject(arg) {
        return typeof arg === "object" && arg !== null;
      }

      function isUndefined(arg) {
        return arg === void 0;
      }

      /***/
    },
    /* 3 */
    /***/ function(module, exports) {
      var Reconnector = (function() {
        /**
	     * @param {Function} reconnect used to perform reconnection. No arguments
	     * @param {Function} called to notify that reconnection attempt is scheduled
	     * @param {Function} onReconnectionEnd called to notify that reconnection attempt is not longer scheduled
	     * @constructor
	     */
        function Reconnector(
          reconnect,
          onReconnectionCountdown,
          onReconnectionEnd
        ) {
          this.defaultIntervalMs = 1000;
          this.reconnect = reconnect;
          this.onReconnectionCountdown = onReconnectionCountdown;
          this.onReconnectionEnd = onReconnectionEnd;
          this.reset();
        }
        Reconnector.prototype.reset = function() {
          this.intervalMs = this.defaultIntervalMs;
          this.timeToCurrentReconnectionMs = 0;
          this.reconnectionPending = false;
          clearTimeout(this.reconnection);
          this.reconnection = null;
        };
        Reconnector.prototype.step = function() {
          if (this.timeToCurrentReconnectionMs == 0) {
            this.onReconnectionCountdown(0);
            this.reconnectionPending = false;
            this.intervalMs *= 2;
            this.reconnect();
          } else {
            this.onReconnectionCountdown(this.timeToCurrentReconnectionMs);
            this.timeToCurrentReconnectionMs -= 1000;
            setTimeout(this.step.bind(this), 1000);
          }
        };
        /**
	     * Notify Reconnector that connection error occurred and automatic reconnection should be scheduled.
	     */
        Reconnector.prototype.triggerReconnection = function() {
          if (this.reconnectionPending) {
            return;
          }
          this.timeToCurrentReconnectionMs = this.intervalMs;
          this.reconnectionPending = true;
          this.step();
        };
        /**
	     * Reconnect immediately and reset all reconnection timers.
	     */
        Reconnector.prototype.reconnectNow = function() {
          this.timeToCurrentReconnectionMs = 0;
          this.intervalMs = this.defaultIntervalMs;
        };
        Reconnector.prototype.stopReconnecting = function() {
          this.reset();
          this.onReconnectionEnd();
        };
        return Reconnector;
      })();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = Reconnector;

      /***/
    },
    /* 4 */
    /***/ function(module, exports) {
      /**
	   * Guarantees some communication to server and monitors responses for timeouts.
	    */
      var Heartbeat = (function() {
        /**
	   * @param sendHeartbeatAction will be called to send a heartbeat
	   * @param onError will be called if no response will arrive after `timeoutMs` since a message has been sent
	   * @param intervalMs if no request will be sent in that time, a heartbeat will be issued
	   * @param timeoutMs should a response fail to arrive in this time, `onError` will be called
	   * @constructor
	     */
        function Heartbeat(
          sendHeartbeatAction,
          onError,
          intervalMs,
          timeoutMs
        ) {
          this.sendHeartbeatAction = sendHeartbeatAction;
          this.onError = onError;
          this.intervalMs = intervalMs;
          this.timeoutMs = timeoutMs;
        }
        Heartbeat.noHeartBeat = function() {
          var HB = new this(null, null, null, 0);
          HB.start = HB.stop = HB.notifySend = HB.notifyReceive = function() {};
          return HB;
        };
        /**
	     * Call this function at the beginning of operation and after successful reconnection.
	     */
        Heartbeat.prototype.start = function() {
          if (this.scheduledSend) {
            return;
          }
          this.scheduledSend = setTimeout(
            (function() {
              this.notifySend();
              this.sendHeartbeatAction();
            }).bind(this),
            this.intervalMs
          );
        };
        /**
	     * Call this method just before a message is sent. This will prevent unnecessary heartbeats.
	     */
        Heartbeat.prototype.notifySend = function() {
          clearTimeout(this.scheduledSend); // sending heartbeat will not be necessary until our response arrives
          this.scheduledSend = null;
          if (this.scheduledError) {
            return;
          }
          this.scheduledError = setTimeout(
            (function() {
              this.scheduledError = null;
              this.onError(); // timeout has passed and response hasn't arrived
            }).bind(this),
            this.timeoutMs
          );
        };
        /**
	     * Call this method when a message arrives from other party. Failing to do so will result in false positive `onError` calls
	     */
        Heartbeat.prototype.notifyReceive = function() {
          clearTimeout(this.scheduledError);
          this.scheduledError = null;
          this.start();
        };
        /**
	     * Call this method to disable heartbeat temporarily. This is *not* automatically called when error is detected
	     */
        Heartbeat.prototype.stop = function() {
          clearTimeout(this.scheduledSend);
          this.scheduledSend = null;
          clearTimeout(this.scheduledError);
          this.scheduledError = null;
        };
        return Heartbeat;
      })();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = Heartbeat;

      /***/
    },
    /* 5 */
    /***/ function(module, exports, __webpack_require__) {
      /*!
	 * https://github.com/Starcounter-Jack/JSON-Patch
	 * json-patch-duplex.js version: 1.1.4
	 * (c) 2013 Joachim Wester
	 * MIT license
	 */
      var __extends = this && this.__extends ||
        function(d, b) {
          for (var p in b)
            if (b.hasOwnProperty(p)) d[p] = b[p];
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null
            ? Object.create(b)
            : (__.prototype = b.prototype, new __());
        };
      var jsonpatch;
      (function(jsonpatch) {
        var _objectKeys = function(obj) {
          if (_isArray(obj)) {
            var keys = new Array(obj.length);
            for (var k = 0; k < keys.length; k++) {
              keys[k] = "" + k;
            }
            return keys;
          }
          if (Object.keys) {
            return Object.keys(obj);
          }
          var keys = [];
          for (var i in obj) {
            if (obj.hasOwnProperty(i)) {
              keys.push(i);
            }
          }
          return keys;
        };
        function _equals(a, b) {
          switch (typeof a) {
            case "undefined": //backward compatibility, but really I think we should return false
            case "boolean":
            case "string":
            case "number":
              return a === b;
            case "object":
              if (a === null) return b === null;
              if (_isArray(a)) {
                if (!_isArray(b) || a.length !== b.length) return false;
                for (var i = 0, l = a.length; i < l; i++)
                  if (!_equals(a[i], b[i])) return false;
                return true;
              }
              var bKeys = _objectKeys(b);
              var bLength = bKeys.length;
              if (_objectKeys(a).length !== bLength) return false;
              for (var i = 0; i < bLength; i++)
                if (!_equals(a[i], b[i])) return false;
              return true;
            default:
              return false;
          }
        }
        /* We use a Javascript hash to store each
	     function. Each hash entry (property) uses
	     the operation identifiers specified in rfc6902.
	     In this way, we can map each patch operation
	     to its dedicated function in efficient way.
	     */
        /* The operations applicable to an object */
        var objOps = {
          add: function(obj, key) {
            obj[key] = this.value;
          },
          remove: function(obj, key) {
            var removed = obj[key];
            delete obj[key];
            return removed;
          },
          replace: function(obj, key) {
            var removed = obj[key];
            obj[key] = this.value;
            return removed;
          },
          move: function(obj, key, tree) {
            var getOriginalDestination = { op: "_get", path: this.path };
            apply(tree, [getOriginalDestination]);
            // In case value is moved up and overwrites its ancestor
            var original = getOriginalDestination.value === undefined
              ? undefined
              : JSON.parse(JSON.stringify(getOriginalDestination.value));
            var temp = { op: "_get", path: this.from };
            apply(tree, [temp]);
            apply(tree, [{ op: "remove", path: this.from }]);
            apply(tree, [{ op: "add", path: this.path, value: temp.value }]);
            return original;
          },
          copy: function(obj, key, tree) {
            var temp = { op: "_get", path: this.from };
            apply(tree, [temp]);
            apply(tree, [{ op: "add", path: this.path, value: temp.value }]);
          },
          test: function(obj, key) {
            return _equals(obj[key], this.value);
          },
          _get: function(obj, key) {
            this.value = obj[key];
          }
        };
        /* The operations applicable to an array. Many are the same as for the object */
        var arrOps = {
          add: function(arr, i) {
            arr.splice(i, 0, this.value);
            // this may be needed when using '-' in an array
            return i;
          },
          remove: function(arr, i) {
            var removedList = arr.splice(i, 1);
            return removedList[0];
          },
          replace: function(arr, i) {
            var removed = arr[i];
            arr[i] = this.value;
            return removed;
          },
          move: objOps.move,
          copy: objOps.copy,
          test: objOps.test,
          _get: objOps._get
        };
        /* The operations applicable to object root. Many are the same as for the object */
        var rootOps = {
          add: function(obj) {
            rootOps.remove.call(this, obj);
            for (var key in this.value) {
              if (this.value.hasOwnProperty(key)) {
                obj[key] = this.value[key];
              }
            }
          },
          remove: function(obj) {
            var removed = {};
            for (var key in obj) {
              if (obj.hasOwnProperty(key)) {
                removed[key] = obj[key];
                objOps.remove.call(this, obj, key);
              }
            }
            return removed;
          },
          replace: function(obj) {
            var removed = apply(obj, [{ op: "remove", path: this.path }]);
            apply(obj, [{ op: "add", path: this.path, value: this.value }]);
            return removed[0];
          },
          move: objOps.move,
          copy: objOps.copy,
          test: function(obj) {
            return JSON.stringify(obj) === JSON.stringify(this.value);
          },
          _get: function(obj) {
            this.value = obj;
          }
        };
        function escapePathComponent(str) {
          if (str.indexOf("/") === -1 && str.indexOf("~") === -1) return str;
          return str.replace(/~/g, "~0").replace(/\//g, "~1");
        }
        function _getPathRecursive(root, obj) {
          var found;
          for (var key in root) {
            if (root.hasOwnProperty(key)) {
              if (root[key] === obj) {
                return escapePathComponent(key) + "/";
              } else if (typeof root[key] === "object") {
                found = _getPathRecursive(root[key], obj);
                if (found != "") {
                  return escapePathComponent(key) + "/" + found;
                }
              }
            }
          }
          return "";
        }
        function getPath(root, obj) {
          if (root === obj) {
            return "/";
          }
          var path = _getPathRecursive(root, obj);
          if (path === "") {
            throw new Error("Object not found in root");
          }
          return "/" + path;
        }
        var beforeDict = [];
        var Mirror = (function() {
          function Mirror(obj) {
            this.observers = [];
            this.obj = obj;
          }
          return Mirror;
        })();
        var ObserverInfo = (function() {
          function ObserverInfo(callback, observer) {
            this.callback = callback;
            this.observer = observer;
          }
          return ObserverInfo;
        })();
        function getMirror(obj) {
          for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
            if (beforeDict[i].obj === obj) {
              return beforeDict[i];
            }
          }
        }
        function getObserverFromMirror(mirror, callback) {
          for (var j = 0, jlen = mirror.observers.length; j < jlen; j++) {
            if (mirror.observers[j].callback === callback) {
              return mirror.observers[j].observer;
            }
          }
        }
        function removeObserverFromMirror(mirror, observer) {
          for (var j = 0, jlen = mirror.observers.length; j < jlen; j++) {
            if (mirror.observers[j].observer === observer) {
              mirror.observers.splice(j, 1);
              return;
            }
          }
        }
        function unobserve(root, observer) {
          observer.unobserve();
        }
        jsonpatch.unobserve = unobserve;
        function deepClone(obj) {
          switch (typeof obj) {
            case "object":
              return JSON.parse(JSON.stringify(obj)); //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
            case "undefined":
              return null; //this is how JSON.stringify behaves for array items
            default:
              return obj; //no need to clone primitives
          }
        }
        function observe(obj, callback, usePolling) {
          var patches = [];
          var root = obj;
          var observer;
          var mirror = getMirror(obj);
          if (!mirror) {
            mirror = new Mirror(obj);
            beforeDict.push(mirror);
          } else {
            observer = getObserverFromMirror(mirror, callback);
          }
          if (observer) {
            return observer;
          }
          observer = {};
          mirror.value = deepClone(obj);
          if (callback) {
            observer.callback = callback;
            observer.next = null;
            observer.usePolling = usePolling;
            var dirtyCheck = function() {
              generate(observer);
            };
            if (!observer.usePolling) {
              observer.touch = function() {
                generate(observer);
              };
            }
            var fastCheck = function() {
              clearTimeout(observer.next);
              observer.next = setTimeout(dirtyCheck);
            };
            if (typeof window !== "undefined") {
              if (window.addEventListener) {
                window.addEventListener("mouseup", fastCheck);
                window.addEventListener("keyup", fastCheck);
                window.addEventListener("mousedown", fastCheck);
                window.addEventListener("keydown", fastCheck);
                window.addEventListener("change", fastCheck);
              } else if (typeof document !== "undefined") {
                document.documentElement.attachEvent("onmouseup", fastCheck);
                document.documentElement.attachEvent("onkeyup", fastCheck);
                document.documentElement.attachEvent("onmousedown", fastCheck);
                document.documentElement.attachEvent("onkeydown", fastCheck);
                document.documentElement.attachEvent("onchange", fastCheck);
              }
            } else if (observer.usePolling) {
              observer.next = setInterval(dirtyCheck, 30);
            }
          }
          observer.patches = patches;
          observer.object = obj;
          observer.unobserve = function() {
            generate(observer);
            removeObserverFromMirror(mirror, observer);
            if (typeof window !== "undefined") {
              clearTimeout(observer.next);
              if (window.removeEventListener) {
                window.removeEventListener("mouseup", fastCheck);
                window.removeEventListener("keyup", fastCheck);
                window.removeEventListener("mousedown", fastCheck);
                window.removeEventListener("keydown", fastCheck);
              } else if (typeof document !== "undefined") {
                document.documentElement.detachEvent("onmouseup", fastCheck);
                document.documentElement.detachEvent("onkeyup", fastCheck);
                document.documentElement.detachEvent("onmousedown", fastCheck);
                document.documentElement.detachEvent("onkeydown", fastCheck);
              }
            } else if (observer.usePolling) {
              clearInterval(observer.next);
            }
          };
          mirror.observers.push(new ObserverInfo(callback, observer));
          return observer;
        }
        jsonpatch.observe = observe;
        function generate(observer) {
          var mirror;
          for (var i = 0, ilen = beforeDict.length; i < ilen; i++) {
            if (beforeDict[i].obj === observer.object) {
              mirror = beforeDict[i];
              break;
            }
          }
          _generate(mirror.value, observer.object, observer.patches, "");
          if (observer.patches.length) {
            apply(mirror.value, observer.patches);
          }
          var temp = observer.patches;
          if (temp.length > 0) {
            observer.patches = [];
            if (observer.callback) {
              observer.callback(temp);
            }
          }
          return temp;
        }
        jsonpatch.generate = generate;
        // Dirty check if obj is different from mirror, generate patches and update mirror
        function _generate(mirror, obj, patches, path) {
          var newKeys = _objectKeys(obj);
          var oldKeys = _objectKeys(mirror);
          var changed = false;
          var deleted = false;
          //if ever "move" operation is implemented here, make sure this test runs OK: "should not generate the same patch twice (move)"
          for (var t = oldKeys.length - 1; t >= 0; t--) {
            var key = oldKeys[t];
            var oldVal = mirror[key];
            if (
              obj.hasOwnProperty(key) &&
              !(obj[key] === undefined &&
                oldVal !== undefined &&
                _isArray(obj) === false)
            ) {
              var newVal = obj[key];
              if (
                typeof oldVal == "object" &&
                oldVal != null &&
                typeof newVal == "object" &&
                newVal != null
              ) {
                _generate(
                  oldVal,
                  newVal,
                  patches,
                  path + "/" + escapePathComponent(key)
                );
              } else {
                if (oldVal !== newVal) {
                  changed = true;
                  patches.push({
                    op: "replace",
                    path: path + "/" + escapePathComponent(key),
                    value: deepClone(newVal)
                  });
                }
              }
            } else {
              patches.push({
                op: "remove",
                path: path + "/" + escapePathComponent(key)
              });
              deleted = true; // property has been deleted
            }
          }
          if (!deleted && newKeys.length == oldKeys.length) {
            return;
          }
          for (var t = 0; t < newKeys.length; t++) {
            var key = newKeys[t];
            if (!mirror.hasOwnProperty(key) && obj[key] !== undefined) {
              patches.push({
                op: "add",
                path: path + "/" + escapePathComponent(key),
                value: deepClone(obj[key])
              });
            }
          }
        }
        var _isArray;
        if (Array.isArray) {
          _isArray = Array.isArray;
        } else {
          _isArray = function(obj) {
            return obj.push && typeof obj.length === "number";
          };
        }
        //3x faster than cached /^\d+$/.test(str)
        function isInteger(str) {
          var i = 0;
          var len = str.length;
          var charCode;
          while (i < len) {
            charCode = str.charCodeAt(i);
            if (charCode >= 48 && charCode <= 57) {
              i++;
              continue;
            }
            return false;
          }
          return true;
        }
        /**
	     * Apply a json-patch operation on an object tree
	     * Returns an array of results of operations.
	     * Each element can either be a boolean (if op == 'test') or
	     * the removed object (operations that remove things)
	     * or just be undefined
	     */
        function apply(tree, patches, validate) {
          var results = [], p = 0, plen = patches.length, patch, key;
          while (p < plen) {
            patch = patches[p];
            p++;
            // Find the object
            var path = patch.path || "";
            var keys = path.split("/");
            var obj = tree;
            var t = 1; //skip empty element - http://jsperf.com/to-shift-or-not-to-shift
            var len = keys.length;
            var existingPathFragment = undefined;
            while (true) {
              key = keys[t];
              if (validate) {
                if (existingPathFragment === undefined) {
                  if (obj[key] === undefined) {
                    existingPathFragment = keys.slice(0, t).join("/");
                  } else if (t == len - 1) {
                    existingPathFragment = patch.path;
                  }
                  if (existingPathFragment !== undefined) {
                    this.validator(patch, p - 1, tree, existingPathFragment);
                  }
                }
              }
              t++;
              if (key === undefined) {
                if (t >= len) {
                  results.push(rootOps[patch.op].call(patch, obj, key, tree)); // Apply patch
                  break;
                }
              }
              if (_isArray(obj)) {
                if (key === "-") {
                  key = obj.length;
                } else {
                  if (validate && !isInteger(key)) {
                    throw new JsonPatchError(
                      "Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index",
                      "OPERATION_PATH_ILLEGAL_ARRAY_INDEX",
                      p - 1,
                      patch.path,
                      patch
                    );
                  }
                  key = parseInt(key, 10);
                }
                if (t >= len) {
                  if (validate && patch.op === "add" && key > obj.length) {
                    throw new JsonPatchError(
                      "The specified index MUST NOT be greater than the number of elements in the array",
                      "OPERATION_VALUE_OUT_OF_BOUNDS",
                      p - 1,
                      patch.path,
                      patch
                    );
                  }
                  results.push(arrOps[patch.op].call(patch, obj, key, tree)); // Apply patch
                  break;
                }
              } else {
                if (key && key.indexOf("~") != -1)
                  key = key.replace(/~1/g, "/").replace(/~0/g, "~"); // escape chars
                if (t >= len) {
                  results.push(objOps[patch.op].call(patch, obj, key, tree)); // Apply patch
                  break;
                }
              }
              obj = obj[key];
            }
          }
          return results;
        }
        jsonpatch.apply = apply;
        function compare(tree1, tree2) {
          var patches = [];
          _generate(tree1, tree2, patches, "");
          return patches;
        }
        jsonpatch.compare = compare;
        // provide scoped __extends for TypeScript's `extend` keyword so it will not provide global one during compilation
        function __extends(d, b) {
          for (var p in b)
            if (b.hasOwnProperty(p)) d[p] = b[p];
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null
            ? Object.create(b)
            : (__.prototype = b.prototype, new __());
        }
        var JsonPatchError = (function(_super) {
          __extends(JsonPatchError, _super);
          function JsonPatchError(message, name, index, operation, tree) {
            var _this = _super.call(this, message) || this;
            _this.message = message;
            _this.name = name;
            _this.index = index;
            _this.operation = operation;
            _this.tree = tree;
            return _this;
          }
          return JsonPatchError;
        })(Error);
        jsonpatch.JsonPatchError = JsonPatchError;
        /**
	     * Recursively checks whether an object has any undefined values inside.
	     */
        function hasUndefined(obj) {
          if (obj === undefined) {
            return true;
          }
          if (typeof obj == "array" || typeof obj == "object") {
            for (var i in obj) {
              if (hasUndefined(obj[i])) {
                return true;
              }
            }
          }
          return false;
        }
        /**
	     * Validates a single operation. Called from `jsonpatch.validate`. Throws `JsonPatchError` in case of an error.
	     * @param {object} operation - operation object (patch)
	     * @param {number} index - index of operation in the sequence
	     * @param {object} [tree] - object where the operation is supposed to be applied
	     * @param {string} [existingPathFragment] - comes along with `tree`
	     */
        function validator(operation, index, tree, existingPathFragment) {
          if (
            typeof operation !== "object" ||
            operation === null ||
            _isArray(operation)
          ) {
            throw new JsonPatchError(
              "Operation is not an object",
              "OPERATION_NOT_AN_OBJECT",
              index,
              operation,
              tree
            );
          } else if (!objOps[operation.op]) {
            throw new JsonPatchError(
              "Operation `op` property is not one of operations defined in RFC-6902",
              "OPERATION_OP_INVALID",
              index,
              operation,
              tree
            );
          } else if (typeof operation.path !== "string") {
            throw new JsonPatchError(
              "Operation `path` property is not a string",
              "OPERATION_PATH_INVALID",
              index,
              operation,
              tree
            );
          } else if (
            operation.path.indexOf("/") !== 0 && operation.path.length > 0
          ) {
            // paths that aren't empty string should start with "/"
            throw new JsonPatchError(
              'Operation `path` property must start with "/"',
              "OPERATION_PATH_INVALID",
              index,
              operation,
              tree
            );
          } else if (
            (operation.op === "move" || operation.op === "copy") &&
            typeof operation.from !== "string"
          ) {
            throw new JsonPatchError(
              "Operation `from` property is not present (applicable in `move` and `copy` operations)",
              "OPERATION_FROM_REQUIRED",
              index,
              operation,
              tree
            );
          } else if (
            (operation.op === "add" ||
              operation.op === "replace" ||
              operation.op === "test") &&
            operation.value === undefined
          ) {
            throw new JsonPatchError(
              "Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)",
              "OPERATION_VALUE_REQUIRED",
              index,
              operation,
              tree
            );
          } else if (
            (operation.op === "add" ||
              operation.op === "replace" ||
              operation.op === "test") &&
            hasUndefined(operation.value)
          ) {
            throw new JsonPatchError(
              "Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)",
              "OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED",
              index,
              operation,
              tree
            );
          } else if (tree) {
            if (operation.op == "add") {
              var pathLen = operation.path.split("/").length;
              var existingPathLen = existingPathFragment.split("/").length;
              if (
                pathLen !== existingPathLen + 1 && pathLen !== existingPathLen
              ) {
                throw new JsonPatchError(
                  "Cannot perform an `add` operation at the desired path",
                  "OPERATION_PATH_CANNOT_ADD",
                  index,
                  operation,
                  tree
                );
              }
            } else if (
              operation.op === "replace" ||
              operation.op === "remove" ||
              operation.op === "_get"
            ) {
              if (operation.path !== existingPathFragment) {
                throw new JsonPatchError(
                  "Cannot perform the operation (" +
                    operation.op +
                    ") at a path that does not exist (" +
                    operation.path +
                    ")",
                  "OPERATION_PATH_UNRESOLVABLE",
                  index,
                  operation,
                  tree
                );
              }
            } else if (operation.op === "move" || operation.op === "copy") {
              var existingValue = {
                op: "_get",
                path: operation.from,
                value: undefined
              };
              var error = jsonpatch.validate([existingValue], tree);
              if (error && error.name === "OPERATION_PATH_UNRESOLVABLE") {
                throw new JsonPatchError(
                  "Cannot perform the operation  (" +
                    operation.op +
                    ") at a path that does not exist (" +
                    operation.path +
                    ")",
                  "OPERATION_PATH_UNRESOLVABLE",
                  index,
                  operation,
                  tree
                );
              }
            }
          }
        }
        jsonpatch.validator = validator;
        /**
	     * Validates a sequence of operations. If `tree` parameter is provided, the sequence is additionally validated against the object tree.
	     * If error is encountered, returns a JsonPatchError object
	     * @param sequence
	     * @param tree
	     * @returns {JsonPatchError|undefined}
	     */
        function validate(sequence, tree) {
          try {
            if (!_isArray(sequence)) {
              throw new JsonPatchError(
                "Patch sequence must be an array",
                "SEQUENCE_NOT_AN_ARRAY"
              );
            }
            if (tree) {
              tree = JSON.parse(JSON.stringify(tree)); //clone tree so that we can safely try applying operations
              apply.call(this, tree, sequence, true);
            } else {
              for (var i = 0; i < sequence.length; i++) {
                this.validator(sequence[i], i);
              }
            }
          } catch (e) {
            if (e instanceof JsonPatchError) {
              return e;
            } else {
              throw e;
            }
          }
        }
        jsonpatch.validate = validate;
      })(jsonpatch || (jsonpatch = {}));
      if (true) {
        exports.apply = jsonpatch.apply;
        exports.observe = jsonpatch.observe;
        exports.unobserve = jsonpatch.unobserve;
        exports.generate = jsonpatch.generate;
        exports.compare = jsonpatch.compare;
        exports.validate = jsonpatch.validate;
        exports.validator = jsonpatch.validator;
        exports.JsonPatchError = jsonpatch.JsonPatchError;
      } else {
        var exports = {};
        var isBrowser = true;
      }
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = jsonpatch;

      /***/
    },
    /* 6 */
    /***/ function(module, exports, __webpack_require__) {
      var URL_1 = __webpack_require__(7);
      var axios_1 = __webpack_require__(15);
      var WebSocket = __webpack_require__(41).w3cwebsocket;
      var PuppetNetworkChannel = (function() {
        function PuppetNetworkChannel(
          puppet,
          remoteUrl,
          useWebSocket,
          onReceive,
          onSend,
          onConnectionError,
          onFatalError,
          onStateChange
        ) {
          this.options = { defaultBaseURL: "http://localhost/" };
          this.puppet = puppet;
          this.remoteUrl = remoteUrl;
          this._useWebSocket = useWebSocket;
          /* default callbacks */
          /**
	           * Callback function that will be called once message from remote comes.
	           * @param {String} [JSONPatch_sequences] message with Array of JSONPatches that were send by remote.
	           * @return {[type]} [description]
	           */
          this.onReceive = function() {};
          this.onSend = function() {};
          this.onStateChange = function() {};
          this.upgrade = function(msg) {};
          /* end default callbacks */
          onReceive && (this.onReceive = onReceive);
          onSend && (this.onSend = onSend);
          onConnectionError && (this.onConnectionError = onConnectionError);
          onFatalError && (this.onFatalError = onFatalError);
          onStateChange && (this.onStateChange = onStateChange);
          /* Omar to fix */
          if (remoteUrl instanceof URL_1.default) {
            this.remoteUrl = remoteUrl;
          } else if (remoteUrl) {
            this.remoteUrl = new URL_1.default(
              remoteUrl,
              this.options.defaultBaseURL
            );
          } else {
            this.remoteUrl = new URL_1.default(this.options.defaultBaseURL);
          }
          // define wsURL if needed
          if (useWebSocket) {
            this.wsURL = this.calculateWSUrl(this.remoteUrl.href);
          }
        }
        PuppetNetworkChannel.prototype.calculateWSUrl = function(remoteUrl) {
          return new URL_1.default(remoteUrl.replace("http", "ws"));
        };
        Object.defineProperty(PuppetNetworkChannel.prototype, "useWebSocket", {
          get: function() {
            return this._useWebSocket;
          },
          set: function(newUseWebSocket) {
            this._useWebSocket = newUseWebSocket;
            if (newUseWebSocket == false) {
              if (this._ws) {
                this._ws.onclose = function() {
                  this._ws = null;
                };
                this._ws.close();
              }
            } else if (!this.wsURL) {
              this.wsURL = this.calculateWSUrl(this.remoteUrl);
            }
          },
          enumerable: true,
          configurable: true
        });
        PuppetNetworkChannel.prototype.establish = function(bootstrap) {
          this.establishXHR(this.remoteUrl.href, null, bootstrap);
        };
        PuppetNetworkChannel.prototype.reestablish = function(
          pending,
          bootstrap
        ) {
          this.establishXHR(
            this.remoteUrl.href + "/reconnect",
            JSON.stringify(pending),
            bootstrap
          );
        };
        // TODO: auto-configure here #38 (tomalec)
        PuppetNetworkChannel.prototype.establishXHR = function(
          url,
          body,
          bootstrap
        ) {
          return this.xhr(
            url,
            "application/json",
            body,
            (function(res) {
              bootstrap(res.data);
              if (this._useWebSocket) {
                this.webSocketUpgrade();
              }
            }).bind(this)
          );
        };
        /**
	     * Send any text message by currently established channel
	     * @TODO: handle readyState 2-CLOSING & 3-CLOSED (tomalec)
	     * @param  {String} msg message to be sent
	     * @return {PuppetNetworkChannel}     self
	     */
        PuppetNetworkChannel.prototype.send = function(msg) {
          var that = this;
          // send message only if there is a working ws connection
          if (this._useWebSocket && this._ws && this._ws.readyState === 1) {
            this._ws.send(msg);
            this.onSend(msg, this._ws.url, "WS");
          } else {
            var url = this.remoteUrl.href;
            this.xhr(url, "application/json-patch+json", msg, function(
              res,
              method
            ) {
              that.onReceive(res.data, url, method);
            });
          }
          return this;
        };
        PuppetNetworkChannel.prototype.closeWsIfNeeded = function() {
          if (this._ws) {
            this._ws.onclose = function() {};
            this._ws.close();
            this._ws = null;
          }
        };
        /**
	     * Send a WebSocket upgrade request to the server.
	     * For testing purposes WS upgrade url is hardcoded now in PuppetJS (replace __default/ID with __default/ID)
	     * In future, server should suggest the WebSocket upgrade URL
	     * @TODO:(tomalec)[cleanup] hide from public API.
	     * @param {Function} [callback] Function to be called once connection gets opened.
	     * @returns {WebSocket} created WebSocket
	     */
        PuppetNetworkChannel.prototype.webSocketUpgrade = function(callback) {
          var that = this;
          // resolve session path given in referrer in the context of remote WS URL
          var upgradeURL = this.wsURL.href;
          // ws[s]://[user[:pass]@]remote.host[:port]/__[sessionid]/
          this.closeWsIfNeeded();
          this._ws = new WebSocket(upgradeURL);
          this._ws.onopen = function(event) {
            that.onStateChange(that._ws.readyState, upgradeURL);
            callback && callback(event);
            //TODO: trigger on-ready event (tomalec)
          };
          this._ws.onmessage = function(event) {
            that.onReceive(JSON.parse(event.data), that._ws.url, "WS");
          };
          this._ws.onerror = function(event) {
            that.onStateChange(that._ws.readyState, upgradeURL, event.data);
            if (!that._useWebSocket) {
              return;
            }
            var m = {
              statusText: "WebSocket connection could not be made.",
              readyState: that._ws.readyState,
              url: upgradeURL
            };
            that.onFatalError(m, upgradeURL, "WS");
          };
          that._ws.onclose = function(event) {
            that.onStateChange(
              that._ws.readyState,
              upgradeURL,
              null,
              event.code,
              event.reason
            );
            var m = {
              statusText: "WebSocket connection closed.",
              readyState: that._ws.readyState,
              url: upgradeURL,
              statusCode: event.code,
              reason: event.reason
            };
            if (event.reason) {
              that.onFatalError(m, upgradeURL, "WS");
            } else {
              that.onConnectionError();
            }
          };
        };
        PuppetNetworkChannel.prototype.changeState = function(href) {
          var that = this;
          return this.xhr(
            href,
            "application/json-patch+json",
            null,
            function(res, method) {
              that.onReceive(res.data, href, method);
            },
            true
          );
        };
        // TODO:(tomalec)[cleanup] hide from public API.
        PuppetNetworkChannel.prototype.setRemoteUrl = function(remoteUrl) {
          if (
            this.remoteUrlSet &&
            this.remoteUrl &&
            this.remoteUrl.href != this.remoteUrl
          ) {
            throw new Error(
              "Session lost. Server replied with a different session ID that was already set. \nPossibly a server restart happened while you were working. \nPlease reload the page.\n\nPrevious session ID: " +
                this.remoteUrl +
                "\nNew session ID: " +
                this.remoteUrl
            );
          }
          this.remoteUrlSet = true;
          this.remoteUrl = new URL_1.default(remoteUrl, this.remoteUrl.href);
          this.wsURL = this.calculateWSUrl(this.remoteUrl.href);
        };
        // TODO:(tomalec)[cleanup] hide from public API.
        PuppetNetworkChannel.prototype.handleResponseHeader = function(res) {
          var location = res.headers["X-Location"] ||
            res.headers["Location"] ||
            res.headers["x-location"] ||
            res.headers["location"];
          if (location) {
            this.setRemoteUrl(location);
          }
        };
        /**
	     * Internal method to perform XMLHttpRequest
	     * @param url (Optional) URL to send the request. If empty string, undefined or null given - the request will be sent to window location
	     * @param accept (Optional) HTTP accept header
	     * @param data (Optional) Data payload
	     * @param [callback(response)] callback to be called in context of puppet with response as argument
	     * @returns {XMLHttpRequest} performed XHR
	     */
        PuppetNetworkChannel.prototype.xhr = function(
          url,
          accept,
          data,
          callback,
          setReferer
        ) {
          if (setReferer === void 0) {
            setReferer = false;
          }
          var method = data ? "PATCH" : "GET";
          var headers = { "Content-Type": "application/json-patch+json" };
          if (accept) {
            headers["Accept"] = accept;
          }
          if (this.remoteUrl && setReferer) {
            headers["X-Referer"] = this.remoteUrl.pathname;
          }
          var successHandler = (function(res) {
            this.handleResponseHeader(res);
            callback && callback.call(this.puppet, res, method);
          }).bind(this);
          var failureHandler = (function(res) {
            console.log(res);
            res = res.response;
            this.onFatalError(
              {
                statusCode: res.status,
                statusText: res.statusText,
                reason: JSON.stringify(res.data)
              },
              url,
              method
            );
          }).bind(this);
          if (method === "GET") {
            axios_1.default
              .get(url, {
                headers: headers
              })
              .then(successHandler)
              .catch(failureHandler);
          } else {
            axios_1.default
              .patch(url, data, {
                headers: headers
              })
              .then(successHandler)
              .catch(failureHandler);
          }
          this.onSend(data, url, method);
        };
        return PuppetNetworkChannel;
      })();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = PuppetNetworkChannel;

      /***/
    },
    /* 7 */
    /***/ function(module, exports, __webpack_require__) {
      var url_1 = __webpack_require__(8);
      var URL = (function() {
        function URL(path, baseURL) {
          if (baseURL === void 0) {
            baseURL = null;
          }
          var urlObj;
          if (baseURL) {
            urlObj = url_1.resolve(baseURL, path);
            urlObj = url_1.parse(urlObj);
          } else {
            urlObj = url_1.parse(path);
          }
          this.urlObj = urlObj;
          this.protocol = urlObj.protocol;
          this.href = urlObj.href;
          this.pathname = urlObj.pathname;
          this.port = urlObj.port;
        }
        return URL;
      })();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = URL;

      /***/
    },
    /* 8 */
    /***/ function(module, exports, __webpack_require__) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      "use strict";
      var punycode = __webpack_require__(9);
      var util = __webpack_require__(11);

      exports.parse = urlParse;
      exports.resolve = urlResolve;
      exports.resolveObject = urlResolveObject;
      exports.format = urlFormat;

      exports.Url = Url;

      function Url() {
        this.protocol = null;
        this.slashes = null;
        this.auth = null;
        this.host = null;
        this.port = null;
        this.hostname = null;
        this.hash = null;
        this.search = null;
        this.query = null;
        this.pathname = null;
        this.path = null;
        this.href = null;
      }

      // Reference: RFC 3986, RFC 1808, RFC 2396

      // define these here so at least they only have to be
      // compiled once on the first module load.
      var protocolPattern = /^([a-z0-9.+-]+:)/i,
        portPattern = /:[0-9]*$/,
        // Special case for a simple path URL
        simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,
        // RFC 2396: characters reserved for delimiting URLs.
        // We actually just auto-escape these.
        delims = ["<", ">", '"', "`", " ", "\r", "\n", "\t"],
        // RFC 2396: characters not allowed for various reasons.
        unwise = ["{", "}", "|", "\\", "^", "`"].concat(delims),
        // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
        autoEscape = ["'"].concat(unwise),
        // Characters that are never ever allowed in a hostname.
        // Note that any invalid chars are also handled, but these
        // are the ones that are *expected* to be seen, so we fast-path
        // them.
        nonHostChars = ["%", "/", "?", ";", "#"].concat(autoEscape),
        hostEndingChars = ["/", "?", "#"],
        hostnameMaxLen = 255,
        hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
        hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
        // protocols that can allow "unsafe" and "unwise" chars.
        unsafeProtocol = {
          javascript: true,
          "javascript:": true
        },
        // protocols that never have a hostname.
        hostlessProtocol = {
          javascript: true,
          "javascript:": true
        },
        // protocols that always contain a // bit.
        slashedProtocol = {
          http: true,
          https: true,
          ftp: true,
          gopher: true,
          file: true,
          "http:": true,
          "https:": true,
          "ftp:": true,
          "gopher:": true,
          "file:": true
        },
        querystring = __webpack_require__(12);

      function urlParse(url, parseQueryString, slashesDenoteHost) {
        if (url && util.isObject(url) && url instanceof Url) return url;

        var u = new Url();
        u.parse(url, parseQueryString, slashesDenoteHost);
        return u;
      }

      Url.prototype.parse = function(url, parseQueryString, slashesDenoteHost) {
        if (!util.isString(url)) {
          throw new TypeError(
            "Parameter 'url' must be a string, not " + typeof url
          );
        }

        // Copy chrome, IE, opera backslash-handling behavior.
        // Back slashes before the query string get converted to forward slashes
        // See: https://code.google.com/p/chromium/issues/detail?id=25916
        var queryIndex = url.indexOf("?"),
          splitter = queryIndex !== -1 && queryIndex < url.indexOf("#")
            ? "?"
            : "#",
          uSplit = url.split(splitter),
          slashRegex = /\\/g;
        uSplit[0] = uSplit[0].replace(slashRegex, "/");
        url = uSplit.join(splitter);

        var rest = url;

        // trim before proceeding.
        // This is to support parse stuff like "  http://foo.com  \n"
        rest = rest.trim();

        if (!slashesDenoteHost && url.split("#").length === 1) {
          // Try fast path regexp
          var simplePath = simplePathPattern.exec(rest);
          if (simplePath) {
            this.path = rest;
            this.href = rest;
            this.pathname = simplePath[1];
            if (simplePath[2]) {
              this.search = simplePath[2];
              if (parseQueryString) {
                this.query = querystring.parse(this.search.substr(1));
              } else {
                this.query = this.search.substr(1);
              }
            } else if (parseQueryString) {
              this.search = "";
              this.query = {};
            }
            return this;
          }
        }

        var proto = protocolPattern.exec(rest);
        if (proto) {
          proto = proto[0];
          var lowerProto = proto.toLowerCase();
          this.protocol = lowerProto;
          rest = rest.substr(proto.length);
        }

        // figure out if it's got a host
        // user@server is *always* interpreted as a hostname, and url
        // resolution will treat //foo/bar as host=foo,path=bar because that's
        // how the browser resolves relative URLs.
        if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
          var slashes = rest.substr(0, 2) === "//";
          if (slashes && !(proto && hostlessProtocol[proto])) {
            rest = rest.substr(2);
            this.slashes = true;
          }
        }

        if (
          !hostlessProtocol[proto] &&
          (slashes || proto && !slashedProtocol[proto])
        ) {
          // there's a hostname.
          // the first instance of /, ?, ;, or # ends the host.
          //
          // If there is an @ in the hostname, then non-host chars *are* allowed
          // to the left of the last @ sign, unless some host-ending character
          // comes *before* the @-sign.
          // URLs are obnoxious.
          //
          // ex:
          // http://a@b@c/ => user:a@b host:c
          // http://a@b?@c => user:a host:c path:/?@c

          // v0.12 TODO(isaacs): This is not quite how Chrome does things.
          // Review our test case against browsers more comprehensively.

          // find the first instance of any hostEndingChars
          var hostEnd = -1;
          for (var i = 0; i < hostEndingChars.length; i++) {
            var hec = rest.indexOf(hostEndingChars[i]);
            if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
          }

          // at this point, either we have an explicit point where the
          // auth portion cannot go past, or the last @ char is the decider.
          var auth, atSign;
          if (hostEnd === -1) {
            // atSign can be anywhere.
            atSign = rest.lastIndexOf("@");
          } else {
            // atSign must be in auth portion.
            // http://a@b/c@d => host:b auth:a path:/c@d
            atSign = rest.lastIndexOf("@", hostEnd);
          }

          // Now we have a portion which is definitely the auth.
          // Pull that off.
          if (atSign !== -1) {
            auth = rest.slice(0, atSign);
            rest = rest.slice(atSign + 1);
            this.auth = decodeURIComponent(auth);
          }

          // the host is the remaining to the left of the first non-host char
          hostEnd = -1;
          for (var i = 0; i < nonHostChars.length; i++) {
            var hec = rest.indexOf(nonHostChars[i]);
            if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) hostEnd = hec;
          }
          // if we still have not hit it, then the entire thing is a host.
          if (hostEnd === -1) hostEnd = rest.length;

          this.host = rest.slice(0, hostEnd);
          rest = rest.slice(hostEnd);

          // pull out port.
          this.parseHost();

          // we've indicated that there is a hostname,
          // so even if it's empty, it has to be present.
          this.hostname = this.hostname || "";

          // if hostname begins with [ and ends with ]
          // assume that it's an IPv6 address.
          var ipv6Hostname = this.hostname[0] === "[" &&
            this.hostname[this.hostname.length - 1] === "]";

          // validate a little.
          if (!ipv6Hostname) {
            var hostparts = this.hostname.split(/\./);
            for (var i = 0, l = hostparts.length; i < l; i++) {
              var part = hostparts[i];
              if (!part) continue;
              if (!part.match(hostnamePartPattern)) {
                var newpart = "";
                for (var j = 0, k = part.length; j < k; j++) {
                  if (part.charCodeAt(j) > 127) {
                    // we replace non-ASCII char with a temporary placeholder
                    // we need this to make sure size of hostname is not
                    // broken by replacing non-ASCII by nothing
                    newpart += "x";
                  } else {
                    newpart += part[j];
                  }
                }
                // we test again with ASCII char only
                if (!newpart.match(hostnamePartPattern)) {
                  var validParts = hostparts.slice(0, i);
                  var notHost = hostparts.slice(i + 1);
                  var bit = part.match(hostnamePartStart);
                  if (bit) {
                    validParts.push(bit[1]);
                    notHost.unshift(bit[2]);
                  }
                  if (notHost.length) {
                    rest = "/" + notHost.join(".") + rest;
                  }
                  this.hostname = validParts.join(".");
                  break;
                }
              }
            }
          }

          if (this.hostname.length > hostnameMaxLen) {
            this.hostname = "";
          } else {
            // hostnames are always lower case.
            this.hostname = this.hostname.toLowerCase();
          }

          if (!ipv6Hostname) {
            // IDNA Support: Returns a punycoded representation of "domain".
            // It only converts parts of the domain name that
            // have non-ASCII characters, i.e. it doesn't matter if
            // you call it with a domain that already is ASCII-only.
            this.hostname = punycode.toASCII(this.hostname);
          }

          var p = this.port ? ":" + this.port : "";
          var h = this.hostname || "";
          this.host = h + p;
          this.href += this.host;

          // strip [ and ] from the hostname
          // the host field still retains them, though
          if (ipv6Hostname) {
            this.hostname = this.hostname.substr(1, this.hostname.length - 2);
            if (rest[0] !== "/") {
              rest = "/" + rest;
            }
          }
        }

        // now rest is set to the post-host stuff.
        // chop off any delim chars.
        if (!unsafeProtocol[lowerProto]) {
          // First, make 100% sure that any "autoEscape" chars get
          // escaped, even if encodeURIComponent doesn't think they
          // need to be.
          for (var i = 0, l = autoEscape.length; i < l; i++) {
            var ae = autoEscape[i];
            if (rest.indexOf(ae) === -1) continue;
            var esc = encodeURIComponent(ae);
            if (esc === ae) {
              esc = escape(ae);
            }
            rest = rest.split(ae).join(esc);
          }
        }

        // chop off from the tail first.
        var hash = rest.indexOf("#");
        if (hash !== -1) {
          // got a fragment string.
          this.hash = rest.substr(hash);
          rest = rest.slice(0, hash);
        }
        var qm = rest.indexOf("?");
        if (qm !== -1) {
          this.search = rest.substr(qm);
          this.query = rest.substr(qm + 1);
          if (parseQueryString) {
            this.query = querystring.parse(this.query);
          }
          rest = rest.slice(0, qm);
        } else if (parseQueryString) {
          // no query string, but parseQueryString still requested
          this.search = "";
          this.query = {};
        }
        if (rest) this.pathname = rest;
        if (slashedProtocol[lowerProto] && this.hostname && !this.pathname) {
          this.pathname = "/";
        }

        //to support http.request
        if (this.pathname || this.search) {
          var p = this.pathname || "";
          var s = this.search || "";
          this.path = p + s;
        }

        // finally, reconstruct the href based on what has been validated.
        this.href = this.format();
        return this;
      };

      // format a parsed object into a url string
      function urlFormat(obj) {
        // ensure it's an object, and not a string url.
        // If it's an obj, this is a no-op.
        // this way, you can call url_format() on strings
        // to clean up potentially wonky urls.
        if (util.isString(obj)) obj = urlParse(obj);
        if (!(obj instanceof Url)) return Url.prototype.format.call(obj);
        return obj.format();
      }

      Url.prototype.format = function() {
        var auth = this.auth || "";
        if (auth) {
          auth = encodeURIComponent(auth);
          auth = auth.replace(/%3A/i, ":");
          auth += "@";
        }

        var protocol = this.protocol || "",
          pathname = this.pathname || "",
          hash = this.hash || "",
          host = false,
          query = "";

        if (this.host) {
          host = auth + this.host;
        } else if (this.hostname) {
          host = auth +
            (this.hostname.indexOf(":") === -1
              ? this.hostname
              : "[" + this.hostname + "]");
          if (this.port) {
            host += ":" + this.port;
          }
        }

        if (
          this.query &&
          util.isObject(this.query) &&
          Object.keys(this.query).length
        ) {
          query = querystring.stringify(this.query);
        }

        var search = this.search || query && "?" + query || "";

        if (protocol && protocol.substr(-1) !== ":") protocol += ":";

        // only the slashedProtocols get the //.  Not mailto:, xmpp:, etc.
        // unless they had them to begin with.
        if (
          this.slashes ||
          (!protocol || slashedProtocol[protocol]) && host !== false
        ) {
          host = "//" + (host || "");
          if (pathname && pathname.charAt(0) !== "/") pathname = "/" + pathname;
        } else if (!host) {
          host = "";
        }

        if (hash && hash.charAt(0) !== "#") hash = "#" + hash;
        if (search && search.charAt(0) !== "?") search = "?" + search;

        pathname = pathname.replace(/[?#]/g, function(match) {
          return encodeURIComponent(match);
        });
        search = search.replace("#", "%23");

        return protocol + host + pathname + search + hash;
      };

      function urlResolve(source, relative) {
        return urlParse(source, false, true).resolve(relative);
      }

      Url.prototype.resolve = function(relative) {
        return this.resolveObject(urlParse(relative, false, true)).format();
      };

      function urlResolveObject(source, relative) {
        if (!source) return relative;
        return urlParse(source, false, true).resolveObject(relative);
      }

      Url.prototype.resolveObject = function(relative) {
        if (util.isString(relative)) {
          var rel = new Url();
          rel.parse(relative, false, true);
          relative = rel;
        }

        var result = new Url();
        var tkeys = Object.keys(this);
        for (var tk = 0; tk < tkeys.length; tk++) {
          var tkey = tkeys[tk];
          result[tkey] = this[tkey];
        }

        // hash is always overridden, no matter what.
        // even href="" will remove it.
        result.hash = relative.hash;

        // if the relative url is empty, then there's nothing left to do here.
        if (relative.href === "") {
          result.href = result.format();
          return result;
        }

        // hrefs like //foo/bar always cut to the protocol.
        if (relative.slashes && !relative.protocol) {
          // take everything except the protocol from relative
          var rkeys = Object.keys(relative);
          for (var rk = 0; rk < rkeys.length; rk++) {
            var rkey = rkeys[rk];
            if (rkey !== "protocol") result[rkey] = relative[rkey];
          }

          //urlParse appends trailing / to urls like http://www.example.com
          if (
            slashedProtocol[result.protocol] &&
            result.hostname &&
            !result.pathname
          ) {
            result.path = result.pathname = "/";
          }

          result.href = result.format();
          return result;
        }

        if (relative.protocol && relative.protocol !== result.protocol) {
          // if it's a known url protocol, then changing
          // the protocol does weird things
          // first, if it's not file:, then we MUST have a host,
          // and if there was a path
          // to begin with, then we MUST have a path.
          // if it is file:, then the host is dropped,
          // because that's known to be hostless.
          // anything else is assumed to be absolute.
          if (!slashedProtocol[relative.protocol]) {
            var keys = Object.keys(relative);
            for (var v = 0; v < keys.length; v++) {
              var k = keys[v];
              result[k] = relative[k];
            }
            result.href = result.format();
            return result;
          }

          result.protocol = relative.protocol;
          if (!relative.host && !hostlessProtocol[relative.protocol]) {
            var relPath = (relative.pathname || "").split("/");
            while (relPath.length && !(relative.host = relPath.shift()));
            if (!relative.host) relative.host = "";
            if (!relative.hostname) relative.hostname = "";
            if (relPath[0] !== "") relPath.unshift("");
            if (relPath.length < 2) relPath.unshift("");
            result.pathname = relPath.join("/");
          } else {
            result.pathname = relative.pathname;
          }
          result.search = relative.search;
          result.query = relative.query;
          result.host = relative.host || "";
          result.auth = relative.auth;
          result.hostname = relative.hostname || relative.host;
          result.port = relative.port;
          // to support http.request
          if (result.pathname || result.search) {
            var p = result.pathname || "";
            var s = result.search || "";
            result.path = p + s;
          }
          result.slashes = result.slashes || relative.slashes;
          result.href = result.format();
          return result;
        }

        var isSourceAbs = result.pathname && result.pathname.charAt(0) === "/",
          isRelAbs = relative.host ||
            relative.pathname && relative.pathname.charAt(0) === "/",
          mustEndAbs = isRelAbs ||
            isSourceAbs ||
            result.host && relative.pathname,
          removeAllDots = mustEndAbs,
          srcPath = result.pathname && result.pathname.split("/") || [],
          relPath = relative.pathname && relative.pathname.split("/") || [],
          psychotic = result.protocol && !slashedProtocol[result.protocol];

        // if the url is a non-slashed url, then relative
        // links like ../.. should be able
        // to crawl up to the hostname, as well.  This is strange.
        // result.protocol has already been set by now.
        // Later on, put the first path part into the host field.
        if (psychotic) {
          result.hostname = "";
          result.port = null;
          if (result.host) {
            if (srcPath[0] === "") srcPath[0] = result.host;
            else srcPath.unshift(result.host);
          }
          result.host = "";
          if (relative.protocol) {
            relative.hostname = null;
            relative.port = null;
            if (relative.host) {
              if (relPath[0] === "") relPath[0] = relative.host;
              else relPath.unshift(relative.host);
            }
            relative.host = null;
          }
          mustEndAbs = mustEndAbs && (relPath[0] === "" || srcPath[0] === "");
        }

        if (isRelAbs) {
          // it's absolute.
          result.host = relative.host || relative.host === ""
            ? relative.host
            : result.host;
          result.hostname = relative.hostname || relative.hostname === ""
            ? relative.hostname
            : result.hostname;
          result.search = relative.search;
          result.query = relative.query;
          srcPath = relPath;
          // fall through to the dot-handling below.
        } else if (relPath.length) {
          // it's relative
          // throw away the existing file, and take the new path instead.
          if (!srcPath) srcPath = [];
          srcPath.pop();
          srcPath = srcPath.concat(relPath);
          result.search = relative.search;
          result.query = relative.query;
        } else if (!util.isNullOrUndefined(relative.search)) {
          // just pull out the search.
          // like href='?foo'.
          // Put this after the other two cases because it simplifies the booleans
          if (psychotic) {
            result.hostname = result.host = srcPath.shift();
            //occationaly the auth can get stuck only in host
            //this especially happens in cases like
            //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
            var authInHost = result.host && result.host.indexOf("@") > 0
              ? result.host.split("@")
              : false;
            if (authInHost) {
              result.auth = authInHost.shift();
              result.host = result.hostname = authInHost.shift();
            }
          }
          result.search = relative.search;
          result.query = relative.query;
          //to support http.request
          if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
            result.path = (result.pathname ? result.pathname : "") +
              (result.search ? result.search : "");
          }
          result.href = result.format();
          return result;
        }

        if (!srcPath.length) {
          // no path at all.  easy.
          // we've already handled the other stuff above.
          result.pathname = null;
          //to support http.request
          if (result.search) {
            result.path = "/" + result.search;
          } else {
            result.path = null;
          }
          result.href = result.format();
          return result;
        }

        // if a url ENDs in . or .., then it must get a trailing slash.
        // however, if it ends in anything else non-slashy,
        // then it must NOT get a trailing slash.
        var last = srcPath.slice(-1)[0];
        var hasTrailingSlash = (result.host ||
          relative.host ||
          srcPath.length > 1) &&
          (last === "." || last === "..") ||
          last === "";

        // strip single dots, resolve double dots to parent dir
        // if the path tries to go above the root, `up` ends up > 0
        var up = 0;
        for (var i = srcPath.length; i >= 0; i--) {
          last = srcPath[i];
          if (last === ".") {
            srcPath.splice(i, 1);
          } else if (last === "..") {
            srcPath.splice(i, 1);
            up++;
          } else if (up) {
            srcPath.splice(i, 1);
            up--;
          }
        }

        // if the path is allowed to go above the root, restore leading ..s
        if (!mustEndAbs && !removeAllDots) {
          for (; up--; up) {
            srcPath.unshift("..");
          }
        }

        if (
          mustEndAbs &&
          srcPath[0] !== "" &&
          (!srcPath[0] || srcPath[0].charAt(0) !== "/")
        ) {
          srcPath.unshift("");
        }

        if (hasTrailingSlash && srcPath.join("/").substr(-1) !== "/") {
          srcPath.push("");
        }

        var isAbsolute = srcPath[0] === "" ||
          srcPath[0] && srcPath[0].charAt(0) === "/";

        // put the host back
        if (psychotic) {
          result.hostname = result.host = isAbsolute
            ? ""
            : srcPath.length ? srcPath.shift() : "";
          //occationaly the auth can get stuck only in host
          //this especially happens in cases like
          //url.resolveObject('mailto:local1@domain1', 'local2@domain2')
          var authInHost = result.host && result.host.indexOf("@") > 0
            ? result.host.split("@")
            : false;
          if (authInHost) {
            result.auth = authInHost.shift();
            result.host = result.hostname = authInHost.shift();
          }
        }

        mustEndAbs = mustEndAbs || result.host && srcPath.length;

        if (mustEndAbs && !isAbsolute) {
          srcPath.unshift("");
        }

        if (!srcPath.length) {
          result.pathname = null;
          result.path = null;
        } else {
          result.pathname = srcPath.join("/");
        }

        //to support request.http
        if (!util.isNull(result.pathname) || !util.isNull(result.search)) {
          result.path = (result.pathname ? result.pathname : "") +
            (result.search ? result.search : "");
        }
        result.auth = relative.auth || result.auth;
        result.slashes = result.slashes || relative.slashes;
        result.href = result.format();
        return result;
      };

      Url.prototype.parseHost = function() {
        var host = this.host;
        var port = portPattern.exec(host);
        if (port) {
          port = port[0];
          if (port !== ":") {
            this.port = port.substr(1);
          }
          host = host.substr(0, host.length - port.length);
        }
        if (host) this.hostname = host;
      };

      /***/
    },
    /* 9 */
    /***/ function(module, exports, __webpack_require__) {
      var __WEBPACK_AMD_DEFINE_RESULT__;
      /* WEBPACK VAR INJECTION */ (function(module, global) {
        /*! https://mths.be/punycode v1.3.2 by @mathias */
        (function(root) {
          /** Detect free variables */
          var freeExports = typeof exports == "object" &&
            exports &&
            !exports.nodeType &&
            exports;
          var freeModule = typeof module == "object" &&
            module &&
            !module.nodeType &&
            module;
          var freeGlobal = typeof global == "object" && global;
          if (
            freeGlobal.global === freeGlobal ||
            freeGlobal.window === freeGlobal ||
            freeGlobal.self === freeGlobal
          ) {
            root = freeGlobal;
          }

          /**
		 * The `punycode` object.
		 * @name punycode
		 * @type Object
		 */
          var punycode,
            /** Highest positive signed 32-bit float value */
            maxInt = 2147483647, // aka. 0x7FFFFFFF or 2^31-1
            /** Bootstring parameters */
            base = 36,
            tMin = 1,
            tMax = 26,
            skew = 38,
            damp = 700,
            initialBias = 72,
            initialN = 128, // 0x80
            delimiter = "-", // '\x2D'
            /** Regular expressions */
            regexPunycode = /^xn--/,
            regexNonASCII = /[^\x20-\x7E]/, // unprintable ASCII chars + non-ASCII chars
            regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g, // RFC 3490 separators
            /** Error messages */
            errors = {
              overflow: "Overflow: input needs wider integers to process",
              "not-basic": "Illegal input >= 0x80 (not a basic code point)",
              "invalid-input": "Invalid input"
            },
            /** Convenience shortcuts */
            baseMinusTMin = base - tMin,
            floor = Math.floor,
            stringFromCharCode = String.fromCharCode,
            /** Temporary variable */
            key;

          /*--------------------------------------------------------------------------*/

          /**
		 * A generic error utility function.
		 * @private
		 * @param {String} type The error type.
		 * @returns {Error} Throws a `RangeError` with the applicable error message.
		 */
          function error(type) {
            throw RangeError(errors[type]);
          }

          /**
		 * A generic `Array#map` utility function.
		 * @private
		 * @param {Array} array The array to iterate over.
		 * @param {Function} callback The function that gets called for every array
		 * item.
		 * @returns {Array} A new array of values returned by the callback function.
		 */
          function map(array, fn) {
            var length = array.length;
            var result = [];
            while (length--) {
              result[length] = fn(array[length]);
            }
            return result;
          }

          /**
		 * A simple `Array#map`-like wrapper to work with domain name strings or email
		 * addresses.
		 * @private
		 * @param {String} domain The domain name or email address.
		 * @param {Function} callback The function that gets called for every
		 * character.
		 * @returns {Array} A new string of characters returned by the callback
		 * function.
		 */
          function mapDomain(string, fn) {
            var parts = string.split("@");
            var result = "";
            if (parts.length > 1) {
              // In email addresses, only the domain name should be punycoded. Leave
              // the local part (i.e. everything up to `@`) intact.
              result = parts[0] + "@";
              string = parts[1];
            }
            // Avoid `split(regex)` for IE8 compatibility. See #17.
            string = string.replace(regexSeparators, "\x2E");
            var labels = string.split(".");
            var encoded = map(labels, fn).join(".");
            return result + encoded;
          }

          /**
		 * Creates an array containing the numeric code points of each Unicode
		 * character in the string. While JavaScript uses UCS-2 internally,
		 * this function will convert a pair of surrogate halves (each of which
		 * UCS-2 exposes as separate characters) into a single code point,
		 * matching UTF-16.
		 * @see `punycode.ucs2.encode`
		 * @see <https://mathiasbynens.be/notes/javascript-encoding>
		 * @memberOf punycode.ucs2
		 * @name decode
		 * @param {String} string The Unicode input string (UCS-2).
		 * @returns {Array} The new array of code points.
		 */
          function ucs2decode(string) {
            var output = [], counter = 0, length = string.length, value, extra;
            while (counter < length) {
              value = string.charCodeAt((counter++));
              if (value >= 0xd800 && value <= 0xdbff && counter < length) {
                // high surrogate, and there is a next character
                extra = string.charCodeAt((counter++));
                if ((extra & 0xfc00) == 0xdc00) {
                  // low surrogate
                  output.push(
                    ((value & 0x3ff) << 10) + (extra & 0x3ff) + 0x10000
                  );
                } else {
                  // unmatched surrogate; only append this code unit, in case the next
                  // code unit is the high surrogate of a surrogate pair
                  output.push(value);
                  counter--;
                }
              } else {
                output.push(value);
              }
            }
            return output;
          }

          /**
		 * Creates a string based on an array of numeric code points.
		 * @see `punycode.ucs2.decode`
		 * @memberOf punycode.ucs2
		 * @name encode
		 * @param {Array} codePoints The array of numeric code points.
		 * @returns {String} The new Unicode string (UCS-2).
		 */
          function ucs2encode(array) {
            return map(array, function(value) {
              var output = "";
              if (value > 0xffff) {
                value -= 0x10000;
                output += stringFromCharCode(value >>> 10 & 0x3ff | 0xd800);
                value = 0xdc00 | value & 0x3ff;
              }
              output += stringFromCharCode(value);
              return output;
            }).join("");
          }

          /**
		 * Converts a basic code point into a digit/integer.
		 * @see `digitToBasic()`
		 * @private
		 * @param {Number} codePoint The basic numeric code point value.
		 * @returns {Number} The numeric value of a basic code point (for use in
		 * representing integers) in the range `0` to `base - 1`, or `base` if
		 * the code point does not represent a value.
		 */
          function basicToDigit(codePoint) {
            if (codePoint - 48 < 10) {
              return codePoint - 22;
            }
            if (codePoint - 65 < 26) {
              return codePoint - 65;
            }
            if (codePoint - 97 < 26) {
              return codePoint - 97;
            }
            return base;
          }

          /**
		 * Converts a digit/integer into a basic code point.
		 * @see `basicToDigit()`
		 * @private
		 * @param {Number} digit The numeric value of a basic code point.
		 * @returns {Number} The basic code point whose value (when used for
		 * representing integers) is `digit`, which needs to be in the range
		 * `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
		 * used; else, the lowercase form is used. The behavior is undefined
		 * if `flag` is non-zero and `digit` has no uppercase form.
		 */
          function digitToBasic(digit, flag) {
            //  0..25 map to ASCII a..z or A..Z
            // 26..35 map to ASCII 0..9
            return digit + 22 + 75 * (digit < 26) - ((flag != 0) << 5);
          }

          /**
		 * Bias adaptation function as per section 3.4 of RFC 3492.
		 * http://tools.ietf.org/html/rfc3492#section-3.4
		 * @private
		 */
          function adapt(delta, numPoints, firstTime) {
            var k = 0;
            delta = firstTime ? floor(delta / damp) : delta >> 1;
            delta += floor(delta / numPoints);
            for (
              ;
              /* no initialization */ delta > baseMinusTMin * tMax >> 1;
              k += base
            ) {
              delta = floor(delta / baseMinusTMin);
            }
            return floor(k + (baseMinusTMin + 1) * delta / (delta + skew));
          }

          /**
		 * Converts a Punycode string of ASCII-only symbols to a string of Unicode
		 * symbols.
		 * @memberOf punycode
		 * @param {String} input The Punycode string of ASCII-only symbols.
		 * @returns {String} The resulting string of Unicode symbols.
		 */
          function decode(input) {
            // Don't use UCS-2
            var output = [],
              inputLength = input.length,
              out,
              i = 0,
              n = initialN,
              bias = initialBias,
              basic,
              j,
              index,
              oldi,
              w,
              k,
              digit,
              t,
              /** Cached calculation results */
              baseMinusT;

            // Handle the basic code points: let `basic` be the number of input code
            // points before the last delimiter, or `0` if there is none, then copy
            // the first basic code points to the output.

            basic = input.lastIndexOf(delimiter);
            if (basic < 0) {
              basic = 0;
            }

            for (j = 0; j < basic; ++j) {
              // if it's not a basic code point
              if (input.charCodeAt(j) >= 0x80) {
                error("not-basic");
              }
              output.push(input.charCodeAt(j));
            }

            // Main decoding loop: start just after the last delimiter if any basic code
            // points were copied; start at the beginning otherwise.

            for (
              index = basic > 0 ? basic + 1 : 0;
              index < inputLength /* no final expression */;
              
            ) {
              // `index` is the index of the next character to be consumed.
              // Decode a generalized variable-length integer into `delta`,
              // which gets added to `i`. The overflow checking is easier
              // if we increase `i` as we go, then subtract off its starting
              // value at the end to obtain `delta`.
              for (oldi = i, w = 1, k = base /* no condition */; ; k += base) {
                if (index >= inputLength) {
                  error("invalid-input");
                }

                digit = basicToDigit(input.charCodeAt((index++)));

                if (digit >= base || digit > floor((maxInt - i) / w)) {
                  error("overflow");
                }

                i += digit * w;
                t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;

                if (digit < t) {
                  break;
                }

                baseMinusT = base - t;
                if (w > floor(maxInt / baseMinusT)) {
                  error("overflow");
                }

                w *= baseMinusT;
              }

              out = output.length + 1;
              bias = adapt(i - oldi, out, oldi == 0);

              // `i` was supposed to wrap around from `out` to `0`,
              // incrementing `n` each time, so we'll fix that now:
              if (floor(i / out) > maxInt - n) {
                error("overflow");
              }

              n += floor(i / out);
              i %= out;

              // Insert `n` at position `i` of the output
              output.splice((i++), 0, n);
            }

            return ucs2encode(output);
          }

          /**
		 * Converts a string of Unicode symbols (e.g. a domain name label) to a
		 * Punycode string of ASCII-only symbols.
		 * @memberOf punycode
		 * @param {String} input The string of Unicode symbols.
		 * @returns {String} The resulting Punycode string of ASCII-only symbols.
		 */
          function encode(input) {
            var n,
              delta,
              handledCPCount,
              basicLength,
              bias,
              j,
              m,
              q,
              k,
              t,
              currentValue,
              output = [],
              /** `inputLength` will hold the number of code points in `input`. */
              inputLength,
              /** Cached calculation results */
              handledCPCountPlusOne,
              baseMinusT,
              qMinusT;

            // Convert the input in UCS-2 to Unicode
            input = ucs2decode(input);

            // Cache the length
            inputLength = input.length;

            // Initialize the state
            n = initialN;
            delta = 0;
            bias = initialBias;

            // Handle the basic code points
            for (j = 0; j < inputLength; ++j) {
              currentValue = input[j];
              if (currentValue < 0x80) {
                output.push(stringFromCharCode(currentValue));
              }
            }

            handledCPCount = basicLength = output.length;

            // `handledCPCount` is the number of code points that have been handled;
            // `basicLength` is the number of basic code points.

            // Finish the basic string - if it is not empty - with a delimiter
            if (basicLength) {
              output.push(delimiter);
            }

            // Main encoding loop:
            while (handledCPCount < inputLength) {
              // All non-basic code points < n have been handled already. Find the next
              // larger one:
              for (m = maxInt, j = 0; j < inputLength; ++j) {
                currentValue = input[j];
                if (currentValue >= n && currentValue < m) {
                  m = currentValue;
                }
              }

              // Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
              // but guard against overflow
              handledCPCountPlusOne = handledCPCount + 1;
              if (m - n > floor((maxInt - delta) / handledCPCountPlusOne)) {
                error("overflow");
              }

              delta += (m - n) * handledCPCountPlusOne;
              n = m;

              for (j = 0; j < inputLength; ++j) {
                currentValue = input[j];

                if (currentValue < n && ++delta > maxInt) {
                  error("overflow");
                }

                if (currentValue == n) {
                  // Represent delta as a generalized variable-length integer
                  for (q = delta, k = base /* no condition */; ; k += base) {
                    t = k <= bias ? tMin : k >= bias + tMax ? tMax : k - bias;
                    if (q < t) {
                      break;
                    }
                    qMinusT = q - t;
                    baseMinusT = base - t;
                    output.push(
                      stringFromCharCode(
                        digitToBasic(t + qMinusT % baseMinusT, 0)
                      )
                    );
                    q = floor(qMinusT / baseMinusT);
                  }

                  output.push(stringFromCharCode(digitToBasic(q, 0)));
                  bias = adapt(
                    delta,
                    handledCPCountPlusOne,
                    handledCPCount == basicLength
                  );
                  delta = 0;
                  ++handledCPCount;
                }
              }

              ++delta;
              ++n;
            }
            return output.join("");
          }

          /**
		 * Converts a Punycode string representing a domain name or an email address
		 * to Unicode. Only the Punycoded parts of the input will be converted, i.e.
		 * it doesn't matter if you call it on a string that has already been
		 * converted to Unicode.
		 * @memberOf punycode
		 * @param {String} input The Punycoded domain name or email address to
		 * convert to Unicode.
		 * @returns {String} The Unicode representation of the given Punycode
		 * string.
		 */
          function toUnicode(input) {
            return mapDomain(input, function(string) {
              return regexPunycode.test(string)
                ? decode(string.slice(4).toLowerCase())
                : string;
            });
          }

          /**
		 * Converts a Unicode string representing a domain name or an email address to
		 * Punycode. Only the non-ASCII parts of the domain name will be converted,
		 * i.e. it doesn't matter if you call it with a domain that's already in
		 * ASCII.
		 * @memberOf punycode
		 * @param {String} input The domain name or email address to convert, as a
		 * Unicode string.
		 * @returns {String} The Punycode representation of the given domain name or
		 * email address.
		 */
          function toASCII(input) {
            return mapDomain(input, function(string) {
              return regexNonASCII.test(string)
                ? "xn--" + encode(string)
                : string;
            });
          }

          /*--------------------------------------------------------------------------*/

          /** Define the public API */
          punycode = {
            /**
			 * A string representing the current Punycode.js version number.
			 * @memberOf punycode
			 * @type String
			 */
            version: "1.3.2",
            /**
			 * An object of methods to convert from JavaScript's internal character
			 * representation (UCS-2) to Unicode code points, and back.
			 * @see <https://mathiasbynens.be/notes/javascript-encoding>
			 * @memberOf punycode
			 * @type Object
			 */
            ucs2: {
              decode: ucs2decode,
              encode: ucs2encode
            },
            decode: decode,
            encode: encode,
            toASCII: toASCII,
            toUnicode: toUnicode
          };

          /** Expose `punycode` */
          // Some AMD build optimizers, like r.js, check for specific condition patterns
          // like the following:
          if (true) {
            !(__WEBPACK_AMD_DEFINE_RESULT__ = (function() {
              return punycode;
            }).call(
              exports,
              __webpack_require__,
              exports,
              module
            ), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined &&
              (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
          } else if (freeExports && freeModule) {
            if (module.exports == freeExports) {
              // in Node.js or RingoJS v0.8.0+
              freeModule.exports = punycode;
            } else {
              // in Narwhal or RingoJS v0.7.0-
              for (key in punycode) {
                punycode.hasOwnProperty(key) &&
                  (freeExports[key] = punycode[key]);
              }
            }
          } else {
            // in Rhino or a web browser
            root.punycode = punycode;
          }
        })(this);

        /* WEBPACK VAR INJECTION */
      }).call(
        exports,
        __webpack_require__(10)(module),
        (function() {
          return this;
        })()
      );

      /***/
    },
    /* 10 */
    /***/ function(module, exports) {
      module.exports = function(module) {
        if (!module.webpackPolyfill) {
          module.deprecate = function() {};
          module.paths = [];
          // module.parent = undefined by default
          module.children = [];
          module.webpackPolyfill = 1;
        }
        return module;
      };

      /***/
    },
    /* 11 */
    /***/ function(module, exports) {
      "use strict";
      module.exports = {
        isString: function(arg) {
          return typeof arg === "string";
        },
        isObject: function(arg) {
          return typeof arg === "object" && arg !== null;
        },
        isNull: function(arg) {
          return arg === null;
        },
        isNullOrUndefined: function(arg) {
          return arg == null;
        }
      };

      /***/
    },
    /* 12 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      exports.decode = exports.parse = __webpack_require__(13);
      exports.encode = exports.stringify = __webpack_require__(14);

      /***/
    },
    /* 13 */
    /***/ function(module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      "use strict";
      // If obj.hasOwnProperty has been overridden, then calling
      // obj.hasOwnProperty(prop) will break.
      // See: https://github.com/joyent/node/issues/1707
      function hasOwnProperty(obj, prop) {
        return Object.prototype.hasOwnProperty.call(obj, prop);
      }

      module.exports = function(qs, sep, eq, options) {
        sep = sep || "&";
        eq = eq || "=";
        var obj = {};

        if (typeof qs !== "string" || qs.length === 0) {
          return obj;
        }

        var regexp = /\+/g;
        qs = qs.split(sep);

        var maxKeys = 1000;
        if (options && typeof options.maxKeys === "number") {
          maxKeys = options.maxKeys;
        }

        var len = qs.length;
        // maxKeys <= 0 means that we should not limit keys count
        if (maxKeys > 0 && len > maxKeys) {
          len = maxKeys;
        }

        for (var i = 0; i < len; ++i) {
          var x = qs[i].replace(regexp, "%20"),
            idx = x.indexOf(eq),
            kstr,
            vstr,
            k,
            v;

          if (idx >= 0) {
            kstr = x.substr(0, idx);
            vstr = x.substr(idx + 1);
          } else {
            kstr = x;
            vstr = "";
          }

          k = decodeURIComponent(kstr);
          v = decodeURIComponent(vstr);

          if (!hasOwnProperty(obj, k)) {
            obj[k] = v;
          } else if (Array.isArray(obj[k])) {
            obj[k].push(v);
          } else {
            obj[k] = [obj[k], v];
          }
        }

        return obj;
      };

      /***/
    },
    /* 14 */
    /***/ function(module, exports) {
      // Copyright Joyent, Inc. and other Node contributors.
      //
      // Permission is hereby granted, free of charge, to any person obtaining a
      // copy of this software and associated documentation files (the
      // "Software"), to deal in the Software without restriction, including
      // without limitation the rights to use, copy, modify, merge, publish,
      // distribute, sublicense, and/or sell copies of the Software, and to permit
      // persons to whom the Software is furnished to do so, subject to the
      // following conditions:
      //
      // The above copyright notice and this permission notice shall be included
      // in all copies or substantial portions of the Software.
      //
      // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
      // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
      // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
      // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
      // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
      // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
      // USE OR OTHER DEALINGS IN THE SOFTWARE.

      "use strict";
      var stringifyPrimitive = function(v) {
        switch (typeof v) {
          case "string":
            return v;

          case "boolean":
            return v ? "true" : "false";

          case "number":
            return isFinite(v) ? v : "";

          default:
            return "";
        }
      };

      module.exports = function(obj, sep, eq, name) {
        sep = sep || "&";
        eq = eq || "=";
        if (obj === null) {
          obj = undefined;
        }

        if (typeof obj === "object") {
          return Object.keys(obj)
            .map(function(k) {
              var ks = encodeURIComponent(stringifyPrimitive(k)) + eq;
              if (Array.isArray(obj[k])) {
                return obj[k]
                  .map(function(v) {
                    return ks + encodeURIComponent(stringifyPrimitive(v));
                  })
                  .join(sep);
              } else {
                return ks + encodeURIComponent(stringifyPrimitive(obj[k]));
              }
            })
            .join(sep);
        }

        if (!name) return "";
        return encodeURIComponent(stringifyPrimitive(name)) +
          eq +
          encodeURIComponent(stringifyPrimitive(obj));
      };

      /***/
    },
    /* 15 */
    /***/ function(module, exports, __webpack_require__) {
      module.exports = __webpack_require__(16);

      /***/
    },
    /* 16 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var utils = __webpack_require__(17);
      var bind = __webpack_require__(18);
      var Axios = __webpack_require__(19);
      var defaults = __webpack_require__(20);

      /**
	 * Create an instance of Axios
	 *
	 * @param {Object} defaultConfig The default config for the instance
	 * @return {Axios} A new instance of Axios
	 */
      function createInstance(defaultConfig) {
        var context = new Axios(defaultConfig);
        var instance = bind(Axios.prototype.request, context);

        // Copy axios.prototype to instance
        utils.extend(instance, Axios.prototype, context);

        // Copy context to instance
        utils.extend(instance, context);

        return instance;
      }

      // Create the default instance to be exported
      var axios = createInstance(defaults);

      // Expose Axios class to allow class inheritance
      axios.Axios = Axios;

      // Factory for creating new instances
      axios.create = function create(instanceConfig) {
        return createInstance(utils.merge(defaults, instanceConfig));
      };

      // Expose Cancel & CancelToken
      axios.Cancel = __webpack_require__(38);
      axios.CancelToken = __webpack_require__(39);
      axios.isCancel = __webpack_require__(35);

      // Expose all/spread
      axios.all = function all(promises) {
        return Promise.all(promises);
      };
      axios.spread = __webpack_require__(40);

      module.exports = axios;

      // Allow use of default import syntax in TypeScript
      module.exports.default = axios;

      /***/
    },
    /* 17 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var bind = __webpack_require__(18);

      /*global toString:true*/

      // utils is a library of generic helper functions non-specific to axios

      var toString = Object.prototype.toString;

      /**
	 * Determine if a value is an Array
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Array, otherwise false
	 */
      function isArray(val) {
        return toString.call(val) === "[object Array]";
      }

      /**
	 * Determine if a value is an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
	 */
      function isArrayBuffer(val) {
        return toString.call(val) === "[object ArrayBuffer]";
      }

      /**
	 * Determine if a value is a FormData
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an FormData, otherwise false
	 */
      function isFormData(val) {
        return typeof FormData !== "undefined" && val instanceof FormData;
      }

      /**
	 * Determine if a value is a view on an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	 */
      function isArrayBufferView(val) {
        var result;
        if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView) {
          result = ArrayBuffer.isView(val);
        } else {
          result = val && val.buffer && val.buffer instanceof ArrayBuffer;
        }
        return result;
      }

      /**
	 * Determine if a value is a String
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a String, otherwise false
	 */
      function isString(val) {
        return typeof val === "string";
      }

      /**
	 * Determine if a value is a Number
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Number, otherwise false
	 */
      function isNumber(val) {
        return typeof val === "number";
      }

      /**
	 * Determine if a value is undefined
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if the value is undefined, otherwise false
	 */
      function isUndefined(val) {
        return typeof val === "undefined";
      }

      /**
	 * Determine if a value is an Object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Object, otherwise false
	 */
      function isObject(val) {
        return val !== null && typeof val === "object";
      }

      /**
	 * Determine if a value is a Date
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Date, otherwise false
	 */
      function isDate(val) {
        return toString.call(val) === "[object Date]";
      }

      /**
	 * Determine if a value is a File
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a File, otherwise false
	 */
      function isFile(val) {
        return toString.call(val) === "[object File]";
      }

      /**
	 * Determine if a value is a Blob
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Blob, otherwise false
	 */
      function isBlob(val) {
        return toString.call(val) === "[object Blob]";
      }

      /**
	 * Determine if a value is a Function
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Function, otherwise false
	 */
      function isFunction(val) {
        return toString.call(val) === "[object Function]";
      }

      /**
	 * Determine if a value is a Stream
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Stream, otherwise false
	 */
      function isStream(val) {
        return isObject(val) && isFunction(val.pipe);
      }

      /**
	 * Determine if a value is a URLSearchParams object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
	 */
      function isURLSearchParams(val) {
        return typeof URLSearchParams !== "undefined" &&
          val instanceof URLSearchParams;
      }

      /**
	 * Trim excess whitespace off the beginning and end of a string
	 *
	 * @param {String} str The String to trim
	 * @returns {String} The String freed of excess whitespace
	 */
      function trim(str) {
        return str.replace(/^\s*/, "").replace(/\s*$/, "");
      }

      /**
	 * Determine if we're running in a standard browser environment
	 *
	 * This allows axios to run in a web worker, and react-native.
	 * Both environments support XMLHttpRequest, but not fully standard globals.
	 *
	 * web workers:
	 *  typeof window -> undefined
	 *  typeof document -> undefined
	 *
	 * react-native:
	 *  typeof document.createElement -> undefined
	 */
      function isStandardBrowserEnv() {
        return typeof window !== "undefined" &&
          typeof document !== "undefined" &&
          typeof document.createElement === "function";
      }

      /**
	 * Iterate over an Array or an Object invoking a function for each item.
	 *
	 * If `obj` is an Array callback will be called passing
	 * the value, index, and complete array for each item.
	 *
	 * If 'obj' is an Object callback will be called passing
	 * the value, key, and complete object for each property.
	 *
	 * @param {Object|Array} obj The object to iterate
	 * @param {Function} fn The callback to invoke for each item
	 */
      function forEach(obj, fn) {
        // Don't bother if no value provided
        if (obj === null || typeof obj === "undefined") {
          return;
        }

        // Force an array if not already something iterable
        if (typeof obj !== "object" && !isArray(obj)) {
          /*eslint no-param-reassign:0*/
          obj = [obj];
        }

        if (isArray(obj)) {
          // Iterate over array values
          for (var i = 0, l = obj.length; i < l; i++) {
            fn.call(null, obj[i], i, obj);
          }
        } else {
          // Iterate over object keys
          for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
              fn.call(null, obj[key], key, obj);
            }
          }
        }
      }

      /**
	 * Accepts varargs expecting each argument to be an object, then
	 * immutably merges the properties of each object and returns result.
	 *
	 * When multiple objects contain the same key the later object in
	 * the arguments list will take precedence.
	 *
	 * Example:
	 *
	 * ```js
	 * var result = merge({foo: 123}, {foo: 456});
	 * console.log(result.foo); // outputs 456
	 * ```
	 *
	 * @param {Object} obj1 Object to merge
	 * @returns {Object} Result of all merge properties
	 */
      function merge /* obj1, obj2, obj3, ... */() {
        var result = {};
        function assignValue(val, key) {
          if (typeof result[key] === "object" && typeof val === "object") {
            result[key] = merge(result[key], val);
          } else {
            result[key] = val;
          }
        }

        for (var i = 0, l = arguments.length; i < l; i++) {
          forEach(arguments[i], assignValue);
        }
        return result;
      }

      /**
	 * Extends object a by mutably adding to it the properties of object b.
	 *
	 * @param {Object} a The object to be extended
	 * @param {Object} b The object to copy properties from
	 * @param {Object} thisArg The object to bind function to
	 * @return {Object} The resulting value of object a
	 */
      function extend(a, b, thisArg) {
        forEach(b, function assignValue(val, key) {
          if (thisArg && typeof val === "function") {
            a[key] = bind(val, thisArg);
          } else {
            a[key] = val;
          }
        });
        return a;
      }

      module.exports = {
        isArray: isArray,
        isArrayBuffer: isArrayBuffer,
        isFormData: isFormData,
        isArrayBufferView: isArrayBufferView,
        isString: isString,
        isNumber: isNumber,
        isObject: isObject,
        isUndefined: isUndefined,
        isDate: isDate,
        isFile: isFile,
        isBlob: isBlob,
        isFunction: isFunction,
        isStream: isStream,
        isURLSearchParams: isURLSearchParams,
        isStandardBrowserEnv: isStandardBrowserEnv,
        forEach: forEach,
        merge: merge,
        extend: extend,
        trim: trim
      };

      /***/
    },
    /* 18 */
    /***/ function(module, exports) {
      "use strict";
      module.exports = function bind(fn, thisArg) {
        return function wrap() {
          var args = new Array(arguments.length);
          for (var i = 0; i < args.length; i++) {
            args[i] = arguments[i];
          }
          return fn.apply(thisArg, args);
        };
      };

      /***/
    },
    /* 19 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var defaults = __webpack_require__(20);
      var utils = __webpack_require__(17);
      var InterceptorManager = __webpack_require__(32);
      var dispatchRequest = __webpack_require__(33);
      var isAbsoluteURL = __webpack_require__(36);
      var combineURLs = __webpack_require__(37);

      /**
	 * Create a new instance of Axios
	 *
	 * @param {Object} instanceConfig The default config for the instance
	 */
      function Axios(instanceConfig) {
        this.defaults = instanceConfig;
        this.interceptors = {
          request: new InterceptorManager(),
          response: new InterceptorManager()
        };
      }

      /**
	 * Dispatch a request
	 *
	 * @param {Object} config The config specific for this request (merged with this.defaults)
	 */
      Axios.prototype.request = function request(config) {
        /*eslint no-param-reassign:0*/
        // Allow for axios('example/url'[, config]) a la fetch API
        if (typeof config === "string") {
          config = utils.merge(
            {
              url: arguments[0]
            },
            arguments[1]
          );
        }

        config = utils.merge(
          defaults,
          this.defaults,
          { method: "get" },
          config
        );

        // Support baseURL config
        if (config.baseURL && !isAbsoluteURL(config.url)) {
          config.url = combineURLs(config.baseURL, config.url);
        }

        // Hook up interceptors middleware
        var chain = [dispatchRequest, undefined];
        var promise = Promise.resolve(config);

        this.interceptors.request.forEach(function unshiftRequestInterceptors(
          interceptor
        ) {
          chain.unshift(interceptor.fulfilled, interceptor.rejected);
        });

        this.interceptors.response.forEach(function pushResponseInterceptors(
          interceptor
        ) {
          chain.push(interceptor.fulfilled, interceptor.rejected);
        });

        while (chain.length) {
          promise = promise.then(chain.shift(), chain.shift());
        }

        return promise;
      };

      // Provide aliases for supported request methods
      utils.forEach(["delete", "get", "head"], function forEachMethodNoData(
        method
      ) {
        /*eslint func-names:0*/
        Axios.prototype[method] = function(url, config) {
          return this.request(
            utils.merge(config || {}, {
              method: method,
              url: url
            })
          );
        };
      });

      utils.forEach(["post", "put", "patch"], function forEachMethodWithData(
        method
      ) {
        /*eslint func-names:0*/
        Axios.prototype[method] = function(url, data, config) {
          return this.request(
            utils.merge(config || {}, {
              method: method,
              url: url,
              data: data
            })
          );
        };
      });

      module.exports = Axios;

      /***/
    },
    /* 20 */
    /***/ function(module, exports, __webpack_require__) {
      /* WEBPACK VAR INJECTION */ (function(process) {
        "use strict";
        var utils = __webpack_require__(17);
        var normalizeHeaderName = __webpack_require__(22);

        var PROTECTION_PREFIX = /^\)\]\}',?\n/;
        var DEFAULT_CONTENT_TYPE = {
          "Content-Type": "application/x-www-form-urlencoded"
        };

        function setContentTypeIfUnset(headers, value) {
          if (
            !utils.isUndefined(headers) &&
            utils.isUndefined(headers["Content-Type"])
          ) {
            headers["Content-Type"] = value;
          }
        }

        function getDefaultAdapter() {
          var adapter;
          if (typeof XMLHttpRequest !== "undefined") {
            // For browsers use XHR adapter
            adapter = __webpack_require__(23);
          } else if (typeof process !== "undefined") {
            // For node use HTTP adapter
            adapter = __webpack_require__(23);
          }
          return adapter;
        }

        var defaults = {
          adapter: getDefaultAdapter(),

          transformRequest: [
            function transformRequest(data, headers) {
              normalizeHeaderName(headers, "Content-Type");
              if (
                utils.isFormData(data) ||
                utils.isArrayBuffer(data) ||
                utils.isStream(data) ||
                utils.isFile(data) ||
                utils.isBlob(data)
              ) {
                return data;
              }
              if (utils.isArrayBufferView(data)) {
                return data.buffer;
              }
              if (utils.isURLSearchParams(data)) {
                setContentTypeIfUnset(
                  headers,
                  "application/x-www-form-urlencoded;charset=utf-8"
                );
                return data.toString();
              }
              if (utils.isObject(data)) {
                setContentTypeIfUnset(
                  headers,
                  "application/json;charset=utf-8"
                );
                return JSON.stringify(data);
              }
              return data;
            }
          ],

          transformResponse: [
            function transformResponse(data) {
              /*eslint no-param-reassign:0*/
              if (typeof data === "string") {
                data = data.replace(PROTECTION_PREFIX, "");
                try {
                  data = JSON.parse(data);
                } catch (e) {
                  /* Ignore */
                }
              }
              return data;
            }
          ],

          timeout: 0,

          xsrfCookieName: "XSRF-TOKEN",
          xsrfHeaderName: "X-XSRF-TOKEN",

          maxContentLength: -1,

          validateStatus: function validateStatus(status) {
            return status >= 200 && status < 300;
          }
        };

        defaults.headers = {
          common: {
            Accept: "application/json, text/plain, */*"
          }
        };

        utils.forEach(["delete", "get", "head"], function forEachMehtodNoData(
          method
        ) {
          defaults.headers[method] = {};
        });

        utils.forEach(["post", "put", "patch"], function forEachMethodWithData(
          method
        ) {
          defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
        });

        module.exports = defaults;

        /* WEBPACK VAR INJECTION */
      }).call(exports, __webpack_require__(21));

      /***/
    },
    /* 21 */
    /***/ function(module, exports) {
      // shim for using process in browser
      var process = module.exports = {};

      // cached from whatever global is present so that test runners that stub it
      // don't break things.  But we need to wrap it in a try catch in case it is
      // wrapped in strict mode code which doesn't define any globals.  It's inside a
      // function because try/catches deoptimize in certain engines.

      var cachedSetTimeout;
      var cachedClearTimeout;

      function defaultSetTimout() {
        throw new Error("setTimeout has not been defined");
      }
      function defaultClearTimeout() {
        throw new Error("clearTimeout has not been defined");
      }
      (function() {
        try {
          if (typeof setTimeout === "function") {
            cachedSetTimeout = setTimeout;
          } else {
            cachedSetTimeout = defaultSetTimout;
          }
        } catch (e) {
          cachedSetTimeout = defaultSetTimout;
        }
        try {
          if (typeof clearTimeout === "function") {
            cachedClearTimeout = clearTimeout;
          } else {
            cachedClearTimeout = defaultClearTimeout;
          }
        } catch (e) {
          cachedClearTimeout = defaultClearTimeout;
        }
      })();
      function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
          //normal enviroments in sane situations
          return setTimeout(fun, 0);
        }
        // if setTimeout wasn't available but was latter defined
        if (
          (cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) &&
          setTimeout
        ) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
        }
        try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedSetTimeout(fun, 0);
        } catch (e) {
          try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
          } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
          }
        }
      }
      function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
          //normal enviroments in sane situations
          return clearTimeout(marker);
        }
        // if clearTimeout wasn't available but was latter defined
        if (
          (cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) &&
          clearTimeout
        ) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
        }
        try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedClearTimeout(marker);
        } catch (e) {
          try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
          } catch (e) {
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
          }
        }
      }
      var queue = [];
      var draining = false;
      var currentQueue;
      var queueIndex = -1;

      function cleanUpNextTick() {
        if (!draining || !currentQueue) {
          return;
        }
        draining = false;
        if (currentQueue.length) {
          queue = currentQueue.concat(queue);
        } else {
          queueIndex = -1;
        }
        if (queue.length) {
          drainQueue();
        }
      }

      function drainQueue() {
        if (draining) {
          return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;

        var len = queue.length;
        while (len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
            if (currentQueue) {
              currentQueue[queueIndex].run();
            }
          }
          queueIndex = -1;
          len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
      }

      process.nextTick = function(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
          }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
        }
      };

      // v8 likes predictible objects
      function Item(fun, array) {
        this.fun = fun;
        this.array = array;
      }
      Item.prototype.run = function() {
        this.fun.apply(null, this.array);
      };
      process.title = "browser";
      process.browser = true;
      process.env = {};
      process.argv = [];
      process.version = ""; // empty string to avoid regexp issues
      process.versions = {};

      function noop() {}

      process.on = noop;
      process.addListener = noop;
      process.once = noop;
      process.off = noop;
      process.removeListener = noop;
      process.removeAllListeners = noop;
      process.emit = noop;

      process.binding = function(name) {
        throw new Error("process.binding is not supported");
      };

      process.cwd = function() {
        return "/";
      };
      process.chdir = function(dir) {
        throw new Error("process.chdir is not supported");
      };
      process.umask = function() {
        return 0;
      };

      /***/
    },
    /* 22 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var utils = __webpack_require__(17);

      module.exports = function normalizeHeaderName(headers, normalizedName) {
        utils.forEach(headers, function processHeader(value, name) {
          if (
            name !== normalizedName &&
            name.toUpperCase() === normalizedName.toUpperCase()
          ) {
            headers[normalizedName] = value;
            delete headers[name];
          }
        });
      };

      /***/
    },
    /* 23 */
    /***/ function(module, exports, __webpack_require__) {
      /* WEBPACK VAR INJECTION */ (function(process) {
        "use strict";
        var utils = __webpack_require__(17);
        var settle = __webpack_require__(24);
        var buildURL = __webpack_require__(27);
        var parseHeaders = __webpack_require__(28);
        var isURLSameOrigin = __webpack_require__(29);
        var createError = __webpack_require__(25);
        var btoa = typeof window !== "undefined" &&
          window.btoa &&
          window.btoa.bind(window) ||
          __webpack_require__(30);

        module.exports = function xhrAdapter(config) {
          return new Promise(function dispatchXhrRequest(resolve, reject) {
            var requestData = config.data;
            var requestHeaders = config.headers;

            if (utils.isFormData(requestData)) {
              delete requestHeaders["Content-Type"]; // Let the browser set it
            }

            var request = new XMLHttpRequest();
            var loadEvent = "onreadystatechange";
            var xDomain = false;

            // For IE 8/9 CORS support
            // Only supports POST and GET calls and doesn't returns the response headers.
            // DON'T do this for testing b/c XMLHttpRequest is mocked, not XDomainRequest.
            if (
              process.env.NODE_ENV !== "test" &&
              typeof window !== "undefined" &&
              window.XDomainRequest &&
              !("withCredentials" in request) &&
              !isURLSameOrigin(config.url)
            ) {
              request = new window.XDomainRequest();
              loadEvent = "onload";
              xDomain = true;
              request.onprogress = function handleProgress() {};
              request.ontimeout = function handleTimeout() {};
            }

            // HTTP basic authentication
            if (config.auth) {
              var username = config.auth.username || "";
              var password = config.auth.password || "";
              requestHeaders.Authorization = "Basic " +
                btoa(username + ":" + password);
            }

            request.open(
              config.method.toUpperCase(),
              buildURL(config.url, config.params, config.paramsSerializer),
              true
            );

            // Set the request timeout in MS
            request.timeout = config.timeout;

            // Listen for ready state
            request[loadEvent] = function handleLoad() {
              if (!request || request.readyState !== 4 && !xDomain) {
                return;
              }

              // The request errored out and we didn't get a response, this will be
              // handled by onerror instead
              // With one exception: request that using file: protocol, most browsers
              // will return status as 0 even though it's a successful request
              if (
                request.status === 0 &&
                !(request.responseURL &&
                  request.responseURL.indexOf("file:") === 0)
              ) {
                return;
              }

              // Prepare the response
              var responseHeaders = "getAllResponseHeaders" in request
                ? parseHeaders(request.getAllResponseHeaders())
                : null;
              var responseData = !config.responseType ||
                config.responseType === "text"
                ? request.responseText
                : request.response;
              var response = {
                data: responseData,
                // IE sends 1223 instead of 204 (https://github.com/mzabriskie/axios/issues/201)
                status: request.status === 1223 ? 204 : request.status,
                statusText: request.status === 1223
                  ? "No Content"
                  : request.statusText,
                headers: responseHeaders,
                config: config,
                request: request
              };

              settle(resolve, reject, response);

              // Clean up request
              request = null;
            };

            // Handle low level network errors
            request.onerror = function handleError() {
              // Real errors are hidden from us by the browser
              // onerror should only fire if it's a network error
              reject(createError("Network Error", config));

              // Clean up request
              request = null;
            };

            // Handle timeout
            request.ontimeout = function handleTimeout() {
              reject(
                createError(
                  "timeout of " + config.timeout + "ms exceeded",
                  config,
                  "ECONNABORTED"
                )
              );

              // Clean up request
              request = null;
            };

            // Add xsrf header
            // This is only done if running in a standard browser environment.
            // Specifically not if we're in a web worker, or react-native.
            if (utils.isStandardBrowserEnv()) {
              var cookies = __webpack_require__(31);

              // Add xsrf header
              var xsrfValue = (config.withCredentials ||
                isURLSameOrigin(config.url)) &&
                config.xsrfCookieName
                ? cookies.read(config.xsrfCookieName)
                : undefined;

              if (xsrfValue) {
                requestHeaders[config.xsrfHeaderName] = xsrfValue;
              }
            }

            // Add headers to the request
            if ("setRequestHeader" in request) {
              utils.forEach(requestHeaders, function setRequestHeader(
                val,
                key
              ) {
                if (
                  typeof requestData === "undefined" &&
                  key.toLowerCase() === "content-type"
                ) {
                  // Remove Content-Type if data is undefined
                  delete requestHeaders[key];
                } else {
                  // Otherwise add header to the request
                  request.setRequestHeader(key, val);
                }
              });
            }

            // Add withCredentials to request if needed
            if (config.withCredentials) {
              request.withCredentials = true;
            }

            // Add responseType to request if needed
            if (config.responseType) {
              try {
                request.responseType = config.responseType;
              } catch (e) {
                if (request.responseType !== "json") {
                  throw e;
                }
              }
            }

            // Handle progress if needed
            if (typeof config.onDownloadProgress === "function") {
              request.addEventListener("progress", config.onDownloadProgress);
            }

            // Not all browsers support upload events
            if (
              typeof config.onUploadProgress === "function" && request.upload
            ) {
              request.upload.addEventListener(
                "progress",
                config.onUploadProgress
              );
            }

            if (config.cancelToken) {
              // Handle cancellation
              config.cancelToken.promise.then(function onCanceled(cancel) {
                if (!request) {
                  return;
                }

                request.abort();
                reject(cancel);
                // Clean up request
                request = null;
              });
            }

            if (requestData === undefined) {
              requestData = null;
            }

            // Send the request
            request.send(requestData);
          });
        };

        /* WEBPACK VAR INJECTION */
      }).call(exports, __webpack_require__(21));

      /***/
    },
    /* 24 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var createError = __webpack_require__(25);

      /**
	 * Resolve or reject a Promise based on response status.
	 *
	 * @param {Function} resolve A function that resolves the promise.
	 * @param {Function} reject A function that rejects the promise.
	 * @param {object} response The response.
	 */
      module.exports = function settle(resolve, reject, response) {
        var validateStatus = response.config.validateStatus;
        // Note: status is not exposed by XDomainRequest
        if (
          !response.status || !validateStatus || validateStatus(response.status)
        ) {
          resolve(response);
        } else {
          reject(
            createError(
              "Request failed with status code " + response.status,
              response.config,
              null,
              response
            )
          );
        }
      };

      /***/
    },
    /* 25 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var enhanceError = __webpack_require__(26);

      /**
	 * Create an Error with the specified message, config, error code, and response.
	 *
	 * @param {string} message The error message.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 @ @param {Object} [response] The response.
	 * @returns {Error} The created error.
	 */
      module.exports = function createError(message, config, code, response) {
        var error = new Error(message);
        return enhanceError(error, config, code, response);
      };

      /***/
    },
    /* 26 */
    /***/ function(module, exports) {
      "use strict";
      /**
	 * Update an Error with the specified config, error code, and response.
	 *
	 * @param {Error} error The error to update.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 @ @param {Object} [response] The response.
	 * @returns {Error} The error.
	 */
      module.exports = function enhanceError(error, config, code, response) {
        error.config = config;
        if (code) {
          error.code = code;
        }
        error.response = response;
        return error;
      };

      /***/
    },
    /* 27 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var utils = __webpack_require__(17);

      function encode(val) {
        return encodeURIComponent(val)
          .replace(/%40/gi, "@")
          .replace(/%3A/gi, ":")
          .replace(/%24/g, "$")
          .replace(/%2C/gi, ",")
          .replace(/%20/g, "+")
          .replace(/%5B/gi, "[")
          .replace(/%5D/gi, "]");
      }

      /**
	 * Build a URL by appending params to the end
	 *
	 * @param {string} url The base of the url (e.g., http://www.google.com)
	 * @param {object} [params] The params to be appended
	 * @returns {string} The formatted url
	 */
      module.exports = function buildURL(url, params, paramsSerializer) {
        /*eslint no-param-reassign:0*/
        if (!params) {
          return url;
        }

        var serializedParams;
        if (paramsSerializer) {
          serializedParams = paramsSerializer(params);
        } else if (utils.isURLSearchParams(params)) {
          serializedParams = params.toString();
        } else {
          var parts = [];

          utils.forEach(params, function serialize(val, key) {
            if (val === null || typeof val === "undefined") {
              return;
            }

            if (utils.isArray(val)) {
              key = key + "[]";
            }

            if (!utils.isArray(val)) {
              val = [val];
            }

            utils.forEach(val, function parseValue(v) {
              if (utils.isDate(v)) {
                v = v.toISOString();
              } else if (utils.isObject(v)) {
                v = JSON.stringify(v);
              }
              parts.push(encode(key) + "=" + encode(v));
            });
          });

          serializedParams = parts.join("&");
        }

        if (serializedParams) {
          url += (url.indexOf("?") === -1 ? "?" : "&") + serializedParams;
        }

        return url;
      };

      /***/
    },
    /* 28 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var utils = __webpack_require__(17);

      /**
	 * Parse headers into an object
	 *
	 * ```
	 * Date: Wed, 27 Aug 2014 08:58:49 GMT
	 * Content-Type: application/json
	 * Connection: keep-alive
	 * Transfer-Encoding: chunked
	 * ```
	 *
	 * @param {String} headers Headers needing to be parsed
	 * @returns {Object} Headers parsed into an object
	 */
      module.exports = function parseHeaders(headers) {
        var parsed = {};
        var key;
        var val;
        var i;

        if (!headers) {
          return parsed;
        }

        utils.forEach(headers.split("\n"), function parser(line) {
          i = line.indexOf(":");
          key = utils.trim(line.substr(0, i)).toLowerCase();
          val = utils.trim(line.substr(i + 1));

          if (key) {
            parsed[key] = parsed[key] ? parsed[key] + ", " + val : val;
          }
        });

        return parsed;
      };

      /***/
    },
    /* 29 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var utils = __webpack_require__(17);

      module.exports = utils.isStandardBrowserEnv()
        ? // Standard browser envs have full support of the APIs needed to test
          // whether the request URL is of the same origin as current location.
          (function standardBrowserEnv() {
            var msie = /(msie|trident)/i.test(navigator.userAgent);
            var urlParsingNode = document.createElement("a");
            var originURL;

            /**
	    * Parse a URL to discover it's components
	    *
	    * @param {String} url The URL to be parsed
	    * @returns {Object}
	    */
            function resolveURL(url) {
              var href = url;

              if (msie) {
                // IE needs attribute set twice to normalize properties
                urlParsingNode.setAttribute("href", href);
                href = urlParsingNode.href;
              }

              urlParsingNode.setAttribute("href", href);

              // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
              return {
                href: urlParsingNode.href,
                protocol: urlParsingNode.protocol
                  ? urlParsingNode.protocol.replace(/:$/, "")
                  : "",
                host: urlParsingNode.host,
                search: urlParsingNode.search
                  ? urlParsingNode.search.replace(/^\?/, "")
                  : "",
                hash: urlParsingNode.hash
                  ? urlParsingNode.hash.replace(/^#/, "")
                  : "",
                hostname: urlParsingNode.hostname,
                port: urlParsingNode.port,
                pathname: urlParsingNode.pathname.charAt(0) === "/"
                  ? urlParsingNode.pathname
                  : "/" + urlParsingNode.pathname
              };
            }

            originURL = resolveURL(window.location.href);

            /**
	    * Determine if a URL shares the same origin as the current location
	    *
	    * @param {String} requestURL The URL to test
	    * @returns {boolean} True if URL shares the same origin, otherwise false
	    */
            return function isURLSameOrigin(requestURL) {
              var parsed = utils.isString(requestURL)
                ? resolveURL(requestURL)
                : requestURL;
              return parsed.protocol === originURL.protocol &&
                parsed.host === originURL.host;
            };
          })()
        : // Non standard browser envs (web workers, react-native) lack needed support.
          (function nonStandardBrowserEnv() {
            return function isURLSameOrigin() {
              return true;
            };
          })();

      /***/
    },
    /* 30 */
    /***/ function(module, exports) {
      "use strict";
      // btoa polyfill for IE<10 courtesy https://github.com/davidchambers/Base64.js

      var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

      function E() {
        this.message = "String contains an invalid character";
      }
      E.prototype = new Error();
      E.prototype.code = 5;
      E.prototype.name = "InvalidCharacterError";

      function btoa(input) {
        var str = String(input);
        var output = "";
        for (
          // initialize result and counter
          var block, charCode, idx = 0, map = chars;
          // if the next str index does not exist:
          //   change the mapping table to "="
          //   check if d has no fractional digits
          str.charAt(idx | 0) || (map = "=", idx % 1);
          // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
          output += map.charAt(63 & block >> 8 - idx % 1 * 8)
        ) {
          charCode = str.charCodeAt(idx += 3 / 4);
          if (charCode > 0xff) {
            throw new E();
          }
          block = block << 8 | charCode;
        }
        return output;
      }

      module.exports = btoa;

      /***/
    },
    /* 31 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var utils = __webpack_require__(17);

      module.exports = utils.isStandardBrowserEnv()
        ? // Standard browser envs support document.cookie
          (function standardBrowserEnv() {
            return {
              write: function write(
                name,
                value,
                expires,
                path,
                domain,
                secure
              ) {
                var cookie = [];
                cookie.push(name + "=" + encodeURIComponent(value));

                if (utils.isNumber(expires)) {
                  cookie.push("expires=" + new Date(expires).toGMTString());
                }

                if (utils.isString(path)) {
                  cookie.push("path=" + path);
                }

                if (utils.isString(domain)) {
                  cookie.push("domain=" + domain);
                }

                if (secure === true) {
                  cookie.push("secure");
                }

                document.cookie = cookie.join("; ");
              },

              read: function read(name) {
                var match = document.cookie.match(
                  new RegExp("(^|;\\s*)(" + name + ")=([^;]*)")
                );
                return match ? decodeURIComponent(match[3]) : null;
              },

              remove: function remove(name) {
                this.write(name, "", Date.now() - 86400000);
              }
            };
          })()
        : // Non standard browser env (web workers, react-native) lack needed support.
          (function nonStandardBrowserEnv() {
            return {
              write: function write() {},
              read: function read() {
                return null;
              },
              remove: function remove() {}
            };
          })();

      /***/
    },
    /* 32 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var utils = __webpack_require__(17);

      function InterceptorManager() {
        this.handlers = [];
      }

      /**
	 * Add a new interceptor to the stack
	 *
	 * @param {Function} fulfilled The function to handle `then` for a `Promise`
	 * @param {Function} rejected The function to handle `reject` for a `Promise`
	 *
	 * @return {Number} An ID used to remove interceptor later
	 */
      InterceptorManager.prototype.use = function use(fulfilled, rejected) {
        this.handlers.push({
          fulfilled: fulfilled,
          rejected: rejected
        });
        return this.handlers.length - 1;
      };

      /**
	 * Remove an interceptor from the stack
	 *
	 * @param {Number} id The ID that was returned by `use`
	 */
      InterceptorManager.prototype.eject = function eject(id) {
        if (this.handlers[id]) {
          this.handlers[id] = null;
        }
      };

      /**
	 * Iterate over all the registered interceptors
	 *
	 * This method is particularly useful for skipping over any
	 * interceptors that may have become `null` calling `eject`.
	 *
	 * @param {Function} fn The function to call for each interceptor
	 */
      InterceptorManager.prototype.forEach = function forEach(fn) {
        utils.forEach(this.handlers, function forEachHandler(h) {
          if (h !== null) {
            fn(h);
          }
        });
      };

      module.exports = InterceptorManager;

      /***/
    },
    /* 33 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var utils = __webpack_require__(17);
      var transformData = __webpack_require__(34);
      var isCancel = __webpack_require__(35);
      var defaults = __webpack_require__(20);

      /**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
      function throwIfCancellationRequested(config) {
        if (config.cancelToken) {
          config.cancelToken.throwIfRequested();
        }
      }

      /**
	 * Dispatch a request to the server using the configured adapter.
	 *
	 * @param {object} config The config that is to be used for the request
	 * @returns {Promise} The Promise to be fulfilled
	 */
      module.exports = function dispatchRequest(config) {
        throwIfCancellationRequested(config);

        // Ensure headers exist
        config.headers = config.headers || {};

        // Transform request data
        config.data = transformData(
          config.data,
          config.headers,
          config.transformRequest
        );

        // Flatten headers
        config.headers = utils.merge(
          config.headers.common || {},
          config.headers[config.method] || {},
          config.headers || {}
        );

        utils.forEach(
          ["delete", "get", "head", "post", "put", "patch", "common"],
          function cleanHeaderConfig(method) {
            delete config.headers[method];
          }
        );

        var adapter = config.adapter || defaults.adapter;

        return adapter(config).then(
          function onAdapterResolution(response) {
            throwIfCancellationRequested(config);

            // Transform response data
            response.data = transformData(
              response.data,
              response.headers,
              config.transformResponse
            );

            return response;
          },
          function onAdapterRejection(reason) {
            if (!isCancel(reason)) {
              throwIfCancellationRequested(config);

              // Transform response data
              if (reason && reason.response) {
                reason.response.data = transformData(
                  reason.response.data,
                  reason.response.headers,
                  config.transformResponse
                );
              }
            }

            return Promise.reject(reason);
          }
        );
      };

      /***/
    },
    /* 34 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var utils = __webpack_require__(17);

      /**
	 * Transform the data for a request or a response
	 *
	 * @param {Object|String} data The data to be transformed
	 * @param {Array} headers The headers for the request or response
	 * @param {Array|Function} fns A single function or Array of functions
	 * @returns {*} The resulting transformed data
	 */
      module.exports = function transformData(data, headers, fns) {
        /*eslint no-param-reassign:0*/
        utils.forEach(fns, function transform(fn) {
          data = fn(data, headers);
        });

        return data;
      };

      /***/
    },
    /* 35 */
    /***/ function(module, exports) {
      "use strict";
      module.exports = function isCancel(value) {
        return !!(value && value.__CANCEL__);
      };

      /***/
    },
    /* 36 */
    /***/ function(module, exports) {
      "use strict";
      /**
	 * Determines whether the specified URL is absolute
	 *
	 * @param {string} url The URL to test
	 * @returns {boolean} True if the specified URL is absolute, otherwise false
	 */
      module.exports = function isAbsoluteURL(url) {
        // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
        // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
        // by any combination of letters, digits, plus, period, or hyphen.
        return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
      };

      /***/
    },
    /* 37 */
    /***/ function(module, exports) {
      "use strict";
      /**
	 * Creates a new URL by combining the specified URLs
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} relativeURL The relative URL
	 * @returns {string} The combined URL
	 */
      module.exports = function combineURLs(baseURL, relativeURL) {
        return baseURL.replace(/\/+$/, "") +
          "/" +
          relativeURL.replace(/^\/+/, "");
      };

      /***/
    },
    /* 38 */
    /***/ function(module, exports) {
      "use strict";
      /**
	 * A `Cancel` is an object that is thrown when an operation is canceled.
	 *
	 * @class
	 * @param {string=} message The message.
	 */
      function Cancel(message) {
        this.message = message;
      }

      Cancel.prototype.toString = function toString() {
        return "Cancel" + (this.message ? ": " + this.message : "");
      };

      Cancel.prototype.__CANCEL__ = true;

      module.exports = Cancel;

      /***/
    },
    /* 39 */
    /***/ function(module, exports, __webpack_require__) {
      "use strict";
      var Cancel = __webpack_require__(38);

      /**
	 * A `CancelToken` is an object that can be used to request cancellation of an operation.
	 *
	 * @class
	 * @param {Function} executor The executor function.
	 */
      function CancelToken(executor) {
        if (typeof executor !== "function") {
          throw new TypeError("executor must be a function.");
        }

        var resolvePromise;
        this.promise = new Promise(function promiseExecutor(resolve) {
          resolvePromise = resolve;
        });

        var token = this;
        executor(function cancel(message) {
          if (token.reason) {
            // Cancellation has already been requested
            return;
          }

          token.reason = new Cancel(message);
          resolvePromise(token.reason);
        });
      }

      /**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
      CancelToken.prototype.throwIfRequested = function throwIfRequested() {
        if (this.reason) {
          throw this.reason;
        }
      };

      /**
	 * Returns an object that contains a new `CancelToken` and a function that, when called,
	 * cancels the `CancelToken`.
	 */
      CancelToken.source = function source() {
        var cancel;
        var token = new CancelToken(function executor(c) {
          cancel = c;
        });
        return {
          token: token,
          cancel: cancel
        };
      };

      module.exports = CancelToken;

      /***/
    },
    /* 40 */
    /***/ function(module, exports) {
      "use strict";
      /**
	 * Syntactic sugar for invoking a function and expanding an array for arguments.
	 *
	 * Common use case would be to use `Function.prototype.apply`.
	 *
	 *  ```js
	 *  function f(x, y, z) {}
	 *  var args = [1, 2, 3];
	 *  f.apply(null, args);
	 *  ```
	 *
	 * With `spread` this example can be re-written.
	 *
	 *  ```js
	 *  spread(function(x, y, z) {})([1, 2, 3]);
	 *  ```
	 *
	 * @param {Function} callback
	 * @returns {Function}
	 */
      module.exports = function spread(callback) {
        return function wrap(arr) {
          return callback.apply(null, arr);
        };
      };

      /***/
    },
    /* 41 */
    /***/ function(module, exports, __webpack_require__) {
      var _global = (function() {
        return this;
      })();
      var NativeWebSocket = _global.WebSocket || _global.MozWebSocket;
      var websocket_version = __webpack_require__(42);

      /**
	 * Expose a W3C WebSocket class with just one or two arguments.
	 */
      function W3CWebSocket(uri, protocols) {
        var native_instance;

        if (protocols) {
          native_instance = new NativeWebSocket(uri, protocols);
        } else {
          native_instance = new NativeWebSocket(uri);
        }

        /**
		 * 'native_instance' is an instance of nativeWebSocket (the browser's WebSocket
		 * class). Since it is an Object it will be returned as it is when creating an
		 * instance of W3CWebSocket via 'new W3CWebSocket()'.
		 *
		 * ECMAScript 5: http://bclary.com/2004/11/07/#a-13.2.2
		 */
        return native_instance;
      }

      /**
	 * Module exports.
	 */
      module.exports = {
        w3cwebsocket: NativeWebSocket ? W3CWebSocket : null,
        version: websocket_version
      };

      /***/
    },
    /* 42 */
    /***/ function(module, exports, __webpack_require__) {
      var version = __webpack_require__(43);
      module.exports = version.version;

      /***/
    },
    /* 43 */
    /***/ function(module, exports) {
      module.exports = {
        _args: [["websocket", "F:\\wamp\\www\\starcounter\\puppet-node"]],
        _from: "websocket@latest",
        _id: "websocket@1.0.24",
        _inCache: true,
        _installable: true,
        _location: "/websocket",
        _nodeVersion: "7.3.0",
        _npmOperationalInternal: {
          host: "packages-12-west.internal.npmjs.com",
          tmp: "tmp/websocket-1.0.24.tgz_1482977757939_0.1858439394272864"
        },
        _npmUser: {
          email: "brian@worlize.com",
          name: "theturtle32"
        },
        _npmVersion: "3.10.10",
        _phantomChildren: {},
        _requested: {
          name: "websocket",
          raw: "websocket",
          rawSpec: "",
          scope: null,
          spec: "latest",
          type: "tag"
        },
        _requiredBy: ["/"],
        _resolved: "https://registry.npmjs.org/websocket/-/websocket-1.0.24.tgz",
        _shasum: "74903e75f2545b6b2e1de1425bc1c905917a1890",
        _shrinkwrap: null,
        _spec: "websocket",
        _where: "F:\\wamp\\www\\starcounter\\puppet-node",
        author: {
          email: "brian@worlize.com",
          name: "Brian McKelvey",
          url: "https://www.worlize.com/"
        },
        browser: "lib/browser.js",
        bugs: {
          url: "https://github.com/theturtle32/WebSocket-Node/issues"
        },
        config: {
          verbose: false
        },
        contributors: [
          {
            email: "ibc@aliax.net",
            name: "Iñaki Baz Castillo",
            url: "http://dev.sipdoc.net"
          }
        ],
        dependencies: {
          debug: "^2.2.0",
          nan: "^2.3.3",
          "typedarray-to-buffer": "^3.1.2",
          yaeti: "^0.0.6"
        },
        description: "Websocket Client & Server Library implementing the WebSocket protocol as specified in RFC 6455.",
        devDependencies: {
          "buffer-equal": "^1.0.0",
          faucet: "^0.0.1",
          gulp: "git+https://github.com/gulpjs/gulp.git#4.0",
          "gulp-jshint": "^2.0.4",
          jshint: "^2.0.0",
          "jshint-stylish": "^2.2.1",
          tape: "^4.0.1"
        },
        directories: {
          lib: "./lib"
        },
        dist: {
          shasum: "74903e75f2545b6b2e1de1425bc1c905917a1890",
          tarball: "https://registry.npmjs.org/websocket/-/websocket-1.0.24.tgz"
        },
        engines: {
          node: ">=0.8.0"
        },
        gitHead: "0e15f9445953927c39ce84a232cb7dd6e3adf12e",
        homepage: "https://github.com/theturtle32/WebSocket-Node",
        keywords: [
          "websocket",
          "websockets",
          "socket",
          "networking",
          "comet",
          "push",
          "RFC-6455",
          "realtime",
          "server",
          "client"
        ],
        license: "Apache-2.0",
        main: "index",
        maintainers: [
          {
            email: "brian@worlize.com",
            name: "theturtle32"
          }
        ],
        name: "websocket",
        optionalDependencies: {},
        readme: "ERROR: No README data found!",
        repository: {
          type: "git",
          url: "git+https://github.com/theturtle32/WebSocket-Node.git"
        },
        scripts: {
          gulp: "gulp",
          install: "(node-gyp rebuild 2> builderror.log) || (exit 0)",
          test: "faucet test/unit"
        },
        version: "1.0.24"
      };

      /***/
    },
    /* 44 */
    /***/ function(module, exports) {
      var JSONPatchQueueSynchronous = (function() {
        /**
	     * JSON Patch Queue for synchronous operations, and asynchronous networking.
	     * @param {JSON-Pointer} versionPath JSON-Pointers to version numbers
	     * @param {function} apply    apply(JSONobj, JSONPatchSequence) function to apply JSONPatch to object.
	     * @param {Boolean} [purist]       If set to true adds test operation before replace.
	     */
        function JSONPatchQueueSynchronous(versionPath, apply, purist) {
          /** JSON version */
          this.version = 0;
          /**
	         * Queue of consecutive JSON Patch sequences. May contain gaps.
	         * Item with index 0 has 1 sequence version gap to `this.version`.
	         * @type {Array}
	         */
          this.waiting = [];
          /**
	         * JSON-Pointer to local version in shared JSON document
	         * @type {JSONPointer}
	         */
          this.versionPath = versionPath;
          /**
	         * Function to apply JSONPatchSequence to JSON object
	         * @type {Function}
	         */
          this.apply = apply;
          /**
	         * If set to true adds test operation before replace.
	         * @type {Bool}
	         */
          this.purist = purist;
        }
        JSONPatchQueueSynchronous.prototype.receive = function(
          obj,
          versionedJsonPatch
        ) {
          var consecutivePatch = versionedJsonPatch.slice(0);
          // strip Versioned JSON Patch specify operation objects from given sequence
          if (this.purist) {
            var testRemote = consecutivePatch.shift();
          }
          var replaceVersion = consecutivePatch.shift(),
            newVersion = replaceVersion.value;
          // TODO: perform versionedPath validation if needed (tomalec)
          if (newVersion <= this.version) {
            // someone is trying to change something that was already updated
            throw new Error("Given version was already applied.");
          } else if (newVersion == this.version + 1) {
            // consecutive new version
            while (consecutivePatch) {
              this.version++;
              this.apply(obj, consecutivePatch);
              consecutivePatch = this.waiting.shift();
            }
          } else {
            // add sequence to queue in correct position.
            this.waiting[newVersion - this.version - 2] = consecutivePatch;
          }
        };
        /**
	     * Wraps JSON Patch sequence with version related operation objects
	     * @param  {JSONPatch} sequence JSON Patch sequence to wrap
	     * @return {VersionedJSONPatch}
	     */
        JSONPatchQueueSynchronous.prototype.send = function(sequence) {
          this.version++;
          var newSequence = sequence.slice(0);
          newSequence.unshift({
            op: "replace",
            path: this.versionPath,
            value: this.version
          });
          if (this.purist) {
            newSequence.unshift({
              op: "test",
              path: this.versionPath,
              value: this.version - 1
            });
          }
          return newSequence;
        };
        return JSONPatchQueueSynchronous;
      })();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = JSONPatchQueueSynchronous;

      /***/
    },
    /* 45 */
    /***/ function(module, exports, __webpack_require__) {
      var __extends = this && this.__extends ||
        function(d, b) {
          for (var p in b)
            if (b.hasOwnProperty(p)) d[p] = b[p];
          function __() {
            this.constructor = d;
          }
          d.prototype = b === null
            ? Object.create(b)
            : (__.prototype = b.prototype, new __());
        };
      var JSONPatchQueue_1 = __webpack_require__(46);
      var JSONPatchOTAgent = (function(_super) {
        __extends(JSONPatchOTAgent, _super);
        /**
	     * [JSONPatchOTAgent description]
	     * @param {Function} transform function(seqenceA, sequences) that transforms `seqenceA` against `sequences`.
	     * @param {Array<JSON-Pointer>} versionPaths JSON-Pointers to version numbers [local, remote]
	     * @param {function} apply    apply(JSONobj, JSONPatchSequence) function to apply JSONPatch to object.
	     * @param {Boolean} purity       [description]
	     * @constructor
	     * @extends {JSONPatchQueue}
	     * @version: 1.1.0
	     */
        function JSONPatchOTAgent(transform, versionPaths, apply, purity) {
          var _this = _super.call(this, versionPaths, apply, purity) || this;
          _this.transform = transform;
          /**
	         * History of performed JSON Patch sequences that might not yet be acknowledged by Peer
	         * @type {Array<JSONPatch>}
	         */
          _this.pending = [];
          return _this;
        }
        /**
	     * Wraps JSON Patch sequence with version related operation objects
	     * @param  {JSONPatch} sequence JSON Patch sequence to wrap
	     * @return {VersionedJSONPatch}
	     */
        JSONPatchOTAgent.prototype.send = function(sequence) {
          var newSequence = sequence.slice(0);
          newSequence.unshift({
            op: "test",
            path: this.remotePath,
            value: this.remoteVersion
          });
          var versionedJSONPatch = JSONPatchQueue_1.default.prototype.send.call(
            this,
            newSequence
          );
          this.pending.push(versionedJSONPatch);
          return versionedJSONPatch;
        };
        /**
	     * Process received versioned JSON Patch
	     * Adds to queue, transform and apply when applicable.
	     * @param  {Object} obj                   object to apply patches to
	     * @param  {JSONPatch} versionedJsonPatch patch to be applied
	     * @param  {Function} [applyCallback]     optional `function(object, consecutiveTransformedPatch)` to be called when applied, if not given #apply will be called
	     */
        JSONPatchOTAgent.prototype.receive = function(
          obj,
          versionedJsonPatch,
          applyCallback
        ) {
          var apply = applyCallback || this.apply, queue = this;
          return JSONPatchQueue_1.default.prototype.receive.call(
            this,
            obj,
            versionedJsonPatch,
            function applyOT(obj, remoteVersionedJsonPatch) {
              // console.log("applyPatch", queue, arguments);
              // transforming / applying
              var consecutivePatch = remoteVersionedJsonPatch.slice(0);
              // shift first operation object as it should contain test for our local version.
              // ! We assume correct sequence structure, and queuing applied before.
              //
              // Latest local version acknowledged by remote
              // Thanks to the queue version may only be higher or equal to current.
              var localVersionAckByRemote = consecutivePatch.shift().value;
              var ackDistance = localVersionAckByRemote - queue.ackLocalVersion;
              queue.ackLocalVersion = localVersionAckByRemote;
              //clear pending operations
              queue.pending.splice(0, ackDistance);
              if (queue.pending.length) {
                // => Remote sent us something based on outdated versionDistance
                // console.info("Transformation needed", consecutivePatch, 'by', queue.nonAckList);
                consecutivePatch = queue.transform(
                  consecutivePatch,
                  queue.pending
                );
              }
              apply(obj, consecutivePatch);
            }
          );
        };
        /**
	     * Reset queue internals and object to new, given state
	     * @param obj object to apply new state to
	     * @param newState versioned object representing desired state along with versions
	     */
        JSONPatchOTAgent.prototype.reset = function(obj, newState) {
          this.ackLocalVersion = JSONPatchQueue_1.default.prototype.getPropertyByJsonPointer(
            newState,
            this.localPath
          );
          this.pending = [];
          JSONPatchQueue_1.default.prototype.reset.call(this, obj, newState);
        };
        return JSONPatchOTAgent;
      })(JSONPatchQueue_1.default);
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = JSONPatchOTAgent;

      /***/
    },
    /* 46 */
    /***/ function(module, exports) {
      var JSONPatchQueue = (function() {
        /**
	     * JSON Patch Queue for asynchronous operations, and asynchronous networking.
	     * @param {Array<JSON-Pointer>} versionPaths JSON-Pointers to version numbers [local, remote]
	     * @param {function} apply    apply(JSONobj, JSONPatchSequence) function to apply JSONPatch to object.
	     * @param {Boolean} [purist]       If set to true adds test operation before replace.
	     * @version: 1.0.0
	     */
        function JSONPatchQueue(versionPaths, apply, purist) {
          /** local version */
          this.localVersion = 0;
          /** Latest localVersion that we know that was acknowledged by remote */
          // JSONPatchQueue.prototype.ackVersion = 0;
          /** Latest acknowledged remote version */
          this.remoteVersion = 0;
          /**
	         * Queue of consecutive JSON Patch sequences. May contain gaps.
	         * Item with index 0 has 1 version gap to this.remoteVersion.
	         * @type {Array}
	         */
          this.waiting = [];
          /**
	         * JSON-Pointer to local version in shared JSON document
	         * @type {JSONPointer}
	         */
          this.localPath = versionPaths[0];
          /**
	         * JSON-Pointer to remote version in shared JSON document
	         * @type {JSONPointer}
	         */
          this.remotePath = versionPaths[1];
          /**
	         * Function to apply JSONPatchSequence to JSON object
	         * @type {Function}
	         */
          this.apply = apply;
          /**
	         * If set to true adds test operation before replace.
	         * @type {Bool}
	         */
          this.purist = purist;
        }
        // instance property
        //  JSONPatchQueue.prototype.waiting = [];
        /** needed? OT only? */
        // JSONPatchQueue.prototype.pending = [];
        /**
	     * Process received versioned JSON Patch
	     * Applies or adds to queue.
	     * @param  {Object} obj                   object to apply patches to
	     * @param  {JSONPatch} versionedJsonPatch patch to be applied
	     * @param  {Function} [applyCallback]     optional `function(object, consecutivePatch)` to be called when applied, if not given #apply will be called
	     */
        JSONPatchQueue.prototype.receive = function(
          obj,
          versionedJsonPatch,
          applyCallback
        ) {
          var apply = applyCallback || this.apply;
          var consecutivePatch = versionedJsonPatch.slice(0);
          // strip Versioned JSON Patch specifiy operation objects from given sequence
          if (this.purist) {
            var testRemote = consecutivePatch.shift();
          }
          var replaceRemote = consecutivePatch.shift();
          var newRemoteVersion = replaceRemote.value;
          // TODO: perform versionedPath validation if needed (tomalec)
          if (newRemoteVersion <= this.remoteVersion) {
            // someone is trying to change something that was already updated
            throw new Error("Given version was already applied.");
          } else if (newRemoteVersion == this.remoteVersion + 1) {
            // consecutive new version
            while (consecutivePatch) {
              this.remoteVersion++;
              apply(obj, consecutivePatch);
              consecutivePatch = this.waiting.shift();
            }
          } else {
            // add sequence to queue in correct position.
            this.waiting[
              newRemoteVersion - this.remoteVersion - 2
            ] = consecutivePatch;
          }
        };
        /**
	     * Wraps JSON Patch sequence with version related operation objects
	     * @param  {JSONPatch} sequence JSON Patch sequence to wrap
	     * @return {VersionedJSONPatch}
	     */
        JSONPatchQueue.prototype.send = function(sequence) {
          this.localVersion++;
          var newSequence = sequence.slice(0);
          if (this.purist) {
            newSequence.unshift(
              {
                op: "test",
                path: this.localPath,
                value: this.localVersion - 1
              },
              {
                op: "replace",
                path: this.localPath,
                value: this.localVersion
              }
            );
          } else {
            newSequence.unshift({
              op: "replace",
              path: this.localPath,
              value: this.localVersion
            });
          }
          return newSequence;
        };
        JSONPatchQueue.prototype.getPropertyByJsonPointer = function(
          obj,
          pointer
        ) {
          var parts = pointer.split("/");
          if (parts[0] === "") {
            parts.shift();
          }
          var target = obj;
          while (parts.length) {
            var path = parts.shift().replace("~1", "/").replace("~0", "~");
            if (parts.length) {
              target = target[path];
            }
          }
          return target[path];
        };
        /**
	     * Reset queue internals and object to new, given state
	     * @param obj object to apply new state to
	     * @param newState versioned object representing desired state along with versions
	     */
        JSONPatchQueue.prototype.reset = function(obj, newState) {
          this.remoteVersion = this.getPropertyByJsonPointer(
            newState,
            this.remotePath
          );
          this.waiting = [];
          var patch = [{ op: "replace", path: "", value: newState }];
          this.apply(obj, patch);
        };
        return JSONPatchQueue;
      })();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = JSONPatchQueue;

      /***/
    },
    /* 47 */
    /***/ function(module, exports) {
      var JSONPatchOT = (function() {
        function JSONPatchOT() {}
        JSONPatchOT.transform = function(sequenceA, sequences) {
          var concatAllSequences = [];
          concatAllSequences = concatAllSequences.concat.apply(
            concatAllSequences,
            sequences
          );
          // var clonedPatch = JSON.parse(JSON.stringify(this.patch)); // clone needed for debugging and visualization
          var clonedPatch = JSON.parse(JSON.stringify(sequenceA)); // clone needed for debugging and visualization
          var result = concatAllSequences.reduce(
            JSONPatchOT.composeJSONPatches,
            clonedPatch
          ); // <=> composeJSONPatches(this, operations.concat() )
          return result;
          // return new JSONPatchOperation(result, this.localRevision, operations[operations.length-1].localRevision, this.localRevPropName, this.remoteRevPropName);
        };
        JSONPatchOT.transformAgainstSingleOp = function(
          sequenceA,
          operationObj
        ) {};
        JSONPatchOT.composeJSONPatches = function(original, operationObj) {
          // basic validation (as in fast-json-patch)
          if (
            operationObj.value === undefined &&
            (operationObj.op === "add" ||
              operationObj.op === "replace" ||
              operationObj.op === "test")
          ) {
            throw new Error("'value' MUST be defined");
          }
          if (
            operationObj.from === undefined &&
            (operationObj.op === "copy" || operationObj.op === "move")
          ) {
            throw new Error("'from' MUST be defined");
          }
          // apply patch operation to all original ops
          if (JSONPatchOT.transformAgainst[operationObj.op]) {
            if (
              typeof JSONPatchOT.transformAgainst[operationObj.op] == "function"
            ) {
              JSONPatchOT.transformAgainst[operationObj.op](
                operationObj,
                original
              );
            } else {
              var orgOpsLen = original.length, currentOp = 0;
              while (currentOp < orgOpsLen) {
                var originalOp = original[currentOp];
                currentOp++;
                if (
                  JSONPatchOT.transformAgainst[operationObj.op][originalOp.op]
                ) {
                  JSONPatchOT.transformAgainst[operationObj.op][originalOp.op](
                    operationObj,
                    originalOp
                  );
                } else {
                  this.debug &&
                    console.log(
                      "No function to transform " +
                        originalOp.op +
                        "against" +
                        operationObj.op
                    );
                }
              }
            }
          } else {
            this.debug &&
              console.log(
                "No function to transform against " + operationObj.op
              );
          }
          return original;
        };
        return JSONPatchOT;
      })();
      JSONPatchOT.debug = false;
      JSONPatchOT.transformAgainst = {
        remove: function(patchOp, original) {
          this.debug &&
            console.log(
              "Transforming ",
              JSON.stringify(original),
              " against `remove` ",
              patchOp
            );
          var orgOpsLen = original.length, currentOp = 0, originalOp;
          // remove operation objects
          while (originalOp = original[currentOp]) {
            // TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)
            this.debug &&
              console.log(
                "TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)"
              );
            if (
              (originalOp.op === "add" || originalOp.op === "test") &&
              patchOp.path === originalOp.path
            ) {
            } else if (
              originalOp.from &&
                (originalOp.from === patchOp.path ||
                  originalOp.from.indexOf(patchOp.path + "/") === 0) ||
              (patchOp.path === originalOp.path ||
                originalOp.path.indexOf(patchOp.path + "/") === 0)
            ) {
              // node in question was removed
              this.debug && console.log("Removing ", originalOp);
              original.splice(currentOp, 1);
              orgOpsLen--;
              currentOp--;
            }
            currentOp++;
          }
          // shift indexes
          // var match = patchOp.path.match(/(.*\/)(\d+)$/); // last element is a number
          var lastSlash = patchOp.path.lastIndexOf("/");
          if (lastSlash > -1) {
            var index = patchOp.path.substr(lastSlash + 1);
            var arrayPath = patchOp.path.substr(0, lastSlash + 1);
            if (this.isValidIndex(index)) {
              this.debug &&
                console.warn(
                  "Bug prone guessing that, as number given in path, this is an array!"
                );
              this.debug && console.log("Shifting array indexes");
              orgOpsLen = original.length;
              currentOp = 0;
              while (currentOp < orgOpsLen) {
                originalOp = original[currentOp];
                currentOp++;
                if (originalOp.path.indexOf(arrayPath) === 0) {
                  originalOp.path = this.replacePathIfHigher(
                    originalOp.path,
                    arrayPath,
                    index
                  );
                }
                if (
                  originalOp.from && originalOp.from.indexOf(arrayPath) === 0
                ) {
                  originalOp.from = this.replacePathIfHigher(
                    originalOp.from,
                    arrayPath,
                    index
                  );
                }
              }
            }
          }
        },
        replace: function(patchOp, original) {
          this.debug &&
            console.log(
              "Transforming ",
              JSON.stringify(original),
              " against `replace` ",
              patchOp
            );
          var currentOp = 0, originalOp;
          // remove operation objects withing replaced JSON node
          while (originalOp = original[currentOp]) {
            // TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)
            this.debug &&
              console.log(
                "TODO: `move`, and `copy` (`from`) may not be covered well (tomalec)"
              );
            // node in question was removed
            // IT:
            // if( patchOp.path === originalOp.path || originalOp.path.indexOf(patchOp.path + "/") === 0 ){
            if (
              originalOp.from &&
                (originalOp.from === patchOp.path ||
                  originalOp.from.indexOf(patchOp.path + "/") === 0) ||
              originalOp.path.indexOf(patchOp.path + "/") === 0
            ) {
              this.debug && console.log("Removing ", originalOp);
              original.splice(currentOp, 1);
              currentOp--;
            }
            currentOp++;
          }
        },
        replacePathIfHigher: function(path, repl, index) {
          var result = path.substr(repl.length);
          // var match = result.match(/^(\d+)(.*)/);
          // if(match && match[1] > index){
          var eoindex = result.indexOf("/");
          eoindex > -1 || (eoindex = result.length);
          var oldIndex = result.substr(0, eoindex);
          var rest = result.substr(eoindex);
          if (this.isValidIndex(oldIndex) && oldIndex > index) {
            return repl + (oldIndex - 1) + rest;
          } else {
            return path;
          }
        },
        isValidIndex: function(str) {
          var n = ~~Number(str);
          return String(n) === str && n >= 0;
        }
      };
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = JSONPatchOT;

      /***/
    },
    /* 48 */
    /***/ function(module, exports) {
      var NoQueue = (function() {
        /**
	     * Non-queuing object that conforms JSON-Patch-Queue API
	     * @param {Function} apply function to apply received patch
	     */
        function NoQueue(apply) {
          this.apply = apply;
        }
        /** just forward message */
        NoQueue.prototype.send = function(msg) {
          return msg;
        };
        /** Apply given JSON Patch sequence immediately */
        NoQueue.prototype.receive = function(obj, sequence) {
          this.apply(obj, sequence);
        };
        NoQueue.prototype.reset = function(obj, newState) {
          var patch = [{ op: "replace", path: "", value: newState }];
          this.apply(obj, patch);
        };
        return NoQueue;
      })();
      Object.defineProperty(exports, "__esModule", { value: true });
      exports.default = NoQueue;

      /***/
    }
    /******/
  ]
);
