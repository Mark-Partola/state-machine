import defer from 'promise-defer';
import TransitionStrategy from './TransitionStrategy';

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
export default class StateMachine {

  /**
   * Отслеживает жихненный цикл Ноды.
   * true - нода в активной фазе
   * false - нет активных нод (состояние сразу после транзиции)
   *
   * @type {boolean}
   */
  monitor = false;

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
   *
   * @param {Object[]} config
   * @param transitionStrategy
   */
  constructor (config, transitionStrategy = new TransitionStrategy()) {
    this.transitionStrategy = transitionStrategy;

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
      this.transitionStrategy.setNode(node.name, {
        onEnter: node.onEnter,
        trigger: node.trigger,
        onLeave: node.onLeave
      });

      if (node.transitions) {
        let targets = Object.keys(node.transitions);
        targets.forEach((target) => {
          this.transitionStrategy.setEdge(
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
   * - вход -> работа -> выход -> переход
   *
   * @param currentState
   * @returns
   * @private
   */
  *_lifeCycle (currentState) {
    let promiseStub = (deferred, data) => deferred.resolve(data);

    yield currentState.onEnter || promiseStub;
    yield currentState.trigger || promiseStub;
    yield currentState.onLeave || promiseStub;

    return currentState.onTransition = (
      this.transitionStrategy.getTransition(
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
   * @param {_runTransition} cb - вызывается после завершения жизненного цикла ноды
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
      this.transitionStrategy.setCurrentNodeName(nodeName);

      let currentState = this.transitionStrategy.getCurrentState();

      this._executeLifeCycle(
        this._lifeCycle(currentState),
        entryParams,
        this._runTransition.bind(this, resolve, reject)
      );
    });
  }

  /**
   * Резолвит отложенный объект,
   * который ожидает резолва внутри этапа ноды.
   * Передавая в next новое имя желаемой ноды
   * @param nodeName
   * @param entryParams
     */
  setDesireState(nodeName, entryParams = {}) {
    entryParams.next = nodeName;
    this._interruptStage.resolve(entryParams);
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
      if (this.transitionStrategy.checkTransition(this._nextState)) {
        return resolve(this.setState(this._nextState, params));
      } else {
        return reject('Transition not found');
      }
    } else {
      return resolve(params);
    }
  }
}
