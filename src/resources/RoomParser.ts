
// parse Index document by traversing the json tree to find td elements that link
// to building files
// TODO: check the assumption:
//  **assuming table rows (tr elements) hold all related info on a building and that the info
//  	is stored within immediate childNode td elements
//  **assuming building should be ignored if html elements are missing
//  **assuming valid buildings will have their info stored in immediate child td elements of a tr element
import {BuildingInfo} from "../objects/BuildingInfo";

export function parseIndex(document: any): BuildingInfo[] {
	let buildings: BuildingInfo[] = [];
	let buildingFilePaths: string[] = []; // for preventing duplicates
	let stack = [];
	stack.push(document);
	while(stack.length !== 0) {
		const currentElement = stack.pop();
		try {
			if (currentElement.nodeName === "tr") {
				const building = parseTableRow(currentElement);
				if(building != null && !buildingFilePaths.includes(building.path)) {
					buildings.push(building);
					buildingFilePaths.push(building.path);
				}
			}
		} catch(e) {
			// skip invalid tr element (don't throw error)
		}
		if(currentElement.childNodes != null) {
			for(const childNodesKey in currentElement.childNodes) {
				stack.push(currentElement.childNodes[childNodesKey]);
			}
		}
	}
	return buildings;
}

function parseTableRow(trElement: any): BuildingInfo | null {
	let codeSet = false, nameSet = false, addressSet = false, pathSet = false;
	let building = {} as BuildingInfo;
	for(const trChildNodeKey in trElement.childNodes) {
		const trChildNode = trElement.childNodes[trChildNodeKey];
		if(trChildNode.nodeName === "td") {
			if(trChildNode.attrs[0].name === "class") {
				switch(trChildNode.attrs[0].value) {
					case "views-field views-field-field-building-code":
						building.shortname = getTDTextValue(trChildNode);
						codeSet = true;
						break;
					case "views-field views-field-title":
						building.fullname = getTDTextValue(trChildNode);
						nameSet = true;
						break;
					case "views-field views-field-field-building-address":
						building.address = getTDTextValue(trChildNode);
						addressSet = true;
						break;
					case "views-field views-field-nothing":
						building.path = getBuildingFilePath(trChildNode);
						pathSet = true;
						break;
				}
			}
		}
	}
	if(codeSet && nameSet && addressSet && pathSet) {
		return building;
	}
	return null;
}

function getTDTextValue(tdElement: any): string {
	for(const tdChildNodeKey in tdElement.childNodes) {
		const tdChildNode = tdElement.childNodes[tdChildNodeKey];
		if(tdChildNode.nodeName === "#text") {
			return tdChildNode.value;
		}
	}
	return "";
}

function getBuildingFilePath(tdElement: any): string {
	for(const tdChildNodeKey in tdElement.childNodes) {
		const tdChildNode = tdElement.childNodes[tdChildNodeKey];
		if(tdChildNode.nodeName === "a") {
			for(const aAttributeKey in tdChildNode.attrs) {
				if(tdChildNode.attrs[aAttributeKey].name === "href") {
					return tdChildNode.attrs[aAttributeKey].value;
				}
			}
		}
	}
	return "";
}

// "nodeName": "td",
// "tagName": "td",
// "attrs": [
// 	{
// 		"name": "class",
// 		"value": "views-field views-field-title"
// 	}
// ],
// FROM SPEC:
// 		All <td/>s associated with target data will have attributes present in the same
// 		forms as in the provided zip file. For example, a <td/> with the class "room-data"
// 		surrounding target fields will always be present in a valid dataset if it is present
// 		in the original dataset.
// private isValidTDElement(tdElement: any): boolean {
// 	const validTDElementClass = "views-field views-field-title";
// 	return tdElement.attrs[0].name === "class" && tdElement.attrs[0].value === validTDElementClass;
// }
