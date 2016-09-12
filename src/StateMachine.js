import graphLib from 'graphlib';
import defer from 'promise-defer';

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
class StateMachine {

  /**
   * Отслеживает жихненный цикл Ноды.
   * true - нода в активной фазе
   * false - нет активных нод (состояние сразу после транзиции)
   *
   * @type {boolean}
   */
  monitor = false;

  /**
   * Имя текущей Ноды
   *
   * @type {string}
   */
  currentNodeName = '';

  /**
   * Имя следующей Ноды
   * @type {string}
   * @private
   */
  _nextState = '';

  /**
   * Объект прерывания текущего этапа выполнения ноды (Deferred)
   * @private
     */
  _interruptStage = null;

  /**
   * Принимает конфиг всех Нод
   * Создает пустой граф.
   *
   * @param {Object[]} config
   */
  constructor (config) {
    this.graph = new graphLib.Graph();
    
    if (!Array.isArray(config)) {
      throw new Error('Config is not given');
    }

    this._setConfig(config);
  }

  /**
   * Строит из конфигов граф с нодами и переходами между ними
   *
   * @param {Object[]} config
   */
  _setConfig (config) {

    config.forEach((node) => {
      this.graph.setNode(node.name, {
        onEnter: node.onEnter,
        trigger: node.trigger,
        onLeave: node.onLeave
      });

      if (node.transitions) {
        let targets = Object.keys(node.transitions);
        targets.forEach((target) => {
          this.graph.setEdge(
            node.name,
            target,
            node.transitions[target]
          );
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
  *_lifeCycle (currentNode) {
    let promiseStub = (data) => new Promise((r) => r(data));

    yield currentNode.onEnter || promiseStub;
    yield currentNode.trigger || promiseStub;
    yield currentNode.onLeave || promiseStub;
    return currentNode.onTransition = (
      this.getTransition(
        this.currentNodeName,
        this._nextState
      ) || promiseStub
    );
  }

  /**
   * Выполнение жизненного цикла ноды. В качестве завершения вызывает callback, куда передаются
   * данные отработанные после transition. Также при выполнении цикла проверяется передавался ли
   * в объекте параметр next, что является командой для записи имени следующего этапа, куда
   * необходимо будет перейти в конце жизненного цикла.
   *
   * @callback _runTransition
   * @param generator - генератор для получения следующего жизненого цикла
   * @param entryParams - входные параметры доставшиеся из предыдущего цикла
   * @param {_runTransition} cb - вызывается после завершения жизненного цикла ноды (после
   *     transition)
   * @private
   */
  _executeLifeCycle (generator, entryParams, cb) {
    let nextStep = generator.next();

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
     * - если не последний, то мержим входные параметры полученные из предыдущего жизненного цикла
     * с данными, которые были переданы в начальный Этап.
     * - если последний, то мержим только те параметры, которые передал предыдущий жизненный цикл и
     * отдаем их в колбэке
     */

    let onNextStage = (stepParams) => {
      if (!nextStep.done) {
        this._executeLifeCycle(
            generator,
            { ...stepParams, ...entryParams },
            cb
        );
      } else {
        cb(null, { ...stepParams });
      }
    };

    this._interruptStage = defer();

    nextStep.value(this._interruptStage, entryParams);

    this._interruptStage.promise
        .then(onNextStage)
        .catch(err => cb(err));
  }

  /**
   * Устанавливает statemachine в текущее состояние.
   *
   * @param nodeName
   * @param entryParams
   * @returns {Promise}
   */
  setState (nodeName, entryParams = {}) {

    return new Promise((resolve, reject) => {

      if (this.monitor) {
        return reject('Monitor is reserved');
      }

      this.monitor = true;
      this._nextState = '';
      this.currentNodeName = nodeName;

      let currentNode = this.getCurrentState();

      this._executeLifeCycle(
        this._lifeCycle(currentNode),
        entryParams,
        this._runTransition.bind(this, resolve, reject)
      );
    });
  }

  setDesireState(nodeName, entryParams = {}) {
    this._interruptStage.resolve();
  }

  /**
   * Запускает переход между текущим состоянием и следующим.
   *
   * @param resolve - успешное выполнение состояния
   * @param reject - проброс ошибки
   * @param err - ошибка, по умолчанию должна быть null
   * @param params - параметры переданные для следующего состояния
   */
  _runTransition (resolve, reject, err, params) {
    if (err) {
      return reject(err);
    }

    this.monitor = false;

    if (this._nextState) {
      if (this.checkTransition(this._nextState)) {
        resolve(this.setState(this._nextState, params));
      } else {
        reject('Transition not found');
      }
    } else {
      resolve(params);
    }
  }

  /**
   * Возвращает потенциальные переходы из текущей ноды.
   *
   * @returns {Array}
   */
  getCurrentPotentialTransitions () {
    let edges = this.graph.outEdges(this.currentNodeName);
    return edges.map((edge) => {
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
  getTransition (source, target) {
    return this.graph.edge(source, target);
  }

  /**
   * Возвращает текущюю ноду.
   *
   * @returns {*}
   */
  getCurrentState () {
    return this.graph.node(this.currentNodeName);
  }

  /**
   * Проверяет возможность перехода к указанной ноде.
   *
   * @param target
   * @returns {boolean}
   */
  checkTransition (target) {
    let potentialTransitions = this.getCurrentPotentialTransitions();

    for (let i = 0; i < potentialTransitions.length; i++) {
      if (potentialTransitions[i].target === target) {
        return true;
      }
    }

    return false;
  }
}

export default StateMachine;
