var RTCPeerConnection;  //Instance to hold native browser webrtc peer connection API

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
--------------*/



function isRTCReady() {
    // Chrome or Safari
    if (navigator.webkitGetUserMedia)
        RTCPeerConnection = webkitRTCPeerConnection;
        // Firefox
    else if(navigator.mozGetUserMedia) {
        RTCPeerConnection = mozRTCPeerConnection;
        RTCSessionDescription = mozRTCSessionDescription;
        RTCIceCandidate = mozRTCIceCandidate;
    } else
        return false;
    return true;    
}




function RTCDataChannel(remoteDesc) {
   
    var self = this;
    
    // This is an optional configuration string associated with NAT traversal setup
    var servers = {'iceServers': [{'url': 'stun:stun.l.google.com:19302'}]};       

    // JavaScript variable associated with proper configuration of an RTCPeerConnection object: use DTLS/SRTP to criptograph data
    var pc_constraints = {'optional': [{'DtlsSrtpKeyAgreement': true}]};
    
    var peerConnection = new RTCPeerConnection(servers, pc_constraints);
    //log("Created local peer connection object, with Data Channel");  
    
    sdpReady = false;
    
    var iceCandidates = [];
    
    self.onIceCandidate;
    
    var dataChannel;
    
    self.onChannelOpen;
    self.onChannelClose;
    self.onMessage;
    self.onError;   //got to implement this
    
    self.sendData;
    this.readyState;
    
    peerConnection.onicecandidate = function(event) {          
        if(sdpReady)
            self.onIceCandidate(event.candidate);
        else        
            iceCandidates.push(event.candidate);
    };
    
    

    this.addIceCandidate = function(candidate) {
        //log('local ice callback');
        if (candidate) {
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            //log('Local ICE candidate: \n' + candidate);
        }   
    };
    
    if(remoteDesc) {    //check whether this is a initiator or a listener
        peerConnection.ondatachannel = function(event) {
            //log('Receive Channel Callback: event --> ' + event);
            // Retrieve channel information
            dataChannel = event.channel;
            dataChannel.onopen = function() { 
                self.close = function() { dataChannel.close(); };
                self.onChannelOpen(); 
            };
            dataChannel.onclose = function() { if(self.onChannelClose)self.onChannelClose();};
            dataChannel.onmessage = function(event) { self.onMessage(event.data); };
            
            self.sendData = function(data) { dataChannel.send(data); };
            self.readyState = function() { var state = dataChannel.readyState; return state; };           
        };
        peerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc));
        
        this.onAnswerReady;  
        
        this.createAnswer = function() {
            
            peerConnection.createAnswer(function(localDesc) {
                //log(localDesc);
                peerConnection.setLocalDescription(localDesc);
                
                sdpReady = true;
            
                while(iceCandidates.length)
                    self.onIceCandidate(iceCandidates.pop());
                
                self.onAnswerReady(localDesc);
                
                //log("Answer sucessfully created and ready.");
            }, onSignalingError);
        };
        
    } else {
        
        dataChannel = peerConnection.createDataChannel("dataChannel", {reliable: true});
        //log("Data Channel created!");

            dataChannel.onopen = function() {
                self.close = function() { dataChannel.close(); };
                self.onChannelOpen(); 
            };
            dataChannel.onclose = function() { if(self.onChannelClose)self.onChannelClose();};
            dataChannel.onmessage = function(event) { self.onMessage(event.data); };
        
            self.sendData = function(data) { dataChannel.send(data); };
            self.readyState = function() { var state = dataChannel.readyState; return state; };        
        this.onOfferReady;  
        
        this.createOffer = function() {
            
            peerConnection.createOffer(function(localDesc) {                    
                //log(localDesc);
                peerConnection.setLocalDescription(localDesc);
                
                self.onOfferReady(localDesc);
                
                //log("Offer sucessfully created and ready.");
            }, onSignalingError);

        };
        
        this.setRemoteDescription = function(remoteDesc) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc));
            
            sdpReady = true;
            
            while(iceCandidates.length)
                self.onIceCandidate(iceCandidates.pop());
        };
    }
    
    
    function onSignalingError(error) {
        console.log('Failed to create signaling message : ' + error.name);
    }
}


