const PORT = 4321;
const SERVER_URL = "http://localhost:" + PORT;

async function addDataset() {
	return new Promise((resolve, reject) => {
		const id = document.getElementById("datasetID").value.trim();
		const kind = document.getElementById("datasetTypeCourses").checked ? "courses" : "rooms";
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

// Dataset List Functions ---------------------------
updateDatasetList();

async function updateDatasetList() {
	console.log("Updating Dataset List...");
	const datasetList = await listDatasets();
	console.log("Returned Dataset List: " + JSON.stringify(datasetList));
	if (datasetList !== null) {
		clearList();
		for (let i = 0; i < datasetList.length; i++) {
			createDatasetElement(datasetList[i]);
		}
	}
}

function createDatasetElement(dataset) {
	const table = document.getElementById("datasetList");
	const tbody = table.getElementsByTagName("tbody")[0];
	const row = tbody.insertRow(tbody.rows.length);
	const cellID = row.insertCell(0);
	cellID.innerHTML = dataset.id;
	const cellKind = row.insertCell(1);
	cellKind.innerHTML = dataset.kind;
	const cellNumRows = row.insertCell(2);
	cellNumRows.innerHTML = dataset.numRows;
	const cellPerformQuery = row.insertCell(3);
	const performQueryButton = document.createElement("button");
	performQueryButton.innerHTML = "Query";
	cellPerformQuery.appendChild(performQueryButton);
	const cellRemove = row.insertCell(4);
	const removeButton = document.createElement("button");
	removeButton.innerHTML = "Remove";
	removeButton.addEventListener("click", () => removeDataset(dataset.id));
	cellRemove.appendChild(removeButton);
}

function clearList() {
	const table = document.getElementById("datasetList");
	const tbody = table.getElementsByTagName("tbody")[0];
	const rowCount = tbody.rows.length;
	for (let i=0; i<rowCount; i++) {
		tbody.deleteRow(0);
	}
}

