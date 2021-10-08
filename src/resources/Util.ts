import * as fs from "fs-extra";
import {InsightError} from "../controller/IInsightFacade";
import {DATASETS_DIRECTORY} from "../controller/InsightFacade";
import {Query} from "../objects/query_structure/Query";

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

export function extractKey(key: string): string {
	const underscoreLoc: number = key.indexOf("_");
	if (underscoreLoc === -1) {
		throw new InsightError("Invalid query key: " + key);
	}

	const k = key.substring(underscoreLoc + 1);
	const validQueryKeys = ["avg", "dept", "instructor", "title", "uuid", "pass", "fail", "audit", "year", "id"];
	if (!validQueryKeys.includes(k)) {
		throw new InsightError("Invalid query key: " + key);
	}

	const datasetID = key.substring(0, underscoreLoc);
	if (Query.ID) {
		if (Query.ID !== datasetID) {
			throw new InsightError("Invalid ID in query key: " + datasetID + ", Query ID: " + Query.ID);
		}
	} else {
		Query.ID = datasetID;
	}
	return k;
}

// export function stringToKey(str: string): Key {
// 	let key: Key;
// 	switch(str) {
// 	case "avg":
// 		key = Key.Average;
// 		break;
// 	case "pass":
// 		key = Key.Pass;
// 		break;
// 	case "fail":
// 		key = Key.Fail;
// 		break;
// 	case "audit":
// 		key = Key.Audit;
// 		break;
// 	case "year":
// 		key = Key.Year;
// 		break;
// 	case "dept":
// 		key = Key.Department;
// 		break;
// 	case "id":
// 		key = Key.ID;
// 		break;
// 	case "instructor":
// 		key = Key.Instructor;
// 		break;
// 	case "title":
// 		key = Key.Title;
// 		break;
// 	case "uuid":
// 		key = Key.UUID;
// 		break;
// 	default:
// 		throw new InsightError("invalid query key: " + str);
// 	}
// 	return key;
// }

// export function keyToSectionVal(key: string, section: Section): any {
// 	switch(key) {
// 	case Key.Average:
// 		return section.Avg;
// 	case Key.Pass:
// 		return section.Pass;
// 	case Key.Fail:
// 		return section.Fail;
// 	case Key.Audit:
// 		return section.Audit;
// 	case Key.Year:
// 		return section.Year;
// 	case Key.Department:
// 		return section.Subject;
// 	case Key.ID:
// 		return section.Course;
// 	case Key.Instructor:
// 		return section.Professor;
// 	case Key.Title:
// 		return section.Title;
// 	case Key.UUID:
// 		return section.id;
// 	default:
// 		throw new InsightError("Key to Section Error: " + key);
// 	}
// }

