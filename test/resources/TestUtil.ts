import * as fs from "fs-extra";
import {InsightDatasetKind} from "../../src/controller/IInsightFacade";

const persistDir = "./data";

function getContentFromArchives(name: string, kind: InsightDatasetKind): string {
	if(kind === InsightDatasetKind.Courses) {
		return fs.readFileSync(`test/resources/archives/courses/${name}`).toString("base64");
	} else {
		return fs.readFileSync(`test/resources/archives/rooms/${name}`).toString("base64");
	}
}


function clearDisk(): void {
	fs.removeSync(persistDir);
}

export {getContentFromArchives, persistDir, clearDisk};
