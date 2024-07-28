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

//add function for start and stoping of sim
let isAnimating = false;
let animationFrameId;
function startSim() {
    if (!isAnimating) {
        isAnimating = true;
        animate();
    }
}

//create array of sim cars (N is number of agents) and function to generate cars
const N = 500;
const simCars = generateCars(N);
let bestCar = simCars[0];
//const simCar = new Car(carCanvas.width / 2, 0, 30, 50, "AI");

function generateCars(N) {
    const cars = [];
    for (let i = 0; i < N; i++) {
        cars.push(new Car(carCanvas.width / 2, 0, 30, 50, "AI"));
    }
    return cars;
}

function stopSim() {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationFrameId);
        //mutate network based on best brain

        for (let i = 0; i < simCars.length; i++) {
            simCars[i].reset();
        }

        const bestBrain = bestCar.brain;
        for (let i = 0; i < simCars.length; i++) {
            simCars[i].brain = JSON.parse(JSON.stringify(bestBrain)); // Clone the brain
            if (i != 0) {
                NeuralNetwork.mutate(simCars[i].brain, 0.2);
            }
        }

        //restart sim
        bestCar = simCars[0];
        simTraffic = [];
        spawnTraffic();
        startSim();
    }
}

//create player car
const playerCar = new Car(playerCanvas.width / 2, 0, 30, 50, "KEYS");

//spawn randow traffic patterns 
let simTraffic = [];
const playerTraffic = [];

function spawnTraffic() {
    //possible patterns
    const trafficPattern = {
        0 : [0],
        1 : [1],
        2 : [2],
        3 : [0, 1],
        4 : [1, 2],
        5 : [0, 2],
        6 : [0, 1],
        7 : [1, 2],
        8 : [0, 2],
        9 : [0, 1],
        10 : [1, 2],
        11 : [0, 2],
    }

    for (let i = 0; i < 50; i++) {
        //choose random pattern
        const pattern = trafficPattern[Math.floor(Math.random() * 12)];
        //spawn cars
        for (let lane of pattern) {
            simTraffic.push(new Car(simRoad.getLaneCenter(lane), -100 - i * 200, 30, 50, "DUMMY", 2));
            playerTraffic.push(new Car(playerRoad.getLaneCenter(lane), -100 - i * 200, 30, 50, "DUMMY", 2));
        }
    }
}

function fitness(car) {
    const score = car.y * -1;
    return score;
}

spawnTraffic();
animate();

function animate(time) {
    //if not animating only animate player side 
    if (!isAnimating) {
        //set road, network, and player canvas height to window height
        carCanvas.height = window.innerHeight;
        networkCanvas.height = window.innerHeight;
        playerCanvas.height = window.innerHeight;
        //animate player traffic
        for (let i = 0; i < playerTraffic.length; i++) {
            playerTraffic[i].update(playerRoad.borders, []);
        }
        //animate player car
        playerCar.update(playerRoad.borders, playerTraffic);

        playerCtx.save();

        playerCtx.translate(0, -playerCar.y + playerCanvas.height * 0.7);

        //draw player and sim roads
        simRoad.draw(carCtx);
        playerRoad.draw(playerCtx);

        //draw player traffic
        for (let i = 0; i < playerTraffic.length; i++) {
            playerTraffic[i].draw(playerCtx, "green");
        }

        //draw player car
        playerCar.draw(playerCtx, "blue", true);

        playerCtx.restore();

        requestAnimationFrame(animate);
    } else {

        //animate traffic
        for (let i = 0; i < simTraffic.length; i++) {
            simTraffic[i].update(simRoad.borders, []);
        }
        for (let i = 0; i < playerTraffic.length; i++) {
            playerTraffic[i].update(playerRoad.borders, []);
        }

        for (let i = 0; i < simCars.length; i++) {
            simCars[i].update(simRoad.borders, simTraffic);
        }

        //call fitness function and calculate for each car and update best car
        for (let i = 0; i < simCars.length; i++) {
            simCars[i].fitness = fitness(simCars[i]);
            if (simCars[i].fitness > bestCar.fitness) {
                bestCar = simCars[i];
            }
        }

        //set road, network, and player canvas height to window height
        carCanvas.height = window.innerHeight;
        networkCanvas.height = window.innerHeight;
        playerCanvas.height = window.innerHeight;

        //update sim and player cars
        //simCar.update(simRoad.borders, simTraffic);
        playerCar.update(playerRoad.borders, playerTraffic);

        carCtx.save();
        playerCtx.save();

        carCtx.translate(0, -bestCar.y + carCanvas.height * 0.7);
        playerCtx.translate(0, -playerCar.y + playerCanvas.height * 0.7);

        //draw player and sim roads
        simRoad.draw(carCtx);
        playerRoad.draw(playerCtx);

        //draw sim and player traffic
        for (let i = 0; i < simTraffic.length; i++) {
            simTraffic[i].draw(carCtx, "green");
        }
        for (let i = 0; i < playerTraffic.length; i++) {
            playerTraffic[i].draw(playerCtx, "green");
        }

        //draw sim and player cars
        //simCar.draw(carCtx, "blue", true);
        carCtx.globalAlpha = 0.2;
        for (let i = 0; i < simCars.length; i++) {
            simCars[i].draw(carCtx, "blue");
        }
        carCtx.globalAlpha = 1;
        bestCar.draw(carCtx, "blue", true);
        playerCar.draw(playerCtx, "blue", true);

        carCtx.restore();
        playerCtx.restore();

        //setup visualizer
        networkCtx.lineDashOffset = -time / 50;
        Visualizer.drawNetwork(networkCtx, bestCar.brain);
        //request animation frame to animate the car on each frame
        animationFrameId = requestAnimationFrame(animate);
    }
}