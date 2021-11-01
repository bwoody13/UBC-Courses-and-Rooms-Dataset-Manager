import * as fs from "fs-extra";
import {InsightError} from "../controller/IInsightFacade";
import {DATASETS_DIRECTORY} from "../controller/InsightFacade";
import {Query} from "../objects/query_structure/Query";
import {Section} from "../objects/Section";
import {Room} from "../objects/Room";

export const courseMKeys: string[] = ["avg", "pass", "fail", "audit", "year"];
export const roomMKeys: string[] = ["lat", "lon", "seats"];
export const courseSKeys: string[] = ["dept", "id", "instructor", "title", "uuid"];
export const roomSKeys: string[] = ["fullname", "shortname", "number", "name", "address", "type", "furniture", "href"];
export const validCourseKeys: string[] = courseMKeys.concat(courseSKeys);
export const validRoomKeys: string[] = roomMKeys.concat(roomSKeys);
export const validQueryKeys: string[] = validCourseKeys.concat(validRoomKeys);
export const mKeys: string[] = courseMKeys.concat(roomMKeys);
export const sKeys: string[] = courseSKeys.concat(roomSKeys);


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

export function getSectionRoomKey(key: string, dataItem: any) {
	if (Query.TYPE === "COURSE") {
		return dataItem[key as keyof Section];
	} else {
		return dataItem[key as keyof Room];
	}
}

export function extractKey(key: string): string {
	const underscoreLoc: number = key.indexOf("_");
	if (underscoreLoc === -1) {
		throw new InsightError("Invalid query key: " + key);
	}

	const k = key.substring(underscoreLoc + 1);
	let type: string;
	if (validCourseKeys.includes(k)) {
		type = "COURSE";
	} else if (validRoomKeys.includes(k)) {
		type = "ROOM";
	} else {
		throw new InsightError("Invalid query key: " + key);
	}

	const datasetID = key.substring(0, underscoreLoc);
	if (Query.ID) {
		if (Query.ID !== datasetID) {
			throw new InsightError("Invalid ID in query key: " + datasetID + ", Query ID: " + Query.ID);
		}
		if (Query.TYPE !== type) {
			throw new InsightError("Invalid query. Use of both rooms and course fields in query.");
		}
	} else {
		Query.ID = datasetID;
		Query.TYPE = type;
	}
	return k;
}

export function extractGroupKey(key: string): string {
	let k: string;
	if (key.includes("_")) {
		k = extractKey(key);
	} else {
		k = key;
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

