// Ralise par le binome :
// MEVELEC Adrien
// PARMENTIER Michael

precision mediump float;

float PI = 3.1415926535897932384626433832795;

// vecteurs decrivant le fragment/pixel actuel du triangle 
varying vec4 v_pos3D; //position dans le repère camera
varying vec3 v_N; //normal de la surface du fragment
varying vec3 Normal; //normal de la surface du fragment

// Description du materiau
uniform vec3 u_Kd; // couleur
uniform float u_sigma; //
uniform float u_Ni; // indice du milieu ~ 1.3 pour l'eau
uniform float u_transmission; //taux de transmission de la refraction

// Description de la camera
vec3 CAM_POS = vec3(0.0);

// description de la source lumineuse
uniform vec3 u_light_pos;
uniform vec3 u_light_color;
uniform float u_light_pow;

// description de la Skybox
uniform samplerCube skybox;
varying mat3 u_revese;


//-------------------- METHODES -------------------
//--------------------
// dot product entre 0 et +
float ddot(vec3 a, vec3 b){
	return max(0.0, dot(a, b));
}

//--------------------
float Fresnel(float u_Ni, float dim) {
	float c = abs(dim);
	float g = (u_Ni*u_Ni) + (c*c) -1.0;

	// calculs partiels pour simplifier la relecture
	float sqrt_g = sqrt(g); 
	float add_g_c = sqrt_g + c;
	float sub_g_c = sqrt_g - c;

	return 0.5 * ( (sub_g_c*sub_g_c) / (add_g_c*add_g_c))  *  (1.0 +  ((c*add_g_c -1.0)*(c*add_g_c -1.0)) / ((c*sub_g_c -1.0)*(c*sub_g_c -1.0)) ); 
}

// ==============================================
void main(void)
{
	// calcul des vecteurs
	vec3 i = normalize(u_light_pos - vec3(v_pos3D)); // fragment -> lumière
	vec3 o = normalize(CAM_POS - vec3(v_pos3D));   // fragment -> camera
	vec3 m = normalize(i+o);
	
	// simple renommages
	vec3 Kd = vec3(0.0, 0.0, 0.0);
	vec3 Li = u_light_color * u_light_pow; 

	// calcul  des dot products
	float dim = ddot(i, m);


	// calcul des méthodes
	float F = Fresnel(u_Ni, dim);
	
	// calcul reflection color skymap
	vec3 refl =  u_revese * vec3(  reflect(-i, v_N) );
	vec4 refl_color = textureCube(skybox, refl);
	Li += vec3(refl_color);

	// calcul refraction color skymap
	vec3 refra = u_revese * refract(-i, v_N, u_Ni);
	vec4 refra_color = textureCube(skybox, refra);
	Kd =   vec3(refra_color);

	// calculs partiels
	vec3 Fr2 = (1.0-F)*(Kd); //diffuse
	vec3 Fr3 = vec3(F*refl_color); //specular 

	vec3 Lo = Fr2 + Fr3;

	gl_FragColor = vec4(Lo,1.0);
}



