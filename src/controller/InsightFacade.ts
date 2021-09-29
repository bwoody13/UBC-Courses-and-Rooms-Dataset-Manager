import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as fs from "fs-extra";
import {Dataset, DatasetData} from "../objects/Dataset";
import {Course} from "../objects/Course";
import JSZip from "jszip";
import {datasetExistsReject, datasetExists, invalidIDReject, invalidID} from "../resources/Util";

const COURSES_DIR_NAME = "courses/";
export const DATASETS_DIRECTORY = "data/";

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
		// reject if kind is InsightDatasetKind Rooms
		// TODO: Remove this code in future checkpoints
		if (kind === InsightDatasetKind.Rooms) {
			return Promise.reject(new InsightError("Invalid InsightDatasetKind: Rooms"));
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
		// reject if 'courses' directory is missing
		const coursesFile = dir.files[COURSES_DIR_NAME];
		if (!coursesFile || !coursesFile.dir) {
			return Promise.reject(new InsightError("Courses folder is missing or not in the root directory."));
		}
		const courseFilePromises: Array<Promise<string>> = [];
		// convert course files to strings to prepare for parsing
		dir.folder("courses")?.forEach(function (relativePath, file) {
			if(!file.dir) {
				courseFilePromises.push(file.async("string"));
			}
		});
		const courseFiles = await Promise.all(courseFilePromises);
		// setup the dataset object
		let dataset = new Dataset(id, kind);
		// parse the course file string data into Course objects
		for(const courseFileData of courseFiles) {
			try {
				const jsonObj = JSON.parse(courseFileData);
				// skip file if JSON could not be parsed
				if(jsonObj) {
					try {
						// TODO: check for properties within the Json Object to ensure safe casting
						//		 https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/in
						let course: Course = jsonObj as Course;
						dataset.addCourse(course);
					} catch(e) {
						// skip file if it could not be cast
						console.warn("Failed to cast JSON Object to Course: " + e);
					}
				} else {
					console.warn("Failed to parse JSON file.");
				}
			} catch(e) {
				console.warn("Failed to parse JSON file: " + e);
			}
		}
		// reject if there are no valid course sections in the dataset
		if (!dataset.numRows) {
			return Promise.reject(new InsightError("No valid course sections."));
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

	public async removeDataset(id: string): Promise<string> {
		// check for a valid id
		if(invalidID(id)) {
			return invalidIDReject();
		}
		// check if dataset exists
		if(await datasetExists(id)) {
			// remove from disk
			fs.removeSync(DATASETS_DIRECTORY + id + ".json");
			// TODO: remove from memory cache?
			// return id upon successful remove
			return Promise.resolve(id);
		}
		return Promise.reject(new NotFoundError("Dataset with id=" + id + " does not exist."));
	}

	public performQuery(query: any): Promise<any[]> {
		return Promise.reject(new InsightError("Not Implemented"));
	}

	public async listDatasets(): Promise<InsightDataset[]> {
		let datasetList: InsightDataset[] = [];
		try {
			const datasetFileNames = await fs.readdir(DATASETS_DIRECTORY);
			for(const datasetFileName of datasetFileNames) {
				const dataset = await fs.readJSON(DATASETS_DIRECTORY + datasetFileName) as unknown as DatasetData;
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
