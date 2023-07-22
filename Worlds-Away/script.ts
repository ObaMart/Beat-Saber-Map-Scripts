// deno-lint-ignore-file no-unused-vars ban-unused-ignore
//#region map setup
import {
    Difficulty, Environment, Event, LightRemapper, CustomEvent, KeyframesAny, EASE,
    ModelScene, Geometry, Vec3, Note, LOOKUP, Regex, Vec4, ComplexKeyframesVec3,
    NOTE, MODS, KeyframesLinear, KeyframesVec3, KeyframesVec4, ENV, debugObject,
    Color, COLOR, ColorType, Wall, WALL, ComplexKeyframesVec4, ComplexKeyframesLinear,
    RMLog, notesBetween, FILEPATH, DIFFS, exportZip, transferVisuals
} from "https://deno.land/x/remapper@2.1.0/src/mod.ts";

import {
    removeIds, onTrigger, hex2rgb, onAllNotes, rr, randomInt, randomNumber, randomMirror,
    HSVAtoRGBA, onAllWalls, pushPointDef, multipleNotesBetweens, cos, sin, extrapolateVec3,
    mirrorX, eVec3, mirrorEnv, easeOutCirc, multipleEventsBetweens, RGBAtoHSVA, flicker,
    easeOutExpo, easeInExpo, multiplyColor, rd, hexa2rgba, randomChoice, range, generateSpins,
    Text, modelToWall, interpolateVec3, easyVec
} from "https://deno.land/x/rmplus@1.0.0/mod.ts"
// I'm not even using half of these functions but I'm not gonna remove them from the import because I'll forget they exist when I make a new map

import { makeNoise2D } from "https://deno.land/x/open_simplex_noise@v2.5.0/mod.ts";
const noise2D = makeNoise2D(Date.now());

// setup for downdiffs
const renderLyrics = true;
const exportToZip = true;
const transferLowers = true;
const lowerDiffs: [FILEPATH<DIFFS>, FILEPATH<DIFFS>, number][] = [
    // ["ExpertPlusLawless", "ExpertPlusStandard", 0], // Oba's E+ (finished)
    ["ExpertLawless", "ExpertStandard", 0], // Crator's E+ (finished)
    ["HardLawless", "HardStandard", 0.5], // Crator's E (finished)
    ["NormalLawless", "NormalStandard", 1], // Oba's E (finished)
    ["EasyLawless", "EasyStandard", 2], // Oba's H (wip)
]
if (transferLowers) {
    lowerDiffs.forEach(([inputName, outputName, noteOffsetAdd]) => {
        const map = new Difficulty(inputName, outputName);
        applyNotemods(noteOffsetAdd);
        exportMap(map);
        map.save();
    });
}
const map = new Difficulty("ExpertPlusLawless", "ExpertPlusStandard");
//#endregion map setup

//#region map constants
const YEET = <Vec3>[0, -69420, 0]
const waterfall = {
    scale: <Vec3>[500, 1, 5],
    position: <Vec3>[0, -1, -120],
    id: "Waterfall$",
    track: "waterfall"
}
const rainRipples = {
    scale: <Vec3>[3, 1, 3],
    position: <Vec3>[0, -1, 10],
    id: "WaterRainRipples$",
    track: "rainRipples"
}
const smoke = {
    scale: <Vec3>[10,0,10],
    position: <Vec3>[0, 0, 0],
    id: "BigSmokePS$",
    track: "smoke"
}
const sunC = {
    position: <Vec3>[0, 0, 150],
    id: new Regex().add("Sun").end()
}
const tubeL = {
    position: <Vec3>[-8, 0, 0],
    rotation: <Vec3>[90, 0, -4],
    scale: <Vec3>[1, 100, 1],
    id: new Regex().add("LightRailingSegment").vary(1).separate().add("NeonTubeDirectionalL( \\(1\\))?").end(),
    track: "neonTubeL"
}
const tubeR = {
    position: <Vec3>[8, 0, 0],
    rotation: <Vec3>[90, 0, 4],
    scale: <Vec3>[1, 100, 1],
    id: new Regex().add("LightRailingSegment").vary(1).separate().add("NeonTubeDirectionalR( \\(1\\))?").end(),
    track: "neonTubeR"
}
//#endregion map constants

//#region point definitions
const pointDefs: Record<string, KeyframesAny> = {
    yeet: [-69420, -69420, -69420],

    dissolveIn: [[0, 0], [1, 1]],
    dissolveOut: [[1, 0], [0, 1]],

    wallDissolve: [[0, 0], [1, 1/8], [1, 7/8], [0, 1]],
    wallDissolveHalf: [[0, 0], [0.45, 1/8], [0.45, 7/8], [0, 1]],
    wallDissolvePart: [[0, 0], [0.7, 1/8], [0.7, 7/8], [0, 1]],

    nDisVerse: [[0, 0], [1, 0.7, "easeOutQuad"]],
    nDisVerseArrow: [[0, 0], [1, 0.4, "easeOutCubic"]],
    nDisVerseDrums: [[0, 0], [1, 0.55, "easeOutQuad"]],
    nDisVerseDrumsArrow: [[0, 0], [1, 0.3, "easeOutCubic"]]
}
for (const dir of [-1, 1]) {
    const side = (dir == 1) ? "R" : "L";
    for (let layer = 0; layer < 3; layer++) {
        pointDefs[`nPosVerse${layer}${side}`] = [
            [dir * 5, -1 - layer, 0, 0],
            [0, 0, 0, 0.4, "easeOutQuad"]
        ];
        pointDefs[`nPosBridge${layer}${side}`] = [
            [dir * 10, (layer - 1) * 10, 10, 0],
            [0, 0, 0, 0.4, "easeOutQuad"]
        ]
    }
    pointDefs[`nLocRotVerse${side}`] = [
        [0, 0, dir * -35, 0.1],
        [0, 0, 0, 0.5, "easeOutSine"]
    ]
    pointDefs[`nPosVerseDrums${side}`] = [
        [dir * 3, 3, 3, 0],
        [0, 0, 0, 0.4, "easeOutQuad"]
    ]
    pointDefs[`nPosDrop1${side}`] = [
        [dir * 5, 0, 0, 0],
        [0, 0, 0, 0.4, "easeOutQuad"]
    ]
}

