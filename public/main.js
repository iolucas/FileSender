"use strict"; //ensure exception rise in case of bad pratices use

var username = "",  //var to store instance username
    sessionAddr = window.location.pathname.substr(1),   //Get sessionAddress from the address bar 
    deviceType = isMobile() ? "mobile":"pc",    //Get deviceType    

    rtcManager,
    
    wSocket, //Instance to have real time connection with the server

    isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,  //verify whether the browser is firefox or other (chrome)

    devices = [],   //array to store devices

    dcOpenCallback = []; //datachannel open callback queue to be executed

           
window.onload = function() {              
    //Check compatibility, if not, return and inform
    if(!CheckCompatibility()) {
        alert("This browser is not compatible");    
        return;
    }               
    username = getCookie("username");   //Get username cookie, if not, request one               
    if(username != "")  //if it does exists, 
        main();   //starts the application with the username speficified, session and deviceType
    else    //if not,
        document.getElementById("welcome").style.display = "table";  //display the screen to insert a username
};
             
function setUserAndStart() {              
    if(!document.getElementById("terms").checked)   //if the terms are not checked, return
        return;                
    var textValue = document.getElementById("userInput").value; //get the typed text               
    if(textValue == "") //if it is empty, return
        return;              
    setCookie("username", textValue, 1);    //set username cookie with the textvalue                  
    username = textValue;   //set the username with the textvalue              
    document.getElementById("welcome").style.display = "none";  //hide welcome screen               
    main();   //starts the application with the username speficified, session and deviceType
}   



//--------------  MAIN FUNCTION TO BE EXECUTED TO START EVERYTHING  --------------//

function main() {
    
    //Set user info in the top of the screen
    SetLocalUser(username, sessionAddr, deviceType);
    
    //gets websocket server url
    var wsUrl = document.URL.substring(7, document.URL.lastIndexOf("/"));
    
    wSocket = new Wocket(); //create new wocket instance
    
    rtcManager = new SmartRTC(function(id, data) {
        wSocket.emit("peerData", id, data); //callback to be use to send signaling data
    });
    
    rtcManager.OnConnection = OnDataChannelConnection;  //callback to be used when a dataChannel is stabilished

    wSocket.on("error", function() {
        alert("Socket Error");     
    });
    
    wSocket.on("connected", function() {
        
        wSocket.on("joinError", function(session) {
            ShowMessage("Error: The session '" + session + "' no longer exists. Please try again.", "#a00");
            wSocket.close();    //then, close the connection   
        });
        
        wSocket.on("sessionJoined", function(session) {
            
            if(session != sessionAddr) {  //if session joined is different from the local one
                ShowMessage("Error: An error ocurred while joining session: '" + session, "#a00");
                wSocket.close();    //then, close the connection
                return; //and return
            }

            /*  LATER WE TURN THIS ON    
            window.onbeforeunload = function() {
                if(lengthOf(rtcConnections))
                return "Hey, your session is still active!";       
            }*/           

            ShowTempMessage("Conectado!", 3000);
        });
        
        wSocket.on("NewDevice", function(dId, dName, dOrigin, dType) {
            if(devices[dId])    //if this device exists, 
                return; //do nothing and returns
            
            ShowTempMessage("Novo dispositivo!", 3000);
            
            //creates new object for the arrived device and put the device obj in the devices array  
            devices[dId] = new Device(dId, dName, dOrigin, dType);
        });       
        
        wSocket.emit("joinSession", localIp, sessionAddr, username, deviceType);
    });
    
    wSocket.on("peerDataError", function(destId, data) {
        ShowTempMessage("Error: Peer data sent error =(", 5000, "#f00");    
    });
    
    wSocket.on("peerClosure", function(closedId) {
        if(!devices[closedId])  //checks if the id is not present on this instance
            return; //if so, return and do nothing 
        
        ShowTempMessage(devices[closedId].name + " has disconnected.", 3000, "#f00");
    
        devices[closedId].Delete(); //execute sequences to delete this device
        
        delete devices[closedId];   //deletes the device reference from the devices array
        
 
        /*if(rtcConnections[closeId]) //check if this peer got any connection with the host
            rtcConnections[closeId].close();  //if so close it
                
        for(var fileId in RemoteFiles) {    //iterate thru all the disconnected client files
            if(RemoteFiles[fileId].FileOwnerId == closeId) {   //check if the file belongs to the connection
                DeleteRemoteFile(fileId);
                        
                if(currDownload && currDownload.id == fileId)
                    currDownload.CancelDownload();
                else
                    DeleteIcon(fileId); //remove the file icon
            }
        }*/
    });
    

    //CHANGE FOR DEVICE DATA
    wSocket.on("peerData", function(senderId, data) {
        log(data);
        rtcManager.HandleData(senderId, data);    
    });
    

    //All set, connect websocket
    ShowMessage("Conectando...");
    wSocket.connect("ws://" + wsUrl);
}

