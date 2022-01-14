const classInvisible = 'noVisible';
const classVisible = 'visible';

var params = {
    0 : [false, false],
    1 : [false, true],
    2 : [false, true],
    3 : [false, false],
    4 : [false, false],
    5 : [true, true],
    10 : [true, false],
    11 : [true, true],
    12 : [true, true],
    13 : [true, true],
    14 : [true, true]
}

var textures = {
    0 : false,
    1 : false,
    2 : false,
    3 : false,
    4 : false,
    5 : true,
    10 : false,
    11 : false,
    12 : false,
    13 : false,
    14 : true
}

function updateUI(mode){
    var paramsMode = params[mode]
    var textureMode = textures[mode]
    //console.log(mode);
    //console.log(textureMode);

    var fieldsets = document.getElementsByTagName("fieldset");

    for(var i = 0 ; i < fieldsets.length ; i++) {
        fieldsets[i].style.display = "block"
    }

    var divTextures = document.getElementById('divTextures'); 
    var divSigma = document.getElementById('divSigma'); 
    var divNi = document.getElementById('divNi'); 

    if (textureMode){
        divTextures.style.display = "block"
    }else{
        divTextures.style.display = "none"
    }

    if (paramsMode[0]){
        divSigma.style.display = "block"
    }else{
        divSigma.style.display = "none"
    }

    if (paramsMode[1]){
        divNi.style.display = "block"
    }else{
        divNi.style.display = "none"
    }
    
}


function showDiv(divName){
    divSelected = document.getElementById(divName);
    
    if (divSelected.className == classInvisible){
        divSelected.className = classVisible;
    } else {
        divSelected.className = classInvisible;
    }


    console.log();
}

// Affiche ou cache l'ensemble des div du menu.
function showAll(){
    elts = ['divMaterialParam' , 'divRenderParam' , 'divSceneParam'] ; 
    
    if (document.getElementById('switch').checked == true){
        newClassName = classVisible;
    } else {
        newClassName = classInvisible;
    }

    elts.forEach(element => {
        divSelected = document.getElementById(element)
        divSelected.className = newClassName;
    });
}