for (const name in pointDefs) {
    map.pointDefinitions.push({_name: name, _points: pointDefs[name]});
}
//#endregion point definitions

//#region functions
function animatePlayersPlace(time: number, position: KeyframesVec3 | string, duration = 1) {
    new CustomEvent(time).animateTrack("playersPlace", duration, {_position: position}).push() 
}
function yeetBase(time: number) { // yeets the env for verse
    new CustomEvent(time).animateTrack(waterfall.track, 1, {_position: "yeet"}).push()
    new CustomEvent(time).animateTrack(rainRipples.track, 1, {_position: "yeet"}).push()
    new CustomEvent(time).animateTrack(smoke.track, 1, {_position: "yeet"}).push()
    new CustomEvent(time).animateTrack(tubeL.track, 1, {_position: "yeet"}).push()
    new CustomEvent(time).animateTrack(tubeR.track, 1, {_position: "yeet"}).push()
    animatePlayersPlace(time, [0, -69420, -100]);
}
function yeetBaseBack(time: number) { // puts back the env for verse
    new CustomEvent(time).animateTrack(waterfall.track, 1, {_position: waterfall.position}).push()
    new CustomEvent(time).animateTrack(rainRipples.track, 1, {_position: rainRipples.position}).push()
    new CustomEvent(time).animateTrack(smoke.track, 1, {_position: smoke.position}).push()
    new CustomEvent(time).animateTrack("neonTubeL", 1, {_position: tubeL.position}).push()
    new CustomEvent(time).animateTrack("neonTubeR", 1, {_position: tubeR.position}).push()
    animatePlayersPlace(time, [0, 0, 0]);
}
function shockwave(time: number) { // moves sun away to get shockwave type effect
    new CustomEvent(time).animateTrack("sun", 1, {_position: [0, -100, -800]}).push()
}
function sun(time: number) { // moves sun back to original position
    new CustomEvent(time).animateTrack("sun", 1, {_position: sunC.position}).push()
}
function hole(time: number) { // moves the sun really far away and it kinda looks like a hole or idk
    new CustomEvent(time).animateTrack("sun", 1, {_position: [0, 0, 800]}).push()
}
function fogAttentuation(time: number, animation: KeyframesLinear, duration = 0) {
    const animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    animTrack.animate.startY = [-1000];
    animTrack.animate.height = [0];
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}
function wind(starttime: number, endtime: number, intensity = 5, frequency = 8, randomization = 1) {
    for (let t = starttime; t < endtime; t += frequency) {
        new CustomEvent(t + randomNumber(-randomization, randomization)).animateTrack("rain", frequency/2, {_rotation: [
            [0, 0, 30, 0],
            [0, 0, 30+intensity, 0.5, "easeInOutSine"],
            [0, 0, 30, 1, "easeInOutSine"]
        ]}).push();
    }
}
function stars(starttime: number, duration: number, lifetime: number, wallsPerBeat: number, boundingBox: [[number, number, number], [number, number, number]], randomization = 5, color: [number, number, number, number]) {
    // I love this effect
    for (let i = 0; i < duration; i++) {
        for (let j = 0; j < wallsPerBeat; j++) {
            const star = new Wall(starttime+i+j/wallsPerBeat, lifetime, WALL.FULL, 0, 1);
            star.fake = true;
            star.interactable = false;
            star.color = color;
            star.scale = [1/100, 1/100, 1/100];
            star.animate.dissolve = "wallDissolve";
            const b = boundingBox;
            const [x, y, z] = [randomNumber(b[0][0], b[1][0]), randomNumber(b[0][1], b[1][1]), randomNumber(b[0][2], b[1][2])];
            star.animate.definitePosition = [
                [rd(x), rd(y), rd(z), 0],
                [rd(x+randomNumber(-randomization, randomization)), rd(y+randomNumber(-randomization, randomization)), rd(z+randomNumber(-randomization, randomization)), 1]
            ];
            star.animate.localRotation = [
                [rd(randomNumber(-180, 180)), rd(randomNumber(-180, 180)), rd(randomNumber(-180, 180)), 0],
                [rd(randomNumber(-180, 180)), rd(randomNumber(-180, 180)), rd(randomNumber(-180, 180)), 1]
            ];
            star.animate.scale = [10, 10, 10];
            star.customData._track = "stars";
            star.push();
        }
    }
}
//#endregion functions

//#region env
//#region env building
removeIds([
    "Mountains",
    "RailingCurve",
    "NarrowGameHUD",
    "Clouds",
    "RailingFull",
    "LeftRail",
    "LeftFarRail",
    "RightRail",
    "RightFarRail"
])
removeIds([
    new Regex().add("LightRailingSegment").separate().add("NeonTubeDirectional(L|R)( \\(1\\))?").end(),
    new Regex().add("LightRailingSegment").vary(2).separate().add("NeonTubeDirectional(L|R)").end(),
    new Regex().add("LightRailingSegment").vary(3).separate().add("NeonTubeDirectional(L|R)( \\(1\\))?").end()
], "Regex")
let env = new Environment(waterfall.id, "Regex");
env.scale = waterfall.scale;
env.position = waterfall.position;
env.track = waterfall.track;
env.push();
env = new Environment(rainRipples.id, "Regex");
env.scale = rainRipples.scale;
env.position = rainRipples.position;
env.track = rainRipples.track;
env.push();
env = new Environment(smoke.id, "Regex");
env.scale = smoke.scale;
env.position = smoke.position;
env.track = smoke.track;
env.push();
env = new Environment(sunC.id, "Regex");
env.position = sunC.position;
env.track = "sun";
env.push();
env = new Environment(tubeL.id, "Regex");
env.position = tubeL.position;
env.rotation = tubeL.rotation;
env.scale = tubeL.scale;
env.track = tubeL.track;
env.push();
env = new Environment(tubeR.id, "Regex");
env.position = tubeR.position;
env.rotation = tubeR.rotation;
env.scale = tubeR.scale;
env.track = tubeR.track;
env.push();

