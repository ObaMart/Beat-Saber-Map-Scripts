// deno-lint-ignore-file prefer-const no-unused-vars ban-unused-ignore no-inferrable-types
// ^ make it so deno doesn't scream at me for "bad practices" (literally crying about not using a variable when I just fucking declared it for fucks sake)
import {
    Difficulty, Environment, Event, LightRemapper, CustomEvent,
    ModelScene, Geometry, Vec3, Note, GEO_SHADER, LOOKUP, Regex,
    NOTE, MODS, KeyframesLinear, KeyframesVec3, KeyframesVec4, ENV, debugObject,
    Color, COLOR, ColorType, Wall, WALL, ComplexKeyframesVec4, ComplexKeyframesLinear, ComplexKeyframesVec3,
    CustomEventInternals, notesBetween, copy, exportZip, Keyframe // a lot of unused imports because I just copied them from Over Again
} from "https://deno.land/x/remapper@2.1.0/src/mod.ts";
const map = new Difficulty("ExpertPlusLawless", "ExpertStandard");
let animTrack: CustomEventInternals.AnimateTrack;
let newNote: Note;
let env: Environment;

//#region point defs
const notePosOffset = 0.05;
const noteLocRotOffset = 7.5;
const playerPosOffset = 1;
const dissolveOffset = 0.8;
const framerate = 50;
const decimals = 4;
let t: number;

for (let j = 0; j <= 9; j++) {
    let pointsPos: ComplexKeyframesVec3 = [];
    let pointsLocRot: ComplexKeyframesVec3 = [];
    let pointsPlayerPos: ComplexKeyframesVec3 = []; 
    let pointsDis: ComplexKeyframesLinear = [];
    for (let i = 0; i <= framerate; i++) {
        
        t = easeOutCirc(i/framerate)
        pointsPos.push(
            [
                randomNumber(-notePosOffset+t*notePosOffset,notePosOffset-t*notePosOffset, decimals),
                randomNumber(-notePosOffset+t*notePosOffset,notePosOffset-t*notePosOffset, decimals),
                0, i/framerate
            ]
        );
        pointsPlayerPos.push(
            [
                randomNumber(-playerPosOffset+t*playerPosOffset,playerPosOffset-t*playerPosOffset, decimals),
                randomNumber(-playerPosOffset+t*playerPosOffset,playerPosOffset-t*playerPosOffset, decimals),
                0, i/framerate
            ]
        );
        pointsLocRot.push(
            [
                randomNumber(-noteLocRotOffset+t*noteLocRotOffset,noteLocRotOffset-t*noteLocRotOffset, decimals),
                randomNumber(-noteLocRotOffset+t*noteLocRotOffset,noteLocRotOffset-t*noteLocRotOffset, decimals),
                randomNumber(-noteLocRotOffset+t*noteLocRotOffset,noteLocRotOffset-t*noteLocRotOffset, decimals), i/framerate
            ]
        );
        pointsDis.push([randomNumber(1-dissolveOffset*(1-t), 1-dissolveOffset*(1-t)/2, decimals), i/framerate]);
    }
    map.pointDefinitions.push({
        _name: `noteVibratePos${j}`,
        _points: pointsPos
    });
    map.pointDefinitions.push({
        _name: `noteVibrateLocRot${j}`,
        _points: pointsLocRot
    });
    map.pointDefinitions.push({
        _name: `playerVibratePos${j}`,
        _points: pointsPlayerPos
    });
    map.pointDefinitions.push({
        _name: `dissolve${j}`,
        _points: pointsDis
    });
}
for (let j = 0; j <= 9; j++) {
    map.pointDefinitions.push({_name: `noteDropPos${j}`, _points: [
        [randomNumber(-8, 8), randomNumber(-8, 8), 1, 0],
        [0, 0, 0, 0.2, "easeOutCirc"]
    ]});
}
env = new Environment("ConeRing\\(Clone\\)$", "Regex");
env.track = "Cones"
env.push();
env = new Environment("LeftPanel$", "Regex");
env.position = [-2, 0.01, 0.2];
env.rotation = [90, 0, 0];
env.scale = [0.5, 0.5, 0.5];
env.push();
env = new Environment("RightPanel$", "Regex");
env.position = [2, 0.01, 0.1];
env.rotation = [90, 0, 0];
env.scale = [0.5, 0.5, 0.5];
env.push();
env = new Environment("ComboPanel\\[\\d*\\]\\.Line(0|1)$");
env.active = false;
env.push();
map.pointDefinitions.push({
    _name: "ConeScale",
    _points: [[5, 5, 1, 0], [1, 1, 1, 1, "easeOutCirc"]]
});
map.pointDefinitions.push({
    _name: "dissolved",
    _points: [0]
})
map.pointDefinitions.push({
    _name: "appear",
    _points: [[0, 0], [1, 1]]
})
map.pointDefinitions.push({
    _name: "dissolveLastSecond",
    _points: [[1, 0], [1, 0.3], [0, 0.45]]
})
map.pointDefinitions.push({
    _name: "yeet",
    _points: [0, -69420, -69420]
})
map.pointDefinitions.push({
    _name: "nullScale",
    _points: [1/1_000_000, 1/1_000_000, 1/1_000_000]
})
//#endregion point defs

