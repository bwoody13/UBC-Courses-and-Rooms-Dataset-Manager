import {IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	NotFoundError} from "./IInsightFacade";
import * as fs from "fs-extra";
import {Dataset, RoomDataset, SectionDataset} from "../objects/Dataset";
import JSZip from "jszip";
import {datasetExistsReject, datasetExists, invalidIDReject, invalidID} from "../resources/Util";
import {Query} from "../objects/query_structure/Query";
import {parseQuery} from "../resources/QueryParser";
import {Section} from "../objects/Section";
import parse5 from "parse5";
import {Room} from "../objects/Room";

export const DATASETS_DIRECTORY = "data/";
const COURSES_DIR_NAME = "courses/";
const ROOMS_DIR_NAME = "rooms/";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {

	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// reject if ID is invalid
		if (invalidID(id)) {
			return invalidIDReject();
		}

		// ensure there are no other datasets with the same id
		if (await datasetExists(id)) {
			return datasetExistsReject();
		}
		// load content directory
		let dir;
		try {
			dir = await JSZip.loadAsync(content, {base64: true});
		} catch (e) {
			return Promise.reject(new InsightError("Error loading zip file: " +
				"invalid zip data or using unsupported features."));
		}

		let dataset: Dataset;
		if (kind === InsightDatasetKind.Courses) {
			dataset = await this.addCoursesDataset(id, dir);
		} else {
			dataset = await this.addRoomsDataset(id, dir);
		}
		// reject if there are no valid course sections in the dataset
		if (!dataset.numRows) {
			return Promise.reject(new InsightError("No valid rows in dataset."));
		}
		// save the dataset to disk
		await fs.ensureDir(DATASETS_DIRECTORY);
		await fs.writeJSON(DATASETS_DIRECTORY + id + ".json", dataset.toJSONObject());

		// return an array of strings of the names of all added datasets
		const datasetFileNames = await fs.readdir(DATASETS_DIRECTORY);
		const datasetIDs = datasetFileNames.map(function(fileName) {
			return fileName.replace(".json", "");
		});

		return Promise.resolve(datasetIDs);
	}

	private async addCoursesDataset(id: string, dir: JSZip): Promise<Dataset> {
		// reject if 'courses' directory is missing
		const coursesFile = dir.files[COURSES_DIR_NAME];
		if (!coursesFile || !coursesFile.dir) {
			return Promise.reject(new InsightError("Courses folder is missing or not in the root directory."));
		}
		const courseFilePromises: Array<Promise<string>> = [];
		// convert course files to strings to prepare for parsing
		dir.folder("courses")?.forEach(function (relativePath,file) {
			if(!file.dir) {
				courseFilePromises.push(file.async("string"));
			}
		});
		const courseFiles = await Promise.all(courseFilePromises);
		// setup the dataset object
		let dataset = new SectionDataset(id);
		// parse the course file string data into Course objects
		for(const courseFileData of courseFiles) {
			try {
				dataset.addSections(JSON.parse(courseFileData));
			} catch(e) {
				console.warn("Failed to parse JSON file: " + e);
			}
		}
		return Promise.resolve(dataset);

	}

	private async addRoomsDataset(id: string, dir: JSZip): Promise<Dataset> {
		// reject if 'rooms' directory is missing
		const coursesFile = dir.files[ROOMS_DIR_NAME];
		if (!coursesFile || !coursesFile.dir) {
			return Promise.reject(new InsightError("Rooms folder is missing or not in the root directory."));
		}
		// parse the index.htm file
		const indexFile = dir.folder("rooms")?.file("index.htm");
		if(!indexFile) {
			throw new InsightError("Missing index.htm file in Rooms folder.");
		}
		const indexString = await indexFile.async("string");
		let indexDocument: parse5.Document;
		try {
			indexDocument = parse5.parse(indexString);
		} catch(e) {
			throw new InsightError("Parse5 failed to parse index.htm");
		}
		// this may not be necessary
		if(indexDocument == null) {
			throw new InsightError("Parse5 failed to parse index.htm");
		}

		let dataset = new RoomDataset(id);
		const buildingFilePaths = this.parseIndex(indexDocument);
		if(buildingFilePaths.length === 0) {
			throw new InsightError("No valid building file paths found within index.");
		}

		for(const buildingFilePath of buildingFilePaths) {
			const path = ROOMS_DIR_NAME + buildingFilePath.substr(2, buildingFilePath.length);
			const buildingFile = dir.file(path);
			if(buildingFile != null) {
				const buildingFileString = await buildingFile.async("string");
				try {
					const buildingDocument = parse5.parse(buildingFileString);
					if(buildingDocument != null) {
						dataset.addRooms(buildingDocument);
					}
				} catch(e) {
					// skip building if it failed to parse
				}
			}
		}
		return dataset;
	}

	// parse Index document by traversing the json tree to find td elements that link
	// to building files
	private parseIndex(document: any): string[] {
		let buildingFilePaths: string[] = [];
		let stack = [];
		stack.push(document);
		while(stack.length !== 0) {
			const currentElement = stack.pop();
			try {
				if (currentElement.nodeName === "td" && this.isValidTDElement(currentElement)) {
					const buildingFilePath = this.getBuildingFilePath(currentElement);
					if (buildingFilePath !== "") {
						if(!buildingFilePaths.includes(buildingFilePath)) {
							buildingFilePaths.push(buildingFilePath);
						}
					}
				}
			} catch(e) {
				// skip invalid td element (don't throw error)
			}
			if(currentElement.childNodes != null) {
				for(const childNodesKey in currentElement.childNodes) {
					stack.push(currentElement.childNodes[childNodesKey]);
				}
			}
		}
		return buildingFilePaths;
	}

	private getBuildingFilePath(tdElement: any): string {
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
	private isValidTDElement(tdElement: any): boolean {
		const validTDElementClass = "views-field views-field-title";
		return tdElement.attrs[0].name === "class" && tdElement.attrs[0].value === validTDElementClass;
	}

	public async removeDataset(id: string): Promise<string> {
		// check for a valid id
		if(invalidID(id)) {
			return invalidIDReject();
		}
		// check if dataset exists
		if(await datasetExists(id)) {
			// remove from disk
			fs.removeSync(DATASETS_DIRECTORY + id + ".json");
			// return id upon successful remove
			return Promise.resolve(id);
		}
		return Promise.reject(new NotFoundError("Dataset with id=" + id + " does not exist."));
	}

	public async performQuery(query: any): Promise<any[]> {
		let queryObj: Query;
		try {
			queryObj = parseQuery(query);
		} catch(e) {
			return Promise.reject(new InsightError("Error parsing Query: " + e));
		}
		let dataset: SectionDataset;
		try {
			dataset = await fs.readJSON(DATASETS_DIRECTORY + Query.ID + ".json");
		} catch(e) {
			return Promise.reject(new InsightError("Error reading dataset: " + e));
		}
		let filteredSections: Section[];
		try {
			filteredSections = queryObj.performFilter(dataset);
		} catch(e) {
			return Promise.reject(e);
		}
		let out: any[];
		try {
			out = queryObj.getOutput(filteredSections);
		} catch(e) {
			return Promise.reject(new InsightError("Error getting output: " + e));
		}
		// console.log(out);
		return Promise.resolve(out);
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		let datasetList: InsightDataset[] = [];
		try {
			const datasetFileNames = await fs.readdir(DATASETS_DIRECTORY);
			for(const datasetFileName of datasetFileNames) {
				const dataset = await fs.readJSON(DATASETS_DIRECTORY + datasetFileName);
				datasetList.push({
					id: dataset.id,
					kind: dataset.kind,
					numRows: dataset.numRows
				});
			}
		} catch(e) {
			// if reading the dataset directory fails just return an empty dataset list
		}
		return Promise.resolve(datasetList);
	}
}