const bloomRadius = 50
env = new Environment(new Regex().add("LightRailingSegment").vary(0).separate().add("NeonTubeDirectionalL").vary(1).end(), "Regex");
env.position = [cos(120) * bloomRadius, sin(120) * bloomRadius, 0];
env.scale = [1, 1000, 1];
env.push();
env = new Environment(new Regex().add("LightRailingSegment").vary(0).separate().add("NeonTubeDirectionalR").vary(1).end(), "Regex");
env.position = [cos(-60) * bloomRadius, sin(-60) * bloomRadius, 0];
env.scale = [1, 1000, 1];
env.push();
env = new Environment(new Regex().add("LightRailingSegment").vary(2).separate().add("NeonTubeDirectionalL").vary(1).end(), "Regex");
env.position = [cos(180) * bloomRadius, sin(180) * bloomRadius, 0];
env.scale = [1, 1000, 1];
env.push();
env = new Environment(new Regex().add("LightRailingSegment").vary(2).separate().add("NeonTubeDirectionalR").vary(1).end(), "Regex");
env.position = [cos(0) * bloomRadius, sin(0) * bloomRadius, 0];
env.scale = [1, 1000, 1];
env.push();
env = new Environment(new Regex().add("LightRailingSegment").vary(3).separate().add("NeonTubeDirectionalL").vary(1).end(), "Regex");
env.position = [cos(-120) * bloomRadius, sin(-120) * bloomRadius, -500];
env.scale = [1, 1000, 1];
env.push();
env = new Environment(new Regex().add("LightRailingSegment").vary(3).separate().add("NeonTubeDirectionalR").vary(1).end(), "Regex");
env.position = [cos(60) * bloomRadius, sin(60) * bloomRadius, -500];
env.scale = [1, 1000, 1];
env.push();

env = new Environment("Rain$", "Regex");
env.rotation = [0, 0, 30];
env.position = [0, 10, 10]
env.track = "rain";
env.push();
const laserHeight = -2
for (let i = 0; i <= 8; i++) {
    let id = new Regex().add("BottomPairLasers").vary(i).separate().add("PillarL").end(); // .separate().add("RotationBaseL")
    env = new Environment(id, "Regex");
    env.rotation = [30-5*i, 0, -45+5*i];
    env.position = [-25 - 7*i, laserHeight, 86-2*i];
    env.scale = [1, 1, 1];
    env.track = `L${i+1}`;
    // laserTracks.push(`L${i+1}`);
    env.push();
    id = new Regex().add("BottomPairLasers").vary(i).separate().add("PillarR").end(); // .separate().add("RotationBaseR")
    env = new Environment(id, "Regex");
    env.rotation = [30-5*i, 0, 45-5*i];
    env.scale = [1, 1, 1];
    env.position = [25 + 7*i, laserHeight, 86-2*i];
    env.track = `R${i+1}`;
    // laserTracks.push(`R${i+1}`);
    env.push();
}
env = new Environment("PlayersPlace$", "Regex");
env.track = "playersPlace";
env.push();
//#endregion env building
wind(1, 131, 5, 12, 1)
yeetBase(132);
new CustomEvent(132).animateTrack("rain", 1, {_rotation: [[0, 0, 0, 0], [90, 0, 0, 1]], _position: [[0, 10, 10, 0], [0, 0, 10, 1]]}).push();
yeetBaseBack(204);
wind(204, 326, 5, 12, 1)
new CustomEvent(196).animateTrack("rain", 8, {_rotation: [[90, 0, 0, 0], [0, 0, 30, 1]], _position: [[0, 0, 10, 0], [0, 10, 10, 1]]}).push();
new CustomEvent(324).animateTrack(waterfall.track, 8, {_position: [[...waterfall.position, 0], [...(waterfall.position.map((v, i) => (i == 1) ? v - 30 : v) as Vec3), 1, "easeInQuad"]]}).push();
new CustomEvent(324).animateTrack(rainRipples.track, 8, {_position: [[...rainRipples.position, 0], [...(rainRipples.position.map((v, i) => (i == 1) ? v - 30 : v) as Vec3), 1, "easeInQuad"]]}).push();
new CustomEvent(324).animateTrack(smoke.track, 8, {_position: [[...smoke.position, 0], [...(smoke.position.map((v, i) => (i == 1) ? v - 30 : v) as Vec3), 1, "easeInQuad"]]}).push();
new CustomEvent(324).animateTrack(tubeL.track, 8, {_position: [[...tubeL.position, 0], [...(tubeL.position.map((v, i) => (i == 0) ? v - 50 : v) as Vec3), 1, "easeInQuad"]]}).push();
new CustomEvent(324).animateTrack(tubeR.track, 8, {_position: [[...tubeR.position, 0], [...(tubeR.position.map((v, i) => (i == 0) ? v + 50 : v) as Vec3), 1, "easeInQuad"]]}).push();
yeetBase(332);
shockwave(332);
new CustomEvent(332).animateTrack("rain", 1, {_scale: [0, 0, 0]}).push();
hole(396);
//#endregion env

//#region fog
new CustomEvent().assignFogTrack("fog").push();
new CustomEvent().animateTrack("fog", 1, {_startY: [-69420], _height: [0]}).push();
//#endregion fog

//#region walls
// verse 1 stars
const starsBbox: [[number, number, number], [number, number, number]] = [[-50, 6, -25], [50, 50, 100]];
stars(68, 64, 32, 4, starsBbox, 2, hexa2rgba("#4287f5", 1));
new CustomEvent(130).animateTrack("stars", 2, {_dissolve: "dissolveOut"}).push();

