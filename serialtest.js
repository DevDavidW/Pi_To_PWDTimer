const SerialPort = require('serialport')
const Readline = SerialPort.parsers.Readline

const port = new SerialPort('/dev/ttyACM0', function (err) {
  if (err) {
    return console.log('Error: ', err.message)
  }
})

//Read lines of data
const parser = port.pipe(new Readline({ delimiter: '\n' }))

parser.on('data', function (data) {
    console.log('Data:', data)
})