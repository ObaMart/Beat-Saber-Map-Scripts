// deno-lint-ignore-file prefer-const no-unused-vars no-explicit-any
import {
    Difficulty, Environment, Event, LightRemapper, CustomEvent,
    ModelScene, Geometry, Vec3, Note, GEO_SHADER, LOOKUP, Regex,
    NOTE, MODS, KeyframesLinear, KeyframesVec3, KeyframesVec4, ENV, debugObject,
    Color, COLOR, ColorType, Wall, WALL, ComplexKeyframesVec4, ComplexKeyframesLinear
} from "https://deno.land/x/remapper@2.1.0/src/mod.ts";
const map = new Difficulty("ExpertPlusLawless.dat", "ExpertPlusStandard.dat");
const exportMap = false; // This was to easily switch disablenotelook but I am lazy and never turned it back on but I don't really care

// I am very certain that I did not do everything as efficient as possible, this is my first modchart / map with remapper.

//#region map constants
const yeet = <Vec3>[0, -69420, 0]
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
    id: new Regex().add("LightRailingSegment").vary(1).separate().add("NeonTubeDirectionalL( \\(1\\))?").end()
}
const tubeR = {
    position: <Vec3>[8, 0, 0],
    rotation: <Vec3>[90, 0, 4],
    scale: <Vec3>[1, 100, 1],
    id: new Regex().add("LightRailingSegment").vary(1).separate().add("NeonTubeDirectionalR( \\(1\\))?").end()
}
const bloomL = {
    id: new Regex().add("LightRailingSegment").vary(2).separate().add("NeonTubeDirectionalL").vary(1).end(),
    position: <Vec3>[0, 80, 800],
    scale: <Vec3>[1, 1000, 1],
}
const bloomR = {
    id: new Regex().add("LightRailingSegment").vary(2).separate().add("NeonTubeDirectionalR").vary(1).end(),
    position: <Vec3>[0, -80, 800],
    scale: <Vec3>[1, 1000, 1],
}
//#endregion
//#region point definitions
map.pointDefinitions.push({"_name": "revolveSelf", "_points": [[0, 0, 0, 0], [0, 0, -90, 0.25], [0, 0, -180, 0.5], [0, 0, -270, 0.75], [0, 0, -360, 1]]});
map.pointDefinitions.push({"_name": "revolveSelfHalf", "_points": [[0, 0, 0, 0], [0, 0, -90, 0.5], [0, 0, -180, 1]]});
const noteAnimWidth = 3; // 5
const noteAnimHeight = 5;
map.pointDefinitions.push({ // standard notes anim red
    "_name": "notesRAnim",
    "_points": [[-noteAnimWidth, noteAnimHeight, 0, 0], [0, 0, 0, 0.45, "easeOutSine"]]
});
map.pointDefinitions.push({ // standard notes anim blue
    "_name": "notesBAnim",
    "_points": [[noteAnimWidth, noteAnimHeight, 0, 0], [0, 0, 0, 0.45, "easeOutSine"]]
});
map.pointDefinitions.push({ // standard notes rotation red
    "_name": "notesRLocRot",
    "_points": [[0, 0, 35, 0.1], [0, 0, 0, 0.5, "easeOutSine"]]
});
map.pointDefinitions.push({ // standard notes rotation blue
    "_name": "notesBLocRot",
    "_points": [[0, 0, -35, 0.1], [0, 0, 0, 0.5, "easeOutSine"]]
});
map.pointDefinitions.push({ // dissolve slow
    "_name": "notesDissolveSlow",
    "_points": [[0, 0], [1, 0.7, "easeOutCubic"]]
});
map.pointDefinitions.push({ // dissolve arrow slow
    "_name": "notesDissolveSlowArrow",
    "_points": [[0, 0], [1, 0.4, "easeOutCubic"]]
})
map.pointDefinitions.push({ // dissolve mid
    "_name": "notesDissolveMid",
    "_points": [[0, 0], [1, 0.5, "easeOutQuad"]]
});
map.pointDefinitions.push({ // dissolve arrow mid
    "_name": "notesDissolveMidArrow",
    "_points": [[0, 0], [1, 0.3, "easeOutCubic"]]
})
map.pointDefinitions.push({ // dissolve fast
    "_name": "notesDissolveFast",
    "_points": [[0, 0], [1, 0.3, "easeOutQuad"]]
});
map.pointDefinitions.push({ // dissolve arrow fast
    "_name": "notesDissolveMidArrow",
    "_points": [[0, 0], [1, 0.2, "easeOutCubic"]]
})
//#endregion
//#region functions

