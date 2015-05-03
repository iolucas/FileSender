var Icons = []; //Array to store the icons objects

function CreateIcon(fileId, fileName, fileType, fileSize, iconMessage, fileOwnerName) {    //method to create a icon
    if(Icons[fileId])   //if the id already exists, return null
        return null;
        
    var newIcon = new IconObject(fileId, fileName, fileType, fileSize, iconMessage, fileOwnerName);    //create new icon object
    Icons[fileId] = newIcon;    //store the new icon object in the icons array
        
    document.querySelector("section").appendChild(newIcon.Icon);    //put the icon created in a container to be displayed in the screen
        return newIcon; //return the just created object reference
}

function DeleteIcon(fileId) {   //method to delete a icon
    if(!Icons[fileId])  //if the id do not exists, return false;
        return false;
        
    Icons[fileId].Icon.parentElement.removeChild(Icons[fileId].Icon);   //remove the icon object from its parent to take it out from the screen
        
    delete Icons[fileId];   //delete the icon reference from the icons array
        
    return true;    //return true if everything suceeded
}

function IconObject(fileId, fileName, fileType, fileSize, iconMessage, fileOwnerName) {    //class icon
    
    var self = this;    //var to hold this object ref to be passed to another functions/objects
    
    this.Icon = document.createElement("table");    //create new table to be the main container
    this.Icon.setAttribute("id", fileId);   //set its id as the fileId specified    
    
    var row1 = document.createElement("tr");    //create a new row
    var iconCol = document.createElement("td"); //create a new data
    iconCol.setAttribute("rowspan","3");    //set its rowspan as 3
    iconCol.setAttribute("class","icon");   //set its class as icon    
    var icon = document.createElement("img");   //create new img element img
    icon.src = "img/icon_file.png"; //load the img element with the specified img
    var fileNameCol = document.createElement("td"); //create a new table data
    fileNameCol.setAttribute("class","fileName");   //set its class as fileName
    fileNameCol.setAttribute("colspan","2");    //set its colspan as 2
    fileNameCol.innerHTML = fileName;//.substring(0,50);   //put in the just created data cell the file name
    
    var row2 = document.createElement("tr");    
    var fileTypeCol = document.createElement("td");
    //fileTypeCol.setAttribute("colspan","2");
    fileTypeCol.innerHTML = "Archive " + fileName.substring(fileName.lastIndexOf(".") + 1).toUpperCase();
    var fileOwnerCol = document.createElement("td");
    fileOwnerCol.setAttribute("class", "fileOwnerCol");
    fileOwnerCol.innerHTML = fileOwnerName;
    
    var row3 = document.createElement("tr");
    var fileSizeCol = document.createElement("td");
    fileSizeCol.setAttribute("class", "sizeCol");
    fileSizeCol.innerHTML = getSizeWord(fileSize);
    var iconTxt = document.createElement("td");
    iconTxt.setAttribute("class", "iconTxt");
    iconTxt.innerHTML = iconMessage;
    
    this.Icon.appendChild(row1);
    row1.appendChild(iconCol);
    iconCol.appendChild(icon);
    row1.appendChild(fileNameCol);
    
    row2.appendChild(fileTypeCol);
    row2.appendChild(fileOwnerCol);
    this.Icon.appendChild(row2);
    
    row3.appendChild(fileSizeCol);
    row3.appendChild(iconTxt);
    this.Icon.appendChild(row3);
       
    this.onClick;   //var to store the on click event method
    this.onMouseDown;   //var to store the on mouse down event method
    this.onMouseUp;    //var to store the on mouse up event method
    
    this.Icon.addEventListener("click", function() {  //add the click event listener to the main container      
       if(self.onClick)
           self.onClick(self);        
    });
    
    this.Icon.addEventListener("mousedown", function() {  //add the mousedown event listener to the main container      
       if(self.onMouseDown)
           self.onMouseDown(self);        
    });
    
    this.Icon.addEventListener("mouseup", function() {  //add the mouseup event listener to the main container      
       if(self.onMouseUp)
           self.onMouseUp(self);        
    });
    
    this.ChangeIconMsg = function(message) {    //function to change the icon message
        iconTxt.innerHTML = message;         
    };
    
    this.ChangeLoadPct = function(pctValue) {   //function to change the icon load bar size
        
        if(pctValue < 0)
            pctValue = 0;
        else if(pctValue > 100)
            pctValue = 100;
        
        self.Icon.style.backgroundSize = pctValue + "% 100%";
    };
    
    this.ChangeBGColor = function(color) {
        this.Icon.style.background = color;          
    };
    
    this.selected = false;
    
    this.onSelect;
    this.onDeselect;
    
    this.select = function() {
        this.selected = true;
        if(this.onSelect)
            this.onSelect(self);
    }
    
    this.deselect = function() {
        this.selected = false;
        if(this.onDeselect)
            this.onDeselect(self);
    }
    
    this.clicked = false;
    
}

function getSizeWord(size) {
    var sizeWord = "";
    
    if(size < 1000)
        sizeWord = size + " bytes";
    else if(size < 1000000)
        sizeWord = (size/1024).toFixed(1) + " kB";
    else if(size < 1000000000)
        sizeWord = (size/1048576).toFixed(1) + " MB";
    else //if(size < 1000000000000)
        sizeWord = (size/1073741824).toFixed(1) + " GB";
    
    return sizeWord;
}