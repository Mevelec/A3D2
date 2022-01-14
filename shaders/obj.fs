precision mediump float;

float PI = 3.1415926535897932384626433832795;
vec3 CAM_POS = vec3(0.0);

//********************************************
// vecteurs decrivant le fragment/pixel actuel du triangle 
varying vec4 v_pos3D;  //position dans le repère camera
varying vec2 v_texCoords;  //position dans le repère camera
varying vec3 v_N;      //normal de la surface du fragment

//********************************************
// Description du materiau
uniform float u_Distrib;      // mode de distribution
uniform float u_Sample; 	  // nombre d'echantillon
uniform float u_Ni;           // indice du milieu ~ 1.3 pour l'eau
uniform float u_mix; 		  // type de mixage
uniform float u_factor;   // Active/Desactive la texture 

// couleur
uniform vec3  u_Kd;            
uniform float u_texture_color;   // Active/Desactive la texture 
uniform sampler2D s_texture_color; 

// roughness du materiau
uniform float u_sigma;        
uniform float u_texture_roughness;   // Active/Desactive la texture 
uniform sampler2D s_texture_roughness;

// Normale map
uniform float u_texture_normal;   
uniform sampler2D s_texture_normal;

// Ambiante occlusion
uniform float u_texture_ao;   // Active/Desactive la texture 
uniform sampler2D s_texture_ao;

//********************************************
// description de la Skybox
uniform samplerCube skybox;  // sampler de la cube map
uniform mat4 u_RotSkybox;	     // matrice de correction de la transformation pour la cube map

//********************************************
// Timelog
uniform float u_time;        // temps actuel utilisé pour le sampling


