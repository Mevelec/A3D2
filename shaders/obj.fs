precision mediump float;

float PI = 3.1415926535897932384626433832795;

// vecteurs decrivant le fragment/pixel actuel du triangle 
varying vec4 v_pos3D;  //position dans le repère camera
varying vec2 v_texCoords;  //position dans le repère camera
varying vec3 v_N;      //normal de la surface du fragment

// Description du materiau
uniform float u_Distrib;      // mode de distribution
uniform float u_Sample; 	  // nombre d'echantillon
uniform vec3 u_Kd;            // couleur
uniform float u_sigma;        // roughness du materiau
uniform float u_Ni;           // indice du milieu ~ 1.3 pour l'eau
uniform float u_transmission; //taux de transmission de la refraction
uniform float u_mix; // type de mixage

// Description de la camera
vec3 CAM_POS = vec3(0.0); //position


// TODO : delete 
// description de la source lumineuse
uniform vec3 u_light_pos;    // position de la source
uniform vec3 u_light_color;  // couleur de la lumière emise
uniform float u_light_pow;   // puissance de la lumière

// description de la Skybox
uniform samplerCube skybox;  // sampler de la cube map
varying mat3 u_revese;	     // matrice de correction de la transformation pour la cube map

// Timelog
uniform float u_time;        // temps actuel utilisé pour le sampling


// ==============================================
//                    OUTILS
// ==============================================
//--------------------
// dot product entre 0 et +
float ddot(vec3 a, vec3 b){
	return max(0.0, dot(a, b));
}

//--------------------
// method to generate a "random" number
float Random(float x, float y)
{
    highp float a = 12.9898;
    highp float b = 78.233;
    highp float c = 43758.5453;
    highp float dt= dot(vec2(x, y),vec2(a,b));
    highp float sn= mod(dt,3.14);
    return fract(sin(sn) * c);
}

//--------------------
vec3 FromTangeanteToWorld(vec3 v_N, vec3 vec){
    vec3 up        = vec3(0.0, 1.0, 0.0); // world up is (0, 0, 1)
	if(dot(v_N, up) > 0.999){
		up = vec3(0.0, 0.0, 1.0);
	}
    vec3 tangent   = normalize(cross(up, v_N));
    vec3 bitangent = cross(v_N, tangent);
	
    vec3 sampleVec = tangent * vec.x + bitangent * vec.y + v_N * vec.z;
    return normalize(sampleVec);	
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

	return 0.5 * ( (sub_g_c*sub_g_c) / (add_g_c*add_g_c))  *  (1.0 +  ((c*add_g_c -1.0)*(c*add_g_c -1.0)) / ((c*sub_g_c +1.0)*(c*sub_g_c +1.0)) ); 
}

//--------------------
float Attenuation( float dnm, float don, float dom, float din, float dim){
	return min(min((2.0*dnm*don)/dom, (2.0*dnm*din) / dim), 1.0);
}


