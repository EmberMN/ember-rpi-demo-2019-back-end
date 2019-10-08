const rpio = require('rpio');

const BUTTON_PIN = 40;
rpio.open(BUTTON_PIN, rpio.INPUT, rpio.PULL_UP);

const LED_PIN = 38;
rpio.open(LED_PIN, rpio.OUTPUT, rpio.LOW);


let isLEDOn = false;
let interval = setInterval(() => {
  console.log(`Pin ${BUTTON_PIN} is currently ${rpio.read(BUTTON_PIN) ? 'high' : 'low'}`);
  isLEDOn = !isLEDOn;
  rpio.write(LED_PIN, isLEDOn ? rpio.HIGH : rpio.LOW);
}, 500);

setTimeout(() => clearInterval(interval), 5*1000);