//#region math
function randomNumber(min: number, max: number, decimals = 3) {
    return +(min + Math.random() * (max-min)).toFixed(decimals);
}
function randomInt(min: number, max: number) {
    return Math.floor(randomNumber(min, max));
}
function easeOutCirc(t: number, p1: number=0, p2: number=1, d: number=1) { // stole this from tzur
    return p2 * Math.sqrt(1 - (t = t / d - 1) * t) + p1;
}
function rr() {
    return randomNumber(-180, 180)
}
function range(start: number, stop?: number, step?: number, length: number = 1) {
    if (typeof stop == 'undefined') {
        // one param defined
        stop = start;
        start = 0;
    }

    if (typeof step == 'undefined') {
        step = 1;
    }

    if ((step > 0 && start >= stop) || (step < 0 && start <= stop)) {
        return [];
    }

    let result: number[][] = [];
    for (let i = start; step > 0 ? i < stop : i > stop; i += step) {
        result.push([i,length]);
    }

    return result;
}
function hex2rgb(hex: string) {
    if(hex.length != 6){
        throw "Only six-digit hex colors are allowed.";
    }

    const aRgbHex = hex.match(/.{1,2}/g);
    const aRgb = [
        //@ts-ignore h
        +(parseInt(aRgbHex[0], 16)/255).toFixed(4),
        //@ts-ignore h
        +(parseInt(aRgbHex[1], 16)/255).toFixed(4),
        //@ts-ignore h
        +(parseInt(aRgbHex[2], 16)/255).toFixed(4)
    ];
    return aRgb;
}
function hex2rgba(hex: string) {
    if (hex.length != 8) {
        throw "Only eight-digit hex colors are allowed.";
    }

    const aRgbHex = hex.match(/.{1,2}/g);
    const aRgb = [
        //@ts-ignore h
        +(parseInt(aRgbHex[0], 16)/255).toFixed(4),
        //@ts-ignore h
        +(parseInt(aRgbHex[1], 16)/255).toFixed(4),
        //@ts-ignore h
        +(parseInt(aRgbHex[2], 16)/255).toFixed(4),
        //@ts-ignore h
        +(parseInt(aRgbHex[3], 16)/255).toFixed(4)
    ];
    return aRgb;
}
function HSVAtoRGBA(h: number, s: number, v: number, alpha: number) {
    let r: number, g: number, b: number, i: number, f: number, p: number, q: number, t: number;
    i = Math.floor(h * 6);
    f = h * 6 - i;
    p = v * (1 - s);
    q = v * (1 - f * s);
    t = v * (1 - (1 - f) * s);
    switch (i % 6) {
        case 0: r = v, g = t, b = p; break;
        case 1: r = q, g = v, b = p; break;
        case 2: r = p, g = v, b = t; break;
        case 3: r = p, g = q, b = v; break;
        case 4: r = t, g = p, b = v; break;
        case 5: r = v, g = p, b = q; break;
        default: r = 0, g = 0, b = 0; break;
    }
    return [r, g, b, alpha];
}
//#endregion math

