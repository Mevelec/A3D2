const classInvisible = 'noVisible';
const classVisible = 'visible';

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
