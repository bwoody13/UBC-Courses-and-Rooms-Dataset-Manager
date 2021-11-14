const PORT = 4321;
const SERVER_URL = "http://localhost:" + PORT;

function addDataset() {
	const id = document.getElementById("datasetID").value;
	const kind = document.getElementById("datasetTypeCourses").checked ? "courses" : "rooms";
	const fileData = document.getElementById("datasetFile").files[0];
	const endpointURL = `/dataset/${id}/${kind}`;
	const request = new XMLHttpRequest();
	request.open("PUT", SERVER_URL + endpointURL);
	request.responseType = "json";
	request.setRequestHeader("Content-Type", "application/x-zip-compressed");
	request.send(fileData);
	request.onload = function() {
		if(request.status === 200) {
			alert("Dataset Added: " + request.response.result);
		} else {
			alert("Dataset Not Added: " + request.response.error);
		}
	}
	request.onerror = function() {
		alert("Error: Dataset not added!");
	}
	request.onprogress = function() {

	}

}
