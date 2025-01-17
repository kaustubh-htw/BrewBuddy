
import mqtt from "mqtt";
const brokerUrl = "wss://broker.hivemq.com:8884/mqtt";
const topic = "brewbuddy/motion";
const landingPageUrl = "http://landingpagebrewbuddy.s3-website-eu-west-1.amazonaws.com"; // Landing page URL

const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
console.log("Connected to MQTT broker");
client.subscribe(topic, (err) => {
if (err) {
    console.error("Failed to subscribe:", err);
} else {
    console.log("Subscribed to topic:", topic);
}
});
});

client.on("message", (receivedTopic, message) => {
if (receivedTopic === topic) {
const payload = message.toString();
console.log("Received message:", payload);

if (payload === "no motion") {
    console.log("trying to revert to landing")
    // statusElement.textContent = "Waiting for someone on the other side...";

    // Redirect to landing page after 2 seconds
    setTimeout(() => {
        console.log("routing back");
    window.location.href = landingPageUrl;
    }, 2000);
}
}
});

client.on("error", (err) => {
console.error("MQTT Error:", err);
});


import AgoraRTC from "agora-rtc-sdk-ng";

let rtc = {
    localAudioTrack: null,
    localVideoTrack: null,
    client: null,
};

let options = {
    appId: "2a1d5df5bdf344718f49d34ed258885d", // Your Agora App ID
    channel: "brew_buddy",                     // Your Agora Channel name
   
};

// Mute Audio functionality for local user
async function toggleMute() {
    const muteButton = document.getElementById("mute-btn");
    const muteIcon = document.getElementById("mute-icon");

    if (rtc.localAudioTrack) {
        const isMuted = rtc.localAudioTrack.muted;

        if (isMuted) {
            // Unmute the microphone
            await rtc.localAudioTrack.setMuted(false);
            muteIcon.classList.remove("fa-microphone-slash");
            muteIcon.classList.add("fa-microphone");
            muteButton.classList.remove("white-bg")
            muteButton.classList.add("mute-btn")

            
        } else {
            // Mute the microphone
            await rtc.localAudioTrack.setMuted(true);
            muteIcon.classList.remove("fa-microphone");
            muteIcon.classList.add("fa-microphone-slash");
            muteButton.classList.remove("mute-btn")
            muteButton.classList.add("white-bg")
        }
        // to republish after mute/unmute
        try {
            await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);
            console.log("Re-published audio and video after mute toggle");
        } catch (error) {
            console.error("Failed to republish audio and video:", error);
        }
    }
}

// Toggle Video functionality for local user
async function toggleVideo() {
    const videoButton = document.getElementById("video-btn");
    const videoIcon = document.getElementById("video-icon");


    if (rtc.localVideoTrack) {
        const isVideoEnabled = rtc.localVideoTrack.enabled;

        const localPlayerContainer = document.getElementById(options.uid); // Local video container
        

        if (isVideoEnabled) {
            // Disable video (video off)
            await rtc.localVideoTrack.setEnabled(false); 

            videoIcon.classList.remove("fa-video");
            videoIcon.classList.add("fa-video-slash");

            videoButton.classList.remove("video-btn")
            videoButton.classList.add("white-bg")

           
        } else {
            // Enable video (video on)
            await rtc.localVideoTrack.setEnabled(true);

           
            videoIcon.classList.remove("fa-video-slash");
            videoIcon.classList.add("fa-video");
            videoButton.classList.remove("white-bg")
            videoButton.classList.add("video-btn")

            
        }
    }
}



async function startBasicCall() {

    

    rtc.client = AgoraRTC.createClient({ mode: "rtc", codec: "vp8" });

    rtc.client.on("user-published", async (user, mediaType) => {
        // Subscribe to the remote user.
        await rtc.client.subscribe(user, mediaType);
        console.log("Subscribe success");

        // Handle remote video track (no control over mute/video for remote users)
        if (mediaType === "video") {
            
            const remoteVideoTrack = user.videoTrack;
            
            //const remotePlayerContainer = document.createElement("div");

            let remotePlayerContainer = document.getElementById(user.uid.toString());
            console.log("remote player container is ", remotePlayerContainer);
            
            if (!remotePlayerContainer) {
                // Create a new container if one doesn't exist
                // remotePlayerContainer = document.createElement("div");
                remotePlayerContainer = document.getElementById('remoteVideo')
                // remotePlayerContainer.id = user.uid.toString();
                // remotePlayerContainer.classList.add(".remote");
                // document.getElementById("remoteVideo").append(remotePlayerContainer);
            }
    
            // Play the video track in the existing or new container
            remoteVideoTrack.play(remotePlayerContainer);
        }

        // Handle remote audio track
        if (mediaType === "audio") {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack.play();
        }

      
    });

    rtc.client.on("user-unpublished", (user, mediaType) => {
        console.log("User unpublished:", user.uid);
    
        // Remove video container for unpublished video
        if (mediaType === "video" & mediaType === "audio") {
            const remotePlayerContainer = document.getElementById(user.uid.toString());
            if (remotePlayerContainer) {
                remotePlayerContainer.remove();
                console.log(`Removed container for user ${user.uid}`);
            }
        }
    });
    
    rtc.client.on("user-left", (user) => {
        console.log("User left:", user.uid);
    
        // Remove video container when user leaves
        const remotePlayerContainer = document.getElementById(user.uid.toString());
        if (remotePlayerContainer) {
            remotePlayerContainer.remove();
            console.log(`Removed container for user ${user.uid}`);
        }
    });

    try {
        // Fetch the token from the Lambda API
        const response = await fetch("https://aivcy9c9k8.execute-api.eu-west-1.amazonaws.com/default/GenerateAgoraToken/generate-token");
        const data = await response.json();
        const body = JSON.parse(data.body); // Parse the 'body' string to JSON object
        const token = body.token;
        const uid = body.uid;
        console.log("Token:", token); // Print the token

       
        await rtc.client.join(options.appId, options.channel, token, uid);

        options.uid = uid;

         // Create and publish local audio and video tracks.
        rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);

        // Create and play the local video track
        // const localPlayerContainer = document.createElement("div");
        const localPlayerContainer = document.getElementById("localVideo");
        // localPlayerContainer.id = options.uid;
        // localPlayerContainer.classList.add("video-feed local");
        // document.getElementById("localVideo").append(localPlayerContainer);
        rtc.localVideoTrack.play(localPlayerContainer);

        console.log("Publish success!");
    } catch (error) {
        console.error("Failed to join the channel:", error);
    }
}

// Automatically start the call when the page loads.


window.onload = function () {

        
          // Proceed with Agora logic if token is valid
          
            
          startBasicCall();

          // Add event listeners for mute and video buttons (local user only)
          document.getElementById("mute-btn").addEventListener("click", toggleMute);
          document.getElementById("video-btn").addEventListener("click", toggleVideo);
    }


// Clean up resources when the page is closed.
window.onbeforeunload = async function () {
    if (rtc.localAudioTrack) rtc.localAudioTrack.close();
    if (rtc.localVideoTrack) rtc.localVideoTrack.close();
    if (rtc.client) await rtc.client.leave();
};
