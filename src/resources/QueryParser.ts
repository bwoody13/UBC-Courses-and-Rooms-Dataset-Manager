import {Query} from "../objects/query_structure/Query";

export function parseQuery(queryJSON: any): Query {
	const queryObj = JSON.parse(queryJSON);
	const query = new Query();
	if (queryObj.WHERE) {
		for(const key of Object.keys(queryObj.WHERE)) {
			console.log(key);
		}
	}
	return query;
}
