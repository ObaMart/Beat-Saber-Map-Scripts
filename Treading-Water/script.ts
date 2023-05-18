// deno-lint-ignore-file prefer-const no-unused-vars ban-unused-ignore no-inferrable-types
// ^ make it so deno doesn't scream at me for "bad practices" (literally crying about not using a variable when I just fucking declared it for fucks sake)
import {
    Difficulty, Environment, Event, LightRemapper, CustomEvent, activeDiffGet, filterObjects,
    ModelScene, Geometry, Vec3, Note, GEO_SHADER, LOOKUP, Regex, Vec4,
    NOTE, MODS, KeyframesLinear, KeyframesVec3, KeyframesVec4, ENV, debugObject,
    Color, COLOR, ColorType, Wall, WALL, ComplexKeyframesVec4, ComplexKeyframesLinear, ComplexKeyframesVec3,
    CustomEventInternals, notesBetween, copy, exportZip, Keyframe // a lot of unused imports because I just copied them from Over Again
} from "https://deno.land/x/remapper@2.1.0/src/mod.ts";

import { removeIds, onTrigger, hex2rgb, onAllNotes, rr, randomInt, randomNumber, HSVAtoRGBA, onAllWalls, pushPointDef, multipleNotesBetweens, cos, sin } from "../../RMPlus/mod.ts"
const map = new Difficulty("ExpertPlusLawless", "ExpertPlusStandard");
let animTrack: CustomEventInternals.AnimateTrack;
let newWall: Wall;
let newNote: Note;
let env: Environment;

//#region setup
pushPointDef(map, "CloudringScale", [[0.5, 1, 0.5, 0], [0.6, 1, 0.6, 0.85, "easeInOutSine"], [0.5, 1, 0.5, 1, "easeInOutSine"]]);
pushPointDef(map, "CloudringJump", [[0, 10, 0, 0], [0, 30, 0, 0.85], [0, 10, 0, 1]]);
pushPointDef(map, "dissolved", [0]);
pushPointDef(map, "disappear", [[1, 0], [0, 1]]);
pushPointDef(map, "appear", [[0, 0], [1, 1]]);
pushPointDef(map, "fullRotation", [[0, 0, 0, 0], [0, 0, 90, 0.25], [0, 0, 180, 0.5], [0, 0, 270, 0.75], [0, 0, 0, 1]]);
pushPointDef(map, "wallDissolve", [[0, 0], [1, 1/8, "easeOutQuad"], [1, 7/8], [0, 1, "easeInQuad"]]);
// pushPointDef(map, "LeftWallSine", [[]])
//#endregion setup

