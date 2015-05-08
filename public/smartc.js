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

//still only for datachannel

var rtcConnections = [];

function SmartRTC(sendDataCallback) {
    
    var self = this;
    
    //var rtcConns = [];  //array to store stabilishing webrtc connections, once it is stabilished, it is dicarded from this array (or not cause two connections to the same peer would be possible)
    
    this.NewConnection = function(remoteId) {
        //this will return nothing for a while  
        if(rtcConnections[remoteId])
            return false;        
        
        try {
            var newRtcConn = new RTCDataChannel(null);    
            
            newRtcConn.onOfferReady = function(sdpOffer) {
                sendDataCallback(remoteId,{
                    type: "connRequest",
                    sdpOffer: hackSDP(sdpOffer)
                });
            };
            
            newRtcConn.onIceCandidate = function(candidate) {     
                sendDataCallback(remoteId,{
                    type: "iceCand",
                    candidate: candidate
                }); 
            };   
            
            newRtcConn.createOffer();
    
            rtcConnections[remoteId] = newRtcConn;
            //return newRtcConn;
            return true;
            
        } catch(e) {
            if(rtcConnections[remoteId])
                rtcConnections[remoteId] = null;
            return false; 
        }
    };
    
    this.OnConnection = function(id, dataChannel) {
        //everything will fall here, once a connection is stabilished in both sides
        
    };
    
    this.HandleData = function(senderId, data) {

        switch(data.type) {           
            case "connRequest":         
                if(rtcConnections[senderId]) {
                    //Got to verify whether this connection is currently active instead of verify whether it exists only
                    break;
                }
                
                log(data.sdpOffer);
                rtcConnections[senderId] = new RTCDataChannel(data.sdpOffer);
                rtcConnections[senderId].onAnswerReady = function(sdpAnswer) {
                    sendPeerData(senderId, {
                        type: "connAccepted",
                        sdpAnswer: hackSDP(sdpAnswer)
                    });
                };
                
                rtcConnections[senderId].onChannelOpen = function() {
                    log("CHANNEL OPENED");
                    /*if(senderId == hostId) {
                        //putPanelMsg("Session joined. You are not the host.","keepLine");
                        if(!newHostFlag) {
                            putPanelMsg("Session joined.","keepLine");
                            putPanelMsg("");
                            stopFlashMsgIco();
                            msgIco.style.opacity = "0.5";
                        }
                        else
                            newHostFlag = false;
                    focusPanel();
                    clearScreen();
                    //sendRTCData(hostId, 8, "");
                    SendRTCData(hostId, 8);
                    } else {
                        //putPanelMsg("You got a new connection.");
                    }
                            
                    rtcConnections[senderId].onChannelClose = function() {
                        if(senderId == hostId) {
                            electNewHost();
                            //if the host disconnect, for a while block the page
                            //log("The session host has disconnected, the page is now stoped");                      
                        }
                        delete rtcConnections[senderId];
                        log(lengthOf(rtcConnections));
                        log("RTC ID: " + senderId + " has disconnected.");
                        //putPanelMsg("Remote connection closed.");
                                

                    };
                    
                    rtcConnections[senderId].onMessage = function(data) {
                        handleData(senderId, data);       
                    };
                */
                };
                                 
                rtcConnections[senderId].onIceCandidate = function(candidate) {
                    sendPeerData(senderId, {
                        type: "iceCand",
                        candidate: candidate
                    });
                };
        
                rtcConnections[senderId].createAnswer();
                //rtcConnections[senderId].onChannelClose = function(){log("CHANNEL CLOSED");};
                break;
            
              
            case "iceCand":
                log(data.candidate);
                rtcConnections[senderId].addIceCandidate(data.candidate);
                break;

            case "connAccepted":
                log(data.sdpAnswer);
                rtcConnections[senderId].setRemoteDescription(data.sdpAnswer);
                rtcConnections[senderId].onChannelOpen = function() {
                    log("CHANNEL OPENED");
                   /* 
                    if(senderId == hostId) {
                    //putPanelMsg("Session joined. You are not the host.","keepLine");
                        if(!newHostFlag) {
                            putPanelMsg("Session joined.","keepLine");
                            putPanelMsg("");
                            stopFlashMsgIco();
                            msgIco.style.opacity = "0.5";
                        }
                        else
                            newHostFlag = false;
                                
                        focusPanel();
                        clearScreen();
                        //sendRTCData(hostId, 8, "");
                        SendRTCData(hostId, 8);
                    } else {
                        //putPanelMsg("You got a new connection!");
                    }
                            
                    rtcConnections[senderId].onChannelClose = function() {
                        if(senderId == hostId){
                            electNewHost();
                            
                            //if the host disconnect, for a while block the page
                            //log("The session host has disconnected, the page is now stoped");

                        }
                        delete rtcConnections[senderId];
                        log(lengthOf(rtcConnections));
                        log("RTC ID: " + senderId + " has disconnected.");
                        //putPanelMsg("Remote connection closed.");
                                
                    };
                    
                    rtcConnections[senderId].onMessage = function(data) {
                        handleData(senderId, data);    
                    };
                */
                };
                //rtcConnections[senderId].onChannelClose = function(){log("CHANNEL CLOSED");};
                break;
                
            default:
                log("Data not handled. ID: " + senderId + " Data: " + data);
          
        }    
  
        
    };   
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
            peerConnection.addIceCandidate(new RTCIceCandidate(candidate), function(){}, function(){});
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
        peerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc), function(){}, function(){});
        
        this.onAnswerReady;  
        
        this.createAnswer = function() {
            
            peerConnection.createAnswer(function(localDesc) {
                //log(localDesc);
                peerConnection.setLocalDescription(localDesc, function(){}, function(){});
                
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
                peerConnection.setLocalDescription(localDesc, function(){}, function(){});
                
                self.onOfferReady(localDesc);
                
                //log("Offer sucessfully created and ready.");
            }, onSignalingError);

        };
        
        this.setRemoteDescription = function(remoteDesc) {
            peerConnection.setRemoteDescription(new RTCSessionDescription(remoteDesc), function(ARG){
            
                log("REMOTE SETED");
                log(ARG);
            }, function(){});
            
            sdpReady = true;
            
            while(iceCandidates.length)
                self.onIceCandidate(iceCandidates.pop());
        };
    }
    
    
    function onSignalingError(error) {
        console.log('Failed to create signaling message : ' + error.name);
    }
}





