/**
 * Example class showing how you can interact with BedREST from your own application.
 */
class BedRestUi {
    /**
     * Constructor, makes a new instance of this class.
     */
    constructor() {
        /**
         * This should be the URL to BedREST.
         */
        this.url = "http://localhost:8080";
        /**
         * This should be the URL to the websocket for BedREST.
         */
        this.wsUrl = "ws://localhost:8080";
        /**
         * Add the labels of your beds from your BedREST configuration here.
         */
        this.beds = {
            "alice": "Alice's Bed",
            "bob": "Bob's Bed"
        };
    }

    openWebsocket() {
        this.ws = new WebSocket(this.wsUrl);
        this.ws.onmessage = (wsMsg) => {
            let msg = JSON.parse(wsMsg.data);
            let bedName = document.getElementById("bedselect").value;
            if(msg.bed === bedName) {
                this.updateStatus(msg);
            }
        }
        this.ws.onclose = () => {
            setTimeout(() => {
                this.openWebsocket();
            }, 2000);
        }
    }

    updateStatus(data) {
        document.getElementById("head_abs").value = data.status.headPos;
        document.getElementById("head_abs_num").value = data.status.headPos;
        document.getElementById("foot_abs").value = data.status.footPos;
        document.getElementById("foot_abs_num").value = data.status.footPos;
        document.getElementById("head_mass_abs").value = data.status.headMassage;
        document.getElementById("head_mass_abs_num").value = data.status.headMassage;
        document.getElementById("foot_mass_abs").value = data.status.footMassage;
        document.getElementById("foot_mass_abs_num").value = data.status.footMassage;
    }

    /**
     * Registers event handlers with the DOM.
     */
    register() {
        document.getElementById("button_flat").addEventListener("click", () => this.sendCommand("flat"), false);
        document.getElementById("button_zerog").addEventListener("click", () => this.sendCommand("zerog"), false);
        document.getElementById("button_antisnore").addEventListener("click", () => this.sendCommand("antisnore"), false);
        document.getElementById("button_nightlight").addEventListener("click", () => this.sendCommand("lighttoggle"), false);
        document.getElementById("button_fullbody").addEventListener("click", () => this.sendCommandArg("fullbodymassage", 0x41), false);
        document.getElementById("button_stopmassage").addEventListener("click", () => this.sendCommand("stopmassage"), false);

        document.getElementById("button_headup").addEventListener("mousedown", () => this.sendCommand("headup"), false);
        document.getElementById("button_headup").addEventListener("mouseup", () => this.sendCommand("stopmotion"), false);
        document.getElementById("button_headdown").addEventListener("mousedown", () => this.sendCommand("headdown"), false);
        document.getElementById("button_headdown").addEventListener("mouseup", () => this.sendCommand("stopmotion"), false);

        document.getElementById("button_feetup").addEventListener("mousedown", () => this.sendCommand("footup"), false);
        document.getElementById("button_feetup").addEventListener("mouseup", () => this.sendCommand("stopmotion"), false);
        document.getElementById("button_feetdown").addEventListener("mousedown", () => this.sendCommand("footdown"), false);
        document.getElementById("button_feetdown").addEventListener("mouseup", () => this.sendCommand("stopmotion"), false);

        document.getElementById("button_headmassageup").addEventListener("mousedown", () => this.sendCommand("massageheadup"), false);
        document.getElementById("button_headmassageup").addEventListener("mouseup", () => this.sendCommand("stopmassagemotion"), false);
        document.getElementById("button_headmassagedown").addEventListener("mousedown", () => this.sendCommand("massageheaddown"), false);
        document.getElementById("button_headmassagedown").addEventListener("mouseup", () => this.sendCommand("stopmassagemotion"), false);

        document.getElementById("button_footmassageup").addEventListener("mousedown", () => this.sendCommand("massagefootup"), false);
        document.getElementById("button_footmassageup").addEventListener("mouseup", () => this.sendCommand("stopmassagemotion"), false);
        document.getElementById("button_footmassagedown").addEventListener("mousedown", () => this.sendCommand("massagefootdown"), false);
        document.getElementById("button_footmassagedown").addEventListener("mouseup", () => this.sendCommand("stopmassagemotion"), false);

        document.getElementById("button_preset_1").addEventListener("click", () => this.sendCommand("memrecall1"), false);
        document.getElementById("button_preset_2").addEventListener("click", () => this.sendCommand("memrecall2"), false);
        document.getElementById("button_preset_3").addEventListener("click", () => this.sendCommand("memrecall3"), false);
        document.getElementById("button_preset_4").addEventListener("click", () => this.sendCommand("memrecall4"), false);

        document.getElementById("head_abs").addEventListener("change", (evt) => this.changeSlider("headposition", document.getElementById("head_abs"), document.getElementById("head_abs_num"), document.getElementById("head_abs").value), false);
        document.getElementById("head_abs_num").addEventListener("change", (evt) => this.changeSlider("headposition", document.getElementById("head_abs"), document.getElementById("head_abs_num"), document.getElementById("head_abs_num").value), false);
        
        document.getElementById("foot_abs").addEventListener("change", (evt) => this.changeSlider("footposition", document.getElementById("foot_abs"), document.getElementById("foot_abs_num"), document.getElementById("foot_abs").value), false);
        document.getElementById("foot_abs_num").addEventListener("change", (evt) => this.changeSlider("footposition", document.getElementById("foot_abs"), document.getElementById("foot_abs_num"), document.getElementById("foot_abs_num").value), false);
        
        document.getElementById("head_mass_abs").addEventListener("change", (evt) => this.changeSlider("headmassage", document.getElementById("head_mass_abs"), document.getElementById("head_mass_abs_num"), document.getElementById("head_mass_abs").value), false);
        document.getElementById("head_mass_abs_num").addEventListener("change", (evt) => this.changeSlider("headmassage", document.getElementById("head_mass_abs"), document.getElementById("head_mass_abs_num"), document.getElementById("head_mass_abs_num").value), false);
        
        document.getElementById("foot_mass_abs").addEventListener("change", (evt) => this.changeSlider("footmassage", document.getElementById("foot_mass_abs"), document.getElementById("foot_mass_abs_num"), document.getElementById("foot_mass_abs").value), false);
        document.getElementById("foot_mass_abs_num").addEventListener("change", (evt) => this.changeSlider("footmassage", document.getElementById("foot_mass_abs"), document.getElementById("foot_mass_abs_num"), document.getElementById("foot_mass_abs_num").value), false);
        
        //Add keyboard shortcuts.
        window.addEventListener("keypress", (evt) => {
            if(evt.key === "A" || evt.key === "a") {
                this.sendCommand("antisnore");
            } else if(evt.key === "Z" || evt.key === "z") {
                this.sendCommand("zerog");
            } else if(evt.key === "L" || evt.key === "l") {
                this.sendCommand("lighttoggle");
            }
        });

        //Populate our dropdown list of beds.
        let select = document.getElementById("bedselect");
        select.options.length = 0;
        Object.keys(this.beds).forEach((key) => select.options[select.options.length] = new Option(this.beds[key], key));
    }

