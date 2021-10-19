export interface Room {
	fullname: string, // index/info (building name)
	shortname: string, // index/filename (code)
	address: string, // index/info (building address)
	number: string, // info (room #)
	name: string, // shortname_number
	lat: number, // latitude from http request
	lon: number, // longitude from http request
	seats: number, // index/info (capacity) default 0
	type: string, // info (room type)
	furniture: string, // info (furniture type)
	href: string // info
}
