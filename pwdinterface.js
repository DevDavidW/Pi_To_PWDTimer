const http = require('http');
const url = require('url');
const moment = require('moment');
const file = require('fs');
const SerialPort = require('serialport')
const Readline = SerialPort.parsers.Readline

var CONFIG = {
    TRACKS: [
        {
            id: 1,
            human_name: "Lane 1",
            endTime: '',
            computedTimeSeconds: '',
            ctl: {}
        },
        {
            id: 2,
            human_name: "Lane 2",
            endTime: '',
            computedTimeSeconds: '',
            ctl: {}
        },
        {
            id: 3,
            human_name: "Lane 3",
            endTime: '',
            computedTimeSeconds: '',
            ctl: {}
        },
        {
            id: 4,
            human_name: "Lane 4",
            endTime: '',
            computedTimeSeconds: '',
            ctl: {}
        }
    ],
    HTTP_PORT: 8080,
    LANES_IN_USE: 4,
    LANES_COMPLETED: 0,
    RACE_STATUS: "WAIT"
};

console.log("Num lanes in use: ", CONFIG.LANES_IN_USE);
writelog("Initialize");
writelog("CONFIG.TRACKS: " + CONFIG.TRACKS.length);
writelog("CONFIG.LANES_IN_USE: " + CONFIG.LANES_IN_USE);

//Serial port communications
const serialport = new SerialPort('/dev/ttyACM0', function (err) {
    if (err) {
      return console.log('Error: ', err.message)
    }
    console.log("Serial port opened");
});

//Read lines of data
const portreader = serialport.pipe(new Readline({ delimiter: '\n' }))

http.createServer(function(req, res) {

    if (req.method === "GET") {
        let call = url.parse(req.url, true);

        // allow any origin to make API calls.
        res.setHeader('Access-Control-Allow-Origin', '*');

        processRequest(call.pathname, call.query, req, res);

    } else {
        res.writeHead(400);
        res.end(JSON.stringify({
            error: "method not implemented"
        }));
    }
}.bind({
    CONFIG: CONFIG
})).listen(CONFIG.HTTP_PORT);

console.log("HTTP Server started on port:", CONFIG.HTTP_PORT);

function processRequest(method, params, req, res) {

    switch (method) {
        case "/get/state": // Retrieve track/application state
            res.writeHead(200);
            res.end(JSON.stringify(getState(CONFIG)));
            break;

        case "/get/prevstate": //Retrieve previous state from file log
            res.writeHead(200);
            res.end(getLastLogLine());
            break;

        case "/set/reset": // Soft reset button (in addition to physical one)
            res.writeHead(200);
            res.end(JSON.stringify({
                command_sent: true
            }));

            if (params.lanes && CONFIG.LANES_IN_USE != params.lanes) {
               CONFIG.LANES_IN_USE = params.lanes;
               console.log("Changed LANES_IN_USE to " + CONFIG.LANES_IN_USE);
            }

            resetState();
            unMaskAllLanes();

            if (params.lanesNotUsed) {
                setLanesNotUsed(params.lanesNotUsed);
                console.log("Lanes Not Used: ", params.lanesNotUsed)
            }

            break;

        case "/lanecheck": // Enter lane check mode
            res.writeHead(200);
            res.end(JSON.stringify({
                command_sent: true
            }));

            startLaneCheck();

            break;

        case "/disppack": // Display pack number
            res.writeHead(200);
            res.end(JSON.stringify({
                command_sent: true
            }));

            displaypack();

            break;

        case "/displanes": // Display lane numbers
            res.writeHead(200);
            res.end(JSON.stringify({
                command_sent: true
            }));

            displaylanes();

            break;

        default: // Unhandled API method
            res.writeHead(400);
            res.end(JSON.stringify({
                error: "method not implemented"
            }));
    }

};

// Reads application state and removes j5 related properties.
function getState(config) {
    let state = {};

    state.RACE_STATUS = config.RACE_STATUS;
    state.LANES_IN_USE = config.LANES_IN_USE;

    state.TRACKS = [];
    for (let i = 0; i < config.TRACKS.length; i++) {
        let newCar = {
           "Lane": config.TRACKS[i].id,
           "endTime": config.TRACKS[i].endTime,
           "elapsedTime": config.TRACKS[i].computedTimeSeconds
        }
        state.TRACKS[i] = newCar;
    }

    return state;
};

