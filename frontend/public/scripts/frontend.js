const PORT = 4321;
const SERVER_URL = "http://localhost:" + PORT;

async function addDataset() {
	return new Promise((resolve, reject) => {
		const id = document.getElementById("datasetID").value.trim();
		const kind = "rooms";
		const fileData = document.getElementById("datasetFile").files[0];
		const endpointURL = `/dataset/${id}/${kind}`;
		const request = new XMLHttpRequest();
		request.open("PUT", SERVER_URL + endpointURL, true);
		request.responseType = "json";
		request.setRequestHeader("Content-Type", "application/x-zip-compressed");
		request.onload = async function () {
			if (request.status === 200) {
				// alert("Dataset Added: " + request.response.result);
				await updateDatasetList();
				resolve(request.response.result);
			} else {
				reject(request.response.error);
			}
		}
		request.onerror = function () {
			alert("Error occurred. Dataset not added!");
		}
		request.send(fileData);

	}).catch(function (e) {
		alert(e);
	});
}

async function removeDataset(id) {
	return new Promise((resolve, reject) => {
		const endpointURL = `/dataset/${id}`;
		const request = new XMLHttpRequest();
		request.open("DELETE", SERVER_URL + endpointURL, true);
		request.responseType = "json";
		request.onload = async function () {
			if (request.status === 200) {
				// alert("Dataset Removed: " + request.response.result);
				await updateDatasetList();
				resolve(request.response.result);
			} else {
				reject(request.response.error);
			}
		}
		request.onerror = function () {
			alert("Error occurred. Dataset not removed!");
		}
		request.send();

	}).catch(function (e) {
		alert(e);
	});
}

function listDatasets() {
	return new Promise((resolve, reject) => {
		const endpointURL = "/datasets";
		const request = new XMLHttpRequest();
		request.open("GET", SERVER_URL + endpointURL, true);
		request.responseType = "json";
		request.onload = function() {
			console.log("Received Dataset list");
			if(request.status === 200) {
				resolve(request.response.result);
			} else {
				reject(request.response.error);
			}
		}
		request.onerror = function() {
			alert("Error occurred. Could not get dataset list!");
		}
		request.send();

	}).catch(function (e) {
		alert(e);
	});
}




