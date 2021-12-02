precision mediump float;

varying vec3 v_texCoords;

uniform samplerCube skybox;

void main(void)
{
	gl_FragColor = textureCube(skybox, v_texCoords);
}






