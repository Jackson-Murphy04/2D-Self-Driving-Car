class NeuralNetwork {
    //constructor for the neural network take array of neuron counts intented for each layer
    constructor(neuronCounts) {
        //create levels array that stores each level and connections between them
        this.levels = [];
        //loop through neuron counts and create levels
        for (let i = 0; i < neuronCounts.length - 1; i++) {
            //create level
            this.levels.push(new Level(neuronCounts[i], neuronCounts[i + 1]));
        }
    }

    //feed forward function to pass outputs between network levels
    static feedForward(givenInputs, network) {

        // Feed the initial inputs to the first level
        let outputs = Level.feedForward(givenInputs, network.levels[0]);
        
        // Iterate through the remaining levels
        for (let i = 1; i < network.levels.length; i++) {
            // Feed the outputs of the previous level to the next level
            outputs = Level.feedForward(outputs, network.levels[i]);
        }
        
        // Return the final outputs
        return outputs;
    }

    //mutate function to introduce random variation for advantageous selection of genes
    //amount is the amount of mutation to apply 0 is no mutation 1 is full mutation
    //weights serve as the strength of the connection between neurons and are adjusted randomly
    //biases serve as the threshold for activation of a neuron and are adjusted randomly
    static mutate(network, amount = 1) {
        // Iterate over each level in the network
        network.levels.forEach(level => {
            // Mutate each bias in the current level
            for (let i = 0; i < level.biases.length; i++) {
                // Apply linear interpolation between the current bias and a random value between -1 and 1
                level.biases[i] = lerp(level.biases[i], Math.random() * 2 - 1, amount);
            }
            // Mutate each weight in the current level
            for (let i = 0; i < level.weights.length; i++) {
                for (let j = 0; j < level.weights[i].length; j++) {
                    // Apply linear interpolation between the current weight and a random value between -1 and 1
                    level.weights[i][j] = lerp(level.weights[i][j], Math.random() * 2 - 1, amount);
                }
            }
        });
    }
}

class Level {
    // Constructor initializes the level with a given number of inputs and outputs
    constructor(inputCount, outputCount) {
        // Array to store input values
        this.inputs = new Array(inputCount);
        // Array to store output values
        this.outputs = new Array(outputCount);
        // Array to store biases for each output neuron
        this.biases = new Array(outputCount);

        // 2D array to store weights between each input and output neuron
        this.weights = [];
        for (let i = 0; i < inputCount; i++) {
            this.weights[i] = new Array(outputCount);
        }

        // Randomize the weights and biases for the level
        Level.#randomize(this);
    }

    // Private method to randomize weights and biases
    static #randomize(level) {
        // Randomize weights between -1 and 1
        for (let i = 0; i < level.inputs.length; i++) {
            for (let j = 0; j < level.outputs.length; j++) {
                level.weights[i][j] = Math.random() * 2 - 1;
            }
        }

        // Randomize biases between -1 and 1
        for (let i = 0; i < level.biases.length; i++) {
            level.biases[i] = Math.random() * 2 - 1;
        }
    }

    // Method to perform feedforward operation
    static feedForward(givenInputs, level) {

        // Assign given inputs to the level's inputs
        for (let i = 0; i < level.inputs.length; i++) {
            level.inputs[i] = givenInputs[i];
        }

        // Calculate outputs based on inputs, weights, and biases
        for (let i = 0; i < level.outputs.length; i++) {
            let sum = 0;
            for (let j = 0; j < level.inputs.length; j++) {
                sum += level.inputs[j] * level.weights[j][i];
            }

            // Apply activation function (simple threshold in this case)
            if (sum > level.biases[i]) {
                level.outputs[i] = 1;
            } else {
                level.outputs[i] = 0;
            }
        }

        // Return the calculated outputs
        return level.outputs;
    }
}
