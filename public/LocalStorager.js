//LocalStorager.js is a wrapper that try to keep data in filesystem but if it is not available it use regular arrays

window.requestFileSystem = window.requestFileSystem ||
                           window.webkitRequestFileSystem;
window.URL = window.URL || window.webkitURL;

function LocalStorager() {
    
    var files = new Object();   //create object to store files reference
    var FILESYSTEM = false;
    
    if(window.requestFileSystem) {
        window.requestFileSystem(window.TEMPORARY, 1, function() { //try to request a filesystem to verify its availability
            //if succeeds in creation, define FILESYSTEM varible, otherwise, use ARRAYBUFFER
            FILESYSTEM = true;    
        });
    }
    
    this.NewFile = function(id, name, size, type, callback) {
        if(FILESYSTEM) {
            window.requestFileSystem(window.TEMPORARY, size, function(fs) { //method to request a filesystem space
                
                //Remove the file from the sandbox if it exists
                fs.root.getFile(name, { create: false }, function(fileEntry) { //try to open the file
                    //if it open sucessfully, 
                    fileEntry.remove(function() { //remove it
                        //file removed, now create new file
                        createNewFile(fs);
                    }, 
                    //error while removing                 
                    errorHandler);       
                }, function(e) {
                //File does not exists
                    createNewFile(fs);
                });
            }, 
            //error while getting filesystem                         
            errorHandler);
        
            function createNewFile(fileSystem) {
                fileSystem.root.getFile(name, { create: true, exclusive: true }, function(newFileEntry) { //try to open the file    
                    //creation sucessfull
                    files[id] = { 
                        name: name, 
                        size: size,
                        type: type,
                        fileEntry: newFileEntry 
                    };
                    
                    if(callback)    //if a callback is signed
                        callback(); //call it
                }, 
                //Error while creating new file                        
                errorHandler);
            }

        } else { //use arrayBuffer
            //simple inits a new object with the name, size and Uint8ClampedArray buffer with the file size
            files[id] = { 
                name: name, 
                size: parseInt(size),
                type: type,
                //buffer: new Uint8ClampedArray(parseInt(size)),
                buffer: [],
                bufPointer: 0
            };
            
            if(callback)    //if a callback is signed
                callback(); //call it
        }
    }
    
    this.AppendFile = function(id, fileData, callback) {
        if(!files[id])
            throw "fileIdNotFound";
        
        if(FILESYSTEM) {
            files[id].fileEntry.createWriter(function(fileWriter) {   //create a writer to write the file chunk into the file   
                fileWriter.seek(fileWriter.length); // Start write position at last position               
                fileWriter.onwriteend = function() {   //to be executed once the write event finishes                   
                    if(callback) //if a callback is passed,
                        //call it with the id and a flag whether this file is completed or not
                        callback(fileWriter.length >= files[id].size);
                };
                fileWriter.onerror = function(e) {
                    alert('Write failed: ' + e.toString());
                };
                // Create a new Blob and write it
                fileWriter.write(new Blob(fileData, { type: files[id].type }));
            }, function(e){
                alert("error1" + e.name + " " + e.message);
            });   
        } else {    //append the ARRAYBUFFER
            for(var i = 0 ; i < fileData.length ; i++) {
                //files[id].buffer.set(new Uint8ClampedArray(fileData[i]), files[id].bufPointer);
                files[id].buffer.push(fileData[i]);
                files[id].bufPointer += fileData[i].byteLength;
            }
            if(callback) //if a callback is passed,
                //call it with the id and a flag whether this file is completed or not
                callback(files[id].bufPointer >= files[id].size);
        }
    }
    
    this.GetFile = function(id, next) {
        if(!files[id])
            throw "fileIdNotFound";    
        if(FILESYSTEM) {
            files[id].fileEntry.file(function(file){
                saveBlobLocally(file, files[id].name);  //create new blob with the fileEntry with the file name
                if(next) next();
            });         
        } else {    //if ARRAYBUFFER
            saveBlobLocally(new Blob(files[id].buffer, { type: files[id].type }), files[id].name);
            if(next) next();
        }
    }
    
    this.DeleteFile = function(id, next) {
        if(!files[id])
            throw "fileIdNotFound";     
        if(FILESYSTEM)
            files[id].fileEntry.remove(function() {   //remove the file in the sandbox
                delete files[id];   //delete this file id index
                if(next) next(); //call the callback
            }, function(e) {
                delete files[id];   //delete this file id index        
                if(next) next(e);//call the callback with the error handler
            });
        else {   //if ARRAYBUFFER, 
            files[id].buffer = null;    //clear the buffer reference
            delete files[id];   //delete this file id index
            if(next) next();
        }
    }
}
                
                
function saveBlobLocally(blob, name) {     //method to locally download the file in browsers memory    
    if (!window.URL && window.webkitURL)
        window.URL = window.webkitURL;
    var a = document.createElement('a');
    a.download = name;
    a.setAttribute('href', window.URL.createObjectURL(blob));
    document.body.appendChild(a); 
    a.click();
    document.body.removeChild(a);   //remove the link child
}
    
function errorHandler(e) {
    var msg = '';

    switch (e.code) {
        case FileError.QUOTA_EXCEEDED_ERR:
            msg = 'QUOTA_EXCEEDED_ERR';
            break;
        case FileError.NOT_FOUND_ERR:
            msg = 'NOT_FOUND_ERR';
            break;
        case FileError.SECURITY_ERR:
            msg = 'SECURITY_ERR';
            break;
        case FileError.INVALID_MODIFICATION_ERR:
            msg = 'INVALID_MODIFICATION_ERR';
            break;
        case FileError.INVALID_STATE_ERR:
            msg = 'INVALID_STATE_ERR';
            break;
        default:
            msg = 'Unknown Error';
        break;
    };    
    console.log('Error: ' + msg);
    alert('Error: ' + msg);
}