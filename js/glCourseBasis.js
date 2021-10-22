
// =====================================================
var gl;

// =====================================================
var mvMatrix = mat4.create();
var pMatrix = mat4.create();
var rotMatrix = mat4.create();
var distCENTER;
// =====================================================

var MATERIAL = null;
var OBJ1 = null;
var PLANE = null;
var CUBEMAP = null;
var LIGHT = null;


// =====================================================
// OBJET holding a material data
// =====================================================
class Material{
	constructor(){
		this.Kd = [1, 1, 1];
		this.sigma = 0.2;
		this.Ni = 1.5;
		this.mode = 0; 
		// Mods :
		//  0 -> default / coock thorence
		//  1 -> reflect only
		//  2 -> refract only
	}

	// --------------------------------------------
	setShadersParams(shader) {
		shader.mKdUniform = gl.getUniformLocation(shader, "u_Kd");
		shader.mSigmaUniform = gl.getUniformLocation(shader, "u_sigma");
		shader.mNiUniform = gl.getUniformLocation(shader, "u_Ni");

		shader.mModeUniform = gl.getUniformLocation(shader, "u_Mode");

		gl.uniform3fv(shader.mKdUniform, this.Kd);
		gl.uniform1f(shader.mSigmaUniform, this.sigma);
		gl.uniform1f(shader.mNiUniform, this.Ni);

		gl.uniform1i(shader.mModeUniform, this.mode);
	}
}

// =====================================================
// OBJET 3D, representant une lumière
// =====================================================
class Light{
	constructor() {
		this.position = [0, 0, 0]
		this.power = 2;
		this.color = [1, 1, 1]
	}

	// --------------------------------------------
	setShadersParams(shader) {

		shader.lPosUniform = gl.getUniformLocation(shader, "u_light_pos");
		shader.lColorUniform = gl.getUniformLocation(shader, "u_light_color");
		shader.lPowUniform = gl.getUniformLocation(shader, "u_light_pow");

		gl.uniform3fv(shader.lPosUniform, this.position);
		gl.uniform3fv(shader.lColorUniform, this.color);
		gl.uniform1f(shader.lPowUniform, this.power);

	}
}

// =====================================================
// OBJET 3D, lecture fichier obj
// =====================================================
class objmesh {

	// --------------------------------------------
	constructor(objFname) {
		this.objName = objFname;
		this.shaderName = 'shaders/obj';
		this.loaded = -1;
		this.shader = null;
		this.mesh = null;
		
		loadObjFile(this);
		loadShaders(this);
	}

	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "aVertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.rsMatrixUniform = gl.getUniformLocation(this.shader, "uRotSkybox");

		LIGHT.setShadersParams(this.shader);
		MATERIAL.setShadersParams(this.shader);

	}
	
	// --------------------------------------------
	setMatrixUniforms() {
		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);
		gl.uniformMatrix4fv(this.shader.rMatrixUniform, false, rotMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(this.shader.rsMatrixUniform, false, CUBEMAP.rotMatrix);
	}
	
	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4 && this.mesh != null) {
			this.setShadersParams();
			this.setMatrixUniforms();

			gl.bindTexture(gl.TEXTURE_CUBE_MAP, CUBEMAP.texture);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	}
}



// =====================================================
// PLAN 3D, Support géométrique
// =====================================================
class plane {
	
	// --------------------------------------------
	constructor() {
		this.shaderName='shaders/plane';
		this.loaded=-1;
		this.shader=null;
		this.initAll();
	}
		
	// --------------------------------------------
	initAll() {
		var size=1.0;
		var vertices = [
			-size, -size, 0.0,
			 size, -size, 0.0,
			 size, size, 0.0,
			-size, size, 0.0
		];

		var texcoords = [
			0.0,0.0,
			0.0,1.0,
			1.0,1.0,
			1.0,0.0
		];

		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 4;

		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = 4;

		loadShaders(this);
	}
	
	
	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTexCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib,this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");

		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);

		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
	}

	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4) {		
			this.setShadersParams();
			
			gl.drawArrays(gl.TRIANGLE_FAN, 0, this.vBuffer.numItems);
			gl.drawArrays(gl.LINE_LOOP, 0, this.vBuffer.numItems);
		}
	}

}

// =====================================================
// PLAN 3D, Support géométrique
// =====================================================
class cubemap {
	
	// --------------------------------------------
	constructor() {
		this.shaderName='shaders/skybox';
		this.loaded=-1;
		this.shader=null;
		this.cubemapName = 'Yokohama'
		this.initAll();
		

		this.rotMatrix = mat4.create();
		mat4.identity(this.rotMatrix);
		mat4.rotate(this.rotMatrix, 1.5708, [1, 0, 0]);
	}
		
