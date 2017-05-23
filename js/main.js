'use strict';
//RTCPeerConnection - stream audio and video between users
//Calling
// STUN - get IP of your computer
// TURN  - relay servers
// Both webRTC Clients on same Page
/**
Process - 
1.Peer A create own RTC object then getUserMedia then sequential Data send Peer B
2.Peer B accept Data and add it to addIceCandidate
 - stream audio and video between users
Peer A sends OfferRequest with local SDP to peer B
Peer B accepts offerRequest and setRemoteSDp
Then 
Peer B send answerrequest with Remote SDP send by Peer A
Then
Peer B setLocal SDP
and also send Local SDP to Peer A
Peer A set it to Remote SDP.

**/
var startButton = document.getElementById('startCallButton');
var callButton = document.getElementById('callButton');
var hangupButton = document.getElementById('hangupButton');
callButton.disabled = true;
hangupButton.disabled = true;
startButton.onclick = start;
callButton.onclick = call;
hangupButton.onclick = hangup;

var startTime;
var localVideo = document.getElementById('localVideo');
var remoteVideo = document.getElementById('remoteVideo');


// Setting Up Local Video Element Size : 
localVideo.addEventListener('loadedmetadata', function() {
  trace('Local video videoWidth: ' + this.videoWidth +
    'px,  videoHeight: ' + this.videoHeight + 'px');
});
// Setting up remote video size : 
remoteVideo.addEventListener('loadedmetadata', function() {
  trace('Remote video videoWidth: ' + this.videoWidth +
    'px,  videoHeight: ' + this.videoHeight + 'px');
});


// onresize Check StartTime intialized in Call Function : 
remoteVideo.onresize = function() {
	//alert("onresize");
  trace('Remote video size changed to ' +
    remoteVideo.videoWidth + 'x' + remoteVideo.videoHeight);
  // We'll use the first onresize callback as an indication that video has started
  // playing out.
  //alert("StartTime"+startTime);
  if (startTime) {
    var elapsedTime = window.performance.now() - startTime;
    trace('Setup time: ' + elapsedTime.toFixed(3) + 'ms');
    startTime = null;
  }
};

var localStream;
var pc1;
// pc1 -peer client  1 - RTCPeerConnection Object 
// pc2 - peer client 2  

var pc2;

// Offer Options : 
var offerOptions = {
  offerToReceiveAudio: 1,
  offerToReceiveVideo: 1
};

// Return the name of the pc in parameter whether it is pc1 or pc2
function getName(pc) {
//alert("pc1 : "+pc1);
  return (pc === pc1) ? 'pc1' : 'pc2';
}

// 	Return the name of the other peer connected if it is pc1 then return pc2
function getOtherPc(pc) {
  return (pc === pc1) ? pc2 : pc1;
}

function gotStream(stream)
 {	
 //alert("stream : "+stream);
 // stream : object Media Stream
 trace('Received local stream from navigator object in Start Function');
 localVideo.srcObject = stream;
  // Add localStream to global scope so it's accessible from the browser console
  window.localStream = localStream = stream;
  callButton.disabled = false;
  // Activated The Call Button
}

// First Clicking Start
function start() {
	// Just getting Video Using getUserMedia of Navigator Object
  trace('Requesting local stream');
  startButton.disabled = true;
	//Start Disabled Until Hang Up
  // If received Media Devices then call the gotstream function : 
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true
  })
  .then(gotStream)
  .catch(function(e) {
    alert('getUserMedia() error: ' + e.name);
  });
}

