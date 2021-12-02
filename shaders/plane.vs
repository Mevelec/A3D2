attribute vec3 a_VertexPosition;
attribute vec2 aTexCoords;

uniform mat4 u_MVMatrix;
uniform mat4 u_PMatrix;

varying vec2 v_texCoords;

void main(void) {
	v_texCoords = aTexCoords;
	gl_Position = u_PMatrix * u_MVMatrix * vec4(a_VertexPosition, 1.0);
}
