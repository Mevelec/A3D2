attribute vec3 a_VertexPosition;
attribute vec3 a_VertexNormal;

uniform mat4 u_RMatrix;
uniform mat4 u_MVMatrix;
uniform mat4 u_PMatrix;

varying vec4 v_pos3D;
varying vec3 v_N;

void main(void) {
	v_pos3D = u_MVMatrix * vec4(a_VertexPosition,1.0);
	v_N = vec3(u_RMatrix * vec4(a_VertexNormal,1.0));
	gl_Position = u_PMatrix * v_pos3D;
}
