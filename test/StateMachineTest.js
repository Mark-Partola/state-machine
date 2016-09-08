import StateMachine from 'C:/Users/m.partola/projects/statemachine/src/StateMachine';

describe('Тестирование машины состояний', () => {

    it('Должен создаваться экземпляр класса', () => {
        console.log(typeof StateMachine);

        assert(new StateMachine() instanceof StateMachine);
    });
});