import StateMachine from './../src/StateMachine'

describe('Тестирование машины состояний', () => {

    it('Должен создаваться экземпляр класса', () => {
        assert(new StateMachine() instanceof StateMachine);
    });
});