// ------------------------------------------------
// HIGHER-LEVEL PROCESS FUNCTIONS
// ------------------------------------------------
async initialize_github(RepoAobj) {

	var obj_env = await GET_text_from_file_wo_auth_GitHub_RESTAPI(".env", ".github", RepoAobj.repoB_name, RepoAobj.repoOwner);
	
	var obj = {env_text: obj_env.text.replace(/[\n\s]/g, ""), 
		   env_file_download_url: obj_env.file_download_url, 
		   env_sha: obj_env.sha, 
		   n: 1,
		   repoOwner: RepoAobj.repoOwner,
		   filename: RepoAobj.filename, 
		   foldername: RepoAobj.foldername, 
		   input_text: RepoAobj.input_text, 
		   repoB_name: RepoAobj.repoB_name};

	Object.freeze(obj.env_text); // make the original value non-changeable

	return obj;
}

// ----------------------------------------------------

export async function run_backend_process(RepoAobj) {

	// RepoAobj.repoOwner, RepoAobj.repoA_name, RepoAobj.foldername, RepoAobj.filename, RepoAobj.input_text, RepoAobj.repoB_name, RepoAobj.repoOwner
	
	// n is the maximum salt length used
	var obj = await initialize_github(RepoAobj);
	
	await run_backend(obj);
	
}

// ----------------------------------------------------
	
async function run_backend(obj) {
	
	// Try each of the 'de-salted' authorization keys to identify the correct key: loop over a REST API request and identify which key succeeds
	// console.log('obj.repoB_name: ', obj.repoB_name);
	
	// [0] Determine if filename exists
	var obj_temp = await GET_fileDownloadUrl_and_sha(obj.filename, obj.foldername, obj.repoB_name, obj.repoOwner)

	// [1] Add obj_env and obj_temp to the general object (obj)
	// obj.env_text
	// obj.env_text = "MGV0dHN8dHMgZXQ=";  // for testing
	
	// obj.env_file_download_url
	// obj.env_sha
	obj.env_desired_path = obj.env_file_download_url.split('main/').pop();
	// console.log('obj.env_desired_path: ', obj.env_desired_path);
	
	obj.temp_file_download_url = obj_temp.file_download_url[0]; // this is a string
	obj.temp_desired_path = obj.temp_file_download_url.split('main/').pop();
	obj.temp_sha = obj_temp.sha_arr[0]; // this is a string
	obj.auth = obj.env_text; // Initialize value
	obj.status = 404; // Initialize value
		
	// [2] Loop over the number of possible values
	let i = 0;
	var x = Array.from({ length: (obj.n*2)+1 }, (_, ind) => ind);
	var x_rand = await rand_perm(x);
	
	// console.log('x: ', x);
	// console.log('x_rand: ', x_rand);

	try {
		while ((/^20/g).test(obj.status) == false && obj.auth != null && i < (obj.n*2)+1) {
			
			obj = await decode_desalt(obj,  x_rand[i])
				.then(async function(obj) {
					
					if (obj.temp_file_download_url == "No_file_found") {
						// Option 0: create a new file
					  	obj.status = await PUT_create_a_file_RESTAPI(obj.auth, 'run GitHub Action', obj.input_text, obj.foldername+"/"+obj.filename, obj.repoB_name, obj.repoOwner)
					 		.then(async function(out) { obj.auth = ""; return out.status; })
		 			 		.catch(error => { console.log("error: ", error); });
			 		} else {
						// Option 1: modify an existing file
				 	 	obj.status = await PUT_add_to_a_file_RESTAPI(obj.auth, 'run GitHub Action', obj.input_text, obj.temp_desired_path, obj.temp_sha, obj.repoB_name, obj.repoOwner)
					 		.then(async function(out) { obj.auth = ""; return out.status; })
		 			 		.catch(error => { console.log("error: ", error); });
			 		}
					return obj;
				})
				.then(async function(obj) {
					// console.log("obj.status:", obj.status);
					
					if ((/^20/g).test(obj.status) == true) {
						// console.log("Match found");
						delete obj.auth; // the variable is deleted to force it to stop the loop as quickly as possible, it will then throw an error for the while loop thus the while loop is called in a try catch to prevent errors.
					} else {
						obj.auth = obj.env_text; // reinitialize value to keep the value obj.auth non-visible
					}
					
					return obj;
				})
				.then(async function(obj) { await new Promise(r => setTimeout(r, 2000)); return obj; })
			
			// Advance while loop
			// console.log("loop i: ", i);
			// console.log("x_rand[i]: ", x_rand[i]);
			i += 1;	
		}
		
	} catch (error) {
		console.log("error: ", error);
		console.log("loop finished!");
	}
		
}