function call() 
{
	//pc1 is undefined
	//alert("pc1 : "+pc1);
  callButton.disabled = true;
  hangupButton.disabled = false;
  trace('Starting call');
  // Window.performance for website performance
 //performance.now() : 
//Returns a DOMHighResTimeStamp representing the number of milliseconds elapsed since a reference instant.
  startTime = window.performance.now();
  //alert("startTime in Call Function : "+startTime);
  var videoTracks = localStream.getVideoTracks();
  //alert("VideoTracks  :"+videoTracks[0].label);
  var audioTracks = localStream.getAudioTracks();
  
  if (videoTracks.length > 0) 
  {
    trace('Using video device: ' + videoTracks[0].label);
  }
  if (audioTracks.length > 0) {
    trace('Using audio device: ' + audioTracks[0].label);
  }
  var servers = null;
  // Add pc1 to global scope so it's accessible from the browser console
  window.pc1 = pc1 = new RTCPeerConnection(servers);
// Assigning the pc1 as RTC PEER OBJECT
  // RTCPeerConnection without servers
  // server can be specified as STUN or TURN servers
  // STUN - Session Traversal Utilities for NAT
  // TURN - Traversal Using Relays around NAT
  // NAT  - Network Address Translation
  trace('Created local peer connection object pc1');
  // Create RTCPeerConnection object
  //ICE - Interactive Connectivity Establishment
  pc1.onicecandidate = function(e) {
    onIceCandidate(pc1, e);
	// Function Call
  };
  // Add pc2 to global scope so it's accessible from the browser console
  window.pc2 = pc2 = new RTCPeerConnection(servers);
  trace('Created remote peer connection object pc2');
  pc2.onicecandidate = function(e) {
    onIceCandidate(pc2, e);
  };
  
  pc1.oniceconnectionstatechange = function(e) {
    onIceStateChange(pc1, e);
  };
  pc2.oniceconnectionstatechange = function(e) {
    onIceStateChange(pc2, e);
  };
  pc2.onaddstream = gotRemoteStream;

  pc1.addStream(localStream);
  trace('Added local stream to pc1');

  trace('pc1 createOffer start');
  pc1.createOffer(
    offerOptions
  ).then(
    onCreateOfferSuccess,
    onCreateSessionDescriptionError
  );
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function onCreateOfferSuccess(desc) {
	alert("onSuccess : "+"Offer from pc1\n" + desc.sdp);
  trace('Offer from pc1\n' + desc.sdp);
  trace('pc1 setLocalDescription start');
  pc1.setLocalDescription(desc).then(
    function() {
      onSetLocalSuccess(pc1);
    },
    onSetSessionDescriptionError
  );
  trace('pc2 setRemoteDescription start');
  pc2.setRemoteDescription(desc).then(
    function() {
      onSetRemoteSuccess(pc2);
    },
    onSetSessionDescriptionError
  );
  trace('pc2 createAnswer start');
  // Since the 'remote' side has no media stream we need
  // to pass in the right constraints in order for it to
  // accept the incoming offer of audio and video.
  pc2.createAnswer().then(
    onCreateAnswerSuccess,
    onCreateSessionDescriptionError
  );
}

function onSetLocalSuccess(pc) {
  trace(getName(pc) + ' setLocalDescription complete');
}

function onSetRemoteSuccess(pc) {
  trace(getName(pc) + ' setRemoteDescription complete');
}

function onSetSessionDescriptionError(error) {
  trace('Failed to set session description: ' + error.toString());
}

function gotRemoteStream(e) {
  // Add remoteStream to global scope so it's accessible from the browser console
  window.remoteStream = remoteVideo.srcObject = e.stream;
  trace('pc2 received remote stream');
}

function onCreateAnswerSuccess(desc) {
  trace('Answer from pc2:\n' + desc.sdp);
  trace('pc2 setLocalDescription start');
  pc2.setLocalDescription(desc).then(
    function() {
      onSetLocalSuccess(pc2);
    },
    onSetSessionDescriptionError
  );
  trace('pc1 setRemoteDescription start');
  pc1.setRemoteDescription(desc).then(
    function() {
      onSetRemoteSuccess(pc1);
    },
    onSetSessionDescriptionError
  );
}

function onIceCandidate(pc, event) {
	//Adding the remote peer client using addIceCandiate on ICE framework
	//alert("onIce Candiate event.candiate  :"+event.candiate); returned undefined
  if (event.candidate) {
    getOtherPc(pc).addIceCandidate(
      new RTCIceCandidate(event.candidate)
    ).then(
      function() {
        onAddIceCandidateSuccess(pc);
      },
      function(err) {
        onAddIceCandidateError(pc, err);
      }
    );
	//event.candiate sdp
	//alert("onIceCandiate : "+getName(pc) + ' ICE candidate: \n' + event.candidate.candidate);
    trace(getName(pc) + ' ICE candidate: \n' + event.candidate.candidate);
  }
}

function onAddIceCandidateSuccess(pc) {

  trace(getName(pc) + ' addIceCandidate success');
}

function onAddIceCandidateError(pc, error) {
	// Showing in console and specified button pressed.
  trace(getName(pc) + ' failed to add ICE Candidate: ' + error.toString());
}

function onIceStateChange(pc, event) {
  if (pc) {
	  //pc is pc1 or pc2
	  //alert("OnIceStateChange"); checking connected
	  //alert(getName(pc)+ ' ICE state: ' + pc.iceConnectionState);
	  
    trace(getName(pc) + ' ICE state: ' + pc.iceConnectionState);
    console.log('ICE state change event: ', event);
  }
}

function hangup() {
  trace('Ending call');
  pc1.close();
  pc2.close();
  pc1 = null;
  pc2 = null;
  // pc1 and pc2 null
  hangupButton.disabled = true;
  callButton.disabled = false;
  startButton.disabled = false;
}

// dATA shown in ctrl+shift+I
function trace(text) {
  if (text[text.length - 1] === '\n') {
    text = text.substring(0, text.length - 1);
  }
  if (window.performance) {
    var now = (window.performance.now() / 1000).toFixed(3);
    console.log(now + ': ' + text);
  } else {
    console.log(text);
  }
}
