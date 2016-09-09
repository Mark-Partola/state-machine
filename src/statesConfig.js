export default [
  {
    name       : 'A',
    onEnter    : () => {
      return new Promise((res, rej) => {
        console.log("Входим в А");
        res({
          mybewvalue: [1, 2, 3]
        });

        // rej(new Error('Hahahahah im error!!'));
      });
    },
    onLeave    : () => {
      return new Promise((res) => {
        console.log("Вышли из А");
        res();
      });
    },
    trigger    : (data) => new Promise((res) => {

      console.log('Логика для А');
      console.log('Данные для А: ' + JSON.stringify(data));

      data.next = 'B';

      res(data);

    }),
    transitions: {
      C(data) {
        return new Promise((res) => {
          console.log("onTransition A->C");
          res(data);
        });
      },
      B(data) {
        return new Promise((res) => {
          console.log("onTransition A->B");
          res(data);
        });
      }
    }
  },
  {
    name       : 'B',
    onEnter    : (data) => {
      return new Promise((res) => {
        console.log("Вошли в B");
        res(data);
      });
    },
    trigger    : (data) => new Promise((res, rej) => {

      console.log('Логика для B');
      console.log('Данные для B: ' + JSON.stringify(data));

      setTimeout(()=> {
        res({
          next: 'C'
        });
      }, 1000);

    }),
    transitions: {
      C(data) {
        return new Promise((res) => {
          console.log("onTransition B->C");
          res(data);
        });
      },
      A(data) {
        return new Promise((res) => {
          console.log("onTransition B->A");
          res();
        });
      }
    }
  },
  {
    name   : 'C',
    trigger: (data) => new Promise((res, rej) => {

      console.log('Логика для С');
      console.log('Данные для C: ' + JSON.stringify(data));

      res(data);
    })/*,
   transitions: {
   A(data) {
   return new Promise((res) => {
   console.log("onTransition C->A");
   res(data);
   });
   },
   B(data) {
   return new Promise((res) => {
   console.log("onTransition C->A");
   res(data);
   });
   }
   }*/

  },
  {
    name   : 'D',
    trigger: (data) => new Promise((res, rej) => {

      console.log('Логика для D');
      console.log('Данные для D: ' + JSON.stringify(data));

      res({
        data: "State D finished"
      });

    })
  }
];
