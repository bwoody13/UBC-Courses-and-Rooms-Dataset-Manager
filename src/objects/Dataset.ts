import {Section} from "./Section";
import {Course} from "./Course";
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

	public addCourse(course: Course) {
		for (const section of course.result) {
			this.sections.push(section);
		}
		this._numRows += course.result.length;
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