    changeSlider(cmd, slider, input, val) {
        slider.value = val;
        input.value = val;

        val = parseInt(val);
        if(cmd === "headmassage" || cmd === "footmassage") {
            val *= 10;
        }
        this.sendCommandArg(cmd, parseInt(val));
    }

    /**
     * Sends a command to the BedREST service.
     * @param {string} cmd Command to send.
     */
    sendCommand(cmd) {
        let request = new XMLHttpRequest();
        let bedName = document.getElementById("bedselect").value;
        request.open("POST", this.url + "/bed/" + bedName + "/" + cmd, true);
        request.send();
        request.onreadystatechange = function() {
            if(request.readyState === 4 && request.status === 200) {
                let response = JSON.parse(request.responseText);
                console.log("Server said: ", response);
            }
        }
    }

    /**
     * Sends a command to the BedREST service with arguments.
     * @param {string} cmd Command to send.
     * @param {number} num Argument to send.
     */
    sendCommandArg(cmd, num) {
        let request = new XMLHttpRequest();
        let bedName = document.getElementById("bedselect").value;
        request.open("POST", this.url + "/bed/" + bedName + "/" + cmd + "/" + num.toString(16), true);
        request.send();
        request.onreadystatechange = function() {
            if(request.readyState === 4 && request.status === 200) {
                let response = JSON.parse(request.responseText);
                console.log("Server said: ", response);
            }
        }
    }

    getStatus(callback) {
        let request = new XMLHttpRequest();
        let bedName = document.getElementById("bedselect").value;
        request.open("POST", this.url + "/bed/" + bedName + "/status", true);
        request.send();
        request.onreadystatechange = function() {
            if(request.readyState === 4 && request.status === 200) {
                let response = JSON.parse(request.responseText);
                callback(response);
            }
        }
    }
}

//Creates a new instance of the class and registers it with the DOM when we're ready.
document.addEventListener("DOMContentLoaded", () => {
    let bed = new BedRestUi();
    bed.register();
    bed.getStatus(bed.updateStatus);
    bed.openWebsocket();

    document.getElementById("bedselect").addEventListener("change", ()=>{
        bed.getStatus(bed.updateStatus);
    }, false);
}), false;