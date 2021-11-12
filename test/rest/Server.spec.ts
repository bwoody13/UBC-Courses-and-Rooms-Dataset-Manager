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

	it("Add valid dataset", function () {
		console.log("Server Testing: Add valid dataset");
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

	it("Add invalid dataset", function () {
		console.log("Server Testing: Add invalid dataset");
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


	// The other endpoints work similarly. You should be able to find all instructions at the chai-http documentation
	// https://www.chaijs.com/plugins/chai-http/
});