	// --------------------------------------------
	onLoadedImage(image){
		this.loaded_images++;

		//wait the 6 images to be loaded

		if(this.loaded_images < 6){

			console.log("1 more loaded");

			return;
		}

		console.log("creating cubmap texture");

		this.texture = gl.createTexture();
		gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
		for (var i = 0; i < 6; i++) {
			gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + i, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.textures_images[i]);
		}

		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_R, gl.CLAMP_TO_EDGE);
	}

	// --------------------------------------------
	initAll() {
		// TEXTURE
		this.textures_images = [];
		var textures_names = [ "posx", "negx", "posy", "negy", "posz", "negz" ];

		this.loaded_images = 0;
		for(var i = 0; i < 6; i++){
			this.textures_images[i] = new Image();
			this.textures_images[i].onload = this.onLoadedImage.bind(this);
			this.textures_images[i].src = "textures_cubemap/" + this.cubemapName + "/"+textures_names[i]+".jpg";
		}

		
		// VERTICES DATA
		var size=25.0;
		var vertices = [
			// bottom
			-size,  size, -size,
			-size, -size, -size,
			 size, -size, -size,
			 size,  size, -size,

			// top
			-size, -size, size,
			 size, -size, size,
			 size,  size, size,
			-size,  size, size,

			//left
			-size, -size,  size,
			-size, -size, -size,
			-size,  size, -size,
			-size,  size,  size,

			//right
			size, -size,  size,
			size,  size,  size,
			size,  size, -size,
			size, -size, -size,

			//front
			-size, size,  size,
			-size, size, -size,
			 size, size, -size,
		     size, size,  size,

			//back
			-size, -size,  size,
			-size, -size, -size,
			 size, -size, -size,
		     size, -size,  size
		];

		var indices = [
			//bottom
			0, 1, 3,
    		1, 2, 3,

			//top
			7, 6, 4,
			6, 5, 4,

			//left
			8, 9, 11, 
			9, 10, 11,

			//right
			12, 13, 15,
			13, 14, 15,

			//front
			16, 17, 19,
			17, 18, 19,

			//back
			23, 22, 20, 
			22, 21, 20

		];

		var texcoords = [
			//bottom
			0.0,0.0,
			0.0,1.0,
			1.0,1.0,
			1.0,0.0,

			//top
			1.0,0.0,
			0.0,1.0,
			0.0,0.0,
			1.0,1.0,

			//left
			0.0,0.0,
			0.0,1.0,
			1.0,1.0,
			1.0,0.0,

			//right
			0.0,0.0,
			0.0,1.0,
			1.0,1.0,
			1.0,0.0,

			//front
			0.0,0.0,
			0.0,1.0,
			1.0,1.0,
			1.0,0.0,

			//back
			0.0,0.0,
			0.0,1.0,
			1.0,1.0,
			1.0,0.0
		];

		this.vBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
		this.vBuffer.itemSize = 3;
		this.vBuffer.numItems = 5;


		this.indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
		this.indexBuffer.itemSize = 1;
		this.indexBuffer.numItems = 3*12;

		this.tBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);
		this.tBuffer.itemSize = 2;
		this.tBuffer.numItems = 4;

		loadShaders(this);
	}
	
	
	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "aVertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "aTexCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib,this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "uRMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "uPMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "uMVMatrix");
		this.shader.rsMatrixUniform = gl.getUniformLocation(this.shader, "uRotSkybox");

		mat4.identity(mvMatrix);
		mat4.translate(mvMatrix, distCENTER);
		mat4.multiply(mvMatrix, rotMatrix);

		gl.uniformMatrix4fv(this.shader.rMatrixUniform, false, rotMatrix);
		gl.uniformMatrix4fv(this.shader.pMatrixUniform, false, pMatrix);
		gl.uniformMatrix4fv(this.shader.mvMatrixUniform, false, mvMatrix);
		gl.uniformMatrix4fv(this.shader.rsMatrixUniform, false, this.rotMatrix);

	}

	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4) {		
			this.setShadersParams();
			
			gl.disable(gl.DEPTH_TEST);
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
			gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.texture);
			gl.drawElements(gl.TRIANGLES, this.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
			gl.enable(gl.DEPTH_TEST);

			//gl.drawArrays(gl.LINE_LOOP, 0, this.vBuffer.numItems);
		}
	}

}


// =====================================================
// FONCTIONS GENERALES, INITIALISATIONS
// =====================================================



