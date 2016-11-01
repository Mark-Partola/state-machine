import graphLib from 'graphlib';

export default class TransitionStrategy {

    /**
     * Имя текущей Ноды
     *
     * @type {string}
     */
    currentNodeName = '';
    
    constructor () {
        this.graph = new graphLib.Graph();
    }

    setCurrentNodeName (nodeName) {
        this.currentNodeName = nodeName;
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

    /**
     * Возвращает транзицию к указанной ноде
     *
     * @param target
     * @returns {*}
     */
    getTransition (target) {
        return this.graph.edge(this.currentNodeName, target);
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

    setNode (name, actions) {
        this.graph.setNode(name, actions);
    }

    setEdge (src, target, actions) {
        this.graph.setEdge(src, target, actions);
    }
}
