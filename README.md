# Pi_To_PWDTimer

A web API interface for the Pi to connect to the PWDTimer on the Arduino

**Credit: This was originally the "speedRacer" project forked from [chtzvt/speedRacer](https://github.com/chtzvt/speedRacer).**

With our setup, I wanted to simplify the project so decided to create a new project.
We have a custom written computer program that uses this program as the API to communicate with the PWDTimer project.

Our pack setup involves:

- Computer running at the podium connected to WiFi router
- In a box at the track is a Pi connected to the router and connected to Arduino using USB cable
- Pi runs FPP image (https://github.com/FalconChristmas/fpp) used to control custom light pole using pixels, a sound countdown, and triggers the start of the race
- FPP trigger uses a GPIO pin to activate the start gate GPIO on the Arduino and at the same time triggers a relay to release the physical start gate
- Computer polls the API /get/state to determine when race is finished and obtain the times
- This program also stores all the times in a file on the Pi and includes an ability to retrieve the last times. This can be useful if the computer didn't get the times for some reason before the race was reset (should be rare)
- Computer can trigger other functions of the timer like fnish line check (part of the "test" mode), display the lane numbers, or display the pack numbers in the matrix displays

## Installing and Running

Copy the files down to a folder and run:

> npm install

Then run the program with:

> ./runpwd.sh