// Reset all recorded and computed times, for all tracks
function resetState(){

    for (let i = 0; i < CONFIG.TRACKS.length; i++) {
      CONFIG.TRACKS[i].endTime = '';
      CONFIG.TRACKS[i].computedTimeSeconds = '';
    }

    //reset timer
    serialport.write('R\r\n', function(err) {
        if (err) {
          return console.log('Error on write: ', err.message)
        }
        console.log('Sent R to timer')
    });
    CONFIG.LANES_COMPLETED = 0;

    writelog("RESET LANES=" + CONFIG.LANES_IN_USE);

    console.log("Waiting to start");
};

//Setup which lanes are in use
function unMaskAllLanes() {
    //mask lane
    serialport.write('U\r\n', function(err) {
        if (err) {
           return console.log('Error on write: ', err.message)
        }
        console.log('Sent U to timer')
    });
}

//Setup which lanes are in use
function setLanesNotUsed(lanesNotUsed) {
    JSON.parse(lanesNotUsed).forEach(lane => {
        //mask lane
        serialport.write('M' + lane + '\r\n', function(err) {
            if (err) {
                return console.log('Error on write: ', err.message)
            }
            console.log('Sent M' + lane + ' to timer')
        });
    });
}

//Enter lane sensor check mode
function startLaneCheck() {
    if (CONFIG.RACE_STATUS =="WAIT") { //only perform this in WAIT state
        CONFIG.RACE_STATUS = "TESTING";

        serialport.write('C\r\n', function(err) {
            if (err) {
            return console.log('Error on write: ', err.message)
            }
            console.log('Sent C to timer')
        });
    }
}

//Display lane numbers on matrices
function displaylanes() {
    //mask lane
    serialport.write('L\r\n', function(err) {
        if (err) {
           return console.log('Error on write: ', err.message)
        }
        console.log('Sent L to timer')
    });
}

//Display pack number on matrices
function displaypack() {
    //mask lane
    serialport.write('2\r\n', function(err) {
        if (err) {
           return console.log('Error on write: ', err.message)
        }
        console.log('Sent 2 to timer')
    });
}

//Reads in last line of log file
function getLastLogLine() {
    let response = "{}";

    //if file exists, get last line containing a RACE_STATUS
    if(file.existsSync("pwd.log")) {
       response = require("child_process").execSync("grep RACE_STATUS pwd.log | tail -1").toString();
       if (response.includes(" - "))
          response = response.split(" - ")[1];
       else
          response = "{}";
    }

    return response;
};

function setLaneCompleted(lane, endTime){
    let i = lane-1;

    if(CONFIG.RACE_STATUS =="RACING" && CONFIG.TRACKS[i].computedTimeSeconds === ""){
       //CONFIG.TRACKS[i].endTime = endTime;
       CONFIG.TRACKS[i].computedTimeSeconds = endTime;
       CONFIG.LANES_COMPLETED += 1;
       console.log("Lane " + lane + " finished");
    }

    //check if last lane then end race
    if (CONFIG.LANES_IN_USE == CONFIG.LANES_COMPLETED && CONFIG.RACE_STATUS != "COMPLETE") {
       CONFIG.RACE_STATUS = "COMPLETE";
       console.log("Race Complete");

       //write results to log
       writelog(JSON.stringify(getState(CONFIG)));
    }
};

function writelog (message) {
    file.appendFile("pwd.log", moment().format('MM-DD-YYYY hh:mm:ss') + " - " + message + "\n", (err) => {
       if (err) throw err;
    });
};


//P == Power On
//K == Ready after reset
//. == OK

portreader.on('data', function (data) {
    console.log('Data:', data)

    if (data.includes("P") || data.includes("K") )
        CONFIG.RACE_STATUS = "WAIT";
    else if (data.includes("B"))
        CONFIG.RACE_STATUS = "RACING";
    else if (data.includes(" - ")) {
        let lanedata = data.split(" - ");
        setLaneCompleted(Number(lanedata[0]), Number(lanedata[1]));
    }

    console.log("RACE_STATUS: ", CONFIG.RACE_STATUS);
});
