'use strict';
//use strict is for avoiding coding warnings
//RTCDataChannel - stream data between Users
//Text - Area  Sending Data
/*
Exchange Text Messages :RTCPeer + RTCDataChannel
New - createConnection and sendData

Data channels can be configured to enable different types of data sharing —  prioritizing reliable delivery over performance

3 differebt types of constraints : 


**/
var localConnection; // rtc peer object send 
var remoteConnection; //rtc peer object receive
var sendChannel; //data channel created by localConnection
var receiveChannel; 
var pcConstraint; //null used in rtc peer connection object craetion(servers,pcConstraint)
var dataConstraint; //null used with localConnection.createDataChannel(servers,dataConstraint)

//Text-Area giving Data to be send
var dataChannelSend = document.querySelector('textarea#dataChannelSend');
//Receiving side text - Area
var dataChannelReceive = document.querySelector('textarea#dataChannelReceive');
var startButton = document.querySelector('button#startButton');
var sendButton = document.querySelector('button#sendButton');
var closeButton = document.querySelector('button#closeButton');

// Onloading of Page  : 
// Start Activate and send and stop deactivate
startButton.disabled = false;
sendButton.disabled = true;
closeButton.disabled = true;
startButton.onclick = createConnection;
sendButton.onclick = sendData;
closeButton.onclick = closeDataChannels;




function createConnection()
 {
	 dataChannelSend.disabled = true;
	  startButton.disabled = true;
	 // on start button clicked
	 alert("Create Connection");
	 dataChannelSend.disabled = false;
  dataChannelSend.placeholder = '';
  var servers = null;
  pcConstraint = null;
  //RTCPeerConnection object Constraints
  dataConstraint = null;
  //SCTP - Stream Control Transmission Protocol
  trace('Using SCTP based data channels');
  // For SCTP, reliable and ordered delivery is true by default.
  // Add localConnection to global scope to make it visible
  // from the browser console.
  window.localConnection = localConnection =
      new RTCPeerConnection(servers, pcConstraint);
  trace('Created local peer connection object ------ localConnection');
// localConnection is RTCPeerConnection with servers-null and pcConstraint null 
// parameters :  are label and options for sendDataChannel
//sendDataChannel is human readable name for the channel - sendChannel
  sendChannel = localConnection.createDataChannel('sendDataChannel',
      dataConstraint);
	  // using peer connection object createDataChannel
  trace('Created send data channel');
//onicecandidate call function
 // creating peer1 object using onicecandiate handler calling iceCallback1 function
  localConnection.onicecandidate = iceCallback1; 
   sendChannel.onopen = onSendChannelStateChange;
   // SendChannelStateChange basics activates and deactivates the sendTextArea send and close button based on sendChannel state
  sendChannel.onclose = onSendChannelStateChange;
startButton.disabled = true;
  // Add remoteConnection to global scope to make it visible
  // from the browser console.
  // Another RTCPeerConnection
  window.remoteConnection = remoteConnection =
      new RTCPeerConnection(servers, pcConstraint);
  trace('Created remote peer connection object remoteConnection');

 //onicecandiate is called when object is available on the network
  remoteConnection.onicecandidate = iceCallback2;
  //----------------------------iceCallback if SDP available for the given connection by event.candiate then the other connection addIceCandiate and then trace sdp
  //alert("Remote Connection.onicecandidate"+remoteConnection.onicecandidate);
  // it assigns complete function code of iceCallback2 TO left side
  remoteConnection.ondatachannel = receiveChannelCallback;
  //=======================================Important ondatachannel==================
  // DataChannel Event of rtcpeer connection informs the object that the rtcdatachannel has been added to the network by createChannel by remote peer
//alert("RemoteConnection.ondatachannel"+  remoteConnection.ondatachannel);
  // iT aLSO assigns funtion code of receive Channel Callback
  localConnection.createOffer().then(
    gotDescription1,
    onCreateSessionDescriptionError
  );
 startButton.disabled = true;
  closeButton.disabled = false;
}

function onCreateSessionDescriptionError(error) {
  trace('Failed to create session description: ' + error.toString());
}

function sendData() 
{
  var data = dataChannelSend.value;
  sendChannel.send(data);
  trace('Sent Data: ' + data);
}