// drop 1 jump wall rings
for (let t = 132; t <= 194; t++) {
    const ringDirection = (t % 2 - 0.5) * 2 // alternating -1 and 1
    for (let rt = 0; rt < 18; rt++) {
        const wall = new Wall();
        wall.lifeStart = t;
        wall.life = 4;
        wall.fake = true;
        wall.interactable = false;
        wall.animate.dissolve = "wallDissolve"
        const wallWidth = randomNumber(7, 15);
        const wallHeight = randomNumber(5, 10);
        wall.scale = [wallWidth, wallHeight, randomNumber(5, 20)];
        const zOffset = randomNumber(-10, 10)
        wall.animate.definitePosition = [[-wallWidth/2, 20, 100+zOffset, 0], [-wallWidth/2, 60, zOffset, 1, "easeInCirc"]];
        wall.animate.scale = [[1, 1, 1, 0], [3, 2, 2, 1, "easeInCirc"]];
        wall.animate.rotation = [[0, 0, rt*20, 0], [0, 0, rt*20 + 90 * ringDirection, 1]];
        wall.animate.color = [[...eVec3(10), 10, 0], [...multiplyColor(HSVAtoRGBA([randomNumber(0, 1/6), randomNumber(0.5, 1), 1, 1]), 3, 2), 0.5, "easeOutCirc"]];
        wall.track.value = "wallRings"
        wall.push();
    }
}

// drop 1 wall tunnel (actually)
const ringWallAmt = 360;
for (let i = 0; i < ringWallAmt; i++) {
    const wall = new Wall();
    wall.lifeStart = 132 + i/ringWallAmt;
    wall.life = 64 - i/ringWallAmt;
    wall.interactable = false;
    wall.fake = true;
    wall.animate.dissolve = "wallDissolve";
    wall.scale = [1, 1, 1000];
    wall.animate.definitePosition = [-1/2, 60, -500];
    // wall.animate.rotation = [0, 0, i/ringWallAmt*360];
    wall.animate.rotation = generateSpins(4, 2, [0, 0, i/ringWallAmt*360])
    wall.color = multiplyColor([1, 0.2, 0.1, 1], 5, 5);
    wall.push();
}
new CustomEvent(193.5).animateTrack("wallRings", 2.5, {_dissolve: "dissolveOut"}).push();

// build to bridge 8 point star thingy
for (let i = 0; i < 8; i++) {
    const wall = new Wall();
    wall.lifeStart = 316;
    wall.life = 24;
    wall.animate.dissolve = [[0, 0], [1, 2/3], [0, 1, "easeOutCirc"]];
    wall.animate.definitePosition = [0, 10, 30];
    wall.scale = [0.5, 10, 0.5];
    wall.animate.rotation = [[0, 0, i*45, 0], [0, 0, i*45 + 90, 1/4], [0, 0, i*45 + 180, 1/2], [0, 0, i*45 + 270, 3/4], [0, 0, i*45, 1]];
    wall.animate.color = [1, 1, 1, 1];
    wall.track.value = "wallOctagon"
    wall.push();
}
for (let t = 324; t < 332; t += 1/2) {
    new CustomEvent(t).animateTrack("wallOctagon", 1/2, {_color: [[...eVec3(5 + (t-324)/8 * 15), 5 + (t-324)/8 * 15, 0], [1, 1, 1, 1, 1]]}).push();
}

// bridge wall scatter
let tunnelWallAmt = 100
for (let i = 0; i < tunnelWallAmt; i++) {
    const wall = new Wall();
    wall.track.value = "wallTunnel";
    // wall.track.add(`wallTunnel${i}`);
    wall.lifeStart = 332 + i/tunnelWallAmt*2;
    wall.life = 192 - i/tunnelWallAmt*2;
    wall.animate.color = HSVAtoRGBA([randomNumber(0, 1/6), randomNumber(0.5, 1), 1, 1]).map(v => v * 5) as Vec4;
    wall.fake = true;
    wall.interactable = false;
    const wallPos: Vec3 = [randomNumber(-10, 10), randomNumber(50, 70), randomNumber(-150, 400)];
    wall.animate.definitePosition = [[...wallPos, 0], [...(wallPos.map((v, i) => i == 1 ? v + randomNumber(0, 30) : v + randomNumber(-10, 10)) as Vec3), 1 ]];
    wall.scale = [4, 6, 4].map(v => v += randomNumber(-2.5, 2.5)) as Vec3;
    const wallRot: Vec3 = [0, 0, rr()];
    wall.animate.rotation = [[...wallRot, 0], [...(wallRot.map(v => v + randomNumber(-45, 45)) as Vec3), 1]]
    wall.animate.localRotation = [rr(), rr(), rr()];
    wall.customData._disableNoteGravity = true;
    wall.animate.dissolve = (wallPos[1] < 45) ? "wallDissolveHalf" : "wallDissolvePart";
    wall.push();
}

// bridge walls to blue
const bluetone = 20;
new CustomEvent(332).animateTrack("wallTunnel", 64, {_color: [1, 1, bluetone, 1]}).push();
// bridge buildup to drop wall flash
for (const t of range(364, 388).concat(range(388, 396, 1/2))) {
    const intensity = 1.5 + ((t - 364) / 32 * 3.5);
    // console.log(t, intensity)
    new CustomEvent(t).animateTrack("wallTunnel", 1/2, {_color: [[intensity, intensity, intensity * bluetone, intensity, 0], [1, 1, 6, 1, 1]]}).push();
}
// drop 2 wall scatter
tunnelWallAmt = 200
for (let i = 0; i < tunnelWallAmt; i++) {
    const wall = new Wall();
    wall.track.value = "wallTunnel"; 
    // wall.track.add(`wallTunnel${200+i}`);
    wall.lifeStart = 396 + i/tunnelWallAmt*2;
    wall.life = 128 - i/tunnelWallAmt*2;
    wall.animate.color = HSVAtoRGBA([randomNumber(0, 1/6), randomNumber(0.5, 1), 1, 1]).map(v => v * 5) as Vec4;
    wall.fake = true;
    wall.interactable = false;
    const wallPos: Vec3 = [randomNumber(-10, 10), randomNumber(50, 70), randomNumber(-150, 400)];
    wall.animate.definitePosition = [[...wallPos, 0], [...(wallPos.map((v, i) => i == 1 ? v + randomNumber(0, 30) : v + randomNumber(-10, 10)) as Vec3), 1 ]];
    // console.log(`${wall.animate.definitePosition[0][1]}->${wall.animate.definitePosition[1][1]}`)
    wall.scale = [6, 10, 5].map(v => v += randomNumber(-2.5, 2.5)) as Vec3;
    const wallRot: Vec3 = [0, 0, rr()];
    wall.animate.rotation = [[...wallRot, 0], [...(wallRot.map(v => v + randomNumber(-45, 45)) as Vec3), 1]]
    wall.animate.localRotation = [rr(), rr(), rr()];
    wall.customData._disableNoteGravity = true;
    wall.animate.dissolve = (wallPos[1] < 45) ? "wallDissolveHalf" : "wallDissolvePart";
    wall.push();
}
// new CustomEvent(396).animateTrack("wallTunnel", 1, {_color: [1, 1, 1, 1]}).push();
// drop 2 wall scatter flashing on beat
for (let t = 396; t < 524; t++) {
    new CustomEvent(t).animateTrack("wallTunnel", 1, {_color: [[2, 2, 2, 2, 0], [1, 1, 1, 1, 1, "easeInCirc"]]}).push();
}