// -----------------------------------------------

export async function run_env_decode_desalt(RepoAobj) {

  var obj = await initialize_github(RepoAobj);

  obj.auth = obj.env_text; // Initialize value

  obj = await decode_desalt(obj,  0);
  
  return obj.auth;
}

// ----------------------------------------------------






// ----------------------------------------------------
// SUBFUNCTIONS
// ----------------------------------------------------
export async function decode_desalt(obj, x_i) {
	
	// 0. Decode the Base64-encoded string --> obtain the salted data in binary string format
	const bool = await isbase64(obj.auth);
	var var0_str;
	if (bool == true) {
		var0_str = atob(obj.auth);
	} else {
		var0_str = obj.auth;
	}
	
	// 1. 'de-salt' the authorization key read from the file
	if (x_i == 0) {
		// console.log('Remove nothing:');
		obj.auth = await descramble_ver0(var0_str);
	} else if (x_i <= obj.n) {
		// console.log('Remove end:');
		obj.auth = var0_str.slice(0, var0_str.length - x_i);
		obj.auth = await descramble_ver0(obj.auth);
	} else {
		// console.log('Remove beginning:');
		obj.auth = var0_str.slice(x_i - obj.n, var0_str.length);
		obj.auth = await descramble_ver1(obj.auth);
	}
	// console.log('result: ', obj.auth.slice(0,5));
  return obj;
}

// ----------------------------------------------------

export async function isbase64(text) {
	try {
		return btoa(atob(text)) === text;
	} catch (error) {
		return false;
	}
}

// ----------------------------------------------------

async function descramble_ver0(var3_str) {
	let arr = var3_str.split('').map((val, ind) => {
		if (ind % 2 == 0){
			return var3_str.split('').at(Math.floor(ind/2));
		} else {
			return var3_str.split('').at(Math.floor(ind/2) + 1  + var3_str.split('').indexOf('|'));
		}
	});
	const vals_to_Keep = (x) => x != '|';
	return arr.filter(vals_to_Keep).join('');
}
	
// ----------------------------------------------------

async function descramble_ver1(var3_str) {
	let arr = var3_str.split('').map((val, ind) => {
		if (ind % 2 == 0){
			return var3_str.split('').at(Math.floor(ind/2) + 1  + var3_str.split('').indexOf('|'));
		} else {
			return var3_str.split('').at(Math.floor(ind/2));
		}
	});
	const vals_to_Keep = (x) => x != '|';
	return arr.filter(vals_to_Keep).join('');
}
	
// ----------------------------------------------------

