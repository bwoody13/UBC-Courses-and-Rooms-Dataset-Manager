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
	// const cellKind = row.insertCell(1);
	// cellKind.innerHTML = dataset.kind;
	const cellNumRows = row.insertCell(1);
	cellNumRows.innerHTML = dataset.numRows;
	const cellPerformQuery = row.insertCell(2);
	const performQueryButton = document.createElement("button");
	performQueryButton.innerHTML = "Query";
	performQueryButton.addEventListener("click", () => beginQuery(dataset.id));
	cellPerformQuery.appendChild(performQueryButton);
	const cellRemove = row.insertCell(3);
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
