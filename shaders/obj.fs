// Ralise par le binome :
// MEVELEC Adrien
// PARMENTIER Michael

precision mediump float;

float PI = 3.1415926535897932384626433832795;

// vecteurs decrivant le fragment/pixel actuel du triangle 
varying vec4 pos3D; //position dans le repère camera
varying vec3 N; //normal de la surface du fragment
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

//--------------------
float Beckman(float dnm, float u_sigma){
	//calcul de cosTeta4 et tanTheta2
	float cosTm2 = dnm * dnm;
    float sinTm2 = 1.0 - cosTm2;
    float tanTm2 = sinTm2 / cosTm2;
    float cosTm4 = cosTm2 * cosTm2;

	//calculs partiels
	float p1 = PI * (u_sigma*u_sigma) * cosTm4;
	float p2 = exp((-tanTm2)/(2.0*(u_sigma*u_sigma)));

	return (1.0 / p1) * p2;
}

//--------------------
float CGX(float dnm, float u_sigma){
	float sigma2 = u_sigma*u_sigma;

	//calcul de cosTeta4 et tanTheta2
	float cosTm2 = dnm * dnm;
    float sinTm2 = 1.0 - cosTm2;
    float tanTm2 = sinTm2 / cosTm2;
    float cosTm4 = cosTm2 * cosTm2;

	//calculs partiels
	float p1 = PI * cosTm4;
	float p2 = sigma2+tanTm2;

	return sigma2 /( p1 * (p2* p2)) ;
}

//--------------------
float Attenuation( float dnm, float don, float dom, float din, float dim){
	return min(min((2.0*dnm*don)/dom, (2.0*dnm*din) / dim), 1.0);
}

// ==============================================
void main(void)
{
	// calcul des vecteurs
	vec3 i = normalize(u_light_pos - vec3(pos3D)); // fragment -> lumière
	vec3 o = normalize(CAM_POS - vec3(pos3D));   // fragment -> camera
	vec3 m = normalize(i+o);
	
	// simple renommages
	vec3 Li = u_light_color * u_light_pow; 
	vec3 Kd = u_Kd;

	// calcul  des dot products
	float din = ddot(i, N);
	float don = ddot(o, N);
	float dim = ddot(i, m);
	float dom = ddot(o, m);
	float dnm = ddot(N, m);


	// calcul des méthodes
	float F = Fresnel(u_Ni, dim);
	float D = CGX(dnm, u_sigma);
	float G = Attenuation( dnm, don, dom, din, dim);
	
	// calcul reflection color skymap
	vec3 refl =  u_revese * vec3(  reflect(-i, N) );
	vec4 refl_color = textureCube(skybox, refl);
	Li += vec3(refl_color);

	// calcul refraction color skymap
	vec3 refra = u_revese * refract(-i, N, u_Ni);
	vec4 refra_color = textureCube(skybox, refra);
	Kd = Kd*abs(u_transmission -1.0) +  vec3(refra_color) * u_transmission;

	// calculs partiels
	float Fr1 = 1.0-F; //diffuse
	vec3  Fr2 = Kd / PI; //diffuse
	float Fr3 = (F*D*G) / (4.0	* din * don); //specular 

	vec3 Fr = (Fr1)*(Fr2)+Fr3; //specular + diffuse

	vec3 Lo = Li * Fr * din;

	gl_FragColor = vec4(Lo,1.0);
}