function OnDataChannelConnection(id, dataChannel) {
    if(!devices[id]) {   //if this device id does not exists
        dataChannel.close();    //close it
        log("Error: This device does not exists");
        return;
    } else if(devices[id].dataChannel) {   //if its connection is already stabilished
        dataChannel.close();    //close it
        log("Error: Connection to this host already stabilished.");
        return;
    }
    
    devices[id].dataChannel = dataChannel; //put this data channel ref in the channels array
    
    log("New DataChannel Opened.");
        
    dataChannel.on("error", function(err) {
        log(err);    
    });
        
    dataChannel.on("ArrayBuffer", function(data) {
        log("ArrayBuffer received");    
    });
        
    dataChannel.on("Blob", function(data) {
        log("Blob received");    
    });
        
    dataChannel.on("close", function() {
        if(!devices[id] || !devices[id].dataChannel) {   //if this connection id already exists
            log("Error: Data channel closed is not listed.");
            return;
        }
        
        //Close everything related to dataChannel here
        delete devices[id].dataChannel;    //delete datachannel ref from this array
        log("DataChannel closed.");
    });
    
    dataChannel.on("NewDownload", function(fileId) {
        var fileInfo = getFileInfo(fileId);
        
        ShowPopup(devices[id], "Quer te enviar o arquivo:", fileInfo, "Aceitar", "Recusar", function() {
        //Accept callback    
            
        }, function() {
            //Refuse callback    
            dataChannel.emit("DownloadRefused", fileId);
        });
        
    });
    
    dataChannel.on("DownloadRefused", function(fileId) {
        if(devices[id]) {
            devices[id].CancelUpload(false);
            ShowTempMessage(devices[id].name + " recusou o arquivo.", 5000, "#f00");   
        }          
    });

    
    if(dcOpenCallback[id]) { //if there is some callback in dcOpenQueue for this id       
        dcOpenCallback[id]();  //execute the callback        
        delete dcOpenCallback[id]; //delete this id queue on finished        
    }
}

function CheckCompatibility() {
    return isRTCReady() && isFileAPIReady();
    //must check whether websocket is available, despite something have webrtc and dont have websocket isn't very possible
}

/*
function checkCompatibilityAndStart(sessionId, user) {
    
    if (!isRTCReady()) {
        //in the final version, only say that the browser doesn't support the system
        putScreenMsg("The WebRTC APIs are not fully supported in this browser. =/");
        //putScreenMsg("Unfortunatelly qeek.me is not supported in this browser. =/");
        //putScreenMsg("Use the last versions of Chrome or Firefox");
        return;       
    } 
    
    if(!isFileAPIReady()) {
        putScreenMsg("The File APIs are not fully supported in this browser. =/");
        //putScreenMsg("Unfortunatelly qeek.me is not supported in this browser. =/");
        //putScreenMsg("Use the last versions of Chrome or Firefox");
        return;
    }
    
    if(!window.requestFileSystem) {
        putScreenMsg("The File System are not fully supported in this browser. =/");
        //putScreenMsg("Unfortunatelly qeek.me is not supported in this browser. =/");
        //putScreenMsg("Use the last versions of Chrome or Firefox");
        return;
    } else {
        window.requestFileSystem(window.TEMPORARY, 1, function(fs) { //try to request a filesystem to verify its availability
            main(sessionId, user);  //Ok, the browser support all we need
        }, function(err) {
            putScreenMsg("The File System are not able to run on private mode. =/");
        });
    }
}
*/