//#region env
removeIds([
    "BottomGlow",
    "PillarTrackLaneRings",
    "LaserLight0", // watch out with this, original is "Pillar(L|R)\\.\\[\\d*\\]LaserLight0$"
])
env = new Environment("MagicDoorSprite$", "Regex");
env.scale = [0, 0.1, 0];
env.position = [0, 0, 200];
env.rotation = [90, 0, 0];
env.push();
env = new Environment("PillarPair( \\(\\d*\\))?\\.\\[\\d*\\]Pillar(L|R)\\.\\[\\d*\\]Pillar$", "Regex");
env.position = [0, 10000, -10000];
env.push();
env = new Environment("RotationBase(L|R)\\.\\[\\d*\\]Laser(L|R)H$", "Regex");
env.scale = [1, 10, 1];
env.push();
env = new Environment("HighCloudsGenerator$", "Regex");
env.duplicate = 1;
env.scale = [0.5, 1, 0.5];
env.position = [0, 0, 200];
env.rotation = [100, 0, 0];
env.track = "CloudringVertical";
env.push();
env = new Environment("HighCloudsGenerator$", "Regex");
env.scale = [1.5, 1, 1.5];
env.position = [0, 10, 0];
env.track = "CloudringHorizontal";
env.push();
for (let i = 0; i < 4; i++) {
    env = new Environment(new Regex().add("\\]SmallPillarPair").vary(i).separate().add("PillarL").separate().add("LaserL").end(), "Regex");
    env.position = [-12, -10, 70 + 16 * i];
    env.rotation = [15 * i - 45, 0, 40 - 10 * i];
    env.track = `SidelaserL${i+1}`;
    pushPointDef(map, `SidelaserL${i+1}Rot`, [[15 * i - 45, 0, 40 - 10 * i, 0], [15 * i - 45, 0, 40 - 10 * i + 90, 1/4], [15 * i - 45, 0, 40 - 10 * i + 180, 2/4], [15 * i - 45, 0, 40 - 10 * i + 270, 3/4], [15 * i - 45, 0, 40 - 10 * i, 1]]);
    env.push();
    env = new Environment(new Regex().add("\\]SmallPillarPair").vary(i).separate().add("PillarR").separate().add("LaserR").end(), "Regex");
    env.position = [12, -10, 70 + 16 * i];
    env.rotation = [15 * i - 45, 0, -40 + 10 * i];
    env.track = `SidelaserR${i+1}`;
    pushPointDef(map, `SidelaserR${i+1}Rot`, [[15 * i - 45, 0, -40 + 10 * i, 0], [15 * i - 45, 0, -40 + 10 * i - 90, 1/4], [15 * i - 45, 0, -40 + 10 * i - 180, 2/4], [15 * i - 45, 0, -40 + 10 * i - 270, 3/4], [15 * i - 45, 0, -40 + 10 * i, 1]]);
    env.push();
}
let small: string;
for (let i = 0; i < 9; i++) {
    small = i % 2 == 1 ? "Small" : "";
    env = new Environment(new Regex().add(`\\]${small}PillarPair`).vary(Math.floor(i/2)).separate().add("Pillar(L|R)").separate().add("RotationBase(L|R)").end(), "Regex");
    env.position = [0, -2, 62 + 8 * i];
    env.push();
}
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
env = new Environment("ComboPanel\\[\\d*\\]\\.Line(0|1)$", "Regex");
env.active = false;
env.push();
env = new Environment("LowCloudsGenerator$", "Regex");
const wy = -10
env.position = [0, -10, 0];
env.track = "Water"
env.push();
for (let t = 100; t < 164; t += 4) {
    new CustomEvent(t).animateTrack("SidelaserL1", 4, {_rotation: "SidelaserL1Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserL2", 4, {_rotation: "SidelaserL2Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserL3", 4, {_rotation: "SidelaserL3Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserL4", 4, {_rotation: "SidelaserL4Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserR1", 4, {_rotation: "SidelaserR1Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserR2", 4, {_rotation: "SidelaserR2Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserR3", 4, {_rotation: "SidelaserR3Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserR4", 4, {_rotation: "SidelaserR4Rot"}).push();
}
for (let t = 252; t < 316; t += 4) {
    new CustomEvent(t).animateTrack("SidelaserL1", 4, {_rotation: "SidelaserL1Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserL2", 4, {_rotation: "SidelaserL2Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserL3", 4, {_rotation: "SidelaserL3Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserL4", 4, {_rotation: "SidelaserL4Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserR1", 4, {_rotation: "SidelaserR1Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserR2", 4, {_rotation: "SidelaserR2Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserR3", 4, {_rotation: "SidelaserR3Rot"}).push();
    new CustomEvent(t).animateTrack("SidelaserR4", 4, {_rotation: "SidelaserR4Rot"}).push();
    new CustomEvent(t).animateTrack("bombRings", 4, {_rotation: "fullRotation"}).push();
}
// newWall = new Wall(0, 356);
// newWall.track.value = "Water";
// newWall.color = [0, 0.8, 2, 10];
// // newWall.color = [0, 0.8, 2, 1];
// newWall.fake = true;
// newWall.interactable = false;
// newWall.scale = [2000, 0.5, 2000];
// const [wx, wy, wz] = [-1000, -5, -1000];
// newWall.animate.definitePosition = [[wx, wy, wz, 0], [wx, wy, wz - 200, 1]];
// newWall.animate.localRotation = [0, 0, 0]
// newWall.push();
new CustomEvent().assignFogTrack("fog").push();
animTrack = new CustomEvent().animateTrack("fog", 1);
animTrack.animate.startY = [-10];
animTrack.animate.height = [5];
animTrack.push();

let duration: number = 0;
let firstDropTimes: number[] = []
onTrigger(99, 165, null, ev => {
    firstDropTimes.push(ev.time);
}, true, false, 8)
for (let i = 0; i < firstDropTimes.length; i++) {
    duration = (i == firstDropTimes.length - 1) ? 0.5 : firstDropTimes[i+1] - firstDropTimes[i];
    new CustomEvent(firstDropTimes[i]).animateTrack("CloudringVertical", duration, {_scale: "CloudringScale"}).push();
}

let secondDropTimes: number[] = []
onTrigger(251, 317, null, ev => {
    secondDropTimes.push(ev.time);
}, true, false, 8);
for (let i = 0; i < secondDropTimes.length; i++) {
    duration = (i == secondDropTimes.length - 1) ? 0.5 : secondDropTimes[i+1] - secondDropTimes[i];
    new CustomEvent(secondDropTimes[i]).animateTrack("CloudringVertical", duration, {_scale: "CloudringScale"}).push();
    new CustomEvent(secondDropTimes[i]).animateTrack("CloudringHorizontal", duration, {_position: "CloudringJump"}).push();
}
const scale = 2;
const thicc = 25;
const noteDropScale = 1.3;
pushPointDef(map, "noteDropScale", [[noteDropScale, noteDropScale, noteDropScale, 0], [1, 1, 1, 1, "easeOutCirc"]]);
pushPointDef(map, "noteDropPos", [[0, 0, 0, 0], [0, 0, (noteDropScale - 1), 1/2, "easeInCirc"], [0, 0, 0, 1, "easeOutCirc"]]);
[firstDropTimes, secondDropTimes].forEach(dtl => {
    for (let i = 0; i < dtl.length; i++) {
        duration = (i == dtl.length - 1) ? 0.5 : dtl[i+1] - dtl[i];
        for (let j = 0; j < 25; j++) {
            newWall = new Wall(dtl[i], duration / 4);
            newWall.lifeStart = dtl[i];
            newWall.animate.dissolve = "wallDissolve";
            newWall.scale = [scale / thicc, scale / thicc, scale / thicc];
            newWall.color = [2, 2, 2, 2];
            newWall.animate.scale = [thicc, thicc, thicc * randomNumber(2,5)];
            const [r, t] = [randomNumber(70, 100), randomNumber(-30, 210)];
            const [x, y, z] = [r * cos(t), r * sin(t), randomNumber(-20, 300)];
            newWall.animate.definitePosition = [[x, y, z, 0], [x, y, z - 300, 1]];
            newWall.animate.localRotation = [randomNumber(-5, 5), randomNumber(-5, 5), 0];
            newWall.push();
        }
        new CustomEvent(dtl[i]).animateTrack("noteBodies", duration / 2, {_scale: "noteDropScale", _position: "noteDropPos"}).push();
    }
});
let noteSide: number;
pushPointDef(map, "noteFloat0", [[-8, 0, 0, 0], [0, 0, 0, 0.2, "easeOutCirc"]]);
pushPointDef(map, "noteFloat1", [[8, 0, 0, 0], [0, 0, 0, 0.2, "easeOutCirc"]]);
pushPointDef(map, "arrowAppear", [[0, 0], [1, 0.2, "easeOutCirc"]]);
const [NJS, offset] = [16, 0.4];
multipleNotesBetweens([[100, 164], [252, 316]], note => {
    newNote = new Note(note.time, note.type, note.direction, note.position);
    note.noteGravity = false;
    note.track.value = "dropNotes"
    newNote.noteGravity = false;
    newNote.animate.dissolveArrow = "dissolved";
    newNote.animate.position = `noteFloat${note.type}`;
    note.animate.dissolve = "dissolved";
    note.animate.dissolveArrow = "arrowAppear";
    newNote.track.value = "noteBodies";
    newNote.fake = true;
    newNote.interactable = false;
    note.NJS = NJS;
    note.offset = offset;
    newNote.NJS = NJS;
    newNote.offset = offset;
    newNote.push();
});
let peaks: number[] = [];
pushPointDef(map, "waterPeaks", [[0, wy + 2, 0, 0], [0, wy, 0, 0.5, "easeOutCirc"], [0, wy + 2, 0, 1, "easeInCirc"]]);
onTrigger(0, 358, null, ev => {
    if (ev.json._customData && ev.json._customData._lightGradient && ev.json._customData._lightGradient._startColor && ev.json._customData._lightGradient._startColor[3] >= 1) {
        peaks.push(ev.time);
    }
}, false, false, 1);
new CustomEvent(0).animateTrack("Water", peaks[0], {_position: [[0, wy, 0, 0], [0, wy + 2, 0, 1, "easeInCirc"]]}).push();
for (let i = 0; i < peaks.length; i++) {
    if (i == peaks.length - 1) {
        new CustomEvent(peaks[i]).animateTrack("Water", 8, {_position: [[0, wy + 2, 0, 0], [0, wy, 0, 1, "easeOutCirc"]]}).push();
    } else {
        duration = peaks[i+1] - peaks[i];
        new CustomEvent(peaks[i]).animateTrack("Water", duration, {_position: "waterPeaks"}).push();
    }
}
//#endregion env

//#region bombrings
let bombRings: string[] = [];
for (let i = 0; i < 10; i++) {
    pushPointDef(map, `bombRingSpin${i}`, [
        [0, 0, 0, 0],
        [0, 0, 90 * (i % 2 - 0.5) * 2, i / 20 + 0.55, "easeInOutCubic"]
    ]);
    bombRings.push(`bombRingLayer${i}`);
}
for (let i = 0; i < 10; i++) {
    for (let j = 0; j < 4; j++) {
        newNote = new Note(252+32.01, NOTE.BOMB, 0, [0, 0]);
        newNote.life = 64;
        newNote.fake = true;
        newNote.interactable = false;
        newNote.color = [1, 0.591, 0.388, 1];
        newNote.animate.definitePosition = [1.5, 5, 5 + 2 * i];
        newNote.animate.rotation = [0, 0, 45 + 90 * j];
        newNote.animate.dissolve = [[0, 0], [1, 1/64, "easeOutCubic"], [1, 63/64], [0, 1, "easeInCubic"]];
        newNote.track.value = `bombRingLayer${i}`;
        newNote.push();
    }
}
for (let i = 0; i < secondDropTimes.length; i++) {
    duration = (i == secondDropTimes.length - 1) ? 0.5 : secondDropTimes[i+1] - secondDropTimes[i];
    for (let j = 0; j < 10; j++) {
        new CustomEvent(secondDropTimes[i]).animateTrack(`bombRingLayer${j}`, duration, {_rotation: `bombRingSpin${j}`}).push();
    }
}
//#region standard notes
pushPointDef(map, "bodyAppear", [[0, 0], [1, 0.4, "easeOutCirc"]]);
onAllNotes(note => {
    note.spawnEffect = false;
    if (!note.track.value) {
        note.track.value = "notes";
        note.animate.position = `standardNotePosAnimation${note.direction}`;
        // note.animate.localRotation = `standardNoteRotAnimation${note.direction}`;
        note.animate.dissolveArrow = "arrowAppear";
        note.animate.dissolve = "bodyAppear";
        note.NJS = 14;
        note.offset = 0.3;
    }
});
const noteDirections = [3, 5, 0, 4, 2, 6, 1, 7];
const magnitude = 3;
for (let i = 0; i <= 7; i++) {
    const angle = i * 45;
    const noteDirection = noteDirections[i];
    pushPointDef(map, `standardNotePosAnimation${noteDirection}`, [
        [magnitude * cos(angle), magnitude * sin(angle), magnitude, 0],
        [0, 0, 0, 0.5, "easeOutCirc"]
    ]);
    // pushPointDef(map, `standardNoteRotAnimation${noteDirection}`, [
    //     [0, 0, 0, 0],
    //     [0, 0, 0, 0.5, "easeOutCirc"]
    // ])
}
pushPointDef(map, "standardNotePosAnimation8", [[0, 0, 3, 0], [0, 0, 0, 5, "easeOutCirc"]])

//#endregion

//#endregion
new CustomEvent().assignTrackParent(bombRings, "bombRings", true).push();
new CustomEvent().assignPlayerToTrack("player").push();
new CustomEvent().assignTrackParent(["notes", "bombRings", "noteBodies"], "player").push();
new CustomEvent(316).animateTrack("player", 16, {_position: [[0, 0, 0, 0], [0, 0, -50, 1, "easeInQuad"]]}).push();
new CustomEvent(332).animateTrack("player", 12, {_position: [[0, 0, -50, 0], [0, 30, -87.5, 1]]}).push();
new CustomEvent(344).animateTrack("player", 12, {_position: [[0, 30, -87.5, 0], [0, 60, -125, 1]]}).push();

map.suggest("Chroma");
map.require("Noodle Extensions", true)
map.save();