//#region functions: environment enhancement
const scene = new ModelScene()
scene.addPrimaryGroups(
    "Cube",
    new Geometry("Cube", "white")
)
scene.addPrimaryGroups(
    "LaserCylinder",
    new Environment(new Regex().add("LightRailingSegment").separate().add("NeonTubeDirectionalL").end(), "Regex"),
    [4, 0.3, 4], // real should be [4, 0.2, 4]. I made them longer because I wanted to lol
    [0, 0, 0],
)
function buildEnv() { // Used a function here because I didn't know regions existed (added those afterwards)
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
    ], true)
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
    env.track = "neonTubeL";
    env.push();
    env = new Environment(tubeR.id, "Regex");
    env.position = tubeR.position;
    env.rotation = tubeR.rotation;
    env.scale = tubeR.scale;
    env.track = "neonTubeR";
    env.push();
    env = new Environment(bloomL.id, "Regex");
    env.position = bloomL.position;
    env.scale = bloomL.scale;
    env.push();
    env = new Environment(bloomR.id, "Regex");
    env.position = bloomR.position;
    env.scale = bloomR.scale;
    env.push();
    // env = new Environment(new Regex().add("TunnelRotatingLasersPair").vary(4).end(), "Regex");
    // env.position = [0, 0, 80];
    // env.rotation = [20, 0, 0];
    // env.scale = [1, 1, 1];
    // env.track = "TunnelLasers"
    // env.push();

    // let laserTracks: string[] = [];
    const laserHeight = -2 // original was -2

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
    // new CustomEvent().assignTrackParent(laserTracks, "lasersParent")
    // debugObject(new Environment(new Regex().add("LightRailingSegment").separate().add("NeonTubeDirectionalL").end(), "Regex"), 1, [4, 0.2, 4], [0, 0, 0])
    // nope debugObject(new Environment(new Regex().add("BottomPairLasers").separate().add("PillarL").separate().add("RotationBaseL").separate().add("LaserLH").end(), "Regex"), 1, [1, 0.05, 1], [0, 0, 0])
    // placeTracklaser("LightRailingSegment \\(2\\)\\.\\[\\d*\\]NeonTubeDirectional", 135);
    // placeTracklaser("LightRailingSegment \\(1\\)\\.\\[\\d*\\]NeonTubeDirectional", 45);
    // placeTracklaser("LightRailingSegment\\.\\[\\d*\\]NeonTubeDirectional", 90);
    // placeTracklaser("LightRailingSegment \\(3\\)\\.\\[\\d*\\]NeonTubeDirectional", 0); let them help with shockwave

    env = new Environment("PlayersPlace$", "Regex");
    env.track = "playersPlace";
    env.push();

}
function removeIds(ids: string[], regex = false) {
    
    for (const id of ids) {
        let removePiece;
        if (regex) {removePiece = new Environment(id, "Regex");}
        else {removePiece = new Environment(id, "Contains");}
        removePiece.position = yeet
        removePiece.push()
    }
}
function animatePlayersPlace(time: number, position: KeyframesVec3 | string, duration = 1) {
    new CustomEvent(time).animateTrack("playersPlace", duration, {_position: position}).push() 
}
// function randLasers() { // scrapped idea
//     let event_side = "";
//     for (const x of map.events) {
//         if (x.type == 10) event_side = "L";
//         else if (x.type == 11) event_side = "R";
//         else continue;
//         if (x.value == 0) continue;
//         if (x.customData._color[3] == 1) { // trigger laser randomizer
//             const laserTrack = `${event_side}${x.customData._lightID}`;
//             const laserDuration = 8;

//             const laserMaxPos = 40;
//             let laserPosStart = randomNumber(-laserMaxPos, laserMaxPos);
//             let laserPosEnd = randomNumber(-laserMaxPos, laserMaxPos);
//             while (Math.abs(laserPosStart-laserPosEnd) < laserMaxPos / 3) {
//                 laserPosStart = randomNumber(-laserMaxPos, laserMaxPos);
//                 laserPosEnd = randomNumber(-laserMaxPos, laserMaxPos);
//             }
//             const laserMaxRot = 40; // rot = randomNumber(-laserMaxRot, laserMaxRot)

//             const laserPosition = [[laserPosStart, -1, 100, 0], [laserPosEnd, -1, 100, 1]]
//             const laserRotation = [[0, 0, randomNumber(-laserMaxRot, laserMaxRot), 0], [0, 0, randomNumber(-laserMaxRot, laserMaxRot), 1]]
//             new CustomEvent(x.time).animateTrack(laserTrack, laserDuration, {_position: laserPosition, _rotation: laserRotation}, "easeInOutSine").push();
//         }
//         // randomize position of laser here
//     }
// }
// function placeTracklaser(id: string, angle: number) {
//     const radius = 10;
//     let envId = `${id}L( \\(\\d*\\))?$`;
//     let placeEnv = new Environment(envId, "Regex");
//     placeEnv.rotation = [0, 0, 90-angle];
//     placeEnv.position = [radius*Math.cos(angle*Math.PI/180), radius*Math.sin(angle*Math.PI/180), 80];
//     placeEnv.scale = [0, 1000, 0];
//     placeEnv.push();

