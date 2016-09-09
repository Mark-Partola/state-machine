import graphLib from 'graphlib';

/**
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
     * Принимает конфиг всех Нод
     * Создает пустой граф.
     *
     * @param {Object[]} config
     */
    constructor (config) {
        this.graph = new graphLib.Graph();

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
     * @param generator
     * @param yieldValue
     * @callback cb
     * @private
     */
    _executeLifeCycle (generator, yieldValue, cb) {
        let next = generator.next(yieldValue);

        if (yieldValue.next) {
            this._nextState = yieldValue.next;
            delete yieldValue.next;
        }

        next.value(yieldValue).then(
            result => {
                if (!next.done) {
                    this._executeLifeCycle(generator, Object.assign({}, result, yieldValue), cb);
                } else {
                    cb(Object.assign({}, result));
                }
            },
            err => generator.throw(err)
        );
    }

    /**
     * Устанавливает statemachine в текущее состояние.
     *
     * @param nodeName
     * @param data
     * @returns {Promise}
     */
    setState (nodeName, data) {

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
                data,
                this.runTransition.bind(this, resolve, reject)
            );
        });
    }

    /**
     * Запускает переход между текущим состоянием и следующим.
     *
     * @param resolve
     * @param reject
     * @param data
     */
    runTransition (resolve, reject, data) {
        this.monitor = false;

        if (this._nextState) {
            if (this.checkTransition(this._nextState)) {
                resolve(this.setState(this._nextState, data));
            } else {
                reject('Transition not found');
            }
        } else {
            resolve(data);
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