//#region notes
function animateNotes(data: [starttime: number, track: string, NJS: number, offset: number][], last_endtime: number) {
    for (let i = 0; i < data.length; i++) {
        const starttime = data[i][0];
        let endtime: number;
        if (i == data.length-1) {
            endtime = last_endtime
        } else {
            endtime = data[i+1][0];
        }
        const track = data[i][1]
        const NJS = data[i][2];
        const offset = data[i][3];

        for (const note of map.notes) {
            if (note.time >= starttime && note.time < endtime) {
                note.NJS = NJS;
                note.offset = offset;
                note.customData._track = track;
            }
        }
    }
}
const dropArrowOffset = 0.5;
const dropBodyOffset = 0.3;
const dropBombOffset = 0.5;
function fakeNoteStaticBody(starttime: number, endtime: number) {
    // function name is stupid, "bodies" of notes used to be static but they now float from a random position
    notesBetween(starttime, endtime, note => {
        newNote = copy(note);
        note.animate.dissolve = "dissolved";
        newNote.customData._animation._dissolveArrow = "dissolved";
        newNote.customData._animation._position = `noteDropPos${Math.round(randomNumber(0, 9))}`
        newNote.fake = true;
        newNote.interactable = false;
        newNote.track.value = "fakeNotes";
        if (note.type == NOTE.BOMB) {
            newNote.offset = dropBombOffset;
        } else {
            newNote.offset = dropBodyOffset;
        }
        newNote.push();
    });
}
animateNotes([
    [0, "notesNondrop", 15.5, 0.1],
    [72, "notesNondrop", 17, 0], // build
    [88, "notesNondrop", 17, -0.1], // faster build
    [96, "notesNondrop", 17, -0.2], // fastest build
    [104, "notes", 18, 0.1],
    [105, "notes", 18, dropArrowOffset],
    [168, "notesNondrop", 16, 0.1],
    [240, "notesNondrop", 17, 0], // build
    [256, "notesNondrop", 17, -0.1], // faster build
    [264, "notesNondrop", 17, -0.2], // fastest build
    [272, "notes", 18, 0.1],
    [273, "notes", 18, dropArrowOffset],
    [336, "notesNondrop", 15, 0.2]
], 377)
animTrack = new CustomEvent(2).animateTrack("notesNondrop", 6);
animTrack.animate.position = `playerVibratePos${Math.round(randomNumber(0, 9))}`;
animTrack.push();
// ^ let notes vibrate a bit at the start (barely noticeable but idc)
fakeNoteStaticBody(104, 168);
fakeNoteStaticBody(272, 334.25);
notesBetween(273, 277, note => {
    if (note.type == NOTE.RED || note.type == NOTE.BLUE) {
        if (note.track.value == "fakeNotes") {
            note.customData._animation._dissolve = "dissolveLastSecond";
        } else if (note.track.value == "notes") {
            note.customData._animation._dissolveArrow = "dissolveLastSecond";
            note.fake = true;
            note.interactable = false;
        }
    }
})
// ^ fake note effect on the fakeout on the 2nd drop
for (const note of map.notes) {
    if (note.track.value == "notesNondrop") {
        note.animate.position = `noteVibratePos${Math.round(randomNumber(0, 9))}`;
        note.animate.localRotation = `noteVibrateLocRot${Math.round(randomNumber(0, 9))}`;
        note.animate.dissolve = `dissolve${Math.round(randomNumber(0, 9))}`;
    }
    // ^ animate all notes which aren't in the drop
}
new CustomEvent().assignPlayerToTrack("player").push();
new CustomEvent().assignTrackParent(["notes", "notesNondrop"], "player").push();
// ^ make notes follow player so vibration doesn't fuck up accuracy
new CustomEvent().assignFogTrack("fog").push();
animTrack = new CustomEvent().animateTrack("fog", 0.1);
animTrack.animate.startY = [-69420];
animTrack.animate.height = [10];
animTrack.push();
// ^ get fog the fuck away
//#endregion

