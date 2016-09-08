import graphLib from 'graphlib';

class StateMachine {

    monitor = false;

    constructor(config) {
        this.graph = new graphLib.Graph();

        this._setConfig(config);
    }

    _setConfig(config) {
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

    *_lifeCycle(currentNode) {

        let promiseStub = (data) => new Promise((r) => r(data));

        yield currentNode.onEnter || promiseStub;
        yield currentNode.trigger;
        yield currentNode.onLeave || promiseStub;
        yield (nodeName) => {
            return this.getTransition(
                this.currentNodeName,
                nodeName
            ) || promiseStub;
        }
    }

    setState(nodeName, data) {

        return new Promise((resolve, reject) => {

            if (this.monitor) {
                reject('Monitor is reserved');
                return;
            }

            this.monitor = true;

            this.currentNodeName = nodeName;

            let currentNode = this.getCurrentState();

            let stepsIterator = this._lifeCycle(currentNode);

            //onEnter
            stepsIterator.next().value(data).then((data) => {
                //trigger
                stepsIterator.next().value(data).then((data) => {
                    console.log('in trigger');
                    // console.log(stepsIterator.next().value());
                    //onLeave
                    stepsIterator.next().value(data).then((data) => {

                        console.log('in onleave');

                        //transition
                        let transitionFunc = stepsIterator.next().value(data.next);


                        transitionFunc(data).then((data) => {
                            this.monitor = false;

                            console.log(data);

                            if (data.next) {
                                if (this.checkTransition(data.next)) {
                                    resolve(this.setState(data.next, data));
                                } else {
                                    reject('Transition not found');
                                }
                            } else {
                                resolve(data);
                            }
                        });

                    })
                })
            });
        });
    }

    getCurrentPotentialTransitions() {
        let edges = this.graph.outEdges(this.currentNodeName);
        return edges.map((edge) => {
            return {
                source: edge.v,
                target: edge.w
            };
        });
    }

    getTransition(source, target) {
        return this.graph.edge(source, target);
    }

    getCurrentState() {
        return this.graph.node(this.currentNodeName);
    }

    checkTransition(target) {
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