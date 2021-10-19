import {IInsightFacade,
	InsightDataset,
	InsightDatasetKind,
	InsightError,
	NotFoundError} from "./IInsightFacade";
import * as fs from "fs-extra";
import {Dataset, RoomDataset, SectionDataset, DatasetItem} from "../objects/Dataset";
import JSZip from "jszip";
import {datasetExistsReject, datasetExists, invalidIDReject, invalidID} from "../resources/Util";
import {parseQuery} from "../resources/QueryParser";
import {Section} from "../objects/Section";
import parse5 from "parse5";
import {Room} from "../objects/Room";
import {BuildingInfo} from "../objects/BuildingInfo";
import {parseIndex} from "../resources/RoomParser";
import {Query} from "../objects/query_structure/Query";

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
		const buildings = parseIndex(indexDocument);
		if(buildings.length === 0) {
			throw new InsightError("No valid building info found within index.");
		}

		for(const buildingInfo of buildings) {
			const path = ROOMS_DIR_NAME + buildingInfo.path.substr(2, buildingInfo.path.length);
			const buildingFile = dir.file(path);
			if(buildingFile != null) {
				const buildingFileString = await buildingFile.async("string");
				try {
					const buildingDocument = parse5.parse(buildingFileString);
					if(buildingDocument != null) {
						// const buildingCode = buildingFilePath.substring(buildingFilePath.lastIndexOf("/") + 1,
						// 	buildingFilePath.length);
						dataset.addRooms(buildingInfo, buildingDocument);
					}
				} catch(e) {
					// skip building if it failed to parse
				}
			}
		}
		return dataset;
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
		let out: any[];
		if (Query.TYPE === "COURSE") {
			out = await this.performSectionQuery(queryObj);
		} else {
			out = await this.performRoomQuery(queryObj);
		}
		return Promise.resolve(out);
	}

	private async performSectionQuery(query: Query): Promise<any[]> {
		let dataset: SectionDataset;
		let out: any[];
		try {
			dataset = await fs.readJSON(DATASETS_DIRECTORY + Query.ID + ".json");
		} catch(e) {
			return Promise.reject(new InsightError("Error reading dataset: " + e));
		}
		let filteredSections: Section[];
		try {
			filteredSections = query.performSectionFilter(dataset);
		} catch(e) {
			return Promise.reject(e);
		}
		try {
			out = query.getOutput(filteredSections);
		} catch(e) {
			return Promise.reject(new InsightError("Error getting output: " + e));
		}
		return out;
	}

	private async performRoomQuery(query: Query):  Promise<any[]> {
		let dataset: RoomDataset;
		let out: any[];
		try {
			dataset = await fs.readJSON(DATASETS_DIRECTORY + Query.ID + ".json");
		} catch(e) {
			return Promise.reject(new InsightError("Error reading dataset: " + e));
		}
		let filteredRooms: Room[];
		try {
			filteredRooms = query.performRoomFilter(dataset);
		} catch(e) {
			return Promise.reject(e);
		}
		try {
			out = query.getOutput(filteredRooms);
		} catch(e) {
			return Promise.reject(new InsightError("Error getting output: " + e));
		}
		return out;
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
