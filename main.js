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

//define timer duration (60 seconds)
let timerDuration = 60000;
let timerId;

const DAMAGE_TIMEOUT = 10000;

let generation = 0;

let bestOverallCar = null;
let bestOverallCarFitness = null; // Add a variable to store the best overall car's original fitness
let bestOverallBrain = null; // Add a variable to store the best overall car's brain
let bestOverallFitness = [];

//add function for start and stoping of sim
let isAnimating = false;
let animationFrameId;
function startSim() {
    if (!isAnimating) {
        isAnimating = true;
        startTimer();
        animate();
    }
}

//start timer function
function startTimer() {
    if(timerId) {
        clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
        stopSim();
    }, timerDuration);
}

//create array of sim cars (N is number of agents) and function to generate cars
const N = 1000;
const simCars = generateCars(N);
let bestCar = simCars[0];
//const simCar = new Car(carCanvas.width / 2, 0, 30, 50, "AI");

function generateCars(N) {
    const cars = [];
    for (let i = 0; i < N; i++) {
        const car = new Car(carCanvas.width / 2, 0, 30, 50, "AI");
        car.passedTrafficCars = 0; // Add a counter for passed traffic cars
        car.passedTrafficSet = new Set(); // Add a set to track passed traffic cars
        cars.push(car);
    }
    return cars;
}

//declare mutation rate
let mutationRate = 0.2;
let numGenImprovement = 0;

function stopSim() {
    if (isAnimating) {
        isAnimating = false;
        cancelAnimationFrame(animationFrameId);

        // Log progress
        console.log(`Generation: ${generation}`);
        console.log(`Best Fitness: ${bestCar.fitness}`);
        console.log(`Best Overall Fitness: ${bestOverallCarFitness !== null ? bestOverallCarFitness : 'N/A'}`); // Log the saved fitness
        bestOverallFitness.push(bestOverallCarFitness);
        console.log(`Distance Traveled: ${-bestCar.y}`);
        console.log(`Passed Traffic Cars: ${bestCar.passedTrafficCars}`);

        // Calculate improvement over last generation
        if (bestOverallCarFitness !== null && bestCar.fitness > bestOverallCarFitness) {
            const improvement = bestCar.fitness - bestOverallCarFitness;
            console.log(`Improvement over last generation: ${improvement}`);
            numGenImprovement++;
        } else {
            console.log(`No improvement over last generation`);
            numGenImprovement = 0; // Reset if no improvement
        }

        console.log(`Generations since last improvement: ${numGenImprovement}`);
        if (generation != 0) {
            if (((generation % 10 == 0) || (numGenImprovement % 5 == 0)) && timerDuration < 300000) {
                timerDuration += 60000;
                console.log(`Timer Duration increased: ${timerDuration}`);
                mutationRate *= 0.75;
                console.log(`Mutation Rate decreased: ${mutationRate}`);
                numGenImprovement = 0; // Reset the improvement counter
            } else {
                console.log(`No changes to Timer Duration or Mutation Rate`);
            }
        }

        // Calculate improvement over last 5 generations
        if (generation >= 5) {
            const fiveGenerationsAgoFitness = bestOverallFitness[generation - 5];
            if (bestOverallCarFitness > fiveGenerationsAgoFitness) {
                const improvement = bestOverallCarFitness - fiveGenerationsAgoFitness;
                console.log(`Improvement over last 5 generations: ${improvement}`);
            } else {
                console.log(`No improvement over last 5 generations`);
            }
        } else {
            console.log(`Not enough generations for 5-generation comparison`);
        }

        // Initialize bestOverallCar if it's null or update if the current best car is better
        if (bestOverallCar === null || bestCar.fitness > bestOverallCarFitness) {
            bestOverallCar = bestCar;
            bestOverallCarFitness = bestCar.fitness; // Save the fitness
            bestOverallBrain = JSON.parse(JSON.stringify(bestCar.brain)); // Save the brain
        }

        // Mutate network based on best brain
        for (let i = 0; i < simCars.length; i++) {
            simCars[i].reset();
            simCars[i].passedTrafficCars = 0; // Reset the passed traffic cars counter
            simCars[i].passedTrafficSet.clear(); // Clear the set of passed traffic cars
            simCars[i].damageTime = 0; // Reset the damage time
        }

        for (let i = 0; i < simCars.length; i++) {
            simCars[i].brain = JSON.parse(JSON.stringify(bestOverallBrain)); // Clone the best overall brain
            if (i != 0) {
                NeuralNetwork.mutate(simCars[i].brain, mutationRate);
            }
        }

        // Restart sim
        bestCar = simCars[0];
        simTraffic = [];
        simTraffic.push(new Car(simRoad.getLaneCenter(1), -100, 30, 50, "DUMMY", 2));
        simTraffic.push(new Car(simRoad.getLaneCenter(0), -300, 30, 50, "DUMMY", 2));
        simTraffic.push(new Car(simRoad.getLaneCenter(2), -300, 30, 50, "DUMMY", 2));
        simTraffic.push(new Car(simRoad.getLaneCenter(1), -500, 30, 50, "DUMMY", 2));
        simTraffic.push(new Car(simRoad.getLaneCenter(2), -500, 30, 50, "DUMMY", 2));
        simTraffic.push(new Car(simRoad.getLaneCenter(0), -700, 30, 50, "DUMMY", 2));
        simTraffic.push(new Car(simRoad.getLaneCenter(1), -700, 30, 50, "DUMMY", 2));
        spawnTraffic(false);

        // Add a small delay before restarting to ensure everything is reset
        setTimeout(() => {
            startSim();
        }, 0);

        // Add to generation count
        generation++;
    }
}

