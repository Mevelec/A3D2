attribute vec3 a_VertexPosition;

uniform mat4 u_MVMatrix;
uniform mat4 u_PMatrix;
uniform mat4 u_RotSkybox;

varying vec3 v_texCoords;

void main(void) {
	v_texCoords = vec3(vec4(a_VertexPosition, 1.0) * u_RotSkybox);
	gl_Position = u_PMatrix * u_MVMatrix  * vec4(a_VertexPosition, 1.0);
}
