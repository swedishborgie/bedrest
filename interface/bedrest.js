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
         * Add the labels of your beds from your BedREST configuration here.
         */
        this.beds = {
            "alice": "Alice's Bed",
            "bob": "Bob's Bed"
        };
    }

    /**
     * Registers event handlers with the DOM.
     */
    register() {
        document.getElementById("button_flat").addEventListener("click", () => this.sendCommand("flat"), false);
        document.getElementById("button_zerog").addEventListener("click", () => this.sendCommand("zerog"), false);
        document.getElementById("button_antisnore").addEventListener("click", () => this.sendCommand("antisnore"), false);
        document.getElementById("button_nightlight").addEventListener("click", () => this.sendCommand("lighttoggle"), false);
        document.getElementById("button_fullbody").addEventListener("click", () => this.sendCommand("fullbodymassage"), false);
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

    /**
     * Sends a command to the BedREST service.
     * @param {string} cmd Command to send.
     */
    sendCommand(cmd) {
        let request = new XMLHttpRequest();
        let bedName = document.getElementById("bedselect").value;
        request.open("GET", this.url + "/bed/" + bedName + "/" + cmd, true);
        request.send();
        request.onreadystatechange = function() {
            if(request.readyState === 4 && request.status === 200) {
                let response = JSON.parse(request.responseText);
                console.log("Server said: ", response);
            }
        }
    }
}

//Creates a new instance of the class and registers it with the DOM when we're ready.
document.addEventListener("DOMContentLoaded", () => {
    let bed = new BedRestUi();
    bed.register();
}), false;