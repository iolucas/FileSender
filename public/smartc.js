/*----WEBRTC----
-   Verify the RTC protocols each browser uses and check the needs of set protocols contraints like fire fox protocol is by default unreliable
-   Test unreliable transfer to see if it matches with hack to accelerate
-   Test unordered unreliable transfer
-   Enhance RTC Conn Framework with the on and emit stuff
-   Implement system in case of rtc connection falls or a timeout expire without data chunk, cancel the download
-   Must verify enhancements in the rtc connections
-   Create rtcconnections event as emit and on modes
-   Check the add candidate callbacks needs (alert on fire fox)
-   The same for setRemoteDesc and setLocalDesc
-   Only in firefox session is firing close event
-   Take of these messages of, connection accepted, etc cause a rtc conn, at least for a while, will never be refused.
-   put time out to kill connection ref in case remote host do not respond
-   think where try blocks should be put
-   check the api events that should be implemented here
--------------*/

function isRTCReady() {
    // Chrome or Safari
    if (navigator.webkitGetUserMedia) {
        //getUserMedia = webkitGetUserMedia;
        RTCPeerConnection = webkitRTCPeerConnection;
    }   // Firefox
    else if(navigator.mozGetUserMedia) {
        //getUserMedia = mozGetUserMedia;
        RTCPeerConnection = mozRTCPeerConnection;
        RTCSessionDescription = mozRTCSessionDescription;
        RTCIceCandidate = mozRTCIceCandidate;
    } else
        return false;
    return true;    
}

//still only for datachannel

//var rtcConnections = [];

function SmartRTC(sendDataCallback) {
    
    var self = this;
    
    // This is an optional configuration string associated with NAT traversal setup
    var pcConfig = { iceServers: [ { url: 'stun:stun.l.google.com:19302' } ] };       

    // JavaScript variable associated with proper configuration of an RTCPeerConnection object: use DTLS/SRTP to criptograph data
    var pcConstraints = { optional: [ { DtlsSrtpKeyAgreement: true } ] };
    
    //must create an idle client to sign info when they arrive
    
    var peerConnections = [];  
    //array to store stabilishing webrtc connections, once it is stabilished, it is dicarded from this array 
    //(or not cause two connections to the same peer would be possible)
    
    this.OnConnection;  //everything will fall here, once a connection is stabilished in both sides
    
    this.NewConnection = function(remoteId) {
        
        if(peerConnections[remoteId])
            return false;        
    
        var peerConnection = new RTCPeerConnection(pcConfig, pcConstraints);
        //log("Created local peer connection object, with Data Channel");
        peerConnections[remoteId] = peerConnection;
        
        //Creates dataChannel to communicate
        var dataChannel = peerConnection.createDataChannel("dataChannel", { reliable: true });
        
        dataChannel.onopen = function() {
            //verify if keep the peerConnection ref is needed, if so, where to keep it
            //on dataChannel ready, pass its reference to the onConnection event callback
                
            dataChannel.onopen = null;  //clears the onopen event sign (check if it is trully needed)
                
            self.OnConnection(remoteId, dataChannel);
        };
        
        peerConnection.onicecandidate = function(event) {   //on get ice candidates, 
            sendDataCallback(remoteId, event.candidate); 
        };
        
        //create session descriptor offer and start gathering ice candidates
        peerConnection.createOffer(function(localDesc) {                    
            peerConnection.setLocalDescription(localDesc, function() {
                //must check about the sdp hack to acelerate data speed        
                sendDataCallback(remoteId, localDesc);
                console.log("Local peer sucessfully created.");
            },onSignalingError);
        }, onSignalingError);
        
    };
    
    this.HandleData = function(senderId, data) {

        //if not valid data, return (null candidate comes when the peer is done with candidates)
        if(!data) return;   
        
        if(data.sdp) { //Its a session descriptor
            
            if(data.type == "offer") {
                
                if(peerConnections[senderId]) {
                    //Got to verify whether this connection is currently active instead of verify whether it exists only
                    //verify better implementation
                    console.log("Connection to this id already stabilished.");
                    return;
                }
                
                var peerConnection = new RTCPeerConnection(pcConfig, pcConstraints);

                peerConnections[senderId] = peerConnection;
                
                peerConnection.onicecandidate = function(event) {   //on get ice candidates, 
                    sendDataCallback(senderId, event.candidate); 
                };
                
                peerConnection.ondatachannel = function(event) {
                    //log('Receive Channel Callback: event --> ' + event);
                    // Retrieve channel information
                    var dataChannel = event.channel;
                    dataChannel.onopen = function() { 
                        //verify if keep the peerConnection ref is needed, if so, where to keep it
                        //on dataChannel ready, pass its reference to the onConnection event callback          
                        dataChannel.onopen = null;  //clears the onopen event sign (check if it is trully needed)
                        self.OnConnection(senderId, dataChannel);
                    };
                };
                
                peerConnection.setRemoteDescription(new RTCSessionDescription(data));
            
                peerConnection.createAnswer(function(localDesc) {
                    peerConnection.setLocalDescription(localDesc, function() {
                        sendPeerData(senderId, localDesc);
                        console.log("Local peer sucessfully created.");
                    }, onSignalingError);
                }, onSignalingError);            
                
            } else if(data.type == "answer") {
                
                //on conn accepted, set the remote descriptor
                peerConnections[senderId].setRemoteDescription(new RTCSessionDescription(data), function() {
                    console.log("Remote descriptor accepted.");    
                }, onSignalingError);
                
            } else
                console.log("Bad SDP data received.");

        } else if(data.candidate) { //Its an ice candidate
                
            peerConnections[senderId].addIceCandidate(new RTCIceCandidate(data), function() {
                console.log("Ice candidate accepted.");    
            }, onSignalingError);
            
        } else
            console.log("Bad RTC data received.");  
    };
    
    function onSignalingError(error) {
        console.log('Failed to create signaling message : ' + error.name);
    }
}




