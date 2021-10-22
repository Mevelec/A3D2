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
varying vec3 v_Kd; // couleur
varying float v_sigma; //
varying float v_Ni; //

// Description de la camera
vec3 CAM_POS = vec3(0.0);

// description de la source lumineuse
varying vec3 v_light_pos;
varying vec3 v_light_color;
varying float v_light_pow;

// Skybox
uniform samplerCube skybox;
varying mat3 u_revese;


//-------------------- METHODES -------------------
mat3 transpose(mat3 m) {
  return mat3(m[0][0], m[1][0], m[2][0],
              m[0][1], m[1][1], m[2][1],
              m[0][2], m[1][2], m[2][2]);
}
mat3 inverse(mat3 m) {
  float a00 = m[0][0], a01 = m[0][1], a02 = m[0][2];
  float a10 = m[1][0], a11 = m[1][1], a12 = m[1][2];
  float a20 = m[2][0], a21 = m[2][1], a22 = m[2][2];

  float b01 = a22 * a11 - a12 * a21;
  float b11 = -a22 * a10 + a12 * a20;
  float b21 = a21 * a10 - a11 * a20;

  float det = a00 * b01 + a01 * b11 + a02 * b21;

  return mat3(b01, (-a22 * a01 + a02 * a21), (a12 * a01 - a02 * a11),
              b11, (a22 * a00 - a02 * a20), (-a12 * a00 + a02 * a10),
              b21, (-a21 * a00 + a01 * a20), (a11 * a00 - a01 * a10)) / det;
}

// dot product entre 0 et +
float ddot(vec3 a, vec3 b){
	return max(0.0, dot(a, b));
}

float Fresnel(float v_Ni, float dim) {
	float c = abs(dim);
	float g = (v_Ni*v_Ni) + (c*c) -1.0;

	// calculs partiels pour simplifier la relecture
	float sqrt_g = sqrt(g); 
	float add_g_c = sqrt_g + c;
	float sub_g_c = sqrt_g - c;

	return 0.5 * ( (sub_g_c*sub_g_c) / (add_g_c*add_g_c))  *  (1.0 +  ((c*add_g_c -1.0)*(c*add_g_c -1.0)) / ((c*sub_g_c -1.0)*(c*sub_g_c -1.0)) ); 
}

float Beckman(float dnm, float v_sigma){
	//calcul de cosTeta4 et tanTheta2
	float cosTm2 = dnm * dnm;
    float sinTm2 = 1.0 - cosTm2;
    float tanTm2 = sinTm2 / cosTm2;
    float cosTm4 = cosTm2 * cosTm2;

	//calculs partiels
	float p1 = PI * (v_sigma*v_sigma) * cosTm4;
	float p2 = exp((-tanTm2)/(2.0*(v_sigma*v_sigma)));

	return (1.0 / p1) * p2;
}

float Attenuation( float dnm, float don, float dom, float din, float dim){
	return min(min((2.0*dnm*don)/dom, (2.0*dnm*din) / dim), 1.0);
}

// ==============================================
void main(void)
{
	// calcul des vecteurs
	vec3 i = normalize(v_light_pos - vec3(pos3D)); // fragment -> lumière
	vec3 o = normalize(CAM_POS - vec3(pos3D));   // fragment -> camera
	vec3 m = normalize(i+o);
	
	vec3 Li = v_light_color * v_light_pow; // simple renommage

	// calcul  des dot products
	float din = ddot(i, N);
	float don = ddot(o, N);
	float dim = ddot(i, m);
	float dom = ddot(o, m);
	float dnm = ddot(N, m);


	// calcul des méthodes
	float F = Fresnel(v_Ni, dim);
	float D = Beckman(dnm, v_sigma);
	float G = Attenuation( dnm, don, dom, din, dim);
	
	// calcul reflection color
	vec3 refl =  u_revese * vec3(  reflect(-i, N) );
	vec4 refl_color = textureCube(skybox, refl);
	//Li = vec3(refl_color);

	// calcul refraction color
	vec3 refra = u_revese * refract(-i, N, 1.3);
	vec4 refra_color = textureCube(skybox, refra);

	// calculs partiels
	float Fr1 = 1.0-F;
	vec3  Fr2 = v_Kd / PI;
	float Fr3 = F*D*G;
	float Fr4 = 4.0	* din * don;

	vec3 Fr = (Fr1)*(Fr2)+(Fr3)/(Fr4);

	vec3 Lo = Li * Fr * din;



	gl_FragColor =  refl_color;
	gl_FragColor = vec4(Lo,1.0);
}