// =====================================================
function initGL(canvas)
{
	try {
		gl = canvas.getContext("experimental-webgl");
		gl.viewportWidth = canvas.width;
		gl.viewportHeight = canvas.height;
		gl.viewport(0, 0, canvas.width, canvas.height);

		gl.clearColor(0.7, 0.7, 0.7, 1.0);
		gl.enable(gl.DEPTH_TEST);
		gl.enable(gl.CULL_FACE);
		gl.cullFace(gl.BACK); 
	} catch (e) {}
	if (!gl) {
		console.log("Could not initialise WebGL");
	}
}


// =====================================================
loadObjFile = function(OBJ3D)
{
	var xhttp = new XMLHttpRequest();

	xhttp.onreadystatechange = function() {
		if (xhttp.readyState == 4 && xhttp.status == 200) {
			var tmpMesh = new OBJ.Mesh(xhttp.responseText);
			OBJ.initMeshBuffers(gl,tmpMesh);
			OBJ3D.mesh=tmpMesh;
		}
	}



	xhttp.open("GET", OBJ3D.objName, true);
	xhttp.send();
}

// =====================================================
function loadShaders(Obj3D) {
	loadShaderText(Obj3D,'.vs');
	loadShaderText(Obj3D,'.fs');
}

// =====================================================
function loadShaderText(Obj3D,ext) {   // lecture asynchrone...
  var xhttp = new XMLHttpRequest();
  
  xhttp.onreadystatechange = function() {
	if (xhttp.readyState == 4 && xhttp.status == 200) {
		if(ext=='.vs') { Obj3D.vsTxt = xhttp.responseText; Obj3D.loaded ++; }
		if(ext=='.fs') { Obj3D.fsTxt = xhttp.responseText; Obj3D.loaded ++; }
		if(Obj3D.loaded==2) {
			Obj3D.loaded ++;
			compileShaders(Obj3D);
			Obj3D.loaded ++;
		}
	}
  }
  
  Obj3D.loaded = 0;
  xhttp.open("GET", Obj3D.shaderName+ext, true);
  xhttp.send();
}

// =====================================================
function compileShaders(Obj3D)
{
	Obj3D.vshader = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(Obj3D.vshader, Obj3D.vsTxt);
	gl.compileShader(Obj3D.vshader);
	if (!gl.getShaderParameter(Obj3D.vshader, gl.COMPILE_STATUS)) {
		console.log("Vertex Shader FAILED... "+Obj3D.shaderName+".vs");
		console.log(gl.getShaderInfoLog(Obj3D.vshader));
	}

	Obj3D.fshader = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(Obj3D.fshader, Obj3D.fsTxt);
	gl.compileShader(Obj3D.fshader);
	if (!gl.getShaderParameter(Obj3D.fshader, gl.COMPILE_STATUS)) {
		console.log("Fragment Shader FAILED... "+Obj3D.shaderName+".fs");
		console.log(gl.getShaderInfoLog(Obj3D.fshader));
	}

	Obj3D.shader = gl.createProgram();
	gl.attachShader(Obj3D.shader, Obj3D.vshader);
	gl.attachShader(Obj3D.shader, Obj3D.fshader);
	gl.linkProgram(Obj3D.shader);
	if (!gl.getProgramParameter(Obj3D.shader, gl.LINK_STATUS)) {
		console.log("Could not initialise shaders");
		console.log(gl.getShaderInfoLog(Obj3D.shader));
	}
}


// =====================================================
function webGLStart() {
	
	var canvas = document.getElementById("WebGL-test");

	canvas.onmousedown = handleMouseDown;
	document.onmouseup = handleMouseUp;
	document.onmousemove = handleMouseMove;
	canvas.onwheel = handleMouseWheel;

	initGL(canvas);

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
	mat4.identity(rotMatrix);
	mat4.rotate(rotMatrix, rotX, [1, 0, 0]);
	mat4.rotate(rotMatrix, rotY, [0, 0, 1]);

	distCENTER = vec3.create([0,-0.2,-3]);
	
	MATERIAL = new Material();

	PLANE = new plane();
	LIGHT = new Light();
	CUBEMAP = new cubemap();


	OBJ1 = new objmesh('objs/cube.obj');
	//OBJ2 = new objmesh('porsche.obj');
	
	gl.enable(gl.DEPTH_TEST);

	tick();
}

// =====================================================
function drawScene() {
	gl.clear(gl.COLOR_BUFFER_BIT);
	PLANE.draw();
	
	CUBEMAP.draw();
	
	OBJ1.draw();
	//OBJ2.draw();
}



