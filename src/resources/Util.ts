import * as fs from "fs-extra";
import {InsightError} from "../controller/IInsightFacade";
import {DATASETS_DIRECTORY} from "../controller/InsightFacade";

export function invalidID(id: string): boolean {
	return (id.includes("_") || !id.trim());
}

export async function datasetExists(id: string): Promise<boolean> {
	const datasetPath = DATASETS_DIRECTORY + id + ".json";
	if(await fs.pathExists(datasetPath)) {
		return Promise.resolve(true);
	}
	return Promise.resolve(false);
}

export function invalidIDReject() {
	return Promise.reject(new InsightError("ID is invalid: An id is invalid if it contains an underscore, " +
		"or is only whitespace characters."));
}

export function datasetExistsReject() {
	return Promise.reject(new InsightError("A dataset with that ID already exists."));
}
