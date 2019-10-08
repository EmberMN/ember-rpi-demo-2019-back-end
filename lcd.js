// Constants associated with this particular cheap-o LCD module
const LCD_I2C_ADDR = 0x3F;
// Control (always output)
const LCD_RS_BIT = (1 << 0);
const LCD_RW_BIT = (1 << 1);
const LCD_E_BIT = (1 << 2);
const LCD_BL_BIT = (1 << 3);
// Data (bidirectional)
const LCD_D4_BIT = (1 << 4);
const LCD_D5_BIT = (1 << 5);
const LCD_D6_BIT = (1 << 6);
const LCD_D7_BIT = (1 << 7);


// (borrowed from free Arduino implementation)
const LCD_CLEARDISPLAY = 0x01;
const LCD_RETURNHOME = 0x02;
const LCD_ENTRYMODESET = 0x04;
const LCD_DISPLAYCONTROL = 0x08;
const LCD_CURSORSHIFT = 0x10;
const LCD_FUNCTIONSET = 0x20;
const LCD_SETCGRAMADDR = 0x40;
const LCD_SETDDRAMADDR = 0x80;

// flags for display entry mode
const LCD_ENTRYRIGHT = 0x00;
const LCD_ENTRYLEFT = 0x02;
const LCD_ENTRYSHIFTINCREMENT = 0x01;
const LCD_ENTRYSHIFTDECREMENT = 0x00;

// flags for display on/off control
const LCD_DISPLAYON = 0x04;
const LCD_DISPLAYOFF = 0x00;
const LCD_CURSORON = 0x02;
const LCD_CURSOROFF = 0x00;
const LCD_BLINKON = 0x01;
const LCD_BLINKOFF = 0x00;

// flags for display/cursor shift
const LCD_DISPLAYMOVE = 0x08;
const LCD_CURSORMOVE = 0x00;
const LCD_MOVERIGHT = 0x04;
const LCD_MOVELEFT = 0x00;

// flags for function set
const LCD_8BITMODE = 0x10;
const LCD_4BITMODE = 0x00;
const LCD_2LINE = 0x08;
const LCD_1LINE = 0x00;
const LCD_5x10DOTS = 0x04;
const LCD_5x8DOTS = 0x00;


// Example from https://github.com/jperkin/node-rpio#ic
const rpio = require('rpio');

/*
 * Magic numbers to initialise the i2c display device and write output,
 * cribbed from various python drivers.
 */
const init = new Buffer([0x03, 0x03, 0x03, 0x02, 0x28, 0x0c, 0x01, 0x06]);
const LCD_LINE1 = 0x80, LCD_LINE2 = 0xc0;
const LCD_ENABLE = 0x04, LCD_BACKLIGHT = 0x08;

/*
 * Data is written 4 bits at a time with the lower 4 bits containing the mode.
 */
function lcdwrite4(data) {
        rpio.i2cWrite(Buffer([(data | LCD_BACKLIGHT)]));
        rpio.i2cWrite(Buffer([(data | LCD_ENABLE | LCD_BACKLIGHT)]));
        rpio.i2cWrite(Buffer([((data & ~LCD_ENABLE) | LCD_BACKLIGHT)]));
}

function lcdwrite(data, mode) {
        lcdwrite4(mode | (data & 0xF0));
        lcdwrite4(mode | ((data << 4) & 0xF0));
}

/*
 * Write a string to the specified LCD line.
 */
function lineout(str, addr) {
        lcdwrite(addr, 0);

        str.split('').forEach(function (c) {
                lcdwrite(c.charCodeAt(0), 1);
        });
}

/*
 * We can now start the program, talking to the i2c LCD at address 0x27.
 */
rpio.i2cBegin();
rpio.i2cSetSlaveAddress(LCD_I2C_ADDR);
rpio.i2cSetBaudRate(10 * 1000);

for (var i = 0; i < init.length; i++) {
    lcdwrite(init[i], 0);
}

lineout('node.js i2c LCD!', LCD_LINE1);
lineout('npm install rpio', LCD_LINE2);

rpio.i2cEnd();
