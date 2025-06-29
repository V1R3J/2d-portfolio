import { dialogueData, scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";

// Load spritesheet and animations
k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 936,
        "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
        "idle-side": 975,
        "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
        "idle-up": 1014,
        "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 }, 
    },
});

// Load the map sprite
k.loadSprite("map", "./map1.png");

// Set the background color
k.setBackground(k.Color.fromHex("#311047"));

// Main scene
k.scene("main", async () => {
    // Fetch and parse map data
    let mapData;
    try {
        mapData = await (await fetch("./map1.json")).json();
    } catch (error) {
        console.error("Failed to load map1.json:", error);
        return;
    }

    const layers = mapData.layers || [];

    // Add the map sprite to the scene
    const map = k.add([
        k.sprite("map"),
        k.pos(0, 0),
        k.scale(scaleFactor),
    ]);

    // Initialize player object
    const player = k.add([
        k.sprite("spritesheet", { anim: "idle-down" }),
        k.area({ shape: new k.Rect(k.vec2(0, 3), 10, 10) }),
        k.body(),
        k.anchor("center"),
        k.pos(100, 100), // Default spawn position for testing
        k.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);

    // Process layers
    layers.forEach((layer) => {
        if (layer.name === "boundaries") {
            layer.objects.forEach((boundary) => {
                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                    }),
                    k.body({ isStatic: true }),
                    k.pos(boundary.x, boundary.y),
                    boundary.name,
                ]);

                if (boundary.name) {
                    player.onCollide(boundary.name, () => {
                        if (player.isInDialogue) return;
                        player.isInDialogue = true;
                        displayDialogue(
                            dialogueData[boundary.name] || "No dialogue available",
                            () => (player.isInDialogue = false)
                        );
                    });
                }
            });
        } else if (layer.name === "spawnpoints") {
            layer.objects.forEach((entity) => {
                if (entity.name === "player") {
                    player.pos = k.vec2(
                        (map.pos.x + entity.x) * scaleFactor,
                        (map.pos.y + entity.y) * scaleFactor
                    );
                }
            });
        }
    });

    // Set up camera scaling
    setCamScale(k);
    k.onResize(() => setCamScale(k));

    // Update camera to follow player
    k.onUpdate(() => {
        k.camPos(player.pos.x, player.pos.y - 100);
    });

    // Handle player movement
    function movePlayer(direction, anim, xMove, yMove) {
        if (player.isInDialogue) return;

        if (player.curAnim() !== anim) player.play(anim);
        player.move(xMove * player.speed, yMove * player.speed);
        player.direction = direction;
    }

    k.onKeyDown("up", () => movePlayer("up", "walk-up", 0, -1));
    k.onKeyDown("down", () => movePlayer("down", "walk-down", 0, 1));
    k.onKeyDown("left", () => {
        player.flipX = true;
        movePlayer("left", "walk-side", -1, 0);
    });
    k.onKeyDown("right", () => {
        player.flipX = false;
        movePlayer("right", "walk-side", 1, 0);
    });

    k.onKeyRelease(() => {
        if (player.direction === "up") player.play("idle-up");
        else if (player.direction === "down") player.play("idle-down");
        else player.play("idle-side");
    });
});

// Start the game
k.go("main");
