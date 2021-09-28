import {Section} from "./Section";
import {Course} from "./Course";
import {InsightDatasetKind} from "../controller/IInsightFacade";

interface SerializableData {
	id: string;
	kind: InsightDatasetKind;
	numRows: number;
	sections: Section[];
}

export class Dataset {
	private readonly _id: string;
	private readonly _kind: InsightDatasetKind;
	private _numRows: number;
	private readonly sections: Section[];

	constructor(id: string, kind: InsightDatasetKind, numRows?: number, sections?: Section[]) {
		this._id = id;
		this._kind = kind;
		this._numRows = numRows || 0;
		this.sections = sections || [];
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

	public static loadFromJSON(file: string) {
		const jsonObj = JSON.parse(file);
		let data: SerializableData = jsonObj as SerializableData;
		return new Dataset(data.id, data.kind, data.numRows, data.sections);
	}
}