function hackSDP(sdp) {
/*    var split = sdp.split("b=AS:30");
    if(split.length > 1)
        var newSDP = split[0] + "b=AS:1638400" + split[1];
    else
        newSDP = sdp;
        return newSDP;*/
    
    return sdp;
}

function SendRTCData(destId, dataCode, data) {
    if(!rtcConnections[destId] || !rtcConnections[destId].readyState()){
       
        //verify if the channel is available to send message
        return false;   //if not, return false
    }
    
    if(dataCode && data)
        rtcConnections[destId].sendData(getDataStr({
            code: dataCode,
            data: data
        }));
    else if(dataCode)
        rtcConnections[destId].sendData(getDataStr({
            code: dataCode
        }));
    else if(data)
        rtcConnections[destId].sendData(getDataStr({
            data: data
        }));
    else
        return false;
    
    return true;
}

function requestConnection(remoteId) {
    var newRtcConn = new RTCDataChannel(null);
            
    rtcConnections[remoteId] = newRtcConn;
            
    newRtcConn.onOfferReady = function(sdpOffer) {
        sendPeerData(remoteId,{
            type: "connRequest",
            sdpOffer: hackSDP(sdpOffer)
        });
    };
            
    newRtcConn.onIceCandidate = function(candidate) {     
        sendPeerData(remoteId,{
            type: "iceCand",
            candidate: candidate
        });
    };
            
    newRtcConn.createOffer();
    
    return newRtcConn;
}







