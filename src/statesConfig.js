export default [
  {
    name       : 'A',
    onEnter    : (deferred) => {
      console.log("Входим в А");
      deferred.resolve({ value: [1, 2, 3] });
    },
    onLeave    : (deferred) => {
      console.log("Вышли из А");
      deferred.resolve();
    },
    trigger    : (deferred, data) => {
      console.log('Логика для А');
      console.log('Данные для А: ' + JSON.stringify(data));

      data.next = 'B';
      deferred.resolve(data);

    },
    transitions: {
      C: (deferred, data) => {
          console.log("onTransition A->C");
          deferred.resolve(data);
      },
      B: (deferred, data) => {
        console.log("onTransition A->B");
        deferred.resolve(data);
      }
    }
  },
  {
    name       : 'B',
    onEnter    : (deferred, data) => {
      console.log("Вошли в B");
      deferred.resolve(data);
    },
    trigger    : (deferred, data) => {
      console.log('Логика для B');
      console.log('Данные для B: ' + JSON.stringify(data));

      setTimeout(() => deferred.resolve({ next: 'C' }), 1000);

    },
    transitions: {
      C: (deferred, data) => {
        console.log("onTransition B->C");
        deferred.resolve(data);
      },
      A: (deferred) => {
        console.log("onTransition B->A");
        deferred.resolve();
      }
    }
  },
  {
    name   : 'C',
    trigger: (deferred, data) => {

      console.log('Логика для С');
      console.log('Данные для C: ' + JSON.stringify(data));

      deferred.resolve(data);
    }
  },
  {
    name   : 'D',
    trigger: (deferred, data) => {

      console.log('Логика для D');
      console.log('Данные для D: ' + JSON.stringify(data));

      deferred.resolve({ data: "State D finished" });
    }
  }
];