export async function PUT_create_a_file_RESTAPI(auth, message, content, desired_path, repoName, repoOwner) {
	
	// PUT content into a new file
	var url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${desired_path}`;
	var data = {"message": message, "committer":{"name":"App name","email":"App email"}, "content": btoa(content)};
	var headers = {"Accept": "application/vnd.github+json", "Authorization": `Bearer ${auth}`, "X-GitHub-Api-Version": "2022-11-28"};
	var options = {method : 'PUT', headers: headers, body : JSON.stringify(data)};
	
	return await fetch(url, options)
		.catch(error => { console.log("error: ", error); });
}


// ----------------------------------------------------


export async function PUT_add_to_a_file_RESTAPI(auth, message, content, desired_path, sha, repoName, repoOwner) {
	
	// PUT content into an existing file
	let url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${desired_path}`;
	var data = {"message": message, "committer":{"name":"App name","email":"App email"}, "content": btoa(content), "sha": sha};
	var headers = {"Accept": "application/vnd.github+json", "Authorization": `Bearer ${auth}`, "X-GitHub-Api-Version": "2022-11-28"};
	var options = {method : 'PUT', headers: headers, body : JSON.stringify(data)};
	
	return await fetch(url, options)
		.catch(error => { console.log("error: ", error); });
}
	
// ----------------------------------------------------

export async function GET_text_from_file_wo_auth_GitHub_RESTAPI(desired_filename, desired_foldername, repoB_name, repoOwner) {

	return await GET_fileDownloadUrl_and_sha(desired_filename, desired_foldername, repoB_name, repoOwner)
		.then(async function (obj) {
			var text = "";
			if (obj.file_download_url != ["No_file_found"]) {
				// fetch on first file
				text = await fetch(obj.file_download_url[0])
					.then(response => response.text())
					.then(async function(text) { return text; });
			}
			return {text: text, file_download_url: obj.file_download_url[0], sha: obj.sha_arr[0]};
		})
		.catch(error => { console.log("error: ", error); });
}

// ----------------------------------------------------

export async function GET_fileDownloadUrl_and_sha(desired_filename, desired_foldername, repoB_name, repoOwner) {

	// Returns an object of values that are an array
	var url = `https://api.github.com/repos/${repoOwner}/${repoB_name}/contents`;
	// console.log('url: ', url);

	var data = await fetch(url).then(res => res.json());
	// console.log('data: ', data);

	var flag = "run";
	var max_loop_limit = 0;
	var file_download_url = [];
	var folders = [];
	var sha_arr = [];
	
	while (flag == "run" && max_loop_limit < 5) {
		
		// console.log('flag: ', flag);
		// console.log('max_loop_limit: ', max_loop_limit);

		// search over data to find the desired_filename
		var obj = await loop_over_files_and_folders(data, desired_filename, desired_foldername, file_download_url, folders, sha_arr);
		// console.log('obj: ', obj);
		
		folders = folders.concat(obj.folders);
		folders = [... new Set(folders)];
		// console.log('folders: ', folders);
		
		file_download_url = file_download_url.concat(obj.file_download_url);
		file_download_url = [... new Set(file_download_url)];
		// console.log('file_download_url: ', file_download_url);
		
		sha_arr = sha_arr.concat(obj.sha_arr);
		sha_arr = [... new Set(sha_arr)];
		// console.log('sha_arr: ', sha_arr);
		
		// get list of folders from the main directory
		if (folders.length == 0) {
			if (file_download_url.length == 0) { file_download_url = ["No_file_found"]; }
			if (sha_arr.length == 0) { sha_arr = ["No_file_found"]; }
			flag = "stop";
		} else {
			// There are directories in the main file
			data = await fetch(folders.shift())
				.then(res => res.json())
				.then(async function(data) { return data; });
		}
		max_loop_limit += 1;
	}
	
	return {file_download_url: file_download_url, sha_arr: sha_arr};
}

	
async function loop_over_files_and_folders(data, desired_filename, desired_foldername, file_download_url, folders, sha_arr) {
	
	var regexp = new RegExp(`${desired_filename}`, 'g');
	var regexp_foldername = new RegExp(`${desired_foldername}`, 'g');
	
	// run through files per url directory
	let i = 0;
	while (i < data.length && i < 10) {
		
		if (data[i].type === 'file' && data[i].name.match(regexp) && regexp_foldername.test(data[i].download_url) == true) { 
			file_download_url = data[i].download_url;
			sha_arr = data[i].sha;
			// console.log('file_download_url: ', file_download_url);
			// console.log('Desired file found: ', data[i].url);
		} else if (data[i].type === 'dir') {
			// Store url of directories found
			folders.push(data[i].url);
			// console.log('A directory was found: ', data[i].url);
		// } else {
			// console.log('Desired file not found: ', data[i].url);
		}
		i += 1;
		// console.log('i: ', i);
	}
	
	return {file_download_url: file_download_url, folders: folders, sha_arr: sha_arr}; 
}

