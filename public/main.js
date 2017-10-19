"use strict"; //ensure exception rise in case of bad pratices use

var username = "",  //var to store instance username
    sessionAddr, //= window.location.pathname.substr(1),   //Get sessionAddress from the address bar 
    deviceType = isMobile() ? "mobile":"pc",    //Get deviceType    
    menuOpened = false,
    rtcManager,
    
    wSocket, //Instance to have real time connection with the server

    isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,  //verify whether the browser is firefox or other (chrome)

    devices = [],   //array to store devices

    dcOpenCallback = []; //datachannel open callback queue to be executed

//window.onload = function() {
function begin(session) {
    
    sessionAddr = session;
    
    username = getCookie("username");   //Get username cookie, if not, request one               
    if(username != "")  //if it does exists, 
        main();   //starts the application with the username speficified, session and deviceType
    else {    //if not,
        DisableScreen();    //dark the default screen
        document.getElementById("welcome").style.display = "table";  //display the screen to insert a username
        document.getElementById("termsBut").addEventListener("click", function(e) {
            e.preventDefault();
            ShowTerms();            
        });
    }
};
             
function setUserAndStart() {              
    if(!document.getElementById("terms").checked)   //if the terms are not checked, return
        return;                
    var textValue = document.getElementById("userInput").value; //get the typed text               
    if(textValue == "") //if it is empty, return
        return;              
    setCookie("username", textValue, 360);    //set username cookie with the textvalue                  
    username = textValue;   //set the username with the textvalue              
    document.getElementById("welcome").style.display = "none";  //hide welcome screen
    EnableScreen(); //put the screen clear again
    main();   //starts the application with the username speficified, session and deviceType
}   



//--------------  MAIN FUNCTION TO BE EXECUTED TO START EVERYTHING  --------------//

function main() {
    //setCookie("username", "", 0); 
    //Set user info in the top of the screen
    SetLocalUser(username, sessionAddr, deviceType);
    
    //Check compatibility, if not, return and inform
    if(!CheckCompatibility()) {
        if(window.ptbr)
            ShowMessage("Ohh, infelizmente esse browser não é compatível com qeek.me =/", "#d00");
        else
            ShowMessage("Ohh, unfortunatelly this browser is not compatible with qeek.me =/", "#d00");
        return;
    } 
    
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
            if(window.ptbr)
                ShowMessage("Erro: A sessão '" + session + "' não existe. Verifique se digitou correto ou <a style='color: #fff' href='http://" + window.location.host + "'>clique aqui</a> para criar uma nova. ", "#a00");
            else
                ShowMessage("Error: The session '" + session + "' doesn't exists. Make sure you typed it correctly or <a style='color: #fff' href='http://" + window.location.host + "'>click here</a> to create a new one. ", "#a00");
            wSocket.close();    //then, close the connection   
        });
        
        wSocket.on("close", function() {
            /*if(window.ptbr)
                ShowMessage("Conexão com o servidor perdida =(");
            else
                ShowMessage("Server connection lost =(", "#800");*/
        });
        
        wSocket.on("isAlive", function() {
            wSocket.emit("ImAlive");  
        });
        
        wSocket.on("sessionJoined", function(session) {
            
            if(session != sessionAddr) {  //if session joined is different from the local one
                if(window.ptbr)
                    ShowMessage("Erro: Um erro ocorreu ao entrar na sessão: '" + session, "#a00");
                else
                    ShowMessage("Error: An error ocurred while joining session: '" + session, "#a00");
                wSocket.close();    //then, close the connection
                return; //and return
            }
 
            window.onbeforeunload = function() {
                if(lengthOf(devices)) {
                    if(window.ptbr)
                        return "Hey, sua sessão ainda está ativa!";
                    else
                        return "Hey, your session is still active!";
                }
            }           
            if(window.ptbr)
                ShowTempMessage("Conectado!", 3000);
            else
                ShowTempMessage("Connected!", 3000);
        });
        
        wSocket.on("NewDevice", function(dId, dName, dOrigin, dType) {
            if(devices[dId])    //if this device exists, 
                return; //do nothing and returns
            if(window.ptbr)
                ShowTempMessage("Novo dispositivo!", 3000);
            else
                ShowTempMessage("New device!", 3000);
            
            //creates new object for the arrived device and put the device obj in the devices array  
            devices[dId] = new Device(dId, dName, dOrigin, dType);
        });       
        
        wSocket.emit("joinSession", localIp, sessionAddr, username, deviceType);
    });
    
    wSocket.on("peerDataError", function(destId, data) {
        if(window.ptbr)
            ShowTempMessage("Erro: Erro ao enviar os dados =(", 5000, "#f00");
        else
            ShowTempMessage("Error: Peer data sent error =(", 5000, "#f00");
    });
    
    wSocket.on("peerClosure", function(closedId) {
        if(!devices[closedId])  //checks if the id is not present on this instance
            return; //if so, return and do nothing 
        
        if(window.ptbr)
            ShowTempMessage(devices[closedId].name + " disconectou.", 3000, "#f00");
        else
            ShowTempMessage(devices[closedId].name + " has disconnected.", 3000, "#f00");
    
        devices[closedId].Delete(); //execute sequences to delete this device
        
        delete devices[closedId];   //deletes the device reference from the devices array
        
    });
    

    //CHANGE FOR DEVICE DATA
    wSocket.on("peerData", function(senderId, data) {
        rtcManager.HandleData(senderId, data);    
    });
    

    //All set, connect websocket
    if(window.ptbr)
        ShowMessage("Conectando...");
    else
        ShowMessage("Connecting...");
    wSocket.connect("ws://" + wsUrl);
    //wSocket.connect("ws://localhost:6001/");
    //wSocket.connect("wss://qeekmeserver2.mybluemix.net/");
}

