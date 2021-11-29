import {Section} from "./Section";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {Room} from "./Room";
import parse5 from "parse5";
import {BuildingInfo} from "./BuildingInfo";
import {parseBuilding} from "../resources/BuildingParser";
import * as http from "http";
import {IncomingMessage} from "http";
import {Query} from "./query_structure/Query";

export type DatasetItem = Section | Room;
export type Results = Section[] | Room[];

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
			room._fullname = building.fullname;
			room._shortname = building.shortname;
			room._address = building.address;
			room._name = room._shortname + "_" + room._number;
			room._lat = geoResponse.lat;
			room._lon = geoResponse.lon;
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
					section._title = jsonSection.Title;
					section._uuid = jsonSection.id.toString(10);
					section._instructor = jsonSection.Professor;
					section._audit = jsonSection.Audit;
					if (jsonSection.Section === "overall") {
						section._year = 1900;
					} else {
						section._year = parseInt(jsonSection.Year, 10);
					}
					section._id = jsonSection.Course;
					section._pass = jsonSection.Pass;
					section._fail = jsonSection.Fail;
					section._avg = jsonSection.Avg;
					section._dept = jsonSection.Subject;
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
