const fs = require("fs");

const webpack = require("webpack");
// TODO: Web Server of some kind
const selfsigned = require('selfsigned');

const telnet = require("telnet");

const VISUS_VERSION = process.env.npm_package_version;
if(!VISUS_VERSION) {
    console.error("[ERROR] Failed to find Visus version");
    return 1;
}

const CONFIG_PATH = "visus_config.json";
const PEM_PATH    = "certificates.json";

let visus_config = { // Default configuration
    self_sign: true
};
let pem_certificates = {};

/*
  Read Config
*/
if(!fs.existsSync(CONFIG_PATH)) { // Config doesn't exist; Create
    console.warn("[WARNING] Config file doesn't exist; Creating")
    fs.writeFileSync(CONFIG_PATH, JSON.stringify( visus_config, null, 2 ));
} else { // Config exists; Read
    console.log("[INFO] Config file found; Reading");
    try {
        let config_data = JSON.parse(
            fs.readFileSync(CONFIG_PATH)
        );

        visus_config = {...visus_config, ...config_data};
    } catch(err) {
        console.error("[ERROR] Config file read failed!");
        throw err;
    }
}

/*
  Read PEM certificates (if exist)
*/
if(visus_config.self_sign) { // Check if self-signing certificates
    if(!fs.existsSync(PEM_PATH)) { // Certificates don't exist; Create
        console.warn("[WARNING] PEM certificates don't exist; Creating");

        const certificate_attributes = [
            { name: "commonName", value: "test.com" }
        ];

        const certificate_options = {
            days: 365, // TODO: Make this be checked, as expirations could cause problems
        };

        pem_certificates = selfsigned.generate(certificate_attributes, certificate_options);
        fs.writeFileSync(PEM_PATH, JSON.stringify( pem_certificates, null, 2 ));
    } else { // Certificates exist; Read
        console.log("[INFO] PEM certificates found; Reading");
        try {
            pem_certificates = JSON.parse(
                fs.readFileSync(PEM_PATH)
            )
        } catch(err) {
            console.error("[ERROR] PEM certificates file read failed!");
            throw err;
        }
    }
}

console.log(`VisusJS@${VISUS_VERSION}`);

telnet.createServer(function(client) {
    client.do.transmit_binary(); // Correct unicode characters
    client.do.window_size(); // Windowsize event

    client.on("window size", function (e) {
        if (e.command === "sb") {
            // TODO: Send back to client
            console.log("telnet window resized to %d x %d", e.width, e.height);
        }
    });

    client.on("data", function (b) {
        client.write(b);
    });
    client.write("Connected to telnet");
}).listen(123);