// let lr = 1
// for (let t = 460; t < 620; t += 0.1) {
//     const wall = new Wall(t, 16);
//     lr = (lr == 1) ? -1 : 1;
//     wall.fake = true;
//     wall.interactable = false;
//     wall.scale = [0.5, 0.1, 1];
//     const h = (t > 525) ? 0.5 : 2;
//     const w = (t > 525) ? 2 : 4;
//     wall.animate.position = [cos((t-460)*90)*w*lr, -0.5+Math.abs(cos((t-460)*90)) * h, 5];
//     const ri = (t > 525) ? 30 : 90;
//     wall.animate.localRotation = [0, 0, ri*cos((t-460)*90)*lr]
//     wall.animate.dissolve = "wallDissolve";
//     wall.color = HSVAtoRGBA([randomNumber(1/2, 3/4), randomNumber(0.5, 1), 1, 1])
//     wall.track.value = "trackSteps";
//     wall.push();
// }
// drop 2 bridge lyrics steps
new CustomEvent(324).animateTrack("trackSteps", 1, {_dissolve: "dissolveOut"}).push();
for (let t = 332; t < 620; t += 0.4) {
    for (let x = -3; x <= 3; x += 2) {
    // for (let x = -2; x <= 2; x += 2) {
        const wall = new Wall(t, 2);
        // wall.NJS = 10;
        // wall.offset = 1;
        wall.NJS = 8;
        wall.scale = [2, 10 + noise2D(x, t * 5) / 2, 2]
        wall.animate.position = [x - 1, -10.5, 0];
        wall.track.value = "trackSteps";
        wall.fake = true;
        wall.interactable = false;
        wall.animate.dissolve = (x == -3 || x == 3) ? "wallDissolveHalf" : "wallDissolvePart";
        wall.animate.color = multiplyColor(HSVAtoRGBA([randomNumber(30/360, 60/360), randomNumber(0.15, 0.4), randomNumber(0.7, 1), 1]), 1, 1);
        wall.push();
    }
}
new CustomEvent(332).animateTrack("trackSteps", 16, {_dissolve: "dissolveIn"}).push();
// post drop stars
new CustomEvent(522).animateTrack("stars", 2, {_dissolve: "dissolveIn"}).push();
stars(524, 64, 64, 4, starsBbox, 2, [1, 1, 1, 1]);

// outro dissolve everything
new CustomEvent(602).animateTrack("stars", 18, {_dissolve: "dissolveOut"}).push();
new CustomEvent(602).animateTrack("trackSteps", 18, {_dissolve: "dissolveOut", _color: [[1, 1, 1, 1, 0], [...multiplyColor([...hex2rgb("#5c99ff"), 1], 2, 1), 1]]}).push();

onAllWalls(wall => {
    wall.interactable = false;
    wall.fake = true;
})
//#endregion walls

//#region player
new CustomEvent().assignPlayerToTrack("player").push();
const childrenTracks = ["notes", "trackSteps"];
if (renderLyrics) childrenTracks.push("text");
new CustomEvent().assignTrackParent(childrenTracks, "player").push();
new CustomEvent().assignTrackParent(["wallTunnel"], "wallsParent").push();
new CustomEvent(130).animateTrack("player", 2, {_position: [[0, 0, 0, 0], [0, 0, 30, 1, "easeInCubic"]]}).push();
new CustomEvent(132).animateTrack("player", 1, {_position: [[0, 0, 30, 0], [0, 0, 0, 1, "easeOutQuad"]]}).push();

new CustomEvent(332).animateTrack("player", 64, {_position: [[0, 0, 0, 0], [0, 0, 250, 1]]}).push();
// new CustomEvent(396).animateTrack("player", 128, {_position: [[0, 0, 250, 0], [0, 0, 0, 1, "easeOutQuad"]]}).push();
new CustomEvent(396).animateTrack("player", 29.5, {_position: [[0, 0, 250, 0], [0, 0, 200, 1, "easeOutCubic"]]}).push();
new CustomEvent(425.5).animateTrack("player", 2.5, {_position: [[0, 0, 200, 0], [0, 0, 205, 1, "easeOutQuad"]]}).push();
new CustomEvent(428).animateTrack("player", 30, {_position: [[0, 0, 205, 0], [0, 0, 150, 1, "easeOutCubic"]]}).push();
new CustomEvent(458).animateTrack("player", 2, {_position: [[0, 0, 150, 0], [0, 0, 160, 1, "easeOutQuad"]]}).push();
new CustomEvent(460).animateTrack("player", 29.5, {_position: [[0, 0, 160, 0], [0, 0, 70, 1, "easeOutCubic"]]}).push();
new CustomEvent(489.5).animateTrack("player", 2.5, {_position: [[0, 0, 70, 0], [0, 0, 75, 1, "easeOutQuad"]]}).push();
new CustomEvent(492).animateTrack("player", 32, {_position: [[0, 0, 75, 0], [0, 0, 0, 1, "easeOutCubic"]]}).push();
new CustomEvent(396).animateTrack("wallsParent", 128, {_rotation: generateSpins(2, 2), _easing: "easeInOutSine"}).push();
//#endregion player