function closeDataChannels() {
  trace('Closing data channels');
  sendChannel.close();
  trace('Closed data channel with label: ' + sendChannel.label);
  receiveChannel.close();
  trace('Closed data channel with label: ' + receiveChannel.label);
  localConnection.close();
  remoteConnection.close();
  localConnection = null;
  remoteConnection = null;
  trace('Closed peer connections');
  startButton.disabled = false;
  sendButton.disabled = true;
  closeButton.disabled = true;
  dataChannelSend.value = '';
  dataChannelReceive.value = '';
  dataChannelSend.disabled = true;
 // disableSendButton();
  //enableStartButton();
}

function gotDescription1(desc) 
{
	//creating Offer : 
	// desc =  sdp rtc seddion description object
	//alert("got Description 1 : "+desc);
	//Local connection is creating offer so it is sdp of local peer
	
  localConnection.setLocalDescription(desc);
  trace('Offer from localConnection \n' + desc.sdp);
  remoteConnection.setRemoteDescription(desc);
  remoteConnection.createAnswer().then(
    gotDescription2,
    onCreateSessionDescriptionError
  );
}

function gotDescription2(desc) {
	// In answer of offer from local connection remote conection creates answer
		//alert("Got Description 2 : "+desc.sdp);
  remoteConnection.setLocalDescription(desc);
  // desc - sdp of remote peer
  trace('Answer from remoteConnection \n' + desc.sdp);
  localConnection.setRemoteDescription(desc);
}

function iceCallback1(event) {
	//localConnection.iceCandiate calling
  trace('local ice callback');
  // If get SDP
  //then addIceCandidate
  if (event.candidate) 
  {
	  // Getting SDP then remote connection peer will addIceCandiate this SDP
    remoteConnection.addIceCandidate(
      event.candidate
    ).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
	//sdp display
    trace('Local ICE candidate: \n' + event.candidate.candidate);
  }
}

function iceCallback2(event) 
{
	// remote connection RTC peer Object oniceCandiate Calling
  trace('remote ice callback');
  if (event.candidate) 
  {
	  //Getting SDP 
    localConnection.addIceCandidate(
      event.candidate
    ).then(
      onAddIceCandidateSuccess,
      onAddIceCandidateError
    );
	// Remote peer SDP
    trace('Remote ICE candidate: \n ' + event.candidate.candidate);
  }
}

function onAddIceCandidateSuccess() {
  trace('AddIceCandidate success.');
}

function onAddIceCandidateError(error) {
  trace('Failed to add Ice Candidate: ' + error.toString());
}

function receiveChannelCallback(event)
 { 
 
 // Informed  remoteConnection that The RTCDataChannel has been added to the network 
  trace('Receive Channel Callback');
  //receiveChannel variable declared earlier
  receiveChannel = event.channel; // giving sendChannel dataChannel reference object
  //alert("Receive Callback "+receiveChannel);
  //onMessage events the websocket or broadcastChannel or RTCPeerConnection that message has been received
  
  receiveChannel.onmessage = onReceiveMessageCallback;
 // alert("What"+receiveChannel.onmessage);
  receiveChannel.onopen = onReceiveChannelStateChange;
  //onopen informs the the object that the dataChannel connection has been established
  // StateChange function just trace the state of receiveChannel open or close
  receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveMessageCallback(event) {
  trace('Received Message');
  // Message Recived is set to receive side text Area
  dataChannelReceive.value = event.data;
}

function onSendChannelStateChange() 
{
//Called on state change of sendChannel either open or close
//sendChannel is data Channel created with null dataConstraint
 var readyState = sendChannel.readyState;
  // if readyState - tells which state it is open or close
  //alert("onSendChannelStateChange : "+readyState);
  trace('Send channel state is: ' + readyState);
  if (readyState === 'open') {
    // dataChannelSend is text-Area where text to be send is typed in
	dataChannelSend.disabled = false;
	//activate all send and close buttons and also send text Area
    dataChannelSend.focus();
  
  sendButton.disabled = false;
    closeButton.disabled = false;
  } else {
	  // Not Open - close
	  // if data Channel is not open
    dataChannelSend.disabled = true;
	//text-Area send is disabled
    sendButton.disabled = true;
	
    closeButton.disabled = true;
	// all deactivate
  }
}

function onReceiveChannelStateChange() {
  var readyState = receiveChannel.readyState;
	//alert("Receive Channel State Change  : "+readyState);
 trace('Receive channel state is: ' + readyState);
}

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
