import * as fs from "fs-extra";

const persistDir = "./data";

// eslint-disable-next-line @typescript-eslint/ban-types
function getContentFromArchives(name: String): string {
	return fs.readFileSync(`test/resources/archives/${name}`).toString("base64");
}

function clearDisk(): void {
	fs.removeSync(persistDir);
}

export {getContentFromArchives, persistDir, clearDisk};