function OnDataChannelConnection(id, dataChannel) {
    var device = devices[id];
    
    if(!device) {   //if this device id does not exists
        dataChannel.close();    //close it
        log("Error: This device does not exists");
        return;
    } else if(device.dataChannel) {   //if its connection is already stabilished
        dataChannel.close();    //close it
        log("Error: Connection to this host already stabilished.");
        return;
    }
    
    device.dataChannel = dataChannel; //put this data channel ref in the channels array
        
    dataChannel.on("error", function(err) {
        log(err);    
    });
        
    dataChannel.on("ArrayBuffer", function(data) {
        if(device && device.download) {
            device.download.setFileChunk(data); //if so, set the file chunk
            device.icon.setDownloadProgress(device.download.getLen(), device.download.size);
        }
    });
        
    dataChannel.on("Blob", function(data) {
        log("Blob received");  
        var fileReader = new FileReader();
        fileReader.onload = function() {
            
            if(device && device.download) {
                device.download.setFileChunk(this.result); //if so, set the file chunk
                device.icon.setDownloadProgress(device.download.getLen(), device.download.size);
            }
        };
        fileReader.readAsArrayBuffer(data);
        return; 
    });
        
    dataChannel.on("close", function() {
        if(!device || !device.dataChannel) {   //if this connection id already exists
            log("Error: Data channel closed is not listed.");
            return;
        }
        
        if(device.download) {
            device.CancelDownload(false);
            if(window.ptbr)
                ShowTempMessage("Download cancelado.", 4000, "#f00");
            else
                ShowTempMessage("Download canceled.", 4000, "#f00");
        }
        
        if(device.localFile) {
            device.CancelUpload(false);
            if(window.ptbr)
                ShowTempMessage("Upload cancelado.", 4000, "#f00");
            else
                ShowTempMessage("Upload canceled.", 4000, "#f00");
        }
        
        //Close everything related to dataChannel here
        delete device.dataChannel;    //delete datachannel ref from this array
        log("DataChannel closed.");
    });
    
    dataChannel.on("NewDownload", function(fileId) {
        if(!fileId)
            return;
        
        var fileInfo = getFileInfo(fileId);
        if(window.ptbr) {
            var ack = "Aceitar",
                nack = "Recusar",
                msg = "Quer te enviar o arquivo:",
                state = "Recebendo...",
                complete = "Download completo.",
                canceled = "Download cancelado.";
        } else {
                var ack = "Accept",
                nack = "Refuse",
                msg = "Wants to send you the file:",
                state = "Receiving...",
                complete = "Download complete.",
                canceled = "Download canceled.";
        }
        
        
        ShowPopup(device, msg, fileInfo, ack, nack, function() {
            //Accept callback    
            
            dataChannel.emit("DownloadAccepted", fileId);  
            
            device.icon.setDownloadName(fileInfo.name);
            device.icon.setDownloadProgress(0, fileInfo.size);
            device.icon.setDownloadState(state);
            device.icon.showDownload();
            
            device.download = new DownloadFile(fileId,fileInfo.name, fileInfo.size, fileInfo.type);
            device.download.onChunkRequest = function(fileId, chunkPointer) {
                if(device.dataChannel)
                    device.dataChannel.emit("ChunkReq", fileId, chunkPointer);
            };
            
            device.download.onDownloadComplete = function() { 
                device.icon.hideDownload();
                device.download = null;
                ShowTempMessage(complete, 3000);
            }
            
            device.download.onDownloadCanceled = function() {
                delete device.download;  //clear download instance register
                
                ShowTempMessage(canceled, 4000, "#f00");
            }
    
            device.download.StartRequestChunk();   //start the requesting chunk proceedures 
                
        }, function() {
            //Refuse callback    
            dataChannel.emit("DownloadRefused", fileId);
        });
        
    });
    
    dataChannel.on("DownloadRefused", function(fileId) {
        if(device.localFile) {
            device.CancelUpload(false);
            if(window.ptbr)
                ShowTempMessage(device.name + " recusou o arquivo.", 5000, "#f00");
            else
                ShowTempMessage(device.name + " refused the file.", 5000, "#f00");
        }          
    });
    
    dataChannel.on("DownloadAccepted", function(fileId) {
        if(device.localFile) {
            if(window.ptbr)
                device.icon.setUploadState("Enviando...");
            else
                device.icon.setUploadState("Sending...");
        }
    });
    
    dataChannel.on("ChunkReq", function(fileId, chunkPointer) {
        if(device.localFile) {
            device.localFile.readChunk(chunkPointer);
        }
    });
    
    dataChannel.on("CancelDownload", function() {
        if(device.download) {
            if(window.ptbr)
                ShowTempMessage("Download cancelado.", 4000, "#f00");
            else
                ShowTempMessage("Download canceled.", 4000, "#f00");
            device.CancelDownload(false);
        }
    });
    
    dataChannel.on("CancelUpload", function() {
        if(device.localFile) {
            if(window.ptbr)
                ShowTempMessage("Upload cancelado.", 4000, "#f00");
            else
                ShowTempMessage("Upload canceled.", 4000, "#f00");
            device.CancelUpload(false);
        }
    });

    
    if(dcOpenCallback[id]) { //if there is some callback in dcOpenQueue for this id       
        dcOpenCallback[id]();  //execute the callback        
        delete dcOpenCallback[id]; //delete this id queue on finished        
    }
}

