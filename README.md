# Rtsp2Html5
Proxy for converting the live stream from an IP camera into something all web browsers can consume


This is NOT production ready. I bodged this together so I could view my IP camera when I wasn't at home.

# Installation

I use a raspberry pi for the streaming proxy and hosting the frontend. Any linux based system should work however.

$ sudo apt-get install ffmpeg nodejs nginx etc

$ cd /var/www

$ git clone https://github.com/ralphhughes/Rtsp2Html5.git

$ cd Rtsp2Html5

$ nodejs livestream.js

Then visit http://[Your pi IP]/Rtsp2Html5/livestream.htm in your browser
