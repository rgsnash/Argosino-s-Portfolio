import { scaleFactor } from "./constants";
import { k } from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";
import { dialogueData } from "./constants";

k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 956,
        "walk-down": { from: 956, to: 959, loop: true, speed: 8},
        "idle-side": 995,
        "walk-side": { from: 995, to:998, loop: true, speed: 8},
        "idle-up": 1034,
        "walk-up": { from: 1034, to: 1037, loop: true, speed:8 },
    }
});

k.loadSprite("map", "./map.png");

k.scene("main", async () => {
    k.setBackground(k.Color.fromHex("#311047"));
    
    const mapData = await (await fetch("./map.json")).json()
    const layers = mapData.layers;

    const map = k.add([
        k.sprite("map"),
        k.pos(0, 0),
        k.scale(scaleFactor),
    ]);
    const player = k.add([
        k.sprite("spritesheet", {anim: "idle-down"}),
        k.area({
            shape: new k.Rect(k.vec2(0,3), 10, 10),
        }),
        k.body(),
        k.anchor("center"),
        k.pos(),
        k.scale(scaleFactor),
        {
            speed: 250,
            direction: "down",
            isInDialogue: false,
        },
        "player",
    ]);

    for (const layer of layers) {
        if(layer.name === "boundaries") {
            for (const boundary of layer.objects) {
                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                    }),
                    k.body({ isStatic:true }),
                    k.pos(boundary.x, boundary.y),
                    boundary.name,
                ]);

                if (boundary.name) {
                    player.onCollide(boundary.name, () => {
                        player.isInDialogue = true;
                        player.speed = 0; // Stop the player's movement
                        displayDialogue(dialogueData[boundary.name], () => {
                            player.isInDialogue = false;
                            player.speed = 250; // Restore the player's movement speed
                        });
                    });
                }
            }
            continue;
        }
        if (layer.name === "spawnpoints") {
            for (const entity of layer.objects) {
                if (entity.name === "player") {
                  player.pos = k.vec2(
                    (map.pos.x + entity.x) * scaleFactor,
                    (map.pos.y + entity.y) * scaleFactor
                  );
                  player.move(player.pos);
                  continue;
                }
              }
        }
    }

    setCamScale(k);

    k.onResize(() => {
      setCamScale(k);
    });

    k.onUpdate(() => {
        k.camPos(player.worldPos().x, player.worldPos().y - 100);
    });

    k.onMouseDown((mouseBtn) => {
        if (mouseBtn !== "left" || player.isInDialogue) return;
    
        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);
    
        const mouseAngle = player.pos.angle(worldMousePos);
    
        const lowerBound = 50;
        const upperBound = 125;
    
        if (
          mouseAngle > lowerBound &&
          mouseAngle < upperBound &&
          player.curAnim() !== "walk-up"
        ) {
          player.play("walk-up");
          player.direction = "up";
          return;
        }
    
        if (
          mouseAngle < -lowerBound &&
          mouseAngle > -upperBound &&
          player.curAnim() !== "walk-down"
        ) {
          player.play("walk-down");
          player.direction = "down";
          return;
        }
    
        if (Math.abs(mouseAngle) > upperBound) {
          player.flipX = false;
          if (player.curAnim() !== "walk-side") player.play("walk-side");
          player.direction = "right";
          return;
        }
    
        if (Math.abs(mouseAngle) < lowerBound) {
          player.flipX = true;
          if (player.curAnim() !== "walk-side") player.play("walk-side");
          player.direction = "left";
          return;
        }
    });

    function stopAnims() {
        if (player.direction === "down") {
          player.play("idle-down");
          return;
        }
        if (player.direction === "up") {
          player.play("idle-up");
          return;
        }

        player.play("idle-side");
    }

    k.onMouseRelease(stopAnims);

    k.onKeyRelease(() => {
        stopAnims();
    });

    k.onKeyDown((key) => {
        const keyMap = [
          k.isKeyDown("right"),
          k.isKeyDown("left"),
          k.isKeyDown("up"),
          k.isKeyDown("down"),
        ];

        let nbOfKeyPressed = 0;
        for (const key of keyMap) {
          if (key) {
            nbOfKeyPressed++;
          }
        }

        if (nbOfKeyPressed > 1) return;

        if (player.isInDialogue) return;
        if (keyMap[0]) {
          player.flipX = false;
          if (player.curAnim() !== "walk-side") player.play("walk-side");
          player.direction = "right";
          player.move(player.speed, 0);
          return;
        }

        if (keyMap[1]) {
          player.flipX = true;
          if (player.curAnim() !== "walk-side") player.play("walk-side");
          player.direction = "left";
          player.move(-player.speed, 0);
          return;
        }

        if (keyMap[2]) {
          if (player.curAnim() !== "walk-up") player.play("walk-up");
          player.direction = "up";
          player.move(0, -player.speed);
          return;
        }

        if (keyMap[3]) {
          if (player.curAnim() !== "walk-down") player.play("walk-down");
          player.direction = "down";
          player.move(0, player.speed);
        }
    });
});

k.go("main")