function Device(id, name, origin, type) {
    
    var self = this;
    
    this.id = id;
    this.name = name;   
    this.origin = origin = (origin == "local") ? "Dispositivo Local" : "Dispositivo de Sessão";
    this.type = type;
    
    this.dataChannel;   //var to store device dataChannel reference
    this.localFile;     //var to store local file reference
    this.remoteFile;    //var to store remote file reference
    
    //creates a new device icon
    this.icon = new DeviceIcon(name, origin, type, function(icon, file) {
        //FileUpload Callback
                
        if(self.localFile)  //if some local file is already stabilished,    
            return; //do nothing and return
                
        var fileId = getFileId(file),   //get the file id
            localFile = new LocalFile(fileId, file);   //create a new local file instance
        
        self.localFile = localFile; //put this local file ref in the device ref
                
        localFile.onChunkRead = function(chunkData, destId) {
            //Send Chunk Data
            if(self.dataChannel)     //verify if the channel is available
                self.dataChannel.sendRaw(chunkData);
                    
            chunkData = null; //clear chunk data ref
        };
                
        icon.setUploadProgress(0, file.size);
        icon.setUploadName(file.name);
                
        if(self.dataChannel) {  //check if this device connection already exists,
            self.dataChannel.emit("NewDownload", fileId);
            icon.setUploadState("Aguardando...");    
                    
        } else {    //if not,  
            icon.setUploadState("Conectando...");
            rtcManager.NewConnection(id);  //create new connection to this id 
            dcOpenCallback[id] = function() {
                self.dataChannel.emit("NewDownload", fileId);
                icon.setUploadState("Aguardando..."); 
            }
        }
                
        icon.showUpload();
                
    }, function(){
        //File Download Hold callback
    }, function(){
        //File Upload hold callback
    });
    
    this.CancelDownload = function(sendCancelMsg) {
        
        
    };
    
    this.CancelUpload = function(sendCancelMsg) {
        self.icon.hideUpload();   //hide the upload interface
        if(self.localFile) {
            self.localFile.handler = null;   //clear the local file handler
            delete self.localFile;   //delete local file reference
            
            if(sendCancelMsg && self.dataChannel)
                self.dataChannel.emit("CancelUpload");    
        }
    };
    
    this.Delete = function() {
        //Close the correspondent icon
        self.icon.DeleteDevice();
        
        self.CancelDownload();
        self.CancelUpload();
          
        if(self.dataChannel)  //if this data channel id is active,
            self.dataChannel.close(); //close it
    }
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

/*function SendChunkData(destId, chunkData) {
    if(!rtcConnections[destId] || !rtcConnections[destId].readyState())     //verify if the channel is available to send message
        return false;   //if not, return false
    rtcConnections[destId].sendData(chunkData);
    return true;
}*/

function handleData(senderId, recData) {
    if(recData.byteLength) {  //check if this is a file chunk (check a ArrayBuffer member)
        if(RemoteFiles[currDownload.id].FileOwnerId == senderId) { //if so, check if the sender id is the owner of the file being downloaded
            currDownload.setFileChunk(recData); //if so, set the file chunk
            if(currDownload) {  //if the still isn't complete, update its info
                var percent = currDownload.getProgress();   //the the percentage value of the progress
                Icons[currDownload.id].ChangeLoadPct(percent);   //change the load bar of the receiving file  
                Icons[currDownload.id].ChangeIconMsg("Downloading... " + percent + "%");    //change the load msg of the receving file
            }
        }
        return; //than, return
        
    } else if(typeof recData == "object" && !recData.code) { //blob to be converted
        var fileReader = new FileReader();
        fileReader.onload = function() {
            handleData(senderId, this.result);
        };
        fileReader.readAsArrayBuffer(recData);
        return; 
    }

    /*----Messages Codes----//
        
    5-> General Broadcast   
    10-> Text Message 
    11-> Other
    
    //---------------------*/
    
    if(recData.code)    //if the received data is already "objtified"
        var recDataObj = recData;   //keep it this way
    else    //otherwise
        var recDataObj = getDataObj(recData);   //objtifie it
    
    var dataCode = recDataObj.code;
    
    switch(dataCode) {    //checks the code of the data packet
            
        case 5: //code signalizing this should be broadcast to all connections
            if(hostId)  //if got any host id, that mean that the connection is not the host and must not be able to broadcast
                break;
            
            broadcastData(senderId, recDataObj.data.code, recDataObj.data.data);   //broadcast msg for all connections
            handleData(senderId, recDataObj.data); //handle the packet on host connection 
            
            break;
            
        case 8: //code requesting update for all files opened
            if(hostId)
                break;
            
            for(fileId in LocalFiles)
                SendRTCData(senderId, 30, { fileId: fileId, owner: username }); //send the file for the connection
            
            for(fileId in RemoteFiles)
                SendRTCData(senderId, 30, { fileId: fileId, owner: RemoteFiles[fileId].FileOwnerName }); //send the file for the connection
            
            break;
            
        case 10:    //code for basic text msg
            putPanelMsg(recDataObj.data);
            break;
            
        case 30:    //code for data available
            log(recDataObj);
            var fileId = recDataObj.data.fileId;
            var fileOwner = recDataObj.data.owner;
            var fileInfo = getFileInfo(fileId);
            var newRemoteFile = CreateRemoteFile(fileId, fileInfo[0], fileInfo[1], fileOwner); //create a file register with the received file data
            
            if(!newRemoteFile)  //if the file already exists, return
                return;
                
            var newIcon = CreateIcon(fileId, newRemoteFile.name, newRemoteFile.type, newRemoteFile.size, "Click for download the file", fileOwner);
    
            newIcon.onClick = function() {
                
                if(newRemoteFile.downloaded)    //if the file has already been downloaded, return
                    return;
        
                var requestDownload = function() {                           
                    RequestDownload(fileId);
                }
                    
                if(!rtcConnections[newRemoteFile.FileOwnerId]) { //if it is not connected to the remote host, connect it
            
                    var newRtcConn = requestConnection(newRemoteFile.FileOwnerId);
                        newRtcConn.onChannelOpen += function() {
                        //requestDownload();          //not working =\  
                            //alert("oieee");
                    };       
 
                }
                else {  //alert("already got connection");
                    requestDownload();    
                }
            };

            break;
            
        case 31:    //code for data available
            
            var fileId = recDataObj.data;
            
            DeleteRemoteFile(fileId); //remove a file register with the just received file data           

            if(currDownload && currDownload.id == fileId)
                currDownload.CancelDownload();
            else
                DeleteIcon(fileId); //remove the file icon
            break;
            
        case 40: //code for request file for download
            
            var fileId = recDataObj.data;
            
            if(LocalFiles[fileId])    //check if the file exists
                SendRTCData(senderId, 41, fileId);    //accepts downloads request
            else
                SendRTCData(senderId, 42, fileId);    //if the file were not found refuse the download
            break;
            
        case 42: //code for download refused
            //alert("download of " + encode(decData) + " has been refused.");
            var fileId = recDataObj.data;
            RefuseDownload(fileId);

            //alert("download of " + fileId + " has been refused.");
            
            break;
            
        case 44: //request chunks
            
            var fileId = recDataObj.data.fileId,
                chunkPointer = recDataObj.data.chunkPointer;
            
            if(LocalFiles[fileId]){
                for(var i = 0; i < chunksPerAck;i++)
                    LocalFiles[fileId].readChunk(chunkPointer + i, senderId);    
            }
            
            break;
            
        case 80:
            var closeId = recDataObj.data;
                
                if(rtcConnections[closeId]) //check if this peer got any connection with the host
                    rtcConnections[closeId].close();  //if so close it
                
                for(var fileId in RemoteFiles) {    //iterate thru all the disconnected client files
                    if(RemoteFiles[fileId].FileOwnerId == closeId) {   //check if the file belongs to the connection
                        DeleteRemoteFile(fileId);          
                        if(currDownload && currDownload.id == fileId)
                            currDownload.CancelDownload();
                        else
                            DeleteIcon(fileId); //remove the file icon
                    }
                }
            break;
            
        default:
            log("ERROR: Not handled data. ID: " + senderId);
            log("Object: " + recData);         
    }
}








function encode(dataArray) {   
    var result = "";    
    for(var i=0;i<dataArray.length;i++)
        result += String.fromCharCode(dataArray[i]);  
    return result;
}

function decode(dataString) {
    var dataArray = [];
    for(var i=0;i<dataString.length;i++)
        dataArray.push(dataString.charCodeAt(i));
    return dataArray;
}
  

function log(message) {
    console.log(message);
}

function getDataStr(dataObj) {
    return JSON.stringify(dataObj);
}

function getDataObj(dataStr) {
    return JSON.parse(dataStr);
}


