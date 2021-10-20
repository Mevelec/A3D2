attribute vec3 aVertexPosition;

uniform mat4 uMVMatrix;
uniform mat4 uPMatrix;
uniform mat4 uRotSkybox;

varying vec3 texCoords;

void main(void) {
	texCoords = vec3(vec4(aVertexPosition, 1.0) * uRotSkybox);
	gl_Position = uPMatrix * uMVMatrix  * vec4(aVertexPosition, 1.0);
}
