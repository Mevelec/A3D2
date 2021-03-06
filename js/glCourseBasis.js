
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
var TIME = 0;

// =====================================================
// OBJET holding a material data
// =====================================================
class Material{
	constructor(){
		this.Kd = [0.53, 0.53, 0.53];
		this.sigma = 0.2;
		this.Ni = 1.3;
		this.transmission = 0;
		this.distrib = 0;
		this.sample = 10;
		this.mix = 0;
		this.factor = 1.0;
		
		this.textureColor = 0.0; 
		this.textureRoughness = 0.0; 
		this.textureNormal = 0.0; 
		this.textureAO = 0.0; 
	}

	updateIsTextureColor(val){
		this.textureColor = !this.textureColor;
	}
	updateIsTextureRoughness(val){
		this.textureRoughness = !this.textureRoughness ; 
	}
	updateIsTextureNormal(val){
		this.textureNormal = !this.textureNormal;
	}
	updateIsTextureAO(val){
		this.textureAO = !this.textureAO;
	}

	// --------------------------------------------
	setShadersParams(shader) {
		shader.mKdUniform = gl.getUniformLocation(shader, "u_Kd");
		shader.mSigmaUniform = gl.getUniformLocation(shader, "u_sigma");
		shader.mNiUniform = gl.getUniformLocation(shader, "u_Ni");
		shader.uTime = gl.getUniformLocation(shader, "u_time");
		shader.uDistrib = gl.getUniformLocation(shader, "u_Distrib");
		shader.uSample = gl.getUniformLocation(shader, "u_Sample");
		shader.uMix = gl.getUniformLocation(shader, "u_mix");

		shader.uTextureColor = gl.getUniformLocation(shader, "u_texture_color");
		shader.uTextureRoughness = gl.getUniformLocation(shader, "u_texture_roughness");
		shader.uTextureNormal = gl.getUniformLocation(shader, "u_texture_normal");
		shader.uTextureAO = gl.getUniformLocation(shader, "u_texture_ao");

		shader.uFactor = gl.getUniformLocation(shader, "u_factor");

		gl.uniform3fv(shader.mKdUniform,   this.Kd);
		gl.uniform1f(shader.mSigmaUniform, this.sigma);
		gl.uniform1f(shader.mNiUniform,    this.Ni);
		gl.uniform1f(shader.uTime, TIME);
		gl.uniform1f(shader.uDistrib, this.distrib);
		gl.uniform1f(shader.uSample,  this.sample);
		gl.uniform1f(shader.uMix,     this.mix);

		gl.uniform1f(shader.uTextureColor,     this.textureColor);
		gl.uniform1f(shader.uTextureRoughness, this.textureRoughness);
		gl.uniform1f(shader.uTextureNormal,    this.textureNormal);
		gl.uniform1f(shader.uTextureAO,        this.textureAO);

		gl.uniform1f(shader.uFactor, this.factor);
	}
}

// =====================================================
// OBJET 3D, representant une lumi??re
// =====================================================
class Light{
	constructor() {
		this.position = [0, 0, 0]
		this.power = 0;
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
		
		// bind on 0 wit sampler name color_tex
		this.texture_color = new Image();
		this.texture_color.onload = this.onLoadedImage.bind(this, {id : 1});
		this.texture_color.crossOrigin = "anonymous"
		this.texture_color.src = "./Textures/bricks_2/diffuse.png";

		
		// bind on 1 wit sampler name color_rough
		this.texture_roughness = new Image();
		this.texture_roughness.onload = this.onLoadedImage.bind(this, {id : 2});
		this.texture_roughness.crossOrigin = "anonymous"
		this.texture_roughness.src = "./Textures/bricks_2/roughness.png";
		
		// bind on 2 wit sampler name color_nm
		this.texture_normal = new Image();
		this.texture_normal.onload = this.onLoadedImage.bind(this, {id : 3});
		this.texture_normal.crossOrigin = "anonymous"
		this.texture_normal.src = "./Textures/bricks_2/normal.png";

		// bind on 2 wit sampler name color_nm
		this.texture_ao = new Image();
		this.texture_ao.onload = this.onLoadedImage.bind(this, {id : 4});
		this.texture_ao.crossOrigin = "anonymous"
		this.texture_ao.src = "./Textures/bricks_2/ao.png";
		
		//TODO : Reussir ?? passer les id dans l'appel de onLoadedImage
	}
	
