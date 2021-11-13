import Server from "../../src/rest/Server";
import InsightFacade from "../../src/controller/InsightFacade";
import chai, {expect, use} from "chai";
import chaiHttp from "chai-http";
import {fail} from "assert";
import {clearDisk, getContentFromArchives} from "../resources/TestUtil";
import {InsightDatasetKind, InsightError} from "../../src/controller/IInsightFacade";
import * as fs from "fs-extra";

describe("Facade D3", function () {

	const PORT = 4321;
	const SERVER_URL = "http://localhost:" + PORT;

	let facade: InsightFacade;
	let server: Server;

	use(chaiHttp);

	before( async function () {
		facade = new InsightFacade();
		server = new Server(PORT);
		try {
			await server.start();
		} catch(e) {
			fail("Failed to start server:" + e);
		}
	});

	after( async function () {
		try {
			await server.stop();
		} catch(e) {
			fail("Failed to stop server:" + e);
		}
	});

	beforeEach(function () {
		console.log("Server Testing: Starting new test...");
		clearDisk();
		server.clear();
	});

	afterEach(function () {
		console.log("Server Testing: Ending test...");
	});

	// it("echo test", function () {
	// 	console.log("Server Testing: Echo test");
	// 	const ENDPOINT_URL = "/echo/hello";
	// 	try {
	// 		return chai.request(SERVER_URL)
	// 			.get(ENDPOINT_URL)
	// 			.then(function (res) {
	// 				expect(res.status).to.be.equal(200);
	// 			})
	// 			.catch(function (err) {
	// 				expect.fail(err);
	// 			});
	// 	} catch (err: any) {
	// 		expect.fail(err);
	// 	}
	// });

	it("Put dataset resolves", function () {
		console.log("Server Testing: Put dataset resolves");
		const ENDPOINT_URL = "/dataset/ID/courses";
		const ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/courses/courses.zip");
		try {
			return chai.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res) {
					expect(res.status).to.be.equal(200);
					expect(res.body).to.have.property("result");
					console.log(`Server Testing: Result: ${JSON.stringify(res.body.result)}`);

					const out = res.body.result;
					expect(out).to.be.an.instanceOf(Array);
					expect(out).to.have.length(1);
					expect(out.includes("ID")).to.equals(true);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
	});

	it("Put dataset rejects", function () {
		console.log("Server Testing: Put dataset rejects");
		const ENDPOINT_URL = "/dataset/ID/courses";
		const ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/courses/emptyCourses.zip");
		try {
			return chai.request(SERVER_URL)
				.put(ENDPOINT_URL)
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res) {
					expect(res.status).to.be.equal(400);
					expect(res.body).to.have.property("error");
					expect(res.body.error).to.be.a("string");
					console.log(`Server Testing: Result: ${JSON.stringify(res.body.error)}`);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
	});

	it("Delete dataset resolves",  async function () {
		console.log("Server Testing: Delete dataset resolves");
		const ENDPOINT_URL = "/dataset/ID";
		const ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/courses/courses.zip");
		try {
			await chai.request(SERVER_URL)
				.put(ENDPOINT_URL + "/courses")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res) {
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}

		try {
			return chai.request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res) {
					expect(res.status).to.be.equal(200);
					expect(res.body).to.have.property("result");
					console.log(`Server Testing: Result: ${JSON.stringify(res.body.result)}`);

					const out = res.body.result;
					expect(out).to.be.a("string");
					expect(out).to.be.equal("ID");
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
	});

	it("Delete dataset rejects with InsightError", function () {
		console.log("Server Testing: Delete dataset rejects with InsightError");
		const ENDPOINT_URL = "/dataset/ID_";
		try {
			return chai.request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res) {
					expect(res.status).to.be.equal(400);
					expect(res.body).to.have.property("error");
					expect(res.body.error).to.be.a("string");
					console.log(`Server Testing: Result: ${JSON.stringify(res.body.error)}`);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
	});

	it("Delete dataset rejects with NotFoundError", function () {
		console.log("Server Testing: Delete dataset rejects with NotFoundError");
		const ENDPOINT_URL = "/dataset/ID";
		try {
			return chai.request(SERVER_URL)
				.delete(ENDPOINT_URL)
				.then(function (res) {
					expect(res.status).to.be.equal(404);
					expect(res.body).to.have.property("error");
					expect(res.body.error).to.be.a("string");
					console.log(`Server Testing: Result: ${JSON.stringify(res.body.error)}`);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
	});

	it("Get dataset resolves",  async function () {
		console.log("Server Testing: Get dataset resolves");
		const ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/courses/courses.zip");
		try {
			await chai.request(SERVER_URL)
				.put("/dataset/ID/courses")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res) {
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
		const ENDPOINT_URL = "/datasets";
		try {
			return chai.request(SERVER_URL)
				.get(ENDPOINT_URL)
				.then(function (res) {
					expect(res.status).to.be.equal(200);
					expect(res.body).to.have.property("result");
					console.log(`Server Testing: Result: ${JSON.stringify(res.body.result)}`);

					const out = res.body.result;
					expect(out).to.be.an.instanceOf(Array);
					expect(out).to.have.length(1);
					expect(out).to.deep.equal([{
						id: "ID",
						kind: InsightDatasetKind.Courses,
						numRows: 64612
					}]);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
	});

	it("Post query resolves",  async function () {
		console.log("Server Testing: Post query resolves");
		const ZIP_FILE_DATA = fs.readFileSync("test/resources/archives/courses/courses.zip");
		try {
			await chai.request(SERVER_URL)
				.put("/dataset/ID/courses")
				.send(ZIP_FILE_DATA)
				.set("Content-Type", "application/x-zip-compressed")
				.then(function (res) {
					expect(res.status).to.be.equal(200);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
		const ENDPOINT_URL = "/query";
		const QUERY_JSON = {
			WHERE: {
				GT: {
					ID_avg: 99
				}
			},
			OPTIONS: {
				COLUMNS: [
					"ID_dept",
					"ID_instructor",
					"ID_avg"
				],
				ORDER: "ID_avg"
			}
		};
		try {
			return chai.request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(QUERY_JSON)
				.set("Content-Type", "application/json")
				.then(function (res) {
					expect(res.status).to.be.equal(200);
					expect(res.body).to.have.property("result");
					console.log(`Server Testing: Result: ${JSON.stringify(res.body.result)}`);

					const out = res.body.result;
					expect(out).to.be.an.instanceOf(Array);
					expect(out).to.have.length(3);
					expect(out).to.have.deep.members( [{ID_dept:"cnps",ID_instructor:"cox, daniel",ID_avg:99.19},
						{ID_dept:"math",ID_instructor:"",ID_avg:99.78},
						{ID_dept:"math",ID_instructor:"gomez, jose",ID_avg:99.78}]);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
	});

	it("Post query rejects",  async function () {
		console.log("Server Testing: Post query rejects");
		const ENDPOINT_URL = "/query";
		const QUERY_JSON = {
			WHERE: {
				GT: {
					courses_avg: 99
				}
			},
			OPTIONS: {
				COLUMNS: [
					"courses_dept",
					"rooms_instructor", // error here
					"courses_avg"
				],
				ORDER: "courses_avg"
			}
		};
		try {
			return chai.request(SERVER_URL)
				.post(ENDPOINT_URL)
				.send(QUERY_JSON)
				.set("Content-Type", "application/json")
				.then(function (res) {
					expect(res.status).to.be.equal(400);
					expect(res.body).to.have.property("error");
					expect(res.body.error).to.be.a("string");
					console.log(`Server Testing: Result: ${JSON.stringify(res.body.error)}`);
				})
				.catch(function (err) {
					expect.fail("Server Testing: Error:" + err);
				});
		} catch (err: any) {
			expect.fail("Server Testing: Error:" + err);
		}
	});


	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
	// https://www.chaijs.com/plugins/chai-http/
});
