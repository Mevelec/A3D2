
attribute vec3 a_VertexPosition;
attribute vec3 a_VertexNormal;
attribute vec2 a_VertexTextureCoords;

uniform mat4 u_RMatrix;
uniform mat4 u_MVMatrix;
uniform mat4 u_PMatrix;

varying vec4 v_pos3D;
varying vec3 v_N;

varying vec2 v_texCoords;


//------------------
void main(void) {  
	v_pos3D = u_MVMatrix * vec4(a_VertexPosition,1.0);
	v_texCoords = a_VertexTextureCoords;

	v_N = normalize( mat3(u_RMatrix) * a_VertexNormal);

	gl_Position = u_PMatrix * v_pos3D;
}