function CheckCompatibility() {
    //return error page
    return isRTCReady() && isFileAPIReady();
    //must check whether websocket is available, despite something have webrtc and dont have websocket isn't very possible
}

function Device(id, name, origin, type) {
    
    var self = this;
    
    this.id = id;
    this.name = name;
    if(window.ptbr)
        this.origin = origin = (origin == "local") ? "Dispositivo Local" : "Dispositivo de Sessão";
    else
        this.origin = origin = (origin == "local") ? "Local Device" : "Session Device";
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
                
        localFile.sent = 0;
        
        localFile.onChunkRead = function(chunkData) {
            //Send Chunk Data
            if(self.dataChannel) {     //verify if the channel is available
                self.dataChannel.sendRaw(chunkData);
                localFile.sent += chunkData.byteLength;
                icon.setUploadProgress(localFile.sent,localFile.size);
                
                if(localFile.sent == localFile.size) {
                    if(window.ptbr)
                        ShowTempMessage("Transferência Completa!", 3000);
                    else
                        ShowTempMessage("Transfer Complete!", 3000);
                    self.CancelUpload(false);
                }
            }
            chunkData = null; //clear chunk data ref
        };
                
        icon.setUploadProgress(0, file.size);
        icon.setUploadName(file.name);
                
        if(self.dataChannel) {  //check if this device connection already exists,
            self.dataChannel.emit("NewDownload", fileId);
            if(window.ptbr)
                icon.setUploadState("Aguardando...");
            else
                icon.setUploadState("Awaiting...");
                    
        } else {    //if not,
            if(window.ptbr)
                icon.setUploadState("Conectando...");
            else
                icon.setUploadState("Connecting...");
            rtcManager.NewConnection(id);  //create new connection to this id 
            dcOpenCallback[id] = function() {
                self.dataChannel.emit("NewDownload", fileId);
            if(window.ptbr)
                icon.setUploadState("Aguardando...");
            else
                icon.setUploadState("Awaiting...");
            }
        }
                
        icon.showUpload();
                
    }, function(){
        //File Download Hold callback
        if(window.ptbr) {
            var dmsg = "Deseja realmente interromper o download do arquivo:",
                yLabel = "Sim",
                nLabel = "Não";  
        } else {
            var dmsg = "Do you really want to stop the download of the file:",
                yLabel = "Yes",
                nLabel = "No";   
        }
        ShowPopup(self, dmsg, self.download, yLabel, nLabel, function() {
            if(window.ptbr)
                ShowTempMessage("Download cancelado.", 4000, "#f00");
            else
                ShowTempMessage("Download canceled.", 4000, "#f00");
            self.CancelDownload(true);
        }, function() {});
    }, function(){
        //File Upload hold callback
        if(window.ptbr) { var umsg = "Deseja realmente interromper o upload do arquivo:",
            yLabel = "Sim",
            nLabel = "Não";  
        } else {
           var umsg = "Do you really want to stop the upload of the file:",
               yLabel = "Yes",
               nLabel = "No";            
        }
        ShowPopup(self, umsg, self.localFile, yLabel, nLabel, function() {
            if(window.ptbr)
                ShowTempMessage("Upload cancelado.", 4000, "#f00");
            else
                ShowTempMessage("Upload canceled.", 4000, "#f00");
            self.CancelUpload(true);
        }, function() {});
    });
    
    this.CancelDownload = function(sendCancelMsg) {
        self.icon.hideDownload();   //hide the upload interface
        if(self.download) {
            self.download.CancelDownload();
            delete self.download;   //delete local file reference
            
            if(sendCancelMsg && self.dataChannel)
                self.dataChannel.emit("CancelUpload");  //inverted cause for the other use its an upload     
        }
        
    };
    
    this.CancelUpload = function(sendCancelMsg) {
        self.icon.hideUpload();   //hide the upload interface
        if(self.localFile) {
            self.localFile.handler = null;   //clear the local file handler
            delete self.localFile;   //delete local file reference
            
            if(sendCancelMsg && self.dataChannel)
                self.dataChannel.emit("CancelDownload");  //inverted cause for the other use its a download  
        }
    };
    
    this.Delete = function() {
        //Close the correspondent icon
        self.icon.DeleteDevice();
        
        self.CancelDownload(true);
        self.CancelUpload(true);
          
        if(self.dataChannel)  //if this data channel id is active,
            self.dataChannel.close(); //close it
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


