import graphLib from 'graphlib';

class StateMachine {

    monitor = false;

    constructor (config) {
        this.graph = new graphLib.Graph();

        this._setConfig(config);
    }

    _setConfig (config) {
        config.forEach((node) => {
            this.graph.setNode(node.name, {
                onEnter: node.onEnter,
                onLeave: node.onLeave,
                trigger: node.trigger
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

    *_lifeCycle (currentNode) {

        let promiseStub = (data) => new Promise((r) => r(data));

        yield currentNode.onEnter || promiseStub;
        yield currentNode.trigger;
        yield currentNode.onLeave || promiseStub;
        return (nodeName) => {
            return this.getTransition(
                    this.currentNodeName,
                    nodeName
                ) || promiseStub;
        }
    }

    _executeLifeCycle (generator, yieldValue, cb) {
        let next = generator.next(yieldValue);

        if (!next.done) {
            next.value(yieldValue).then(
                result => this._executeLifeCycle(generator, Object.assign({}, result, yieldValue), cb),
                err => generator.throw(err)
            );
        } else {
            cb({
                f   : next.value(yieldValue.next),
                data: yieldValue
            });
        }
    }

    setState (nodeName, data) {

        return new Promise((resolve, reject) => {

            if (this.monitor) {
                reject('Monitor is reserved');
                return;
            }

            this.monitor = true;

            this.currentNodeName = nodeName;

            let currentNode = this.getCurrentState();

            this._executeLifeCycle(this._lifeCycle(currentNode), data, (trans) => {
                trans.f(trans.data).then((data)=> {
                    this.monitor = false;

                    if (data.next) {
                        if (this.checkTransition(data.next)) {
                            let next = data.next;
                            delete data.next;

                            resolve(this.setState(next, data));
                        } else {
                            reject('Transition not found');
                        }
                    } else {
                        resolve(data);
                    }
                });
            });
        });
    }

    getCurrentPotentialTransitions () {
        let edges = this.graph.outEdges(this.currentNodeName);
        return edges.map((edge) => {
            return {
                source: edge.v,
                target: edge.w
            };
        });
    }

    getTransition (source, target) {
        return this.graph.edge(source, target);
    }

    getCurrentState () {
        return this.graph.node(this.currentNodeName);
    }

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