// ==============================================
//                    Beckman
// ==============================================
//--------------------
float DistributionBeckman(float dnm, float u_sigma){
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
vec3 ImportanceSampleBeckman(vec2 Xi, vec3 v_N, float roughness){
	float phi = Xi.x * 2.0 * PI;
	float teta = atan( sqrt(-(roughness * roughness) * log(1.0 - Xi.y)));

	// from spherical coordinates to cartesian coordinates
	vec3 H;
	H.x = cos(phi) * sin(teta);
	H.y = sin(phi) * sin(teta);
	H.z = cos(teta);

    return FromTangeanteToWorld(v_N, H);
}

// ==============================================
//                     GGX
// ==============================================
//--------------------
float DistributionGGX(float dnm, float u_sigma){
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
vec3 ImportanceSampleGGX(vec2 Xi, vec3 v_N, float roughness)
{
	//from Disney pixar publication paper about PBR shading
    float a = roughness*roughness;
	
    float phi = 2.0 * PI * Xi.x;
    float cosTheta = sqrt((1.0 - Xi.y) / (1.0 + (a*a - 1.0) * Xi.y));
    float sinTheta = sqrt(1.0 - cosTheta*cosTheta);
	
    // from spherical coordinates to cartesian coordinates
    vec3 H;
    H.x = cos(phi) * sinTheta;
    H.y = sin(phi) * sinTheta;
    H.z = cosTheta;

    return FromTangeanteToWorld(v_N, H);
}


// ==============================================
//                   MAIN 
// ==============================================
void main(void)
{
	float totalWeight = 0.0;    
	vec3 cumul = vec3(0.0);	

	vec3 o = normalize(CAM_POS - vec3(v_pos3D));   // fragment -> camera

	// calcul  des dot products du fragment
	float don = ddot(o, v_N);

	// create random based on time and direction
	float rand = 0.0;
	rand = Random(v_pos3D.x, v_pos3D.y);
	rand = Random(rand, v_pos3D.z);
	rand = Random(rand, u_time);	
	
	
	// foreach sample
	for(float i = 0.0; i < 10000.0; i++) {
		// break loop when the number of sample is reached
		// must be made  like this because of opengl version not allowing  dynamic loops (conditionnal should be constant)
		if (i >= u_Sample){
			break;
		}

		// create randoms
		float x = Random(rand, i);
		float y = Random(rand, i*8.0);
				
		// calculate Importance
		vec3 m = ImportanceSampleBeckman(vec2(x, y), v_N, u_sigma);
		if(u_Distrib == 1.0){
			m = ImportanceSampleBeckman(vec2(x, y), v_N, u_sigma);
		}
		else {
			m = ImportanceSampleGGX(vec2(x, y), v_N, u_sigma);
		}

		float NdotL = ddot(v_N, m);

		// check if microfacet participate to lighting
		if(NdotL > 0.0)
		{
			totalWeight += NdotL; 

			// calcul de la direction de la lumiere reflechie
			vec3 i = reflect(-o, m); //vecteur reflechi

			// calcul  des dot products de la microfacette
			float din = ddot(i, v_N);
			float dim = ddot(i, m);
			float dom = ddot(o, m);
			float dnm = ddot(v_N, m);

			// calcul des méthodes
			float F = Fresnel(u_Ni, dim);
			float D;
			if(u_Distrib == 1.0){ //use correct Distribution
				D = DistributionBeckman(dnm, u_sigma);
			}
			else {
				D = DistributionGGX(dnm, u_sigma);
			}
			float G = Attenuation( dnm, don, dom, din, dim);
			
			// calcul reflection color skymap
			vec3 refl =  u_revese * i;
			vec3 refl_color = vec3(textureCube(skybox, refl));

			// calcul refraction color skymap
			vec3 refra = u_revese * refract(-o, m, 1.0/u_Ni);
			vec3 refra_color = vec3(textureCube(skybox, refra));

			// Line to mix reflected color with aborbed color
			vec3 Kd = u_Kd*(1.0-u_transmission) + vec3(refra_color)*u_transmission; // ligne pour manibuler l'opacite du materiau
			//vec3 Kd = vec3(refra_color); // line to use clear glass

			// calculs partiels


			vec3 Lo = vec3(0);
			// change le comportement en fonction du mix choisi
			if(u_mix == 1.0){ // verre
				Lo = vec3(refra_color);
			}
			else if(u_mix == 2.0){ // reflectio et refraction avec fresnel
				// calculs partiels
				vec3 diffuse_BRDF = (1.0-F)*(Kd / PI);
				vec3 specular_BRDF = vec3((F*D*G) / (4.0 * din * don));
				Lo =  refl_color * (diffuse_BRDF + specular_BRDF) * din;
			}
			else { // mirroir
				Lo = vec3(refl_color);
			}
			cumul += vec3(Lo)/NdotL;
		}
	}
	
	gl_FragColor = vec4(cumul/u_Sample, 1.0);
}



