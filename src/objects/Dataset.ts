import {Section} from "./Section";
import {InsightDatasetKind} from "../controller/IInsightFacade";

export interface DatasetData {
	id: string;
	kind: InsightDatasetKind;
	numRows: number;
	sections: Section[];
}

export class Dataset {
	private readonly _id: string;
	private readonly _kind: InsightDatasetKind;
	private _numRows: number;
	private readonly _sections: Section[];

	constructor(id: string, kind: InsightDatasetKind, numRows?: number, sections?: Section[]) {
		this._id = id;
		this._kind = kind;
		this._numRows = numRows || 0;
		this._sections = sections || [];
	}

	public get id(): string {
		return this._id;
	}

	public get kind(): InsightDatasetKind {
		return this._kind;
	}

	public get numRows(): number {
		return this._numRows;
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
			kind: this._kind,
			numRows: this._numRows,
			sections: this.sections
		};
	}
}