//#region player anim
// the SAUCE
// const dropVibrationsList = [
//     [
//         104,
//         105.5,
//         107,
//         108.5,
//         110,
//         112,
//         115,
//         118,
//         120,
//         121.5,
//         123,
//         124.5,
//         126,
//         128,
//         128.5,
//         130,
//         131,
//         134,
//         135,
//         135.5,
//         136,
//         136.5,
//         137
//     ],
//     [
//         138,
//         139,
//         140.5,
//         142,
//         144,
//         147,
//         150,
//         152,
//         153.5,
//         155,
//         156.5,
//         158,
//         160,
//         163,
//         166,
//         168
//     ]
// ];
// const secondDropVibrationsList = [
//     [
//         272,
//         273.5,
//         275,
//         276.5,
//         277,
//     ],
//     [
//         279,
//         280,
//         283,
//         286,
//         288,
//         289.5,
//         291,
//         292.5,
//         294,
//         296,
//         296.5,
//         299,
//         302,
//         303,
//         303.5,
//         304,
//         304.5,
//         305
//     ],
//     [
//         306,
//         307,
//         308.5,
//         310,
//         312,
//         315,
//         318,
//         320,
//         321.5,
//         323,
//         324.5,
//         326,
//         328,
//         331,
//         334,
//         336
//     ]
// ]

const invScl = 12.5; // stupid way of setting scale of kunais
for (let i = 1; i <= 50; i++) {
    env = new Environment("\\[1\\]ConeRing\\(Clone\\)\\.\\[\\d*\\]Cone$", "Regex");
    env.track = `kunai${i}`;
    env.position = [0, -100, 0];
    env.rotation = [0, 0, 0];
    env.scale = [1/invScl/5, 1/invScl/5, 1/invScl/5];
    env.duplicate = 1;
    env.push();
    // spawn kunai
  
    animTrack = new CustomEvent(272).animateTrack(`kunai${i}`, 6);
    let [xr1, yr1, zr1] = [rr(), rr(), rr()]; // sets random rotation value for kunai
    let r = randomNumber(5, 25); // get random radius of circle in which kunai will be spawning
    let theta = randomNumber(0, Math.PI); // get angle of half circle
    let x1 = randomNumber(-10, 10); // set spawn X of kunai so they won't all spawn from the same place
    let x2 = r * Math.cos(theta);
    let y2 = r * Math.sin(theta);
    let z = 35 // Z distance from player
    animTrack.animate.rotation = [[xr1, yr1, zr1, 0], [90-(Math.atan2(y2, z) * 180 / Math.PI), 0, (Math.atan2(-x2, z) * 180 / Math.PI), 1]];
    // ^ let kunai rotate to face player
    animTrack.animate.position = [[x1, -10, z, 0], [x2, y2, z, 1, "easeOutCirc"]];
    // ^ let kunai float in air
    animTrack.animate.scale = [[1/invScl/5, 1/invScl/5, 1/invScl/5, 0], [1/invScl, 1/invScl, 1/invScl, 1, "easeOutQuad"]]
    // ^ let kunai slowly scale up
    animTrack.push();
    animTrack = new CustomEvent(278).animateTrack(`kunai${i}`, 1.2);
    // animTrack.animate.rotation = [[xr2, yr2, zr2, 0], [90, 0, 0, 1]];
    animTrack.animate.position = [[x2, y2, 25, 0], [x2/10, y2/10, -10, 1, "easeOutCirc"]];
    // ^ let kunai shoot towards (behind) player
    animTrack.push();
    animTrack = new CustomEvent(279.5).animateTrack(`kunai${i}`, 1);
    animTrack.animate.position = "yeet";
    animTrack.animate.scale = "nullScale";
    animTrack.push();
    // ^ remove kunai (so they don't stay behind player)
}