// ==================================================================================================================================================================================================
//                    OUTILS
// ==================================================================================================================================================================================================
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
vec3 FromTangeanteToWorld(vec3 N, vec3 vec){
	N = normalize(N);
    vec3 up        = vec3(0.0, 1.0, 0.0); // world up is (0, 1, 0)
	if(dot(N, up) > 0.999){
		up = vec3(0.0, 0.0, 1.0);
	}
    vec3 tangent   = normalize(cross(up, N));
    vec3 bitangent = cross(N, tangent);
	
    vec3 sampleVec = tangent * vec.x + bitangent * vec.y + N * vec.z;
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


// ==================================================================================================================================================================================================
//                    Beckman
// ==================================================================================================================================================================================================
//--------------------
float DistributionBeckman(float dnm, float sigma){
	//calcul de cosTeta4 et tanTheta2
	float cosTm2 = dnm * dnm;
	float sinTm2 = 1.0 - cosTm2;
	float tanTm2 = sinTm2 / cosTm2;
	float cosTm4 = cosTm2 * cosTm2;

	//calculs partiels
	float p1 = PI * (sigma*sigma) * cosTm4;
	float p2 = exp((-tanTm2)/(2.0*(sigma*sigma)));

	return (1.0 / p1) * p2;
}

//--------------------
vec3 ImportanceSampleBeckman(vec2 Xi, vec3 N, float roughness){
	float phi = Xi.x * 2.0 * PI;
	float teta = atan( sqrt(-(roughness * roughness) * log(1.0 - Xi.y)));

	// from spherical coordinates to cartesian coordinates
	vec3 H;
	H.x = cos(phi) * sin(teta);
	H.y = sin(phi) * sin(teta);
	H.z = cos(teta);

    return FromTangeanteToWorld(N, H);
}

// ==================================================================================================================================================================================================
//                     GGX
// ==================================================================================================================================================================================================
//--------------------
float DistributionGGX(float dnm, float sigma){
	float sigma2 = sigma*sigma;

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
vec3 ImportanceSampleGGX(vec2 Xi, vec3 N, float roughness)
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

    return FromTangeanteToWorld(N, H);
}

// ==================================================================================================================================================================================================
//                     Dynamic / simplify methods
// ==================================================================================================================================================================================================
//--------------------
vec3 Importance(float Distrib, vec2 Xi, vec3 N, float roughness){
	vec3 m;
	if(u_Distrib == 1.0){
		m = ImportanceSampleBeckman(Xi, N, roughness);
	}
	else {
		m = ImportanceSampleGGX(Xi, N, roughness);
	}
	return m;
}

//--------------------
float Distribution(float Distrib, float dnm, float sigma){
	float D;
	if(u_Distrib == 1.0){ //use correct Distribution
		D = DistributionBeckman(dnm, sigma);
	}
	else {
		D = DistributionGGX(dnm, sigma);
	}
	return D;
}

//--------------------
vec3 RefractColor(mat4 RotSkybox, vec3 o, vec3 n, float ni1, float ni2){
	vec3 refra = mat3(RotSkybox) * refract(-o, n, ni1/ni2);
	return vec3(textureCube(skybox, refra));
}

//--------------------
vec3 ReflectColor(mat4 RotSkybox, vec3 i){
	vec3 refl =  mat3(RotSkybox) * i;
	return vec3(textureCube(skybox, refl));
}

// ==================================================================================================================================================================================================
//                    Cutted shaders
// ==================================================================================================================================================================================================
vec3 BRDF(vec3 Kd, vec3 Li, float ni, float sigma, mat4 rotSkybox, float distrib, float din, float dim, float don, float dom, float dnm){
	// calcul des méthodes
	float F = Fresnel(ni, dim);
	float D = Distribution(distrib, dnm, sigma);
	float G = Attenuation( dnm, don, dom, din, dim);

	// Line to mix reflected color with aborbed color
	vec3 diffuse_BRDF = (Kd / PI);
	vec3 specular_BRDF = vec3((F*D*G) / (4.0 * din * don));
	return Li * ((1.0-F)*diffuse_BRDF  +  specular_BRDF) * din;
}

//--------------------
// methode effectuant l'echantillonage en fonction du mode demandé
vec3 Microfacettes(vec3 o, vec3 n, float sigma, vec3 Kd, vec3 ao, float mode){

	//******************************************
	// create random based on time and direction
	float rand = 0.0;
	rand = Random(v_pos3D.x, v_pos3D.y);
	rand = Random(rand, v_pos3D.z);
	rand = Random(rand, u_time);	

	//***************
	// foreach sample
	vec3 cumul = vec3(0.0);	
	float factor = 0.0;
	for(float it = 0.0; it < 10000000.0; it++) {
		// break loop when the number of sample is reached
		// must be made  like this because of opengl version not allowing  dynamic loops ( cause : conditionnal in for must be constant)
		if (it >= u_Sample){
			break;
		}

		//***************
		// create randoms
		float x = Random(rand, it);
		float y = Random(rand, it*8.0);
				
		// calculate Importance
		vec3 m = Importance(u_Distrib, vec2(x, y), n, sigma);

		float dom = ddot(o, m);
		// check if microfacet participate to lighting (m is visible ?)
		if(dom > 0.0)
		{
			factor +=1.0;
			vec3 Lo = vec3(0.0);
			if(mode == 0.0 ){ // mirroir parfait depoli (sampling)
				vec3 i = reflect(-o, m); //vecteur reflechi
				Lo = ReflectColor(u_RotSkybox, i);
			}
			else if(mode == 1.0 ){ // transparence parfaite depolie (sampling)
				Lo = RefractColor(u_RotSkybox, o, m, 1.0, u_Ni);
			}
			else if(mode == 2.0 ){ // transparence + mirroir fresnel depoli (sampling)

				vec3 i = reflect(-o, m); //vecteur reflechi
				float dim = ddot(i, m);
				float F = Fresnel(u_Ni, dim);

				// calcul reflection color skymap
				vec3 refl_color = ReflectColor(u_RotSkybox, i);

				// calcul refraction color skymap
				vec3 refra_color = RefractColor(u_RotSkybox, o, m, 1.0, u_Ni);

				vec3 Fr2 = vec3((1.0-F)*(refra_color)); //transmitted
				vec3 Fr3 = vec3(F*refl_color);          //reflected 
				Lo = Fr2 + Fr3;
			}
			else if(mode == 3.0 ){ // mirroir + normal depoli
				vec3 n = vec3(texture2D(s_texture_normal, v_texCoords));
				n = normalize(n * 2.0 - 1.0);
				n = FromTangeanteToWorld(
					m, 
					n
				);

				vec3 i = reflect(-o, n); //vecteur reflechi
				Lo = ReflectColor(u_RotSkybox, i);
			}
			else if ( mode == 4.0){ //BRDF (sampling)
				vec3 refra_color = RefractColor(u_RotSkybox, o, m, 1.0, u_Ni); // calcul refraction color skymap
				
				vec3 i = reflect(-o, m); //vecteur reflechi
				float din = ddot(i, n);
				float dim = ddot(i, m);
				float don = ddot(o, n);

				if(din*don < 0.0001 || dim*dom < 0.0001 || don < 0.0001){
					Lo = vec3(0.0);	
				}
				else if(u_Ni > 4.9){ // perfect mirror
					vec3 refl_color = ReflectColor(u_RotSkybox, i); // calcul reflection color skymap
					Lo = refl_color;
				}
				else { // do BRDF
					vec3 refl_color = ReflectColor(u_RotSkybox, i); // calcul reflection color skymap
					float dnm = ddot(n, m);	
					Lo = BRDF(Kd, refl_color, u_Ni, sigma, u_RotSkybox, u_Distrib, din, dim, don, dom, dnm);
				}

				// add ambient
				vec3 ambient = u_factor * Kd * ao;
				Lo += ambient;
			} 			

			cumul += vec3(Lo);
		}
	}
	return cumul/factor;
}


// ==================================================================================================================================================================================================
//                   MAIN 
// ==================================================================================================================================================================================================
void main(void)
{
	//***********************
	// prepare material data
	vec3 N = v_N;
	float sigma = u_sigma;
	vec3 Kd = u_Kd;
	vec3 ao = vec3(0.0);
	
	vec3 o = normalize(CAM_POS - vec3(v_pos3D));   // fragment -> camera
	vec3 Lo = vec3(1.0,0.0, 1.0);


	float v_mix = u_mix;
	//*************************************	
	if(v_mix < 10.0){ // if is not a microfacette render
		if(v_mix == 0.0 ){ // mirroir parfait
			vec3 i = reflect(-o, N); //vecteur reflechi
			Lo = ReflectColor(u_RotSkybox, i);
		}
		else if(v_mix == 1.0 ){ //transparence parfait
			Lo = RefractColor(u_RotSkybox, o, N, 1.0, u_Ni);
		}
		else if(v_mix == 2.0 ){ //transparence + mirroir fresnel
			vec3 i = reflect(-o, N); //vecteur reflechi
			float dim = ddot(i, N);
			float F = Fresnel(u_Ni, dim);

			// calcul reflection color skymap
			vec3 refl_color = ReflectColor(u_RotSkybox, i);

			// calcul refraction color skymap
			vec3 refra_color = RefractColor(u_RotSkybox, o, N, 1.0, u_Ni);

			vec3 Fr2 = vec3((1.0-F)*(refra_color)); //transmitted
			vec3 Fr3 = vec3(F*refl_color);          //reflected 
			Lo = Fr2 + Fr3;
		}
		else if(v_mix == 3.0 ){ //mirroir coloré par texture
			vec3 i = reflect(-o, N); //vecteur reflechi
			vec3 Kd = vec3(texture2D(s_texture_color, v_texCoords));

			Lo = ReflectColor(u_RotSkybox, i);
			Lo = (Lo + Kd) /2.0;
		}
		else if(v_mix == 4.0){ //mirroir parfait avec bump
			vec3 n = vec3(texture2D(s_texture_normal, v_texCoords));
			n = normalize(n * 2.0 - 1.0);
			n = FromTangeanteToWorld(
				N, 
				n
			);

			vec3 i = reflect(-o, n); //vecteur reflechi
			Lo = ReflectColor(u_RotSkybox, i);
		}
		else if(v_mix == 5.0){
			//*************************
			// Activation des textures 
			if ( u_texture_color == 1.0){
				Kd = vec3(texture2D(s_texture_color, v_texCoords));
			}
			if ( u_texture_roughness == 1.0){
				sigma =  texture2D(s_texture_roughness, v_texCoords).x; 	// C'est une image en nuance de gris, on ne peut utiliser qu'un seul cannal, ici le rouge avec .x
			}
			if ( u_texture_normal == 1.0){
				vec3 n = vec3(texture2D(s_texture_normal, v_texCoords));
				n = normalize(n * 2.0 - 1.0);
				N = FromTangeanteToWorld(
					N, 
					n
				);
			}
			if ( u_texture_ao == 1.0){
				ao = vec3(texture2D(s_texture_ao, v_texCoords));
			}

			//*************************	
			// Calcul BRDF

			// precalculs
			vec3 m = N;
			vec3 i = reflect(-o, m);

			// calcul  des dot products
			float din = ddot(i, N);
			float dim = ddot(i, m);
			float don = ddot(o, N);
			float dom = ddot(o, m);
			float dnm = ddot(N, m);
			vec3 refl_color = ReflectColor(u_RotSkybox, i);

			Lo = BRDF(Kd, refl_color, u_Ni, sigma, u_RotSkybox, u_Distrib, din, dim, don, dom, dnm);

			vec3 ambient = u_factor * Kd * ao;
			Lo += ambient;
		}
	}
	else {
		if(v_mix == 10.0 ){ // mirroir parfait depoli (sampling)
			Lo = Microfacettes(o, N, sigma, Kd, ao, 0.0);
		}
		else if(v_mix == 11.0 ){ // transparence parfaite depolie (sampling)
			Lo = Microfacettes(o, N, sigma, Kd, ao, 1.0);
		}
		else if(v_mix == 12.0 ){ // transparence + mirroir fresnel depoli (sampling)
			Lo = Microfacettes(o, N, sigma, Kd, ao, 2.0);
		}
		else if(v_mix == 13.0 ){ // mirroir + normal depoli
			Lo = Microfacettes(o, N, sigma, Kd, ao, 3.0);
		}
		else if ( v_mix == 14.0){ //BRDF (sampling)
			//*************************
			// Activation des textures 
			if ( u_texture_color == 1.0){
				Kd = vec3(texture2D(s_texture_color, v_texCoords));
			}
			if ( u_texture_roughness == 1.0){
				sigma =  texture2D(s_texture_roughness, v_texCoords).x; 	// C'est une image en nuance de gris, on ne peut utiliser qu'un seul cannal, ici le rouge avec .x
			}
			if ( u_texture_normal == 1.0){
				vec3 n = vec3(texture2D(s_texture_normal, v_texCoords));
				n = normalize(n * 2.0 - 1.0);
				N = FromTangeanteToWorld(
					N, 
					n
				);
			}
			if ( u_texture_ao == 1.0){
				ao = vec3(texture2D(s_texture_ao, v_texCoords));
			}
			//*************************
			// Calcul BRDF 
			Lo = Microfacettes(o, N, sigma, Kd, ao, 4.0);
		} 
	}

	gl_FragColor = vec4(Lo, 1.0);
}



