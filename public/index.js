(function webpackUniversalModuleDefinition (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory (require ("graphlib"), require ("promise-defer"));
  else if (typeof define === 'function' && define.amd)
    define (["graphlib", "promise-defer"], factory);
  else if (typeof exports === 'object')
    exports["StateMachine"] = factory (require ("graphlib"), require ("promise-defer"));
  else
    root["StateMachine"] = factory (root["graphlib"], root["promise-defer"]);
}) (this, function (__WEBPACK_EXTERNAL_MODULE_2__, __WEBPACK_EXTERNAL_MODULE_3__) {
  return /******/ (function (modules) { // webpackBootstrap
    /******/ 	// The module cache
    /******/
    var installedModules = {};

    /******/ 	// The require function
    /******/
    function __webpack_require__ (moduleId) {

      /******/ 		// Check if module is in cache
      /******/
      if (installedModules[moduleId])
      /******/      return installedModules[moduleId].exports;

      /******/ 		// Create a new module (and put it into the cache)
      /******/
      var module = installedModules[moduleId] = {
        /******/      exports: {},
        /******/      id     : moduleId,
        /******/      loaded : false
        /******/
      };

      /******/ 		// Execute the module function
      /******/
      modules[moduleId].call (module.exports, module, module.exports, __webpack_require__);

      /******/ 		// Flag the module as loaded
      /******/
      module.loaded = true;

      /******/ 		// Return the exports of the module
      /******/
      return module.exports;
      /******/
    }

    /******/ 	// expose the modules object (__webpack_modules__)
    /******/
    __webpack_require__.m = modules;

    /******/ 	// expose the module cache
    /******/
    __webpack_require__.c = installedModules;

    /******/ 	// __webpack_public_path__
    /******/
    __webpack_require__.p = "/public/";

    /******/ 	// Load entry module and return exports
    /******/
    return __webpack_require__ (0);
    /******/
  })
  /************************************************************************/
  /******/ ([
    /* 0 */
    /***/ function (module, exports, __webpack_require__) {

      module.exports = __webpack_require__ (1);

      /***/
    },
    /* 1 */
    /***/ function (module, exports, __webpack_require__) {

      'use strict';

      Object.defineProperty (exports, "__esModule", {
        value: true
      });

      var _extends = Object.assign || function (target) {
          for (var i = 1; i < arguments.length; i++) {
            var source = arguments[i];
            for (var key in source) {
              if (Object.prototype.hasOwnProperty.call (source, key)) {
                target[key] = source[key];
              }
            }
          }
          return target;
        };

      var _createClass = function () {
        function defineProperties (target, props) {
          for (var i = 0; i < props.length; i++) {
            var descriptor = props[i];
            descriptor.enumerable = descriptor.enumerable || false;
            descriptor.configurable = true;
            if ("value" in descriptor) descriptor.writable = true;
            Object.defineProperty (target, descriptor.key, descriptor);
          }
        }

        return function (Constructor, protoProps, staticProps) {
          if (protoProps) defineProperties (Constructor.prototype, protoProps);
          if (staticProps) defineProperties (Constructor, staticProps);
          return Constructor;
        };
      } ();

      var _graphlib = __webpack_require__ (2);

      var _graphlib2 = _interopRequireDefault (_graphlib);

      var _promiseDefer = __webpack_require__ (3);

      var _promiseDefer2 = _interopRequireDefault (_promiseDefer);

      function _interopRequireDefault (obj) { return obj && obj.__esModule ? obj : {default: obj}; }

      function _classCallCheck (instance, Constructor) {
        if (!(instance instanceof Constructor)) {
          throw new TypeError ("Cannot call a class as a function");
        }
      }

      /**
       * Класс позволяет создавать конечный автомат используя графы. Главная идея:
       * У этапа есть жизненный цикл и есть возможность переходить от одного этапа к другому.
       * У этапа 4 жизненных цикла:
       * - Вход в этап onEnter
       * - Работа этапа trigger
       * - Выход из этапа onLeave
       * - Переход к другому этапу onTransition
       *
       *
       * Нода - это описание Этапа, в рамках которого реализуется некая логика:
       * - во время входа в Этап (onEnter)
       * - во время жизни Этапа (trigger)
       * - во время  выхода из Этапа (onLeave)
       * - переход между этапами (transition)
       */
      var StateMachine = function () {

        /**
         * Принимает конфиг всех Нод
         * Создает пустой граф.
         *
         * @param {Object[]} config
         */

        /**
         * Имя следующей Ноды
         * @type {string}
         * @private
         */

        /**
         * Отслеживает жихненный цикл Ноды.
         * true - нода в активной фазе
         * false - нет активных нод (состояние сразу после транзиции)
         *
         * @type {boolean}
         */
        function StateMachine (config) {
          _classCallCheck (this, StateMachine);

          this.monitor = false;
          this.currentNodeName = '';
          this._nextState = '';
          this._interruptStage = null;

          this.graph = new _graphlib2.default.Graph ();

          if (!Array.isArray (config)) {
            throw new Error ('Config is not given');
          }

          this._setConfig (config);
        }

        /**
         * Строит из конфигов граф с нодами и переходами между ними
         *
         * @param {Object[]} config
         */

        /**
         * Объект прерывания текущего этапа выполнения ноды (Deferred)
         * @private
         */

        /**
         * Имя текущей Ноды
         *
         * @type {string}
         */


        _createClass (StateMachine, [{
          key  : '_setConfig',
          value: function _setConfig (config) {
            var _this = this;

            config.forEach (function (node) {
              _this.graph.setNode (node.name, {
                onEnter: node.onEnter,
                trigger: node.trigger,
                onLeave: node.onLeave
              });

              if (node.transitions) {
                var targets = Object.keys (node.transitions);
                targets.forEach (function (target) {
                  _this.graph.setEdge (node.name, target, node.transitions[target]);
                });
              }
            });
          }

          /**
           * Генератор жизненного цикла для ноды. Итератор проходит по каждому этапу жизни ноды:
           * - вход
           * - работа
           * - выход
           * - переход
           *
           * @param currentNode
           * @returns {*|(function(*=): Promise)}
           * @private
           */

        }, {
          key  : '_lifeCycle',
          value: regeneratorRuntime.mark (function _lifeCycle (currentNode) {
            var promiseStub;
            return regeneratorRuntime.wrap (function _lifeCycle$ (_context) {
              while (1) {
                switch (_context.prev = _context.next) {
                  case 0:
                    promiseStub = function promiseStub (deferred, data) {
                      return deferred.resolve (data);
                    };

                    _context.next = 3;
                    return currentNode.onEnter || promiseStub;

                  case 3:
                    _context.next = 5;
                    return currentNode.trigger || promiseStub;

                  case 5:
                    _context.next = 7;
                    return currentNode.onLeave || promiseStub;

                  case 7:
                    return _context.abrupt ('return', currentNode.onTransition = this.getTransition (this.currentNodeName, this._nextState) || promiseStub);

                  case 8:
                  case 'end':
                    return _context.stop ();
                }
              }
            }, _lifeCycle, this);
          })

          /**
           * Выполнение жизненного цикла ноды. В качестве завершения вызывает callback, куда
           * передаются данные отработанные после transition. Также при выполнении цикла
           * проверяется передавался ли в объекте параметр next, что является командой для записи
           * имени следующего этапа, куда необходимо будет перейти в конце жизненного цикла.
           *
           * @callback _runTransition
           * @param generator - генератор для получения следующего жизненого цикла
           * @param entryParams - входные параметры доставшиеся из предыдущего цикла
           * @param {_runTransition} cb - вызывается после завершения жизненного цикла ноды (после
           *     transition)
           * @private
           */

        }, {
          key  : '_executeLifeCycle',
          value: function _executeLifeCycle (generator, entryParams, cb) {
            var _this2 = this;

            var nextStep = generator.next ();

            /**
             * Проверяем ключевое слово next, чтобы установить следующий этап.
             * Ключевое слово удаляется из параметров, чтобы не передавалось дальше.
             */
            if (entryParams.next) {
              this._nextState = entryParams.next;
              delete entryParams.next;
            }

            /**
             * Вызываем промис жизненного цикла (onEnter, trigger, onLeave или transition).
             * После завершения промиса проверяем, что это был не последний жизненый цикл:
             * - если не последний, то мержим входные параметры полученные из предыдущего
             * жизненного цикла с данными, которые были переданы в начальный Этап.
             * - если последний, то мержим только те параметры, которые передал предыдущий
             * жизненный цикл и отдаем их в колбэке
             */

            var onNextStage = function onNextStage (stepParams) {
              if (!nextStep.done) {
                _this2._executeLifeCycle (generator, _extends ({}, stepParams, entryParams), cb);
              } else {
                cb (null, _extends ({}, stepParams));
              }
            };

            this._interruptStage = (0, _promiseDefer2.default) ();

            nextStep.value (this._interruptStage, entryParams);

            this._interruptStage.promise.then (onNextStage).catch (function (err) {
              return cb (err);
            });
          }

          /**
           * Устанавливает statemachine в текущее состояние.
           *
           * @param nodeName
           * @param entryParams
           * @returns {Promise}
           */

        }, {
          key  : 'setState',
          value: function setState (nodeName) {
            var _this3 = this;

            var entryParams = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            return new Promise (function (resolve, reject) {

              if (_this3.monitor) {
                return reject ('Monitor is reserved');
              }

              _this3.monitor = true;
              _this3._nextState = '';
              _this3.currentNodeName = nodeName;

              var currentNode = _this3.getCurrentState ();

              _this3._executeLifeCycle (_this3._lifeCycle (currentNode), entryParams, _this3._runTransition.bind (_this3, resolve, reject));
            });
          }

          /**
           * Резолвит отложенный объект,
           * который ожидает резолва внутри этапа ноды.
           * Передавая в next новое имя желаемой ноды
           * @param nodeName
           * @param entryParams
           */

        }, {
          key  : 'setDesireState',
          value: function setDesireState (nodeName) {
            var entryParams = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

            entryParams.next = nodeName;
            this._interruptStage.resolve (entryParams);
          }

          /**
           * Запускает переход между текущим состоянием и следующим.
           *
           * @param resolve - успешное выполнение состояния
           * @param reject - проброс ошибки
           * @param err - ошибка, по умолчанию должна быть null
           * @param params - параметры переданные для следующего состояния
           */

        }, {
          key  : '_runTransition',
          value: function _runTransition (resolve, reject, err, params) {
            if (err) {
              return reject (err);
            }

            this.monitor = false;

            if (this._nextState) {
              if (this.checkTransition (this._nextState)) {
                resolve (this.setState (this._nextState, params));
              } else {
                reject ('Transition not found');
              }
            } else {
              resolve (params);
            }
          }

          /**
           * Возвращает потенциальные переходы из текущей ноды.
           *
           * @returns {Array}
           */

        }, {
          key  : 'getCurrentPotentialTransitions',
          value: function getCurrentPotentialTransitions () {
            var edges = this.graph.outEdges (this.currentNodeName);
            return edges.map (function (edge) {
              return {
                source: edge.v,
                target: edge.w
              };
            });
          }

          /**
           * Возвращает транзицию между указанными нодами
           *
           * @param source
           * @param target
           * @returns {*}
           */

        }, {
          key  : 'getTransition',
          value: function getTransition (source, target) {
            return this.graph.edge (source, target);
          }

          /**
           * Возвращает текущюю ноду.
           *
           * @returns {*}
           */

        }, {
          key  : 'getCurrentState',
          value: function getCurrentState () {
            return this.graph.node (this.currentNodeName);
          }

          /**
           * Проверяет возможность перехода к указанной ноде.
           *
           * @param target
           * @returns {boolean}
           */

        }, {
          key  : 'checkTransition',
          value: function checkTransition (target) {
            var potentialTransitions = this.getCurrentPotentialTransitions ();

            for (var i = 0; i < potentialTransitions.length; i++) {
              if (potentialTransitions[i].target === target) {
                return true;
              }
            }

            return false;
          }
        }]);

        return StateMachine;
      } ();

      exports.default = StateMachine;

      /***/
    },
    /* 2 */
    /***/ function (module, exports) {

      module.exports = __WEBPACK_EXTERNAL_MODULE_2__;

      /***/
    },
    /* 3 */
    /***/ function (module, exports) {

      module.exports = __WEBPACK_EXTERNAL_MODULE_3__;

      /***/
    }
    /******/])
});
;
