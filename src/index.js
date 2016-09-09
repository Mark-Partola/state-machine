import StateMachine from './StateMachine';
import statesConfig from './statesConfig';

let stateMachine = new StateMachine(statesConfig);

stateMachine.setState("A", {myArray: ['1','1','2']})
    .then((result) => {
      console.log('КОНЕЦ!', result);
    })
    .catch((err) => {
      console.error(err);
    });

/*setTimeout(() => {
    stateMachine.setState("C", { name: 'value' })
        .then((result) => {
            console.log(result);
        })
        .catch((err) => {
            console.log(err);
        });
}, 1000);*/