//#region notes
function applyNotemods(offsetAdd: number) {
    const noteBehaviors: [
        startTime: number,
        NJS: number, offset: number,
        positionAnimation?: string, localRotationAnimation?: string, dissolveAnimation?:string,
        perLayer?: boolean, randomPosAnims?: number
    ][] = [
        [0, 8, 1, "nPosVerse", "nLocRotVerse", "nDisVerse", true],
        [5, 12, 2.5, "nPosVerse", "nLocRotVerse", "nDisVerse", true],
        [35, 13, 1.5, "nPosVerseDrums", "nLocRotVerse", "nDisVerseDrums"],
        [68, 12, 2.5, "nPosVerse", "nLocRotVerse", "nDisVerse", true],
        [132, 15, 1, "nPosDrop1", undefined, "nDisVerseDrums"],
        [204, 13, 1.5, "nPosVerseDrums", "nLocRotVerse", "nDisVerseDrums"],
        [268, 12, 2.5, "nPosVerse", "nLocRotVerse", "nDisVerse", true],
        [328, 14, 1, "nPosVerseDrums", "nLocRotVerse", "nDisVerseDrums"],
        [332, 10, 3, "nPosBridge", "nLocRotVerse", "nDisVerse", true],
        [396, 16, 1, "nPosDrop1", undefined, "nDisVerseDrums"],
        [523.5, 10, 3, "nPosBridge", "nLocRotVerse", "nDisVerse", true]
    ]
    noteBehaviors.forEach(([startTime, NJS, offset, positionAnimation, localRotationAnimation, dissolveAnimation, perLayer=false, randomPosAnims=0], i) => {
        const endTime = (i == noteBehaviors.length - 1) ? 620 : noteBehaviors[i+1][0] - 0.01;
        notesBetween(startTime, endTime, note => {
            note.NJS = NJS;
            note.offset = offset + offsetAdd;
            const side = (note.type == 3) ? ((note.position[0] <= 1) ? "L" : "R") : ((note.type == 0) ? "L" : "R");
            const layerNum = (perLayer) ? note.position[1].toString() : "";
            if (positionAnimation) note.animate.position = positionAnimation + layerNum + side;
            if (localRotationAnimation) note.animate.localRotation = localRotationAnimation + side;
            if (dissolveAnimation) {
                note.animate.dissolve = dissolveAnimation;
                note.animate.dissolveArrow = dissolveAnimation + "Arrow";
            }
        });
    })

    onAllNotes(note => {
        note.track.add("notes");
        note.spawnEffect = false;
        note.noteLook = false;
        note.noteGravity = false;
    });
}
applyNotemods(0);
//#endregion notes

//#region text
const font = new Text("tzurv2");
font.position = [0, 0, 0];

type KeyframesLyrics = [[...Vec3, number], [...Vec3, number]]
type lyric = [line: string, easeInTime: number, startTime: number, endTime: number, easeOutTime: number, posAnimation: KeyframesLyrics, posEaseRandomization?: number, distribute?: boolean, scale?: number, brightness?: number, horizontalAnchor?: "Left" | "Center" | "Right", forWall?: (wall: Wall) => void, staticWalls?: boolean]
// line, easeInTime, startTime, endTime, easeOutTime, posAnimation, posEaseRandomization=3, scale=2, brightness=20, horizontalAnchor="Center", forWall