//create player car
const playerCar = new Car(playerCanvas.width / 2, 0, 30, 50, "KEYS");

//spawn random traffic patterns 
let simTraffic = [];

simTraffic.push(new Car(simRoad.getLaneCenter(1), -100, 30, 50, "DUMMY", 2));
simTraffic.push(new Car(simRoad.getLaneCenter(0), -300, 30, 50, "DUMMY", 2));
simTraffic.push(new Car(simRoad.getLaneCenter(2), -300, 30, 50, "DUMMY", 2));
simTraffic.push(new Car(simRoad.getLaneCenter(1), -500, 30, 50, "DUMMY", 2));
simTraffic.push(new Car(simRoad.getLaneCenter(2), -500, 30, 50, "DUMMY", 2));
simTraffic.push(new Car(simRoad.getLaneCenter(0), -700, 30, 50, "DUMMY", 2));
simTraffic.push(new Car(simRoad.getLaneCenter(1), -700, 30, 50, "DUMMY", 2));

const playerTraffic = [];

playerTraffic.push(new Car(playerRoad.getLaneCenter(1), -100, 30, 50, "DUMMY", 2));
playerTraffic.push(new Car(playerRoad.getLaneCenter(0), -300, 30, 50, "DUMMY", 2));
playerTraffic.push(new Car(playerRoad.getLaneCenter(2), -300, 30, 50, "DUMMY", 2));
playerTraffic.push(new Car(playerRoad.getLaneCenter(1), -500, 30, 50, "DUMMY", 2));
playerTraffic.push(new Car(playerRoad.getLaneCenter(2), -500, 30, 50, "DUMMY", 2));
playerTraffic.push(new Car(playerRoad.getLaneCenter(0), -700, 30, 50, "DUMMY", 2));
playerTraffic.push(new Car(playerRoad.getLaneCenter(1), -700, 30, 50, "DUMMY", 2));

function spawnTraffic(spawnPlayerTraffic = true) {
    //possible patterns
    /*
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
    */
   //new traffic patterns for higher difficulty / better training 

   const trafficPattern = {
    0 : [1],
    1 : [0, 1],
    2 : [1, 2],
    3 : [0, 2],
    4 : [0, 1],
    5 : [1, 2],
    6 : [0, 1],
    7 : [1, 2],
    }

    let lastPattern = [];
    for (let i = 4; i < 50; i++) {
        //choose random pattern
        let pattern = trafficPattern[Math.floor(Math.random() * 8)];
        while (lastPattern == pattern) {
            pattern = trafficPattern[Math.floor(Math.random() * 8)];
        }
        lastPattern = pattern;
        //spawn cars
        for (let lane of pattern) {
            simTraffic.push(new Car(simRoad.getLaneCenter(lane), -100 - i * 200, 30, 50, "DUMMY", 2));
            if (spawnPlayerTraffic) {
                playerTraffic.push(new Car(playerRoad.getLaneCenter(lane), -100 - i * 200, 30, 50, "DUMMY", 2));
            }
        }
    }
}

function fitness(car) {
    const distanceScore = car.y * -1 * .001; 
    const passedCarsScore = car.passedTrafficCars * 10;
    const speedScore = car.speed * 0.5;
    const brakeScore = car.controls.reverse * -1;
    const score = distanceScore + passedCarsScore + speedScore + brakeScore;
    return score;
}

let lastTime = 0;

spawnTraffic();
animate();

function animate(time) {
    const deltaTime = time - lastTime;
    lastTime = time;

    if (!isAnimating) {
        //set road, network, and player canvas height to window height
        carCanvas.height = window.innerHeight;
        networkCanvas.height = window.innerHeight;
        playerCanvas.height = window.innerHeight;
        //animate player traffic
        for (let i = 0; i < playerTraffic.length; i++) {
            playerTraffic[i].update(playerRoad.borders, [], deltaTime);
        }
        //animate player car
        playerCar.update(playerRoad.borders, playerTraffic, deltaTime);

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
            simTraffic[i].update(simRoad.borders, [], deltaTime);
        }
        for (let i = 0; i < playerTraffic.length; i++) {
            playerTraffic[i].update(playerRoad.borders, [], deltaTime);
        }

        for (let i = 0; i < simCars.length; i++) {
            simCars[i].update(simRoad.borders, simTraffic, deltaTime);
        }

        // Check if sim cars have passed any traffic cars
        for (let i = 0; i < simCars.length; i++) {
            for (let j = 0; j < simTraffic.length; j++) {
                if (simCars[i].y < simTraffic[j].y && !simCars[i].passedTrafficSet.has(simTraffic[j])) {
                    simCars[i].passedTrafficCars++;
                    simCars[i].passedTrafficSet.add(simTraffic[j]);
                }
            }
        }

        // Check damage time for best car
        if (bestCar.damaged && bestCar.damageTime > DAMAGE_TIMEOUT) {
            //isAnimating = false;
            //cancelAnimationFrame(animationFrameId);
            //clearTimeout(timerId);
            stopSim();  // Call stopSim directly instead of using setTimeout
            return;
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
        playerCar.update(playerRoad.borders, playerTraffic, deltaTime);

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

// Initialize lastTime before starting the animation
lastTime = performance.now();
animate(lastTime);