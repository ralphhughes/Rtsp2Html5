const url = require('url');
const child_process = require('child_process');

var cameras = [
	{name: "cam1", rtsp: "rtsp://192.168.0.31:554/11"},
	{name: "cam2", rtsp: "rtsp://192.168.0.31:554/12"}
];

    // Live video stream management for HTML5 video. Uses FFMPEG to connect to H.264 camera stream, 
    // Camera stream is remuxed to a MP4 stream for HTML5 video compatibility and segments are recorded for later playback
var liveStream = function (req, resp) {                                            // handle each client request by instantiating a new FFMPEG instance
    // For live streaming, create a fragmented MP4 file with empty moov (no seeking possible).

    var reqUrl = url.parse(req.url, true)
    var cameraName = typeof reqUrl.pathname === "string" ? reqUrl.pathname.substring(1) : undefined;
    if (cameraName) {
        try {
            cameraName = decodeURIComponent(cameraName);
        } catch (exception) {
            console.log("Live Camera Streamer bad request received - " + reqUrl);         // Can throw URI malformed exception.
            return false;
        }
    } else {
        console.log("Live Camera Streamer - incorrect camera requested " + cameraName);         // Can throw URI malformed exception.
        return false;
    }
    
    console.log("Client connection made to live Camera Streamer requesting camera: " + cameraName)

    resp.writeHead(200, {
        //'Transfer-Encoding': 'binary'
          "Connection": "keep-alive"
        , "Content-Type": "video/mp4"
        //, 'Content-Length': chunksize            // ends after all bytes delivered
        , "Accept-Ranges": "bytes"                 // Helps Chrome
    });

    for (var cam in cameras) {
        if (cameraName.toLowerCase() === cameras[cam].name.toLowerCase()) {
           if (!cameras[cam].liveStarted) {
                cameras[cam].liveffmpeg = child_process.spawn("ffmpeg", [
                    "-rtsp_transport", "tcp", "-i", cameras[cam].rtsp, "-vcodec", "copy", "-f", "mp4", "-movflags", "frag_keyframe+empty_moov", 
                    "-reset_timestamps", "1", "-vsync", "1","-flags", "global_header", "-bsf:v", "dump_extra", "-y", "-"   // output to stdout
                    ],  {detached: false});

                cameras[cam].liveStarted = true;
                cameras[cam].liveffmpeg.stdout.pipe(resp);

                cameras[cam].liveffmpeg.stdout.on("data",function(data) {
                });

                cameras[cam].liveffmpeg.stderr.on("data", function (data) {
                    console.log(cameras[cam].name + " -> " + data);
                });

                cameras[cam].liveffmpeg.on("exit", function (code) {
                    console.log(cameras[cam].name + " live FFMPEG terminated with code " + code);
                });

                cameras[cam].liveffmpeg.on("error", function (e) {
                    console.log(cameras[cam].name + " live FFMPEG system error: " + e);
                });
           }
           break;                       // Keep cam variable active with the selected cam number
        }
    }
    if (cameras[cam].liveStarted === false) {
        // Didn't select a camera
    }

    req.on("close", function () {
        shutStream("closed")
    })

    req.on("end", function () {
        shutStream("ended")
    });

    function shutStream(event) {
        //TODO: Stream is only shut when the browser has exited, so switching screens in the client app does not kill the session
        console.log("Live streaming connection to client has " + event)
        if (typeof cameras[cam].liveffmpeg !== "undefined") {
            cameras[cam].liveffmpeg.kill();
            cameras[cam].liveStarted = false;
        }
    }
    return true
}

var http = require("http");
var app = http.createServer(liveStream);
app.listen(3000);
console.log("livestream.js up and running on port 3000");