//     angle += 180;
//     envId = `${id}R( \\(\\d*\\))?$`;
//     placeEnv = new Environment(envId, "Regex");
//     placeEnv.rotation = [0, 0, 90-angle];
//     placeEnv.position = [radius*Math.cos(angle*Math.PI/180), radius*Math.sin(angle*Math.PI/180), 80];
//     placeEnv.scale = [0, 1000, 0];
//     placeEnv.push();
// }
function yeetBase(time: number) { // yeets the env for verse
    new CustomEvent(time).animateTrack(waterfall.track, 1, {_position: "yeet"}).push()
    new CustomEvent(time).animateTrack(rainRipples.track, 1, {_position: "yeet"}).push()
    new CustomEvent(time).animateTrack(smoke.track, 1, {_position: "yeet"}).push()
    new CustomEvent(time).animateTrack("neonTubeL", 1, {_position: "yeet"}).push()
    new CustomEvent(time).animateTrack("neonTubeR", 1, {_position: "yeet"}).push()
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
    let animTrack = new CustomEvent(time).animateTrack("fog");
    animTrack.animate.attenuation = animation;
    animTrack.animate.startY = [-1000];
    animTrack.animate.height = [0];
    if (duration > 0) animTrack.duration = duration;
    animTrack.push();
}
//#endregion
//#region functions: notes + player + lights

