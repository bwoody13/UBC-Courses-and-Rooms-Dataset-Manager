import {Section} from "./Section";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {Room} from "./Room";
import parse5 from "parse5";
import {BuildingInfo} from "./BuildingInfo";
import {parseBuilding} from "../resources/BuildingParser";
import * as http from "http";
import {IncomingMessage} from "http";

export abstract class Dataset {
	protected readonly _id: string;
	protected _numRows: number;

	protected constructor(id: string, numRows?: number) {
		this._id = id;
		this._numRows = numRows || 0;
	}

	public get id(): string {
		return this._id;
	}

	public get numRows(): number {
		return this._numRows;
	}

	public abstract toJSONObject(): any;
}

interface GeoResponse {
	lat?: number;
	lon?: number;
	error?: string;
}

export class RoomDataset extends Dataset {
	private readonly _rooms: Room[];

	constructor(id: string, numRows?: number, rooms?: Room[]) {
		super(id, numRows);
		this._rooms = rooms || [];
	}

	public get rooms(): Room[] {
		return this._rooms;
	}

	public async addRooms(building: BuildingInfo, document: parse5.Document) {
		const HTTP_ADDRESS = "http://cs310.students.cs.ubc.ca:11316/api/v1/project_team053/";
		const rooms = parseBuilding(document);

		// Reference: https://nodejs.org/api/http.html#http_http_get_url_options_callback
		const geoResponse = await new Promise<GeoResponse>((resolve, reject) => {
			http.get(HTTP_ADDRESS + building.address.replace(/\s/gi, "%20"),
				(res) => {
					let rawData = "";
					res.on("data", (buf) => {
						rawData += buf;
					});
					res.on("end", () => {
						try {
							resolve(JSON.parse(rawData) as GeoResponse);
						} catch (e) {
							reject({error: "Failed to parse geoLocation data"} as GeoResponse);
						}
					});
					res.on("error", (e) => {
						reject({error: e.toString()} as GeoResponse);
					});
				});
		});

		if (geoResponse == null || "error" in geoResponse || geoResponse.lat == null || geoResponse.lon == null) {
			return;
		}

		for(const roomKey in rooms) {
			const room = rooms[roomKey];
			room.fullname = building.fullname;
			room.shortname = building.shortname;
			room.address = building.address;
			room.name = room.shortname + "_" + room.number;
			room.lat = geoResponse.lat;
			room.lon = geoResponse.lon;
			this._rooms.push(room);
			this._numRows++;
		}
	}

	public toJSONObject() {
		return {
			id: this._id,
			kind: InsightDatasetKind.Rooms,
			numRows: this._numRows,
			rooms: this._rooms
		};
	}
}


export class SectionDataset extends Dataset {
	private readonly _sections: Section[];

	constructor(id: string, numRows?: number, sections?: Section[]) {
		super(id, numRows);
		this._sections = sections || [];
	}

	public get sections(): Section[] {
		return this._sections;
	}

	public addSections(jsonObj: any) {
		if (!jsonObj) {
			return;
		}
		let numValidSections = 0;
		for (const jsonSection of jsonObj.result) {
			let section = {} as Section;
			let containsAllProperties = true;
			const sectionPropertiesNums = ["id", "Audit", "Pass", "Fail", "Avg"];
			const sectionPropertiesStrings = ["Title", "Professor", "Year", "Course", "Subject"];
			const sectionProperties: any[] = [...sectionPropertiesNums, ...sectionPropertiesStrings];
			for(const prop in sectionProperties) {
				if(!(sectionProperties[prop] in jsonSection)) {
					containsAllProperties = false;
				}
			}
			if (containsAllProperties) {
				let allCorrectType = true;
				for(const prop in sectionPropertiesNums) {
					if(!(typeof jsonSection[sectionPropertiesNums[prop]] === "number")) {
						allCorrectType = false;
					}
				}
				for(const prop in sectionPropertiesNums) {
					if(!(typeof jsonSection[sectionPropertiesStrings[prop]] === "string")) {
						allCorrectType = false;
					}
				}
				if (allCorrectType) {
					section.title = jsonSection.Title;
					section.uuid = jsonSection.id.toString(10);
					section.instructor = jsonSection.Professor;
					section.audit = jsonSection.Audit;
					if (jsonSection.Section === "overall") {
						section.year = 1900;
					} else {
						section.year = parseInt(jsonSection.Year, 10);
					}
					section.id = jsonSection.Course;
					section.pass = jsonSection.Pass;
					section.fail = jsonSection.Fail;
					section.avg = jsonSection.Avg;
					section.dept = jsonSection.Subject;
					this._sections.push(section);
					numValidSections++;
				}
			}
		}
		this._numRows += numValidSections;
	}

	public toJSONObject() {
		return {
			id: this._id,
			kind: InsightDatasetKind.Courses,
			numRows: this._numRows,
			sections: this._sections
		};
	}
}
