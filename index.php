<html>
	<head >
		<title>WebGL - Canvas test</title>
		<meta http-equiv="content-type" content="text/html; charset=ISO-8859-1">
		
		<script type="text/javascript" src="js/glMatrix.js"></script>
		<script type="text/javascript" src="js/callbacks.js"></script>
		<script type="text/javascript" src="js/glCourseBasis.js"></script>
		<script type="text/javascript" src="js/objLoader.js"></script>

	</head>

	<body onload="webGLStart();">
		<table>
			<tr>
				<td>
					<!-- ZONE DE DESSIN-->
					<canvas id="WebGL-test" style="border:none;" width="800" height="600"></canvas>
				</td>
				<td>
					<ul>
						<li>scroll click to rotate</li>
						<li>scroll click + shift to zoomm</li>
					</ul>
					<!-- ZONE DE PARAMETRAGE -->
					<form>
						<fieldset>
							<legend> Parametrage de la lumiere </legend>
							<label for="lightPower">Puissance de la lumiere : </label><br>
							<input type="number" step="0.1" id="lightPower" min="0" value="0" oninput="LIGHT.power = Number(value)">
							<br>
							<label for="lightColor">Couleur de la lumiere : </label><br>
							<input type="color" id="lightColor" name="lightColor" value="#ffffff" oninput="LIGHT.color = convertRGBA(value)">

						</fieldset>	
						<fieldset>
							<legend> Parametrage du materiau </legend>

							<label for="TextureActive"> Desactivation des textures : </label>
							<input type="checkbox" name="TextureActive" id="TextureActive" onclick="MATERIAL.updateIsTextured(value)">
							<br>
							
							<label for="Kd">Kd : </label><br>
							<input type="color" id="Kd" name="Kd" value="#ffffff" oninput="MATERIAL.Kd = convertRGBA(value)">
							<br>
							
							<label for="Sigma">Sigma/Roughness : </label><br>
							<input type="range" step="0.01" id="sigma" name="sigma" min="0" max="1" value="0.2" oninput="MATERIAL.sigma = Number(value)">
							<br>

							<label for="Ni">indice du milieu (Ni)</label> <br>
							<input type="range" step="0.01" id="Ni" name="Ni" min="1" max="5" value="1.3" oninput="MATERIAL.Ni = Number(value)">
							<br>	
							
							<label for="transmission"> transmission : [ 0;1 ] </label><br>
							<input type="range" name="transmission" id="transmission" min="0" max="1" step="0.01" value="0" oninput="MATERIAL.transmission = Number(value) ; console.log(value)">
							<br> <br>

							<label for="mix"> Type de materiel : </label>
							<select name="mix" id="mix">
								<option value="0" selected=true onclick="MATERIAL.mix = value;"> Reflection seule </option>
								<option value="1" onclick="MATERIAL.mix = value;"> Refraction seule </option>
								<option value="2" onclick="MATERIAL.mix = value;"> BRDF </option>
							</select>

<!--
							<label for="refraction"> Refraction </label><br>
							<input type="radio" name="mode" id="refraction">
							<br>
							<label for="reflection"> Reflection </label><br>
							<input type="radio" name="mode" id="reflection">
							<br>
							<label for="cook_torrance"> Cook & Torrance </label><br>
							<input type="radio" name="mode" id="cook_torrance">
-->
						</fieldset>

						<fieldset>
							<legend> Parametres de rendu  </legend>
							<label for="mode"> Mode : </label>
							<select name="mode" id="mode">
								<option value=0 selected=true onclick="MATERIAL.uDistrib = value;"> Ggx </option>
								<option value=1 onclick="MATERIAL.uDistrib = value;"> Beckman </option>
							</select>

							<br>

							
							<label for="sample">Nombre d'echantillon :  </label><br>
							<input type="number" step="1"  id="sample" min="0" value="10" oninput="MATERIAL.sample = value;">
							<br>

							<label for="sample">BRDF Factor :  </label><br>
							<input type="number" step="0.1"  id="sample" min="0" value="0" oninput="MATERIAL.factor = value;">
							<br>
						</fieldset>


						<fieldset> 
							<legend> Parametrage de la scene   </legend>
							<label for="skymap">Choix de la skymap : </label>
							<select name="skymap" id="skymap">
								<option value="Yokohama"  onclick="CUBEMAP.cubemapName = value; CUBEMAP.initAll()"> Yokohama </option>
								<option value="Areskutan" onclick="CUBEMAP.cubemapName = value ; CUBEMAP.initAll() "> Areskutan </option>
								<option value="FortPoint" onclick="CUBEMAP.cubemapName = value ; CUBEMAP.initAll()" > FortPoint </option>
								<option value="Lycksele" selected=true onclick="CUBEMAP.cubemapName = value ; CUBEMAP.initAll()"  > Lycksele </option>
								<option value="Tantolunden" onclick="CUBEMAP.cubemapName = value ; CUBEMAP.initAll()"> Tantolunden </option>
							</select>

							<br>

							<label for="obj3D"> Objet dans la scene : </label>
							<select name="obj3D" id="obj3D">
								<option value="sphere_2" onclick="changeObj(value)"> sphere </option>
								<option value="cube" onclick="changeObj(value)"> cube </option>
								<option value="mustang" onclick="changeObj(value)"> mustang </option>
								<option value="porsche" onclick="changeObj(value)"> porsche</option>
								<option value="bunny" onclick="changeObj(value)"> bunny </option>
							</select>

							<br>

							<legend> </legend>
							

						</fieldset>


					</form>
				</td>
			</tr>
		</table>

	</body>
</html>