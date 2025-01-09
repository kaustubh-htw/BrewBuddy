import AgoraRTC from "agora-rtc-sdk-ng";

let rtc = {
    localAudioTrack: null,
    localVideoTrack: null,
    client: null,
};

let options = {
    appId: "2a1d5df5bdf344718f49d34ed258885d", // Your Agora App ID
    channel: "brew_buddy",                     // Your Agora Channel name
    token: "007eJxTYHgg4nnTwzm94I/ulsqqr8ZTe36Wsr7dJ1eU8H8nj+zdbzcVGIwSDVNMU9JMk1LSjE1MzA0t0kwsU4xNUlOMTC0sLExTdt6oTm8IZGRoOSHCwsgAgSA+F0NSUWp5fFJpSkolAwMAqj0j7w==", // Your Agora Token
    uid: String(Math.floor(Math.random() * 10000)), // Generate a random user ID
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
    }
}

// Toggle Video functionality for local user
async function toggleVideo() {
    const videoButton = document.getElementById("video-btn");
    const videoIcon = document.getElementById("video-icon");


    if (rtc.localVideoTrack) {
        const isVideoEnabled = rtc.localVideoTrack.enabled;

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
            const remotePlayerContainer = document.createElement("div");
            remotePlayerContainer.id = user.uid.toString();
            remotePlayerContainer.classList.add("video-container");
            document.getElementById("video-container").append(remotePlayerContainer);
            remoteVideoTrack.play(remotePlayerContainer);
        }

        // Handle remote audio track
        if (mediaType === "audio") {
            const remoteAudioTrack = user.audioTrack;
            remoteAudioTrack.play();
        }

        // Listen for "user-unpublished" event and remove remote user when they leave
        rtc.client.on("user-unpublished", (user) => {
            const remotePlayerContainer = document.getElementById(user.uid);
            if (remotePlayerContainer) {
                remotePlayerContainer.remove();
            }
        });
    });

    try {
        // Join the channel
        await rtc.client.join(options.appId, options.channel, options.token, options.uid);

        // Create and publish local audio and video tracks.
        rtc.localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
        rtc.localVideoTrack = await AgoraRTC.createCameraVideoTrack();
        await rtc.client.publish([rtc.localAudioTrack, rtc.localVideoTrack]);

        // Create and play the local video track
        const localPlayerContainer = document.createElement("div");
        localPlayerContainer.id = options.uid;
        localPlayerContainer.classList.add("video-container");
        document.getElementById("video-container").append(localPlayerContainer);
        rtc.localVideoTrack.play(localPlayerContainer);

        console.log("Publish success!");
    } catch (error) {
        console.error("Failed to join the channel:", error);
    }
}

// Automatically start the call when the page loads.
window.onload = function () {
    startBasicCall();

    // Add event listeners for mute and video buttons (local user only)
    document.getElementById("mute-btn").addEventListener("click", toggleMute);
    document.getElementById("video-btn").addEventListener("click", toggleVideo);
};

// Clean up resources when the page is closed.
window.onbeforeunload = async function () {
    if (rtc.localAudioTrack) rtc.localAudioTrack.close();
    if (rtc.localVideoTrack) rtc.localVideoTrack.close();
    if (rtc.client) await rtc.client.leave();
};
