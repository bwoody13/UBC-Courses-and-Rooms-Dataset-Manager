import {DatasetItem} from "./Dataset";

export interface Section {
	title: string; // Title
	uuid: string; // id
	instructor: string; // Professor
	audit: number; // Audit
	year: number; // Year
	id: string; // Course
	pass: number; // Pass
	fail: number; // Fail
	avg: number; // Avg
	dept: string // Subject
}
