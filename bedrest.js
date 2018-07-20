/* BedREST is a nodejs based REST service for controlling a Reverie
 * MotionSIGNATURE adjustable bed foundation equipped with a Bluetooth
 * LE controller.
 * Copyright (C) 2018 Michael Powers
 * 
 * This file is part of BedREST.
 * 
 * BedREST is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * BedREST is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with BedREST. If not, see <http://www.gnu.org/licenses/>.
 */
const noble = require("noble");
const http = require("http");

/**
 * Class for BedREST, handles the web server and Bluetooth LE bits.
 */
class BedREST {
	constructor() {
		/**
		 * A map of mac addresses to bed labels. This should be populated with the
		 * beds you want to control. You can add as many as your bluetooth adapter
		 * can handle. Because many adapters don't let you scan while connected to
		 * devices, no devices will be connected until all devices are located.
		 */
		this.beds = { "00:01:02:03:04:05": "alice", "00:01:02:03:04:06": "bob" };
		/**
		 * The service UUID of the Serta MotionSIGNATURE bed.
		 */
		this.serviceUuid = "1b1d9641b9424da889cc98e6a58fbd93";
		/**
		 * The characteristic used to interact with the bed.
		 */
		this.characteristicUuid = "6af87926dc79412ea3e05f85c2d55de2";
		/**
		 * A map of all of the available bed commands without arguments.
		 */
		this.commandList = {
			"antisnore": Buffer.from("551643", "hex"),
			"flat": Buffer.from("550550", "hex"),
			"footdown": Buffer.from("550451", "hex"),
			"footup": Buffer.from("550257", "hex"),
			"headdown": Buffer.from("550356", "hex"),
			"headup": Buffer.from("550154", "hex"),
			"memrecall1": Buffer.from("551100", "hex"),
			"memrecall2": Buffer.from("551200", "hex"),
			"memrecall3": Buffer.from("551300", "hex"),
			"memrecall4": Buffer.from("551400", "hex"),
			"memsave1": Buffer.from("552100", "hex"),
			"memsave2": Buffer.from("552200", "hex"),
			"memsave3": Buffer.from("552300", "hex"),
			"memsave4": Buffer.from("552400", "hex"),
			"massagefootdown": Buffer.from("553461", "hex"),
			"massagefootup": Buffer.from("553267", "hex"),
			"massageheaddown": Buffer.from("553366", "hex"),
			"massageheadup": Buffer.from("553164", "hex"),
			"stopmotion": Buffer.from("55FFAA", "hex"),
			"stoptimer": Buffer.from("550001", "hex"),
			"lighttoggle": Buffer.from("555B", "hex"),
			"zerog": Buffer.from("551540", "hex"),
			"stopmassage": Buffer.from("553560", "hex"),
			"fullbodymassage": Buffer.from("55540A0B", "hex"),
			"stopmassagemotion": Buffer.from("550055", "hex")
		};
		/**
		 * A map of all of the available bed commands with arguments.
		 */
		this.commandListWithArgs = {
			"headposition": { min: 0, max: 0x64, pos: 2, len: 1, command: Buffer.from("55510000", "hex") },
			"footposition": { min: 0, max: 0x64, pos: 2, len: 1, command: Buffer.from("55520000", "hex") },
			"headmassage": { min: 0, max: 0x64, pos: 2, len: 1, command: Buffer.from("55530000", "hex") },
			"footmassage": { min: 0, max: 0x64, pos: 2, len: 1, command: Buffer.from("55540000", "hex") },
			"lightbrightness": { min: 0, max: 0x7c, pos: 2, len: 1, command: Buffer.from("55540000", "hex") },
			"lighttimer": { min: 0, max: 0xFFFF, pos: 2, len: 2, command: Buffer.from("55540000", "hex") }
		};
		/**
		 * Map of beds we're connected to with the label of the device as the key.
		 */
		this.bedsByLabel = new Map();
		/**
		 * Map of the beds we're connected to with the mac address of the device as key.
		 */
		this.bedsByAddress = new Map();
		/**
		 * A reference to our HTTP server.
		 */
		this.server = false;
	}

	/**
	 * Starts up BedREST by starting up the HTTP server and the Bluetooth stack.
	 */
	start() {
		//Start up HTTP server.
		this.server = http.createServer();
		this.server.on("request", (req, res)=>this.handleRequest(req,res));
		this.server.listen({"port": 8080});

		//Start up Noble
		noble.on("stateChange", (state) => {
			if(state === "poweredOn") {
				noble.startScanning([this.serviceUuid]);
			}
		});
		noble.on("discover", (device) => this.handleDiscoveredBed(device));
	}