let noteTracks = ["noteB", "noteR"]
function floatNotesFromDirection(timeStart: number, timeEnd: number, noteDirection: number, floatX: number, floatY: number, floatZ: number, trackName: string) {
    // I used this to make notes float from the opposite direction you had to cut them
    let recentNotes: Note[] = []
    for (const note of map.notes) {
        if (note.time >= timeStart && note.time < timeEnd && note.direction == noteDirection) {
            note.customData._track = trackName;
            recentNotes.push(note)
            if (!exportMap) {note.customData._disableNoteLook = true;}
            if (!noteTracks.includes(trackName)) {
                noteTracks.push(trackName);
            }
        }
        if (note.time >= timeStart && note.time < timeEnd && note.direction == NOTE.DOT) {
            for (const rNote of recentNotes.reverse()) {
                const timeDiff = (note.time - rNote.time)
                if (timeDiff >= 0 && timeDiff < 0.2 && note.type == rNote.type) {
                    note.customData._track = rNote.customData._track; 
                    if (!exportMap) {note.customData._disableNoteLook = true;}
                }
            }
        }
    }
    let notesAnim = new CustomEvent(timeStart-8).assignPathAnimation(trackName, timeEnd-timeStart+16);
    notesAnim.animate.position = [[floatX, floatY, floatZ, 0], [0, 0, 0, 0.48, "easeOutSine"], [-floatX, -floatY, -floatZ, 1, "easeInSine"]];
    // notesAnim.animate.position = [
    //     [floatX, floatY, floatZ, 0],
    //     [floatX/8, floatY/8, floatZ/8, 0.4, "easeInCubic"],
    //     [0, 0, 0, 0.48, "easeOutCubic"]
    // ]
    // notesAnim.easing = "easeOutSine";
    notesAnim.push();
    // console.log(notesAnim)
}
function floatNoteGroup(timeStart: number, timeEnd: number, magnitude: number, zMagnitude: number) { // shorthand to not have a shitton of code lines
    floatNotesFromDirection(timeStart, timeEnd, NOTE.DOWN, 0, -magnitude, zMagnitude, "nd");
    floatNotesFromDirection(timeStart, timeEnd, NOTE.DOWN_RIGHT, magnitude, -magnitude, zMagnitude, "nrd");
    // floatNotesFromDirection(timeStart, timeEnd, NOTE.RIGHT, magnitude, 0, zMagnitude, "nr"); // didnt use this because I had no horizontal notes and it was giving errors
    floatNotesFromDirection(timeStart, timeEnd, NOTE.UP_RIGHT, magnitude, magnitude, zMagnitude, "nru");
    floatNotesFromDirection(timeStart, timeEnd, NOTE.UP, 0, magnitude, zMagnitude, "nu");
    floatNotesFromDirection(timeStart, timeEnd, NOTE.UP_LEFT, -magnitude, magnitude, zMagnitude, "nlu");
    // floatNotesFromDirection(timeStart, timeEnd, NOTE.LEFT, -magnitude, 0, zMagnitude, "nl"); // same as above
    floatNotesFromDirection(timeStart, timeEnd, NOTE.DOWN_LEFT, -magnitude, -magnitude, zMagnitude, "nld");
}
function floatRemainingNotes() { // animate notes with standard animation if they have no animation
    for (const note of map.notes) {
        if (note.customData._track == "noteR") {
            note.animate.position = "notesRAnim";
            note.animate.localRotation = "notesRLocRot";
        } else if (note.customData._track == "noteB") {
            note.animate.position = "notesBAnim";
            note.animate.localRotation = "notesBLocRot";
        }
    }
}
type snod = [starttime: number, NJS: number, offset: number, dissolve: string, useDissolve: boolean] // this worked lol what
function NJSo(start_NJS_offset_dissolve: snod[], last_endtime: number) {
    for (let i = 0; i < start_NJS_offset_dissolve.length; i++) {
        const starttime = start_NJS_offset_dissolve[i][0];
        let endtime: number;
        if (i == start_NJS_offset_dissolve.length-1) {
            endtime = last_endtime
        } else {
            endtime = start_NJS_offset_dissolve[i+1][0];
        }
        const NJS = start_NJS_offset_dissolve[i][1];
        const offset = start_NJS_offset_dissolve[i][2];
        const dissolve = start_NJS_offset_dissolve[i][3];
        const dissolveArrow = dissolve + "Arrow"

        for (const note of map.notes) {
            if (note.time >= starttime && note.time < endtime) {
                note.NJS = NJS;
                // console.log(`${note.time}, ${note.NJS}`)
                note.offset = offset;
                if (note.customData._track == "noteR" || note.customData._track == "noteB" && start_NJS_offset_dissolve[i][4]) {
                    note.animate.dissolve = dissolve;
                    note.animate.dissolveArrow = dissolveArrow;
                }
            }
        }
    }
}
function animatePlayer(time: number, position: KeyframesVec3 | string, rotation: KeyframesVec3 | string | null = null, duration = 1, easing: string | null = null) {
    let playerPoints: Record<string, KeyframesVec3 | string> = {};
    if (rotation !== null) {
        playerPoints._rotation = rotation;
    }
    playerPoints._position = position;
    let animPlayer = new CustomEvent(time).animateTrack("player", duration, playerPoints);
    if (easing) {animPlayer.easing = easing; }
    animPlayer.push();
}
function remapLights(type: number, alpha: number, rgb: number) { // increase alpha or rgb on lights with specific type
    for (const event of map.events) {
        if (event.type == type && event.customData && event.customData._color) {
            event.color[0] *= rgb;
            event.color[1] *= rgb;
            event.color[2] *= rgb;
            if (event.color[3]) {
                event.color[3] *= alpha;
            }
        } else if (event.type == type && event.customData && event.customData._lightGradient) {
            event.customData._lightGradient._startColor[0] *= rgb;
            event.customData._lightGradient._startColor[1] *= rgb;
            event.customData._lightGradient._startColor[2] *= rgb;
            if (event.customData._lightGradient._startColor[3]) {
                event.customData._lightGradient._startColor[3] *= alpha;
            }
            event.customData._lightGradient._endColor[0] *= rgb;
            event.customData._lightGradient._endColor[1] *= rgb;
            event.customData._lightGradient._endColor[2] *= rgb;
            if (event.customData._lightGradient._endColor[3]) {
                event.customData._lightGradient._endColor[3] *= alpha;
            }
        }
    }
}