const [floatStart, floatEnd, floatSideOffset, floatUnderHeight, floatBottomHeight, floatTopHeight] = [200, 150, 50, 0, 15, 30]
const BRFloat: KeyframesLyrics = [[floatSideOffset, floatBottomHeight, floatStart, 0], [floatSideOffset, floatBottomHeight, floatEnd, 1]];
const BLFloat: KeyframesLyrics = [[-floatSideOffset, floatBottomHeight, floatStart, 0], [-floatSideOffset, floatBottomHeight, floatEnd, 1]];
const BMFloat: KeyframesLyrics = [[0, floatBottomHeight, floatStart, 0], [0, floatBottomHeight, floatEnd, 1]];
const UMFloat: KeyframesLyrics = [[0, floatUnderHeight, floatStart, 0], [0, floatUnderHeight, floatEnd, 1]];
const TRFloat: KeyframesLyrics = [[floatSideOffset, floatTopHeight, floatStart, 0], [floatSideOffset, floatTopHeight, floatEnd, 1]];
const TLFloat: KeyframesLyrics = [[-floatSideOffset, floatTopHeight, floatStart, 0], [-floatSideOffset, floatTopHeight, floatEnd, 1]];
const TLRFloat: KeyframesLyrics = [[-floatSideOffset, floatTopHeight, floatStart, 0], [floatSideOffset, floatTopHeight, floatEnd, 1]];
const TMFloat: KeyframesLyrics = [[0, floatTopHeight, floatStart, 0], [0, floatTopHeight, floatEnd, 1]];
const chorus: lyric[] = [
    ["How am I supposed",               1, -2,  3,  1, TMFloat, 3, false],
    ["to   ",                           1, 1.5, 3,  1, BMFloat, 3, false, 3, 20, "Right"],
    ["   be",                           1, 2.5, 3,  1, BMFloat, 3, false, 3, 20, "Left"],
    ["Yours",                           1, 4,   7,  1, TMFloat, 3, false],
    ["when   ",                         1, 5.5, 7,  1, BMFloat, 3, false, 3, 20, "Right"],
    ["   I",                            1, 6.5, 7,  1, BMFloat, 3, false, 3, 20, "Left"],
    ["Can't",                           1, 8,   13, 1, TLFloat, 3, false],
    ["see your face",                   1, 9.5, 13, 1, BRFloat, 3, false],

    ["How am I supposed",               1, 14,   19, 1, TMFloat, 3, false],
    ["to   ",                           1, 17.5, 19, 1, BMFloat, 3, false, 3, 20, "Right"],
    ["   not",                          1, 18.5, 19, 1, BMFloat, 3, false, 3, 20, "Left"],
    ["Miss",                            1, 20,   23, 1, TMFloat, 3, false],
    ["you   ",                          1, 21.5, 23, 1, BMFloat, 3, false, 3, 20, "Right"],
    ["   with",                         1, 22.5, 23, 1, BMFloat, 3, false, 3, 20, "Left"],
    ["All",                             1, 24,   29, 1, TLFloat, 3, false],
    ["of this space",                   1, 25.5, 29, 1, BRFloat, 3, false],

    ["'Cause you",                      1, 30.5, 37, 2, BLFloat, 3, false],
    ["say",                             1, 31.5, 37, 2, TLRFloat, 3, false, 3],
    ["you'll meet",                     1, 35,   37, 2, BRFloat, 3, false],
    ["Me",                              1, 39,   44.5, 1, BLFloat, 3, false],
    ["there",                           1, 39.5, 44.5, 1, TLRFloat, 3, false, 3],
    ["someday",                         1, 42.5, 44.5, 1, BRFloat, 3, false],

    ["But how am I supposed",           1, 45.5, 51, 1, TMFloat, 3, false],
    ["to   ",                           1, 49.5, 51, 1, BMFloat, 3, false, 3, 20, "Right"],
    ["   be",                           1, 50.5, 51, 1, BMFloat, 3, false, 3, 20, "Left"],
    ["Close",                           1, 52,   55, 1, TMFloat, 3, false],
    ["to   ",                           1, 53.5, 55, 1, BMFloat, 3, false, 3, 20, "Right"],
    ["   you",                          1, 54.5, 55, 1, BMFloat, 3, false, 3, 20, "Left"],
    ["Now?",                            1, 56,   60, 1, BMFloat, 3, false, 4, 40],
]
const bridge: lyric[] = [
    ["It's cold tonight",               1, -0.5, 3,  3, TRFloat, 3, true],
    ["Darling, are you cold tonight",   1, 6,    11, 3, BLFloat, 3, true],
    ["I just wanna hold you tight",     1, 14,   18, 2, TRFloat, 3, true],
    ["If you're really mine",           1, 20,   28, 4, BMFloat, 5, true, 4, 40],
    ["'Cause I can keep",               1, 31.5, 35, 3, TLFloat, 3, true],
    ["Shouting across the galaxies",    1, 38,   43, 3, BRFloat, 3, true],
    ["But would you do that to me",     1, 45.5, 50, 2, TLFloat, 3, true],
    ["If you're really mine",           1, 52,   60, 4, BMFloat, 5, true, 4, 40]
]
function lyricRetime(lyricList: lyric[], addTime: number) {
    return lyricList.map(lyric => lyric.map((v, i) => (i == 2 || i == 3) && typeof v == "number" ? v += addTime : v)) as lyric[]
}
if (renderLyrics) {
    const lyrics: lyric[] = [
        ...lyricRetime(chorus, 68),
        ["From worlds away", 1, 129.5, 131.5, 1, BMFloat, 50, false, 8, 40],
        ...lyricRetime(chorus, 268),
        ...lyricRetime(bridge, 332),
        ...lyricRetime(bridge, 460),
        ...lyricRetime(bridge, 524),
        ["Worlds Away", 1, 588, 602, 18, TMFloat, 5, false, 4, 20, "Center", wall => {wall.animate.color = [[...eVec3(20), 20, 0], [...multiplyColor([...hex2rgb("#5c99ff"), 1], 20, 5), 1]]}, true], // #78abff
        ["Mapped by", 1, 589.5, 602, 18, BMFloat, 5, false, 4, 20, "Center", wall => {wall.animate.color = [[...eVec3(20), 20, 0], [...multiplyColor([...hex2rgb("#5c99ff"), 1], 20, 5), 1]]}, true], // #78abff
        ["ObaMart   ", 1, 591, 602, 18, UMFloat, 3, false, 3, 20, "Right", wall => {wall.animate.color = [[...multiplyColor([...hex2rgb("#0362fc"), 1], 20, 20), 0], [...multiplyColor([...hex2rgb("#5c99ff"), 1], 20, 5), 1]]}, true],
        ["and", 1, 592, 602, 18, UMFloat, 3, false, 3, 20, "Center", wall => {wall.animate.color = [[...eVec3(20), 20, 0], [...multiplyColor([...hex2rgb("#5c99ff"), 1], 20, 5), 1]]}, true],
        ["   Cratornugget", 1, 593, 602, 18, UMFloat, 3, false, 3, 5, "Left", wall => {wall.animate.color = [[...multiplyColor([...hex2rgb("#0362fc"), 1], 20, 20), 0], [...multiplyColor([...hex2rgb("#5c99ff"), 1], 20, 5), 1]]}, true],
    ]

    let direction = 1;
    lyrics.forEach(([line, easeInTime, startTime, endTime, easeOutTime, posAnimation, posEaseRandomization=3, distribute=false, scale=2, brightness=20, horizontalAnchor="Center", forWall, staticWalls=false]) => {
        font.scale = eVec3(scale);
        font.horizontalAnchor = horizontalAnchor;
        const lineModel = font.toObjects(line);
        let leftBound = lineModel.reduce((previous, current) => current.pos[0] < previous.pos[0] ? current : previous).pos[0];
        let rightBound = lineModel.reduce((previous, current) => current.pos[0] > previous.pos[0] ? current : previous).pos[0];
        if (horizontalAnchor == "Right") {
            leftBound -= Math.abs(rightBound);
            rightBound = 0;
        } else if (horizontalAnchor == "Left") {
            rightBound += Math.abs(leftBound);
            leftBound = 0;
        }
        if (distribute) easeInTime += 1;
        direction = (direction == 1) ? -1 : 1;
        modelToWall(lineModel, startTime - easeInTime, endTime + easeOutTime, wall => {
            wall.track.add("text")
            wall.animate.color = [...eVec3(brightness), brightness];
            const [x, y, _] = wall.animate.definitePosition as Vec3;
            const posFraction = (x - leftBound) / (rightBound - leftBound)
            const posMirror = posFraction * 2 - posFraction
            if (distribute) wall.lifeStart += easeInTime * posFraction;
            // wall.life = endTime + easeOutTime - wall.lifeStart;
            wall.life = endTime - startTime + easeOutTime + easeInTime
            // const lineLife = endTime - startTime + easeOutTime + easeInTime 
            const posAnimCopy = JSON.parse(JSON.stringify(posAnimation))
            const startPos: Vec3 = [posAnimCopy[0][0] + x, posAnimCopy[0][1] + y, posAnimCopy[0][2]];
            const endPos: Vec3 = [posAnimCopy[1][0] + x, posAnimCopy[1][1] + y, posAnimCopy[1][2]];
            wall.animate.dissolve = [[0, 0], [1, easeInTime/wall.life], [1, 1 - easeOutTime/wall.life], [0, 1]];
            // wall.animate.definitePosition = [
            //     [...(extrapolateVec3(startPos, endPos, (easeInTime/life), (1 - easeOutTime/life), 0).map(v => v += randomMirror(posEaseRandomization))), 0],
            //     [...startPos, easeInTime/life],
            //     [...endPos, 1 - easeOutTime/life],
            //     [...(extrapolateVec3(startPos, endPos, (easeInTime/life), (1 - easeOutTime/life), 1).map(v => v += randomMirror(posEaseRandomization))), 1]
            // ] as KeyframesVec3;
            wall.animate.definitePosition = [
                [...(startPos.map(v => v += randomMirror(posEaseRandomization)) as Vec3), 0],
                [...interpolateVec3(startPos, endPos, easeInTime/wall.life), easeInTime/wall.life],
                [...interpolateVec3(startPos, endPos, 1 - easeOutTime/wall.life), 1 - easeOutTime/wall.life],
                [...(endPos.map(v => v += randomMirror(posEaseRandomization)) as Vec3), 1]
            ]
            // wall.animate.localRotation = [
            //     [randomMirror(30), 0, randomMirror(30), 0],
            //     [0, 0, 0, easeInTime/wall.life, "easeOutQuad"],
            //     [0, 0, 0, 1 - easeOutTime/wall.life],
            //     [randomMirror(30), 0, randomMirror(30), 1, "easeInQuad"]
            // ]
            if (!staticWalls) {
                wall.animate.rotation = [
                    [0, 0, -5 * posMirror * direction, 0],
                    [0, 10 * posMirror * (distribute ? 1 : 1/4), 15 * posMirror * direction * (distribute ? 1 : 1/4), 1, "easeInQuad"]
                ]
            }
            if (forWall) forWall(wall);
        }, 0)
    });

    // lyrics.forEach(([line, easeInTime, startTime, endTime, easeOutTime, posAnimation, posEaseRandomization=3, scale=2, brightness=20, horizontalAnchor="Center", forWall]) => {
    //     font.scale = eVec3(scale);
    //     font.horizontalAnchor = horizontalAnchor;
    //     font.toWalls(line, startTime - easeInTime, endTime + easeOutTime, wall => {
    //         wall.track.add("text")
    //         wall.animate.color = [...eVec3(brightness), brightness];
    //         const life = endTime - startTime + easeInTime + easeOutTime;
    //         const [x, y, _] = wall.animate.definitePosition as Vec3;
    //         // const [rx, ry, rz] = wall.animate.localRotation as Vec3 || wall.localRotation as Vec3;
    //         const posAnimCopy = JSON.parse(JSON.stringify(posAnimation))
    //         const startPos: Vec3 = [posAnimCopy[0][0] + x, posAnimCopy[0][1] + y, posAnimCopy[0][2]];
    //         const endPos: Vec3 = [posAnimCopy[1][0] + x, posAnimCopy[1][1] + y, posAnimCopy[1][2]];
    //         wall.animate.dissolve = [[0, 0], [1, easeInTime/life], [1, 1 - easeOutTime/life], [0, 1]];
    //         // wall.animate.definitePosition = [
    //         //     [...(extrapolateVec3(startPos, endPos, (easeInTime/life), (1 - easeOutTime/life), 0).map(v => v += randomMirror(posEaseRandomization))), 0],
    //         //     [...startPos, easeInTime/life],
    //         //     [...endPos, 1 - easeOutTime/life],
    //         //     [...(extrapolateVec3(startPos, endPos, (easeInTime/life), (1 - easeOutTime/life), 1).map(v => v += randomMirror(posEaseRandomization))), 1]
    //         // ] as KeyframesVec3;
    //         wall.animate.definitePosition = [
    //             [...(startPos.map(v => v += randomMirror(posEaseRandomization)) as Vec3), 0],
    //             [...interpolateVec3(startPos, endPos, easeInTime/life), easeInTime/life],
    //             [...interpolateVec3(startPos, endPos, 1 - easeOutTime/life), 1 - easeOutTime/life],
    //             [...(endPos.map(v => v += randomMirror(posEaseRandomization)) as Vec3), 1]
    //         ]
    //         if (forWall) forWall(wall);
    //     }, 0);
    // });
}
//#endregion text

//#region optimization
// wall counter
const wallTimes: Record<string, number> = {};
for (const wall of map.walls) {
    const time = Math.floor(wall.time);
    for (let i = 0; i < wall.duration; i++) {
        if (wallTimes[time+i]) {
            wallTimes[time+i]++;
        } else {
            wallTimes[time+i] = 1;
        }
    }
}
for (const key of Object.keys(wallTimes)) {
    if (wallTimes[key] > 750) {
        console.log(`beat ${key}: ${wallTimes[key]} walls`)
    }
}
//#endregion optimizations

//#region export
function exportMap(diff: Difficulty) {
    diff.require("Noodle Extensions", true);
    diff.require("Chroma", true);
    diff.suggest("Chroma", false);
    diff.colorLeft = hex2rgb("#fc9056");
    diff.colorRight = hex2rgb("#5a80e0");
}

exportMap(map);
map.save();
if (transferLowers) transferVisuals(["ExpertStandard", "HardStandard", "NormalStandard", "EasyStandard"]);

if (exportToZip) exportZip(["ExpertPlusLawless", "ExpertLawless", "HardLawless", "NormalLawless", "EasyLawless"], "WorldsAway");
//#endregion export
