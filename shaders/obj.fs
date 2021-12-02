// Ralise par le binome :
// MEVELEC Adrien
// PARMENTIER Michael
// HAMMAS Ali-Cherif

precision mediump float;

float PI = 3.1415926535897932384626433832795;

// vecteurs decrivant le fragment/pixel actuel du triangle 
varying vec4 v_pos3D; //position dans le repère camera
varying vec3 v_N; //normal de la surface du fragment

// Description du materiau
uniform float u_Ni; // indice du milieu ~ 1.3 pour l'eau
uniform float u_mix; //type de mixage entre reflection et transmission

// Description de la camera
vec3 CAM_POS = vec3(0.0);

// description de la Skybox
uniform samplerCube skybox;
varying mat3 v_reverse; // transformation inverse

//-------------------- METHODES -------------------
//--------------------
// dot product entre 0 et +
float ddot(vec3 a, vec3 b){
	return max(0.0, dot(a, b));
}

//--------------------
// calcul du coefficient de fresnel
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
	vec3 o = normalize(CAM_POS - vec3(v_pos3D));   // fragment -> camera
	vec3 i = normalize(vec3(-o+2.0*v_N*(ddot(o, v_N)))); // fragment -> lumière (vecteur symetrique a la normale)
	vec3 m = v_N; //normale de la microfacette (ici = a la normal car 1 on utilise 1 microfacette)


	// calcul  des dot products
	float dim = ddot(i, m);

	// calcul des méthodes
	float F = Fresnel(u_Ni, dim);
	
	// calcul reflection color skymap
	vec3 refl =  v_reverse * i;
	vec4 refl_color = textureCube(skybox, refl);

	// calcul refraction color skymap
	vec3 refra = v_reverse * refract(i, v_N, u_Ni);
	vec4 refra_color = textureCube(skybox, refra);

	vec3 Lo; // luminance de l'objet
	// change le comportement en fonction du mix choisi
	if(u_mix == 0.0){ // verre
		Lo = vec3(refra_color);
	}
	else if(u_mix == 0.5){ // reflectio et refraction avec fresnel
		// calculs partiels
		vec3 Fr2 = vec3((1.0-F)*(refra_color)); //transmitted
		vec3 Fr3 = vec3(F*refl_color);          //reflected 
		Lo = Fr2 + Fr3;
	}
	else { //m mirroir
		Lo = vec3(refl_color);
	}

	gl_FragColor = vec4(Lo,1.0);
}