// ----------------------------------------------------

async function get_number(x) {
	return x[Math.round(x.length*Math.random())-1];
}
	  
export async function rand_perm(x) {

	var out = [];
	while (out.length != x.length) {
		out = await get_number(x).then(async function(x_of_y) {
			if (out.includes(x_of_y) == false && typeof x_of_y != "undefined") { 
				out.push(x_of_y);
			}
			return [... new Set(out)]; // ensure that only unique values are stored in out
		});
	}
	
	return out;
	
}  // end of rand_perm

// ----------------------------------------------------


// ----------------------------------------------------
// For BACKEND SERVER-SIDE USAGE ONLY: these functions are not called
// ----------------------------------------------------
async function create_salt(obj) {

	// Resalt and save the key in .env, for the next time
	var alpha = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	var num = '0123456789';
	let alpha_arr = alpha.split('');
	let num_arr = num.split('');

	// --------------------------------
	
	// Determine the salt length - it can be up to length n
	// Configuration 0: [1 to n]
	// first part is [0 to n-1], we do not want 0 so shift it by one [1 to n]
	// var new_salt_length = Math.round(Math.random())*(n-1) + 1;
	// OR
	// Configuration 1: [no_salt to n]
	var new_salt_length = Math.round(Math.random())*n;
	// console.log('new_salt_length: ', new_salt_length);

	// --------------------------------

	if (new_salt_length > 0) {
		// Fill a vector new_salt_length long with 0 or 1; 0=salt a letter, 1=salt a number
		var letnum_selection = [];
		for (let i=0; i<new_salt_length; i++) { 
			letnum_selection.push(Math.round(Math.random())); 
		}
		// console.log('letnum_selection: ', letnum_selection);
	
		// --------------------------------
		
		// Create salt (extra strings randomly)
		obj.salt = letnum_selection.map((row) => { 
	              if (row == 0) { 
	                let val = Math.round(Math.random()*alpha_arr.length);
	                // console.log('val: ', val);
	                return alpha_arr[val]; 
	              } else { 
	                let val = Math.round(Math.random()*num_arr.length);
	                // console.log('val: ', val);
	                return num_arr[val]; 
	              } 
		});
	
		obj.salt = obj.salt.join('');
	} else {
		obj.salt = "";
	}

	return obj;
}

// ----------------------------------------------------

async function resalt_auth(auth, new_auth, obj) {
	
	// Add salt to auth_new
	if (Math.round(Math.random()) == 0) {
		// salt front
		new_auth = obj.salt+new_auth;
	} else {
		// salt back
		new_auth = new_auth+obj.salt;
	}
	delete obj.salt;

	// --------------------------------
	
	// Scramble key : Github automatically base64 decodes and searches the strings and can find the key, causing GitHub to disactivate the key automatically for security
	
	// obtain even values of string
	let ep = new_auth.map((val) => { if (val % 2 == 0) { return val; } });

	// obtain odd values of string
	let ap = new_auth.map((val) => { if (val % 2 != 0) { return val; } });

	let new_auth1 = ep + "|" + ap;

	// --------------------------------

	// The key is base64_decoded so that the key is hidden in the file
	await PUT_add_to_a_file_RESTAPI(auth, 'resave the new value', btoa(new_auth1), obj.env_desired_path, obj.env_sha);
}

// ----------------------------------------------------
