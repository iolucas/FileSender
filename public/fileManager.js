var DeletationArray = [];

var chunkSize = 16000;  //if we use more than 16kb files get corrupted on fire fox
var chunksPerAck = 16;

/*document.getElementById("files").addEventListener("change", function(event) {
    var files = event.target.files; // get the files selected in the input file

    for (var i = 0; i < files.length; i++) {  //iterate thru the selected elements
        //add each one of them to the local file colletion and create icons for them
        
        var fileId = getFileId(files[i], myConnId),      
            newLocalFile = CreateLocalFile(fileId, files[i]);
        
        if(!newLocalFile)   //if creation fails, means that a file with this id is already created
            continue;   //proceed to next file
               
        newLocalFile.onChunkRead = function(chunkData, chunkInfo) {
            //SendChunkData(chunkInfo, chunkData);
            chunkData = null;
        };
        
        var newIcon = CreateIcon(fileId, newLocalFile.name, newLocalFile.type, newLocalFile.size, "Hold for delete", username);  

        
        newIcon.onMouseDown = function(caller) {            
            caller.clicked = true;           
            setTimeout(function() {
                if(caller.clicked) {                   
                    if(caller.selected)
                        caller.deselect();
                    else
                        caller.select();
                }
            }, 500);
        };
        
        newIcon.onMouseUp = function(caller) {
            caller.clicked = false;          
        };
        
        newIcon.onSelect = function(caller) {
            caller.ChangeBGColor("rgba(200,0,0,.7)");
            document.getElementById("trashIco").style.display = "inline";
            
            DeletationArray[caller.Icon.getAttribute("id")] = null; //add the file id to the deletation array with a null value only to be listed
            
        };
        
        newIcon.onDeselect = function(caller) {
            caller.ChangeBGColor("rgba(0,0,0,.2)");
            
            delete DeletationArray[caller.Icon.getAttribute("id")]; //clear the file from the deletation array
            
            if(lengthOf(DeletationArray) == 0)
                document.getElementById("trashIco").style.display = "none";
        };
        
        broadcastData(myConnId, 30, { fileId: fileId, owner: username }); //broadcast new file for all the connections
    }
   
    document.getElementById("files").value = "";    //clear input file data to be able load same data if need in the next operation
});*/

function DeleteFiles() {
    for(var fileId in DeletationArray) {
        DeleteLocalFile(fileId);
        DeleteIcon(fileId);   
        broadcastData(myConnId, 31, fileId); //broadcast file remove    
    }
        
    document.getElementById("trashIco").style.display = "none";
}

function isFileAPIReady() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob)
        return true;// Great success! All the File APIs are supported.
    else
        return false;//Create system to work on browsers like that does not support the api
}

var LocalFiles = [];
var RemoteFiles = [];

/*
function CreateLocalFile(fileId, fileHandler) {
    if(LocalFiles[fileId])  //checks whether this id already exists, if so, return null
        return null; 
        
    var newLocalFile = new LocalFile(fileId, fileHandler);   //if not, create a new Local File Object
    LocalFiles[fileId] = newLocalFile;  //assign the new object to the collection id
        
    return newLocalFile;    //if everything were sucessfull, return the file created reference
}*/

/*
function DeleteLocalFile(fileId) {
    if(!LocalFiles[fileId])  //checks whether this id already exists, if not, return false
        return false; 
        
    delete LocalFiles[fileId];    //delete local file from the collection     
        
    return true;    //if everything were sucessfull, return true
}*/

function CreateRemoteFile(fileId, fileObject, fileOwnerId, fileOwnerName) {
    
    if(RemoteFiles[fileId])  //checks whether this id already exists, if so, return null
        return null;        
        
    var newRemoteFile = new RemoteFile(fileId, fileObject, fileOwnerId, fileOwnerName);   //if not, create a new remote File Object
    RemoteFiles[fileId] = newRemoteFile;  //assign the new object to the collection id
        
    return newRemoteFile;    //if everything were sucessfull, return true
}

function DeleteRemoteFile(fileId) {
                          
    if(!RemoteFiles[fileId])  //checks whether this id already exists, if not, return false
        return false; 
        
    delete RemoteFiles[fileId];    //delete remote file from the collection    
        
    return true;    //if everything were sucessfull, return true
}

function LocalFile(fileId, fileHandler) {
    
    var self = this;    //self reference
    
    self.handler = fileHandler; //instance to hold the disk file handler
    
    self.name = fileHandler.name;   //var to hold the file name
    self.size = fileHandler.size;   //var to hold the file size
    self.type = fileHandler.type;   //var to hold the file MIME type
    self.lastModified = fileHandler.lastModified;   //var to hold the file last modified value
    
    self.FileChunkQty = Math.ceil(self.size / chunkSize);   //var to store the amount of chunks this file will have
    
    self.FileId = fileId;   //var to store the file id
    
    self.onChunkRead;   //method to be called once the chunk has been read
    
    self.readChunk = function(chunkNum, chunkInfo) {
        try{
        //checks whether this id already exists, if not, return false
        //checks whether the requested chunk number is not bigget than the file max chunk number, if so return false
        
        if(chunkNum > self.FileChunkQty - 1)  //if request chunk is greater than the maximum chunk number, return false
            return false;

        //open file blob slice with the chunk limits specified
        var fileBlob = self.handler.slice(chunkNum*chunkSize, chunkNum*chunkSize + chunkSize);
        var reader = new FileReader();  //create new file reader instance
        
        reader.onloadend = function(evt) {        //set callback when the fileBlob read is complete 
            if (self.onChunkRead && reader.readyState == FileReader.DONE)
                self.onChunkRead(evt.target.result, chunkInfo);  //fires the chunk read callback once the chunk has been read
        };
        
        //reader.readAsBinaryString(fileBlob);    //async reads the file blob sliced
        //try{
        reader.readAsArrayBuffer(fileBlob);    //async reads the file blob sliced
                    } catch(ex) {log(ex); alert(ex);}
        return true;    //if everything were sucessfull, return true
    };
}

function RemoteFile(fileId, fileObject, fileOwnerId, fileOwnerName) {
    
    var self = this;    //var to hold the reference to this object to be passed to another functions/objects
    
    this.name = fileObject.name;    //var to hold the file name
    this.size = fileObject.size;    //var to hold the file size
    this.type = fileObject.type;    //var to hold the file MIME type
    this.lastModified = fileObject.lastModified;   //var to hold the file last modified value
    
    this.FileOwnerId = fileOwnerId;  //var to hold file owner id
    this.FileOwnerName = fileOwnerName;
    this.FileId = fileId;   //var to store the file id
    
    this.downloaded = false;
}

function getFileId(fileObject) {
    //return [fileObject.name, fileObject.size, fileObject.type, fileObject.lastModified, ownerId].join("*");
    return [fileObject.name, fileObject.size, fileObject.type, fileObject.lastModified].join("*"); 
}

function getFileInfo(fileId) {
    var fileObjArr = fileId.split("*");
    
    return { name: fileObjArr[0], size: fileObjArr[1], type: fileObjArr[2], lastModified: fileObjArr[3] };
    
    /*return [{
        name: fileObjArr[0],
        size: fileObjArr[1],
        type: fileObjArr[2],
        lastModified: fileObjArr[3]
    },fileObjArr[4]];*/
}




