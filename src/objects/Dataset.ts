import {Section} from "./Section";
import {InsightDatasetKind} from "../controller/IInsightFacade";
import {Room} from "./Room";

export type DatasetItem = Room | Section;

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

	public abstract getData(): DatasetItem[];

	public abstract toJSONObject(): any;
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

	public addRooms() {
		return;
	}

	public getData(): DatasetItem[] {
		return this._rooms;
	}

	public toJSONObject() {
		return {
			id: this._id,
			kind: InsightDatasetKind.Courses,
			numRows: this._numRows,
			rooms: this._rooms};
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

	public getData(): DatasetItem[] {
		return this._sections;
	}

	public toJSONObject() {
		return {
			id: this._id,
			kind: InsightDatasetKind.Courses,
			numRows: this._numRows,
			sections: this.sections
		};
	}
}