//#endregion
//#region functions: walls + random
function HSVtoRGB(h: number, s: number, v: number) {
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
    return [r, g, b];
}
function randomNumber(min: number, max: number, decimals = 3) {
    return +(min + Math.random() * (max-min)).toFixed(decimals);
}
function rd(x: number, decimals = 3) {
    return +(x.toFixed(decimals))
}
function stars(starttime: number, duration: number, lifetime: number, wallsPerBeat: number, boundingBox: [[number, number, number], [number, number, number]], randomization = 5, color: [number, number, number, number]) {
    // I love this effect
    for (let i = 0; i < duration; i++) {
        for (let j = 0; j < wallsPerBeat; j++) {
            let star = new Wall(starttime+i+j/wallsPerBeat, lifetime, WALL.FULL, 0, 1);
            star.fake = true;
            star.interactable = false;
            star.color = color;
            star.scale = [1/100, 1/100, 1/100];
            star.animate.dissolve = [[0, 0], [1, 1/8, "easeOutQuad"], [1, 7/8], [0, 1, "easeInQuad"]];
            const b = boundingBox;
            let [x, y, z] = [randomNumber(b[0][0], b[1][0]), randomNumber(b[0][1], b[1][1]), randomNumber(b[0][2], b[1][2])];
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
function wallTunnel(time: number, duration: number, floatTime: number, scale: Vec3, scaleRandomization: number, walls: number, colors: number, innerRadius: number, outerRadius: number, zRange: [number, number], alpha = 1, rgb = 1) {
    // I love this effect but it took so much time
    for (let i = 0; i < walls; i++) {
        let wallColors: KeyframesVec4;
        if (colors == 1) {
            let color = HSVtoRGB(randomNumber(1/2, 11/12), randomNumber(0.5, 1), 1);
            wallColors = [
                +((color[0]*rgb).toFixed(3)), // adding + in front of a number string like "5" turns it into a number (+"5" = 5)
                +((color[1]*rgb).toFixed(3)),
                +((color[2]*rgb).toFixed(3)),
                alpha
            ]
        } else if (colors > 1) {
            wallColors = []
            for (let j = 0; j < colors; j++) {
                let color = HSVtoRGB(randomNumber(1/2, 11/12), randomNumber(0.5, 1), 1);
                if (j == 0) {
                    wallColors.push([
                        +((color[0]*rgb).toFixed(3)),
                        +((color[1]*rgb).toFixed(3)),
                        +((color[2]*rgb).toFixed(3)),
                        alpha,
                        +((j/(colors-1)).toFixed(3))
                    ]);
                } else {
                    wallColors.push([
                        +((color[0]*rgb).toFixed(3)),
                        +((color[1]*rgb).toFixed(3)),
                        +((color[2]*rgb).toFixed(3)),
                        alpha,
                        +((j/(colors-1)).toFixed(3)),
                        "easeInOutSine"
                    ]);
                }
            }
        } else {break;}
        const timeRandomizer = randomNumber(0,2)
        const wall = new Wall(time+1+timeRandomizer, duration-timeRandomizer+floatTime, WALL.FULL, 0, 1);
        wall.fake = true;
        wall.interactable = false;
        wall.animate.color = wallColors;
        const dissolve: ComplexKeyframesLinear = [[0, 0]]
        for (let k = 1; k < 8; k++) {
            if (k == 1) { 
                dissolve.push([0.5 + randomNumber(0, 0.5), k/8, "easeOutQuad"]);
            } else {
                dissolve.push([0.5 + randomNumber(0, 0.5), k/8]);
            }
        }
        dissolve.push([0, 1, "easeInQuad"]);
        wall.animate.dissolve = dissolve;
        const z = randomNumber(zRange[0], zRange[1]);
        const r1 = randomNumber(innerRadius, outerRadius)*5*Math.cos(z/500*Math.PI/3); // please don't ask me wtf is going on here I don't even know myself
        const t1 = randomNumber(-180, 180);
        wall.animate.definitePosition = [r1 * Math.cos(t1*Math.PI/180), r1 * Math.sin(t1*Math.PI/180), z+randomNumber(-10,10)];
        const sr = scaleRandomization;
        wall.scale = [scale[0] + randomNumber(-sr, sr), scale[1] + randomNumber(-sr, sr), scale[2] + randomNumber(-sr, sr)];
        wall.animate.rotation = [
            [randomNumber(-45, 45), randomNumber(-45, 45), randomNumber(-180, 180), 0],
            [randomNumber(-45, 45), randomNumber(-45, 45), randomNumber(-180, 180), 1]
        ];
        wall.customData._track = "wallTunnel";
        wall.push();
    }
}
function wallTrack(time: number, duration: number, colors: number, alpha: number, rgb: number) {
    // this effect is so minimal but so nice (sine wave thingy below feet on outro)
    const stepSize = 0.1
    for (let t = 0; t < duration; t += stepSize) {
        let wallColors: KeyframesVec4;
        if (colors == 1) {
            let color = HSVtoRGB(randomNumber(1/2, 11/12), randomNumber(0.5, 1), 1);
            wallColors = [
                +((color[0]*rgb).toFixed(3)),
                +((color[1]*rgb).toFixed(3)),
                +((color[2]*rgb).toFixed(3)),
                alpha
            ]
        } else if (colors > 1) {
            wallColors = []
            for (let j = 0; j < colors; j++) {
                let color = HSVtoRGB(randomNumber(1/2, 11/12), randomNumber(0.5, 1), 1);
                if (j == 0) {
                    wallColors.push([
                        +((color[0]*rgb).toFixed(3)),
                        +((color[1]*rgb).toFixed(3)),
                        +((color[2]*rgb).toFixed(3)),
                        alpha,
                        +((j/(colors-1)).toFixed(3))
                    ]);
                } else {
                    wallColors.push([
                        +((color[0]*rgb).toFixed(3)),
                        +((color[1]*rgb).toFixed(3)),
                        +((color[2]*rgb).toFixed(3)),
                        alpha,
                        +((j/(colors-1)).toFixed(3)),
                        "easeInOutSine"
                    ]);
                }
            }
        } else {break;}
        const wall = new Wall(time+t, 2, WALL.FULL, 0, 1);
        wall.animate.color = wallColors;
        wall.animate.dissolve = [[0, 0], [1, 1/8, "easeOutCubic"], [1, 7/8], [0, 1, "easeInCubic"]];
        wall.animate.position = [1.5+(-1)**rd(t*10, 0)*2*Math.sin(t*Math.PI/2), -0.5, 0];
        // console.log((-1)**rd(t*10, 0))
        // wall.animate.position = [1.5, -0.5, 0]; // center
        wall.scale = [0.5, 0.1, 1];
        wall.customData._track = "wallTrack";
        wall.push();
    }
}
function sineWalls(time: number, duration: number, colors: number, alpha: number, rgb: number) {
    // walls in predrop (positioned and scaled with sine wave) (math is awesome)
    const stepSize = 0.5
    for (let t = 0; t < duration; t += stepSize) {
        for (let side = 0; side <= 1; side++) {
            let wallColors: KeyframesVec4;
            if (colors == 1) {
                let color = HSVtoRGB(randomNumber(1/2, 11/12), randomNumber(0.5, 1), 1);
                wallColors = [
                    +((color[0]*rgb).toFixed(3)),
                    +((color[1]*rgb).toFixed(3)),
                    +((color[2]*rgb).toFixed(3)),
                    alpha
                ]
            } else if (colors > 1) {
                wallColors = []
                for (let j = 0; j < colors; j++) {
                    let color = HSVtoRGB(randomNumber(1/2, 11/12), randomNumber(0.5, 1), 1);
                    if (j == 0) {
                        wallColors.push([
                            +((color[0]*rgb).toFixed(3)),
                            +((color[1]*rgb).toFixed(3)),
                            +((color[2]*rgb).toFixed(3)),
                            alpha,
                            +((j/(colors-1)).toFixed(3))
                        ]);
                    } else {
                        wallColors.push([
                            +((color[0]*rgb).toFixed(3)),
                            +((color[1]*rgb).toFixed(3)),
                            +((color[2]*rgb).toFixed(3)),
                            alpha,
                            +((j/(colors-1)).toFixed(3)),
                            "easeInOutSine"
                        ]);
                    }
                }
            } else if (colors == -1) {
                wallColors = [1, 1, 1, 1]
            } else {break;}
            const wall = new Wall(time+t, 2, WALL.FULL, 0, 1);
            wall.animate.color = wallColors;
            wall.animate.dissolve = [[0, 0], [1, 1/8, "easeOutCubic"], [1, 7/8], [0, 1, "easeInCubic"]];
            wall.animate.position = [0.5 + ((-1)**side)*(6+2*Math.sin(t*Math.PI/2)), -2, 0];
            // console.log((-1)**rd(t*10, 0))
            wall.animate.localRotation = [0, 0, ((-1)**(side+1))*(22.5+22.5*Math.sin(t*Math.PI/2))];
            //wall.animate.position = [0.5, -0.5, 0]; // center
            wall.scale = [3, 6+2*Math.sin(t*Math.PI/2), 2];
            wall.customData._track = "sineWalls";
            wall.push();
        }
    }
}
function colorWalls(time: number, duration: number, repetitions: number, track: string, color: KeyframesVec4) {
    // shorthand to color all sine walls in 2nd chorus which I put into a function instead of a for loop (idk why)
    for (let i = 0; i < repetitions; i ++) {
        new CustomEvent(time+i*duration).animateTrack(track, duration, {_color: color}).push();
    }
}
//#endregion

//#endregion
//#region env
yeetBase(100);
shockwave(100);
yeetBaseBack(132);
sun(132);
hole(260);
yeetBase(260);
// sun(0);
scene.animate([
    //[[], 0, 100],
    ["Drop1", 100, 32],
    [[], 132],
    //["Drop2", 260, 32], // scrapped 2nd drop and used walls instead because that's 10 million times cooler
    //["Drop2f", 292, 40] // this was the 2nd drop slowly floating away
]);
buildEnv();
//#endregion
//#region fog
new CustomEvent().assignFogTrack("fog").push();
fogAttentuation(0, [1 / 500]);
fogAttentuation(100, [1 / 3000]);
fogAttentuation(132, [1 / 500]);
fogAttentuation(259, [[1 / 500, 0], [1 / 300000, 1, "easeInCubic"]], 1);
fogAttentuation(260, [[1 / 300000, 0], [1 / 500, 1, "easeOutCubic"]], 8);
//#endregion
//#region notes
const noteMagnitude = 10;

// floatNoteGroup(92.5, 100, noteMagnitude/4, null, null);
floatNoteGroup(100, 132, noteMagnitude, 0);
floatNoteGroup(260, 292, noteMagnitude/2, 0);

map.notes.forEach(x => {
    if (!x.customData || !x.customData._track) {
        if (x.type == NOTE.BLUE) {
            x.customData._track = "noteB";
        } else if (x.type == NOTE.RED) {
            x.customData._track = "noteR";
        }
    }
});
floatRemainingNotes();
NJSo([
    [0, 11, 0.2, "notesDissolveSlow", true],
    [36, 12, 0.1, "notesDissolveMid", true],
    [68, 13, 0.1, "notesDissolveMid", true],
    [84, 13.5, 0.001, "notesDissolveMid", true],
    [92, 14, 0.001, "notesDissolveMid", true],
    [100, 14, 0.001, "none", false],
    [132, 12, 0.1, "notesDissolveMid", true],
    [196, 11, 0.2, "notesDissolveSlow", true],
    [260, 14, 0.1, "none", false],
    [292, 11, 0.001, "notesDissolveSlow", true]
], 335);
//#endregion
//#region player
new CustomEvent().assignPlayerToTrack("player").push();
noteTracks.push("wallTrack");
new CustomEvent().assignTrackParent(noteTracks, "player").push();

animatePlayer(99.5, [[0, 0, 0, 0], [0, 0, -10, 1]], null, 0.5, "easeInCubic");
animatePlayer(100, [[0, 0, -600, 0], [0, 0, 400, 1]], null, 15, "easeOutCubic");
animatePlayer(115, [[0, 0, 400, 0], [0, 0, 300, 1]], null, 1, "easeInCubic")
animatePlayer(116, [[0, 0, -600, 0], [0, 0, 400, 1]], null, 12, "easeOutCubic");
animatePlayer(128, [[0, 0, 400, 0], [0, 0, 300, 1]], null, 4, "easeInCubic");
animatePlayer(132, [[0, 0, 25, 0], [0, 0, 0, 1]], null, 4, "easeOutCubic");

animatePlayer(259, [[0, 0, 0, 0], [0, 0, -50, 1]], null, 1, "easeInQuad");
animatePlayer(260, [[0, 0, -50, 0], [0, 0, 250, 1]], "revolveSelfHalf", 32, "easeInOutSine");
//#endregion
//#region walls + lights
const starsBbox: [[number, number, number], [number, number, number]] = [[-50, 6, -25], [50, 50, 100]];

// verse 1
stars(4, 64, 4, 4, starsBbox, 2, [1, 1, 1, 1]);
stars(68, 32, 32, 8, starsBbox, 5, [1, 1, 1, 1]);
new CustomEvent(68).animateTrack("stars", 32, {_color: [[1, 1, 1, 1, 0], [1, 2, 5, 1, 1, "easeInOutSine"]]}).push();
new CustomEvent(96).animateTrack("stars", 2, {_dissolve: [[1, 0], [0, 1]]}).push();

// verse 2
new CustomEvent(128).animateTrack("stars", 1, {_color: [[1, 2, 5, 1, 0], [1, 1, 1, 1, 1, "easeInOutSine"]]}).push();
new CustomEvent(128).animateTrack("stars", 1, {_dissolve: [[0, 0], [1, 1]]}).push();
stars(132, 96, 4, 4, starsBbox, 2, [1, 1, 1, 1]);
stars(196, 32, 32, 2, starsBbox, 5, [1, 1, 1, 1]);
new CustomEvent(192).animateTrack("sineWalls", 1, {_dissolve: [[1, 0], [0, 1]]}).push();
sineWalls(196, 34, 3, 1/4, 1);
new CustomEvent(196).animateTrack("sineWalls", 16, {_dissolve: [[0, 0], [1, 1, "easeInOutSine"]]}).push();
const abruptColors: ComplexKeyframesVec4 = [
    [0.188, 0.242, 0.984, 1/4, 0],
    [0.188, 0.242, 0.984, 1/4, 1/4-0.001],
    [0.48, 0.188, 0.984, 1/4, 1/4],
    [0.48, 0.188, 0.984, 1/4, 2/4-0.001],
    [0.863, 0.188, 0.984, 1/4, 2/4],
    [0.863, 0.188, 0.984, 1/4, 3/4-0.001],
    [0.984, 0.188, 0.664, 1/4, 3/4],
    [0.984, 0.188, 0.664, 1/4, 1-0.001],
    [0.188, 0.242, 0.984, 1/4, 1],
]
sineWalls(230, 30, -1, 1/4, 1);
colorWalls(228, 1, 36, "sineWalls", abruptColors)
new CustomEvent(256).animateTrack("sineWalls", 0.5, {_dissolve: [[1, 0], [0, 1, "easeOutQuad"]]}).push();
stars(228, 32, 32, 10, starsBbox, 5, [1, 1, 1, 1]);
new CustomEvent(228).animateTrack("stars", 32, {_color: [[1, 1, 1, 1, 0], [1, 4, 5, 1, 1, "easeOutCubic"]]}).push();
new CustomEvent(256).animateTrack("stars", 0.5, {_dissolve: [[1, 0], [0, 1, "easeOutQuad"]]}).push();

new CustomEvent(259).animateTrack("stars", 1, {_dissolve: [[0, 0], [1, 1, "easeOutQuart"]]}).push();
new CustomEvent(259).animateTrack("stars", 1, {_color: [[1, 1, 1, 1, 0], [4, 1, 5, 1, 1, "easeOutCubic"]]}).push();
new CustomEvent(260).animateTrack("stars", 0.5, {_dissolve: [[1, 0], [0, 1, "easeOutQuart"]]}).push();
// drop 2
wallTunnel(260, 32, 32, [6,10,6], 2.5, 750, 2, 8, 50, [-150, 400], 1, 5);
new CustomEvent(292).animateTrack("wallTunnel", 32, {_dissolve: [[1, 0], [0.4, 0.5, "easeOutCirc"], [0, 1, "easeInOutSine"]]}).push();

// outro
new CustomEvent(288).animateTrack("stars", 1, {_color: [[1, 4, 5, 1, 0], [1, 1, 1, 1, 1]]}).push();
new CustomEvent(288).animateTrack("stars", 1, {_dissolve: [[0, 0], [1, 1]]}).push();
new CustomEvent(288).animateTrack("wallTrack", 1, {_dissolve: [[1, 0], [0.2, 1]]}).push();

stars(292, 32, 32, 5, [[-50, -6, 225], [50, -50, 350]], 5, [1, 1, 1, 1]);
wallTrack(292, 40, 2, 1/4, 1);
new CustomEvent(292).animateTrack("wallTrack", 16, {_dissolve: [[0.2, 0], [1, 1, "easeInOutSine"]]}).push();
new CustomEvent(292).animateTrack("stars", 31, {_color: [[1, 1, 1, 1, 0], [3, 2.193, 1.152, 1, 1, "easeOutCubic"]]}).push();
new CustomEvent(323).animateTrack("stars", 1, {_color: [[3, 2.193, 1.152, 1, 0], [5, 3.655, 1.92, 1, 1, "easeOutCubic"]]}).push();
new CustomEvent(324).animateTrack("stars", 7, {_dissolve: [[1, 0], [0, 1, "easeOutCubic"]]}).push();
new CustomEvent(324).animateTrack("wallTrack", 7, {_dissolve: [[1, 0], [0, 1, "easeInOutSine"]]}).push();

remapLights(1, 1.5, 2); // drop 1 spiral lights
remapLights(7, 1.5, 3); // bloom lights
remapLights(10, 1, 3); // left lasers
remapLights(11, 1, 3); // right lasers
//#endregion
//#region optimizations
function wallAmt() {
    // count amount of walls (to know when there's 2k walls at 1 moment so I can fix it)
    let wallTimes: Record<number, number> = {};
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
        //@ts-ignore <stupid>
        if (wallTimes[key] > 750) {
            //@ts-ignore <stupid>
            console.log(`${key}, ${wallTimes[key]}`)
        }
    }
}
map.geoMaterials.white = {
    _color: [1, 1, 1, 1],
    _shader: "Standard"
}
// for (const piece of map.customData._environment) { // I made a stupid mistake at the AddPrimaryGroups and fixed it there and later realized I just messed up earlier
//     if (piece.json._geometry) {
//         console.log(piece)
//         // piece.json._geometry._material = "white"
//     }
// }
// wallAmt()
//#endregion
//#region export
map.require("Noodle Extensions", true);
map.require("Chroma", true);
map.suggest("Chroma", false);
map.colorLeft = [rd(250/255), rd(110/255), rd(85/255)]; // #fa6e55, old = #f25438
map.colorRight = [rd(125/255), rd(90/255), rd(224/255)]; // #7d5ae0
map.save();

//#endregion