# Pi_To_PWDTimer

A web API interface for the Pi to connect to the PWDTimer on the Arduino

**Credit: This was originally the "speedRacer" project forked from [chtzvt/speedRacer](https://github.com/chtzvt/speedRacer).**

With our setup, I wanted to simplify the project so decided to create a new project.
We have a custom written computer program that uses this program as the API to communicate with the PWDTimer project.

The setup involves:

- Computer running at the podium connected to WiFi router
- RaspberryPi running FPP (https://github.com/FalconChristmas/fpp) used to control custom light pole using pixels, a sound countdown, and triggers the start of the race.
- FPP trigger uses a GPIO pin to activate the start gate GPIO on the Arduino and at the same time triggers a relay to release the physical start gate
- Computer polls the API /get/state to determine when race is finished and obtain the times
- This was also made to store all the times and includes an ability to retrieve the last times. This can be useful if the computer didn't get the times for some reason before the race was reset (should be rare).
