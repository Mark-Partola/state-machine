import StateMachine from './../src/StateMachine';
import statesConfig from './statesConfig';

let stateMachine = new StateMachine(statesConfig);

stateMachine.setState("A", {myArray: ['1','1','2']})
    .then((result) => {
      console.log('КОНЕЦ!', result);
    })
    .catch((err) => {
      console.error(err);
    });

setTimeout(() => {
    stateMachine.setDesireState('C', { hello: 'world' });
}, 3000);


/*setTimeout(() => {
    stateMachine.setState("C", { name: 'value' })
        .then((result) => {
            console.log(result);
        })
        .catch((err) => {
            console.log(err);
        });
}, 1000);*/
