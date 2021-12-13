attribute vec3 a_VertexPosition;
attribute vec2 a_VertexTextureCoords;

uniform mat4 u_MVMatrix;
uniform mat4 u_PMatrix;

varying vec2 v_texCoords;

void main(void) {
	v_texCoords = a_VertexTextureCoords;
	gl_Position = u_PMatrix * u_MVMatrix * vec4(a_VertexPosition, 1.0);
}
