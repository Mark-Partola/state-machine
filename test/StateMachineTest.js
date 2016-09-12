import StateMachine from './../src/StateMachine';

describe('Тестирование машины состояний', () => {

  it('Должен создаваться экземпляр класса', () => {
    assert(new StateMachine([]) instanceof StateMachine);
  });

  it('Должен выбрасываться ошибка при отсутствии конфига', () => {
    assert.throws(() => new StateMachine(), Error);
  });

  describe('Тестирование API', () => {

    let stateMachine;

    before(() => {
      stateMachine = new StateMachine([
        {
          name: 'A',
          onEnter: () => new Promise(r => r()),
          trigger: () => new Promise(r => r()),
          onLeave: () => new Promise(r => r())
        }
      ]);
    });

    it('Должно устанавливаться состояние (StateMachine::setState)', (done) => {
      stateMachine.setState('A');
    });
  });
});
