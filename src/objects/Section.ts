import {DatasetItem} from "./Dataset";

export interface Section {
	_title: string; // Title
	_uuid: string; // id
	_instructor: string; // Professor
	_audit: number; // Audit
	_year: number; // Year
	_id: string; // Course
	_pass: number; // Pass
	_fail: number; // Fail
	_avg: number; // Avg
	_dept: string // Subject
}