	onLoadedImage(obj){
		console.log("TEXTURE LOADING" + obj.id);

		if (obj.id == 1 ) { 
			this.texture1 = gl.createTexture();
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.texture1);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture_color);
		
		}  else if (obj.id == 2) {
			this.texture2 = gl.createTexture();
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.texture2);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture_roughness);
		
		} else if (obj.id == 3 ){
			this.texture3 = gl.createTexture();
			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_2D, this.texture3);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture_normal);
		} else if (obj.id == 4 ){
			this.texture4 = gl.createTexture();
			gl.activeTexture(gl.TEXTURE4);
			gl.bindTexture(gl.TEXTURE_2D, this.texture4);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.texture_ao);
		}



		
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.bindTexture(gl.TEXTURE_2D, null);
	}

	// --------------------------------------------
	setShadersParams() {
		gl.useProgram(this.shader);

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "a_VertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.vertexBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.nAttrib = gl.getAttribLocation(this.shader, "a_VertexNormal");
		gl.enableVertexAttribArray(this.shader.nAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.normalBuffer);
		gl.vertexAttribPointer(this.shader.nAttrib, this.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

		
		this.shader.texCoordsAttrib = gl.getAttribLocation(this.shader, "a_VertexTextureCoords");
		gl.enableVertexAttribArray(this.shader.texCoordsAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.mesh.textureBuffer);
		gl.vertexAttribPointer(this.shader.texCoordsAttrib, this.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
		

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "u_RMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "u_MVMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "u_PMatrix");
		this.shader.rsMatrixUniform = gl.getUniformLocation(this.shader, "u_RotSkybox");

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

		var rot = mat4.create();
		mat4.inverse(rotMatrix, rot);
		var rotSky = mat4.create();
		mat4.inverse(CUBEMAP.rotMatrix, rotSky);
		var res = mat4.create();
		
		mat4.multiply(
			rotSky,
			rot,
			res
		)
		mat4.toMat3(
			res
		)			
		gl.uniformMatrix4fv(this.shader.rsMatrixUniform, false, 	
			res
		);
	}
	
	// --------------------------------------------
	draw() {
		if(this.shader && this.loaded==4 && this.mesh != null) {
			this.setShadersParams();
			this.setMatrixUniforms();

			this.shader.texture_color = gl.getUniformLocation(this.shader, "s_texture_color");
			gl.activeTexture(gl.TEXTURE1);
			gl.bindTexture(gl.TEXTURE_2D, this.texture1);
			gl.uniform1i(this.shader.texture_color, 1);

			
			this.shader.texture_roughness = gl.getUniformLocation(this.shader, "s_texture_roughness");
			gl.activeTexture(gl.TEXTURE2);
			gl.bindTexture(gl.TEXTURE_2D, this.texture2);
			gl.uniform1i(this.shader.texture_roughness, 2);

			
			this.shader.texture_normal = gl.getUniformLocation(this.shader, "s_texture_normal");
			gl.activeTexture(gl.TEXTURE3);
			gl.bindTexture(gl.TEXTURE_2D, this.texture3);
			gl.uniform1i(this.shader.texture_normal, 3);

			this.shader.texture_ao = gl.getUniformLocation(this.shader, "s_texture_ao");
			gl.activeTexture(gl.TEXTURE4);
			gl.bindTexture(gl.TEXTURE_2D, this.texture4);
			gl.uniform1i(this.shader.texture_ao, 4);



			gl.bindTexture(gl.TEXTURE_CUBE_MAP, CUBEMAP.texture);

			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.mesh.indexBuffer);
			gl.drawElements(gl.TRIANGLES, this.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
		}
	}
}



// =====================================================
// PLAN 3D, Support g??om??trique
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

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "a_VertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "a_VertexTextureCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib,this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "u_PMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "u_MVMatrix");

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
// PLAN 3D, Support g??om??trique
// =====================================================
class cubemap {
	
	// --------------------------------------------
	constructor() {
		this.shaderName='shaders/skybox';
		this.loaded=-1;
		this.shader=null;
		this.cubemapName = 'Lycksele'
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
		gl.activeTexture(gl.TEXTURE0);
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
			this.textures_images[i].crossOrigin = "anonymous"
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

		this.shader.vAttrib = gl.getAttribLocation(this.shader, "a_VertexPosition");
		gl.enableVertexAttribArray(this.shader.vAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer);
		gl.vertexAttribPointer(this.shader.vAttrib, this.vBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.tAttrib = gl.getAttribLocation(this.shader, "a_VertexTextureCoords");
		gl.enableVertexAttribArray(this.shader.tAttrib);
		gl.bindBuffer(gl.ARRAY_BUFFER, this.tBuffer);
		gl.vertexAttribPointer(this.shader.tAttrib,this.tBuffer.itemSize, gl.FLOAT, false, 0, 0);

		this.shader.rMatrixUniform = gl.getUniformLocation(this.shader, "u_RMatrix");
		this.shader.pMatrixUniform = gl.getUniformLocation(this.shader, "u_PMatrix");
		this.shader.mvMatrixUniform = gl.getUniformLocation(this.shader, "u_MVMatrix");
		this.shader.rsMatrixUniform = gl.getUniformLocation(this.shader, "u_RotSkybox");

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
function changeObj(newOBJ){
	OBJ1 = new objmesh('objs/' + newOBJ + '.obj');
}



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

	OBJ1 = new objmesh('objs/sphere_2.obj');
	
	gl.enable(gl.DEPTH_TEST);

	tick();
}


// =====================================================
function drawScene() {
	TIME += 1;

	gl.clear(gl.COLOR_BUFFER_BIT);	
	CUBEMAP.draw();
	
	OBJ1.draw();
}



