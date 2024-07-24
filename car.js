class Car {
    constructor(x, y, width, height, control, maxSpeed = 3) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;

        this.speed = 0;
        this.acceleration = 0.2;
        this.maxSpeed = maxSpeed;
        this.friction = 0.05;
        this.angle = 0;
        this.damaged = false;

        this.useBrain = control == "AI";

        //set non dummy cars to have sensors
        if(control != "DUMMY") {
            
        }

        //give car appropriate controls
        this.controls = new Controls(control);
    }

    update(roadBoarders, traffic) {
        //if not damaged, update car position and create polygon and check for damage
        if(!this.damaged) {
            this.#move();
            this.polygon = this.#createPolygon();
            this.damaged = this.#assessDamage(roadBoarders, traffic);
        }
        //sensor and brain stuff
    }

    //implement car movement
    #move() {
        //move car forward and back
        if(this.controls.forward) {
            this.speed += this.acceleration;
        }
        if(this.controls.reverse) {
            this.speed -= this.acceleration;
        }

        //apply friction
        if(this.speed > 0) {
            this.speed -= this.friction;
        }
        if(this.speed < 0) {
            this.speed += this.friction;
        }

        //prevent friction from leaving tiny movements
        if(Math.abs(this.speed) < this.friction) {
            this.speed = 0;
        }

        //limit speed
        if(this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if(this.speed < -this.maxSpeed / 2) {
            this.speed = -this.maxSpeed / 2;
        }

        //implement car turning 
        if(this.speed != 0) {
            const flip = this.speed > 0 ? 1 : -1;
            if(this.controls.left) {
                this.angle = this.angle + 0.03 * flip;
            }
            if(this.controls.right) {
                this.angle = this.angle - 0.03 * flip;
            }
        }

        //update car position
        this.x -= Math.sin(this.angle) * this.speed;
        this.y -= Math.cos(this.angle) * this.speed;
    }

    //assess damage
    #assessDamage(roadBoarders, traffic) {
        for(let i = 0; i < roadBoarders.length; i++) {
            if(polyIntersect(this.polygon, roadBoarders[i])) {
                return true;
            }
        }
        for(let i = 0; i < traffic.length; i++) {
            if(polyIntersect(this.polygon, traffic[i].polygon)) {
                return true;
            }
        }
        return false;
    }

    //create car polygon
    #createPolygon() {
        //hold all polygon points
        const points = [];
        //calculate polygon rad (or distance from center to any corner)
        const rad = Math.hypot(this.width, this.height) / 2;
        //calculate polygon angle between width and height (90)
        const alpha = Math.atan2(this.width, this.height);
        //add polygon points
        points.push({
            x: this.x - Math.sin(this.angle - alpha) * rad,
            y: this.y - Math.cos(this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(this.angle + alpha) * rad,
            y: this.y - Math.cos(this.angle + alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad
        });
        points.push({
            x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
            y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad
        });
        return points;
    }

    //draw car on canvas
    draw(ctx, color, drawSensor = false) {
        // set car color to the provided color
        ctx.fillStyle = color;

        // set car color to red if damaged
        if(this.damaged) {
            ctx.fillStyle = "red";
        }

        //draw car according to polygon function
        ctx.beginPath();
        ctx.moveTo(this.polygon[0].x, this.polygon[0].y);
        for(let i = 1; i < this.polygon.length; i++) {
            ctx.lineTo(this.polygon[i].x, this.polygon[i].y);
        }
        ctx.fill();

        //draw sensor lines
        if(drawSensor && this.sensor) {
            this.sensor.draw(ctx);
        }

        //display cars y position
        ctx.fillStyle = "black";
        ctx.font = "12px Arial";
        ctx.fillText("distance: " + Math.abs(Math.round(this.y)), this.x, this.y - 10);
    }
}