	/**
	 * Handles requests coming from the HTTP server.
	 * @param {http.IncomingMessage} req Request from a client from the HTTP server.
	 * @param {http.ServerResponse} res Response to send back to the client. 
	 */
	handleRequest(req, res) {
		//Allow requests from other origins.
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Content-Type", "application/json");
		if(req.method === "OPTIONS") {
			res.writeHead(200);
			res.end();
			return;
		} else if(req.method !== "POST") {
			res.writeHead(405);
			res.end();
			return;
		}
		let handled = false;
		let match = req.url.match(/\/bed\/([^\/]+)\/([^\/]+)\/?([0-9a-fA-F]*)$/);
		if(match) {
			//Look up the requested bed label.
			let bed = this.bedsByLabel.get(match[1]);
			if(match[3]) {
				//This is a command with an argument.
				let cmd = this.commandListWithArgs[match[2]];
				if(bed && cmd) {
					let value = parseInt(match[3], 16);
					//Bounds check this argument.
					if(value >= cmd.min && value <= cmd.max) {
						//Bounds check is good, lets inject the argument.
						let arg = Buffer.from(match[3], "hex");
						let cmdBuffer = Buffer.from(cmd.command);
						arg.copy(cmdBuffer, cmd.pos, 0, cmd.len);
						this.sendCommand(bed, match[2], cmdBuffer, res);
						handled = true;
					}
				}
			} else {
				//This is a single command.
				let cmd = this.commandList[match[2]];
				if(bed && cmd) {
					this.sendCommand(bed, match[2], cmd, res);
					handled = true;
				}
			}
		}
		if(!handled) {
			//We didn't understand the command, bail.
			res.writeHead(404);
			res.end(JSON.stringify({
				success: false,
				error: "Invalid command, you requested: " + req.url
			}));
		}
	}

	/**
	 * Sends a command to a connected bed.
	 * @param {Bed} bed Bed to send the command to.
	 * @param {string} cmd Label of the command we're issuing.
	 * @param {Buffer} buffer Buffer containing the command to send to the client.
	 * @param {http.ServerResponse} res Response to send to client. 
	 */
	sendCommand(bed, cmd, buffer, res) {
		console.log("Attempting to send command", cmd, "to bed", bed.name, "buffer:", buffer.toString("hex"));
		if(bed.characteristic) {
			bed.characteristic.write(buffer, false, (error) => {
				res.writeHead(200);
				res.write(JSON.stringify({
					cmd: cmd,
					success: !error,
					error: error
				}));
				res.end();
			});
		} else {
			res.writeHead(200);
			res.write(JSON.stringify({
				success: false,
				error: "Not connected"
			}));
			res.end();
		}
	}

	/**
	 * This gets called by noble when we detect a new bed.
	 * @param {noble.Peripheral} device Newly discovered bed.
	 */
	handleDiscoveredBed(device) {
		if(this.beds[device.address]) {
			console.log("Found bed:", device.address + ":" + this.beds[device.address]);
			let bed = new Bed(this.beds[device.address], device);
			this.bedsByLabel.set(bed.name, bed);
			this.bedsByAddress.set(bed.address, bed);
	
			//Only stop scanning if we've found all our beds.
			if(this.bedsByLabel.size >= Object.keys(this.beds).length) {
				console.log("Found all the beds we're expecting, attempting to connect.");
				noble.stopScanning();
				this.bedsByLabel.forEach((bed) => {
					this.connectToDevice(bed);
				});
			}
		} else {
			console.log("We found a bed, but we don't know it, skipping:", device.address);
		}
	}

	/**
	 * Connects to a discovered bed.
	 * @param {Bed} bed Bed to connect to.
	 */
	connectToDevice(bed) {
		bed.device.connect((error) => {
			if(error) {
				console.log("Error connecting to " + bed.device.address + ":" + bed.name + ":", error);
				return;
			}
	
			console.log("Connected to " + bed.device.address + ":" + bed.name);
			bed.device.once("disconnect", () => {
				console.log("Disconnected from " + bed.device.address + ":" + this.beds[bed.device.address] + ", attempting to reconnect.");
				//Remove this bed from our stack.
				this.bedsByAddress.delete(bed.device.address);
				this.bedsByLabel.delete(bed.name);
				noble.startScanning([this.serviceUuid]);
			});
	
			//Now to discover the service and characteristic we need.
			bed.device.discoverSomeServicesAndCharacteristics([this.serviceUuid], [this.characteristicUuid], (error, services, characteristics) => {
				if(error) {
					console.log("Error enumerating", error);
					return;
				} else if(services.length !== 1 || characteristics.length !== 1) {
					console.log("Unexpected services or characteristics", services, characteristics);
					return;
				}
				//Add the new bed to the stack.
				bed.service = services[0];
				bed.characteristic = characteristics[0];
				bed.connected = true;
			});
		});
	}
}

/**
 * Class for a bed, keeps track of bed state.
 */
class Bed {
	/**
	 * Constructor, creates a new instance of this type.
	 * @param {string} name Label of the device.
	 * @param {noble.Peripheral} device Device reference from noble.
	 */
	constructor(name, device) {
		/**
		 * The label of this device.
		 */
		this.name = name;
		/**
		 * The noble peripheral reference.
		 */
		this.device = device;
		/**
		 * The noble service reference.
		 */
		this.service = false;
		/**
		 * The noble characteristic reference.
		 */
		this.characteristic = false;
		/**
		 * Whether or not we're actually connected.
		 */
		this.connected = false;
	}
}

//Start er' up!
const bedRest = new BedREST();
bedRest.start();