//create canvas for car sim
const carCanvas = document.getElementById("carCanvas");
carCanvas.width = 200;

//create canvas for network sim
const networkCanvas = document.getElementById("networkCanvas");
networkCanvas.width = 300;

//create canvas for player car
const playerCanvas = document.getElementById("playerCanvas");
playerCanvas.width = 200;

//create context for car sim (allows for drawing 2D graphics)
const carCtx = carCanvas.getContext("2d");
//create context for network sim (allows for drawing 2D graphics)
const networkCtx = networkCanvas.getContext("2d");
//create context for player car (allows for drawing 2D graphics)
const playerCtx = playerCanvas.getContext("2d");

//build sim road
const simRoad = new Road(carCanvas.width / 2, carCanvas.width * 0.9);

//build player road
const playerRoad = new Road(playerCanvas.width / 2, playerCanvas.width * 0.9);

//create sim and player cars
const simCar = new Car(carCanvas.width / 2, 0, 30, 50, "DUMMY");
const playerCar = new Car(playerCanvas.width / 2, 0, 30, 50, "KEYS");

animate();

function animate() {

    //set road, network, and player canvas height to window height
    carCanvas.height = window.innerHeight;
    networkCanvas.height = window.innerHeight;
    playerCanvas.height = window.innerHeight;

    //update sim and player cars
    simCar.update(simRoad.borders, []);
    playerCar.update(playerRoad.borders, []);

    carCtx.save();
    playerCtx.save();

    carCtx.translate(0, -simCar.y + carCanvas.height * 0.7);
    playerCtx.translate(0, -playerCar.y + playerCanvas.height * 0.7);

    //draw player and sim roads
    simRoad.draw(carCtx);
    playerRoad.draw(playerCtx);
    //draw sim and player cars
    simCar.draw(carCtx, "blue", true);
    playerCar.draw(playerCtx, "blue", true);

    carCtx.restore();
    playerCtx.restore();

    //request animation frame to animate the car on each frame
    requestAnimationFrame(animate);
}