let duration: number;
// for (const dropVibrations of dropVibrationsList) {
//     // for comments look in the next forloop
//     for (let i = 0; i < dropVibrations.length; i++) {
//         t = dropVibrations[i]
//         if (i == dropVibrations.length-1) {
//             continue
//         }
//         duration = dropVibrations[i+1]-t
//         animTrack = new CustomEvent(t).animateTrack("player", duration);
//         animTrack.animate.position = `playerVibratePos${Math.round(randomNumber(0, 9))}`;
//         animTrack.push();
//     }
// }
// for (const dropVibrations of secondDropVibrationsList) {
//     for (let i = 0; i < dropVibrations.length; i++) {
//         t = dropVibrations[i] // get time of vibration
//         if (i == dropVibrations.length-1) {
//             continue
//         }
//         duration = dropVibrations[i+1]-t
//         // ^ get duration of vibration by getting time between vibrations
//         animTrack = new CustomEvent(t).animateTrack("player", duration);
//         animTrack.animate.position = `playerVibratePos${Math.round(randomNumber(0, 9))}`;
//         // ^ choose random vibration
//         animTrack.push();
//         animTrack = new CustomEvent(t).animateTrack("Cones", duration);
//         animTrack.animate.scale = "ConeScale";
//         animTrack.push();
//         // ^ Scale up cones to get huge effect (2nd drop only)
//     }
// }
//#endregion
 
//#region visuals
notesBetween(0, 376, note => {
    note.customData._disableSpawnEffect = true;
    if (note.type == NOTE.BLUE) {
        note.track.add("blueNote");
    } else if (note.type == NOTE.RED) {
        note.track.add("redNote");
    }
})
// [0, 0.72, 0.82], [0.617, 0.61, 0.95]
// 0-40 saturate up
// 168-176 saturate down
// 176-208 saturate up
let colorAnim: ComplexKeyframesVec4 = [];

let [r, g, b, a] = HSVAtoRGBA(0, 0.36, 0.82, 1);
colorAnim.push([r, g, b, a, 0]);
[r, g, b, a] = HSVAtoRGBA(0, 0.72, 0.82, 1);
colorAnim.push([r, g, b, a, 1, "easeInCirc"]);
new CustomEvent(0).animateTrack("redNote", 40, {_color: colorAnim}).push();
new CustomEvent(176).animateTrack("redNote", 32, {_color: colorAnim}).push();

colorAnim = [];
[r, g, b, a] = HSVAtoRGBA(0, 0.72, 0.82, 1);
colorAnim.push([r, g, b, a, 0]);
[r, g, b, a] = HSVAtoRGBA(0, 0.36, 0.82, 1);
colorAnim.push([r, g, b, a, 1, "easeInOutSine"]);
new CustomEvent(168).animateTrack("redNote", 8, {_color: colorAnim}).push();

colorAnim = [];
[r, g, b, a] = HSVAtoRGBA(0.617, 0.305, 0.95, 1);
colorAnim.push([r, g, b, a, 0]);
[r, g, b, a] = HSVAtoRGBA(0.617, 0.61, 0.95, 1);
colorAnim.push([r, g, b, a, 1, "easeInCirc"]);
new CustomEvent(0).animateTrack("blueNote", 40, {_color: colorAnim}).push();
new CustomEvent(176).animateTrack("blueNote", 32, {_color: colorAnim}).push();

colorAnim = [];
[r, g, b, a] = HSVAtoRGBA(0.617, 0.61, 0.95, 1);
colorAnim.push([r, g, b, a, 0]);
[r, g, b, a] = HSVAtoRGBA(0.617, 0.305, 0.95, 1);
colorAnim.push([r, g, b, a, 1, "easeInOutSine"]);
new CustomEvent(168).animateTrack("blueNote", 8, {_color: colorAnim}).push();

//#endregion visuals









new Note()


map.require("Noodle Extensions");
map.require("Chroma");
map.suggest("Chroma", false);
map.colorLeft = <Vec3>hex2rgb("d13b3b");
map.colorRight = <Vec3>hex2rgb("5e8af2");
// HSV: red, blue: [0, 0.72, 0.82], [0.617, 0.61, 0.95]
map.label = "Show me your heart";
map.save();

exportZip(["ExpertPlusLawless.dat"], "GOTL")