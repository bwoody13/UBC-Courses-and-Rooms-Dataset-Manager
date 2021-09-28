import {IInsightFacade, InsightDataset, InsightDatasetKind, InsightError, NotFoundError} from "./IInsightFacade";
import * as fs from "fs-extra";
import {Dataset} from "../objects/Dataset";
import {Course} from "../objects/Course";
import JSZip from "jszip";

const COURSES_DIR_NAME = "courses/";

/**
 * This is the main programmatic entry point for the project.
 * Method documentation is in IInsightFacade
 *
 */
export default class InsightFacade implements IInsightFacade {


	public async addDataset(id: string, content: string, kind: InsightDatasetKind): Promise<string[]> {
		// reject if ID is invalid
		if (id.includes("_") || !id.trim()) {
			return Promise.reject(new InsightError("ID is invalid: An id is invalid if it contains an underscore, " +
				"or is only whitespace characters."));
		}
		// reject if kind is InsightDatasetKind Rooms
		// TODO: Remove this code in future checkpoints
		if (kind === InsightDatasetKind.Rooms) {
			return Promise.reject(new InsightError("Invalid InsightDatasetKind: Rooms"));
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
		// setup dataset object
		// TODO: load in all of the added datasets
		// TODO: ensure there are no other datasets with the same id
		let dataset = new Dataset(id, kind);
		// parse the course file string data into Course objects
		for(const courseFileData of courseFiles) {
			const jsonObj = JSON.parse(courseFileData);
			// skip file if JSON could not be parsed
			if(jsonObj) {
				try {
					let course: Course = jsonObj as Course;
					dataset.addCourse(course);
				} catch(e) {
					// skip file if it could not be cast
					console.warn("Failed to cast JSON Object to Course: " + e);
				}
			}
		}
		// reject if there are no valid course sections in the dataset
		if (!dataset.numRows) {
			return Promise.reject(new InsightError("No valid course sections."));
		}
		// TODO: save the dataset to disk
		await fs.mkdirp("data/");
		await fs.writeJSON("data/dataset.json", dataset.toJSONObject());
		// TODO: return an array of strings of the names of added datasets
		return Promise.resolve([]);
	}

	public removeDataset(id: string): Promise<string> {
		return Promise.reject(new InsightError("Not Implemented"));
	}

	public performQuery(query: any): Promise<any[]> {
		return Promise.reject(new InsightError("Not Implemented"));
	}

	public listDatasets(): Promise<InsightDataset[]> {
		return Promise.reject(new InsightError("Not Implemented"));
	}
}
