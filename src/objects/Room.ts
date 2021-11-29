export interface Room {
	_fullname: string; // index/info (building name)
	_shortname: string; // index/filename (code)
	_address: string; // index/info (building address)
	_number: string; // info (room #)
	_name: string; // shortname_number
	_lat: number; // latitude from http request
	_lon: number; // longitude from http request
	_seats: number; // index/info (capacity) default 0
	_type: string; // info (room type)
	_furniture: string; // info (furniture type)
	_href: string; // info
}
