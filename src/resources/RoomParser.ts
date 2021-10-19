
// parse Index document by traversing the json tree to find td elements that link
// to building files
// TODO: check the assumption:
//  **assuming table rows (tr elements) hold all related info on a building and that the info
//  	is stored within immediate childNode td elements
//  **assuming building should be ignored if html elements are missing
//  **assuming valid buildings will have their info stored in immediate child td elements of a tr element
import {BuildingInfo} from "../objects/BuildingInfo";
import parse5 from "parse5";

export function parseIndex(document: parse5.Document): BuildingInfo[] {
	let buildings: BuildingInfo[] = [];
	let stack = [];

	if(document.childNodes != null) {
		for(const childNodesKey in document.childNodes) {
			if (document.childNodes[childNodesKey] !== undefined) {
				stack.push(document.childNodes[childNodesKey]);
			}
		}
	}

	while(stack.length !== 0) {
		const currentElement = stack.pop();
		if(currentElement !== undefined && "childNodes" in currentElement) {
			try {
				if (currentElement.nodeName === "tr") {
					const building = parseTableRow(currentElement);
					if (building != null) {
						buildings.push(building);
					}
				}
			} catch (e) {
				// skip invalid tr element (don't throw error)
			}
			if ("childNodes" in currentElement) {
				for (const childNodesKey in currentElement.childNodes) {
					if (currentElement.childNodes[childNodesKey] !== undefined) {
						stack.push(currentElement.childNodes[childNodesKey]);
					}
				}
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
						building.shortname = getTDTextValue(trChildNode).trim();
						codeSet = true;
						break;
					case "views-field views-field-title":
						building.fullname = getBuildingName(trChildNode).trim();
						nameSet = true;
						break;
					case "views-field views-field-field-building-address":
						building.address = getTDTextValue(trChildNode).trim();
						addressSet = true;
						break;
					case "views-field views-field-nothing":
						building.path = getBuildingFilePath(trChildNode).trim();
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

function getBuildingName(tdElement: any): string {
	for(const tdChildNodeKey in tdElement.childNodes) {
		const tdChildNode = tdElement.childNodes[tdChildNodeKey];
		if(tdChildNode.nodeName === "a") {
			return getTDTextValue(tdChildNode);
		}
	}
	return "";
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
